package dtos

import "okrgo/models"

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

type UpdateProfileRequest struct {
	Name         string  `json:"name"`
	Phone        *string `json:"phone"`
	BirthDate    *string `json:"birth_date"`
	Address      *string `json:"address"`
	DepartmentID *int    `json:"department_id"`
	Position     *string `json:"position"`
	ManagerID    *int    `json:"manager_id"`
}

type ProfileResponse struct {
	User             models.User `json:"user"`
	DepartmentName   *string     `json:"department_name"`
	DepartmentID     *int        `json:"department_id"`
	Position         *string     `json:"position"`
	ManagerID        *int        `json:"manager_id"`
	ManagerName      *string     `json:"manager_name"`
	CompanyRole      string      `json:"company_role"`
	StarsBalance     int         `json:"stars_balance"`
	TotalKudoReceive int         `json:"total_kudo_receive"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}
