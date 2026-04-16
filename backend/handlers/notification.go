package handlers

import (
	"context"
	"log"
	"net/http"
	"okrgo/database"
	"okrgo/dtos"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
)

// GetNotifications returns the recent notifications for the logged in user
func GetNotifications(c *gin.Context) {
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

	var notifications []dtos.NotificationResponse
	query := `
		SELECT id, company_id, user_id, group_key, type, data, url, is_read, created_at, updated_at
		FROM notifications
		WHERE company_id = $1 AND user_id = $2
		ORDER BY updated_at DESC
		LIMIT 50
	`
	err := pgxscan.Select(c.Request.Context(), database.Pool, &notifications, query, companyID, userID)
	if err != nil {
		log.Printf("GetNotifications error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy thông báo"})
		return
	}

	// Always return empty array instead of null
	if notifications == nil {
		notifications = []dtos.NotificationResponse{}
	}

	c.JSON(http.StatusOK, notifications)
}

// MarkNotificationRead marks a specific notification as read
func MarkNotificationRead(c *gin.Context) {
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

	id := c.Param("id")

	query := `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 AND company_id = $3`
	_, err := database.Pool.Exec(c.Request.Context(), query, id, userID, companyID)
	if err != nil {
		log.Printf("MarkNotificationRead error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật thông báo"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "success"})
}

// MarkAllNotificationsRead marks all notifications as read for the user
func MarkAllNotificationsRead(c *gin.Context) {
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

	query := `UPDATE notifications SET is_read = true WHERE user_id = $1 AND company_id = $2 AND is_read = false`
	_, err := database.Pool.Exec(c.Request.Context(), query, userID, companyID)
	if err != nil {
		log.Printf("MarkAllNotificationsRead error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật thông báo"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "success"})
}
