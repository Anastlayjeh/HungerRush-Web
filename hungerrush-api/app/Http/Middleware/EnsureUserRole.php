<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    /**
     * @param  array<int, string>  $roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        abort_unless($user !== null, 401, 'Unauthenticated.');

        $allowedRoles = collect($roles)
            ->flatMap(fn (string $role) => preg_split('/\s*,\s*/', $role) ?: [])
            ->map(fn (string $role) => strtolower(trim($role)))
            ->filter()
            ->values();

        if ($allowedRoles->isEmpty()) {
            return $next($request);
        }

        $currentRole = strtolower((string) ($user->role?->value ?? $user->role));
        abort_unless(
            $allowedRoles->contains($currentRole),
            403,
            'You do not have permission to access this resource.'
        );

        return $next($request);
    }
}
