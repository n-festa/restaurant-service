import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTables1708344487764 implements MigrationInterface {
  name = 'CreateTables1708344487764';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`Ahamove_Order_Hook\` (\`id\` int NOT NULL AUTO_INCREMENT, \`_id\` varchar(255) NOT NULL, \`accept_time\` datetime NOT NULL, \`board_time\` datetime NOT NULL, \`cancel_by_user\` tinyint NOT NULL DEFAULT 0, \`cancel_comment\` varchar(255) NOT NULL DEFAULT '', \`cancel_image_url\` varchar(255) NOT NULL DEFAULT '', \`cancel_time\` datetime NOT NULL, \`city_id\` varchar(255) NOT NULL, \`complete_time\` datetime NOT NULL, \`create_time\` datetime NOT NULL, \`currency\` varchar(255) NOT NULL, \`order_time\` datetime NOT NULL, \`partner\` varchar(255) NOT NULL, \`path\` json NOT NULL, \`payment_method\` varchar(255) NOT NULL, \`pickup_time\` int NOT NULL, \`service_id\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL, \`sub_status\` varchar(255) NOT NULL, \`supplier_id\` varchar(255) NOT NULL, \`supplier_name\` varchar(255) NOT NULL, \`surcharge\` int NOT NULL, \`user_id\` varchar(255) NOT NULL, \`user_name\` varchar(255) NOT NULL, \`total_pay\` int NOT NULL, \`promo_code\` varchar(255) NOT NULL, \`stoppoint_price\` int NOT NULL, \`special_request_price\` int NOT NULL, \`vat\` int NOT NULL, \`distance_price\` int NOT NULL, \`voucher_discount\` int NOT NULL, \`subtotal_price\` int NOT NULL, \`total_price\` int NOT NULL, \`surge_rate\` int NOT NULL, \`api_key\` varchar(255) NOT NULL, \`shared_link\` varchar(255) NOT NULL, \`insurance_portal_url\` varchar(255) NOT NULL, \`app\` varchar(255) NOT NULL, \`store_id\` int NOT NULL, \`distance\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Ahamove_Order\` (\`id\` varchar(36) NOT NULL, \`service_id\` varchar(255) NOT NULL, \`path\` json NOT NULL, \`requests\` json NOT NULL, \`payment_method\` varchar(255) NOT NULL, \`total_pay\` int NOT NULL, \`order_time\` int NOT NULL, \`promo_code\` varchar(255) NULL, \`remarks\` varchar(255) NOT NULL, \`admin_note\` varchar(255) NOT NULL, \`route_optimized\` tinyint NOT NULL, \`idle_until\` int NOT NULL, \`items\` json NOT NULL, \`package_detail\` json NOT NULL, \`group_service_id\` varchar(255) NULL, \`group_requests\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`No_Adding_Ext\` (\`no_adding_id\` varchar(255) NOT NULL, \`ISO_language_code\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`no_adding_id\`, \`ISO_language_code\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Basic_Customization\` (\`menu_item_id\` int NOT NULL, \`no_adding_id\` varchar(45) NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`menu_item_id\`, \`no_adding_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Contact\` (\`contact_id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`content\` longtext NOT NULL, \`is_contacted\` tinyint NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`contact_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Address\` (\`address_id\` int NOT NULL AUTO_INCREMENT, \`address_line\` varchar(255) NOT NULL, \`ward\` varchar(64) NOT NULL, \`district\` varchar(64) NOT NULL, \`city\` varchar(64) NOT NULL, \`country\` varchar(64) NOT NULL, \`latitude\` decimal(8,6) NOT NULL, \`longitude\` decimal(9,6) NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`address_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Media\` (\`media_id\` int NOT NULL AUTO_INCREMENT, \`type\` varchar(45) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`url\` varchar(2048) NOT NULL, \`restaurant_id\` int NULL, \`menu_item_id\` int NULL, \`packaging_id\` int NULL, \`driver_rating_id\` int NULL, \`food_rating_id\` int NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`media_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Restaurant_Owner\` (\`restaurant_owner_id\` int NOT NULL AUTO_INCREMENT, \`phone_number\` varchar(25) NOT NULL, \`name\` varchar(255) NULL, \`email\` varchar(255) NULL, \`username\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT '0', \`refresh_token\` varchar(255) NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`profile_image\` int NULL, UNIQUE INDEX \`IDX_ede6dcc70f5cda98ab2b89b7fc\` (\`phone_number\`), UNIQUE INDEX \`REL_4d59745ca8bac26c65e3048b36\` (\`profile_image\`), PRIMARY KEY (\`restaurant_owner_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Restaurant_Ext\` (\`restaurant_id\` int NOT NULL, \`ISO_language_code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`specialty\` varchar(255) NULL, \`introduction\` text NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`restaurant_id\`, \`ISO_language_code\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Unit_Ext\` (\`unit_id\` int NOT NULL, \`ISO_language_code\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`unit_id\`, \`ISO_language_code\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Unit\` (\`unit_id\` int NOT NULL AUTO_INCREMENT, \`type\` varchar(45) NOT NULL, \`symbol\` varchar(32) NOT NULL, \`decimal_place\` varchar(2) NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`unit_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Restaurant\` (\`restaurant_id\` int NOT NULL AUTO_INCREMENT, \`phone_number\` varchar(25) NOT NULL, \`is_auto_confirmed\` tinyint NOT NULL DEFAULT '0', \`bank_name\` varchar(100) NULL, \`bin\` varchar(11) NULL, \`account_number\` varchar(50) NULL, \`account_owner_name\` varchar(255) NULL, \`shared_link\` varchar(2048) NULL, \`is_active\` tinyint NOT NULL DEFAULT '0', \`intro_video\` int NULL, \`rating\` decimal(3,2) NULL, \`review_total_count\` int NULL, \`top_food\` varchar(255) NULL, \`promotion\` varchar(255) NULL, \`unit\` int NULL, \`utc_time_zone\` decimal(2,0) NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`address_id\` int NULL, \`restaurant_owner_id\` int NULL, \`logo\` int NULL, UNIQUE INDEX \`REL_a20ebf05e0223cc5cf786a1dca\` (\`address_id\`), UNIQUE INDEX \`REL_9d07d3fcb1152c4ac3f366a26f\` (\`logo\`), PRIMARY KEY (\`restaurant_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Menu_Item_Ext\` (\`menu_item_id\` int NOT NULL, \`ISO_language_code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`short_name\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`main_cooking_method\` varchar(64) NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`menu_item_id\`, \`ISO_language_code\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Food_Rating\` (\`food_rating_id\` int NOT NULL AUTO_INCREMENT, \`order_sku_id\` int NOT NULL, \`score\` tinyint NOT NULL, \`remarks\` text NULL, \`customer_id\` int NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT '1', \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE INDEX \`REL_81ed649e8508964c64037eb130\` (\`order_sku_id\`), PRIMARY KEY (\`food_rating_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Order_SKU\` (\`order_sku_id\` int NOT NULL AUTO_INCREMENT, \`order_id\` int NOT NULL, \`sku_id\` int NOT NULL, \`qty_ordered\` int NOT NULL, \`price\` int NOT NULL, \`currency\` int NOT NULL, \`advanced_taste_customization\` varchar(255) NULL, \`basic_taste_customization\` varchar(255) NULL, \`notes\` text NULL, \`label_id\` int NULL, \`calorie_kcal\` decimal(10,2) NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`order_sku_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Menu_Item_Attribute_Ext\` (\`attribute_id\` int NOT NULL, \`ISO_language_code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`attribute_id\`, \`ISO_language_code\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Taste_Value_Ext\` (\`value_id\` varchar(255) NOT NULL, \`ISO_language_code\` varchar(255) NOT NULL, \`name\` varchar(255) NULL, \`description\` text NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`value_id\`, \`ISO_language_code\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Taste_Value\` (\`value_id\` varchar(255) NOT NULL, \`order\` int NULL, \`is_default_taste\` tinyint NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`value_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Menu_Item_Attribute_Value\` (\`value_id\` int NOT NULL AUTO_INCREMENT, \`attribute_id\` int NOT NULL, \`value\` int NULL, \`unit\` int NULL, \`taste_value\` varchar(45) NULL, \`note\` varchar(255) NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`value_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Taste_Ext\` (\`taste_id\` varchar(255) NOT NULL, \`ISO_language_code\` varchar(255) NOT NULL, \`name\` varchar(255) NULL, \`description\` text NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`taste_id\`, \`ISO_language_code\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Menu_Item_Attribute\` (\`attribute_id\` int NOT NULL AUTO_INCREMENT, \`menu_item_id\` int NOT NULL, \`type_id\` varchar(45) NULL, \`taste_id\` varchar(45) NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`attribute_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`SKU_Detail\` (\`sku_id\` int NOT NULL, \`attribute_id\` int NOT NULL, \`value_id\` int NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`sku_id\`, \`attribute_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`SKU_Discount\` (\`sku_discount_id\` int NOT NULL AUTO_INCREMENT, \`sku_id\` int NOT NULL, \`discount_value\` int NOT NULL, \`discount_unit\` int NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT '0', \`valid_from\` datetime NOT NULL, \`valid_until\` datetime NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`sku_discount_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`SKU\` (\`sku_id\` int NOT NULL AUTO_INCREMENT, \`menu_item_id\` int NOT NULL, \`sku\` varchar(32) NULL, \`price\` int NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT '0', \`is_standard\` tinyint NOT NULL DEFAULT '0', \`calorie_kcal\` decimal(10,2) NULL, \`protein_g\` decimal(10,2) NULL, \`fat_g\` decimal(10,2) NULL, \`carbohydrate_g\` decimal(10,2) NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`sku_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Packaging_Ext\` (\`packaging_id\` int NOT NULL, \`ISO_language_code\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`packaging_id\`, \`ISO_language_code\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Packaging\` (\`packaging_id\` int NOT NULL AUTO_INCREMENT, \`menu_item_id\` int NOT NULL, \`price\` int NOT NULL, \`currency\` int NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`packaging_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Menu_Item\` (\`menu_item_id\` int NOT NULL AUTO_INCREMENT, \`restaurant_id\` int NULL, \`preparing_time_s\` int NULL, \`cooking_time_s\` int NULL, \`cutoff_time\` time NULL, \`quantity_available\` int NULL, \`is_active\` tinyint NOT NULL DEFAULT '0', \`is_vegetarian\` tinyint NOT NULL DEFAULT '0', \`cooking_schedule\` varchar(22) NOT NULL, \`res_category_id\` int NOT NULL, \`image\` int NOT NULL, \`rating\` decimal(3,2) NULL, \`ingredient_brief_vie\` varchar(100) NULL, \`ingredient_brief_eng\` varchar(100) NULL, \`promotion\` varchar(255) NULL, \`units_sold\` int NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`menu_item_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Recipe\` (\`ingredient_id\` int NOT NULL, \`menu_item_id\` int NOT NULL, \`quantity\` int NOT NULL, \`unit\` int NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`ingredient_id\`, \`menu_item_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Ingredient\` (\`ingredient_id\` int NOT NULL AUTO_INCREMENT, \`vie_name\` varchar(255) NOT NULL, \`eng_name\` varchar(255) NULL, \`calorie_kcal\` int NULL, \`protein_g\` int NULL, \`fat_g\` int NULL, \`carbohydrate_g\` int NULL, \`ma_BTP2007\` varchar(10) NULL, \`food_id\` int NULL, \`img_object_id\` varchar(255) NULL, \`source\` varchar(255) NULL, \`image\` int NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`ingredient_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Manual_Open_Restaurant\` (\`manual_id\` int NOT NULL AUTO_INCREMENT, \`date\` date NULL, \`from_time\` datetime NULL, \`to_time\` datetime NULL, \`restaurant_id\` int NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`manual_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Cart_Item\` (\`item_id\` int NOT NULL AUTO_INCREMENT, \`customer_id\` int NOT NULL, \`sku_id\` int NOT NULL, \`qty_ordered\` int NULL, \`advanced_taste_customization\` varchar(255) NULL, \`basic_taste_customization\` varchar(255) NULL, \`portion_customization\` varchar(255) NULL, \`advanced_taste_customization_obj\` text NULL, \`basic_taste_customization_obj\` text NULL, \`notes\` text NULL, \`restaurant_id\` int NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`item_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Operation_Hours\` (\`ops_hour_id\` int NOT NULL AUTO_INCREMENT, \`day_of_week\` int NOT NULL, \`from_time\` time NOT NULL, \`to_time\` time NOT NULL, \`restaurant_id\` int NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`ops_hour_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Main_Side_Dish\` (\`main_dish_id\` int NOT NULL, \`side_dish_id\` int NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`main_dish_id\`, \`side_dish_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Restaurant_Day_Off\` (\`day_off_id\` int NOT NULL AUTO_INCREMENT, \`date\` date NOT NULL, \`restaurant_id\` int NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`day_off_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Sys_Category\` (\`sys_category_id\` int NOT NULL AUTO_INCREMENT, \`type\` varchar(45) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT '0', \`image\` int NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`sys_category_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Sys_Category_Ext\` (\`sys_category_id\` int NOT NULL, \`ISO_language_code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`sys_category_id\`, \`ISO_language_code\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Sys_Category_Menu_Item\` (\`sys_category_id\` int NOT NULL, \`menu_item_id\` int NOT NULL, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`sys_category_id\`, \`menu_item_id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`Sys_Category_Menu_Item\``);
    await queryRunner.query(`DROP TABLE \`Sys_Category_Ext\``);
    await queryRunner.query(`DROP TABLE \`Sys_Category\``);
    await queryRunner.query(`DROP TABLE \`Restaurant_Day_Off\``);
    await queryRunner.query(`DROP TABLE \`Main_Side_Dish\``);
    await queryRunner.query(`DROP TABLE \`Operation_Hours\``);
    await queryRunner.query(`DROP TABLE \`Cart_Item\``);
    await queryRunner.query(`DROP TABLE \`Manual_Open_Restaurant\``);
    await queryRunner.query(`DROP TABLE \`Ingredient\``);
    await queryRunner.query(`DROP TABLE \`Recipe\``);
    await queryRunner.query(`DROP TABLE \`Menu_Item\``);
    await queryRunner.query(`DROP TABLE \`Packaging\``);
    await queryRunner.query(`DROP TABLE \`Packaging_Ext\``);
    await queryRunner.query(`DROP TABLE \`SKU\``);
    await queryRunner.query(`DROP TABLE \`SKU_Discount\``);
    await queryRunner.query(`DROP TABLE \`SKU_Detail\``);
    await queryRunner.query(`DROP TABLE \`Menu_Item_Attribute\``);
    await queryRunner.query(`DROP TABLE \`Taste_Ext\``);
    await queryRunner.query(`DROP TABLE \`Menu_Item_Attribute_Value\``);
    await queryRunner.query(`DROP TABLE \`Taste_Value\``);
    await queryRunner.query(`DROP TABLE \`Taste_Value_Ext\``);
    await queryRunner.query(`DROP TABLE \`Menu_Item_Attribute_Ext\``);
    await queryRunner.query(`DROP TABLE \`Order_SKU\``);
    await queryRunner.query(`DROP INDEX \`REL_81ed649e8508964c64037eb130\` ON \`Food_Rating\``);
    await queryRunner.query(`DROP TABLE \`Food_Rating\``);
    await queryRunner.query(`DROP TABLE \`Menu_Item_Ext\``);
    await queryRunner.query(`DROP INDEX \`REL_9d07d3fcb1152c4ac3f366a26f\` ON \`Restaurant\``);
    await queryRunner.query(`DROP INDEX \`REL_a20ebf05e0223cc5cf786a1dca\` ON \`Restaurant\``);
    await queryRunner.query(`DROP TABLE \`Restaurant\``);
    await queryRunner.query(`DROP TABLE \`Unit\``);
    await queryRunner.query(`DROP TABLE \`Unit_Ext\``);
    await queryRunner.query(`DROP TABLE \`Restaurant_Ext\``);
    await queryRunner.query(`DROP INDEX \`REL_4d59745ca8bac26c65e3048b36\` ON \`Restaurant_Owner\``);
    await queryRunner.query(`DROP INDEX \`IDX_ede6dcc70f5cda98ab2b89b7fc\` ON \`Restaurant_Owner\``);
    await queryRunner.query(`DROP TABLE \`Restaurant_Owner\``);
    await queryRunner.query(`DROP TABLE \`Media\``);
    await queryRunner.query(`DROP TABLE \`Address\``);
    await queryRunner.query(`DROP TABLE \`Contact\``);
    await queryRunner.query(`DROP TABLE \`Basic_Customization\``);
    await queryRunner.query(`DROP TABLE \`No_Adding_Ext\``);
    await queryRunner.query(`DROP TABLE \`Ahamove_Order\``);
    await queryRunner.query(`DROP TABLE \`Ahamove_Order_Hook\``);
  }
}
