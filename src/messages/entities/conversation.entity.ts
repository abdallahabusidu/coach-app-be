import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../auth/entities/user.entity';
import { MessageEntity } from './message.entity';

export enum ConversationStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  BLOCKED = 'blocked',
  ARCHIVED = 'archived',
}

@Entity('conversations')
@Unique(['traineeId', 'coachId'])
export class ConversationEntity {
  @ApiProperty({ description: 'Unique identifier for the conversation' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Trainee participant' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  trainee: UserEntity;

  @ApiProperty({ description: 'Trainee user ID' })
  @Column()
  @Index()
  traineeId: string;

  @ApiProperty({ description: 'Coach participant' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: UserEntity;

  @ApiProperty({ description: 'Coach user ID' })
  @Column()
  @Index()
  coachId: string;

  @ApiProperty({ description: 'Conversation status', enum: ConversationStatus })
  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.PENDING,
  })
  status: ConversationStatus;

  @ApiProperty({ description: 'Last message content preview' })
  @Column({ nullable: true })
  lastMessageContent?: string;

  @ApiProperty({ description: 'When last message was sent' })
  @Column({ type: 'timestamp', nullable: true })
  @Index()
  lastMessageAt?: Date;

  @ApiProperty({ description: 'Unread message count for trainee' })
  @Column({ default: 0 })
  traineeUnreadCount: number;

  @ApiProperty({ description: 'Unread message count for coach' })
  @Column({ default: 0 })
  coachUnreadCount: number;

  @ApiProperty({
    description: 'Whether trainee has archived this conversation',
  })
  @Column({ default: false })
  traineeArchived: boolean;

  @ApiProperty({ description: 'Whether coach has archived this conversation' })
  @Column({ default: false })
  coachArchived: boolean;

  @ApiProperty({ description: 'Messages in this conversation' })
  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages: MessageEntity[];

  @ApiProperty({ description: 'When conversation was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When conversation was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
