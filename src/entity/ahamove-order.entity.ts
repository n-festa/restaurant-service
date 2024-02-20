import { AhaMoveRequest, Item, PackageDetail } from 'src/dependency/ahamove/dto/ahamove.dto';
import { PathLocation } from 'src/dependency/ahamove/dto/ahamove.hook';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('Ahamove_Order')
export class AhamoveOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  service_id: string;

  @Column({ nullable: true })
  order_id: string;

  @Column('json')
  path: string;

  @Column('json')
  requests: string;

  @Column()
  payment_method: string;

  @Column()
  total_pay: number;

  @Column()
  order_time: number;

  @Column({ nullable: true })
  promo_code: string | null;

  @Column({ nullable: true })
  remarks: string;

  @Column({ nullable: true })
  admin_note: string;

  @Column()
  route_optimized: boolean;

  @Column({ nullable: true })
  idle_until: number;

  @Column('json')
  items: string;

  @Column('json')
  response: string;

  @Column('json')
  package_detail: string;

  @Column({ nullable: true })
  group_service_id: string | null;

  @Column({ nullable: true })
  group_requests: string | null;
}
