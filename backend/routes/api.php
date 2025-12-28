<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\CitizenController;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/auth/login', function () {
    return response()->json([
        'message' => 'This endpoint only accepts POST requests. Please use the login form.',
        'method' => 'POST',
        'endpoint' => '/api/auth/login'
    ], 405);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', function (Request $request) {
        $user = $request->user();
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'isAdmin' => (bool) $user->is_admin,
            'isActive' => (bool) $user->is_active,
            'createdAt' => $user->created_at,
        ];
    });
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::patch('/users/{id}/status', [UserController::class, 'toggleStatus']);
    
    Route::get('/citizens/search', [CitizenController::class, 'search']);
    
    Route::get('/logs', [AuditLogController::class, 'index']);
    Route::get('/logs/users', [AuditLogController::class, 'getUsersWithLogCounts']);
    Route::get('/logs/user/{userId}', [AuditLogController::class, 'getUserLogs']);
    Route::get('/logs/user/{userId}/searches', [AuditLogController::class, 'getUserRecentSearches']);
    Route::post('/logs', function (Request $request) {
        $request->validate([
            'action' => 'required|string|max:50',
            'details' => 'nullable|string',
        ]);

        \App\Models\AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => $request->action,
            'details' => $request->details,
        ]);

        return response()->json(['message' => 'Log created'], 201);
    });
});
