<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users') || !Schema::hasTable('restaurants')) {
            return;
        }

        DB::table('users')
            ->whereIn('id', function ($query) {
                $query->select('owner_user_id')->from('restaurants');
            })
            ->where('role', '!=', UserRole::RestaurantOwner->value)
            ->update([
                'role' => UserRole::RestaurantOwner->value,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Irreversible data correction.
    }
};
