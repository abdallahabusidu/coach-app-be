import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import { ClientProfileEntity as TraineeProfileEntity } from '../../client/entities/client-profile.entity';
import {
  TraineeProgressEntity,
  SubscriptionStatus,
} from '../../dashboard/entities/trainee-progress.entity';
import { CsvImportResultDto } from '../dtos/subscribed-trainees.dto';

interface CsvTraineeData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  fitnessGoal?: string;
  fitnessLevel?: string;
  bodyShape?: string;
  mealsPerDay?: number;
  exerciseFrequency?: number;
  sessionDuration?: number;
  gymAccess?: boolean;
  healthConsiderations?: string;
  allergies?: string;
  coachGenderPreference?: string;
  coachingMode?: string;
  budget?: string;
  preferredTime?: string;
  targetWeight?: number;
  subscriptionStatus?: string;
}

@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(TraineeProfileEntity)
    private readonly traineeProfileRepository: Repository<TraineeProfileEntity>,

    @InjectRepository(TraineeProgressEntity)
    private readonly traineeProgressRepository: Repository<TraineeProgressEntity>,
  ) {}

  /**
   * Import trainees from CSV file
   */
  async importTraineesFromCsv(
    file: Express.Multer.File,
    coachId: string,
  ): Promise<CsvImportResultDto> {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV format');
    }

    const result: CsvImportResultDto = {
      imported: 0,
      failed: 0,
      total: 0,
      errors: [],
      importedIds: [],
    };

    try {
      const csvData = await this.parseCsvFile(file.buffer);
      result.total = csvData.length;

      for (const [index, row] of csvData.entries()) {
        try {
          const traineeId = await this.importSingleTrainee(row, coachId);
          if (traineeId) {
            result.imported++;
            result.importedIds.push(traineeId);
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Row ${index + 2}: ${error.message}`);
          this.logger.error(
            `Failed to import row ${index + 2}:`,
            error.message,
          );
        }
      }

      this.logger.log(
        `CSV Import completed: ${result.imported} imported, ${result.failed} failed`,
      );
      return result;
    } catch (error) {
      this.logger.error('CSV Import failed:', error.message);
      throw new BadRequestException(
        `Failed to process CSV file: ${error.message}`,
      );
    }
  }

  /**
   * Get CSV template with all available fields
   */
  getCsvTemplate(): string {
    const headers = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'password',
      'age',
      'weight',
      'height',
      'gender',
      'fitnessGoal',
      'fitnessLevel',
      'bodyShape',
      'mealsPerDay',
      'exerciseFrequency',
      'sessionDuration',
      'gymAccess',
      'healthConsiderations',
      'allergies',
      'coachGenderPreference',
      'coachingMode',
      'budget',
      'preferredTime',
      'targetWeight',
      'subscriptionStatus',
    ];

    const sampleData = [
      'John',
      'Doe',
      'john.doe@example.com',
      '+1234567890',
      'defaultPassword123',
      '30',
      '75',
      '180',
      'male',
      'weight_loss',
      'beginner',
      'average',
      '3',
      '4',
      '60',
      'true',
      'none',
      'none',
      'no_preference',
      'online',
      'moderate',
      'morning',
      '70',
      'active',
    ];

    return headers.join(',') + '\n' + sampleData.join(',');
  }

  /**
   * Validate CSV data structure
   */
  async validateCsvStructure(
    file: Express.Multer.File,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const csvData = await this.parseCsvFile(file.buffer);

      if (csvData.length === 0) {
        errors.push('CSV file is empty');
        return { isValid: false, errors };
      }

      const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
      const firstRow = csvData[0];

      for (const field of requiredFields) {
        if (!firstRow.hasOwnProperty(field) || !firstRow[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // Validate email format
      for (const [index, row] of csvData.entries()) {
        if (row.email && !this.isValidEmail(row.email)) {
          errors.push(`Row ${index + 2}: Invalid email format`);
        }

        if (row.phone && !this.isValidPhone(row.phone)) {
          errors.push(`Row ${index + 2}: Invalid phone format`);
        }
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Failed to parse CSV: ${error.message}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Parse CSV file buffer into array of objects
   */
  private parseCsvFile(buffer: Buffer): Promise<CsvTraineeData[]> {
    return new Promise((resolve, reject) => {
      const results: CsvTraineeData[] = [];
      const stream = Readable.from(buffer.toString());

      stream
        .pipe(csv())
        .on('data', (data) => {
          // Transform string values to appropriate types
          const transformedData = this.transformCsvRow(data);
          results.push(transformedData);
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Transform CSV row data to appropriate types
   */
  private transformCsvRow(row: any): CsvTraineeData {
    return {
      firstName: row.firstName?.trim(),
      lastName: row.lastName?.trim(),
      email: row.email?.trim().toLowerCase(),
      phone: row.phone?.trim(),
      password: row.password?.trim() || 'defaultPassword123',
      age: row.age ? parseInt(row.age) : undefined,
      weight: row.weight ? parseFloat(row.weight) : undefined,
      height: row.height ? parseFloat(row.height) : undefined,
      gender: row.gender?.trim().toLowerCase(),
      fitnessGoal: row.fitnessGoal?.trim(),
      fitnessLevel: row.fitnessLevel?.trim(),
      bodyShape: row.bodyShape?.trim(),
      mealsPerDay: row.mealsPerDay ? parseInt(row.mealsPerDay) : undefined,
      exerciseFrequency: row.exerciseFrequency
        ? parseInt(row.exerciseFrequency)
        : undefined,
      sessionDuration: row.sessionDuration
        ? parseInt(row.sessionDuration)
        : undefined,
      gymAccess: row.gymAccess
        ? row.gymAccess.toLowerCase() === 'true'
        : undefined,
      healthConsiderations: row.healthConsiderations?.trim(),
      allergies: row.allergies?.trim(),
      coachGenderPreference: row.coachGenderPreference?.trim(),
      coachingMode: row.coachingMode?.trim(),
      budget: row.budget?.trim(),
      preferredTime: row.preferredTime?.trim(),
      targetWeight: row.targetWeight ? parseFloat(row.targetWeight) : undefined,
      subscriptionStatus: row.subscriptionStatus?.trim() || 'pending',
    };
  }

  /**
   * Import a single trainee from CSV data
   */
  private async importSingleTrainee(
    data: CsvTraineeData,
    coachId: string,
  ): Promise<string | null> {
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.phone) {
      throw new Error(
        'Missing required fields: firstName, lastName, email, phone',
      );
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email: data.email }, { phone: data.phone }],
    });

    if (existingUser) {
      throw new Error(
        `User already exists with email ${data.email} or phone ${data.phone}`,
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      data.password || 'defaultPassword123',
      10,
    );

    // Create user
    const user = this.userRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: UserRole.CLIENT,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Create trainee profile
    const traineeProfile = this.traineeProfileRepository.create({
      userId: savedUser.id,
      age: data.age,
      weight: data.weight,
      height: data.height,
      gender: data.gender,
      fitnessGoal: data.fitnessGoal,
      fitnessLevel: data.fitnessLevel,
      bodyShape: data.bodyShape,
      mealsPerDay: data.mealsPerDay,
      exerciseFrequency: data.exerciseFrequency,
      sessionDuration: data.sessionDuration,
      gymAccess: data.gymAccess,
      healthConsiderations: data.healthConsiderations,
      allergies: data.allergies,
      coachGenderPreference: data.coachGenderPreference,
      coachingMode: data.coachingMode,
      budget: data.budget,
      preferredTime: data.preferredTime,
    });

    await this.traineeProfileRepository.save(traineeProfile);

    // Create trainee progress record
    const subscriptionStatus = this.mapSubscriptionStatus(
      data.subscriptionStatus,
    );

    const traineeProgress = this.traineeProgressRepository.create({
      traineeId: savedUser.id,
      coachId: coachId,
      targetWeight: data.targetWeight,
      subscriptionStatus: subscriptionStatus,
      subscriptionStartDate:
        subscriptionStatus === SubscriptionStatus.ACTIVE
          ? new Date()
          : undefined,
      workoutCompletionPercentage: 0,
      totalWorkoutsCompleted: 0,
      progressData: {},
    });

    await this.traineeProgressRepository.save(traineeProgress);

    return savedUser.id;
  }

  /**
   * Map string subscription status to enum
   */
  private mapSubscriptionStatus(status?: string): SubscriptionStatus {
    if (!status) return SubscriptionStatus.PENDING;

    switch (status.toLowerCase()) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'pending':
        return SubscriptionStatus.PENDING;
      case 'suspended':
        return SubscriptionStatus.SUSPENDED;
      case 'cancelled':
        return SubscriptionStatus.CANCELLED;
      default:
        return SubscriptionStatus.PENDING;
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format (basic validation)
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }
}
