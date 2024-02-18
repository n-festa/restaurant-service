import { Controller, Get, InternalServerErrorException, Query, Res, MessageEvent, Param, Logger, Body, Post } from '@nestjs/common';
// import { SseGateway } from './sse.gateway';
import { Subject } from 'rxjs';
import { Response } from 'express';
import { Coordinate } from 'src/type';
import { AhamoveService } from './ahamove.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller('ahamove')
export class AhamoveController {
  private readonly logger = new Logger(AhamoveController.name);

  constructor(private readonly ahamoveService: AhamoveService) {}
  /** List of connected clients */
  connectedClients = new Map<string, { close: () => void; subject: Subject<MessageEvent> }>();

  @Get('connect')
  @MessagePattern({ cmd: 'get_ahamove_status' })
  async connect(@Query('id') clientId: string, @Res() response: Response) {
    let validationFailed = false;

    /* make some validation */

    if (validationFailed) throw new InternalServerErrorException({ message: 'Query failed', error: 100, status: 500 });

    // Create a subject for this client in which we'll push our data
    const subject = new Subject<MessageEvent>();

    // Create an observer that will take the data pushed to the subject and
    // write it to our connection stream in the right format
    const observer = {
      next: (msg: MessageEvent) => {
        // Called when data is pushed to the subject using subject.next()
        // Encode the message as SSE (see https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events)

        // Here's an example of what it could look like, assuming msg.data is an object
        // If msg.data is not an object, you should adjust accordingly

        if (msg.type) response.write(`event: ${msg.type}\n`);
        if (msg.id) response.write(`id: ${msg.id}\n`);
        if (msg.retry) response.write(`retry: ${msg.retry}\n`);

        response.write(`data: ${JSON.stringify(msg.data)}\n\n`);
      },
      complete: () => {
        console.log(`observer.complete`);
      },
      error: (err: any) => {
        console.log(`observer.error: ${err}`);
      },
    };

    // Attach the observer to the subject
    subject.subscribe(observer);
    let clientKey = clientId;
    // Add the client to our client list
    if (clientId) {
      this.logger.log('Establist connection with client ' + clientId);
      this.connectedClients.set(clientKey, {
        close: () => {
          response.end();
        }, // Will allow us to close the connection if needed
        subject, // Subject related to this client
      });
      console.log(this.connectedClients);

      // Handle connection closed
      response.on('close', () => {
        console.log(`Closing connection for client ${clientKey}`);
        subject.complete(); // End the observable stream
        this.connectedClients.delete(clientKey); // Remove client from the list
        response.end(); // Close connection (unsure if this is really requried, to release the resources)
      });
    }

    // Send headers to establish SSE connection
    response.set({
      'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
    });

    response.flushHeaders();
  }

  /** Send a SSE message to the specified client */
  @Get('client')
  sendDataToClient(@Query('id') clientId: string, message: MessageEvent) {
    console.log('====', clientId);
    message = {
      data: 'string',
      type: 'test',
      retry: 10,
    };
    if (this.connectedClients.get(clientId)) {
      return this.connectedClients.get(clientId)?.subject.next(message);
    } else {
      this.logger.error('None existed client with id ' + clientId);
    }
  }

  @Post('estimate')
  @MessagePattern({ cmd: 'get_ahamove_estimate' })
  getEstimateFee(@Body() coordinates: Coordinate[]) {
    return this.ahamoveService.estimatePrice(coordinates);
  }
}
