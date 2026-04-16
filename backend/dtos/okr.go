package dtos

import "time"

// ========= RESPONSES =========

type KeyResultResponse struct {
	ID           int       `json:"id"`
	ObjectiveID  int       `json:"objective_id"`
	Name         string    `json:"name"`
	Unit         string    `json:"unit"`
	StartValue   float64   `json:"start_value"`
	CurrentValue float64   `json:"current_value"`
	TargetValue  float64   `json:"target_value"`
	OwnerID      *int      `json:"owner_id"`
	Deadline     *time.Time `json:"deadline"`
	CreatedAt    time.Time `json:"created_at"`
	Progress     float64   `json:"progress"` // Computed
}

type ObjectiveResponse struct {
	ID          int                 `json:"id"`
	CompanyID   int                 `json:"company_id"`
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Level       string              `json:"level"`
	OwnerID     int                 `json:"owner_id"`
	CycleID     int                 `json:"cycle_id"`
	Progress        float64             `json:"progress"`
	Status          string              `json:"status"`
	StartDate       *time.Time          `json:"start_date"`
	EndDate         *time.Time          `json:"end_date"`
	ConfidenceLevel string              `json:"confidence_level"`
	CreatedAt       time.Time           `json:"created_at"`
	OwnerName       string              `json:"owner_name"`
	OwnerAvatar string              `json:"owner_avatar"`
	CycleName   string              `json:"cycle_name"`
	DeptName    string              `json:"dept_name"`
	KeyResults  []KeyResultResponse `json:"key_results"`
}

// ========= REQUESTS =========

type ObjectiveKeyResultRequest struct {
	Name        string  `json:"name" binding:"required"`
	Unit        string  `json:"unit" binding:"required"`
	StartValue  float64 `json:"start_value"`
	TargetValue float64 `json:"target_value" binding:"required"`
}

type CreateObjectiveRequest struct {
	Name        string                      `json:"name" binding:"required"`
	Description string                      `json:"description"`
	Level       string                      `json:"level" binding:"required"`
	OwnerID     int                         `json:"owner_id" binding:"required"`
	CycleID         int                         `json:"cycle_id" binding:"required"`
	StartDate       *time.Time                  `json:"start_date"`
	EndDate         *time.Time                  `json:"end_date"`
	ConfidenceLevel string                      `json:"confidence_level"`
	KeyResults      []ObjectiveKeyResultRequest `json:"key_results"`
}

type UpdateObjectiveRequest struct {
	Name        string     `json:"name" binding:"required"`
	Description string     `json:"description"`
	Level       string     `json:"level" binding:"required"`
	OwnerID     int        `json:"owner_id" binding:"required"`
	CycleID     int        `json:"cycle_id" binding:"required"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
}

type CreateKeyResultRequest struct {
	Name        string  `json:"name" binding:"required"`
	Unit        string  `json:"unit" binding:"required"`
	StartValue  float64 `json:"start_value"`
	TargetValue float64 `json:"target_value" binding:"required"`
}

type UpdateKeyResultRequest struct {
	Name        string  `json:"name" binding:"required"`
	Unit        string  `json:"unit" binding:"required"`
	StartValue  float64 `json:"start_value"`
	TargetValue float64 `json:"target_value" binding:"required"`
}

type CheckInRequest struct {
	Value           float64  `json:"value"` // Allows 0, so no binding:"required"
	ProgressPercent *float64 `json:"progress_percent"`
	Comment         string   `json:"comment"`
	Problem         string   `json:"problem"`
	Cause           string   `json:"cause"`
	Solution        string   `json:"solution"`
	ConfidenceLevel string   `json:"confidence_level"`
	ExecutionSpeed  string   `json:"execution_speed"`
}

type CheckInHistoryItem struct {
	ID              int       `json:"id"`
	Value           float64   `json:"value"`
	ProgressPercent *float64  `json:"progress_percent"`
	Comment         string    `json:"comment"`
	Problem         string    `json:"problem"`
	Cause           string    `json:"cause"`
	Solution        string    `json:"solution"`
	ConfidenceLevel string    `json:"confidence_level"`
	ExecutionSpeed  string    `json:"execution_speed"`
	CreatedAt       time.Time `json:"created_at"`
}

type PendingCheckInResponse struct {
	KeyResultID          int                  `json:"key_result_id"`
	ObjectiveName        string               `json:"objective_name"`
	KeyResultName        string               `json:"key_result_name"`
	StartValue           float64              `json:"start_value"`
	CurrentValue         float64              `json:"current_value"`
	TargetValue          float64              `json:"target_value"`
	Unit                 string               `json:"unit"`
	Progress             float64              `json:"progress"`
	LastCheckInAt        *time.Time           `json:"last_check_in_at"`
	DaysSinceLastCheckIn int                  `json:"days_since_last_check_in"` // > 7 is overdue
	History              []CheckInHistoryItem `json:"history"`
}
