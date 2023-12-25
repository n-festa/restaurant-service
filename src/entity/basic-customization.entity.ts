import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { NoAddingExt } from './no-adding-ext.entity';

@Entity('Basic_Customization')
export class BasicCustomization {
  @PrimaryGeneratedColumn()
  public basic_customization_id: number;

  @Column({ type: 'int', nullable: false, unique: false })
  public menu_item_id: number;

  @Column({ type: 'varchar', length: 45, nullable: true, unique: false })
  public no_adding_id: string;

  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //RELATIONSHIP

  @OneToMany(() => NoAddingExt, (noAddingExt) => noAddingExt.basic)
  public extension: NoAddingExt[];
}
