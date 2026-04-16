package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"okrgo/database"
	"okrgo/dtos"
	"okrgo/models"
	"okrgo/utils"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var req dtos.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	var user models.User
	query := `
		INSERT INTO users (name, email, phone, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, email, phone, created_at
	`
	err = pgxscan.Get(context.Background(), database.Pool, &user, query, req.Name, strings.ToLower(req.Email), req.Phone, string(hashedPassword))
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value") {
			c.JSON(http.StatusConflict, gin.H{"error": "Email hoặc Số điện thoại đã được đăng ký"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully", "user": user})
}

func Login(c *gin.Context) {
	var req dtos.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	var user models.User
	query := `SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1`
	err := pgxscan.Get(context.Background(), database.Pool, &user, query, strings.ToLower(req.Email))
	if err != nil {
		if pgxscan.NotFound(err) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Create JWT token
	token, err := generateToken(fmt.Sprint(user.ID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, dtos.AuthResponse{
		Token: token,
		User:  user,
	})
}

func ForgotPassword(c *gin.Context) {
	var req dtos.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	ctx := context.Background()
	var userID int
	err := database.Pool.QueryRow(ctx, "SELECT id FROM users WHERE email = $1", strings.ToLower(req.Email)).Scan(&userID)
	if err != nil {
		// Do not leak existence of email. Just return 200.
		c.JSON(http.StatusOK, gin.H{"message": "If the email is registered, a password reset link has been sent."})
		return
	}

	// Generate secure hex token
	bytesToken := make([]byte, 16)
	if _, err := rand.Read(bytesToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error generating token"})
		return
	}
	tokenStr := hex.EncodeToString(bytesToken)

	// Save token in DB, expires in 30 minutes
	expiresAt := time.Now().Add(30 * time.Minute)
	_, err = database.Pool.Exec(ctx, `
		INSERT INTO password_resets (user_id, token, expires_at) 
		VALUES ($1, $2, $3)`, userID, tokenStr, expiresAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store token"})
		return
	}

	// Send email
	err = utils.SendResetPasswordEmail(req.Email, tokenStr)
	if err != nil {
		// Logs err to server console for debugging. Don't block user if Email service is down in dev.
		fmt.Printf("Error sending email to %s: %v\n", req.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send email."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "If the email is registered, a password reset link has been sent."})
}

func ResetPassword(c *gin.Context) {
	var req dtos.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	ctx := context.Background()

	// Check token validity
	var userID int
	var expiresAt time.Time
	err := database.Pool.QueryRow(ctx, "SELECT user_id, expires_at FROM password_resets WHERE token = $1", req.Token).Scan(&userID, &expiresAt)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token is invalid or has already been used"})
		return
	}

	if time.Now().After(expiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token has expired"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		return
	}

	// Transaction to update password and clear token
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		return
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, "UPDATE users SET password_hash = $1 WHERE id = $2", string(hashedPassword), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	_, err = tx.Exec(ctx, "DELETE FROM password_resets WHERE token = $1", req.Token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clean up token"})
		return
	}

	err = tx.Commit(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func generateToken(userID string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "fallback_secret"
	}

	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
