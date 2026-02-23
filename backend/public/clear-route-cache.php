<?php

$secret = 'CLEAR_ROUTES_2025';
if (!isset($_GET['key']) || $_GET['key'] !== $secret) {
    header('Content-Type: application/json');
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Invalid key']);
    exit;
}

$base = dirname(__DIR__);
$cacheDir = $base . '/bootstrap/cache';
$cleared = [];

foreach (['routes-v7.php', 'config.php', 'packages.php', 'services.php'] as $file) {
    $path = $cacheDir . '/' . $file;
    if (file_exists($path) && is_writable($path)) {
        if (@unlink($path)) {
            $cleared[] = $file;
        }
    }
}

// إذا المجلد موجود ومرتبط بـ Laravel، نحاول مسح أي routes-*.php
if (is_dir($cacheDir)) {
    foreach (glob($cacheDir . '/routes-*.php') ?: [] as $path) {
        if (is_writable($path) && @unlink($path)) {
            $cleared[] = basename($path);
        }
    }
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'ok' => true,
    'message' => 'تم مسح الكاش. جرّب الطلب مرة ثانية.',
    'cleared' => $cleared,
], JSON_UNESCAPED_UNICODE);
