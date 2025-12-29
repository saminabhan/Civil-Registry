<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Civil Registry API',
        'version' => '1.0.0',
        'api_documentation' => '/api',
        'note' => 'This is the API backend. Use the frontend application at https://civil.infinet.ps'
    ]);
});
