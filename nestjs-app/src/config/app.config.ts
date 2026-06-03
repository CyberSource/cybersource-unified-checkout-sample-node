import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // SSL Configuration
  ssl: {
    enabled: process.env.SSL_ENABLED === 'true' || true,
    keyPath: process.env.SSL_KEY_PATH || './ssl/key.pem',
    certPath: process.env.SSL_CERT_PATH || './ssl/cert.pem',
  },
}));
