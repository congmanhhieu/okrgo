package handlers

import (
	"context"
	"net/http"
	"time"

	"okrgo/database"
	"okrgo/dtos"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
)

// GetCycles returns all cycles for a company ordered by start_date DESC
func GetCycles(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Bạn không có quyền xem trang này"})
		return
	}

	query := `
		SELECT id, name, start_date, end_date, is_active, created_at
		FROM cycles
		WHERE company_id = $1
		ORDER BY start_date DESC
	`

	var list []dtos.CycleResponse
	err := pgxscan.Select(ctx, database.Pool, &list, query, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy xuất dữ liệu", "details": err.Error()})
		return
	}

	if list == nil {
		list = []dtos.CycleResponse{}
	}

	c.JSON(http.StatusOK, gin.H{"data": list})
}

// CreateCycle creates a new OKR cycle
func CreateCycle(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền thực hiện"})
		return
	}

	var req dtos.CreateCycleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ngày bắt đầu không hợp lệ (YYYY-MM-DD)"})
		return
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ngày kết thúc không hợp lệ (YYYY-MM-DD)"})
		return
	}

	if !endDate.After(startDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ngày kết thúc phải sau ngày bắt đầu"})
		return
	}

	query := `INSERT INTO cycles (company_id, name, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING id`
	var newID int
	err = database.Pool.QueryRow(ctx, query, companyID, req.Name, startDate, endDate).Scan(&newID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Tạo chu kỳ thất bại", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Đã tạo chu kỳ", "id": newID})
}

// UpdateCycle updates an existing cycle
func UpdateCycle(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	cycleID := c.Param("id")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền thực hiện"})
		return
	}

	var req dtos.UpdateCycleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ngày bắt đầu không hợp lệ"})
		return
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ngày kết thúc không hợp lệ"})
		return
	}

	if !endDate.After(startDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ngày kết thúc phải sau ngày bắt đầu"})
		return
	}

	query := `UPDATE cycles SET name = $1, start_date = $2, end_date = $3 WHERE id = $4 AND company_id = $5`
	_, err = database.Pool.Exec(ctx, query, req.Name, startDate, endDate, cycleID, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật chu kỳ thành công"})
}

// DeleteCycle deletes a cycle
func DeleteCycle(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	cycleID := c.Param("id")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền thực hiện"})
		return
	}

	query := `DELETE FROM cycles WHERE id = $1 AND company_id = $2`
	_, err := database.Pool.Exec(ctx, query, cycleID, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xóa thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa chu kỳ"})
}
