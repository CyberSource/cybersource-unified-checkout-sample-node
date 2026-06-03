#!/bin/bash

# Создание директории для SSL сертификатов
mkdir -p ssl

# Генерация самоподписанного сертификата
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "✓ SSL certificates generated successfully in ./ssl directory"
echo "  - ssl/key.pem"
echo "  - ssl/cert.pem"
echo ""
echo "Note: These are self-signed certificates for development only."
echo "Your browser will show a security warning - this is normal for local development."
