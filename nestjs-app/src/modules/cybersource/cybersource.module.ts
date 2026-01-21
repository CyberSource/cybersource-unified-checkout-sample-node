import { Module } from '@nestjs/common';
import { CybersourceController } from './cybersource.controller';
import { CybersourceService } from './cybersource.service';

@Module({
  controllers: [CybersourceController],
  providers: [CybersourceService],
  exports: [CybersourceService],
})
export class CybersourceModule {}
