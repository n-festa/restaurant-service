import { MigrationInterface, QueryRunner } from 'typeorm';

export class TableAhamoveOrder1708402970486 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`Ahamove_Order\` (\`id\` varchar(36) NOT NULL, \`service_id\` varchar(255) NOT NULL, \`path\` json NOT NULL, \`requests\` json NOT NULL, \`payment_method\` varchar(255) NOT NULL, \`total_pay\` int NOT NULL, \`order_time\` int NOT NULL, \`promo_code\` varchar(255) NULL, \`remarks\` varchar(255) NOT NULL, \`admin_note\` varchar(255) NOT NULL, \`route_optimized\` tinyint NOT NULL, \`idle_until\` int NOT NULL, \`items\` json NOT NULL, \`package_detail\` json NOT NULL, \`group_service_id\` varchar(255) NULL, \`group_requests\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`Ahamove_Order\` ADD \`order_id\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`Ahamove_Order\` ADD \`response\` json NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`Ahamove_Order\``);
  }
}
