package dtos

import "time"

type DepartmentResponse struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	IsActive      bool      `json:"is_active"`
	ManagerID     *int      `json:"manager_id"`
	ManagerName   *string   `json:"manager_name"`
	EmployeeCount int       `json:"employee_count"`
	CreatedAt     time.Time `json:"created_at"`
}

type CreateDepartmentRequest struct {
	Name      string `json:"name" binding:"required"`
	IsActive  bool   `json:"is_active"`
	ManagerID *int   `json:"manager_id"`
}

type UpdateDepartmentRequest struct {
	Name      string `json:"name" binding:"required"`
	IsActive  bool   `json:"is_active"`
	ManagerID *int   `json:"manager_id"`
}

type SearchUserResponse struct {
	ID    int     `json:"id"`
	Name  string  `json:"name"`
	Email string  `json:"email"`
	Phone *string `json:"phone"`
}
