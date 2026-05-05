<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loyalty_rewards', function (Blueprint $table) {
            if (!Schema::hasColumn('loyalty_rewards', 'menu_item_id')) {
                $table->unsignedBigInteger('menu_item_id')->nullable()->after('status');
                $table->index('menu_item_id');
            }

            if (!Schema::hasColumn('loyalty_rewards', 'discount_percentage')) {
                $table->decimal('discount_percentage', 5, 2)->nullable()->after('menu_item_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('loyalty_rewards', function (Blueprint $table) {
            if (Schema::hasColumn('loyalty_rewards', 'discount_percentage')) {
                $table->dropColumn('discount_percentage');
            }

            if (Schema::hasColumn('loyalty_rewards', 'menu_item_id')) {
                $table->dropIndex(['menu_item_id']);
                $table->dropColumn('menu_item_id');
            }
        });
    }
};

