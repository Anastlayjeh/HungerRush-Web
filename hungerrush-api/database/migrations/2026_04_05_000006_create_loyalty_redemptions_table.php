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
        Schema::create('loyalty_redemptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('restaurant_id');
            $table->unsignedBigInteger('loyalty_member_id');
            $table->unsignedBigInteger('loyalty_reward_id')->nullable();
            $table->unsignedInteger('points_spent')->default(0);
            $table->timestamps();

            $table->index(['restaurant_id', 'created_at']);
            $table->index('loyalty_member_id');
            $table->index('loyalty_reward_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_redemptions');
    }
};
