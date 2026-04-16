package utils

import (
	"bytes"
	"fmt"
	"net/smtp"
	"os"
)

// SendResetPasswordEmail sends an email containing the reset password link
func SendResetPasswordEmail(toEmail string, resetToken string) error {
	// Retrieve from .env
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"
	smtpUser := os.Getenv("GOOGLE_EMAIL_ADDRESS")
	smtpPass := os.Getenv("GOOGLE_APP_PASSWORD")
	smtpFrom := smtpUser // Use the same email
	frontendURL := os.Getenv("FRONTEND_URL") // e.g. http://localhost:3000

	if smtpUser == "" || smtpPass == "" || frontendURL == "" {
		return fmt.Errorf("missing GOOGLE_EMAIL_ADDRESS or GOOGLE_APP_PASSWORD or FRONTEND_URL in .env")
	}

	resetLink := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, resetToken)

	// Build the email template
	subject := "Subject: Yêu cầu đặt lại mật khẩu - OKRgo\r\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	
	body := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { font-family: 'Inter', sans-serif; background-color: #F5F7FA; color: #1E2A3A; padding: 20px; }
			.container { max-width: 500px; margin: 0 auto; background-color: #FFFFFF; padding: 30px; border-radius: 12px; border: 1px solid #E2E8F0; }
			.btn { display: inline-block; padding: 12px 24px; background-color: #00b24e; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;}
			.footer { margin-top: 30px; font-size: 12px; color: #9CA3AF; }
		</style>
	</head>
	<body>
		<div class="container">
			<h2>Yêu cầu Đặt lại Mật khẩu</h2>
			<p>Chào bạn,</p>
			<p>Chúng tôi nhận được yêu cầu cài đặt lại mật khẩu cho tài khoản OKRgo của bạn.</p>
			<p>Vui lòng ấn vào nút bên dưới để tiến hành đổi mật khẩu mới (Đường dẫn này có hiệu lực trong 30 phút).</p>
			<a href="%s" class="btn">Đặt lại mật khẩu</a>
			<p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
			<div class="footer">
				Trân trọng,<br>
				Đội ngũ hỗ trợ OKRgo.
			</div>
		</div>
	</body>
	</html>
	`, resetLink)

	var msg bytes.Buffer
	msg.WriteString(subject)
	msg.WriteString(mime)
	msg.WriteString(body)

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)

	err := smtp.SendMail(addr, auth, smtpFrom, []string{toEmail}, msg.Bytes())
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}

// SendInvitationEmail sends an email notifying a user they've been added to a company
func SendInvitationEmail(toEmail string, userName string, companySlug string) error {
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"
	smtpUser := os.Getenv("GOOGLE_EMAIL_ADDRESS")
	smtpPass := os.Getenv("GOOGLE_APP_PASSWORD")
	smtpFrom := smtpUser
	frontendURL := os.Getenv("FRONTEND_URL")

	if smtpUser == "" || smtpPass == "" || frontendURL == "" {
		return fmt.Errorf("missing email configuration")
	}

	loginLink := fmt.Sprintf("%s/login", frontendURL)

	subject := "Subject: Bạn đã được thêm vào tổ chức - OKRgo\r\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"

	body := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { font-family: 'Inter', sans-serif; background-color: #F5F7FA; color: #1E2A3A; padding: 20px; }
			.container { max-width: 500px; margin: 0 auto; background-color: #FFFFFF; padding: 30px; border-radius: 12px; border: 1px solid #E2E8F0; }
			.btn { display: inline-block; padding: 12px 24px; background-color: #00b24e; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;}
			.footer { margin-top: 30px; font-size: 12px; color: #9CA3AF; }
		</style>
	</head>
	<body>
		<div class="container">
			<h2>Chào mừng bạn đến với OKRgo!</h2>
			<p>Xin chào <strong>%s</strong>,</p>
			<p>Bạn đã được thêm vào tổ chức <strong>%s</strong> trên hệ thống OKRgo.</p>
			<p>Hãy đăng nhập để bắt đầu quản lý mục tiêu và công việc cùng đồng nghiệp.</p>
			<a href="%s" class="btn">Đăng nhập ngay</a>
			<div class="footer">
				Trân trọng,<br>
				Đội ngũ hỗ trợ OKRgo.
			</div>
		</div>
	</body>
	</html>
	`, userName, companySlug, loginLink)

	var msg bytes.Buffer
	msg.WriteString(subject)
	msg.WriteString(mime)
	msg.WriteString(body)

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)

	err := smtp.SendMail(addr, auth, smtpFrom, []string{toEmail}, msg.Bytes())
	if err != nil {
		return fmt.Errorf("failed to send invitation email: %v", err)
	}

	return nil
}
