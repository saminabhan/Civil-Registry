<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\CitizenController;

// Test endpoint to check if API is working (no database required)
Route::get('/test', function () {
    return response()->json([
        'message' => 'API is working',
        'timestamp' => now()->toDateTimeString(),
        'php_version' => PHP_VERSION,
        'laravel_version' => app()->version(),
    ]);
});

// Very simple test endpoint (no Laravel dependencies)
Route::get('/ping', function () {
    return response()->json(['pong' => true]);
});

// Health check endpoint to test database connection
Route::get('/health', function () {
    try {
        \DB::connection()->getPdo();
        return response()->json([
            'status' => 'healthy',
            'database' => 'connected',
            'timestamp' => now()->toDateTimeString(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'unhealthy',
            'database' => 'disconnected',
            'error' => config('app.debug') ? $e->getMessage() : 'Database connection failed',
            'timestamp' => now()->toDateTimeString(),
        ], 500);
    }
});

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
        } catch (\Illuminate\Auth\AuthenticationException $e) {
            return response()->json([
                'message' => 'Unauthenticated. Please log in.'
            ], 401);
        } catch (\Exception $e) {
            \Log::error('Error in /auth/me: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'An error occurred while fetching user data.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                'file' => config('app.debug') ? $e->getFile() . ':' . $e->getLine() : null,
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
