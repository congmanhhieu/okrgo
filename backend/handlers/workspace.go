package handlers

import (
	"context"
	"net/http"
	"strings"
	"okrgo/database"
	"okrgo/dtos"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
)

func CreateWorkspace(c *gin.Context) {
	// Parse req
	var req dtos.CreateWorkspaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDRaw.(string) // In middleware it should be parsed as string or directly as string from JWT

	slug := strings.ToLower(strings.TrimSpace(req.Slug))
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Slug cannot be empty"})
		return
	}

	ctx := context.Background()
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback(ctx)

	// 1. Insert Company
	var companyID int
	err = tx.QueryRow(ctx, "INSERT INTO companies (name, slug) VALUES ($1, $2) RETURNING id", req.Name, slug).Scan(&companyID)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value") {
			c.JSON(http.StatusConflict, gin.H{"error": "Slug URL này đã có người sử dụng. Vui lòng chọn tên khác."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workspace", "details": err.Error()})
		return
	}

	// 2. Insert CompanyUser as Admin
	_, err = tx.Exec(ctx, "INSERT INTO company_users (company_id, user_id, role) VALUES ($1, $2, 'admin')", companyID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign admin role"})
		return
	}

	// 3. Prepopulate default star criteria
	defaultCriteria := []string{
		"Bạn là người cam kết",
		"Bạn rất sáng tạo",
		"Bạn là chiến binh",
		"Bạn là người chủ động",
		"Bạn rất đúng hẹn",
		"Cảm ơn bạn đã lắng nghe",
		"Cảm ơn bạn đã hỗ trợ",
	}

	for _, name := range defaultCriteria {
		_, err = tx.Exec(ctx, `
			INSERT INTO star_criteria (company_id, name, category, stars)
			VALUES ($1, $2, 'culture,objective,project,task', 10)
		`, companyID, name)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepopulate criteria"})
			return
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction commit failed"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Workspace created successfully",
		"slug":    slug,
	})
}

func GetMyWorkspaces(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDRaw.(string)

	var workspaces []dtos.WorkspaceSummary
	query := `
		SELECT c.id, c.name, c.slug, cu.role, c.created_at
		FROM companies c
		INNER JOIN company_users cu ON c.id = cu.company_id
		WHERE cu.user_id = $1
		ORDER BY c.created_at DESC
	`
	err := pgxscan.Select(context.Background(), database.Pool, &workspaces, query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workspaces"})
		return
	}

	// Make sure it returns empty array instead of null
	if workspaces == nil {
		workspaces = []dtos.WorkspaceSummary{}
	}

	c.JSON(http.StatusOK, workspaces)
}

func GetMyInvitations(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDRaw.(string)

	ctx := context.Background()
	
	// 1. Get user email
	var email string
	err := database.Pool.QueryRow(ctx, "SELECT email FROM users WHERE id = $1", userID).Scan(&email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}

	// 2. Query invitations
	var invitations []dtos.InvitationSummary
	query := `
		SELECT ci.id, c.id as company_id, c.name, c.slug, ci.role, ci.status, ci.created_at
		FROM company_invitations ci
		INNER JOIN companies c ON c.id = ci.company_id
		WHERE ci.email = $1 AND ci.status = 'pending'
		ORDER BY ci.created_at DESC
	`
	err = pgxscan.Select(ctx, database.Pool, &invitations, query, email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invitations"})
		return
	}

	if invitations == nil {
		invitations = []dtos.InvitationSummary{}
	}

	c.JSON(http.StatusOK, invitations)
}

func AcceptInvitation(c *gin.Context) {
	invitationID := c.Param("id")
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDRaw.(string)

	ctx := context.Background()
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback(ctx)

	// 1. Get the pending invitation
	var compID int
	var role string
	var email string
	err = tx.QueryRow(ctx, "SELECT company_id, role, email FROM company_invitations WHERE id = $1 AND status = 'pending' FOR UPDATE", invitationID).Scan(&compID, &role, &email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found or already accepted"})
		return
	}

	// 2. Assure user email matches invitation email
	var myEmail string
	err = tx.QueryRow(ctx, "SELECT email FROM users WHERE id = $1", userID).Scan(&myEmail)
	if err != nil || myEmail != email {
		c.JSON(http.StatusForbidden, gin.H{"error": "This invitation Does not belong to you"})
		return
	}

	// 3. Update status = accepted
	_, err = tx.Exec(ctx, "UPDATE company_invitations SET status = 'accepted' WHERE id = $1", invitationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to accept invitation"})
		return
	}

	// 4. Insert into company_users
	_, err = tx.Exec(ctx, "INSERT INTO company_users (company_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", compID, userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join company"})
		return
	}
	
	err = tx.Commit(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to finalize acceptance"})
		return
	}

	// GET company slug
	var slug string
	_ = database.Pool.QueryRow(ctx, "SELECT slug FROM companies WHERE id = $1", compID).Scan(&slug)

	c.JSON(http.StatusOK, gin.H{
		"message": "Accepted",
		"slug": slug,
	})
}
