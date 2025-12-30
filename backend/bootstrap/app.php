<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Configure CORS - must be first in the middleware stack
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        
        // Configure Sanctum to use stateless API authentication
        $middleware->statefulApi();
        
        // Disable CSRF for API routes
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in.'
                ], 401);
            }
            
            // For web routes, you'd redirect to login
            // But since you don't have a login route, we'll return JSON
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        });
        
        // Handle all exceptions for API routes - MUST be last
        $exceptions->render(function (\Throwable $e, $request) {
            // Always return JSON for API routes
            if ($request->is('api/*') || $request->expectsJson() || $request->wantsJson()) {
                \Log::error('API Error: ' . $e->getMessage(), [
                    'exception' => $e,
                    'trace' => $e->getTraceAsString(),
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                ]);
                
                $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                
                return response()->json([
                    'message' => 'An error occurred',
                    'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                    'file' => config('app.debug') ? $e->getFile() . ':' . $e->getLine() : null,
                    'type' => config('app.debug') ? get_class($e) : null,
                ], $statusCode);
            }
        });
    })
    ->create();