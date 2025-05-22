import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileUploadService } from './services/file-upload.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';

@Module({
  imports: [ConfigModule],
  providers: [FileUploadService, EmailService, SmsService],
  exports: [FileUploadService, EmailService, SmsService],
})
export class CommonModule {}
