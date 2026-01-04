<?php
/**
 * Test if proxy is working
 * Access: https://idap.infinet.ps/api/test-proxy.php
 */

header('Content-Type: application/json');

$result = [
    'status' => 'proxy_working',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'not set',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'not set',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'not set',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
    'backend_path' => null,
    'backend_exists' => false,
];

// Try to find backend
if (isset($_SERVER['DOCUMENT_ROOT'])) {
    $docRoot = $_SERVER['DOCUMENT_ROOT'];
    $rootDir = dirname(dirname($docRoot));
    $backendPath = $rootDir . '/backend/public/index.php';
    $realPath = realpath($backendPath);
    if ($realPath) {
        $backendPath = $realPath;
    }
    $result['backend_path'] = $backendPath;
    $result['backend_exists'] = file_exists($backendPath);
}

echo json_encode($result, JSON_PRETTY_PRINT);

