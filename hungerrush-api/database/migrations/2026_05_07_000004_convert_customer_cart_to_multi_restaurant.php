<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('carts')) {
            return;
        }

        try {
            DB::statement('ALTER TABLE carts DROP INDEX carts_customer_id_unique');
        } catch (\Throwable) {
            // Index can already be absent on some environments.
        }

        Schema::table('carts', function (Blueprint $table) {
            $table->unique(['customer_id', 'restaurant_id'], 'carts_customer_restaurant_unique');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('carts')) {
            return;
        }

        try {
            DB::statement('ALTER TABLE carts DROP INDEX carts_customer_restaurant_unique');
        } catch (\Throwable) {
            // Index can already be absent on some environments.
        }

        Schema::table('carts', function (Blueprint $table) {
            $table->unique(['customer_id'], 'carts_customer_id_unique');
        });
    }
};
