import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../auth/entities/user.entity';
import { ConversationEntity } from './conversation.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('messages')
export class MessageEntity {
  @ApiProperty({ description: 'Unique identifier for the message' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Reference to the conversation' })
  @ManyToOne(
    () => ConversationEntity,
    (conversation) => conversation.messages,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn()
  conversation: ConversationEntity;

  @ApiProperty({ description: 'Conversation ID' })
  @Column()
  @Index()
  conversationId: string;

  @ApiProperty({ description: 'Message sender' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  sender: UserEntity;

  @ApiProperty({ description: 'Sender user ID' })
  @Column()
  @Index()
  senderId: string;

  @ApiProperty({ description: 'Message receiver' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  receiver: UserEntity;

  @ApiProperty({ description: 'Receiver user ID' })
  @Column()
  @Index()
  receiverId: string;

  @ApiProperty({ description: 'Message content' })
  @Column('text')
  content: string;

  @ApiProperty({ description: 'Type of message', enum: MessageType })
  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @ApiProperty({ description: 'Message status', enum: MessageStatus })
  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @ApiProperty({ description: 'Message metadata (file URLs, etc.)' })
  @Column('jsonb', { nullable: true })
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    thumbnailUrl?: string;
    duration?: number;
    dimensions?: { width: number; height: number };
  };

  @ApiProperty({ description: 'Whether message is archived' })
  @Column({ default: false })
  isArchived: boolean;

  @ApiProperty({ description: 'When message was read' })
  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @ApiProperty({ description: 'When message was created' })
  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @ApiProperty({ description: 'When message was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
