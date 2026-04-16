package models

import "time"

type Cycle struct {
	ID        int       `json:"id" db:"id"`
	CompanyID int       `json:"company_id" db:"company_id"`
	Name      string    `json:"name" db:"name"`
	StartDate time.Time `json:"start_date" db:"start_date"`
	EndDate   time.Time `json:"end_date" db:"end_date"`
	IsActive  bool      `json:"is_active" db:"is_active"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Objective struct {
	ID          int       `json:"id" db:"id"`
	CompanyID   int       `json:"company_id" db:"company_id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Level       string    `json:"level" db:"level"`
	OwnerID     int       `json:"owner_id" db:"owner_id"`
	CycleID     int       `json:"cycle_id" db:"cycle_id"`
	Progress    float64   `json:"progress" db:"progress"`
	Status      string    `json:"status" db:"status"`
	StartDate   time.Time `json:"start_date" db:"start_date"`
	EndDate     time.Time `json:"end_date" db:"end_date"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type KeyResult struct {
	ID           int       `json:"id" db:"id"`
	CompanyID    int       `json:"company_id" db:"company_id"`
	ObjectiveID  int       `json:"objective_id" db:"objective_id"`
	Name         string    `json:"name" db:"name"`
	Unit         string    `json:"unit" db:"unit"`
	StartValue   float64   `json:"start_value" db:"start_value"`
	CurrentValue float64   `json:"current_value" db:"current_value"`
	TargetValue  float64   `json:"target_value" db:"target_value"`
	OwnerID      *int      `json:"owner_id" db:"owner_id"`
	Deadline     time.Time `json:"deadline" db:"deadline"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type CheckIn struct {
	ID          int       `json:"id" db:"id"`
	CompanyID   int       `json:"company_id" db:"company_id"`
	KeyResultID int       `json:"key_result_id" db:"key_result_id"`
	UserID      int       `json:"user_id" db:"user_id"`
	Value       float64   `json:"value" db:"value"`
	Comment     string    `json:"comment" db:"comment"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}
