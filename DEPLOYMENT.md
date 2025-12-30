# تعليمات النشر على السيرفر

## الهيكل المطلوب على السيرفر

```
/public_html/Civil-Registry/
├── backend/          (Laravel API)
│   ├── public/
│   │   ├── index.php
│   │   └── .htaccess
│   ├── app/
│   ├── config/
│   ├── routes/
│   └── ...
├── dist/             (Frontend Build)
│   └── public/
│       ├── index.html
│       ├── .htaccess  (يجب رفعه!)
│       └── assets/
└── client/           (Source code - غير مطلوب على السيرفر)
```

## إعداد cPanel

### 1. إعداد Subdomain

في cPanel → Subdomains:
- **Subdomain**: `idap`
- **Domain**: `infinet.ps`
- **Document Root**: `/public_html/Civil-Registry/dist/public`

### 2. رفع الملفات

**ملفات Backend:**
```
backend/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/
├── routes/
├── storage/
├── vendor/
├── .env
├── artisan
└── composer.json
```

**ملفات Frontend:**
```
dist/public/
├── index.html
├── .htaccess  (مهم جداً!)
├── api/
│   └── index.php  (مهم جداً! - API Proxy)
├── assets/
└── favicon.png
```

### 3. ملفات مهمة في dist/public

**يجب رفع هذه الملفات:**
```
dist/public/.htaccess  - يعيد توجيه /api/* إلى api/index.php
dist/public/api/index.php  - Proxy يعيد توجيه الطلبات إلى Laravel backend
```

هذه الملفات تعمل معاً لإعادة توجيه `/api/*` إلى `backend/public/index.php`

### 4. إعدادات Backend

**ملف .env في backend:**
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

### 5. Permissions

```bash
cd /public_html/Civil-Registry/backend
chmod -R 775 storage bootstrap/cache
chown -R username:username storage bootstrap/cache
```

### 6. تشغيل Migrations

```bash
cd /public_html/Civil-Registry/backend
php artisan migrate --force
php artisan db:seed --class=AdminUserSeeder
```

### 7. مسح Cache

```bash
cd /public_html/Civil-Registry/backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

## الاختبار

### 1. اختبار Frontend
```
https://idap.infinet.ps/
```
يجب أن ترى صفحة تسجيل الدخول

### 2. اختبار API
```
https://idap.infinet.ps/api/ping
```
يجب أن ترى: `{"pong": true}`

```
https://idap.infinet.ps/api/test
```
يجب أن ترى معلومات عن الـ API

## ملاحظات مهمة

1. **ملف .htaccess في dist/public مهم جداً** - بدونها لن يعمل الـ API
2. **DocumentRoot** يجب أن يشير إلى `dist/public` وليس `backend/public`
3. **ملف .env** يجب أن يكون في مجلد `backend`
4. **Permissions** مهمة جداً لـ `storage` و `bootstrap/cache`

