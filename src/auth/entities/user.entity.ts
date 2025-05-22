import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  CLIENT = 'client',
  COACH = 'coach',
  ADMIN = 'admin',
}

@Entity('users')
export class UserEntity {
  @ApiProperty({ description: 'Unique identifier for the user' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: "User's first name" })
  @Column({ nullable: false })
  firstName: string;

  @ApiProperty({ description: "User's last name" })
  @Column({ nullable: false })
  lastName: string;

  @ApiProperty({ description: "User's email address (unique)" })
  @Column({ unique: true, nullable: false })
  email: string;

  @ApiProperty({ description: "User's phone number (unique)" })
  @Column({ unique: true, nullable: false })
  phone: string;

  @ApiProperty({ description: "User's password (hashed)", readOnly: true })
  @Column({ nullable: false })
  @Exclude()
  password: string;

  @ApiProperty({
    description: "User's role in the system",
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Whether the user account is active',
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the user email has been verified',
    default: false,
  })
  @Column({ default: false })
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'Token for email verification',
    readOnly: true,
  })
  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @ApiProperty({
    description: 'Expiration date for the email verification token',
    readOnly: true,
  })
  @Column({ nullable: true })
  @Exclude()
  emailVerificationExpires: Date;

  @ApiProperty({
    description: 'Whether the user phone has been verified',
    default: false,
  })
  @Column({ default: false })
  isPhoneVerified: boolean;

  @ApiProperty({
    description: 'Phone verification code',
    readOnly: true,
  })
  @Column({ nullable: true })
  @Exclude()
  phoneVerificationCode: string;

  @ApiProperty({
    description: 'Expiration date for the phone verification code',
    readOnly: true,
  })
  @Column({ nullable: true })
  @Exclude()
  phoneVerificationExpires: Date;

  @ApiProperty({
    description: 'Refresh token for JWT authentication',
    readOnly: true,
  })
  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @ApiProperty({
    description: 'Expiration date for the refresh token',
    readOnly: true,
  })
  @Column({ nullable: true })
  refreshTokenExpires: Date;

  @ApiProperty({ description: 'When the user account was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When the user account was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  @BeforeUpdate()
  async hashPasswordIfChanged() {
    // Only hash password if it's explicitly modified during an update
    if (this.password && this.password.indexOf('$2b$') !== 0) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) {
      return false;
    }
    return bcrypt.compare(password, this.password);
  }
}
