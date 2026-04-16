package dtos

import "time"

type FeedbackResponse struct {
	ID                int       `json:"id" db:"id"`
	CompanyID         int       `json:"company_id" db:"company_id"`
	SenderID          int       `json:"sender_id" db:"sender_id"`
	SenderName        string    `json:"sender_name" db:"sender_name"`
	ReceiverID        int       `json:"receiver_id" db:"receiver_id"`
	ReceiverName      string    `json:"receiver_name" db:"receiver_name"`
	Content           string    `json:"content" db:"content"`
	Advice            *string   `json:"advice,omitempty" db:"advice"`
	LinkedObjectiveID *int      `json:"linked_objective_id,omitempty" db:"linked_objective_id"`
	ObjectiveName     *string   `json:"objective_name,omitempty" db:"objective_name"`
	LinkedKRID        *int      `json:"linked_kr_id,omitempty" db:"linked_kr_id"`
	KRName            *string   `json:"kr_name,omitempty" db:"kr_name"`
	LinkedTaskID      *int      `json:"linked_task_id,omitempty" db:"linked_task_id"`
	TaskTitle         *string   `json:"task_title,omitempty" db:"task_title"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
}

type CreateFeedbackRequest struct {
	ReceiverID        int     `json:"receiver_id" binding:"required"`
	Content           string  `json:"content" binding:"required"`
	Advice            *string `json:"advice,omitempty"`
	LinkedObjectiveID *int    `json:"linked_objective_id,omitempty"`
	LinkedKRID        *int    `json:"linked_kr_id,omitempty"`
	LinkedTaskID      *int    `json:"linked_task_id,omitempty"`
}
