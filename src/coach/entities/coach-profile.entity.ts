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

@Entity('coach_profiles')
export class CoachProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  specialization: string;

  @Column({ nullable: true })
  yearsOfExperience: number;

  @Column({ nullable: true })
  certifications: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyRate: number;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalRatings: number;

  @Column({ type: 'simple-array', default: '' })
  availableDays: string[];

  @Column('jsonb', { nullable: true })
  availableHours: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
