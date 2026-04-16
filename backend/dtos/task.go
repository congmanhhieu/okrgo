package dtos

import "time"

type CreateTaskRequest struct {
	Title             string `json:"title" binding:"required"`
	Description       string `json:"description"`
	AssigneeID        *int   `json:"assignee_id"`
	Priority          string `json:"priority"`
	LinkedObjectiveID *int   `json:"linked_objective_id"`
	LinkedKRID        *int   `json:"linked_kr_id"`
	Deadline          string `json:"deadline"` // "2026-04-20"
	WatcherIDs        []int  `json:"watcher_ids"`
}

type UpdateTaskRequest struct {
	Title             string `json:"title"`
	Description       string `json:"description"`
	AssigneeID        *int   `json:"assignee_id"`
	Priority          string `json:"priority"`
	LinkedObjectiveID *int   `json:"linked_objective_id"`
	LinkedKRID        *int   `json:"linked_kr_id"`
	Deadline          string `json:"deadline"`
	WatcherIDs        []int  `json:"watcher_ids"`
}

type UpdateTaskStatusRequest struct {
	Status   string `json:"status"` // todo, in_progress, done
	Progress *int   `json:"progress"`
}

type TaskWatcher struct {
	UserID int    `json:"user_id" db:"user_id"`
	Name   string `json:"name" db:"name"`
}

type TaskResponse struct {
	ID                int          `json:"id" db:"id"`
	CompanyID         int          `json:"company_id" db:"company_id"`
	Title             string       `json:"title" db:"title"`
	Description       string       `json:"description" db:"description"`
	AssigneeID        *int         `json:"assignee_id" db:"assignee_id"`
	AssigneeName      string       `json:"assignee_name" db:"assignee_name"`
	CreatorID         int          `json:"creator_id" db:"creator_id"`
	CreatorName       string       `json:"creator_name" db:"creator_name"`
	Priority          string       `json:"priority" db:"priority"`
	Status            string       `json:"status" db:"status"`
	Progress          int          `json:"progress" db:"progress"`
	LinkedObjectiveID *int         `json:"linked_objective_id" db:"linked_objective_id"`
	ObjectiveName     string       `json:"objective_name" db:"objective_name"`
	LinkedKRID        *int         `json:"linked_kr_id" db:"linked_kr_id"`
	KRName            string       `json:"kr_name" db:"kr_name"`
	Deadline          *time.Time   `json:"deadline" db:"deadline"`
	CreatedAt         time.Time    `json:"created_at" db:"created_at"`
	Watchers          []TaskWatcher `json:"watchers"`
}
