<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyOffer;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class LoyaltyOfferController extends Controller
{
    public function index()
    {
        if (!$this->offersTableReady()) {
            return $this->successResponse([]);
        }

        $restaurant = $this->resolveRestaurant();
        $offers = LoyaltyOffer::query()
            ->where('restaurant_id', $restaurant->id)
            ->latest()
            ->get();

        return $this->successResponse($offers->map(fn (LoyaltyOffer $offer) => $this->transformOffer($offer))->values());
    }

    public function store(Request $request)
    {
        if (!$this->offersTableReady()) {
            return $this->errorResponse(
                'Loyalty offers are not available yet.',
                ['loyalty' => ['Loyalty offers storage is not configured.']],
                'loyalty_not_ready',
                503
            );
        }

        $restaurant = $this->resolveRestaurant();
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'required_points' => ['required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $offer = LoyaltyOffer::query()->create([
            'restaurant_id' => $restaurant->id,
            'title' => trim((string) $validated['title']),
            'description' => isset($validated['description']) ? trim((string) $validated['description']) : null,
            'required_points' => (int) $validated['required_points'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return $this->successResponse(
            $this->transformOffer($offer),
            message: 'Loyalty offer created successfully.',
            status: 201
        );
    }

    public function update(Request $request, string $loyaltyOffer)
    {
        if (!$this->offersTableReady()) {
            return $this->errorResponse(
                'Loyalty offers are not available yet.',
                ['loyalty' => ['Loyalty offers storage is not configured.']],
                'loyalty_not_ready',
                503
            );
        }

        $offerId = trim($loyaltyOffer);
        $offer = LoyaltyOffer::query()->find($offerId);
        abort_unless($offer !== null, 404);

        $restaurant = $this->resolveRestaurant();
        abort_unless($offer->restaurant_id === $restaurant->id, 404);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string'],
            'required_points' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $payload = [];
        if (array_key_exists('title', $validated)) {
            $payload['title'] = trim((string) $validated['title']);
        }
        if (array_key_exists('description', $validated)) {
            $payload['description'] = $validated['description'] !== null
                ? trim((string) $validated['description'])
                : null;
        }
        if (array_key_exists('required_points', $validated)) {
            $payload['required_points'] = (int) $validated['required_points'];
        }
        if (array_key_exists('is_active', $validated)) {
            $payload['is_active'] = (bool) $validated['is_active'];
        }

        if (!empty($payload)) {
            $offer->update($payload);
        }

        return $this->successResponse(
            $this->transformOffer($offer->refresh()),
            message: 'Loyalty offer updated successfully.'
        );
    }

    public function destroy(string $loyaltyOffer)
    {
        if (!$this->offersTableReady()) {
            return $this->errorResponse(
                'Loyalty offers are not available yet.',
                ['loyalty' => ['Loyalty offers storage is not configured.']],
                'loyalty_not_ready',
                503
            );
        }

        $restaurant = $this->resolveRestaurant();
        $offerId = trim($loyaltyOffer);
        $offer = LoyaltyOffer::query()->find($offerId);
        abort_unless($offer !== null && (int) $offer->restaurant_id === (int) $restaurant->id, 404);

        $offer->delete();

        return $this->successResponse(['deleted' => true], message: 'Loyalty offer deleted successfully.');
    }

    private function transformOffer(LoyaltyOffer $offer): array
    {
        return [
            'id' => $offer->id,
            'restaurant_id' => $offer->restaurant_id,
            'title' => $offer->title,
            'description' => $offer->description,
            'required_points' => (int) $offer->required_points,
            'is_active' => (bool) $offer->is_active,
            'created_at' => optional($offer->created_at)->toISOString(),
            'updated_at' => optional($offer->updated_at)->toISOString(),
        ];
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }

    private function offersTableReady(): bool
    {
        return Schema::hasTable('loyalty_offers');
    }
}
