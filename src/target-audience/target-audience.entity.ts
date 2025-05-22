import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity('target_audiences')
export class TargetAudienceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @Column({ nullable: true })
  description?: string;
}
