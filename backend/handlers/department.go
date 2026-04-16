package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"okrgo/database"
	"okrgo/dtos"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
)

// getUserIDInt safely extracts user_id from gin context (stored as string by middleware)
func getUserIDInt(c *gin.Context) (int, bool) {
	val, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	switch v := val.(type) {
	case string:
		id, err := strconv.Atoi(v)
		return id, err == nil
	case int:
		return v, true
	case float64:
		return int(v), true
	default:
		return 0, false
	}
}

// Helper to check if current user is admin/manager in the company
func checkHasManagerRole(ctx context.Context, userID int, companySlug string) (int, bool) {
	var config struct {
		CompanyID int    `db:"company_id"`
		Role      string `db:"role"`
	}
	query := `
		SELECT cu.company_id, cu.role 
		FROM company_users cu
		JOIN companies c ON c.id = cu.company_id
		WHERE cu.user_id = $1 AND c.slug = $2
	`
	err := pgxscan.Get(ctx, database.Pool, &config, query, userID, companySlug)
	if err != nil {
		return 0, false
	}
	return config.CompanyID, config.Role == "admin" || config.Role == "manager"
}

func GetDepartments(c *gin.Context) {
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

	search := c.Query("search")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var args []interface{}
	args = append(args, companyID)

	whereClauses := "WHERE d.company_id = $1"
	argID := 2

	if search != "" {
		whereClauses += fmt.Sprintf(" AND d.name ILIKE $%d", argID)
		args = append(args, "%"+search+"%")
		argID++
	}

	if status == "active" {
		whereClauses += fmt.Sprintf(" AND d.is_active = $%d", argID)
		args = append(args, true)
		argID++
	} else if status == "inactive" {
		whereClauses += fmt.Sprintf(" AND d.is_active = $%d", argID)
		args = append(args, false)
		argID++
	}

	query := fmt.Sprintf(`
		SELECT 
			d.id, d.name, d.is_active, d.manager_id, d.created_at,
			u.name as manager_name,
			COUNT(cu.id) as employee_count
		FROM departments d
		LEFT JOIN users u ON u.id = d.manager_id
		LEFT JOIN company_users cu ON cu.department_id = d.id
		%s
		GROUP BY d.id, u.name
		ORDER BY d.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClauses, argID, argID+1)
	
	args = append(args, limit, offset)

	var list []dtos.DepartmentResponse
	err := pgxscan.Select(ctx, database.Pool, &list, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy xuất dữ liệu", "details": err.Error()})
		return
	}

	// count total
	countQuery := fmt.Sprintf(`SELECT COUNT(d.id) FROM departments d %s`, whereClauses)
	var total int
	err = database.Pool.QueryRow(ctx, countQuery, args[:argID-1]...).Scan(&total)
	if err != nil {
		total = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  list,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func CreateDepartment(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	var req dtos.CreateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	query := `INSERT INTO departments (company_id, name, is_active, manager_id) VALUES ($1, $2, $3, $4) RETURNING id`
	var newID int
	err := database.Pool.QueryRow(ctx, query, companyID, req.Name, req.IsActive, req.ManagerID).Scan(&newID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Tạo phòng ban thất bại"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Đã tạo", "id": newID})
}

func UpdateDepartment(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	depID := c.Param("id")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	var req dtos.UpdateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	query := `UPDATE departments SET name = $1, is_active = $2, manager_id = $3 WHERE id = $4 AND company_id = $5`
	_, err := database.Pool.Exec(ctx, query, req.Name, req.IsActive, req.ManagerID, depID, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật thành công"})
}

func DeleteDepartment(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	depID := c.Param("id")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	query := `DELETE FROM departments WHERE id = $1 AND company_id = $2`
	_, err := database.Pool.Exec(ctx, query, depID, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xóa thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa phòng ban"})
}

// SearchUsers fetch users in the company for Select-box
func SearchUsers(c *gin.Context) {
	companySlug := c.Param("slug")
	search := c.Query("q")

	ctx := context.Background()
	
	// Get company ID
	var companyID int
	err := database.Pool.QueryRow(ctx, "SELECT id FROM companies WHERE slug = $1", companySlug).Scan(&companyID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	query := `
		SELECT u.id, u.name, u.email, u.phone 
		FROM users u
		JOIN company_users cu ON cu.user_id = u.id
		WHERE cu.company_id = $1 AND (u.name ILIKE $2 OR u.email ILIKE $2 OR u.phone ILIKE $2)
		LIMIT 100
	`
	
	var list []dtos.SearchUserResponse
	err = pgxscan.Select(ctx, database.Pool, &list, query, companyID, "%"+search+"%")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}

	c.JSON(http.StatusOK, list)
}
