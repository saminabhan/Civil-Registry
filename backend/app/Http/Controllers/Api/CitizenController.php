<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CitizenController extends Controller
{
    /**
     * Search for citizens
     * This endpoint is currently not used by the frontend
     * The frontend uses an external API directly
     */
    public function search(Request $request)
    {
        // This endpoint is a placeholder
        // The frontend actually uses the external API directly
        return response()->json([
            'message' => 'This endpoint is not currently used. The frontend uses an external API directly.',
            'citizens' => [],
            'count' => 0,
        ]);
    }
}

