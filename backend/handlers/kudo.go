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

// GetKudos GET /workspaces/:slug/kudos
func GetKudos(c *gin.Context) {
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

	senderFilter := c.Query("sender_id")
	receiverFilter := c.Query("receiver_id")

	query := `
		SELECT 
			k.id, k.company_id, k.sender_id, k.receiver_id, k.content, 
			k.stars_attached, k.criteria_id, k.reference_text, k.created_at,
			s.name as sender_name, r.name as receiver_name,
			s.avatar_url as sender_avatar, r.avatar_url as receiver_avatar,
			sc.name as criteria_name, sc.category as criteria_category
		FROM kudos k
		JOIN users s ON k.sender_id = s.id
		JOIN users r ON k.receiver_id = r.id
		LEFT JOIN star_criteria sc ON k.criteria_id = sc.id
		WHERE k.company_id = $1
	`
	args := []interface{}{companyID}
	argIdx := 2

	if senderFilter != "" {
		query += fmt.Sprintf(" AND k.sender_id = $%d", argIdx)
		args = append(args, senderFilter)
		argIdx++
	}
	
	if receiverFilter != "" {
		query += fmt.Sprintf(" AND k.receiver_id = $%d", argIdx)
		args = append(args, receiverFilter)
		argIdx++
	}

	query += " ORDER BY k.created_at DESC LIMIT 100"

	var list []dtos.KudoResponse
	err := pgxscan.Select(ctx, database.Pool, &list, query, args...)
	if err != nil {
		log.Println("GetKudos error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy vấn dữ liệu", "details": err.Error()})
		return
	}

	if list == nil {
		list = []dtos.KudoResponse{}
	}

	c.JSON(http.StatusOK, gin.H{"data": list})
}

// GetKudosLeaderboard GET /workspaces/:slug/kudos/leaderboard
func GetKudosLeaderboard(c *gin.Context) {
	// Board of current month by default.
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

	query := `
		SELECT 
			u.id as user_id, 
			u.name as user_name,
			u.avatar_url as user_avatar,
			COUNT(k.id) as total_kudos, 
			SUM(COALESCE(k.stars_attached, 0)) as total_stars
		FROM kudos k
		JOIN users u ON k.receiver_id = u.id
		WHERE k.company_id = $1 
		  AND date_trunc('month', k.created_at) = date_trunc('month', CURRENT_DATE)
		GROUP BY u.id, u.name, u.avatar_url
		ORDER BY total_kudos DESC, total_stars DESC
		LIMIT 10
	`
	var board []dtos.KudoLeaderboardResponse
	err := pgxscan.Select(ctx, database.Pool, &board, query, companyID)
	if err != nil {
		log.Println("GetKudosLeaderboard error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy vấn dữ liệu xếp hạng"})
		return
	}

	if board == nil {
		board = []dtos.KudoLeaderboardResponse{}
	}

	c.JSON(http.StatusOK, gin.H{"data": board})
}

// CreateKudo POST /workspaces/:slug/kudos
func CreateKudo(c *gin.Context) {
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

	var req dtos.CreateKudoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	if senderID == req.ReceiverID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bạn không thể gửi kudo cho chính mình"})
		return
	}

	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi server"})
		return
	}

	var starsAttached int = 0
	if req.CriteriaID != nil {
		err = tx.QueryRow(ctx, "SELECT stars FROM star_criteria WHERE id = $1 AND company_id = $2", *req.CriteriaID, companyID).Scan(&starsAttached)
		if err != nil {
			tx.Rollback(ctx)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tiêu chí không hợp lệ"})
			return
		}
	}

	var newID int
	query := `
		INSERT INTO kudos (
			company_id, sender_id, receiver_id, content,
			stars_attached, criteria_id, reference_text
		) VALUES ($1, $2, $3, $4, $5, $6, $7) 
		RETURNING id
	`
	err = tx.QueryRow(ctx, query,
		companyID, senderID, req.ReceiverID, req.Content,
		starsAttached, req.CriteriaID, req.ReferenceText,
	).Scan(&newID)

	if err != nil {
		tx.Rollback(ctx)
		log.Println("CreateKudo insert error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể gửi Kudo"})
		return
	}

	// Tự động cộng sao nếu có starsAttached
	if starsAttached > 0 {
		_, err = tx.Exec(ctx, `
			UPDATE company_users 
			SET stars_balance = stars_balance + $1 
			WHERE user_id = $2 AND company_id = $3
		`, starsAttached, req.ReceiverID, companyID)

		if err != nil {
			tx.Rollback(ctx)
			log.Println("CreateKudo update stars error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật sao"})
			return
		}
	}

	tx.Commit(ctx)

	// --- Push Notification ---
	// Background go routine for notification
	go func() {
		bgCtx := context.Background()
		senderSubject, _ := services.GetNotificationSubject(bgCtx, senderID)
		groupKey := fmt.Sprintf("kudo:%d:%d", newID, req.ReceiverID)
		
		var categoryName string
		if req.CriteriaID != nil {
			// Resolve criteria name roughly, since we only need simple notification
			bgCtx := context.Background()
			_ = database.Pool.QueryRow(bgCtx, "SELECT name FROM star_criteria WHERE id=$1", *req.CriteriaID).Scan(&categoryName)
		} else {
			categoryName = "Sự xuất sắc"
		}

		notificationData := dtos.NotificationData{
			SubjectCount: 1,
			Subjects:     []dtos.NotificationSubject{senderSubject},
			PrObject: &dtos.NotificationObject{
				Name: categoryName,
				Type: "kudo_criteria",
			},
		}

		err := services.PushNotification(bgCtx, companyID, req.ReceiverID, groupKey, "receive_kudo", "/kudos", notificationData)
		if err != nil {
			log.Println("PushNotification error in CreateKudo:", err)
		}
	}()

	c.JSON(http.StatusCreated, gin.H{
		"message": "Đã gửi Kudo vinh danh",
		"id":      newID,
	})
}
