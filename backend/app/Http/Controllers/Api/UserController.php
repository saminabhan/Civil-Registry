<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = 15;
        $page = $request->get('page', 1);
        
        $paginated = User::orderBy('id', 'desc')->paginate($perPage, ['*'], 'page', $page);
        
        $data = $paginated->map(function ($user) {
            return [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'isAdmin' => (bool) $user->is_admin,
                'isActive' => (bool) $user->is_active,
                'createdAt' => $user->created_at,
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

    public function show($id)
    {
        $user = User::findOrFail($id);
        
        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'isAdmin' => (bool) $user->is_admin,
            'isActive' => (bool) $user->is_active,
            'createdAt' => $user->created_at,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|string|max:255|unique:users,username',
            'name' => 'nullable|string|max:255',
            'password' => 'required|string|min:6',
            'is_admin' => 'boolean',
            'is_active' => 'boolean',
            'isAdmin' => 'boolean',
            'isActive' => 'boolean',
        ]);

        $data['password'] = Hash::make($data['password']);


        $isAdmin = $data['is_admin'] ?? $data['isAdmin'] ?? false;
        $isActive = $data['is_active'] ?? $data['isActive'] ?? true;
        

        $name = $data['name'] ?? $data['username'];

        $user = User::create([
            'username' => $data['username'],
            'name' => $name,
            'password' => $data['password'],
            'is_admin' => $isAdmin,
            'is_active' => $isActive,
        ]);


        $currentUser = $request->user();
        if ($currentUser) {
            AuditLog::create([
                'user_id' => $currentUser->id,
                'action' => 'CREATE_USER',
                'details' => "Created user {$user->username} (ID: {$user->id})",
            ]);
        }

        $userData = [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'isAdmin' => (bool) $user->is_admin,
            'isActive' => (bool) $user->is_active,
            'createdAt' => $user->created_at,
        ];

        return response()->json($userData, 201);
    }

    public function toggleStatus(Request $request, $id)
    {
        $request->validate([
            'isActive' => 'required|boolean',
        ]);

        $user = User::findOrFail($id);
        
        if ($user->id === 1) {
            return response()->json([
                'message' => 'لا يمكن تعديل حساب System Admin'
            ], 403);
        }
        
        $oldStatus = $user->is_active;
        $user->is_active = $request->isActive;
        $user->save();

        $currentUser = $request->user();
        if ($currentUser) {
            $statusText = $request->isActive ? 'active' : 'inactive';
            AuditLog::create([
                'user_id' => $currentUser->id,
                'action' => 'UPDATE_USER_STATUS',
                'details' => "Changed user {$user->username} (ID: {$user->id}) status to {$statusText}",
            ]);
        }

        $userData = [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'isAdmin' => (bool) $user->is_admin,
            'isActive' => (bool) $user->is_active,
            'createdAt' => $user->created_at,
        ];

        return response()->json($userData);
    }
}

