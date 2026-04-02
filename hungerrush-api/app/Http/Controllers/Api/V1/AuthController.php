<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

Class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = User::create($request->validated());
        $token = $user->createToken($request->input('device_name', 'default-device'))->plainTextToken;

        return $this->successResponse([
            'user' => $user,
            'token' => $token,
        ], message: 'Registration successful.', status: 201);
    }

    public function login(LoginRequest $request)
    {
        $validated = $request->validated();
        $query = User::query();

        if (!empty($validated['email'])) {
            $query->where('email', $validated['email']);
        } else {
            $query->where('phone', $validated['phone'] ?? '');
        }

        /** @var User|null $user */
        $user = $query->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return $this->errorResponse('Invalid credentials.', code: 'invalid_credentials', status: 401);
        }

        if ($user->status !== 'active') {
            return $this->errorResponse('Account is suspended.', code: 'account_suspended', status: 403);
        }

        if (!empty($validated['role']) && $user->role?->value !== $validated['role']) {
            return $this->errorResponse('Role mismatch.', code: 'role_mismatch', status: 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $token = $user->createToken($validated['device_name'] ?? 'default-device')->plainTextToken;

        return $this->successResponse([
            'user' => $user,
            'token' => $token,
        ], message: 'Login successful.');
    }

    public function me(Request $request)
    {
        return $this->successResponse($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->successResponse(['logged_out' => true], message: 'Logout successful.');
    }

    public function forgotPassword(Request $request)
    {
        return $this->successResponse(['queued' => true], message: 'Password reset flow placeholder.');
    }

    public function resetPassword(Request $request)
    {
        return $this->successResponse(['reset' => true], message: 'Password reset endpoint placeholder.');
    }
}
