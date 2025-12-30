<?php
/**
 * Test file to check backend path
 * Access: https://idap.infinet.ps/api/test-path.php
 */

header('Content-Type: application/json');

$results = [
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
    'current_dir' => __DIR__,
    'current_file' => __FILE__,
    'paths_tested' => [],
];

// Method 1: Use DOCUMENT_ROOT
if (isset($_SERVER['DOCUMENT_ROOT'])) {
    $docRoot = $_SERVER['DOCUMENT_ROOT'];
    $distPublicDir = $docRoot;
    $distDir = dirname($distPublicDir);
    $rootDir = dirname($distDir);
    $backendPath = $rootDir . '/backend/public/index.php';
    $realPath = realpath($backendPath);
    
    $results['paths_tested'][] = [
        'method' => 'DOCUMENT_ROOT',
        'path' => $backendPath,
        'realpath' => $realPath,
        'exists' => file_exists($backendPath),
        'readable' => is_readable($backendPath),
    ];
}

// Method 2: Relative from current file
$currentDir = __DIR__;
$publicDir = dirname($currentDir);
$distDir = dirname($publicDir);
$rootDir = dirname($distDir);
$backendPath = $rootDir . '/backend/public/index.php';
$realPath = realpath($backendPath);

$results['paths_tested'][] = [
    'method' => 'Relative from current file',
    'path' => $backendPath,
    'realpath' => $realPath,
    'exists' => file_exists($backendPath),
    'readable' => is_readable($backendPath),
];

// Method 3: Alternative paths
$alternativePaths = [
    dirname(dirname(dirname(__DIR__))) . '/backend/public/index.php',
    dirname(dirname($_SERVER['DOCUMENT_ROOT'] ?? __DIR__)) . '/backend/public/index.php',
];

foreach ($alternativePaths as $path) {
    $realPath = realpath($path);
    $results['paths_tested'][] = [
        'method' => 'Alternative path',
        'path' => $path,
        'realpath' => $realPath,
        'exists' => file_exists($path),
        'readable' => is_readable($path),
    ];
}

// Find working path
$workingPath = null;
foreach ($results['paths_tested'] as $test) {
    if ($test['exists'] && $test['readable']) {
        $workingPath = $test['realpath'] ?: $test['path'];
        break;
    }
}

$results['working_path'] = $workingPath;
$results['status'] = $workingPath ? 'SUCCESS' : 'FAILED';

echo json_encode($results, JSON_PRETTY_PRINT);

