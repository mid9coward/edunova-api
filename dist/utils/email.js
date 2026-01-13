"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetPasswordEmail = exports.sendVerificationEmail = exports.sendEmail = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
/**
 * Email service class
 */
class EmailService {
    static transporter = null;
    /**
     * Get email configuration based on environment
     */
    static getEmailConfig() {
        const config = {
            host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.EMAIL_PORT || '587', 10),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USERNAME || '',
                pass: process.env.EMAIL_PASSWORD || ''
            }
        };
        // Override for development environment
        if (process.env.NODE_ENV === 'development') {
            config.secure = false;
            config.port = 587;
        }
        return config;
    }
    /**
     * Create and return email transporter
     */
    static getTransporter() {
        if (!this.transporter) {
            const config = this.getEmailConfig();
            this.transporter = nodemailer_1.default.createTransport(config);
        }
        return this.transporter;
    }
    /**
     * Validate email configuration
     */
    static validateConfig() {
        const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_USERNAME', 'EMAIL_PASSWORD', 'EMAIL_FROM', 'FRONTEND_URL'];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }
    }
    /**
     * Send email with proper error handling
     */
    static async sendEmail(options) {
        try {
            this.validateConfig();
            const transporter = this.getTransporter();
            const fromName = process.env.EMAIL_FROM_NAME || 'EDUNOVA LMS';
            const mailOptions = {
                from: `${fromName} <${process.env.EMAIL_FROM}>`,
                to: options.email,
                subject: options.subject,
                html: options.html,
                text: options.text
            };
            await transporter.sendMail(mailOptions);
        }
        catch (error) {
            throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Send verification email
     */
    static async sendVerificationEmail(context) {
        const { email, token, userName } = context;
        const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email/${token}`;
        const displayName = userName || 'bạn';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; font-size: 24px;">Xác thực tài khoản</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Xin chào ${displayName},
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Cảm ơn bạn đã đăng ký tài khoản với EDUNOVA LMS. Để hoàn tất quá trình đăng ký, 
            vui lòng nhấp vào nút bên dưới để xác thực địa chỉ email của bạn:
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 15px 30px; background-color: #4CAF50; 
                    color: white; text-decoration: none; border-radius: 6px; font-weight: bold; 
                    font-size: 16px; transition: background-color 0.3s;">
            Xác thực email
          </a>
        </div>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #856404; font-size: 14px; margin: 0;">
            <strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau 24 giờ.
          </p>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          <p style="color: #888; font-size: 14px; text-align: center;">
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.<br>
            Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:<br>
            <span style="word-break: break-all;">${verificationUrl}</span>
          </p>
        </div>
      </div>
    `;
        await this.sendEmail({
            email,
            subject: 'Xác thực tài khoản EDUNOVA LMS',
            html
        });
    }
    /**
     * Send reset password email
     */
    static async sendResetPasswordEmail(context) {
        const { email, token, userName } = context;
        const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${token}`;
        const displayName = userName || 'bạn';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; font-size: 24px;">Đặt lại mật khẩu</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Xin chào ${displayName},
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản EDUNOVA LMS của bạn. 
            Nhấp vào nút bên dưới để tạo mật khẩu mới:
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 15px 30px; background-color: #2196F3; 
                    color: white; text-decoration: none; border-radius: 6px; font-weight: bold; 
                    font-size: 16px; transition: background-color 0.3s;">
            Đặt lại mật khẩu
          </a>
        </div>

        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #721c24; font-size: 14px; margin: 0;">
            <strong>Bảo mật:</strong> Liên kết này sẽ hết hạn sau 1 giờ để đảm bảo an toàn.
          </p>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          <p style="color: #888; font-size: 14px; text-align: center;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.<br>
            Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:<br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      </div>
    `;
        await this.sendEmail({
            email,
            subject: 'Đặt lại mật khẩu EDUNOVA LMS',
            html
        });
    }
    /**
     * Send welcome email (optional)
     */
    static async sendWelcomeEmail(email, userName) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; font-size: 28px;">Chào mừng đến với EDUNOVA LMS!</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Xin chào ${userName},
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Chúc mừng! Tài khoản của bạn đã được xác thực thành công. 
            Bạn có thể bắt đầu khám phá các khóa học tuyệt vời trên nền tảng của chúng tôi.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/courses" 
             style="display: inline-block; padding: 15px 30px; background-color: #4CAF50; 
                    color: white; text-decoration: none; border-radius: 6px; font-weight: bold; 
                    font-size: 16px;">
            Khám phá khóa học
          </a>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          <p style="color: #888; font-size: 14px; text-align: center;">
            Cảm ơn bạn đã tham gia cộng đồng EDUNOVA LMS!
          </p>
        </div>
      </div>
    `;
        await this.sendEmail({
            email,
            subject: 'Chào mừng đến với EDUNOVA LMS!',
            html
        });
    }
    /**
     * Test email connection
     */
    static async testConnection() {
        try {
            const transporter = this.getTransporter();
            await transporter.verify();
            return true;
        }
        catch (error) {
            console.error('Email connection test failed:', error);
            return false;
        }
    }
}
exports.EmailService = EmailService;
// Export legacy functions for backward compatibility
exports.sendEmail = EmailService.sendEmail.bind(EmailService);
const sendVerificationEmail = (email, token) => EmailService.sendVerificationEmail({ email, token });
exports.sendVerificationEmail = sendVerificationEmail;
const sendResetPasswordEmail = (email, token) => EmailService.sendResetPasswordEmail({ email, token });
exports.sendResetPasswordEmail = sendResetPasswordEmail;
