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
        Schema::create('loyalty_members', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('restaurant_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedInteger('points')->default(0);
            $table->unsignedInteger('orders_count')->default(0);
            $table->string('tier')->default('bronze');
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'customer_id']);
            $table->index(['restaurant_id', 'points']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_members');
    }
};
