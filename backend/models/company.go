package models

import "time"

type Company struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Slug      string    `json:"slug" db:"slug"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Department struct {
	ID        int       `json:"id" db:"id"`
	CompanyID int       `json:"company_id" db:"company_id"`
	Name      string    `json:"name" db:"name"`
	ManagerID *int      `json:"manager_id" db:"manager_id"`
	IsActive  bool      `json:"is_active" db:"is_active"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type CompanyUser struct {
	ID           int       `json:"id" db:"id"`
	CompanyID    int       `json:"company_id" db:"company_id"`
	UserID       int       `json:"user_id" db:"user_id"`
	DepartmentID *int      `json:"department_id" db:"department_id"`
	Role         string    `json:"role" db:"role"`
	Position     *string   `json:"position" db:"position"`
	ManagerID    *int      `json:"manager_id" db:"manager_id"`
	StarsBalance int       `json:"stars_balance" db:"stars_balance"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type CompanyInvitation struct {
	ID        int       `json:"id" db:"id"`
	CompanyID int       `json:"company_id" db:"company_id"`
	Email     string    `json:"email" db:"email"`
	Role      string    `json:"role" db:"role"`
	Status    string    `json:"status" db:"status"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
