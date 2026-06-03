# 🪟 Установка на Windows

Пошаговое руководство для запуска CyberSource Unified Checkout на Windows.

## 📋 Требования

- **Node.js** >= 16.0.0 ([Скачать](https://nodejs.org/))
- **OpenSSL** (для генерации SSL сертификатов)
- **Git** (опционально, но рекомендуется)

## 🔧 Установка OpenSSL на Windows

Выберите один из способов:

### Способ 1: Git for Windows (Рекомендуется)

Git for Windows включает OpenSSL.

1. Скачайте [Git for Windows](https://git-scm.com/download/win)
2. Установите с настройками по умолчанию
3. OpenSSL будет доступен автоматически

### Способ 2: Через Chocolatey

Если у вас установлен [Chocolatey](https://chocolatey.org/):

```powershell
choco install openssl
```

### Способ 3: Прямая загрузка

1. Скачайте [Win64 OpenSSL](https://slproweb.com/products/Win32OpenSSL.html)
2. Установите **Win64 OpenSSL v3.x.x Light**
3. Добавьте в PATH:
   - Обычно: `C:\Program Files\OpenSSL-Win64\bin`

#### Добавление OpenSSL в PATH:

1. Откройте **Системные переменные**:
   - Нажмите `Win + X` → **Система**
   - **Дополнительные параметры системы**
   - **Переменные среды**

2. В разделе **Системные переменные** найдите `Path`
3. Нажмите **Изменить** → **Создать**
4. Добавьте: `C:\Program Files\OpenSSL-Win64\bin`
5. Нажмите **ОК** везде

6. **Перезапустите** командную строку/PowerShell

### Проверка установки OpenSSL

Откройте **PowerShell** или **CMD** и выполните:

```powershell
openssl version
```

Должно вывести что-то вроде: `OpenSSL 3.x.x`

## 🚀 Установка проекта

### 1. Установите зависимости

Откройте **PowerShell** или **CMD** в директории проекта:

```powershell
cd nestjs-app
npm install
```

### 2. Сгенерируйте SSL сертификаты

Теперь выполните:

```powershell
npm run generate-ssl
```

Эта команда использует **Node.js скрипт** и работает на всех платформах!

Альтернативно, можно использовать PowerShell версию:

```powershell
npm run generate-ssl:powershell
```

Вы должны увидеть:

```
✅ SSL certificates generated successfully!

Files created:
  📄 ssl/key.pem
  📄 ssl/cert.pem

⚠️  Note: These are self-signed certificates for development only.
```

### 3. Настройте переменные окружения

Скопируйте пример файла:

```powershell
copy .env.example .env
```

Откройте `.env` в любом текстовом редакторе (например, Notepad++) и заполните:

```env
MERCHANT_ID=ваш_merchant_id
MERCHANT_KEY_ID=ваш_key_id
MERCHANT_SECRET_KEY=ваш_secret_key

PORT=3000
NODE_ENV=development
RUN_ENVIRONMENT=apitest.cybersource.com

ENABLE_LOG=true
LOG_DIRECTORY=logs
LOG_FILE_NAME=cybs
LOG_FILE_MAX_SIZE=5242880
ENABLE_MASKING=true
```

#### 🔑 Где получить ключи?

1. Зарегистрируйтесь: https://ebc2test.cybersource.com
2. **Payment Configuration** → **Key Management**
3. **Create New Key** → **REST API**
4. Сохраните:
   - **Merchant ID**
   - **Key ID**
   - **Secret Key**

### 4. Запустите приложение

```powershell
npm run start:dev
```

Или для production:

```powershell
npm run build
npm run start:prod
```

### 5. Откройте в браузере

Перейдите на: **https://localhost:3000**

> ⚠️ **Важно**: Браузер покажет предупреждение о безопасности (самоподписанный сертификат).

**В Chrome/Edge:**
1. Нажмите **Дополнительно** (Advanced)
2. Нажмите **Продолжить на localhost** (Proceed to localhost)

**В Firefox:**
1. Нажмите **Дополнительно** (Advanced)
2. Нажмите **Принять риск и продолжить** (Accept the Risk and Continue)

## 🛠️ Решение проблем

### Проблема: "openssl не является внутренней командой"

**Решение:**
1. Убедитесь, что OpenSSL установлен
2. Проверьте, что OpenSSL добавлен в PATH
3. Перезапустите PowerShell/CMD
4. Проверьте: `openssl version`

### Проблема: "npm run generate-ssl не работает"

**Решение:**
Попробуйте альтернативные команды:

```powershell
# Node.js версия (должна работать всегда)
npm run generate-ssl

# PowerShell версия
npm run generate-ssl:powershell

# Или вручную через OpenSSL
mkdir ssl
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Проблема: "Не удается запустить, так как выполнение сценариев отключено"

**Решение:**
Откройте PowerShell **от имени администратора** и выполните:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Затем попробуйте снова.

### Проблема: "Cannot find module"

**Решение:**
```powershell
# Удалите node_modules и переустановите
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Проблема: "EADDRINUSE: address already in use :::3000"

**Решение:**
Порт 3000 занят. Измените порт в `.env`:

```env
PORT=3001
```

Или найдите и закройте процесс:

```powershell
# Найти процесс на порту 3000
netstat -ano | findstr :3000

# Закрыть процесс (замените PID на номер из предыдущей команды)
taskkill /PID <PID> /F
```

### Проблема: "ERR_CERT_AUTHORITY_INVALID"

**Решение:**
Это нормально для самоподписанных сертификатов. Просто нажмите "Продолжить" в браузере.

Для постоянного решения (опционально):
1. Импортируйте `ssl/cert.pem` в доверенные сертификаты Windows
2. Используйте ngrok или локальный туннель с валидным SSL

## 📝 Полезные команды Windows

### PowerShell

```powershell
# Просмотр файлов
Get-ChildItem

# Просмотр содержимого файла
Get-Content .env

# Очистка консоли
Clear-Host

# Проверка версии Node.js
node --version

# Проверка версии npm
npm --version

# Остановка сервера
Ctrl + C
```

### CMD

```cmd
# Просмотр файлов
dir

# Просмотр содержимого файла
type .env

# Очистка консоли
cls

# Остановка сервера
Ctrl + C
```

## 🎯 Рекомендуемые инструменты для Windows

- **VS Code** - Лучший редактор для Node.js/TypeScript
- **Windows Terminal** - Современный терминал
- **Git for Windows** - Включает Git Bash и OpenSSL
- **Postman** - Тестирование API

## 📚 Дополнительные ресурсы

- [Node.js для Windows](https://nodejs.org/en/download/)
- [Git for Windows](https://git-scm.com/download/win)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Windows Terminal](https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701)

## ✅ Контрольный список

- [ ] Node.js >= 16.0.0 установлен
- [ ] OpenSSL установлен и в PATH
- [ ] `npm install` выполнен успешно
- [ ] SSL сертификаты сгенерированы (`npm run generate-ssl`)
- [ ] Файл `.env` создан и заполнен
- [ ] Приложение запускается (`npm run start:dev`)
- [ ] Браузер открывает https://localhost:3000
- [ ] Тестовая транзакция проходит успешно

---

**Готово!** 🎉 Теперь вы можете работать с CyberSource Unified Checkout на Windows!

Если возникли дополнительные вопросы, проверьте [README.md](README.md) или [QUICKSTART.md](QUICKSTART.md).
