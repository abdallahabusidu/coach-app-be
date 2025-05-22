import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    // In a real production environment, you would likely use a cloud storage service
    // like AWS S3, Google Cloud Storage, or Azure Blob Storage
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureDirectoryExists(this.uploadDir);
    this.ensureDirectoryExists(path.join(this.uploadDir, 'profile-pictures'));
    this.ensureDirectoryExists(path.join(this.uploadDir, 'certificates'));
    this.ensureDirectoryExists(path.join(this.uploadDir, 'package-images'));
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async uploadProfilePicture(file: any): Promise<string> {
    const filename = `${uuidv4()}_${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(this.uploadDir, 'profile-pictures', filename);

    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, file.buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          // In a real production app, return a URL to the file
          // For local development, we'll use a relative path
          resolve(`/uploads/profile-pictures/${filename}`);
        }
      });
    });
  }

  async uploadCertificate(file: Express.Multer.File): Promise<string> {
    const filename = `${uuidv4()}_${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(this.uploadDir, 'certificates', filename);

    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, file.buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          // In a real production app, return a URL to the file
          // For local development, we'll use a relative path
          resolve(`/uploads/certificates/${filename}`);
        }
      });
    });
  }

  async uploadPackageImage(file: Express.Multer.File): Promise<string> {
    const filename = `${uuidv4()}_${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(this.uploadDir, 'package-images', filename);

    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, file.buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          // In a real production app, return a URL to the file
          // For local development, we'll use a relative path
          resolve(`/uploads/package-images/${filename}`);
        }
      });
    });
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Extract the file path from the URL
    const filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));

    // Check if file exists before deleting
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
