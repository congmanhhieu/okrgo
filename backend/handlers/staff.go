package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"okrgo/database"
	"okrgo/dtos"
	"okrgo/utils"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
)

// GetStaffList returns paginated list of staff in the company
func GetStaffList(c *gin.Context) {
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
	departmentFilter := c.Query("department_id")
	statusFilter := c.Query("status")
	roleFilter := c.Query("role")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var args []interface{}
	args = append(args, companyID)

	whereClauses := "WHERE cu.company_id = $1"
	argID := 2

	if search != "" {
		whereClauses += fmt.Sprintf(" AND (u.name ILIKE $%d OR u.email ILIKE $%d OR u.phone ILIKE $%d)", argID, argID, argID)
		args = append(args, "%"+search+"%")
		argID++
	}

	if departmentFilter != "" {
		depID, err := strconv.Atoi(departmentFilter)
		if err == nil {
			whereClauses += fmt.Sprintf(" AND cu.department_id = $%d", argID)
			args = append(args, depID)
			argID++
		}
	}

	if statusFilter == "active" {
		whereClauses += fmt.Sprintf(" AND cu.is_active = $%d", argID)
		args = append(args, true)
		argID++
	} else if statusFilter == "inactive" {
		whereClauses += fmt.Sprintf(" AND cu.is_active = $%d", argID)
		args = append(args, false)
		argID++
	}

	if roleFilter != "" && roleFilter != "all" {
		whereClauses += fmt.Sprintf(" AND cu.role = $%d", argID)
		args = append(args, roleFilter)
		argID++
	}

	query := fmt.Sprintf(`
		SELECT 
			cu.user_id,
			u.name,
			u.email,
			u.phone,
			u.avatar_url,
			cu.position,
			cu.department_id,
			d.name as department_name,
			cu.role,
			cu.is_active,
			cu.created_at as joined_at
		FROM company_users cu
		JOIN users u ON u.id = cu.user_id
		LEFT JOIN departments d ON d.id = cu.department_id
		%s
		ORDER BY cu.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClauses, argID, argID+1)

	args = append(args, limit, offset)

	var list []dtos.StaffListItem
	err := pgxscan.Select(ctx, database.Pool, &list, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy xuất dữ liệu", "details": err.Error()})
		return
	}

	// count total
	countQuery := fmt.Sprintf(`
		SELECT COUNT(cu.id) 
		FROM company_users cu
		JOIN users u ON u.id = cu.user_id
		LEFT JOIN departments d ON d.id = cu.department_id
		%s
	`, whereClauses)
	var total int
	err = database.Pool.QueryRow(ctx, countQuery, args[:argID-1]...).Scan(&total)
	if err != nil {
		total = 0
	}

	if list == nil {
		list = []dtos.StaffListItem{}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  list,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// CreateStaff adds a new staff or invites an existing user
func CreateStaff(c *gin.Context) {
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

	var req dtos.CreateStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	if req.Role == "" {
		req.Role = "user"
	}

	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ"})
		return
	}
	defer tx.Rollback(ctx)

	// Check if user already exists
	var existingUserID int
	err = tx.QueryRow(ctx, "SELECT id FROM users WHERE email = $1", req.Email).Scan(&existingUserID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tài khoản nhân sự chưa được đăng ký trên hệ thống. Yêu cầu nhân sự tạo tài khoản theo Email này trước."})
		return
	}

	// Check if already a member
	var alreadyIn int
	err = tx.QueryRow(ctx, "SELECT COUNT(*) FROM company_users WHERE company_id = $1 AND user_id = $2", companyID, existingUserID).Scan(&alreadyIn)
	if err == nil && alreadyIn > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Nhân sự này đã tồn tại trong công ty"})
		return
	}

	// Insert company_user
	_, err = tx.Exec(ctx,
		"INSERT INTO company_users (company_id, user_id, role, position, department_id) VALUES ($1, $2, $3, $4, $5)",
		companyID, existingUserID, req.Role, req.Position, req.DepartmentID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Thêm nhân sự thất bại", "details": err.Error()})
		return
	}

	// Also create an invitation record
	_, _ = tx.Exec(ctx,
		"INSERT INTO company_invitations (company_id, email, role, status) VALUES ($1, $2, $3, 'accepted')",
		companyID, req.Email, req.Role,
	)

	if err = tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi hoàn tất giao dịch"})
		return
	}

	// Try sending invitation email (async, don't block)
	go func() {
		_ = utils.SendInvitationEmail(req.Email, req.Name, companySlug)
	}()

	c.JSON(http.StatusCreated, gin.H{"message": "Thêm nhân sự thành công", "user_id": existingUserID})
}

// UpdateStaff updates a staff member's role, position, department, status
func UpdateStaff(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	staffUserID := c.Param("userId")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền thực hiện"})
		return
	}

	var req dtos.UpdateStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	query := `UPDATE company_users SET position = $1, department_id = $2, role = $3, is_active = $4 WHERE user_id = $5 AND company_id = $6`
	_, err := database.Pool.Exec(ctx, query, req.Position, req.DepartmentID, req.Role, req.IsActive, staffUserID, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật thất bại", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật thành công"})
}

// DeleteStaff removes a staff member from the company
func DeleteStaff(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	staffUserID := c.Param("userId")

	ctx := context.Background()
	companyID, hasRole := checkHasManagerRole(ctx, userID, companySlug)
	if !hasRole {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền thực hiện"})
		return
	}

	// Prevent deleting yourself
	targetID, _ := strconv.Atoi(staffUserID)
	if targetID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không thể xóa chính mình"})
		return
	}

	query := `DELETE FROM company_users WHERE user_id = $1 AND company_id = $2`
	_, err := database.Pool.Exec(ctx, query, staffUserID, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xóa thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa nhân sự khỏi công ty"})
}

// GetDepartmentList returns simple list of departments for dropdowns
func GetDepartmentDropdown(c *gin.Context) {
	companySlug := c.Param("slug")

	ctx := context.Background()
	var companyID int
	err := database.Pool.QueryRow(ctx, "SELECT id FROM companies WHERE slug = $1", companySlug).Scan(&companyID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công ty"})
		return
	}

	type DeptOption struct {
		ID   int    `json:"id" db:"id"`
		Name string `json:"name" db:"name"`
	}

	var list []DeptOption
	err = pgxscan.Select(ctx, database.Pool, &list, "SELECT id, name FROM departments WHERE company_id = $1 AND is_active = true ORDER BY name", companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi truy xuất"})
		return
	}
	if list == nil {
		list = []DeptOption{}
	}

	c.JSON(http.StatusOK, list)
}
