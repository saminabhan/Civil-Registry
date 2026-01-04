<?php
/**
 * Test Authorization header forwarding
 * Access: https://civil.infinet.ps/api/test-auth.php
 * Use: curl -H "Authorization: Bearer test123" https://civil.infinet.ps/api/test-auth.php
 */

header('Content-Type: application/json');

$result = [
    'http_authorization' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'not set',
    'redirect_http_authorization' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'not set',
    'env_http_authorization' => $_ENV['HTTP_AUTHORIZATION'] ?? 'not set',
    'apache_headers' => null,
];

// Try apache_request_headers()
if (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $result['apache_headers'] = $headers;
    if (isset($headers['Authorization'])) {
        $result['authorization_from_apache'] = $headers['Authorization'];
    }
    // Check case-insensitive
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $result['authorization_from_apache_case_insensitive'] = $value;
            break;
        }
    }
}

// Check all $_SERVER keys that might contain Authorization
$result['server_keys_with_auth'] = [];
foreach ($_SERVER as $key => $value) {
    if (stripos($key, 'AUTHORIZATION') !== false || stripos($key, 'AUTH') !== false) {
        $result['server_keys_with_auth'][$key] = $value;
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);

