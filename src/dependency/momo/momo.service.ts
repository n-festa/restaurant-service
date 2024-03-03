import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosError } from 'axios';
import { MomoTransaction } from 'src/entity/momo-transaction.entity';
import { Repository } from 'typeorm';
import { MomoRequestDTO } from './momo.dto';
const crypto = require('crypto');
import axiosRetry from 'axios-retry';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { v4 as uuidv4 } from 'uuid';
import { InvoiceHistoryStatusEnum, OrderStatus } from 'src/enum';
import { Invoice } from 'src/entity/invoice.entity';
import { OrderService } from 'src/feature/order/order.service';

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
  constructor(
    @InjectRepository(MomoTransaction) private momoRepo: Repository<MomoTransaction>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceStatusHistory) private orderStatusHistoryRepo: Repository<InvoiceStatusHistory>,
    private readonly orderService: OrderService,
  ) {}

  sendMomoPaymentRequest(request: MomoRequestDTO) {
    const requestId = this.partnerCode + new Date().getTime();
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
      },
    });

    return axiosInstance
      .request(options)
      .then(async (response) => {
        const momoResult = { ...response.data };
        await this.momoRepo.save(momoResult);
        if (momoResult.resultCode === 0) {
          const currentInvoice = await this.invoiceRepo.findOne({ where: { payment_order_id: momoResult.orderId } });
          const momoInvoiceStatusHistory = new InvoiceStatusHistory();
          if (currentInvoice) {
            momoInvoiceStatusHistory.invoice_id = currentInvoice.invoice_id;
            momoInvoiceStatusHistory.status_id = InvoiceHistoryStatusEnum.PENDING;
            momoInvoiceStatusHistory.note = `update new momo requestt ${momoResult.requestId} for payment`;
            momoInvoiceStatusHistory.status_history_id = uuidv4();
            await this.orderStatusHistoryRepo.insert(momoInvoiceStatusHistory);
          } else {
            momoInvoiceStatusHistory.status_id = InvoiceHistoryStatusEnum.PENDING;
            momoInvoiceStatusHistory.note = `momo request ${momoResult.requestId} for payment`;
            momoInvoiceStatusHistory.status_history_id = uuidv4();
            await this.orderStatusHistoryRepo.insert(momoInvoiceStatusHistory);
          }
        }
        return response.data;
      })
      .catch(async (error) => {
        this.logger.error('An error occurred ', JSON.stringify(error));
        await this.orderService.candelOrder(request.orderId, { isMomo: true });
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
