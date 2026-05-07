<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('loyalty_offers')) {
            return;
        }

        Schema::table('loyalty_offers', function (Blueprint $table) {
            if (!Schema::hasColumn('loyalty_offers', 'reward_type')) {
                $table->string('reward_type', 32)->default('custom')->after('required_points');
            }
            if (!Schema::hasColumn('loyalty_offers', 'menu_item_id')) {
                $table->unsignedBigInteger('menu_item_id')->nullable()->after('reward_type');
                $table->index('menu_item_id');
            }
            if (!Schema::hasColumn('loyalty_offers', 'discount_percentage')) {
                $table->decimal('discount_percentage', 5, 2)->nullable()->after('menu_item_id');
            }
            if (!Schema::hasColumn('loyalty_offers', 'discount_amount')) {
                $table->decimal('discount_amount', 10, 2)->nullable()->after('discount_percentage');
            }
            if (!Schema::hasColumn('loyalty_offers', 'free_item_quantity')) {
                $table->unsignedInteger('free_item_quantity')->default(1)->after('discount_amount');
            }
            if (!Schema::hasColumn('loyalty_offers', 'conditions')) {
                $table->text('conditions')->nullable()->after('description');
            }
            if (!Schema::hasColumn('loyalty_offers', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('conditions');
                $table->index('expires_at');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('loyalty_offers')) {
            return;
        }

        Schema::table('loyalty_offers', function (Blueprint $table) {
            if (Schema::hasColumn('loyalty_offers', 'expires_at')) {
                $table->dropIndex(['expires_at']);
                $table->dropColumn('expires_at');
            }
            if (Schema::hasColumn('loyalty_offers', 'conditions')) {
                $table->dropColumn('conditions');
            }
            if (Schema::hasColumn('loyalty_offers', 'free_item_quantity')) {
                $table->dropColumn('free_item_quantity');
            }
            if (Schema::hasColumn('loyalty_offers', 'discount_amount')) {
                $table->dropColumn('discount_amount');
            }
            if (Schema::hasColumn('loyalty_offers', 'discount_percentage')) {
                $table->dropColumn('discount_percentage');
            }
            if (Schema::hasColumn('loyalty_offers', 'menu_item_id')) {
                $table->dropIndex(['menu_item_id']);
                $table->dropColumn('menu_item_id');
            }
            if (Schema::hasColumn('loyalty_offers', 'reward_type')) {
                $table->dropColumn('reward_type');
            }
        });
    }
};
