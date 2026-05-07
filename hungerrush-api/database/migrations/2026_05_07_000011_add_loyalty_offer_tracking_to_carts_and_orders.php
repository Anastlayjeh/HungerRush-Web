<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('carts')) {
            Schema::table('carts', function (Blueprint $table) {
                if (!Schema::hasColumn('carts', 'loyalty_offer_id')) {
                    $table->unsignedBigInteger('loyalty_offer_id')->nullable()->after('restaurant_id');
                    $table->index('loyalty_offer_id');
                }
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'loyalty_offer_id')) {
                    $table->unsignedBigInteger('loyalty_offer_id')->nullable()->after('branch_id');
                    $table->index('loyalty_offer_id');
                }
                if (!Schema::hasColumn('orders', 'loyalty_points_used')) {
                    $table->unsignedInteger('loyalty_points_used')->default(0)->after('fees');
                }
                if (!Schema::hasColumn('orders', 'loyalty_discount')) {
                    $table->decimal('loyalty_discount', 10, 2)->default(0)->after('loyalty_points_used');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'loyalty_discount')) {
                    $table->dropColumn('loyalty_discount');
                }
                if (Schema::hasColumn('orders', 'loyalty_points_used')) {
                    $table->dropColumn('loyalty_points_used');
                }
                if (Schema::hasColumn('orders', 'loyalty_offer_id')) {
                    $table->dropIndex(['loyalty_offer_id']);
                    $table->dropColumn('loyalty_offer_id');
                }
            });
        }

        if (Schema::hasTable('carts')) {
            Schema::table('carts', function (Blueprint $table) {
                if (Schema::hasColumn('carts', 'loyalty_offer_id')) {
                    $table->dropIndex(['loyalty_offer_id']);
                    $table->dropColumn('loyalty_offer_id');
                }
            });
        }
    }
};
