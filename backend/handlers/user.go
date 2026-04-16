package handlers

import (
	"context"
	"net/http"

	"okrgo/database"
	"okrgo/dtos"
	"okrgo/models"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// GetProfile lấy thông tin cá nhân và thông tin Công ty theo slug
func GetProfile(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	companySlug := c.Param("slug")

	var response dtos.ProfileResponse
	ctx := context.Background()

	// 1. Get User Master Info
	queryUser := `SELECT id, name, email, phone, avatar_url, birth_date, address, created_at FROM users WHERE id = $1`
	err := pgxscan.Get(ctx, database.Pool, &response.User, queryUser, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load user info"})
		return
	}

	// 2. Get Company Context Info
	if companySlug != "" {
		queryCompany := `
			SELECT 
				cu.role as company_role, 
				cu.stars_balance, 
				cu.position, 
				cu.department_id, 
				d.name as department_name, 
				cu.manager_id,
				m.name as manager_name,
				(SELECT COUNT(*) FROM kudos k WHERE k.receiver_id = cu.user_id AND k.company_id = cu.company_id) as total_kudo_receive
			FROM company_users cu
			JOIN companies c ON c.id = cu.company_id
			LEFT JOIN departments d ON d.id = cu.department_id
			LEFT JOIN users m ON m.id = cu.manager_id
			WHERE cu.user_id = $1 AND c.slug = $2
		`
		var cInfo struct {
			CompanyRole      string  `db:"company_role"`
			StarsBalance     int     `db:"stars_balance"`
			Position         *string `db:"position"`
			DepartmentID     *int    `db:"department_id"`
			DepartmentName   *string `db:"department_name"`
			ManagerID        *int    `db:"manager_id"`
			ManagerName      *string `db:"manager_name"`
			TotalKudoReceive int     `db:"total_kudo_receive"`
		}

		err = pgxscan.Get(ctx, database.Pool, &cInfo, queryCompany, userID, companySlug)
		if err == nil { // Ignore not found if invalid slug, just return basic user
			response.CompanyRole = cInfo.CompanyRole
			response.StarsBalance = cInfo.StarsBalance
			response.Position = cInfo.Position
			response.DepartmentID = cInfo.DepartmentID
			response.DepartmentName = cInfo.DepartmentName
			response.ManagerID = cInfo.ManagerID
			response.ManagerName = cInfo.ManagerName
			response.TotalKudoReceive = cInfo.TotalKudoReceive
		}
	}

	c.JSON(http.StatusOK, response)
}

// UpdateProfile
func UpdateProfile(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	var req dtos.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	ctx := context.Background()
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi máy chủ"})
		return
	}
	defer tx.Rollback(ctx)

	// Update user global
	_, err = tx.Exec(ctx, `
		UPDATE users 
		SET name = $1, phone = $2, birth_date = $3, address = $4
		WHERE id = $5`,
		req.Name, req.Phone, req.BirthDate, req.Address, userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật users thất bại"})
		return
	}

	// Update company_user if slug provided
	if companySlug != "" {
		_, err = tx.Exec(ctx, `
			UPDATE company_users cu
			SET position = $1, department_id = $2, manager_id = $3
			FROM companies c
			WHERE c.id = cu.company_id AND cu.user_id = $4 AND c.slug = $5
		`, req.Position, req.DepartmentID, req.ManagerID, userID, companySlug)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật company context thất bại"})
			return
		}
	}

	tx.Commit(ctx)
	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật thành công"})
}

// UpdateAvatar
func UpdateAvatar(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var req struct {
		AvatarURL string `json:"avatar_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Thiếu link ảnh"})
		return
	}

	_, err := database.Pool.Exec(context.Background(), `UPDATE users SET avatar_url = $1 WHERE id = $2`, req.AvatarURL, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật ảnh đại diện thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật ảnh thành công"})
}

func ChangePassword(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var req dtos.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	ctx := context.Background()
	var user models.User
	err := pgxscan.Get(ctx, database.Pool, &user, "SELECT password_hash FROM users WHERE id = $1", userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User không tồn tại"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Mật khẩu cũ không chính xác"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	_, err = database.Pool.Exec(ctx, "UPDATE users SET password_hash = $1 WHERE id = $2", string(hashedPassword), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cập nhật mật khẩu thất bại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đổi mật khẩu thành công"})
}
