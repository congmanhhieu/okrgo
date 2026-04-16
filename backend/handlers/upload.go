package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func UploadAvatar(c *gin.Context) {
	// Parse multipart form
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không tìm thấy file tải lên"})
		return
	}

	// Tự tạo folder uploads/avatars nếu chưa có
	uploadDir := "./uploads/avatars"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo thư mục upload"})
		return
	}

	// Tạo tên file duy nhất chống đụng độ
	ext := filepath.Ext(file.Filename)
	if !isValidImageExt(ext) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chỉ chấp nhận file ảnh (jpg, png, jpeg, webp, gif)"})
		return
	}

	userID, _ := c.Get("user_id")
	newFileName := fmt.Sprintf("%v_%d%s", userID, time.Now().Unix(), ext)
	dst := filepath.Join(uploadDir, newFileName)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lưu file thất bại"})
		return
	}

	// Trả về url
	fileURL := fmt.Sprintf("/uploads/avatars/%s", newFileName)
	c.JSON(http.StatusOK, gin.H{"url": fileURL})
}

func isValidImageExt(ext string) bool {
	ext = strings.ToLower(ext)
	return ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp" || ext == ".gif"
}

// UploadGiftImage handles image upload for gifts
func UploadGiftImage(c *gin.Context) {
	_, ok := getUserIDInt(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vui lòng chọn ảnh"})
		return
	}

	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ảnh quá lớn, tối đa 5MB"})
		return
	}

	ext := filepath.Ext(file.Filename)
	if !isValidImageExt(ext) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chỉ chấp nhận ảnh JPG, PNG, GIF, WEBP"})
		return
	}

	uploadDir := "./uploads/gifts"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo thư mục upload"})
		return
	}

	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Upload thất bại"})
		return
	}

	imageURL := fmt.Sprintf("/uploads/gifts/%s", filename)
	c.JSON(http.StatusOK, gin.H{"url": imageURL})
}
