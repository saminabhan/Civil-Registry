# حل مشاكل الـ Backend

## المشكلة: HTML 500 Error بدلاً من JSON

إذا كان الـ backend يعيد HTML 500 error بدلاً من JSON، فهذا يعني أن الخطأ يحدث قبل أن يصل للكود.

### الحلول الممكنة:

#### 1. التحقق من DocumentRoot

**في cPanel:**
- اذهب إلى Subdomains أو Addon Domains
- تأكد من أن DocumentRoot يشير إلى: `backend/public`
- **ليس** `backend` فقط

**مثال صحيح:**
```
DocumentRoot: /home/username/public_html/backend/public
```

**مثال خاطئ:**
```
DocumentRoot: /home/username/public_html/backend
```

#### 2. التحقق من .htaccess

تأكد من أن ملف `.htaccess` موجود في:
```
backend/public/.htaccess
```

#### 3. التحقق من PHP Version

Laravel 11 يحتاج PHP 8.2 أو أحدث:
```bash
php -v
```

#### 4. التحقق من PHP Extensions

```bash
php -m | grep -E "pdo_mysql|mbstring|openssl|tokenizer|json|xml"
```

#### 5. التحقق من Permissions

```bash
cd backend
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

#### 6. التحقق من Composer

```bash
cd backend
composer install --no-dev --optimize-autoloader
```

#### 7. التحقق من .env

تأكد من وجود ملف `.env` في مجلد `backend`:
```bash
ls -la backend/.env
```

#### 8. اختبار بسيط

أنشئ ملف `test.php` في `backend/public/test.php`:
```php
<?php
phpinfo();
```

ثم افتح: `https://idap.infinet.ps/test.php`

إذا عمل هذا الملف، فالمشكلة في Laravel.
إذا لم يعمل، فالمشكلة في إعدادات الـ web server.

#### 9. التحقق من Error Logs

```bash
# Laravel logs
tail -f backend/storage/logs/laravel.log

# Apache error log
tail -f /var/log/apache2/error.log

# PHP error log
tail -f /var/log/php-fpm/error.log
```

#### 10. التحقق من vendor Directory

```bash
cd backend
ls -la vendor/
```

إذا لم يكن موجوداً:
```bash
composer install
```

## إذا استمرت المشكلة

1. تحقق من أن جميع الملفات تم رفعها بشكل صحيح
2. تحقق من أن الـ DocumentRoot صحيح
3. تحقق من الـ error logs
4. اتصل بمسؤول السيرفر

