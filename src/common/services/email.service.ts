import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailUser = this.configService.get('EMAIL_USER');
    const emailPassword = this.configService.get('EMAIL_PASSWORD');

    if (emailUser && emailPassword) {
      // Use Gmail SMTP (you can change this to other providers)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      this.logger.log('Email transporter initialized successfully');
    } else {
      this.logger.warn(
        'Email credentials not found, emails will only be logged',
      );
    }
  }

  /**
   * Send an email
   * In production, this would use a proper email provider like SendGrid, Mailgun, etc.
   * For development, we're just logging the email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // If no transporter, just log the email
      if (!this.transporter) {
        this.logger.debug(`
          -------------------------
          EMAIL SENT (DEVELOPMENT)
          -------------------------
          To: ${options.to}
          Subject: ${options.subject}
          Content: ${options.text || options.html}
          -------------------------
        `);
        return true;
      }

      // Send actual email using nodemailer
      const mailOptions = {
        from: this.configService.get('EMAIL_FROM'),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send a verification email with OTP
   */
  async sendVerificationEmail(
    email: string,
    token: string,
    userName: string = 'User',
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Your Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Hello ${userName},</h1>
          <p style="font-size: 16px; line-height: 1.5;">
            Thank you for signing up! Please use the verification code below to verify your email address:
          </p>
          <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h2 style="color: #007bff; font-size: 32px; letter-spacing: 8px; margin: 0;">${token}</h2>
          </div>
          <p style="font-size: 14px; color: #666;">
            This verification code will expire in 5 minutes.
          </p>
          <p style="font-size: 14px; color: #666;">
            If you did not request this verification, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
      text: `Hello ${userName}, your email verification code is: ${token}. This code will expire in 5 minutes. If you did not request this verification, please ignore this email.`,
    });
  }

  /**
   * Send OTP for general purposes
   */
  async sendOTP(
    email: string,
    otp: string,
    purpose: string = 'verification',
    userName: string = 'User',
    expiryMinutes: number = 5,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Your ${purpose} Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Hello ${userName},</h1>
          <p style="font-size: 16px; line-height: 1.5;">
            Here is your ${purpose} code:
          </p>
          <div style="background-color: #f8f9fa; border: 2px dashed #28a745; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h2 style="color: #28a745; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h2>
          </div>
          <p style="font-size: 14px; color: #666;">
            This code will expire in ${expiryMinutes} minutes.
          </p>
          <p style="font-size: 14px; color: #666;">
            If you did not request this code, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
      text: `Hello ${userName}, your ${purpose} code is: ${otp}. This code will expire in ${expiryMinutes} minutes.`,
    });
  }

  /**
   * Send OTP email specifically for registration verification
   */
  async sendOtpEmail(
    email: string,
    otp: string,
    userName: string = 'User',
  ): Promise<boolean> {
    return this.sendOTP(email, otp, 'email verification', userName, 15); // 15 minutes expiry for registration
  }

  /**
   * Send OTP email for password reset
   */
  async sendPasswordResetOtpEmail(
    email: string,
    otp: string,
    userName: string = 'User',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const locationInfo = ipAddress ? `Request made from IP: ${ipAddress}` : '';
    const deviceInfo = userAgent ? `Device: ${userAgent}` : '';
    const securityInfo = [locationInfo, deviceInfo].filter(Boolean).join('\n');

    return this.sendEmail({
      to: email,
      subject: 'Password Reset - Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password. Use the verification code below to proceed:</p>
          
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          
          <p><strong>Important Security Information:</strong></p>
          <ul>
            <li>This code will expire in <strong>10 minutes</strong></li>
            <li>If you didn't request this password reset, please ignore this email</li>
            <li>Never share this code with anyone</li>
          </ul>
          
          ${
            securityInfo
              ? `
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin-top: 20px;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">Request Details:</h4>
            <pre style="color: #856404; font-size: 12px; margin: 0; white-space: pre-wrap;">${securityInfo}</pre>
          </div>
          `
              : ''
          }
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `Hello ${userName}, your password reset verification code is: ${otp}. This code will expire in 10 minutes. If you didn't request this password reset, please ignore this email.`,
    });
  }

  /**
   * Send password reset confirmation email
   */
  async sendPasswordResetConfirmationEmail(
    email: string,
    userName: string = 'User',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formattedDate = now.toLocaleString('en-US', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const locationInfo = ipAddress ? `IP Address: ${ipAddress}` : '';
    const deviceInfo = userAgent ? `Device/Browser: ${userAgent}` : '';
    const securityInfo = [locationInfo, deviceInfo].filter(Boolean).join('\n');

    return this.sendEmail({
      to: email,
      subject: 'Password Successfully Reset - Security Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Password Successfully Reset</h2>
          <p>Hello ${userName},</p>
          <p>This email confirms that your account password has been successfully reset.</p>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #155724; margin: 0 0 10px 0;">✓ Password Reset Completed</h4>
            <p style="color: #155724; margin: 0;">Your new password is now active and ready to use.</p>
          </div>
          
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #495057; margin: 0 0 15px 0;">Reset Details:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Date & Time:</td>
                <td style="padding: 8px 0; color: #495057;">${formattedDate}</td>
              </tr>
              ${
                locationInfo
                  ? `
              <tr>
                <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Location:</td>
                <td style="padding: 8px 0; color: #495057;">${ipAddress}</td>
              </tr>
              `
                  : ''
              }
              ${
                deviceInfo
                  ? `
              <tr>
                <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Device:</td>
                <td style="padding: 8px 0; color: #495057; word-break: break-word;">${userAgent}</td>
              </tr>
              `
                  : ''
              }
            </table>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin-top: 20px;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Security Notice</h4>
            <p style="color: #856404; margin: 0;">
              If you did not initiate this password reset, your account may have been compromised. 
              Please contact our support team immediately and consider changing your password again.
            </p>
          </div>
          
          <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
            <h4 style="color: #495057;">Security Recommendations:</h4>
            <ul style="color: #6c757d;">
              <li>Use a strong, unique password for your account</li>
              <li>Enable two-factor authentication if available</li>
              <li>Regularly monitor your account for suspicious activity</li>
              <li>Don't share your login credentials with anyone</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated security notification. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `Hello ${userName}, your password has been successfully reset on ${formattedDate}. ${securityInfo ? `Reset details: ${securityInfo}` : ''} If you did not initiate this password reset, please contact support immediately.`,
    });
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(
    email: string,
    userName: string,
    userRole: string = 'client',
  ): Promise<boolean> {
    const roleSpecificContent = this.getRoleSpecificWelcomeContent(userRole);

    return this.sendEmail({
      to: email,
      subject: '🎉 Welcome to Coach App - Your Fitness Journey Starts Here!',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300;">Welcome to Coach App!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your fitness transformation starts today</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: white; margin: 0 20px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${userName}! 🚀</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
              Congratulations on taking the first step towards achieving your fitness goals! 
              We're thrilled to have you join our community of dedicated individuals who are 
              committed to transforming their lives through fitness and wellness.
            </p>

            ${roleSpecificContent}

            <!-- Key Features -->
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 20px 0; text-align: center;">🌟 What Makes Coach App Special</h3>
              
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                  <div style="background-color: #667eea; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">✓</div>
                  <div>
                    <h4 style="margin: 0 0 5px 0; color: #333;">Personalized Training Programs</h4>
                    <p style="margin: 0; color: #666; font-size: 14px;">AI-powered workout plans tailored to your goals, fitness level, and preferences</p>
                  </div>
                </div>
                
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                  <div style="background-color: #667eea; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">✓</div>
                  <div>
                    <h4 style="margin: 0 0 5px 0; color: #333;">Expert Coach Matching</h4>
                    <p style="margin: 0; color: #666; font-size: 14px;">Connect with certified trainers who specialize in your specific fitness goals</p>
                  </div>
                </div>
                
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                  <div style="background-color: #667eea; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">✓</div>
                  <div>
                    <h4 style="margin: 0 0 5px 0; color: #333;">Progress Tracking & Analytics</h4>
                    <p style="margin: 0; color: #666; font-size: 14px;">Advanced metrics and insights to keep you motivated and on track</p>
                  </div>
                </div>
                
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                  <div style="background-color: #667eea; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">✓</div>
                  <div>
                    <h4 style="margin: 0 0 5px 0; color: #333;">Nutrition Guidance</h4>
                    <p style="margin: 0; color: #666; font-size: 14px;">Comprehensive meal plans and nutritional support for optimal results</p>
                  </div>
                </div>
                
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                  <div style="background-color: #667eea; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">✓</div>
                  <div>
                    <h4 style="margin: 0 0 5px 0; color: #333;">24/7 Community Support</h4>
                    <p style="margin: 0; color: #666; font-size: 14px;">Join a supportive community of like-minded individuals on their fitness journey</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 25px; margin: 30px 0; color: white;">
              <h3 style="margin: 0 0 15px 0; text-align: center;">🎯 Ready to Get Started?</h3>
              <div style="text-align: center;">
                <p style="margin: 0 0 20px 0; opacity: 0.9;">Complete your profile setup to unlock personalized recommendations</p>
                <a href="${this.configService.get('FRONTEND_URL') || 'https://coachapp.com'}/onboarding" 
                   style="display: inline-block; background-color: white; color: #667eea; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 0 10px 10px 0;">
                  Complete Profile Setup
                </a>
                <a href="${this.configService.get('FRONTEND_URL') || 'https://coachapp.com'}/browse-coaches" 
                   style="display: inline-block; background-color: rgba(255,255,255,0.2); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 0 10px 10px 0; border: 1px solid rgba(255,255,255,0.3);">
                  Browse Coaches
                </a>
              </div>
            </div>

            <!-- Success Stats -->
            <div style="background-color: #e8f5e8; border-radius: 10px; padding: 25px; margin: 30px 0; text-align: center;">
              <h3 style="color: #28a745; margin: 0 0 20px 0;">📊 Our Community's Success</h3>
              <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;">
                <div>
                  <div style="font-size: 24px; font-weight: bold; color: #28a745;">10K+</div>
                  <div style="font-size: 12px; color: #666;">Active Users</div>
                </div>
                <div>
                  <div style="font-size: 24px; font-weight: bold; color: #28a745;">500+</div>
                  <div style="font-size: 12px; color: #666;">Certified Coaches</div>
                </div>
                <div>
                  <div style="font-size: 24px; font-weight: bold; color: #28a745;">95%</div>
                  <div style="font-size: 12px; color: #666;">Success Rate</div>
                </div>
                <div>
                  <div style="font-size: 24px; font-weight: bold; color: #28a745;">1M+</div>
                  <div style="font-size: 12px; color: #666;">Workouts Completed</div>
                </div>
              </div>
            </div>

            <!-- Support -->
            <div style="border-top: 1px solid #eee; padding-top: 25px; margin-top: 30px;">
              <h4 style="color: #333; margin: 0 0 15px 0;">Need Help Getting Started?</h4>
              <p style="color: #666; margin: 0 0 15px 0; line-height: 1.5;">
                Our support team is here to help you every step of the way. Whether you have questions 
                about setting up your profile, choosing a coach, or using our features, we're just a click away!
              </p>
              <p style="margin: 0;">
                <a href="mailto:support@coachapp.com" style="color: #667eea; text-decoration: none;">📧 support@coachapp.com</a> | 
                <a href="${this.configService.get('FRONTEND_URL') || 'https://coachapp.com'}/help" style="color: #667eea; text-decoration: none;">📚 Help Center</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #333; color: white; padding: 20px; text-align: center; margin: 0 20px;">
            <p style="margin: 0 0 10px 0; font-size: 14px;">Follow us for daily motivation and tips!</p>
            <div style="margin-bottom: 15px;">
              <a href="#" style="color: white; text-decoration: none; margin: 0 10px;">📱 Instagram</a>
              <a href="#" style="color: white; text-decoration: none; margin: 0 10px;">📘 Facebook</a>
              <a href="#" style="color: white; text-decoration: none, margin: 0 10px;">🐦 Twitter</a>
              <a href="#" style="color: white; text-decoration: none, margin: 0 10px;">📺 YouTube</a>
            </div>
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
              © 2025 Coach App. All rights reserved.<br>
              You're receiving this email because you signed up for Coach App.
            </p>
          </div>
        </div>
      `,
      text: `Welcome to Coach App, ${userName}! Your fitness journey starts here. We're excited to have you join our community of 10K+ active users working with 500+ certified coaches. Complete your profile setup to get personalized recommendations. Need help? Contact us at support@coachapp.com`,
    });
  }

  /**
   * Get role-specific welcome content
   */
  private getRoleSpecificWelcomeContent(userRole: string): string {
    switch (userRole.toLowerCase()) {
      case 'coach':
        return `
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #856404; margin: 0 0 15px 0;">🏆 Welcome to Our Coach Community!</h3>
            <p style="color: #856404; margin: 0; line-height: 1.5;">
              As a certified coach, you'll have access to powerful tools to manage your clients, 
              create custom workout plans, track progress, and grow your fitness business. 
              Start building your profile to attract clients who match your expertise!
            </p>
          </div>
        `;
      case 'client':
      default:
        return `
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #0c5460; margin: 0 0 15px 0;">🎯 Your Fitness Journey Awaits!</h3>
            <p style="color: #0c5460; margin: 0; line-height: 1.5;">
              Whether you're looking to lose weight, build muscle, improve endurance, or simply maintain 
              a healthy lifestyle, our platform will connect you with the perfect coach and create 
              a personalized plan that fits your schedule and goals.
            </p>
          </div>
        `;
    }
  }
}
