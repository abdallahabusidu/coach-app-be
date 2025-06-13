import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('quotes')
export class QuoteEntity {
  @ApiProperty({ description: 'Unique identifier for the quote' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'The quote text' })
  @Column('text')
  text: string;

  @ApiProperty({ description: 'Author of the quote' })
  @Column({ length: 200 })
  author: string;

  @ApiProperty({ description: 'Category of the quote' })
  @Column({ length: 100, default: 'motivation' })
  @Index()
  category: string;

  @ApiProperty({ description: 'Whether the quote is active/published' })
  @Column({ default: true })
  @Index()
  isActive: boolean;

  @ApiProperty({ description: 'Number of times this quote has been served' })
  @Column({ default: 0 })
  timesServed: number;

  @ApiProperty({ description: 'When the quote was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When the quote was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
