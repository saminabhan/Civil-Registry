<?php
/**
 * API Proxy - Redirects all API requests to Laravel backend
 * This file is in dist/public/api/ and redirects to ../backend/public/index.php
 */

// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors, but log them

// Get the original request URI
$originalUri = $_SERVER['REQUEST_URI'];

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
// Laravel expects /api/... in REQUEST_URI
// Extract the path after /api/ from the original URI
$apiPath = preg_replace('#^/api#', '', $originalUri);
if (empty($apiPath) || $apiPath === '/') {
    $apiPath = '/';
}

// Preserve query string
if (isset($_SERVER['QUERY_STRING']) && !empty($_SERVER['QUERY_STRING'])) {
    if (strpos($apiPath, '?') === false) {
        $apiPath .= '?' . $_SERVER['QUERY_STRING'];
    }
}

// Set REQUEST_URI to /api/... for Laravel
$_SERVER['REQUEST_URI'] = '/api' . $apiPath;
$_SERVER['SCRIPT_NAME'] = '/api/index.php';
$_SERVER['PHP_SELF'] = '/api/index.php';
$_SERVER['SCRIPT_FILENAME'] = $backendPath;

// Preserve other important server variables
if (!isset($_SERVER['REQUEST_METHOD'])) {
    $_SERVER['REQUEST_METHOD'] = 'GET';
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

