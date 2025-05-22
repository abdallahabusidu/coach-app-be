import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CoachProfileEntity } from './coach-profile.entity';

export enum SkillLevel {
  ROOKIE = 'Rookie',
  WARRIOR = 'Warrior',
  LEGEND = 'Legend',
}

@Entity('packages')
export class PackageEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Title of the package' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Description of the package' })
  @Column('text')
  description: string;

  @ApiProperty({
    description: 'Country code for price localization',
    example: 'US',
  })
  @Column()
  country: string;

  @ApiProperty({ description: 'Price in local currency' })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    description: 'Fitness areas this package covers',
    isArray: true,
  })
  @Column('text', { array: true })
  fitnessAreas: string[];

  @ApiProperty({ description: 'Duration in days' })
  @Column('int')
  duration: number;

  @ApiProperty({
    description: 'List of feature IDs (optional)',
    required: false,
  })
  @Column('text', { array: true, nullable: true })
  features?: string[];

  @ApiProperty({
    description: 'Number of sessions (optional)',
    required: false,
  })
  @Column('int', { nullable: true })
  sessionsNumber?: number;

  @ApiProperty({
    description: 'Session period in minutes (optional)',
    required: false,
  })
  @Column('int', { nullable: true })
  sessionPeriod?: number;

  @ApiProperty({ enum: SkillLevel, required: false })
  @Column({ type: 'enum', enum: SkillLevel, nullable: true })
  skillLevel?: SkillLevel;

  @ApiProperty({
    description: 'Target audience ID (optional)',
    required: false,
  })
  @Column({ nullable: true })
  targetAudienceId?: string;

  @ApiProperty({ description: 'Package image URL', required: false })
  @Column({ nullable: true })
  imageUrl?: string;

  @ApiProperty({ description: 'Is package availability limited?' })
  @Column({ default: false })
  limitedAvailability: boolean;

  @ApiProperty({
    description: 'Discount option ID (optional)',
    required: false,
  })
  @Column({ nullable: true })
  discountOptionId?: string;

  @ManyToOne(() => CoachProfileEntity, (coach) => coach.id)
  coach: CoachProfileEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
