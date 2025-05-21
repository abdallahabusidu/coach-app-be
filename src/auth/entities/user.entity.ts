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
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
