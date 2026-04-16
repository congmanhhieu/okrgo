package dtos

import "time"

// Subject represents a user who performed the action
type NotificationSubject struct {
	ID     int     `json:"id"`
	Name   string  `json:"name"`
	Avatar *string `json:"avatar"`
}

// ObjectInfo represents the entity the action was performed on
type NotificationObject struct {
	ID   *int   `json:"id,omitempty"`
	Name string `json:"name"`
	Type string `json:"type"` // e.g. "task", "okr", "kudo"
}

// NotificationData represents the JSONB structure stored in DB
type NotificationData struct {
	SubjectCount int                   `json:"subject_count"`
	Subjects     []NotificationSubject `json:"subjects"`
	DiObject     *NotificationObject   `json:"di_object,omitempty"`
	PrObject     *NotificationObject   `json:"pr_object,omitempty"`
	InObject     *NotificationObject   `json:"in_object,omitempty"`
}

type NotificationResponse struct {
	ID        int              `json:"id"`
	CompanyID int              `json:"company_id"`
	UserID    int              `json:"user_id"`
	GroupKey  string           `json:"group_key"`
	Type      string           `json:"type"`
	Data      NotificationData `json:"data"`
	URL       string           `json:"url"`
	IsRead    bool             `json:"is_read"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
}
