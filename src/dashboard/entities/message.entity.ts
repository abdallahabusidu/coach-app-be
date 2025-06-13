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

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Entity('messages')
export class MessageEntity {
  @ApiProperty({ description: 'Unique identifier for the message' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Reference to the sender user' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  sender: UserEntity;

  @ApiProperty({ description: 'Sender user ID' })
  @Column()
  @Index()
  senderId: string;

  @ApiProperty({ description: 'Reference to the receiver user' })
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

  @ApiProperty({ description: 'Type of message' })
  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @ApiProperty({ description: 'Message status' })
  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  @Index()
  status: MessageStatus;

  @ApiProperty({ description: 'File URL if message contains attachment' })
  @Column({ nullable: true })
  fileUrl?: string;

  @ApiProperty({ description: 'File type if message contains attachment' })
  @Column({ nullable: true })
  fileType?: string;

  @ApiProperty({ description: 'When the message was read' })
  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @ApiProperty({ description: 'Whether the message is archived' })
  @Column({ default: false })
  @Index()
  isArchived: boolean;

  @ApiProperty({ description: 'Conversation thread ID' })
  @Column({ nullable: true })
  @Index()
  threadId?: string;

  @ApiProperty({ description: 'When the message was created' })
  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @ApiProperty({ description: 'When the message was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
