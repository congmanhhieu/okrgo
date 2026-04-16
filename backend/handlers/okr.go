package handlers

import (
	"context"
	"fmt"
	"log"
	"math"
	"net/http"
	"okrgo/database"
	"okrgo/dtos"
	"okrgo/services"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Helper to check if user is in company and get companyID
func getCompanyIDFromSlug(ctx context.Context, userID int, slug string) (int, bool) {
	var config struct {
		CompanyID int    `db:"company_id"`
		Role      string `db:"role"`
	}
	query := `
		SELECT cu.company_id, cu.role 
		FROM company_users cu
		JOIN companies c ON c.id = cu.company_id
		WHERE cu.user_id = $1 AND c.slug = $2
	`
	err := database.Pool.QueryRow(ctx, query, userID, slug).Scan(&config.CompanyID, &config.Role)
	if err != nil {
		return 0, false
	}
	return config.CompanyID, true
}

// ======================= OBJECTIVES =======================

func GetOKRs(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	cycleIDParam := c.Query("cycle_id")
	levelParam := c.Query("level")

	// Query Objectives with User details
	query := `
		SELECT o.id, o.company_id, o.name, COALESCE(o.description, '') as description, o.level, o.owner_id, o.cycle_id,
		       o.progress, o.status, o.start_date, o.end_date, COALESCE(o.confidence_level, 'confident'), o.created_at,
		       u.name as owner_name, COALESCE(u.avatar_url, '') as owner_avatar, c.name as cycle_name,
		       COALESCE(d.name, '') as dept_name
		FROM objectives o
		JOIN users u ON o.owner_id = u.id
		JOIN cycles c ON o.cycle_id = c.id
		LEFT JOIN company_users cu ON cu.user_id = u.id AND cu.company_id = o.company_id
		LEFT JOIN departments d ON cu.department_id = d.id
		WHERE o.company_id = $1
	`
	args := []interface{}{companyID}
	paramID := 2

	if cycleIDParam != "" {
		query += ` AND o.cycle_id = $` + strconv.Itoa(paramID)
		args = append(args, cycleIDParam)
		paramID++
	}

	if levelParam != "" {
		query += ` AND o.level = $` + strconv.Itoa(paramID)
		args = append(args, levelParam)
		paramID++
	}

	query += ` ORDER BY o.created_at DESC`

	rows, err := database.Pool.Query(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lấy dữ liệu OKR"})
		return
	}
	defer rows.Close()

	var objectives []dtos.ObjectiveResponse
	objIDList := []int{}
	objMap := make(map[int]*dtos.ObjectiveResponse)

	for rows.Next() {
		var o dtos.ObjectiveResponse
		if err := rows.Scan(
			&o.ID, &o.CompanyID, &o.Name, &o.Description, &o.Level, &o.OwnerID, &o.CycleID,
			&o.Progress, &o.Status, &o.StartDate, &o.EndDate, &o.ConfidenceLevel, &o.CreatedAt,
			&o.OwnerName, &o.OwnerAvatar, &o.CycleName, &o.DeptName,
		); err != nil {
			log.Println("Scan Objective:", err)
			continue
		}
		o.KeyResults = []dtos.KeyResultResponse{}
		objectives = append(objectives, o)
		objIDList = append(objIDList, o.ID)
	}

	for i := range objectives {
		objMap[objectives[i].ID] = &objectives[i]
	}

	if len(objIDList) > 0 {
		krQuery := `SELECT id, objective_id, name, unit, start_value, current_value, target_value, owner_id, deadline, created_at 
					FROM key_results WHERE company_id = $1 AND objective_id = ANY($2)`
		krRows, err := database.Pool.Query(ctx, krQuery, companyID, objIDList)
		if err == nil {
			defer krRows.Close()
			for krRows.Next() {
				var kr dtos.KeyResultResponse
				var ownerID *int
				if err := krRows.Scan(&kr.ID, &kr.ObjectiveID, &kr.Name, &kr.Unit, &kr.StartValue, &kr.CurrentValue, &kr.TargetValue, &ownerID, &kr.Deadline, &kr.CreatedAt); err == nil {
					kr.OwnerID = ownerID
					progress := 0.0
					if kr.TargetValue != kr.StartValue {
						progress = (kr.CurrentValue - kr.StartValue) / (kr.TargetValue - kr.StartValue) * 100
					}
					if progress > 100 {
						progress = 100
					} else if progress < 0 {
						progress = 0
					}
					kr.Progress = math.Round(progress*10) / 10

					if obj, exists := objMap[kr.ObjectiveID]; exists {
						obj.KeyResults = append(obj.KeyResults, kr)
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": objectives})
}

func CreateObjective(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	var req dtos.CreateObjectiveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	startDate := time.Now()
	endDate := time.Now().AddDate(0, 3, 0)
	if req.StartDate != nil {
		startDate = *req.StartDate
	}
	if req.EndDate != nil {
		endDate = *req.EndDate
	}

	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi server"})
		return
	}

	confLevel := "confident"
	if req.ConfidenceLevel != "" {
		confLevel = req.ConfidenceLevel
	}

	var objID int
	err = tx.QueryRow(ctx, `
		INSERT INTO objectives (company_id, name, description, level, owner_id, cycle_id, progress, status, start_date, end_date, confidence_level)
		VALUES ($1, $2, $3, $4, $5, $6, 0, 'on_track', $7, $8, $9) RETURNING id
	`, companyID, req.Name, req.Description, req.Level, req.OwnerID, req.CycleID, startDate, endDate, confLevel).Scan(&objID)

	if err != nil {
		tx.Rollback(ctx)
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo Objective"})
		return
	}

	for _, kr := range req.KeyResults {
		_, err = tx.Exec(ctx, `
			INSERT INTO key_results (company_id, objective_id, name, unit, start_value, current_value, target_value)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, companyID, objID, kr.Name, kr.Unit, kr.StartValue, kr.StartValue, kr.TargetValue)
		if err != nil {
			tx.Rollback(ctx)
			log.Println(err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo Key Result"})
			return
		}
	}

	tx.Commit(ctx)
	c.JSON(http.StatusOK, gin.H{"message": "Đã tạo OKR"})
}

func UpdateObjective(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	id := c.Param("id")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	var req dtos.UpdateObjectiveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	_, err := database.Pool.Exec(ctx, `
		UPDATE objectives 
		SET name = $1, description = $2, level = $3, owner_id = $4, cycle_id = $5 
		WHERE id = $6 AND company_id = $7
	`, req.Name, req.Description, req.Level, req.OwnerID, req.CycleID, id, companyID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật Objective"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã cập nhật Objective"})
}

func DeleteObjective(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	id := c.Param("id")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	_, err := database.Pool.Exec(ctx, `DELETE FROM objectives WHERE id = $1 AND company_id = $2`, id, companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa Objective"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa Objective"})
}

// ======================= KEY RESULTS =======================

func recalculateObjectiveProgress(objectiveID int) {
	ctx := context.Background()
	rows, err := database.Pool.Query(ctx, `SELECT start_value, current_value, target_value FROM key_results WHERE objective_id = $1`, objectiveID)
	if err != nil {
		return
	}
	defer rows.Close()

	totalProgress := 0.0
	count := 0

	for rows.Next() {
		var start, current, target float64
		if err := rows.Scan(&start, &current, &target); err == nil {
			progress := 0.0
			if target != start {
				progress = (current - start) / (target - start) * 100
			}
			if progress > 100 {
				progress = 100
			} else if progress < 0 {
				progress = 0
			}
			totalProgress += progress
			count++
		}
	}

	finalProgress := 0.0
	if count > 0 {
		finalProgress = totalProgress / float64(count)
	}

	database.Pool.Exec(ctx, `UPDATE objectives SET progress = $1 WHERE id = $2`, finalProgress, objectiveID)
}

func CreateKeyResult(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	objID := c.Param("id")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	var req dtos.CreateKeyResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	_, err := database.Pool.Exec(ctx, `
		INSERT INTO key_results (company_id, objective_id, name, unit, start_value, current_value, target_value)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, companyID, objID, req.Name, req.Unit, req.StartValue, req.StartValue, req.TargetValue)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo Key Result"})
		return
	}

	objIDInt, _ := strconv.Atoi(objID)
	recalculateObjectiveProgress(objIDInt)

	c.JSON(http.StatusOK, gin.H{"message": "Đã thêm Key Result"})
}

func UpdateKeyResult(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	krID := c.Param("krId")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	var req dtos.UpdateKeyResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	var objID int
	err := database.Pool.QueryRow(ctx, `
		UPDATE key_results 
		SET name = $1, unit = $2, start_value = $3, target_value = $4
		WHERE id = $5 AND company_id = $6 RETURNING objective_id
	`, req.Name, req.Unit, req.StartValue, req.TargetValue, krID, companyID).Scan(&objID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật Key Result"})
		return
	}

	recalculateObjectiveProgress(objID)

	c.JSON(http.StatusOK, gin.H{"message": "Đã cập nhật Key Result"})
}

func DeleteKeyResult(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	krID := c.Param("krId")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	var objID int
	err := database.Pool.QueryRow(ctx, `DELETE FROM key_results WHERE id = $1 AND company_id = $2 RETURNING objective_id`, krID, companyID).Scan(&objID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa Key Result"})
		return
	}

	recalculateObjectiveProgress(objID)

	c.JSON(http.StatusOK, gin.H{"message": "Đã xóa Key Result"})
}

// ======================= CHECK-IN =======================

func CheckInKeyResult(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")
	krID := c.Param("krId")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	var req dtos.CheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi server"})
		return
	}

	// 1. Create check_in record
	_, err = tx.Exec(ctx, `
		INSERT INTO check_ins (company_id, key_result_id, user_id, value, progress_percent, comment, problem, cause, solution, confidence_level, execution_speed)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`, companyID, krID, userID, req.Value, req.ProgressPercent, req.Comment, req.Problem, req.Cause, req.Solution, req.ConfidenceLevel, req.ExecutionSpeed)

	if err != nil {
		tx.Rollback(ctx)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo check-in"})
		return
	}

	// 2. Update Key Result current value
	var objID int
	err = tx.QueryRow(ctx, `
		UPDATE key_results SET current_value = $1 
		WHERE id = $2 AND company_id = $3 RETURNING objective_id
	`, req.Value, krID, companyID).Scan(&objID)

	if err != nil {
		tx.Rollback(ctx)
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật Key Result"})
		return
	}

	tx.Commit(ctx)

	// 3. Recalculate Objective Progress
	recalculateObjectiveProgress(objID)

	// 4. Push Notification if user isn't objective owner
	var objOwnerID int
	var krName string
	err = database.Pool.QueryRow(ctx, `
		SELECT o.owner_id, kr.name FROM objectives o
		JOIN key_results kr ON o.id = kr.objective_id
		WHERE kr.id = $1
	`, krID).Scan(&objOwnerID, &krName)
	if err == nil && objOwnerID != userID {
		go func() {
			bgCtx := context.Background()
			senderSubject, _ := services.GetNotificationSubject(bgCtx, userID)
			groupKey := fmt.Sprintf("kr_checkin:%s", krID)

			notificationData := dtos.NotificationData{
				SubjectCount: 1,
				Subjects:     []dtos.NotificationSubject{senderSubject},
				DiObject: &dtos.NotificationObject{
					Name: krName,
					Type: "checkin",
				},
			}

			_ = services.PushNotification(bgCtx, companyID, objOwnerID, groupKey, "checkin", "/checkins", notificationData)
		}()
	}

	c.JSON(http.StatusOK, gin.H{"message": "Đã cập nhật check-in"})
}

func GetMyPendingCheckIns(c *gin.Context) {
	userID, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	companySlug := c.Param("slug")

	ctx := context.Background()
	companyID, isMember := getCompanyIDFromSlug(ctx, userID, companySlug)
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chưa tham gia công ty này"})
		return
	}

	query := `
		SELECT kr.id, o.name as objective_name, kr.name as key_result_name, 
		       kr.start_value, kr.current_value, kr.target_value, kr.unit
		FROM key_results kr
		JOIN objectives o ON o.id = kr.objective_id
		WHERE kr.company_id = $1 AND (kr.owner_id = $2 OR o.owner_id = $2 OR (kr.owner_id IS NULL AND o.owner_id = $2))
		ORDER BY kr.created_at DESC
	`

	rows, err := database.Pool.Query(ctx, query, companyID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lấy dữ liệu KR"})
		return
	}
	defer rows.Close()

	var pendingList []dtos.PendingCheckInResponse
	var krIDs []int
	krMap := make(map[int]*dtos.PendingCheckInResponse)

	for rows.Next() {
		var p dtos.PendingCheckInResponse
		if err := rows.Scan(&p.KeyResultID, &p.ObjectiveName, &p.KeyResultName, &p.StartValue, &p.CurrentValue, &p.TargetValue, &p.Unit); err == nil {
			progress := 0.0
			if p.TargetValue != p.StartValue {
				progress = (p.CurrentValue - p.StartValue) / (p.TargetValue - p.StartValue) * 100
			}
			if progress > 100 {
				progress = 100
			} else if progress < 0 {
				progress = 0
			}
			p.Progress = math.Round(progress*10) / 10
			p.History = []dtos.CheckInHistoryItem{}

			pendingList = append(pendingList, p)
			krIDs = append(krIDs, p.KeyResultID)
		}
	}

	for i := range pendingList {
		krMap[pendingList[i].KeyResultID] = &pendingList[i]
	}

	if len(krIDs) > 0 {
		historyQuery := `
			SELECT id, key_result_id, value, progress_percent, COALESCE(comment, ''), 
			       COALESCE(problem, ''), COALESCE(cause, ''), COALESCE(solution, ''), 
			       COALESCE(confidence_level, ''), COALESCE(execution_speed, ''), created_at
			FROM check_ins
			WHERE key_result_id = ANY($1)
			ORDER BY created_at DESC
		`
		hRows, err := database.Pool.Query(ctx, historyQuery, krIDs)
		if err == nil {
			defer hRows.Close()
			for hRows.Next() {
				var h dtos.CheckInHistoryItem
				var krID int
				if err := hRows.Scan(&h.ID, &krID, &h.Value, &h.ProgressPercent, &h.Comment, 
					&h.Problem, &h.Cause, &h.Solution, &h.ConfidenceLevel, &h.ExecutionSpeed, &h.CreatedAt); err == nil {
					if p, exists := krMap[krID]; exists {
						// Set last check-in date if it's the most recent
						if p.LastCheckInAt == nil {
							t := h.CreatedAt
							p.LastCheckInAt = &t
							days := int(time.Since(h.CreatedAt).Hours() / 24)
							p.DaysSinceLastCheckIn = days
						}
						// Limit to 5 histories to avoid fat payloads
						if len(p.History) < 5 {
							p.History = append(p.History, h)
						}
					}
				}
			}
		}
	}

	// Calculate DaysSinceLastCheckIn for items with no check-in
	// Let's set it to 999
	for i := range pendingList {
		if pendingList[i].LastCheckInAt == nil {
			pendingList[i].DaysSinceLastCheckIn = 999
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": pendingList})
}
