import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Flagsmith from 'flagsmith-nodejs/build/sdk';

@Injectable()
export class FlagsmithService {
  constructor(private readonly configService: ConfigService) {}
  private flagsmith: Flagsmith;
  private flags: any;
  async init() {
    this.flagsmith = new Flagsmith({
      environmentKey: this.configService.get<string>('flagsmithKey'),
    });
    this.flags = await this.flagsmith.getEnvironmentFlags();
    console.debug('init - getEnvironmentFlags');
  }
  public getFlags() {
    return this.flags;
  }
  public async refreshFlags(identifier: string = '') {
    if (identifier == '') {
      this.flags = await this.flagsmith.getEnvironmentFlags();
      console.debug('refreshFlags - getEnvironmentFlags');
    } else if (identifier != '') {
      this.flags = await this.flagsmith.getIdentityFlags(identifier);
      console.debug('refreshFlags - getIdentityFlags');
    }
  }
}
