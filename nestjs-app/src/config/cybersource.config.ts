import { registerAs } from '@nestjs/config';

export default registerAs('cybersource', () => ({
  authenticationType: 'http_signature',
  runEnvironment: process.env.RUN_ENVIRONMENT || 'apitest.cybersource.com',

  // Merchant credentials
  merchantId: process.env.MERCHANT_ID,
  merchantKeyId: process.env.MERCHANT_KEY_ID,
  merchantSecretKey: process.env.MERCHANT_SECRET_KEY,

  // JWT parameters (если используются)
  keysDirectory: 'resource',
  keyFileName: process.env.MERCHANT_ID,
  keyAlias: process.env.MERCHANT_ID,
  keyPass: process.env.MERCHANT_ID,

  // Meta key parameters
  useMetaKey: false,
  portfolioID: '',

  // Logging configuration
  logConfiguration: {
    enableLog: process.env.ENABLE_LOG === 'true',
    logFileName: process.env.LOG_FILE_NAME || 'cybs',
    logDirectory: process.env.LOG_DIRECTORY || 'logs',
    logFileMaxSize: process.env.LOG_FILE_MAX_SIZE || '5242880',
    loggingLevel: 'debug',
    enableMasking: process.env.ENABLE_MASKING === 'true',
  },

  // PEM file directory for JWE decryption
  pemFileDirectory: 'resource/NetworkTokenCert.pem',

  // Default developer ID
  defaultDeveloperId: '',
}));
