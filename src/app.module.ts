import { Global, Module } from '@nestjs/common';
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
import { OrderModule } from './feature/order/order.module';
import { HealthCheckController } from './healthcheck/health-check.controller';
import { ClientProxyFactory } from '@nestjs/microservices';
import { OrderStatusLogSubscriber } from './subscriber/order-status-log.subscriber';
import { OrderSubscriber } from './subscriber/order.subscriber';
import { InvoiceSubscriber } from './subscriber/invoice.subscriber';
import { InvoiceStatusHistorySubscriber } from './subscriber/invoice-status-history.subscriber';
import { DriverStatusLogSubscriber } from './subscriber/driver-status-log.subscriber';

@Global()
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
        subscribers: [__dirname + '/subscriber/*.subscriber{.ts,.js}'],
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
    OrderModule,
  ],
  controllers: [AppController, HealthCheckController],
  providers: [
    AppService,
    {
      provide: 'GATEWAY_SERVICE',
      useFactory: (configService: ConfigService) => {
        const options = configService.get('microServices.gateway');
        return ClientProxyFactory.create(options);
      },
      inject: [ConfigService],
    },
    OrderStatusLogSubscriber,
    OrderSubscriber,
    DriverStatusLogSubscriber,
    InvoiceSubscriber,
    InvoiceStatusHistorySubscriber,
  ],
  exports: ['GATEWAY_SERVICE'],
})
export class AppModule {}
