package models

import "time"

type Gift struct {
	ID          int       `json:"id" db:"id"`
	CompanyID   int       `json:"company_id" db:"company_id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	ImageURL    string    `json:"image_url" db:"image_url"`
	StarPrice   int       `json:"star_price" db:"star_price"`
	Stock       int       `json:"stock" db:"stock"`
	Category    string    `json:"category" db:"category"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type GiftOrder struct {
	ID        int       `json:"id" db:"id"`
	CompanyID int       `json:"company_id" db:"company_id"`
	UserID    int       `json:"user_id" db:"user_id"`
	GiftID    int       `json:"gift_id" db:"gift_id"`
	StarCost  int       `json:"star_cost" db:"star_cost"`
	Status    string    `json:"status" db:"status"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
