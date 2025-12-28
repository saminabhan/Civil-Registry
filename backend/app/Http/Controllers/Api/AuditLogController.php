<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = 20;
        $page = $request->get('page', 1);
        
        $paginated = AuditLog::with('user:id,username,name')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
        
        $data = $paginated->map(function ($log) {
            return [
                'id' => $log->id,
                'userId' => $log->user_id,
                'username' => $log->user ? $log->user->username : null,
                'action' => $log->action,
                'details' => $log->details,
                'createdAt' => $log->created_at,
            ];
        });
        
        return response()->json([
            'data' => $data,
            'currentPage' => $paginated->currentPage(),
            'lastPage' => $paginated->lastPage(),
            'perPage' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function getUserLogs(Request $request, $userId)
    {
        $perPage = 20;
        $page = $request->get('page', 1);
        
        $paginated = AuditLog::where('user_id', $userId)
            ->with('user:id,username,name')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
        
        $data = $paginated->map(function ($log) {
            return [
                'id' => $log->id,
                'userId' => $log->user_id,
                'username' => $log->user ? $log->user->username : null,
                'action' => $log->action,
                'details' => $log->details,
                'createdAt' => $log->created_at,
            ];
        });
        
        return response()->json([
            'data' => $data,
            'currentPage' => $paginated->currentPage(),
            'lastPage' => $paginated->lastPage(),
            'perPage' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function getUserRecentSearches(Request $request, $userId)
    {
        $logs = AuditLog::where('user_id', $userId)
            ->where('action', 'SEARCH')
            ->with('user:id,username,name')
            ->orderBy('created_at', 'desc')
            ->limit(10)
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

    public function getUsersWithLogCounts()
    {
        $users = User::withCount('auditLogs')
            ->orderBy('audit_logs_count', 'desc')
            ->orderBy('username', 'asc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'isAdmin' => (bool) $user->is_admin,
                    'isActive' => (bool) $user->is_active,
                    'logsCount' => (int) $user->audit_logs_count,
                    'createdAt' => $user->created_at,
                ];
            });

        return response()->json($users);
    }

    public function getRecentSearches()
    {
        $logs = AuditLog::where('action', 'SEARCH')
            ->with('user:id,username,name')
            ->orderBy('created_at', 'desc')
            ->limit(10)
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

