import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FoodModule } from './feature/food/food.module';
import { RestaurantModule } from './feature/restaurant/restaurant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationModule } from './feature/recommendation/recommendation.module';
import { CategoryModule } from './feature/category/category.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { FlagsmithModule } from './dependency/flagsmith/flagsmith.module';
import { SearchModule } from './feature/search/search.module';
import { CommonModule } from './feature/common/common.module';
import { CartModule } from './feature/cart/cart.module';
import { RatingAndReviewModule } from './feature/rating-and-review/rating-and-review.module';
import { AhamoveModule } from './dependency/ahamove/ahamove.module';
import { InvoiceStatusHistoryModule } from './feature/invoice-status-history/invoice-status-history.module';
import { MomoModule } from './dependency/momo/momo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [__dirname + '/entity/*.entity{.ts,.js}'],
        synchronize: false,
        autoLoadEntities: true,
      }),
      // useFactory: (configService: ConfigService) => ormConfig(),
      inject: [ConfigService],
    }),
    FoodModule,
    RestaurantModule,
    RecommendationModule,
    CategoryModule,
    FlagsmithModule,
    SearchModule,
    CommonModule,
    CartModule,
    RatingAndReviewModule,
    AhamoveModule,
    InvoiceStatusHistoryModule,
    MomoModule,
    InvoiceStatusHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
