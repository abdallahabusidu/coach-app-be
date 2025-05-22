import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity('features')
export class FeatureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @Column({ nullable: true })
  description?: string;
}
