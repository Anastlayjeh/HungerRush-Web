<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('carts')) {
            return;
        }

        try {
            Schema::table('carts', function (Blueprint $table) {
                $table->dropUnique('carts_customer_id_unique');
            });
        } catch (\Throwable) {
            // Index can already be absent on some environments.
        }

        try {
            Schema::table('carts', function (Blueprint $table) {
                $table->unique(['customer_id', 'restaurant_id'], 'carts_customer_restaurant_unique');
            });
        } catch (\Throwable) {
            // Composite index can already exist.
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('carts')) {
            return;
        }

        try {
            Schema::table('carts', function (Blueprint $table) {
                $table->dropUnique('carts_customer_restaurant_unique');
            });
        } catch (\Throwable) {
            // Index can already be absent on some environments.
        }

        try {
            Schema::table('carts', function (Blueprint $table) {
                $table->unique(['customer_id'], 'carts_customer_id_unique');
            });
        } catch (\Throwable) {
            // Single-customer index can already exist.
        }
    }
};
