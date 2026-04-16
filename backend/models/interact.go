package models

import "time"

type Feedback struct {
	ID                int       `json:"id" db:"id"`
	CompanyID         int       `json:"company_id" db:"company_id"`
	SenderID          int       `json:"sender_id" db:"sender_id"`
	ReceiverID        int       `json:"receiver_id" db:"receiver_id"`
	Content           string    `json:"content" db:"content"`
	Advice            *string   `json:"advice" db:"advice"`
	LinkedObjectiveID *int      `json:"linked_objective_id" db:"linked_objective_id"`
	LinkedKRID        *int      `json:"linked_kr_id" db:"linked_kr_id"`
	LinkedTaskID      *int      `json:"linked_task_id" db:"linked_task_id"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
}

type Kudo struct {
	ID            int       `json:"id" db:"id"`
	CompanyID     int       `json:"company_id" db:"company_id"`
	SenderID      int       `json:"sender_id" db:"sender_id"`
	ReceiverID    int       `json:"receiver_id" db:"receiver_id"`
	Content       string    `json:"content" db:"content"`
	StarsAttached int       `json:"stars_attached" db:"stars_attached"`
	CriteriaID    *int      `json:"criteria_id" db:"criteria_id"`
	ReferenceText *string   `json:"reference_text" db:"reference_text"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}
