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

@Entity('client_profiles')
export class ClientProfileEntity {
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
  age: number;

  @Column({ nullable: true })
  weight: number;

  @Column({ nullable: true })
  height: number;

  @Column({ nullable: true })
  fitnessGoals: string;

  @Column({ nullable: true })
  healthConditions: string;

  @Column({ nullable: true })
  preferredWorkoutType: string;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  location: string;

  // Step 1: Basic info (already present: age, weight, height)

  // Step 2: Fitness goals
  @Column({ nullable: true })
  fitnessGoal: string;
  @Column({ nullable: true })
  fitnessLevel: string; // Rookie, Warrior, Legend
  @Column({ nullable: true })
  bodyShape: string;

  // Step 3: Dietary Habits
  @Column({ nullable: true })
  mealsPerDay: number;
  @Column({ nullable: true })
  specificDiet: boolean;
  @Column({ nullable: true })
  exerciseFrequency: number;
  @Column({ nullable: true })
  sessionDuration: number;
  @Column({ nullable: true })
  gymAccess: boolean;

  // Step 4: Health conditions
  @Column({ nullable: true })
  healthConsiderations: string;
  @Column({ nullable: true })
  allergies: string;
  @Column({ nullable: true })
  medications: boolean;
  @Column({ nullable: true })
  medicalConditions: boolean;
  @Column({ nullable: true })
  medicalConditionsDescription: string;
  @Column({ nullable: true })
  smoke: boolean;
  @Column({ nullable: true })
  drinkAlcohol: boolean;

  // Step 5: Preferences & Logistics
  @Column({ nullable: true })
  coachGenderPreference: string; // Male, Female, No Preference
  @Column({ nullable: true })
  coachingMode: string; // In-Person, Online, Either
  @Column({ nullable: true })
  budget: string;
  @Column({ nullable: true })
  preferredTime: string; // Morning, Afternoon, Evening, Flexible

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
