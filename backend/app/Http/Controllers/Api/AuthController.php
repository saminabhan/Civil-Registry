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
        try {
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

            if (! $user->is_active) {
                return response()->json([
                    'message' => 'الحساب معطل. يرجى الاتصال بالمسؤول لتفعيل الحساب.'
                ], 403);
            }

            $token = $user->createToken('api-token')->plainTextToken;

            try {
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'LOGIN',
                    'details' => "User {$user->username} logged in",
                ]);
            } catch (\Exception $e) {
                // Log error but don't fail login
                \Log::warning('Failed to create audit log: ' . $e->getMessage());
            }

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
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'البيانات المدخلة غير صحيحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة لاحقاً.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        
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

    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'غير مصرح'
                ], 401);
            }

            $request->validate([
                'name' => 'nullable|string|max:255',
                'username' => [
                    'nullable',
                    'string',
                    'max:255',
                    \Illuminate\Validation\Rule::unique('users', 'username')->ignore($user->id)
                ],
            ]);

            $oldUsername = $user->username;
            $oldName = $user->name;

            if ($request->has('name') && $request->name !== null) {
                $user->name = $request->name;
            }

            if ($request->has('username') && $request->username !== null) {
                $user->username = $request->username;
            }

            $user->save();

            try {
                $changes = [];
                if ($oldName !== $user->name) {
                    $changes[] = "name: {$oldName} -> {$user->name}";
                }
                if ($oldUsername !== $user->username) {
                    $changes[] = "username: {$oldUsername} -> {$user->username}";
                }
                
                if (!empty($changes)) {
                    AuditLog::create([
                        'user_id' => $user->id,
                        'action' => 'UPDATE_PROFILE',
                        'details' => "User updated profile: " . implode(', ', $changes),
                    ]);
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to create audit log: ' . $e->getMessage());
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
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'البيانات المدخلة غير صحيحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Update profile error: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'حدث خطأ أثناء تحديث البيانات. يرجى المحاولة لاحقاً.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function updatePassword(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'غير مصرح'
                ], 401);
            }

            $request->validate([
                'currentPassword' => 'required|string',
                'newPassword' => 'required|string|min:6',
            ]);

            if (!Hash::check($request->currentPassword, $user->password)) {
                return response()->json([
                    'message' => 'كلمة المرور الحالية غير صحيحة'
                ], 400);
            }

            $user->password = Hash::make($request->newPassword);
            $user->save();

            try {
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'UPDATE_PASSWORD',
                    'details' => "User {$user->username} changed password",
                ]);
            } catch (\Exception $e) {
                \Log::warning('Failed to create audit log: ' . $e->getMessage());
            }

            return response()->json(['message' => 'تم تغيير كلمة المرور بنجاح']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'البيانات المدخلة غير صحيحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Update password error: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'حدث خطأ أثناء تغيير كلمة المرور. يرجى المحاولة لاحقاً.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
