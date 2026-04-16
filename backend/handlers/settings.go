package handlers

import (
	"context"
	"log"
	"net/http"
	"okrgo/database"
	"okrgo/dtos"
	"time"

	"github.com/gin-gonic/gin"
)

// GetSettings GET /workspaces/:slug/settings
func GetSettings(c *gin.Context) {
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

	var res dtos.CompanySettingsResponse

	// UPSERT default if not found
	query := `
		INSERT INTO company_settings (company_id, checkin_overdue_days) 
		VALUES ($1, 7)
		ON CONFLICT (company_id) DO NOTHING;
	`
	_, err := database.Pool.Exec(ctx, query, companyID)
	if err != nil {
		log.Println("GetSettings upsert error:", err)
	}

	querySelect := `SELECT company_id, checkin_overdue_days, updated_at FROM company_settings WHERE company_id = $1`
	err = database.Pool.QueryRow(ctx, querySelect, companyID).Scan(&res.CompanyID, &res.CheckinOverdueDays, &res.UpdatedAt)
	if err != nil {
		log.Println("GetSettings select error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy cài đặt công ty"})
		return
	}

	c.JSON(http.StatusOK, res)
}

// UpdateSettings PUT /workspaces/:slug/settings
func UpdateSettings(c *gin.Context) {
	// For now, allow any member to update. In future, restrict to Roles.
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

	var req dtos.UpdateCompanySettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ", "details": err.Error()})
		return
	}

	query := `
		INSERT INTO company_settings (company_id, checkin_overdue_days, updated_at) 
		VALUES ($1, $2, $3)
		ON CONFLICT (company_id) DO UPDATE 
		SET checkin_overdue_days = EXCLUDED.checkin_overdue_days,
			updated_at = EXCLUDED.updated_at
	`
	_, err := database.Pool.Exec(ctx, query, companyID, req.CheckinOverdueDays, time.Now())
	if err != nil {
		log.Println("UpdateSettings error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật cài đặt"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật thành công"})
}
