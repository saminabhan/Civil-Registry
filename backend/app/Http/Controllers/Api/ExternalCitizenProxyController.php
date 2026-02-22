<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Proxy for external civil registry API to avoid CORS.
 * Browser cannot call api.eservice.aiocp.org directly due to Access-Control-Allow-Origin.
 * This controller forwards requests server-side (no CORS).
 */
class ExternalCitizenProxyController extends Controller
{
    private const EXTERNAL_API_BASE = 'https://api.eservice.aiocp.org/api';

    /**
     * Proxy: Citizen by ID (2019 registry)
     * GET /api/external-proxy/citizen/by-id2019/{id}
     */
    public function byId2019(Request $request, string $id)
    {
        return $this->proxyGet("/Citizen/by-id2019/" . $id);
    }

    /**
     * Proxy: Citizen by name (2019 registry)
     * GET /api/external-proxy/citizen/by-name2019
     */
    public function byName2019(Request $request)
    {
        return $this->proxyGet("/Citizen/by-name2019", $request->query());
    }

    /**
     * Proxy: Citizen by ID (2023 registry)
     * GET /api/external-proxy/citizen/by-id/{id}
     */
    public function byId(Request $request, string $id)
    {
        return $this->proxyGet("/Citizen/by-id/" . $id);
    }

    /**
     * Proxy: Citizen by name (2023 registry)
     * GET /api/external-proxy/citizen/by-name
     */
    public function byName(Request $request)
    {
        return $this->proxyGet("/Citizen/by-name", $request->query());
    }

    private function proxyGet(string $path, array $query = []): \Illuminate\Http\JsonResponse|\Illuminate\Http\Response
    {
        $url = self::EXTERNAL_API_BASE . $path;
        
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'User-Agent' => 'CivilRegistry/1.0',
                ])
                ->get($url, $query);

            $status = $response->status();
            $body = $response->body();

            return response($body, $status)
                ->header('Content-Type', 'application/json');
        } catch (\Exception $e) {
            return response()->json([
                'Success' => false,
                'Message' => 'فشل الاتصال بالخادم الخارجي: ' . $e->getMessage(),
                'ErrorCode' => 500,
                'Data' => null,
            ], 500);
        }
    }
}
