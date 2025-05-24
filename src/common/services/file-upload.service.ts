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
    this.ensureDirectoryExists(path.join(this.uploadDir, 'workouts'));
    this.ensureDirectoryExists(path.join(this.uploadDir, 'workouts', 'images'));
    this.ensureDirectoryExists(path.join(this.uploadDir, 'workouts', 'videos'));
    this.ensureDirectoryExists(path.join(this.uploadDir, 'workouts', 'pdfs'));
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

  /**
   * Upload workout media files (images, videos, PDFs)
   */
  async uploadWorkoutMedia(file: Express.Multer.File, mediaType: 'image' | 'video' | 'pdf'): Promise<string> {
    const filename = `${uuidv4()}_${file.originalname.replace(/\s+/g, '_')}`;
    const subDir = mediaType === 'image' ? 'images' : mediaType === 'video' ? 'videos' : 'pdfs';
    const filePath = path.join(this.uploadDir, 'workouts', subDir, filename);

    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, file.buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          // In a real production app, return a URL to the file
          // For local development, we'll use a relative path
          resolve(`/uploads/workouts/${subDir}/${filename}`);
        }
      });
    });
  }

  /**
   * Validate file type for workout media
   */
  validateWorkoutMediaFile(file: Express.Multer.File, mediaType: 'image' | 'video' | 'pdf'): boolean {
    const allowedTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm'],
      pdf: ['application/pdf']
    };

    return allowedTypes[mediaType].includes(file.mimetype);
  }

  /**
   * Get max file size for media type (in bytes)
   */
  getMaxFileSize(mediaType: 'image' | 'video' | 'pdf'): number {
    const maxSizes = {
      image: 5 * 1024 * 1024, // 5MB
      video: 100 * 1024 * 1024, // 100MB
      pdf: 10 * 1024 * 1024 // 10MB
    };

    return maxSizes[mediaType];
  }
}
