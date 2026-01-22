#!/usr/bin/env node

/**
 * Cross-platform SSL certificate generator
 * Works on Windows, macOS, and Linux
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sslDir = path.join(process.cwd(), 'ssl');
const keyFile = path.join(sslDir, 'key.pem');
const certFile = path.join(sslDir, 'cert.pem');

console.log('\n🔐 Generating SSL certificates for localhost...\n');

// Создание директории для SSL
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
  console.log('✓ Created ssl/ directory');
}

// Проверка наличия OpenSSL
function checkOpenSSL() {
  try {
    execSync('openssl version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

if (!checkOpenSSL()) {
  console.error('❌ OpenSSL not found!\n');
  console.log('Please install OpenSSL:');
  console.log('');

  if (process.platform === 'win32') {
    console.log('Windows:');
    console.log('  1. Via Chocolatey: choco install openssl');
    console.log('  2. Download from: https://slproweb.com/products/Win32OpenSSL.html');
    console.log('  3. Install Git for Windows (includes OpenSSL)');
  } else if (process.platform === 'darwin') {
    console.log('macOS:');
    console.log('  brew install openssl');
  } else {
    console.log('Linux:');
    console.log('  sudo apt-get install openssl  # Debian/Ubuntu');
    console.log('  sudo yum install openssl      # RedHat/CentOS');
  }

  console.log('');
  process.exit(1);
}

// Генерация сертификата
try {
  const command = `openssl req -x509 -newkey rsa:4096 -keyout "${keyFile}" -out "${certFile}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`;

  execSync(command, { stdio: 'ignore' });

  console.log('✅ SSL certificates generated successfully!\n');
  console.log('Files created:');
  console.log(`  📄 ${path.relative(process.cwd(), keyFile)}`);
  console.log(`  📄 ${path.relative(process.cwd(), certFile)}`);
  console.log('');
  console.log('⚠️  Note: These are self-signed certificates for development only.');
  console.log('   Your browser will show a security warning - this is normal.');
  console.log('');
  console.log('✓ You can now run: npm start');
  console.log('');
} catch (error) {
  console.error('❌ Failed to generate SSL certificates');
  console.error('Error:', error.message);
  process.exit(1);
}
