<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SampleUsersSeeder::class,
            SampleRestaurantCatalogSeeder::class,
            SampleRestaurantRegistrationsSeeder::class,
            SampleOperationalDataSeeder::class,
            SampleReportsSeeder::class,
        ]);
    }
}
