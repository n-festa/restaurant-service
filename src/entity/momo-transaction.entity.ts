import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('MomoTransaction')
export class MomoTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  partnerCode: string;

  @Column({ length: 50 })
  requestId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 50 })
  orderId: string;

  @Column({ type: 'bigint', nullable: true })
  transId: number;

  @Column({ type: 'bigint', nullable: true })
  responseTime: number;

  @Column({ length: 255, nullable: true })
  orderInfo: string;

  @Column({ length: 10, nullable: true })
  type: string; // request / response

  @Column({ nullable: true })
  resultCode: number;

  @Column({ nullable: true })
  redirectUrl: string;

  @Column({ nullable: true })
  ipnUrl: string;

  @Column('text', { nullable: true })
  extraData: string;

  @Column({ length: 50, nullable: true })
  requestType: string;

  @Column({ length: 255, nullable: true })
  signature: string;

  @Column('text', { nullable: true })
  payUrl: string;

  @Column('text', { nullable: true })
  message: string;

  @Column({ default: 'en', nullable: true })
  lang: string;
}
