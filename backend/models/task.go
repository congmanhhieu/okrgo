package models

import "time"

type Task struct {
	ID                int        `json:"id" db:"id"`
	CompanyID         int        `json:"company_id" db:"company_id"`
	Title             string     `json:"title" db:"title"`
	Description       string     `json:"description" db:"description"`
	AssigneeID        *int       `json:"assignee_id" db:"assignee_id"`
	CreatorID         int        `json:"creator_id" db:"creator_id"`
	Priority          string     `json:"priority" db:"priority"`
	Status            string     `json:"status" db:"status"`
	Progress          int        `json:"progress" db:"progress"`
	LinkedObjectiveID *int       `json:"linked_objective_id" db:"linked_objective_id"`
	LinkedKRID        *int       `json:"linked_kr_id" db:"linked_kr_id"`
	Deadline          *time.Time `json:"deadline" db:"deadline"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
}

type TodayList struct {
	ID                int       `json:"id" db:"id"`
	CompanyID         int       `json:"company_id" db:"company_id"`
	UserID            int       `json:"user_id" db:"user_id"`
	Title             string    `json:"title" db:"title"`
	Description       string    `json:"description" db:"description"`
	StartTime         string    `json:"start_time" db:"start_time"`
	EndTime           string    `json:"end_time" db:"end_time"`
	Priority          string    `json:"priority" db:"priority"`
	IsCompleted       bool      `json:"is_completed" db:"is_completed"`
	LinkedObjectiveID *int      `json:"linked_objective_id" db:"linked_objective_id"`
	RelatedUserID     *int      `json:"related_user_id" db:"related_user_id"`
	TaskDate          time.Time `json:"task_date" db:"task_date"`
	OrderIndex        int       `json:"order_index" db:"order_index"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
}
