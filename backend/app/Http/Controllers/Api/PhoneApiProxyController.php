<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Proxy for e-gaza.com phone API (CORS + auth).
 * Login and fetch-by-id go through our backend so the browser doesn't hit e-gaza.com directly.
 */
class PhoneApiProxyController extends Controller
{
    private const PHONE_API_BASE = 'https://e-gaza.com/api';

    /**
     * POST /api/phone-proxy/login
     * Forwards to e-gaza.com/api/login, returns token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        try {
            $response = Http::timeout(15)
                ->asForm()
                ->post(self::PHONE_API_BASE . '/login', [
                    'username' => $request->input('username'),
                    'password' => $request->input('password'),
                ]);

            $status = $response->status();
            $body = $response->body();

            return response($body, $status)
                ->header('Content-Type', $response->header('Content-Type') ?: 'application/json');
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'فشل الاتصال بخدمة الهاتف: ' . $e->getMessage(),
            ], 502);
        }
    }

    /**
     * GET /api/phone-proxy/fetch-by-id/{id}
     * Forwards to e-gaza.com with token from X-Phone-API-Token (Sanctum uses Authorization).
     */
    public function fetchById(Request $request, string $id)
    {
        $token = $request->header('X-Phone-API-Token');
        if (!$token) {
            return response()->json(['error' => 'مطلوب توكن خدمة الهاتف (X-Phone-API-Token)'], 401);
        }

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Authorization' => 'Bearer ' . $token,
                ])
                ->get(self::PHONE_API_BASE . '/fetch-by-id/' . $id);

            $status = $response->status();
            $body = $response->body();

            return response($body, $status)
                ->header('Content-Type', $response->header('Content-Type') ?: 'application/json');
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'فشل جلب البيانات الهاتفية: ' . $e->getMessage(),
            ], 502);
        }
    }
}
