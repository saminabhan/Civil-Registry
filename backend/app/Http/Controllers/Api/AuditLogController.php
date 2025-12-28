<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index()
    {
        $logs = AuditLog::with('user:id,username,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'userId' => $log->user_id,
                    'username' => $log->user ? $log->user->username : null,
                    'action' => $log->action,
                    'details' => $log->details,
                    'createdAt' => $log->created_at,
                ];
            });

        return response()->json($logs);
    }
}

