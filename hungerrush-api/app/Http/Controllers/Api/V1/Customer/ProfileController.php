<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return $this->successResponse($this->transformUser($request->user()));
    }

    public function update(Request $request)
    {
        $user = $request->user();

        if ($request->has('email') && is_string($request->input('email'))) {
            $request->merge([
                'email' => strtolower(trim((string) $request->input('email'))),
            ]);
        }

        if ($request->has('phone') && is_string($request->input('phone'))) {
            $request->merge([
                'phone' => trim((string) $request->input('phone')),
            ]);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
        ]);

        $user->update($validated);

        return $this->successResponse($this->transformUser($user->refresh()), message: 'Profile updated successfully.');
    }

    private function transformUser($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role?->value ?? $user->role,
            'status' => $user->status,
            'avatar_url' => $user->avatar ?? null,
            'created_at' => optional($user->created_at)->toISOString(),
            'updated_at' => optional($user->updated_at)->toISOString(),
        ];
    }
}
