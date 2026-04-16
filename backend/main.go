package main

import (
	"log"
	"net/http"
	"os"

	"okrgo/database"
	"okrgo/handlers"
	"okrgo/middlewares"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load env
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found. Proceeding with environment variables.")
	}

	// Init DB
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

	// Init Gin Router
	r := gin.Default()

	// CORS configuration (basic example)
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	api := r.Group("/api")

	// Upload route (Needs auth usually)
	upload := api.Group("/upload")
	upload.Use(middlewares.AuthMiddleware())
	{
		upload.POST("/avatar", handlers.UploadAvatar)
	}

	// Serve static files
	r.Static("/uploads", "./uploads")
	
	// Public routes
	auth := api.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
		auth.POST("/forgot-password", handlers.ForgotPassword)
		auth.POST("/reset-password", handlers.ResetPassword)
	}

	// Protected routes
	protected := api.Group("/users")
	protected.Use(middlewares.AuthMiddleware())
	{
		protected.GET("/me", func(c *gin.Context) {
			userID, _ := c.Get("user_id")
			c.JSON(http.StatusOK, gin.H{
				"message": "Access granted",
				"user_id": userID,
			})
		})
		protected.POST("/change-password", handlers.ChangePassword)
	}

	workspaces := api.Group("/workspaces")
	workspaces.Use(middlewares.AuthMiddleware())
	{
		workspaces.GET("", handlers.GetMyWorkspaces)
		workspaces.POST("", handlers.CreateWorkspace)
		workspaces.GET("/invitations", handlers.GetMyInvitations)
		workspaces.POST("/invitations/:id/accept", handlers.AcceptInvitation)
		
		// Profile
		workspaces.GET("/:slug/profile", handlers.GetProfile)
		workspaces.PUT("/:slug/profile", handlers.UpdateProfile)
		workspaces.PUT("/:slug/avatar", handlers.UpdateAvatar)

		// Departments
		workspaces.GET("/:slug/departments", handlers.GetDepartments)
		workspaces.POST("/:slug/departments", handlers.CreateDepartment)
		workspaces.PUT("/:slug/departments/:id", handlers.UpdateDepartment)
		workspaces.DELETE("/:slug/departments/:id", handlers.DeleteDepartment)

		// Users Search Data
		workspaces.GET("/:slug/users/search", handlers.SearchUsers)

		// Staff management
		workspaces.GET("/:slug/staff", handlers.GetStaffList)
		workspaces.POST("/:slug/staff", handlers.CreateStaff)
		workspaces.PUT("/:slug/staff/:userId", handlers.UpdateStaff)
		workspaces.DELETE("/:slug/staff/:userId", handlers.DeleteStaff)

		// Department dropdown (for staff form)
		workspaces.GET("/:slug/departments/dropdown", handlers.GetDepartmentDropdown)

		// OKRs
		workspaces.GET("/:slug/okrs", handlers.GetOKRs)
		workspaces.POST("/:slug/okrs", handlers.CreateObjective)
		workspaces.PUT("/:slug/okrs/:id", handlers.UpdateObjective)
		workspaces.DELETE("/:slug/okrs/:id", handlers.DeleteObjective)

		workspaces.POST("/:slug/okrs/:id/key-results", handlers.CreateKeyResult)
		workspaces.PUT("/:slug/okrs/key-results/:krId", handlers.UpdateKeyResult)
		workspaces.DELETE("/:slug/okrs/key-results/:krId", handlers.DeleteKeyResult)
		workspaces.POST("/:slug/okrs/key-results/:krId/check-in", handlers.CheckInKeyResult)
		workspaces.GET("/:slug/okrs/my-check-ins", handlers.GetMyPendingCheckIns)

		// Cycles
		workspaces.GET("/:slug/cycles", handlers.GetCycles)
		workspaces.POST("/:slug/cycles", handlers.CreateCycle)
		workspaces.PUT("/:slug/cycles/:id", handlers.UpdateCycle)
		workspaces.DELETE("/:slug/cycles/:id", handlers.DeleteCycle)

		// Star Criteria
		workspaces.GET("/:slug/star-criteria", handlers.GetStarCriteria)
		workspaces.POST("/:slug/star-criteria", handlers.CreateStarCriteria)
		workspaces.PUT("/:slug/star-criteria/:id", handlers.UpdateStarCriteria)
		workspaces.DELETE("/:slug/star-criteria/:id", handlers.DeleteStarCriteria)
		// Dashboard & Reporting
		workspaces.GET("/:slug/dashboard", handlers.GetDashboardMetrics)

		// Settings
		workspaces.GET("/:slug/settings", handlers.GetSettings)
		workspaces.PUT("/:slug/settings", handlers.UpdateSettings)

		// Gifts
		workspaces.GET("/:slug/gifts", handlers.GetGifts)
		workspaces.POST("/:slug/gifts", handlers.CreateGift)
		workspaces.PUT("/:slug/gifts/:id", handlers.UpdateGift)
		workspaces.DELETE("/:slug/gifts/:id", handlers.DeleteGift)
		workspaces.POST("/:slug/gifts/upload", handlers.UploadGiftImage)

		// Gift Orders
		workspaces.GET("/:slug/gift-orders", handlers.GetGiftOrders)
		workspaces.PUT("/:slug/gift-orders/:id/status", handlers.UpdateGiftOrderStatus)
		
		workspaces.POST("/:slug/gifts/redeem", handlers.RedeemGifts)
		workspaces.GET("/:slug/gifts/my-orders", handlers.GetMyGiftOrders)

		// Todaylist
		workspaces.GET("/:slug/todaylist", handlers.GetTodayList)
		workspaces.POST("/:slug/todaylist", handlers.CreateTodayList)
		workspaces.PUT("/:slug/todaylist/:id", handlers.UpdateTodayList)
		workspaces.PUT("/:slug/todaylist/:id/toggle", handlers.ToggleTodayList)
		workspaces.DELETE("/:slug/todaylist/:id", handlers.DeleteTodayList)

		// Tasks
		workspaces.GET("/:slug/tasks", handlers.GetTasks)
		workspaces.POST("/:slug/tasks", handlers.CreateTask)
		workspaces.PUT("/:slug/tasks/:id", handlers.UpdateTask)
		workspaces.PUT("/:slug/tasks/:id/status", handlers.UpdateTaskStatus)
		workspaces.DELETE("/:slug/tasks/:id", handlers.DeleteTask)

		// Feedbacks
		workspaces.GET("/:slug/feedbacks", handlers.GetFeedbacks)
		workspaces.POST("/:slug/feedbacks", handlers.CreateFeedback)

		// Kudos
		workspaces.GET("/:slug/kudos", handlers.GetKudos)
		workspaces.GET("/:slug/kudos/leaderboard", handlers.GetKudosLeaderboard)
		workspaces.POST("/:slug/kudos", handlers.CreateKudo)

		// Notifications
		workspaces.GET("/:slug/notifications", handlers.GetNotifications)
		workspaces.PUT("/:slug/notifications/read-all", handlers.MarkAllNotificationsRead)
		workspaces.PUT("/:slug/notifications/:id/read", handlers.MarkNotificationRead)
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server is running on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
