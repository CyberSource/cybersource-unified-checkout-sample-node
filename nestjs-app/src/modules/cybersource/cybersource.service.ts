import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as cybersourceRestApi from 'cybersource-rest-client';
import cybersourceConfig from '../../config/cybersource.config';

@Injectable()
export class CybersourceService {
  private apiClient: any;

  constructor(
    @Inject(cybersourceConfig.KEY)
    private config: ConfigType<typeof cybersourceConfig>,
  ) {
    this.apiClient = new cybersourceRestApi.ApiClient();
  }

  /**
   * Get CyberSource configuration object
   */
  getConfiguration() {
    return {
      authenticationType: this.config.authenticationType,
      runEnvironment: this.config.runEnvironment,
      merchantID: this.config.merchantId,
      merchantKeyId: this.config.merchantKeyId,
      merchantsecretKey: this.config.merchantSecretKey,
      keyAlias: this.config.keyAlias,
      keyPass: this.config.keyPass,
      keyFileName: this.config.keyFileName,
      keysDirectory: this.config.keysDirectory,
      useMetaKey: this.config.useMetaKey,
      portfolioID: this.config.portfolioID,
      pemFileDirectory: this.config.pemFileDirectory,
      defaultDeveloperId: this.config.defaultDeveloperId,
      logConfiguration: this.config.logConfiguration,
    };
  }

  /**
   * Generate Unified Checkout Capture Context
   * @param requestObj - Capture context request payload
   */
  async generateCaptureContext(requestObj: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const configObject = this.getConfiguration();
      const instance = new cybersourceRestApi.UnifiedCheckoutCaptureContextApi(
        configObject,
        this.apiClient,
      );

      instance.generateUnifiedCheckoutCaptureContext(
        requestObj,
        (error, data, response) => {
          if (error) {
            console.error('Error generating capture context:', error);
            reject(error);
          } else {
            resolve(data);
          }
        },
      );
    });
  }

  /**
   * Decode JWT token from CyberSource
   * @param token - JWT token to decode
   */
  decodeToken(token: string): any {
    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token format');
    }

    const payload = parts[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString());
  }
}
