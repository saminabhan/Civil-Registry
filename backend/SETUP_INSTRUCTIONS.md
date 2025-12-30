# تعليمات إعداد Backend على السيرفر

## المشكلة الحالية
الـ backend يعيد HTML 500 error بدلاً من JSON. هذا يعني أن الخطأ يحدث قبل أن يصل للكود.

## الخطوات المطلوبة على السيرفر

### 1. التحقق من قاعدة البيانات
```bash
# تأكد من أن قاعدة البيانات موجودة
mysql -u infinet_civil -p
# ثم
SHOW DATABASES;
# يجب أن ترى infinet_civil
```

### 2. التحقق من ملف .env
تأكد من أن ملف `.env` في مجلد `backend` يحتوي على:
```env
APP_NAME=Laravel
APP_ENV=production
APP_KEY=base64:+xAjT8d0NvCRbO+kyjx0x6DT4IpkWLtxSnbgrejBAO4=
APP_DEBUG=false
APP_URL=https://idap.infinet.ps

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=infinet_civil
DB_USERNAME=infinet_civil
DB_PASSWORD=M7TJWh8jJBMOiyOM

SESSION_DRIVER=cookie
SESSION_DOMAIN=.infinet.ps
SANCTUM_STATEFUL_DOMAINS=idap.infinet.ps,*.infinet.ps
```

### 3. تشغيل Migrations
```bash
cd backend
php artisan migrate --force
```

### 4. إنشاء مستخدم Admin
```bash
php artisan db:seed --class=AdminUserSeeder
```

أو يدوياً:
```bash
php artisan tinker
```
ثم:
```php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

User::create([
    'username' => 'admin',
    'name' => 'System Admin',
    'password' => Hash::make('Admin.IDAP2025'),
    'is_admin' => true,
    'is_active' => true,
]);
```

### 5. التحقق من Permissions
```bash
chmod -R 775 storage
chmod -R 775 bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 6. مسح Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### 7. التحقق من الـ PHP Extensions
تأكد من تثبيت:
- pdo_mysql
- mbstring
- openssl
- tokenizer
- json
- xml

### 8. التحقق من DocumentRoot في Apache/Nginx

**لـ Apache (.htaccess):**
تأكد من أن DocumentRoot يشير إلى:
```
/home/username/public_html/backend/public
```
أو
```
/var/www/html/backend/public
```

**لـ cPanel:**
- DocumentRoot يجب أن يكون: `public_html/backend/public`
- أو استخدم subdomain وأشر إلى `backend/public`

### 9. اختبار الـ API

**اختبار بسيط (ping):**
افتح في المتصفح:
```
https://idap.infinet.ps/api/ping
```
يجب أن ترى:
```json
{"pong": true}
```

**اختبار كامل:**
```
https://idap.infinet.ps/api/test
```
يجب أن ترى:
```json
{
  "message": "API is working",
  "timestamp": "...",
  "php_version": "...",
  "laravel_version": "..."
}
```

**إذا رأيت HTML 500 error:**
- المشكلة في إعدادات الـ web server
- DocumentRoot غير صحيح
- الـ .htaccess لا يعمل

### 9. التحقق من قاعدة البيانات
```
https://idap.infinet.ps/api/health
```

يجب أن ترى:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

## إذا استمرت المشكلة

### تحقق من الـ Error Logs
```bash
tail -f storage/logs/laravel.log
```

### تحقق من Apache/Nginx Error Log
```bash
# Apache
tail -f /var/log/apache2/error.log

# Nginx
tail -f /var/log/nginx/error.log
```

### تحقق من PHP Error Log
```bash
tail -f /var/log/php-fpm/error.log
# أو
tail -f /var/log/php_errors.log
```

## ملاحظات مهمة

1. **APP_DEBUG**: يجب أن يكون `false` في الإنتاج
2. **APP_KEY**: يجب أن يكون موجوداً ومولّداً
3. **Database**: يجب أن تكون جميع الـ migrations تم تشغيلها
4. **Permissions**: يجب أن تكون `storage` و `bootstrap/cache` قابلة للكتابة

