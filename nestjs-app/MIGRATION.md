# Руководство по миграции с Express на NestJS

## Основные изменения

### 1. Структура проекта

**Было (Express):**
```
unified-checkout-node/
├── app.js              # Монолитный файл со всеми роутами
├── routes/
│   └── index.js        # Простые роуты
├── Data/
│   └── Configuration.js
└── views/
```

**Стало (NestJS):**
```
nestjs-app/
├── src/
│   ├── config/         # Модульная конфигурация
│   ├── modules/        # Разделение по модулям
│   ├── common/         # Общие компоненты (DTO, данные)
│   └── main.ts         # Точка входа
└── views/
```

### 2. Архитектурные улучшения

#### Модульность
- **Express**: Один файл `app.js` с 100+ строками кода
- **NestJS**: Разделение на модули, сервисы и контроллеры

#### Dependency Injection
```typescript
// Было в Express:
const configuration = require('./Data/Configuration');
const configObject = new configuration();

// Стало в NestJS:
constructor(
  @Inject(cybersourceConfig.KEY)
  private config: ConfigType<typeof cybersourceConfig>,
) {}
```

#### TypeScript
- Строгая типизация
- Автодополнение
- Раннее обнаружение ошибок

### 3. Управление конфигурацией

**Express:**
```javascript
// Configuration.js
const MerchantId = YOUR_MERCHANT_ID;
const MerchantKeyId = YOUR_MERCHANT_KEY_ID;
```

**NestJS:**
```typescript
// .env
MERCHANT_ID=your_merchant_id
MERCHANT_KEY_ID=your_key_id

// cybersource.config.ts
export default registerAs('cybersource', () => ({
  merchantId: process.env.MERCHANT_ID,
  merchantKeyId: process.env.MERCHANT_KEY_ID,
}));
```

### 4. Обработка роутов

**Express:**
```javascript
app.post('/capture-context', function (req, res) {
  const configObject = new configuration();
  const apiClient = new cybersourceRestApi.ApiClient();
  // ... логика
});
```

**NestJS:**
```typescript
@Post('capture-context')
@Render('capture-context')
async captureContext(@Body() body: CaptureContextRequestDto) {
  const data = await this.cybersourceService.generateCaptureContext(requestObj);
  return { captureConext: data, decodedData: JSON.stringify(decodedData) };
}
```

### 5. Обработка ошибок

**Express:**
```javascript
try {
  // код
} catch (error) {
  res.send('Error : ' + error);
}
```

**NestJS:**
```typescript
try {
  // код
} catch (error) {
  throw new HttpException(
    `Error: ${error.message}`,
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
```

## Преимущества миграции на NestJS

### 1. Масштабируемость
- Модульная архитектура позволяет легко добавлять новые функции
- Разделение ответственности между компонентами
- Переиспользуемые сервисы

### 2. Типобезопасность
- TypeScript предотвращает ошибки типов
- Autocomplete в IDE
- Легче поддерживать код

### 3. Тестирование
- Встроенная поддержка unit и e2e тестов
- Dependency Injection упрощает мокирование
- Изолированное тестирование компонентов

### 4. Производительность
- Эффективное управление зависимостями
- Оптимизированная обработка запросов
- Кеширование конфигурации

### 5. Документация и сообщество
- Обширная документация NestJS
- Активное сообщество
- Множество готовых модулей и интеграций

## Карта соответствия файлов

| Express | NestJS | Описание |
|---------|--------|----------|
| `app.js` | `main.ts` + `app.module.ts` | Точка входа и главный модуль |
| `routes/index.js` | `cybersource.controller.ts` | Обработчики роутов |
| `Data/Configuration.js` | `config/cybersource.config.ts` | Конфигурация |
| N/A | `cybersource.service.ts` | Бизнес-логика (новое) |
| N/A | `dto/capture-context.dto.ts` | Типизация данных (новое) |

## Новые возможности

### 1. Переменные окружения (.env)
Безопасное хранение конфигурации вне кода

### 2. Валидация DTO
Автоматическая проверка входящих данных

### 3. Middleware и Guards
Централизованная обработка аутентификации и авторизации

### 4. Interceptors
Логирование, трансформация данных, обработка ошибок

### 5. Pipes
Валидация и трансформация данных

## Рекомендации по дальнейшему развитию

### 1. Добавить валидацию
```typescript
// Установить
npm i class-validator class-transformer

// Использовать в DTO
export class CaptureContextRequestDto {
  @IsNotEmpty()
  @IsString()
  captureContextRequest: string;
}
```

### 2. Добавить логирование
```typescript
// Встроенный Logger NestJS
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(CybersourceService.name);

this.logger.log('Generating capture context...');
```

### 3. Добавить тесты
```typescript
// Unit тест для сервиса
describe('CybersourceService', () => {
  it('should generate capture context', async () => {
    // тест
  });
});
```

### 4. Добавить обработку ошибок
```typescript
// Глобальный exception filter
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // обработка
  }
}
```

### 5. Добавить кеширование
```typescript
// Кеширование конфигурации
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register()],
})
```

## Заключение

Миграция на NestJS предоставляет:
- ✅ Лучшую структуру кода
- ✅ Типобезопасность
- ✅ Легкость тестирования
- ✅ Масштабируемость
- ✅ Современные практики разработки

Новое приложение полностью совместимо с оригинальным функционалом, но предоставляет более надежную и расширяемую архитектуру.
