import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { WorkoutPlanEntity } from './workout-plan.entity';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('workout_assignments')
export class WorkoutAssignmentEntity {
  @ApiProperty({ description: 'Unique identifier for the workout assignment' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Workout plan being assigned' })
  @ManyToOne(() => WorkoutPlanEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  workoutPlan: WorkoutPlanEntity;

  @ApiProperty({ description: 'Workout plan ID' })
  @Column()
  @Index()
  workoutPlanId: string;

  @ApiProperty({ description: 'Trainee receiving the assignment' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  trainee: UserEntity;

  @ApiProperty({ description: 'Trainee ID' })
  @Column()
  @Index()
  traineeId: string;

  @ApiProperty({ description: 'Coach who made the assignment' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: UserEntity;

  @ApiProperty({ description: 'Coach ID' })
  @Column()
  @Index()
  coachId: string;

  @ApiProperty({ description: 'When the plan should start' })
  @Column({ type: 'date' })
  @Index()
  startDate: Date;

  @ApiProperty({ description: 'When the plan should end' })
  @Column({ type: 'date' })
  endDate: Date;

  @ApiProperty({ description: 'Whether the assignment is active' })
  @Column({ default: true })
  @Index()
  isActive: boolean;

  @ApiProperty({
    description: 'Custom modifications to the plan for this trainee',
  })
  @Column('jsonb', { nullable: true })
  customizations?: {
    modifiedExercises?: {
      originalExercise: string;
      replacementExercise: string;
      reason: string;
    }[];
    intensityAdjustments?: {
      week: number;
      adjustment: 'increase' | 'decrease' | 'maintain';
      percentage: number;
    }[];
    additionalNotes?: string;
  };

  @ApiProperty({ description: 'Special instructions for the trainee' })
  @Column('text', { nullable: true })
  instructions?: string;

  @ApiProperty({ description: 'Priority level of this assignment' })
  @Column({ default: 1 })
  priority: number;

  @ApiProperty({ description: 'Assignment creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;
}
