import { Controller, Inject } from '@nestjs/common';
import { FlagsmithService } from './flagsmith.service';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class FlagsmithController {
  constructor(
    @Inject('FLAGSMITH_SERVICE')
    private readonly flagsmithService: FlagsmithService,
  ) {}

  @EventPattern('refresh_flags')
  async refreshFlags(identifier: string) {
    return await this.flagsmithService.refreshFlags(identifier);
  }
}
