package dtos

import "time"

type CreateTodayListRequest struct {
	Title             string  `json:"title" binding:"required"`
	Description       string  `json:"description"`
	StartTime         string  `json:"start_time"`
	EndTime           string  `json:"end_time"`
	Priority          string  `json:"priority"` // important, less_important, not_important
	LinkedObjectiveID *int    `json:"linked_objective_id"`
	RelatedUserID     *int    `json:"related_user_id"`
	TaskDate          *string `json:"task_date"` // "2026-04-15"
}

type UpdateTodayListRequest struct {
	Title             string  `json:"title"`
	Description       string  `json:"description"`
	StartTime         string  `json:"start_time"`
	EndTime           string  `json:"end_time"`
	Priority          string  `json:"priority"`
	LinkedObjectiveID *int    `json:"linked_objective_id"`
	RelatedUserID     *int    `json:"related_user_id"`
	TaskDate          *string `json:"task_date"`
}

type TodayListResponse struct {
	ID                int        `json:"id" db:"id"`
	CompanyID         int        `json:"company_id" db:"company_id"`
	UserID            int        `json:"user_id" db:"user_id"`
	Title             string     `json:"title" db:"title"`
	Description       string     `json:"description" db:"description"`
	StartTime         string     `json:"start_time" db:"start_time"`
	EndTime           string     `json:"end_time" db:"end_time"`
	Priority          string     `json:"priority" db:"priority"`
	IsCompleted       bool       `json:"is_completed" db:"is_completed"`
	LinkedObjectiveID *int       `json:"linked_objective_id" db:"linked_objective_id"`
	ObjectiveName     string     `json:"objective_name" db:"objective_name"`
	RelatedUserID     *int       `json:"related_user_id" db:"related_user_id"`
	RelatedUserName   string     `json:"related_user_name" db:"related_user_name"`
	TaskDate          time.Time  `json:"task_date" db:"task_date"`
	OrderIndex        int        `json:"order_index" db:"order_index"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
}
