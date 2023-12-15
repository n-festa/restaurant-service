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
  public async refreshFlags() {
    this.flags = await this.flagsmith.getEnvironmentFlags();
    console.debug('refreshFlags - getEnvironmentFlags');
  }
  public isFeatureEnabled(featureName: string): boolean {
    const configFeatureName = this.configService.get<string>('featureFlag');
    if (configFeatureName != '' && configFeatureName == featureName) {
      return true;
    }
    return this.flags.isFeatureEnabled(featureName);
  }
}
