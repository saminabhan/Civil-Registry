<?php
/**
 * Test if Laravel receives requests correctly
 * Access: https://idap.infinet.ps/api/test-laravel.php
 */

// Path to Laravel backend
$docRoot = $_SERVER['DOCUMENT_ROOT'];
$rootDir = dirname(dirname($docRoot));
$backendPath = $rootDir . '/backend/public/index.php';

if (!file_exists($backendPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Backend not found']);
    exit;
}

// Change directory to backend/public
chdir(dirname($backendPath));

// Set REQUEST_URI to test Laravel
$_SERVER['REQUEST_URI'] = '/api/test';
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = $backendPath;
$_SERVER['REQUEST_METHOD'] = 'GET';

// Include Laravel
require $backendPath;

