# 🚀 Быстрый старт

Запустите CyberSource Unified Checkout на NestJS за 5 минут!

## Шаг 1: Установка зависимостей

```bash
cd nestjs-app
npm install
```

## Шаг 2: Генерация SSL сертификатов

```bash
npm run generate-ssl
```

## Шаг 3: Настройка окружения

Создайте файл `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env` и добавьте ваши CyberSource ключи:

```env
MERCHANT_ID=ваш_merchant_id
MERCHANT_KEY_ID=ваш_key_id
MERCHANT_SECRET_KEY=ваш_secret_key
```

### 🔑 Где взять ключи?

1. Зарегистрируйтесь на https://ebc2test.cybersource.com
2. Перейдите: **Payment Configuration** → **Key Management**
3. Создайте **REST API key**
4. Скопируйте: Merchant ID, Key ID, Secret Key

## Шаг 4: Запуск приложения

```bash
npm run start:dev
```

## Шаг 5: Откройте в браузере

Перейдите на: **https://localhost:3000**

> ⚠️ Браузер покажет предупреждение о самоподписанном сертификате - это нормально. Нажмите "Продолжить" или "Advanced" → "Proceed".

## 🧪 Тестирование

### Используйте тестовую карту:

- **Номер**: 4111 1111 1111 1111
- **CVV**: 123
- **Срок**: 12/2025
- **Имя**: Любое

### Процесс тестирования:

1. На главной странице нажмите **"Get Started"**
2. Нажмите **"Generate Capture Context"**
3. На странице checkout введите тестовые данные карты
4. Нажмите **"Pay"** или **"Complete Payment"**
5. Просмотрите результат транзакции

## 📋 Полезные команды

```bash
# Разработка с hot-reload
npm run start:dev

# Production сборка
npm run build

# Запуск production
npm run start:prod

# Форматирование кода
npm run format

# Линтинг
npm run lint
```

## ❓ Возникли проблемы?

### "Cannot connect to localhost"
```bash
# Убедитесь, что SSL сертификаты созданы
npm run generate-ssl
```

### "Authentication failed"
```bash
# Проверьте правильность ключей в .env файле
cat .env
```

### "Module not found"
```bash
# Переустановите зависимости
rm -rf node_modules package-lock.json
npm install
```

## 📚 Дальше

- Прочитайте полную документацию в [README.md](README.md)
- Изучите архитектуру в [MIGRATION.md](MIGRATION.md)
- Посетите [CyberSource Developer Center](https://developer.cybersource.com/)

---

**Готово!** Теперь вы можете принимать тестовые платежи через CyberSource Unified Checkout 🎉
