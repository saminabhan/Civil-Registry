<?php
/**
 * Debug file to check what Laravel receives
 * Access: https://idap.infinet.ps/api/debug.php
 */

header('Content-Type: application/json');

$debug = [
    'server_vars' => [
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'not set',
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'not set',
        'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? 'not set',
        'PHP_SELF' => $_SERVER['PHP_SELF'] ?? 'not set',
        'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
        'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? 'not set',
    ],
    'request_body' => file_get_contents('php://input'),
    'post_data' => $_POST,
    'get_data' => $_GET,
];

// Try to find backend
$backendPath = null;
if (isset($_SERVER['DOCUMENT_ROOT'])) {
    $docRoot = $_SERVER['DOCUMENT_ROOT'];
    $rootDir = dirname(dirname($docRoot));
    $backendPath = $rootDir . '/backend/public/index.php';
    $realPath = realpath($backendPath);
    if ($realPath) {
        $backendPath = $realPath;
    }
}

if (!$backendPath || !file_exists($backendPath)) {
    $currentDir = __DIR__;
    $rootDir = dirname(dirname(dirname($currentDir)));
    $backendPath = $rootDir . '/backend/public/index.php';
    $realPath = realpath($backendPath);
    if ($realPath) {
        $backendPath = $realPath;
    }
}

$debug['backend'] = [
    'path' => $backendPath,
    'exists' => file_exists($backendPath ?? ''),
    'readable' => is_readable($backendPath ?? ''),
];

echo json_encode($debug, JSON_PRETTY_PRINT);

