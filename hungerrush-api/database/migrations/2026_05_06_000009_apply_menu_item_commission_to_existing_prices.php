<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('menu_items')->update([
            'price' => DB::raw('ROUND(price * 1.10, 2)'),
        ]);
    }

    public function down(): void
    {
        DB::table('menu_items')->update([
            'price' => DB::raw('ROUND(price / 1.10, 2)'),
        ]);
    }
};

