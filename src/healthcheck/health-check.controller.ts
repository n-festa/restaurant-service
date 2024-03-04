import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthCheckController {
  @Get()
  healthCheck(): string {
    return 'Yes, microservice is healthy';
  }
}
