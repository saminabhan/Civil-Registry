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
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in.'
                ], 401);
            }
            
            return response()->json([
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'isAdmin' => (bool) $user->is_admin,
                'isActive' => (bool) $user->is_active,
                'createdAt' => $user->created_at,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in /auth/me: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while fetching user data.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
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
        try {
            $request->validate([
                'action' => 'required|string|max:50',
                'details' => 'nullable|string',
            ]);

            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in.'
                ], 401);
            }

            \App\Models\AuditLog::create([
                'user_id' => $user->id,
                'action' => $request->action,
                'details' => $request->details,
            ]);

            return response()->json(['message' => 'Log created'], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error in /logs: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while creating log.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    });
});
