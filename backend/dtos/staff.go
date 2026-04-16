package dtos

import "time"

type StaffListItem struct {
	UserID         int       `json:"user_id" db:"user_id"`
	Name           string    `json:"name" db:"name"`
	Email          string    `json:"email" db:"email"`
	Phone          *string   `json:"phone" db:"phone"`
	AvatarURL      *string   `json:"avatar_url" db:"avatar_url"`
	Position       *string   `json:"position" db:"position"`
	DepartmentID   *int      `json:"department_id" db:"department_id"`
	DepartmentName *string   `json:"department_name" db:"department_name"`
	Role           string    `json:"role" db:"role"`
	IsActive       bool      `json:"is_active" db:"is_active"`
	JoinedAt       time.Time `json:"joined_at" db:"joined_at"`
}

type CreateStaffRequest struct {
	Name         string  `json:"name" binding:"required"`
	Email        string  `json:"email" binding:"required,email"`
	Phone        *string `json:"phone"`
	Position     *string `json:"position"`
	DepartmentID *int    `json:"department_id"`
	Role         string  `json:"role"` // admin, manager, user
}

type UpdateStaffRequest struct {
	Position     *string `json:"position"`
	DepartmentID *int    `json:"department_id"`
	Role         string  `json:"role"`
	IsActive     bool    `json:"is_active"`
}
