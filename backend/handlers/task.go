package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"okrgo/database"
	"okrgo/dtos"
	"strconv"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
	"okrgo/services"
)

func GetTasks(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	search := c.Query("search")
	assigneeFilter := c.Query("assignee_id")
	statusFilter := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	query := `
		SELECT t.id, t.company_id, t.title, COALESCE(t.description, '') as description,
		       t.assignee_id, COALESCE(ua.name, '') as assignee_name,
		       t.creator_id, uc.name as creator_name,
		       t.priority, t.status, t.progress,
		       t.linked_objective_id, COALESCE(o.name, '') as objective_name,
		       t.linked_kr_id, COALESCE(kr.name, '') as kr_name,
		       t.deadline, t.created_at
		FROM tasks t
		LEFT JOIN users ua ON ua.id = t.assignee_id
		JOIN users uc ON uc.id = t.creator_id
		LEFT JOIN objectives o ON o.id = t.linked_objective_id
		LEFT JOIN key_results kr ON kr.id = t.linked_kr_id
		WHERE t.company_id = $1
	`
	args := []interface{}{companyID}
	argID := 2

	if search != "" {
		query += fmt.Sprintf(` AND t.title ILIKE $%d`, argID)
		args = append(args, "%"+search+"%")
		argID++
	}
	if assigneeFilter != "" {
		query += fmt.Sprintf(` AND t.assignee_id = $%d`, argID)
		args = append(args, assigneeFilter)
		argID++
	}
	if statusFilter != "" && statusFilter != "all" {
		query += fmt.Sprintf(` AND t.status = $%d`, argID)
		args = append(args, statusFilter)
		argID++
	}

	query += fmt.Sprintf(` ORDER BY t.created_at DESC LIMIT $%d OFFSET $%d`, argID, argID+1)
	args = append(args, limit, offset)

	var list []dtos.TaskResponse
	err := pgxscan.Select(ctx, database.Pool, &list, query, args...)
	if err != nil {
		log.Println("GetTasks error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy xuất", "details": err.Error()})
		return
	}

	if list == nil {
		list = []dtos.TaskResponse{}
	}

	// Fetch watchers for all tasks
	taskIDs := make([]int, len(list))
	taskMap := make(map[int]*dtos.TaskResponse)
	for i := range list {
		list[i].Watchers = []dtos.TaskWatcher{}
		taskIDs[i] = list[i].ID
		taskMap[list[i].ID] = &list[i]
	}

	if len(taskIDs) > 0 {
		var watchers []struct {
			TaskID int    `db:"task_id"`
			UserID int    `db:"user_id"`
			Name   string `db:"name"`
		}
		wQuery := `SELECT tw.task_id, tw.user_id, u.name FROM task_watchers tw JOIN users u ON u.id = tw.user_id WHERE tw.task_id = ANY($1)`
		_ = pgxscan.Select(ctx, database.Pool, &watchers, wQuery, taskIDs)
		for _, w := range watchers {
			if t, ok := taskMap[w.TaskID]; ok {
				t.Watchers = append(t.Watchers, dtos.TaskWatcher{UserID: w.UserID, Name: w.Name})
			}
		}
	}

	// Count total
	countArgs := []interface{}{companyID}
	countQuery := `SELECT COUNT(*) FROM tasks WHERE company_id = $1`
	var total int
	_ = database.Pool.QueryRow(ctx, countQuery, countArgs...).Scan(&total)

	c.JSON(http.StatusOK, gin.H{"data": list, "total": total, "page": page, "limit": limit})
}

func CreateTask(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	var req dtos.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	if req.Priority == "" {
		req.Priority = "not_urgent_important"
	}

	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi server"})
		return
	}

	var taskID int
	var deadline interface{} = nil
	if req.Deadline != "" {
		deadline = req.Deadline
	}

	err = tx.QueryRow(ctx, `
		INSERT INTO tasks (company_id, title, description, assignee_id, creator_id, priority, linked_objective_id, linked_kr_id, deadline)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
	`, companyID, req.Title, req.Description, req.AssigneeID, userID, req.Priority, req.LinkedObjectiveID, req.LinkedKRID, deadline).Scan(&taskID)

	if err != nil {
		tx.Rollback(ctx)
		log.Println("CreateTask error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo task"})
		return
	}

	// Insert watchers
	for _, wID := range req.WatcherIDs {
		_, _ = tx.Exec(ctx, `INSERT INTO task_watchers (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, taskID, wID)
	}

	tx.Commit(ctx)

	// --- Push Notification ---
	if req.AssigneeID != nil && *req.AssigneeID != userID {
		go func() {
			bgCtx := context.Background()
			senderSubject, _ := services.GetNotificationSubject(bgCtx, userID)
			groupKey := fmt.Sprintf("task:%d:%d", taskID, *req.AssigneeID)

			notificationData := dtos.NotificationData{
				SubjectCount: 1,
				Subjects:     []dtos.NotificationSubject{senderSubject},
				DiObject: &dtos.NotificationObject{
					Name: req.Title,
					Type: "task",
				},
			}

			_ = services.PushNotification(bgCtx, companyID, *req.AssigneeID, groupKey, "assign_task", "/tasks", notificationData)
		}()
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Đã tạo task", "id": taskID})
}

func UpdateTask(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	id := c.Param("id")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	var req dtos.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi server"})
		return
	}

	var deadline interface{} = nil
	if req.Deadline != "" {
		deadline = req.Deadline
	}

	_, err = tx.Exec(ctx, `
		UPDATE tasks SET title=$1, description=$2, assignee_id=$3, priority=$4, linked_objective_id=$5, linked_kr_id=$6, deadline=$7
		WHERE id=$8 AND company_id=$9
	`, req.Title, req.Description, req.AssigneeID, req.Priority, req.LinkedObjectiveID, req.LinkedKRID, deadline, id, companyID)

	if err != nil {
		tx.Rollback(ctx)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật thất bại"})
		return
	}

	// Update watchers: delete all, re-insert
	_, _ = tx.Exec(ctx, `DELETE FROM task_watchers WHERE task_id = $1`, id)
	for _, wID := range req.WatcherIDs {
		_, _ = tx.Exec(ctx, `INSERT INTO task_watchers (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, id, wID)
	}

	tx.Commit(ctx)
	c.JSON(http.StatusOK, gin.H{"message": "Đã cập nhật"})
}

func UpdateTaskStatus(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	id := c.Param("id")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	var req dtos.UpdateTaskStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	if req.Status == "done" {
		progress := 100
		req.Progress = &progress
	}

	if req.Progress != nil {
		_, err := database.Pool.Exec(ctx, `UPDATE tasks SET status=$1, progress=$2 WHERE id=$3 AND company_id=$4`, req.Status, *req.Progress, id, companyID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật"})
			return
		}
	} else {
		_, err := database.Pool.Exec(ctx, `UPDATE tasks SET status=$1 WHERE id=$2 AND company_id=$3`, req.Status, id, companyID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật"})
			return
		}
	}

	var creatorID int
	var title string
	err := database.Pool.QueryRow(ctx, "SELECT creator_id, title FROM tasks WHERE id = $1", id).Scan(&creatorID, &title)
	if err == nil && creatorID != userID && req.Status == "done" {
		go func() {
			bgCtx := context.Background()
			senderSubject, _ := services.GetNotificationSubject(bgCtx, userID)
			groupKey := fmt.Sprintf("task_done:%s", id)

			notificationData := dtos.NotificationData{
				SubjectCount: 1,
				Subjects:     []dtos.NotificationSubject{senderSubject},
				DiObject: &dtos.NotificationObject{
					Name: title,
					Type: "task",
				},
			}

			_ = services.PushNotification(bgCtx, companyID, creatorID, groupKey, "finish_task", "/tasks", notificationData)
		}()
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã cập nhật trạng thái"})
}

func DeleteTask(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	id := c.Param("id")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	_, err := database.Pool.Exec(ctx, `DELETE FROM tasks WHERE id=$1 AND company_id=$2`, id, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xóa thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa task"})
}
