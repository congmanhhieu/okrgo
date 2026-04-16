package handlers

import (
	"context"
	"log"
	"net/http"
	"okrgo/database"
	"okrgo/dtos"
	"strconv"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
)

// GetDashboardMetrics GET /workspaces/:slug/dashboard
func GetDashboardMetrics(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	
	deptIDStr := c.Query("department_id")
	var deptID *int
	if deptIDStr != "" {
		if id, err := strconv.Atoi(deptIDStr); err == nil && id > 0 {
			deptID = &id
		}
	}

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	var res dtos.DashboardResponse

	// Get settings
	overdueDays := 7
	_ = database.Pool.QueryRow(ctx, "SELECT checkin_overdue_days FROM company_settings WHERE company_id = $1", companyID).Scan(&overdueDays)

	// 1. Objectives Progress
	var progress dtos.ObjectiveProgress
	queryProgress := `
		SELECT 
			COALESCE(SUM(CASE WHEN o.progress < 40 THEN 1 ELSE 0 END), 0) as red,
			COALESCE(SUM(CASE WHEN o.progress >= 40 AND o.progress < 70 THEN 1 ELSE 0 END), 0) as yellow,
			COALESCE(SUM(CASE WHEN o.progress >= 70 THEN 1 ELSE 0 END), 0) as green
		FROM objectives o
		LEFT JOIN company_users cu ON o.owner_id = cu.user_id AND cu.company_id = o.company_id
		WHERE o.company_id = $1 AND ($2::int IS NULL OR cu.department_id = $2::int)
	`
	_ = database.Pool.QueryRow(ctx, queryProgress, companyID, deptID).Scan(&progress.Red, &progress.Yellow, &progress.Green)
	res.Progress = progress

	// 2. CheckInStatus
	var checkin dtos.CheckInStatus
	queryCheckIn := `
		SELECT
			COALESCE(SUM(CASE WHEN date_part('day', CURRENT_TIMESTAMP - last_activity) <= $2 THEN 1 ELSE 0 END), 0) as on_time,
			COALESCE(SUM(CASE WHEN date_part('day', CURRENT_TIMESTAMP - last_activity) > $2 THEN 1 ELSE 0 END), 0) as late
		FROM (
			SELECT kr.id, COALESCE(MAX(c.created_at), kr.created_at) as last_activity
			FROM key_results kr
			LEFT JOIN check_ins c ON kr.id = c.key_result_id
            LEFT JOIN company_users cu ON kr.owner_id = cu.user_id AND cu.company_id = kr.company_id
			WHERE kr.company_id = $1 AND ($3::int IS NULL OR cu.department_id = $3::int)
			GROUP BY kr.id, kr.created_at
		) sub
	`
	_ = database.Pool.QueryRow(ctx, queryCheckIn, companyID, overdueDays, deptID).Scan(&checkin.OnTime, &checkin.Late)
	res.CheckinStatus = checkin

	// 3. Trends (Last 7 days)
	var trends []dtos.CommunicationTrend
	queryTrends := `
		WITH dates AS (
			SELECT generate_series(
				date_trunc('day', (CURRENT_DATE - INTERVAL '6 days')::timestamp),
				date_trunc('day', CURRENT_DATE::timestamp),
				'1 day'::interval
			)::date as d
		)
		SELECT 
			to_char(d, 'DD/MM') as label,
			(SELECT COUNT(*) FROM feedbacks f LEFT JOIN company_users cu ON f.sender_id = cu.user_id AND cu.company_id = f.company_id WHERE date_trunc('day', f.created_at) = d AND f.company_id = $1 AND ($2::int IS NULL OR cu.department_id = $2::int)) as feedbacks,
			(SELECT COUNT(*) FROM kudos k LEFT JOIN company_users cu ON k.sender_id = cu.user_id AND cu.company_id = k.company_id WHERE date_trunc('day', k.created_at) = d AND k.company_id = $1 AND ($2::int IS NULL OR cu.department_id = $2::int)) as kudos
		FROM dates
		ORDER BY d;
	`
	err := pgxscan.Select(ctx, database.Pool, &trends, queryTrends, companyID, deptID)
	if err != nil {
		log.Println("Dashboard trends error:", err)
		trends = []dtos.CommunicationTrend{}
	}
	res.Trends = trends

	// 4. Summary
	var summary dtos.DashboardSummary
	_ = database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM objectives o LEFT JOIN company_users cu ON o.owner_id = cu.user_id AND cu.company_id = o.company_id WHERE o.company_id = $1 AND ($2::int IS NULL OR cu.department_id = $2::int)", companyID, deptID).Scan(&summary.TotalObjectives)
	_ = database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM company_users cu WHERE cu.company_id = $1 AND ($2::int IS NULL OR cu.department_id = $2::int)", companyID, deptID).Scan(&summary.TotalStaff)
	_ = database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM kudos k LEFT JOIN company_users cu ON k.sender_id = cu.user_id AND cu.company_id = k.company_id WHERE k.company_id = $1 AND date_trunc('month', k.created_at) = date_trunc('month', CURRENT_DATE) AND ($2::int IS NULL OR cu.department_id = $2::int)", companyID, deptID).Scan(&summary.TotalKudosGiven)
	_ = database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM tasks t LEFT JOIN key_results kr ON t.linked_kr_id = kr.id LEFT JOIN company_users cu ON kr.owner_id = cu.user_id AND cu.company_id = t.company_id WHERE t.company_id = $1 AND ($2::int IS NULL OR cu.department_id = $2::int)", companyID, deptID).Scan(&summary.TotalTasks)
	res.Summary = summary

	// 5. ConfidenceStats & ExecutionSpeedStats
	queryCheckInStats := `
		WITH latest_checkins AS (
			SELECT DISTINCT ON (kr.id) kr.id, c.confidence_level, c.execution_speed
			FROM key_results kr
			JOIN check_ins c ON kr.id = c.key_result_id
			LEFT JOIN company_users cu ON kr.owner_id = cu.user_id AND cu.company_id = kr.company_id
			WHERE kr.company_id = $1 AND ($2::int IS NULL OR cu.department_id = $2::int)
			ORDER BY kr.id, c.created_at DESC
		)
		SELECT 
			COALESCE(SUM(CASE WHEN confidence_level='not_confident' THEN 1 ELSE 0 END), 0) as not_confident,
			COALESCE(SUM(CASE WHEN confidence_level='lacking_confidence' THEN 1 ELSE 0 END), 0) as lacking_confidence,
			COALESCE(SUM(CASE WHEN confidence_level='confident' THEN 1 ELSE 0 END), 0) as confident,
			COALESCE(SUM(CASE WHEN confidence_level='very_confident' THEN 1 ELSE 0 END), 0) as very_confident,
			COALESCE(SUM(CASE WHEN execution_speed='very_slow' THEN 1 ELSE 0 END), 0) as very_slow,
			COALESCE(SUM(CASE WHEN execution_speed='slow' THEN 1 ELSE 0 END), 0) as slow,
			COALESCE(SUM(CASE WHEN execution_speed='fast' THEN 1 ELSE 0 END), 0) as fast,
			COALESCE(SUM(CASE WHEN execution_speed='very_fast' THEN 1 ELSE 0 END), 0) as very_fast
		FROM latest_checkins
	`
	_ = database.Pool.QueryRow(ctx, queryCheckInStats, companyID, deptID).Scan(
		&res.Confidence.NotConfident, &res.Confidence.LackingConfidence, &res.Confidence.Confident, &res.Confidence.VeryConfident,
		&res.ExecutionSpeed.VerySlow, &res.ExecutionSpeed.Slow, &res.ExecutionSpeed.Fast, &res.ExecutionSpeed.VeryFast,
	)

	c.JSON(http.StatusOK, res)
}
