package dtos

import "time"

type KudoResponse struct {
	ID               int       `json:"id" db:"id"`
	CompanyID        int       `json:"company_id" db:"company_id"`
	SenderID         int       `json:"sender_id" db:"sender_id"`
	SenderName       string    `json:"sender_name" db:"sender_name"`
	ReceiverID       int       `json:"receiver_id" db:"receiver_id"`
	ReceiverName     string    `json:"receiver_name" db:"receiver_name"`
	Content          string    `json:"content" db:"content"`
	StarsAttached    int       `json:"stars_attached" db:"stars_attached"`
	CriteriaID       *int      `json:"criteria_id" db:"criteria_id"`
	CriteriaName     *string   `json:"criteria_name" db:"criteria_name"`
	CriteriaCategory *string   `json:"criteria_category" db:"criteria_category"`
	ReferenceText    *string   `json:"reference_text" db:"reference_text"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}

type CreateKudoRequest struct {
	ReceiverID    int     `json:"receiver_id" binding:"required"`
	Content       string  `json:"content" binding:"required"`
	CriteriaID    *int    `json:"criteria_id"`
	ReferenceText *string `json:"reference_text"`
}

type KudoLeaderboardResponse struct {
	UserID     int    `json:"user_id" db:"user_id"`
	UserName   string `json:"user_name" db:"user_name"`
	TotalKudos int    `json:"total_kudos" db:"total_kudos"`
	TotalStars int    `json:"total_stars" db:"total_stars"`
}
