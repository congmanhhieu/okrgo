package handlers

import (
	"context"
	"log"
	"net/http"
	"okrgo/database"
	"okrgo/dtos"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
)

func GetTodayList(c *gin.Context) {
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

	dateParam := c.Query("date") // "2026-04-15" or empty for today + overdue
	showOverdue := c.Query("overdue")  // "true" to include past incomplete items

	query := `
		SELECT tl.id, tl.company_id, tl.user_id, tl.title, 
		       COALESCE(tl.description, '') as description,
		       COALESCE(tl.start_time, '') as start_time,
		       COALESCE(tl.end_time, '') as end_time,
		       tl.priority, tl.is_completed,
		       tl.linked_objective_id,
		       COALESCE(o.name, '') as objective_name,
		       tl.related_user_id,
		       COALESCE(ru.name, '') as related_user_name,
		       tl.task_date, tl.order_index, tl.created_at
		FROM today_lists tl
		LEFT JOIN objectives o ON o.id = tl.linked_objective_id
		LEFT JOIN users ru ON ru.id = tl.related_user_id
		WHERE tl.company_id = $1 AND tl.user_id = $2
	`
	args := []interface{}{companyID, userID}

	if dateParam != "" {
		query += ` AND tl.task_date = $3`
		args = append(args, dateParam)
	} else if showOverdue == "true" {
		// Today + all past incomplete
		query += ` AND (tl.task_date = CURRENT_DATE OR (tl.task_date < CURRENT_DATE AND tl.is_completed = false))`
	} else {
		query += ` AND tl.task_date = CURRENT_DATE`
	}

	query += ` ORDER BY tl.is_completed ASC, tl.order_index ASC, tl.created_at DESC`

	var list []dtos.TodayListResponse
	err := pgxscan.Select(ctx, database.Pool, &list, query, args...)
	if err != nil {
		log.Println("GetTodayList error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy xuất dữ liệu"})
		return
	}

	if list == nil {
		list = []dtos.TodayListResponse{}
	}

	c.JSON(http.StatusOK, gin.H{"data": list})
}

func CreateTodayList(c *gin.Context) {
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

	var req dtos.CreateTodayListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	if req.Priority == "" {
		req.Priority = "less_important"
	}

	taskDate := time.Now().Format("2006-01-02")
	if req.TaskDate != nil && *req.TaskDate != "" {
		taskDate = *req.TaskDate
	}

	var id int
	err := database.Pool.QueryRow(ctx, `
		INSERT INTO today_lists (company_id, user_id, title, description, start_time, end_time, priority, linked_objective_id, related_user_id, task_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
	`, companyID, userID, req.Title, req.Description, req.StartTime, req.EndTime, req.Priority, req.LinkedObjectiveID, req.RelatedUserID, taskDate).Scan(&id)

	if err != nil {
		log.Println("CreateTodayList error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo công việc"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Đã tạo", "id": id})
}

func UpdateTodayList(c *gin.Context) {
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

	var req dtos.UpdateTodayListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	_, err := database.Pool.Exec(ctx, `
		UPDATE today_lists 
		SET title = $1, description = $2, start_time = $3, end_time = $4, priority = $5, 
		    linked_objective_id = $6, related_user_id = $7
		WHERE id = $8 AND company_id = $9 AND user_id = $10
	`, req.Title, req.Description, req.StartTime, req.EndTime, req.Priority,
		req.LinkedObjectiveID, req.RelatedUserID, id, companyID, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã cập nhật"})
}

func ToggleTodayList(c *gin.Context) {
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

	_, err := database.Pool.Exec(ctx, `
		UPDATE today_lists SET is_completed = NOT is_completed
		WHERE id = $1 AND company_id = $2 AND user_id = $3
	`, id, companyID, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã chuyển trạng thái"})
}

func DeleteTodayList(c *gin.Context) {
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

	_, err := database.Pool.Exec(ctx, `
		DELETE FROM today_lists WHERE id = $1 AND company_id = $2 AND user_id = $3
	`, id, companyID, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xóa thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa"})
}
