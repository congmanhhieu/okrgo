package dtos

import "time"

type StarCriteriaResponse struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Category  string    `json:"category" db:"category"`
	Stars     int       `json:"stars" db:"stars"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type CreateStarCriteriaRequest struct {
	Name     string `json:"name" binding:"required"`
	Category string `json:"category" binding:"required"`
	Stars    int    `json:"stars" binding:"required"`
}

type UpdateStarCriteriaRequest struct {
	Name     string `json:"name" binding:"required"`
	Category string `json:"category" binding:"required"`
	Stars    int    `json:"stars" binding:"required"`
}
