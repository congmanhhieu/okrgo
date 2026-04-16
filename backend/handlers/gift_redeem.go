package handlers

import (
	"context"
	"fmt"
	"net/http"

	"okrgo/database"
	"okrgo/dtos"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
)

// RedeemGifts process a gift redemption sequence for the user
func RedeemGifts(c *gin.Context) {
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

	var req dtos.RedeemGiftsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu giỏ hàng không hợp lệ"})
		return
	}

	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi hệ thống"})
		return
	}
	defer tx.Rollback(ctx) // Safe to call

	// 1. Check user stars balance
	var currentBalance int
	err = tx.QueryRow(ctx, "SELECT stars_balance FROM company_users WHERE user_id = $1 AND company_id = $2 FOR UPDATE", userID, companyID).Scan(&currentBalance)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể truy xuất số sao hiện tại"})
		return
	}

	var totalCost int
	for _, item := range req.Items {
		var starPrice int
		var isActive bool
		var name string
		err = tx.QueryRow(ctx, "SELECT name, star_price, is_active FROM gifts WHERE id = $1 AND company_id = $2 FOR UPDATE", item.GiftID, companyID).Scan(&name, &starPrice, &isActive)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Phát hiện món quà không tồn tại"})
			return
		}
		if !isActive {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Quà '%s' hiện đã ngừng đổi", name)})
			return
		}
		cost := starPrice * item.Quantity
		totalCost += cost

		// Insert order
		_, err = tx.Exec(ctx, `INSERT INTO gift_orders (company_id, user_id, gift_id, quantity, star_cost, status)
			VALUES ($1, $2, $3, $4, $5, 'pending')`, companyID, userID, item.GiftID, item.Quantity, cost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi cập nhật giỏ hàng"})
			return
		}
	}

	if totalCost > currentBalance {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bạn không đủ Sao để đổi những món quà này"})
		return
	}

	// Deduct balance
	_, err = tx.Exec(ctx, "UPDATE company_users SET stars_balance = stars_balance - $1 WHERE user_id = $2 AND company_id = $3", totalCost, userID, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi trừ sao tài khoản"})
		return
	}

	tx.Commit(ctx)
	c.JSON(http.StatusOK, gin.H{"message": "Đổi quà thành công"})
}

// GetMyGiftOrders returns gift orders specifically for the logged in user
func GetMyGiftOrders(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền"})
		return
	}

	query := `
		SELECT go.id, go.user_id, u.name AS user_name, go.gift_id, g.name AS gift_name,
		go.quantity, go.star_cost, go.status, go.created_at
		FROM gift_orders go
		JOIN users u ON u.id = go.user_id
		JOIN gifts g ON g.id = go.gift_id
		WHERE go.company_id = $1 AND go.user_id = $2
		ORDER BY go.created_at DESC
	`

	var list []dtos.GiftOrderResponse
	err := pgxscan.Select(ctx, database.Pool, &list, query, companyID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy xuất lịch sử", "details": err.Error()})
		return
	}
	if list == nil {
		list = []dtos.GiftOrderResponse{}
	}

	c.JSON(http.StatusOK, gin.H{"data": list})
}
