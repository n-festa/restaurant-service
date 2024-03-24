import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { MomoTransaction } from 'src/entity/momo-transaction.entity';
import { Repository } from 'typeorm';
const crypto = require('crypto');
import axiosRetry from 'axios-retry';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { v4 as uuidv4 } from 'uuid';
import { InvoiceHistoryStatusEnum } from 'src/enum';
import { Invoice } from 'src/entity/invoice.entity';
import { OrderService } from 'src/feature/order/order.service';
import { InvoiceStatusHistoryService } from 'src/feature/invoice-status-history/invoice-status-history.service';
import { ConfigService } from '@nestjs/config';
import { CustomRpcException } from 'src/exceptions/custom-rpc.exception';
import { CreateMomoPaymentResponse } from 'src/dto/create-momo-payment-response.dto';
import { CreateMomoPaymentRequest } from 'src/dto/create-momo-payment-request.dto';

@Injectable()
export class MomoService {
  partnerCode = '';
  accessKey = '';
  secretkey = '';
  redirectHost = '';
  redirectUrl = '';
  ipnUrl = '';
  requestType = '';
  baseUrl = '';
  maximumRetry = 0;

  private readonly logger = new Logger(MomoService.name);
  constructor(
    @InjectRepository(MomoTransaction)
    private momoRepo: Repository<MomoTransaction>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceStatusHistory)
    private orderStatusHistoryRepo: Repository<InvoiceStatusHistory>,
    @InjectRepository(InvoiceStatusHistory)
    private invoiceHistoryStatusRepo: Repository<InvoiceStatusHistory>,
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
    this.ipnUrl = `${this.redirectHost}/momo/momo-ipn-callback`;
  }

  async sendMomoPaymentRequest(
    request: CreateMomoPaymentRequest,
  ): Promise<CreateMomoPaymentResponse> {
    const currentInvoice = await this.invoiceRepo.findOne({
      where: { invoice_id: request.invoiceId },
    });
    if (!currentInvoice) {
      // throw new InternalServerErrorException('Invoice not found');
      throw new CustomRpcException(2, 'Invoice is not found');
    }
    const requestId = uuidv4();
    const orderId = requestId;
    const momoRedirectUrl = `${this.redirectUrl}/${currentInvoice.order_id}`;
    const momoSignatureObj = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId: requestId,
      amount: currentInvoice.total_amount,
      orderId: orderId,
      orderInfo: `Thanh toán cho đơn hàng 2ALL ${currentInvoice.order_id}`,
      redirectUrl: this.redirectUrl + '/' + currentInvoice.order_id,
      ipnUrl: this.ipnUrl,
      extraData: '',
      requestType: this.requestType,
    };
    // console.log(momoSignatureObj);

    const rawSignature = this.createSignature(momoSignatureObj);
    const signature = crypto
      .createHmac('sha256', this.secretkey)
      .update(rawSignature)
      .digest('hex');
    const requestBody = JSON.stringify({
      ...momoSignatureObj,
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

    const latestInvoiceStatus = await this.invoiceHistoryStatusRepo.findOne({
      where: { invoice_id: currentInvoice.invoice_id },
      order: { created_at: 'DESC' },
    });
    console.log('========', currentInvoice, latestInvoiceStatus);

    if (
      latestInvoiceStatus &&
      latestInvoiceStatus.status_id === InvoiceHistoryStatusEnum.STARTED &&
      !currentInvoice.payment_order_id
    ) {
      this.logger.log(
        'currentInvoice for momo payment order: ',
        JSON.stringify(currentInvoice),
      );
      let response: AxiosResponse;
      try {
        response = await axiosInstance.request(options);
      } catch (error) {
        console.log('error', error);
        this.logger.error(
          'An error occurred when create momo request',
          JSON.stringify(error.response?.data),
        );
        //Cancel Order
        await this.orderService.cancelOrder(currentInvoice.order_id, {
          isMomo: true,
        });
        //Cancel Invoice
        const momoInvoiceStatusHistory = new InvoiceStatusHistory();
        momoInvoiceStatusHistory.invoice_id = currentInvoice.invoice_id;
        momoInvoiceStatusHistory.status_id = InvoiceHistoryStatusEnum.CANCELLED;
        momoInvoiceStatusHistory.note = 'Failed to call momo api';
        momoInvoiceStatusHistory.status_history_id = uuidv4();
        await this.invoiceHistoryStatusRepo.save(momoInvoiceStatusHistory);
        // throw new InternalServerErrorException();
        throw new CustomRpcException(201, error.response?.data);
      }
      const momoOrderResult = response.data;
      this.logger.debug('momoOrderResult: ', momoOrderResult);
      if (
        momoOrderResult.resultCode === 0 ||
        momoOrderResult.resultCode === 9000
      ) {
        const momoResult = {
          ...momoOrderResult,
          requestId: requestId,
          partnerCode: this.partnerCode,
          extraData: currentInvoice.description,
          ipnUrl: this.ipnUrl,
          orderId: orderId,
          orderInfo: `Thanh toán cho đơn hàng 2ALL ${currentInvoice.order_id}`,
          redirectUrl: momoRedirectUrl,
          requestType: this.requestType,
          signature: signature,
          type: 'request',
          lang: 'en',
        };
        await this.momoRepo.save(momoResult);
        if (momoResult.resultCode === 0) {
          // Update field payment_order_id of table Invoice with requestId
          await this.invoiceRepo.update(currentInvoice.invoice_id, {
            payment_order_id: requestId,
          });

          //Insert a record into table 'Invoice_Status_History'
          const momoInvoiceStatusHistory = new InvoiceStatusHistory();
          momoInvoiceStatusHistory.status_id = InvoiceHistoryStatusEnum.PENDING;
          momoInvoiceStatusHistory.status_history_id = uuidv4();
          momoInvoiceStatusHistory.invoice_id = currentInvoice.invoice_id;
          momoInvoiceStatusHistory.note = `momo request ${momoResult.requestId} for payment`;
          await this.orderStatusHistoryRepo.insert(momoInvoiceStatusHistory);
        }
      }
      this.logger.debug('end usecase new invoice');
      // return momoOrderResult;
      return {
        invoiceId: currentInvoice.invoice_id,
        amount: momoOrderResult.amount,
        payUrl: momoOrderResult.payUrl,
      };
    } else if (
      latestInvoiceStatus &&
      latestInvoiceStatus.status_id === InvoiceHistoryStatusEnum.PENDING &&
      currentInvoice.payment_order_id
    ) {
      const currentMomoTransaction = await this.momoRepo.findOne({
        where: { requestId: currentInvoice.payment_order_id, type: 'request' },
      });
      return {
        invoiceId: currentInvoice.invoice_id,
        amount: Number(currentMomoTransaction.amount),
        payUrl: currentMomoTransaction.payUrl,
      };
    } else {
      // throw new InternalServerErrorException(
      //   'cannot create momo payment order with the invoice',
      // );
      throw new CustomRpcException(200, {
        message: 'cannot create momo payment with the invoice',
        invoice_status: latestInvoiceStatus.status_id,
        payment_order_id: currentInvoice.payment_order_id,
      });
    }
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
