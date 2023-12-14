import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FlagsmithService } from './flagsmith.service';
import { FlagsmithController } from './flagsmith.controller';

@Global()
@Module({
  imports: [],
  controllers: [FlagsmithController],
  providers: [
    {
      provide: 'FLAGSMITH_SERVICE',
      useFactory: async (configService: ConfigService) => {
        const service = new FlagsmithService(configService);
        await service.init();
        return service;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['FLAGSMITH_SERVICE'],
})
export class FlagsmithModule {}
