package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"okrgo/database"
	"okrgo/dtos"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
	"okrgo/services"
)

// GetFeedbacks GET /workspaces/:slug/feedbacks?type=received|sent
func GetFeedbacks(c *gin.Context) {
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

	fbType := c.Query("type")
	if fbType == "" {
		fbType = "received"
	}

	query := `
		SELECT 
			f.id, f.company_id, f.sender_id, f.receiver_id, f.content, f.advice, 
			f.linked_objective_id, f.linked_kr_id, f.linked_task_id, f.created_at,
			s.name as sender_name, r.name as receiver_name,
			o.name as objective_name, k.name as kr_name, t.title as task_title
		FROM feedbacks f
		JOIN users s ON f.sender_id = s.id
		JOIN users r ON f.receiver_id = r.id
		LEFT JOIN objectives o ON f.linked_objective_id = o.id
		LEFT JOIN key_results k ON f.linked_kr_id = k.id
		LEFT JOIN tasks t ON f.linked_task_id = t.id
		WHERE f.company_id = $1
	`
	args := []interface{}{companyID}
	argIdx := 2

	if fbType == "sent" {
		query += fmt.Sprintf(" AND f.sender_id = $%d ORDER BY f.created_at DESC", argIdx)
		args = append(args, userID)
	} else if fbType == "received" {
		query += fmt.Sprintf(" AND f.receiver_id = $%d ORDER BY f.created_at DESC", argIdx)
		args = append(args, userID)
	} else {
		query += fmt.Sprintf(" AND (f.sender_id = $%d OR f.receiver_id = $%d) ORDER BY f.created_at DESC", argIdx, argIdx)
		args = append(args, userID)
	}

	var list []dtos.FeedbackResponse
	err := pgxscan.Select(ctx, database.Pool, &list, query, args...)
	if err != nil {
		log.Println("GetFeedbacks error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy vấn dữ liệu", "details": err.Error()})
		return
	}

	if list == nil {
		list = []dtos.FeedbackResponse{}
	}

	c.JSON(http.StatusOK, gin.H{"data": list})
}

// CreateFeedback POST /workspaces/:slug/feedbacks
func CreateFeedback(c *gin.Context) {
	senderID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, senderID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	var req dtos.CreateFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	if senderID == req.ReceiverID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bạn không thể gửi phản hồi cho chính mình"})
		return
	}

	query := `
		INSERT INTO feedbacks (
			company_id, sender_id, receiver_id, content, advice, 
			linked_objective_id, linked_kr_id, linked_task_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
		RETURNING id
	`
	var newID int

	err := database.Pool.QueryRow(ctx, query,
		companyID, senderID, req.ReceiverID, req.Content, req.Advice,
		req.LinkedObjectiveID, req.LinkedKRID, req.LinkedTaskID,
	).Scan(&newID)

	if err != nil {
		log.Println("CreateFeedback error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu phản hồi"})
		return
	}

	// --- Push Notification ---
	go func() {
		bgCtx := context.Background()
		senderSubject, _ := services.GetNotificationSubject(bgCtx, senderID)
		groupKey := fmt.Sprintf("feedback:%d:%d", newID, req.ReceiverID)

		// Decide the reference object name
		objName := "hiệu suất làm việc"
		if req.LinkedTaskID != nil {
			var taskName string
			_ = database.Pool.QueryRow(bgCtx, "SELECT title FROM tasks WHERE id=$1", *req.LinkedTaskID).Scan(&taskName)
			if taskName != "" {
				objName = "công việc " + taskName
			}
		} else if req.LinkedKRID != nil {
			var krName string
			_ = database.Pool.QueryRow(bgCtx, "SELECT name FROM key_results WHERE id=$1", *req.LinkedKRID).Scan(&krName)
			if krName != "" {
				objName = "kết quả then chốt " + krName
			}
		} else if req.LinkedObjectiveID != nil {
			var objNameDB string
			_ = database.Pool.QueryRow(bgCtx, "SELECT name FROM objectives WHERE id=$1", *req.LinkedObjectiveID).Scan(&objNameDB)
			if objNameDB != "" {
				objName = "mục tiêu " + objNameDB
			}
		}

		notificationData := dtos.NotificationData{
			SubjectCount: 1,
			Subjects:     []dtos.NotificationSubject{senderSubject},
			DiObject: &dtos.NotificationObject{
				Name: objName,
				Type: "feedback",
			},
		}

		_ = services.PushNotification(bgCtx, companyID, req.ReceiverID, groupKey, "receive_feedback", "/feedbacks?type=received", notificationData)
	}()

	c.JSON(http.StatusCreated, gin.H{
		"message": "Đã gửi phản hồi",
		"id":      newID,
	})
}
