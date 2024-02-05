import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DEFAULT_PORT } from './constant/config.constant';

const appPort = parseInt(process.env.APP_PORT) || DEFAULT_PORT;

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: appPort,
      },
    },
  );
  await app.listen();

  //Set timezone
  process.env.TZ = 'UTC';
  console.log(`The default timezone at ${process.env.TZ}`);
}
bootstrap();
