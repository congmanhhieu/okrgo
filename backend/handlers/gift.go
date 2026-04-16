package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"okrgo/database"
	"okrgo/dtos"

	"okrgo/services"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
)

// ==================== GIFT CRUD ====================

// GetGifts returns all gifts for a company with optional search
func GetGifts(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	search := c.Query("search")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền"})
		return
	}

	var role string
	_ = database.Pool.QueryRow(ctx, "SELECT role FROM company_users WHERE company_id = $1 AND user_id = $2", companyID, userID).Scan(&role)
	isManager := (role == "owner" || role == "admin" || role == "manager")

	query := `
		SELECT id, name, description, image_url, star_price, category, is_active, created_at
		FROM gifts
		WHERE company_id = $1
	`
	args := []interface{}{companyID}
	argIdx := 2

	// Only managers can see inactive gifts
	if !isManager {
		query += ` AND is_active = true`
	}

	if search != "" {
		query += fmt.Sprintf(` AND name ILIKE $%d`, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	query += ` ORDER BY created_at DESC`

	var list []dtos.GiftResponse
	err := pgxscan.Select(ctx, database.Pool, &list, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy xuất", "details": err.Error()})
		return
	}
	if list == nil {
		list = []dtos.GiftResponse{}
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// CreateGift creates a new gift
func CreateGift(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền"})
		return
	}

	var req dtos.CreateGiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	if req.StarPrice < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Giá sao phải lớn hơn 0"})
		return
	}

	query := `INSERT INTO gifts (company_id, name, description, image_url, star_price, category)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	var newID int
	err := database.Pool.QueryRow(ctx, query, companyID, req.Name, req.Description, req.ImageURL, req.StarPrice, req.Category).Scan(&newID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Tạo quà thất bại", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Đã tạo quà tặng", "id": newID})
}

// UpdateGift updates an existing gift
func UpdateGift(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	giftID := c.Param("id")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền"})
		return
	}

	var req dtos.UpdateGiftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	query := `UPDATE gifts SET name=$1, description=$2, image_url=$3, star_price=$4, category=$5
		WHERE id=$6 AND company_id=$7`
	_, err := database.Pool.Exec(ctx, query, req.Name, req.Description, req.ImageURL, req.StarPrice, req.Category, giftID, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật thất bại"})
		return
	}

	// Update is_active if provided
	if req.IsActive != nil {
		_, _ = database.Pool.Exec(ctx, `UPDATE gifts SET is_active=$1 WHERE id=$2 AND company_id=$3`, *req.IsActive, giftID, companyID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật thành công"})
}

// DeleteGift deletes a gift
func DeleteGift(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	giftID := c.Param("id")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền"})
		return
	}

	_, err := database.Pool.Exec(ctx, `DELETE FROM gifts WHERE id=$1 AND company_id=$2`, giftID, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xóa thất bại"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa quà tặng"})
}

// ==================== GIFT ORDERS ====================

// GetGiftOrders returns gift orders with filters
func GetGiftOrders(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	status := c.Query("status")
	offset := (page - 1) * limit

	baseWhere := `WHERE go.company_id = $1`
	args := []interface{}{companyID}
	argIdx := 2

	if search != "" {
		baseWhere += fmt.Sprintf(` AND (u.name ILIKE $%d OR g.name ILIKE $%d)`, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if status != "" && status != "all" {
		baseWhere += fmt.Sprintf(` AND go.status = $%d`, argIdx)
		args = append(args, status)
		argIdx++
	}

	// Count
	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM gift_orders go
		JOIN users u ON u.id = go.user_id
		JOIN gifts g ON g.id = go.gift_id
		%s`, baseWhere)
	var total int
	database.Pool.QueryRow(ctx, countQuery, args...).Scan(&total)

	// Data
	dataQuery := fmt.Sprintf(`SELECT go.id, go.user_id, u.name AS user_name, go.gift_id, g.name AS gift_name,
		go.quantity, go.star_cost, go.status, go.created_at
		FROM gift_orders go
		JOIN users u ON u.id = go.user_id
		JOIN gifts g ON g.id = go.gift_id
		%s
		ORDER BY go.created_at DESC
		LIMIT $%d OFFSET $%d`, baseWhere, argIdx, argIdx+1)
	args = append(args, limit, offset)

	var list []dtos.GiftOrderResponse
	err := pgxscan.Select(ctx, database.Pool, &list, dataQuery, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy xuất", "details": err.Error()})
		return
	}
	if list == nil {
		list = []dtos.GiftOrderResponse{}
	}

	c.JSON(http.StatusOK, gin.H{"data": list, "total": total})
}

// UpdateGiftOrderStatus updates an order's status
func UpdateGiftOrderStatus(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	orderID := c.Param("id")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền"})
		return
	}

	var req dtos.UpdateGiftOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	validStatuses := map[string]bool{"pending": true, "approved": true, "rejected": true, "delivered": true}
	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Trạng thái không hợp lệ"})
		return
	}

	var orderOwnerID int
	var giftName string
	err := database.Pool.QueryRow(ctx, "SELECT go.user_id, g.name FROM gift_orders go JOIN gifts g ON go.gift_id = g.id WHERE go.id = $1", orderID).Scan(&orderOwnerID, &giftName)
	if err == nil {
		_, err = database.Pool.Exec(ctx, `UPDATE gift_orders SET status=$1 WHERE id=$2 AND company_id=$3`, req.Status, orderID, companyID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật thất bại"})
			return
		}

		// Push notification
		go func() {
			bgCtx := context.Background()
			sysSubject := dtos.NotificationSubject{
				ID:   0,
				Name: "Hệ thống",
			}
			groupKey := fmt.Sprintf("gift_order:%s", orderID)

			var action string
			if req.Status == "approved" {
				action = "chấp nhận đổi quà"
			} else if req.Status == "rejected" {
				action = "từ chối đổi quà"
			} else if req.Status == "delivered" {
				action = "giao quà tặng"
			} else {
				return // Don't notify for pending
			}

			notificationData := dtos.NotificationData{
				SubjectCount: 1,
				Subjects:     []dtos.NotificationSubject{sysSubject},
				DiObject: &dtos.NotificationObject{
					Name: action + " " + giftName,
					Type: "gift_order",
				},
			}

			_ = services.PushNotification(bgCtx, companyID, orderOwnerID, groupKey, "system_message", "/gifts/my-orders", notificationData)
		}()
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không tìm thấy đơn hoặc cập nhật thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật trạng thái thành công"})
}
