import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // SSL configuration
  let httpsOptions = null;

  try {
    const keyPath = join(process.cwd(), 'ssl', 'key.pem');
    const certPath = join(process.cwd(), 'ssl', 'cert.pem');

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      console.log('✓ HTTPS enabled with SSL certificates');
    } else {
      console.log('⚠ SSL certificates not found. Generating self-signed certificates...');
      console.log('Run: npm run generate-ssl');
    }
  } catch (error) {
    console.warn('Warning: Could not load SSL certificates:', error.message);
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    httpsOptions ? { httpsOptions } : {},
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);

  // Configure view engine
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Enable body parsing
  app.useBodyParser('json', { limit: '50mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '50mb' });

  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  CyberSource Unified Checkout - NestJS Application       ║
╠═══════════════════════════════════════════════════════════╣
║  Application running on: ${httpsOptions ? 'https' : 'http'}://localhost:${port}           ║
║  Environment: ${configService.get('NODE_ENV', 'development').padEnd(43)}║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
