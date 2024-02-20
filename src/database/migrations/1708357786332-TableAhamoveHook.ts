import { MigrationInterface, QueryRunner } from 'typeorm';

export class TableAhamoveHook1708357786332 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`Ahamove_Order_Hook\` (\`id\` int NOT NULL AUTO_INCREMENT, \`_id\` varchar(255) NOT NULL, \`accept_time\` int NOT NULL, \`board_time\` int NOT NULL, \`cancel_by_user\` tinyint NOT NULL DEFAULT 0, \`cancel_comment\` varchar(255) NOT NULL DEFAULT '', \`cancel_image_url\` varchar(255) NOT NULL DEFAULT '', \`cancel_time\` int NOT NULL, \`city_id\` varchar(255) NOT NULL, \`complete_time\` int NOT NULL, \`create_time\` int NOT NULL, \`currency\` varchar(255) NOT NULL, \`order_time\` int NOT NULL, \`partner\` varchar(255) NOT NULL, \`path\` json NOT NULL, \`payment_method\` varchar(255) NOT NULL, \`pickup_time\` int NOT NULL, \`service_id\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL, \`sub_status\` varchar(255) NOT NULL, \`supplier_id\` varchar(255) NOT NULL, \`supplier_name\` varchar(255) NOT NULL, \`surcharge\` int NOT NULL, \`user_id\` varchar(255) NOT NULL, \`user_name\` varchar(255) NOT NULL, \`total_pay\` int NOT NULL, \`promo_code\` varchar(255) NOT NULL, \`stoppoint_price\` int NOT NULL, \`special_request_price\` int NOT NULL, \`vat\` int NOT NULL, \`distance_price\` int NOT NULL, \`voucher_discount\` int NOT NULL, \`subtotal_price\` int NOT NULL, \`total_price\` int NOT NULL, \`surge_rate\` int NOT NULL, \`api_key\` varchar(255) NOT NULL, \`shared_link\` varchar(255) NOT NULL, \`insurance_portal_url\` varchar(255) NOT NULL, \`app\` varchar(255) NOT NULL, \`store_id\` int NOT NULL, \`distance\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`Ahamove_Order_Hook\``);
  }
}
