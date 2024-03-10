import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DEFAULT_PORT } from './constant/config.constant';
import { HealthCheckModule } from './healthcheck/health-check.module';

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
  const enableHealthCheck = JSON.parse(process.env.ENABLE_HEALTHCHECK) || false;

  // Create a separate HTTP server for health checks
  if (enableHealthCheck) {
    const healthCheckApp = await NestFactory.create(HealthCheckModule);
    const healthCheckPort = parseInt(process.env.HEALTH_CHECK_PORT) || 9991;
    await healthCheckApp.listen(healthCheckPort); // Choose a different port for the HTTP server
  }
}
bootstrap();
