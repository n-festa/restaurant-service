import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMenuItemCreationProcess1712321852821
  implements MigrationInterface
{
  name = 'UpdateMenuItemCreationProcess1712321852821';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Menu_Item 
    ADD COLUMN standard_price INT NULL AFTER units_sold;
    `);

    await queryRunner.query(`ALTER TABLE Menu_Item
    ADD COLUMN min_price INT NULL AFTER standard_price,
    ADD COLUMN max_price INT NULL AFTER min_price;
    `);

    await queryRunner.query(`ALTER TABLE Menu_Item_Attribute_Value 
    ADD COLUMN price_variance INT NULL AFTER note,
    ADD COLUMN is_standard TINYINT NULL AFTER price_variance;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE Menu_Item
    DROP COLUMN standard_price;
    `);

    await queryRunner.query(`ALTER TABLE Menu_Item
    DROP COLUMN max_price,
    DROP COLUMN min_price;
    `);

    await queryRunner.query(`ALTER TABLE Menu_Item_Attribute_Value 
    DROP COLUMN is_standard,
    DROP COLUMN price_variance;`);
  }
}
