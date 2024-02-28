import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosError } from 'axios';
import { MomoTransaction } from 'src/entity/momo-transaction.entity';
import { Repository } from 'typeorm';
import { MomoRequestDTO } from './momo.dto';
const crypto = require('crypto');
import axiosRetry from 'axios-retry';

@Injectable()
export class MomoService {
  partnerCode = 'MOMOM7WN20230320';
  accessKey = 'fsewCNDK7Z1kD2zd';
  secretkey = 'VZ7CyEHVZdC1vCH72K8r7VtyNdTzuVWB';
  redirectHost = 'https://a525-2402-800-63ae-81f0-3db4-1b2d-3142-e5d8.ngrok-free.app';
  redirectUrl = 'https://www.2all.com.vn/order/detail';
  ipnUrl = `${this.redirectHost}/momo-ipn-callback`;
  //  ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
  requestType = 'captureWallet';
  MOMO_BASE_URL = 'https://test-payment.momo.vn';

  private readonly logger = new Logger(MomoService.name);
  constructor(@InjectRepository(MomoTransaction) private momoRepo: Repository<MomoTransaction>) {}

  sendMomoPaymentRequest(request: MomoRequestDTO) {
    let requestId = this.partnerCode + new Date().getTime();
    const momoSignatureObj = {
      accessKey: this.accessKey,
      amount: request.amount,
      extraData: request.extraData,
      ipnUrl: this.ipnUrl,
      orderId: request.orderId,
      orderInfo: request.orderInfo,
      partnerCode: this.partnerCode,
      redirectUrl: this.redirectUrl,
      requestId: requestId,
      requestType: this.requestType,
    };
    var rawSignature = this.createSignature(momoSignatureObj);
    var signature = crypto.createHmac('sha256', this.secretkey).update(rawSignature).digest('hex');
    const requestBody = JSON.stringify({
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId: requestId,
      amount: request.amount,
      extraData: request.extraData,
      ipnUrl: this.ipnUrl,
      orderId: request.orderId,
      orderInfo: request.orderInfo,
      redirectUrl: this.redirectUrl,
      requestType: this.requestType,
      signature: signature,
      lang: 'en',
    });

    const options = {
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
      method: 'post',
      url: `${this.MOMO_BASE_URL}/v2/gateway/api/create`,
      data: requestBody,
    };
    // Create an Axios instance
    const axiosInstance = axios.create();

    // Configure retries
    axiosRetry(axiosInstance, {
      retries: 1,
      retryDelay: (retryCount) => {
        return retryCount * 1000; // wait 1s before retry
      },
      retryCondition: (error: AxiosError) => {
        return error.isAxiosError;
      },
      onRetry: (retryCount, error, requestConfig) => {
        this.logger.warn(`Attempt ${retryCount}: Retrying request to ${requestConfig.url}`);
        console.log('================================================');
      },
    });

    return axiosInstance
      .request(options)
      .then(async (response) => {
        await this.momoRepo.save({ ...response.data });
        return response.data;
      })
      .catch((error) => {
        this.logger.error('An error occurred ', JSON.stringify(error));
        throw new InternalServerErrorException();
      });
  }

  async handleMoMoIpnCallBack(payload) {
    try {
      await this.momoRepo.save(payload);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  createSignature({ accessKey, amount, extraData, ipnUrl, orderId, orderInfo, partnerCode, redirectUrl, requestId, requestType }) {
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    return rawSignature;
  }
}
