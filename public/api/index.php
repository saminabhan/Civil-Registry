<?php
/**
 * API Proxy - Redirects all API requests to Laravel backend
 * Phone API (e-gaza.com) is handled HERE to avoid Laravel route/cache issues.
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

$originalUri = $_SERVER['REQUEST_URI'] ?? '/';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ========== Phone API proxy (e-gaza.com) – معالجة هنا بدون Laravel ==========
const PHONE_API_BASE = 'https://e-gaza.com/api';

// POST /api/phone-proxy/login
if ($requestMethod === 'POST' && preg_match('#^/api/phone-proxy/login(?:\?|$)#', $originalUri)) {
    $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    if ($username === '' && $password === '') {
        header('Content-Type: application/json');
        http_response_code(422);
        echo json_encode(['error' => 'username and password required']);
        exit;
    }
    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'content' => http_build_query(['username' => $username, 'password' => $password]),
            'timeout' => 15,
        ],
    ]);
    $response = @file_get_contents(PHONE_API_BASE . '/login', false, $ctx);
    $code = 200;
    if (isset($http_response_header[0]) && preg_match('/ (\d{3}) /', $http_response_header[0], $m)) {
        $code = (int) $m[1];
    }
    header('Content-Type: application/json');
    http_response_code($code);
    echo $response !== false ? $response : json_encode(['error' => 'Failed to reach phone API']);
    exit;
}

// GET /api/phone-proxy/fetch-by-id/{id}
if ($requestMethod === 'GET' && preg_match('#^/api/phone-proxy/fetch-by-id/([0-9]+)(?:\?|$)#', $originalUri, $m)) {
    $id = $m[1];
    $token = null;
    if (function_exists('apache_request_headers')) {
        $h = apache_request_headers();
        foreach ($h as $k => $v) {
            if (strtolower($k) === 'x-phone-api-token') {
                $token = $v;
                break;
            }
        }
    }
    if (!$token) {
        $token = $_SERVER['HTTP_X_PHONE_API_TOKEN'] ?? $_SERVER['REDIRECT_HTTP_X_PHONE_API_TOKEN'] ?? '';
    }
    if ($token === '') {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => 'X-Phone-API-Token required']);
        exit;
    }
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "Accept: application/json\r\nAuthorization: Bearer " . trim($token) . "\r\n",
            'timeout' => 15,
        ],
    ]);
    $response = @file_get_contents(PHONE_API_BASE . '/fetch-by-id/' . $id, false, $ctx);
    $code = 200;
    if (isset($http_response_header[0]) && preg_match('/ (\d{3}) /', $http_response_header[0], $m)) {
        $code = (int) $m[1];
    }
    header('Content-Type: application/json');
    http_response_code($code);
    echo $response !== false ? $response : json_encode(['error' => 'Failed to reach phone API']);
    exit;
}

// ========== بقية الطلبات تذهب إلى Laravel ==========

// Log for debugging (remove in production)
// error_log("API Proxy: Original URI = " . $originalUri);

// Path to Laravel backend
// From: dist/public/api/index.php
// To: backend/public/index.php
// Structure: Civil-Registry/dist/public/api/index.php -> Civil-Registry/backend/public/index.php

$backendPath = null;

// Method 1: Use DOCUMENT_ROOT (most reliable)
if (isset($_SERVER['DOCUMENT_ROOT'])) {
    $docRoot = $_SERVER['DOCUMENT_ROOT']; // Should be: /path/to/Civil-Registry/dist/public
    $distPublicDir = $docRoot;
    $distDir = dirname($distPublicDir); // dist
    $rootDir = dirname($distDir); // Civil-Registry
    $backendPath = $rootDir . '/backend/public/index.php';
    
    // Try to get realpath
    $realPath = realpath($backendPath);
    if ($realPath) {
        $backendPath = $realPath;
    }
}

// Method 2: Try relative path from current file
if (!$backendPath || !file_exists($backendPath)) {
    $currentDir = __DIR__; // dist/public/api
    $publicDir = dirname($currentDir); // dist/public
    $distDir = dirname($publicDir); // dist
    $rootDir = dirname($distDir); // Civil-Registry
    $backendPath = $rootDir . '/backend/public/index.php';
    
    $realPath = realpath($backendPath);
    if ($realPath) {
        $backendPath = $realPath;
    }
}

// Method 3: Try alternative paths
if (!$backendPath || !file_exists($backendPath)) {
    $possiblePaths = [
        dirname(dirname(dirname(__DIR__))) . '/backend/public/index.php',
        dirname(dirname($_SERVER['DOCUMENT_ROOT'] ?? __DIR__)) . '/backend/public/index.php',
    ];
    
    foreach ($possiblePaths as $path) {
        $realPath = realpath($path);
        if ($realPath && file_exists($realPath)) {
            $backendPath = $realPath;
            break;
        }
        if (file_exists($path)) {
            $backendPath = $path;
            break;
        }
    }
}

// Check if backend exists
if (!$backendPath || !file_exists($backendPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'Backend not found',
        'error' => 'Laravel backend is not installed correctly',
        'debug' => [
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
            'current_dir' => __DIR__,
            'tried_path' => $backendPath,
            'original_uri' => $originalUri,
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

// Change directory to backend/public so Laravel can find its files
$backendPublicDir = dirname($backendPath);
chdir($backendPublicDir);

// Preserve the original REQUEST_URI for Laravel
// The original URI is already /api/... (e.g., /api/ping, /api/auth/login)
// Laravel 11 with withRouting(api: ...) automatically adds /api prefix
// So routes in api.php are defined without /api (e.g., Route::get('/ping', ...))
// Laravel will match /api/ping to /ping in api.php automatically

// Keep the original URI as is - Laravel will handle the /api prefix automatically
$finalUri = $originalUri;

// Ensure it starts with /api
if (strpos($finalUri, '/api') !== 0) {
    $finalUri = '/api' . $finalUri;
}

// Laravel 11 automatically adds /api prefix when using withRouting(api: ...)
// So routes in api.php are defined without /api prefix
// If REQUEST_URI is /api/auth/login, Laravel will look for /auth/login in api.php
// But we need to pass /api/auth/login to Laravel, and it will handle the routing

// Set REQUEST_URI for Laravel
// Laravel 11 with withRouting(api: ...) automatically adds /api prefix
// So routes in api.php are defined without /api (e.g., '/auth/login')
// Laravel expects REQUEST_URI to be the full path (e.g., '/api/auth/login')
// But SCRIPT_NAME should be relative to backend/public, not /api/index.php
$_SERVER['REQUEST_URI'] = $finalUri;
$_SERVER['SCRIPT_NAME'] = '/index.php';  // Laravel expects this to be /index.php
$_SERVER['PHP_SELF'] = '/index.php';     // Laravel expects this to be /index.php
$_SERVER['SCRIPT_FILENAME'] = $backendPath;

// Log for debugging (remove in production)
// error_log("API Proxy: Final URI = " . $finalUri);
// error_log("API Proxy: Backend Path = " . $backendPath);
// error_log("API Proxy: Request Method = " . ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

// Preserve REQUEST_METHOD (important for POST requests)
// It should already be set by Apache, but ensure it's preserved
if (!isset($_SERVER['REQUEST_METHOD'])) {
    $_SERVER['REQUEST_METHOD'] = $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

// Preserve request body for POST requests
// Laravel will read from php://input automatically

// IMPORTANT: Preserve Authorization header for Bearer token authentication
// Apache may not pass Authorization header to PHP by default, so we need to set it manually
// Try multiple methods to get the Authorization header

$authHeader = null;

// Method 1: Check HTTP_AUTHORIZATION (set by Apache .htaccess RewriteRule)
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
}

// Method 2: Check REDIRECT_HTTP_AUTHORIZATION (some servers use this)
if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}

// Method 3: Check $_ENV (Apache may set it as environment variable)
if (!$authHeader && isset($_ENV['HTTP_AUTHORIZATION'])) {
    $authHeader = $_ENV['HTTP_AUTHORIZATION'];
}

// Method 4: Use apache_request_headers() if available
if (!$authHeader && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    }
    // Also check case-insensitive
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $authHeader = $value;
            break;
        }
    }
}

// Set the header in $_SERVER so Laravel can read it
if ($authHeader) {
    $_SERVER['HTTP_AUTHORIZATION'] = $authHeader;
    // Also set it as a header for Laravel Request::capture()
    putenv('HTTP_AUTHORIZATION=' . $authHeader);
}

// Include Laravel's index.php
// Laravel will handle the routing based on REQUEST_URI
try {
    require $backendPath;
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'Internal server error',
        'error' => 'Failed to load Laravel backend',
        'debug' => [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

