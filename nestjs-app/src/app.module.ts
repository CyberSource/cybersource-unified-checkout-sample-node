import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CybersourceModule } from './modules/cybersource/cybersource.module';
import appConfig from './config/app.config';
import cybersourceConfig from './config/cybersource.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, cybersourceConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    CybersourceModule,
  ],
})
export class AppModule {}
