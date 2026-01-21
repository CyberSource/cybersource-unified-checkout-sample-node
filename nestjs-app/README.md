# CyberSource Unified Checkout - NestJS

Современная реализация CyberSource Unified Checkout на фреймворке NestJS с TypeScript.

## 📋 Содержание

- [Описание](#описание)
- [Требования](#требования)
- [Установка](#установка)
- [Настройка](#настройка)
- [Запуск](#запуск)
- [Структура проекта](#структура-проекта)
- [API Endpoints](#api-endpoints)
- [Тестирование](#тестирование)

## 📖 Описание

Это приложение демонстрирует интеграцию CyberSource Unified Checkout API с использованием NestJS. Unified Checkout позволяет безопасно принимать платежи без обработки конфиденциальных данных карт на вашем сервере.

### Основные функции:

- ✅ Генерация Capture Context для безопасной обработки платежей
- ✅ Интеграция CyberSource SDK
- ✅ Поддержка HTTPS (обязательно для Unified Checkout)
- ✅ Модульная архитектура NestJS
- ✅ TypeScript для типобезопасности
- ✅ Декодирование и отображение JWT токенов

## 🔧 Требования

- **Node.js**: >= 16.0.0
- **npm** или **yarn**
- **OpenSSL** (для генерации SSL сертификатов)
- **CyberSource аккаунт** (sandbox для разработки)

## 📦 Установка

### 1. Клонирование и установка зависимостей

```bash
cd nestjs-app
npm install
```

### 2. Генерация SSL сертификатов

**ВАЖНО**: Unified Checkout требует HTTPS для работы.

```bash
npm run generate-ssl
```

Эта команда создаст самоподписанные сертификаты в директории `ssl/`:
- `ssl/key.pem` - приватный ключ
- `ssl/cert.pem` - сертификат

> **Примечание**: При первом открытии сайта браузер покажет предупреждение о безопасности. Это нормально для локальной разработки с самоподписанными сертификатами.

### 3. Создание файла конфигурации

Скопируйте пример файла окружения:

```bash
cp .env.example .env
```

## ⚙️ Настройка

### Получение API ключей CyberSource

1. Зарегистрируйтесь на https://ebc2test.cybersource.com (тестовая среда)
2. После входа перейдите в **Payment Configuration** → **Key Management**
3. Создайте новый **REST API key**
4. Сохраните следующие данные:
   - **Merchant ID** - идентификатор торговца
   - **Key ID** - идентификатор ключа
   - **Secret Key** - секретный ключ

### Настройка переменных окружения

Откройте файл `.env` и заполните ваши учетные данные:

```env
# CyberSource Configuration
MERCHANT_ID=ваш_merchant_id
MERCHANT_KEY_ID=ваш_key_id
MERCHANT_SECRET_KEY=ваш_secret_key

# Application Configuration
PORT=3000
NODE_ENV=development
RUN_ENVIRONMENT=apitest.cybersource.com

# Logging
ENABLE_LOG=true
LOG_DIRECTORY=logs
LOG_FILE_NAME=cybs
LOG_FILE_MAX_SIZE=5242880
ENABLE_MASKING=true
```

## 🚀 Запуск

### Режим разработки (с hot-reload)

```bash
npm run start:dev
```

### Обычный режим

```bash
npm start
```

### Production режим

```bash
# Сборка проекта
npm run build

# Запуск
npm run start:prod
```

После запуска приложение будет доступно по адресу:
**https://localhost:3000**

## 📁 Структура проекта

```
nestjs-app/
├── src/
│   ├── config/                      # Конфигурационные файлы
│   │   ├── app.config.ts           # Конфигурация приложения
│   │   └── cybersource.config.ts   # Конфигурация CyberSource
│   ├── modules/
│   │   └── cybersource/            # Модуль CyberSource
│   │       ├── cybersource.module.ts
│   │       ├── cybersource.controller.ts
│   │       └── cybersource.service.ts
│   ├── common/
│   │   ├── dto/                    # Data Transfer Objects
│   │   │   └── capture-context.dto.ts
│   │   └── data/                   # JSON конфигурация
│   │       └── default-uc-capture-context-request.json
│   ├── app.module.ts               # Главный модуль приложения
│   └── main.ts                     # Точка входа
├── views/                          # EJS шаблоны
│   ├── index.ejs
│   ├── uc-overview.ejs
│   ├── capture-context.ejs
│   ├── checkout.ejs
│   └── completeResponse.ejs
├── public/                         # Статические файлы
├── resource/                       # Ресурсы (PEM файлы)
├── scripts/                        # Вспомогательные скрипты
│   └── generate-ssl.sh
├── ssl/                           # SSL сертификаты (генерируются)
├── logs/                          # Логи приложения
├── .env                           # Переменные окружения (создается вами)
├── .env.example                   # Пример конфигурации
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Главная страница |
| GET | `/ucoverview` | Страница конфигурации Capture Context |
| POST | `/capture-context` | Генерация Capture Context |
| POST | `/checkout` | Страница оформления заказа |
| POST | `/completePaymentResponse` | Обработка результата платежа |

### Пример использования API

#### 1. Генерация Capture Context

**POST** `/capture-context`

```json
{
  "captureContextRequest": "{\"targetOrigins\":[\"https://localhost:3000\"],\"clientVersion\":\"0.26\",\"allowedCardNetworks\":[\"VISA\",\"MASTERCARD\",\"AMEX\"],...}"
}
```

**Ответ**: HTML страница с декодированным Capture Context

## 🧪 Тестирование

### Тестовые данные для карт

Для тестирования платежей используйте следующие тестовые карты:

| Карта | Номер | CVV | Результат |
|-------|-------|-----|-----------|
| Visa | 4111 1111 1111 1111 | 123 | Успешный платеж |
| Visa | 4000 0000 0000 0002 | 123 | Отклонен |
| Mastercard | 5555 5555 5555 4444 | 123 | Успешный платеж |
| Amex | 3782 822463 10005 | 1234 | Успешный платеж |

**Срок действия**: Любая будущая дата (например, 12/2025)
**Имя на карте**: Любое
**Адрес**: Любой валидный адрес США

### Процесс тестирования

1. Откройте https://localhost:3000
2. Нажмите "Get Started"
3. Настройте параметры Capture Context (или используйте значения по умолчанию)
4. Нажмите "Generate Capture Context"
5. На странице оформления заказа введите тестовые данные карты
6. Завершите платеж и просмотрите результат

## 🏗️ Архитектура

### Модульная структура NestJS

Приложение построено на модульной архитектуре NestJS:

- **CybersourceModule**: Основной модуль для работы с CyberSource API
  - **CybersourceService**: Бизнес-логика взаимодействия с API
  - **CybersourceController**: Обработка HTTP запросов

### Dependency Injection

NestJS использует внедрение зависимостей для:
- Управления конфигурацией через `ConfigService`
- Инъекции сервисов в контроллеры
- Переиспользования компонентов

### TypeScript преимущества

- ✅ Строгая типизация для предотвращения ошибок
- ✅ Автодополнение в IDE
- ✅ Рефакторинг кода
- ✅ Лучшая документированность кода

## 📝 Логирование

Логи сохраняются в директории `logs/`:
- Все запросы к CyberSource API логируются
- Чувствительные данные (карты, ключи) маскируются
- Максимальный размер лог-файла: 5MB

Настройка логирования в `.env`:
```env
ENABLE_LOG=true
LOG_DIRECTORY=logs
LOG_FILE_NAME=cybs
ENABLE_MASKING=true
```

## 🔒 Безопасность

### Важные моменты безопасности:

1. **Никогда не коммитьте файл `.env`** с реальными ключами
2. **SSL обязателен** для Unified Checkout
3. **Не храните данные карт** на сервере
4. Для production используйте настоящие SSL сертификаты (Let's Encrypt, Cloudflare)
5. Регулярно обновляйте зависимости: `npm audit fix`

## 🐛 Troubleshooting

### Проблема: "Cannot connect to https://localhost:3000"

**Решение**: Убедитесь, что SSL сертификаты сгенерированы:
```bash
npm run generate-ssl
```

### Проблема: "Authentication failed"

**Решение**: Проверьте правильность учетных данных в `.env`:
- MERCHANT_ID
- MERCHANT_KEY_ID
- MERCHANT_SECRET_KEY

### Проблема: "Module not found"

**Решение**: Переустановите зависимости:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Дополнительные ресурсы

- [CyberSource Developer Center](https://developer.cybersource.com/)
- [Unified Checkout Documentation](https://developer.cybersource.com/docs/cybs/en-us/unified-checkout/developer/all/rest/unified-checkout/uc-intro.html)
- [NestJS Documentation](https://docs.nestjs.com/)
- [CyberSource REST API SDK](https://github.com/CyberSource/cybersource-rest-client-node)

## 📄 Лицензия

MIT

## 🤝 Поддержка

Если у вас возникли вопросы или проблемы:
1. Проверьте раздел [Troubleshooting](#troubleshooting)
2. Просмотрите логи в директории `logs/`
3. Обратитесь к [CyberSource документации](https://developer.cybersource.com/)

---

**Примечание**: Это тестовое приложение для разработки. Для production развертывания требуется дополнительная настройка безопасности и инфраструктуры.
