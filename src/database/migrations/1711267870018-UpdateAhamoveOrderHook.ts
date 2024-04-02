import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAhamoveOrderHook1711267870018 implements MigrationInterface {
  name = 'UpdateAhamoveOrderHook1711267870018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`Ahamove_Order_Hook\` 
    CHANGE COLUMN \`_id\` \`_id\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`accept_time\` \`accept_time\` INT NULL ,
    CHANGE COLUMN \`board_time\` \`board_time\` INT NULL ,
    CHANGE COLUMN \`cancel_by_user\` \`cancel_by_user\` TINYINT NULL DEFAULT '0' ,
    CHANGE COLUMN \`cancel_comment\` \`cancel_comment\` VARCHAR(255) NULL DEFAULT '' ,
    CHANGE COLUMN \`cancel_image_url\` \`cancel_image_url\` VARCHAR(255) NULL DEFAULT '' ,
    CHANGE COLUMN \`cancel_time\` \`cancel_time\` INT NULL ,
    CHANGE COLUMN \`city_id\` \`city_id\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`complete_time\` \`complete_time\` INT NULL ,
    CHANGE COLUMN \`create_time\` \`create_time\` INT NULL ,
    CHANGE COLUMN \`currency\` \`currency\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`order_time\` \`order_time\` INT NULL ,
    CHANGE COLUMN \`partner\` \`partner\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`path\` \`path\` JSON NULL ,
    CHANGE COLUMN \`payment_method\` \`payment_method\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`pickup_time\` \`pickup_time\` INT NULL ,
    CHANGE COLUMN \`service_id\` \`service_id\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`status\` \`status\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`sub_status\` \`sub_status\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`supplier_id\` \`supplier_id\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`supplier_name\` \`supplier_name\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`surcharge\` \`surcharge\` INT NULL ,
    CHANGE COLUMN \`user_id\` \`user_id\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`user_name\` \`user_name\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`total_pay\` \`total_pay\` INT NULL ,
    CHANGE COLUMN \`promo_code\` \`promo_code\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`stoppoint_price\` \`stoppoint_price\` INT NULL ,
    CHANGE COLUMN \`special_request_price\` \`special_request_price\` INT NULL ,
    CHANGE COLUMN \`vat\` \`vat\` INT NULL ,
    CHANGE COLUMN \`distance_price\` \`distance_price\` INT NULL ,
    CHANGE COLUMN \`voucher_discount\` \`voucher_discount\` INT NULL ,
    CHANGE COLUMN \`subtotal_price\` \`subtotal_price\` INT NULL ,
    CHANGE COLUMN \`total_price\` \`total_price\` INT NULL ,
    CHANGE COLUMN \`surge_rate\` \`surge_rate\` INT NULL ,
    CHANGE COLUMN \`api_key\` \`api_key\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`shared_link\` \`shared_link\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`insurance_portal_url\` \`insurance_portal_url\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`app\` \`app\` VARCHAR(255) NULL ,
    CHANGE COLUMN \`store_id\` \`store_id\` INT NULL ,
    CHANGE COLUMN \`distance\` \`distance\` INT NULL ; `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(``);
  }
}
