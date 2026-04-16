package handlers

import (
	"context"
	"net/http"
	"strings"

	"okrgo/database"
	"okrgo/dtos"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
)

// validateCategories checks a comma-separated category string
func validateCategories(category string) bool {
	if category == "" {
		return false
	}
	parts := strings.Split(category, ",")
	for _, p := range parts {
		if !validCategories[strings.TrimSpace(p)] {
			return false
		}
	}
	return true
}

var validCategories = map[string]bool{
	"culture":   true,
	"objective": true,
	"project":   true,
	"task":      true,
}

// GetStarCriteria returns all star criteria for a company
func GetStarCriteria(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Bạn chưa tham gia công ty này"})
		return
	}

	query := `
		SELECT id, name, category, stars, created_at
		FROM star_criteria
		WHERE company_id = $1
		ORDER BY created_at ASC
	`

	var list []dtos.StarCriteriaResponse
	err := pgxscan.Select(ctx, database.Pool, &list, query, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy xuất dữ liệu", "details": err.Error()})
		return
	}

	if list == nil {
		list = []dtos.StarCriteriaResponse{}
	}

	c.JSON(http.StatusOK, gin.H{"data": list})
}

// CreateStarCriteria creates a new star criteria
func CreateStarCriteria(c *gin.Context) {
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

	var req dtos.CreateStarCriteriaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	if !validateCategories(req.Category) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Loại tiêu chí không hợp lệ"})
		return
	}

	if req.Stars < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Số sao phải lớn hơn 0"})
		return
	}

	query := `INSERT INTO star_criteria (company_id, name, category, stars) VALUES ($1, $2, $3, $4) RETURNING id`
	var newID int
	err := database.Pool.QueryRow(ctx, query, companyID, req.Name, req.Category, req.Stars).Scan(&newID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Tạo tiêu chí thất bại", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Đã tạo tiêu chí", "id": newID})
}

// UpdateStarCriteria updates an existing star criteria
func UpdateStarCriteria(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	criteriaID := c.Param("id")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền thực hiện"})
		return
	}

	var req dtos.UpdateStarCriteriaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	if !validateCategories(req.Category) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Loại tiêu chí không hợp lệ"})
		return
	}

	if req.Stars < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Số sao phải lớn hơn 0"})
		return
	}

	query := `UPDATE star_criteria SET name = $1, category = $2, stars = $3 WHERE id = $4 AND company_id = $5`
	_, err := database.Pool.Exec(ctx, query, req.Name, req.Category, req.Stars, criteriaID, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật thành công"})
}

// DeleteStarCriteria deletes a star criteria
func DeleteStarCriteria(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	criteriaID := c.Param("id")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền thực hiện"})
		return
	}

	query := `DELETE FROM star_criteria WHERE id = $1 AND company_id = $2`
	_, err := database.Pool.Exec(ctx, query, criteriaID, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xóa thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa tiêu chí"})
}
