import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FoodModule } from './feature/food/food.module';
import { RestaurantModule } from './feature/restaurant/restaurant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationModule } from './feature/recommendation/recommendation.module';
import { CategoryModule } from './feature/category/category.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'db-2all-free-backup.cmwyof2iqn6u.ap-southeast-2.rds.amazonaws.com',
      port: 3306,
      username: 'admin',
      password: 'Goodfood4goodlife',
      database: 'new-2all-dev',
      entities: [],
      synchronize: false,
      autoLoadEntities: true,
    }),
    FoodModule,
    RestaurantModule,
    RecommendationModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
