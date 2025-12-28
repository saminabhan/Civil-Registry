<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->username)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'اسم المستخدم أو كلمة المرور غير صحيحة'
            ], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        // Log login action
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'LOGIN',
            'details' => "User {$user->username} logged in",
        ]);

        // Transform user to camelCase for frontend compatibility
        $userData = [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'isAdmin' => (bool) $user->is_admin,
            'isActive' => (bool) $user->is_active,
            'createdAt' => $user->created_at,
        ];

        return response()->json([
            'token' => $token,
            'user' => $userData,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Log logout action before deleting token
        if ($user) {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'LOGOUT',
                'details' => "User {$user->username} logged out",
            ]);
        }

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }
}
