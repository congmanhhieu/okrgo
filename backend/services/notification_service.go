package services

import (
	"context"
	"encoding/json"
	"okrgo/database"
	"okrgo/dtos"
	"time"

	"github.com/jackc/pgx/v5"
)

// PushNotification inserts or updates a grouped notification
func PushNotification(ctx context.Context, companyID, receiverID int, groupKey, nType, url string, data dtos.NotificationData) error {
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return err
	}

	// Upsert logic for grouping
	// If (company_id, user_id, group_key) exists, we merge data and update is_read = false
	// For simplicity in Phase 1 (no automatic array merge in SQL), we will just overwrite the data with the latest data object (which the caller can manually construct if they want grouped messages, or just overwrite since grouping is disabled for now)
	
	query := `
		INSERT INTO notifications (company_id, user_id, group_key, type, data, url, is_read, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, false, $7, $7)
		ON CONFLICT (company_id, user_id, group_key) 
		DO UPDATE SET 
			data = EXCLUDED.data,
			url = EXCLUDED.url,
			is_read = false,
			updated_at = EXCLUDED.updated_at
	`

	now := time.Now()
	_, err = database.Pool.Exec(ctx, query, companyID, receiverID, groupKey, nType, dataBytes, url, now)
	return err
}

func GetNotificationSubject(ctx context.Context, userID int) (dtos.NotificationSubject, error) {
	var sub dtos.NotificationSubject
	sub.ID = userID
	err := database.Pool.QueryRow(ctx, "SELECT name, avatar_url FROM users WHERE id=$1", userID).Scan(&sub.Name, &sub.Avatar)
	return sub, err
}

// Transactional version
func PushNotificationTx(ctx context.Context, tx pgx.Tx, companyID, receiverID int, groupKey, nType, url string, data dtos.NotificationData) error {
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO notifications (company_id, user_id, group_key, type, data, url, is_read, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, false, $7, $7)
		ON CONFLICT (company_id, user_id, group_key) 
		DO UPDATE SET 
			data = EXCLUDED.data,
			url = EXCLUDED.url,
			is_read = false,
			updated_at = EXCLUDED.updated_at
	`

	now := time.Now()
	_, err = tx.Exec(ctx, query, companyID, receiverID, groupKey, nType, dataBytes, url, now)
	return err
}
