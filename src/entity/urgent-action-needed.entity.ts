import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('Urgent_Action_Needed')
export class UrgentActionNeeded {
  @PrimaryGeneratedColumn()
  issue_id: number;

  @Column('text', { nullable: true })
  description: string | null;

  @Column({ length: 128, nullable: true })
  solved_by: string | null;

  @CreateDateColumn({ nullable: true })
  created_at: Date | null;
}
