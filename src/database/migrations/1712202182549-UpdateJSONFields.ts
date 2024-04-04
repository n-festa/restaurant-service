import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateJSONFields1712202182549 implements MigrationInterface {
  name = 'UpdateJSONFields1712202182549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`Menu_Item\` 
      CHANGE COLUMN \`cooking_schedule\` \`cooking_schedule\` JSON NOT NULL DEFAULT('[]') ;
      `,
    );
    await queryRunner.query(
      `update Order_SKU set advanced_taste_customization_obj = '[]' where advanced_taste_customization_obj = '';`,
    );
    await queryRunner.query(
      `update Order_SKU set basic_taste_customization_obj = '[]' where basic_taste_customization_obj = '';`,
    );
    await queryRunner.query(`ALTER TABLE Order_SKU
    CHANGE COLUMN advanced_taste_customization_obj advanced_taste_customization_obj JSON NOT NULL DEFAULT('[]') ,
    CHANGE COLUMN basic_taste_customization_obj basic_taste_customization_obj JSON NOT NULL DEFAULT('[]') ;
    `);

    await queryRunner.query(
      `update Cart_Item set advanced_taste_customization_obj = '[]' where advanced_taste_customization_obj = '';`,
    );
    await queryRunner.query(
      `update Cart_Item set basic_taste_customization_obj = '[]' where basic_taste_customization_obj = '';`,
    );
    await queryRunner.query(`ALTER TABLE Cart_Item
    CHANGE COLUMN advanced_taste_customization_obj advanced_taste_customization_obj JSON NOT NULL DEFAULT('[]') ,
    CHANGE COLUMN basic_taste_customization_obj basic_taste_customization_obj JSON NOT NULL DEFAULT('[]') ;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`Menu_Item\` 
      CHANGE COLUMN \`cooking_schedule\` \`cooking_schedule\` TEXT NULL DEFAULT NULL ;
      `,
    );

    await queryRunner.query(`ALTER TABLE Order_SKU 
    CHANGE COLUMN advanced_taste_customization_obj advanced_taste_customization_obj TEXT NULL DEFAULT NULL ,
    CHANGE COLUMN basic_taste_customization_obj basic_taste_customization_obj TEXT NULL DEFAULT NULL ;
    `);

    await queryRunner.query(
      `update Order_SKU set advanced_taste_customization_obj = '' where advanced_taste_customization_obj = '[]';`,
    );
    await queryRunner.query(
      `update Order_SKU set basic_taste_customization_obj = '' where basic_taste_customization_obj = '[]';`,
    );

    await queryRunner.query(`ALTER TABLE Cart_Item 
    CHANGE COLUMN advanced_taste_customization_obj advanced_taste_customization_obj TEXT NULL DEFAULT NULL ,
    CHANGE COLUMN basic_taste_customization_obj basic_taste_customization_obj TEXT NULL DEFAULT NULL ;
    `);

    await queryRunner.query(
      `update Cart_Item set advanced_taste_customization_obj = '' where advanced_taste_customization_obj = '[]';`,
    );
    await queryRunner.query(
      `update Cart_Item set basic_taste_customization_obj = '' where basic_taste_customization_obj = '[]';`,
    );
  }
}
