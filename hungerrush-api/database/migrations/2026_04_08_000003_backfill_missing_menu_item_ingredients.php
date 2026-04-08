<?php

use App\Support\MenuItemIngredients;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('menu_items')
            ->select('id', 'name', 'ingredients')
            ->orderBy('id')
            ->get()
            ->each(function (object $item): void {
                $ingredients = is_string($item->ingredients) ? trim($item->ingredients) : '';
                if ($ingredients !== '') {
                    return;
                }

                DB::table('menu_items')
                    ->where('id', $item->id)
                    ->update([
                        'ingredients' => MenuItemIngredients::suggest((string) $item->name),
                    ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Irreversible data backfill.
    }
};
