import {
  Controller,
  Get,
  Post,
  Body,
  Render,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CybersourceService } from './cybersource.service';
import {
  CaptureContextRequestDto,
  CheckoutDto,
  CompletePaymentResponseDto,
} from '../../common/dto/capture-context.dto';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class CybersourceController {
  constructor(private readonly cybersourceService: CybersourceService) {}

  @Get()
  @Render('index')
  getIndex() {
    return { title: 'CyberSource Unified Checkout - NestJS' };
  }

  @Get('ucoverview')
  @Render('uc-overview')
  getUcOverview() {
    try {
      const filePath = path.join(
        process.cwd(),
        'src/common/data/default-uc-capture-context-request.json',
      );
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return { jsonRequest: fileContent };
    } catch (error) {
      throw new HttpException(
        `Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('capture-context')
  @Render('capture-context')
  async captureContext(@Body() body: CaptureContextRequestDto) {
    try {
      const requestObj = JSON.parse(body.captureContextRequest);
      const data = await this.cybersourceService.generateCaptureContext(
        requestObj,
      );

      const decodedData = this.cybersourceService.decodeToken(data);

      return {
        captureConext: data,
        decodedData: JSON.stringify(decodedData),
      };
    } catch (error) {
      console.error('Exception on calling the API:', error);
      throw new HttpException(
        `Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('checkout')
  @Render('checkout')
  checkout(@Body() body: CheckoutDto) {
    try {
      const decodeData = JSON.parse(body.captureContextDecoded);
      const captureContext = body.captureContext;

      // Extract the client library URL and the integrity to load the SDK
      const url = decodeData.ctx[0].data.clientLibrary;
      const clientLibraryIntegrity = decodeData.ctx[0].data.clientLibraryIntegrity;

      return {
        url: JSON.stringify(url),
        clientLibraryIntegrity: JSON.stringify(clientLibraryIntegrity),
        captureContext: captureContext,
      };
    } catch (error) {
      throw new HttpException(
        `Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('completePaymentResponse')
  @Render('completeResponse')
  completePaymentResponse(@Body() body: CompletePaymentResponseDto) {
    try {
      const response = body.response.split('.')[1];
      const decodedData = this.cybersourceService.decodeToken(
        body.response,
      );

      return {
        response: body.response,
        decodedData: JSON.stringify(decodedData),
      };
    } catch (error) {
      throw new HttpException(
        `Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
