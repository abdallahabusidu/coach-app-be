import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity('discount_options')
export class DiscountOptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  percentage?: number;
  @Column({ nullable: true })
  description?: string;
}
