import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Coupon } from './coupon.entity';

@Entity('Restaurant_Coupon')
export class Restaurant_Coupon {
  @PrimaryColumn()
  public coupon_id: number;
  @PrimaryColumn()
  public restaurant_id: number;
  @CreateDateColumn({
    type: 'datetime',
    nullable: false,
    unique: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public created_at: Date;

  //Relationship
  @ManyToOne(() => Coupon, (coupon) => coupon.restaurant_coupon_obj)
  @JoinColumn({
    name: 'coupon_id',
    referencedColumnName: 'coupon_id',
  })
  public coupon_obj: Coupon;
}
