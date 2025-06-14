import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

export enum MessageRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('message_requests')
export class MessageRequestEntity {
  @ApiProperty({ description: 'Unique identifier for the message request' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Trainee who sent the request' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  trainee: UserEntity;

  @ApiProperty({ description: 'Trainee user ID' })
  @Column()
  @Index()
  traineeId: string;

  @ApiProperty({ description: 'Coach who received the request' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: UserEntity;

  @ApiProperty({ description: 'Coach user ID' })
  @Column()
  @Index()
  coachId: string;

  @ApiProperty({ description: 'Initial message from trainee' })
  @Column('text')
  initialMessage: string;

  @ApiProperty({ description: 'Reason for wanting to connect' })
  @Column('text', { nullable: true })
  reason?: string;

  @ApiProperty({ description: 'Request status', enum: MessageRequestStatus })
  @Column({
    type: 'enum',
    enum: MessageRequestStatus,
    default: MessageRequestStatus.PENDING,
  })
  @Index()
  status: MessageRequestStatus;

  @ApiProperty({
    description: 'Coach response message when accepting/rejecting',
  })
  @Column('text', { nullable: true })
  responseMessage?: string;

  @ApiProperty({ description: 'When coach responded to the request' })
  @Column({ type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @ApiProperty({ description: 'Request expiration date' })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ description: 'Request metadata' })
  @Column('jsonb', { nullable: true })
  metadata?: {
    traineeProfile?: {
      age?: number;
      goal?: string;
      experience?: string;
    };
    urgency?: 'low' | 'medium' | 'high';
    preferredTime?: string;
  };

  @ApiProperty({ description: 'When request was created' })
  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @ApiProperty({ description: 'When request was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
