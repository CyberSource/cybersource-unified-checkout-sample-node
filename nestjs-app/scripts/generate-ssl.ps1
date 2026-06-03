# PowerShell скрипт для генерации SSL сертификатов на Windows

Write-Host "Generating SSL certificates for localhost..." -ForegroundColor Green

# Создание директории для SSL
$sslDir = "ssl"
if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir | Out-Null
}

# Проверка наличия OpenSSL
$opensslPath = (Get-Command openssl -ErrorAction SilentlyContinue).Source

if ($null -eq $opensslPath) {
    Write-Host "`nOpenSSL not found. Trying to use Windows built-in certutil..." -ForegroundColor Yellow

    # Альтернативный способ для Windows без OpenSSL
    Write-Host "`nPlease install OpenSSL to generate certificates:" -ForegroundColor Red
    Write-Host "Option 1: Install via Chocolatey: choco install openssl" -ForegroundColor Yellow
    Write-Host "Option 2: Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    Write-Host "Option 3: Install Git for Windows (includes OpenSSL)" -ForegroundColor Yellow
    Write-Host "`nAfter installation, run this script again." -ForegroundColor Cyan
    exit 1
}

# Генерация самоподписанного сертификата
$subject = "/C=US/ST=State/L=City/O=Organization/CN=localhost"
$keyFile = "$sslDir/key.pem"
$certFile = "$sslDir/cert.pem"

& openssl req -x509 -newkey rsa:4096 -keyout $keyFile -out $certFile -days 365 -nodes -subj $subject 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ SSL certificates generated successfully!" -ForegroundColor Green
    Write-Host "  - $keyFile" -ForegroundColor Cyan
    Write-Host "  - $certFile" -ForegroundColor Cyan
    Write-Host "`nNote: These are self-signed certificates for development only." -ForegroundColor Yellow
    Write-Host "Your browser will show a security warning - this is normal for local development." -ForegroundColor Yellow
} else {
    Write-Host "`n✗ Failed to generate SSL certificates" -ForegroundColor Red
    Write-Host "Please check if OpenSSL is installed correctly." -ForegroundColor Yellow
    exit 1
}
