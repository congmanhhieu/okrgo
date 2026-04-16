package dtos

import "time"

type CompanySettingsResponse struct {
	CompanyID          int       `json:"company_id"`
	CheckinOverdueDays int       `json:"checkin_overdue_days"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type UpdateCompanySettingsRequest struct {
	CheckinOverdueDays int `json:"checkin_overdue_days" binding:"required,min=1,max=30"`
}
