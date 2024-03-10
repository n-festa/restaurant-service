import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
import { InvoiceStatusHistoryService } from 'src/feature/invoice-status-history/invoice-status-history.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MomoService {
  partnerCode = '';
  accessKey = '';
  secretkey = '';
  redirectHost = 'https://c072-203-210-239-36.ngrok-free.app';
  redirectUrl = 'https://www.2all.com.vn/order/detail';
  ipnUrl = `${this.redirectHost}/momo/momo-ipn-callback`;
  //  ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
  requestType = 'captureWallet';
  baseUrl = 'https://test-payment.momo.vn';
  maximumRetry = 1;

  private readonly logger = new Logger(MomoService.name);
  constructor(
    @InjectRepository(MomoTransaction)
    private momoRepo: Repository<MomoTransaction>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceStatusHistory)
    private orderStatusHistoryRepo: Repository<InvoiceStatusHistory>,
    private readonly orderService: OrderService,
    private readonly invoiceStatusHistoryService: InvoiceStatusHistoryService,
    private configService: ConfigService,
  ) {
    this.partnerCode = configService.get('momo.partnerCode');
    this.accessKey = configService.get('momo.accessKey');
    this.secretkey = configService.get('momo.secretkey');
    this.redirectHost = configService.get('momo.redirectHost');
    this.redirectUrl = configService.get('momo.redirectUrl');
    this.requestType = configService.get('momo.requestType');
    this.baseUrl = configService.get('momo.baseUrl');
    this.maximumRetry = configService.get('momo.maximumRetry');
  }

  async sendMomoPaymentRequest(request: MomoRequestDTO) {
    const requestId = request.momoOrderId || uuidv4();
    const orderId = uuidv4();
    const momoSignatureObj = {
      accessKey: this.accessKey,
      amount: request.amount,
      extraData: request.extraData,
      ipnUrl: this.ipnUrl,
      orderId: orderId,
      orderInfo: request.orderInfo,
      partnerCode: this.partnerCode,
      redirectUrl: this.redirectUrl,
      requestId: requestId,
      requestType: this.requestType,
    };
    var rawSignature = this.createSignature(momoSignatureObj);
    var signature = crypto
      .createHmac('sha256', this.secretkey)
      .update(rawSignature)
      .digest('hex');
    const requestBody = JSON.stringify({
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId: requestId,
      amount: request.amount,
      extraData: request.extraData,
      ipnUrl: this.ipnUrl,
      orderId: orderId,
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
      url: `${this.baseUrl}/v2/gateway/api/create`,
      data: requestBody,
    };
    // Create an Axios instance
    const axiosInstance = axios.create();

    // Configure retries
    axiosRetry(axiosInstance, {
      retries: this.maximumRetry,
      retryDelay: (retryCount) => {
        return retryCount * 1000; // wait 1s before retry
      },
      retryCondition: (error: AxiosError) => {
        return error.isAxiosError;
      },
      onRetry: (retryCount, error, requestConfig) => {
        this.logger.warn(
          `Attempt ${retryCount}: Retrying request to ${requestConfig.url}`,
        );
      },
    });
    const currentInvoice = await this.invoiceRepo.findOne({
      where: { order_id: request.orderId },
    });
    this.logger.log('currentInvoice for momo payment order: ', currentInvoice);
    return axiosInstance
      .request(options)
      .then(async (response) => {
        const momoOrderResult = response.data;
        if (
          momoOrderResult.resultCode === 0 ||
          momoOrderResult.resultCode === 9000
        ) {
          const momoResult = {
            ...momoOrderResult,
            requestId: requestId,
            partnerCode: this.partnerCode,
            extraData: request.extraData,
            ipnUrl: this.ipnUrl,
            orderId: orderId,
            orderInfo: request.orderInfo,
            redirectUrl: this.redirectUrl,
            requestType: this.requestType,
            signature: signature,
            type: 'request',
            lang: 'en',
          };
          await this.momoRepo.save(momoResult);
          if (momoResult.resultCode === 0) {
            if (currentInvoice) {
              // Update field payment_order_id of table Invoice with requestId
              await this.invoiceRepo.update(currentInvoice.invoice_id, {
                payment_order_id: requestId,
              });
            }
            //Insert a record into table 'Invoice_Status_History'
            const momoInvoiceStatusHistory = new InvoiceStatusHistory();
            momoInvoiceStatusHistory.status_id =
              InvoiceHistoryStatusEnum.PENDING;
            momoInvoiceStatusHistory.status_history_id = uuidv4();

            if (currentInvoice) {
              momoInvoiceStatusHistory.invoice_id = currentInvoice.invoice_id;
              momoInvoiceStatusHistory.note = `update new momo requestt ${momoResult.requestId} for payment`;
            } else {
              momoInvoiceStatusHistory.invoice_id = request.orderId;
              momoInvoiceStatusHistory.note = `momo request ${momoResult.requestId} for payment`;
            }
            await this.orderStatusHistoryRepo.insert(momoInvoiceStatusHistory);
          }
        }
        return momoOrderResult;
      })
      .catch(async (error) => {
        this.logger.error(
          'An error occurred when create momo request',
          JSON.stringify(error),
        );
        await this.orderService.cancelOrder(
          request.orderId,
          currentInvoice?.invoice_id,
          { isMomo: true },
        );
        throw new InternalServerErrorException();
      });
  }

  async handleMoMoIpnCallBack(payload) {
    try {
      await this.momoRepo.save(payload);
      await this.invoiceStatusHistoryService.updateInvoiceHistoryFromMomoWebhook(
        payload,
      );
      return { message: 'OK' };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  createSignature({
    accessKey,
    amount,
    extraData,
    ipnUrl,
    orderId,
    orderInfo,
    partnerCode,
    redirectUrl,
    requestId,
    requestType,
  }) {
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    return rawSignature;
  }
}
