package dtos

import "time"

// --- Gift ---
type GiftResponse struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description *string   `json:"description" db:"description"`
	ImageURL    *string   `json:"image_url" db:"image_url"`
	StarPrice   int       `json:"star_price" db:"star_price"`
	Category    *string   `json:"category" db:"category"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type CreateGiftRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
	ImageURL    *string `json:"image_url"`
	StarPrice   int     `json:"star_price" binding:"required"`
	Category    *string `json:"category"`
}

type UpdateGiftRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
	ImageURL    *string `json:"image_url"`
	StarPrice   int     `json:"star_price" binding:"required"`
	Category    *string `json:"category"`
	IsActive    *bool   `json:"is_active"`
}

// --- Redeem Request ---
type RedeemGiftItem struct {
	GiftID   int `json:"gift_id" binding:"required"`
	Quantity int `json:"quantity" binding:"required,min=1"`
}

type RedeemGiftsRequest struct {
	Items []RedeemGiftItem `json:"items" binding:"required,min=1,dive"`
}

// --- Gift Order ---
type GiftOrderResponse struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	UserName  string    `json:"user_name" db:"user_name"`
	GiftID    int       `json:"gift_id" db:"gift_id"`
	GiftName  string    `json:"gift_name" db:"gift_name"`
	Quantity  int       `json:"quantity" db:"quantity"`
	StarCost  int       `json:"star_cost" db:"star_cost"`
	Status    string    `json:"status" db:"status"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type UpdateGiftOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}
