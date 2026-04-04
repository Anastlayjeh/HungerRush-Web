<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('loyalty_rewards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('restaurant_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('points_required')->default(0);
            $table->enum('reward_type', ['discount', 'free_item', 'free_delivery', 'cashback', 'custom'])->default('custom');
            $table->enum('status', ['active', 'draft', 'archived'])->default('draft');
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamps();

            $table->index(['restaurant_id', 'status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_rewards');
    }
};
