import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum FitnessArea {
  WEIGHT_LOSS = 'weight_loss',
  STRENGTH_TRAINING = 'strength_training',
  CARDIO = 'cardio',
  YOGA = 'yoga',
  PILATES = 'pilates',
  HIIT = 'hiit',
  CROSSFIT = 'crossfit',
  BODYBUILDING = 'bodybuilding',
  FLEXIBILITY = 'flexibility',
  NUTRITION = 'nutrition',
  SPORTS_SPECIFIC = 'sports_specific',
  REHABILITATION = 'rehabilitation',
  SENIOR_FITNESS = 'senior_fitness',
  PRENATAL_FITNESS = 'prenatal_fitness',
  FUNCTIONAL_TRAINING = 'functional_training',
}

@Entity('coach_profiles')
export class CoachProfileEntity {
  @ApiProperty({ description: 'Unique identifier for the coach profile' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  @ApiProperty({ description: 'Foreign key to the user' })
  @Column({ nullable: false })
  userId: string;

  @ApiProperty({ description: "Coach's biography" })
  @Column({ nullable: true, type: 'text' })
  bio: string;

  @ApiProperty({ description: 'Coach specialization' })
  @Column({ nullable: true })
  specialization: string;

  @ApiProperty({ description: 'Years of experience as a coach' })
  @Column({ nullable: true })
  yearsOfExperience: number;

  @ApiProperty({
    description: 'JSON array of coach certifications',
    example:
      '[{"name": "NASM CPT", "issuer": "National Academy of Sports Medicine", "year": 2020, "url": "https://example.com/cert1"}]',
  })
  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  certificates: any;

  @ApiProperty({ description: 'Hourly rate charged by the coach' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyRate: number;

  @ApiProperty({ description: "URL to the coach's profile picture" })
  @Column({ nullable: true })
  profilePictureUrl: string;

  @ApiProperty({
    description: 'Gender of the coach',
    enum: Gender,
  })
  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @ApiProperty({ description: 'Age of the coach' })
  @Column({ nullable: true })
  age: number;

  @ApiProperty({
    description: 'Location of the coach (city, state/province, country)',
    example: 'New York, NY, USA',
  })
  @Column({ nullable: true })
  location: string;

  @ApiProperty({
    description: 'Array of fitness areas the coach specializes in',
    enum: FitnessArea,
    isArray: true,
  })
  @Column({
    type: 'enum',
    enum: FitnessArea,
    array: true,
    nullable: true,
    default: '{}',
  })
  fitnessAreas: FitnessArea[];

  @ApiProperty({ description: 'Whether the coach is verified' })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Average rating of the coach' })
  @Column({ default: 0 })
  rating: number;

  @ApiProperty({ description: 'Total number of ratings received' })
  @Column({ default: 0 })
  totalRatings: number;

  @ApiProperty({ description: 'Array of days the coach is available' })
  @Column({ type: 'simple-array', default: '' })
  availableDays: string[];

  @ApiProperty({
    description: 'JSON object with available hours per day',
    example: '{"monday": [{"start": "09:00", "end": "17:00"}]}',
  })
  @Column('jsonb', { nullable: true })
  availableHours: any;

  @ApiProperty({ description: 'When the coach profile was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When the coach profile was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether the coach has completed the onboarding process',
  })
  @Column({ default: false })
  onboardingCompleted: boolean;
}
