# HungerRush API Next Phases

## Completed foundation in this sprint
- Laravel API project bootstrap with Sanctum and versioned `v1` routes.
- Unified API success/error envelope and JSON exception rendering.
- Core domain migrations/models/enums for users, restaurants, menus, orders, drivers, and videos.
- Auth endpoints (`register`, `login`, `logout`, `me`) and restaurant operations APIs for profile/menu/orders.
- Feature tests for auth lifecycle and restaurant order status transitions.

## Phase 2 - Customer ordering APIs
- `GET /api/v1/restaurants`
- `GET /api/v1/restaurants/{id}`
- `GET /api/v1/restaurants/{id}/menu`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/{id}`
- `DELETE /api/v1/cart/items/{id}`
- `POST /api/v1/orders`
- `GET /api/v1/orders/{id}`
- `GET /api/v1/orders/history`

## Phase 3 - Driver APIs
- `PATCH /api/v1/driver/availability`
- `GET /api/v1/driver/tasks/current`
- `GET /api/v1/driver/tasks/available`
- `POST /api/v1/driver/tasks/{id}/accept`
- `POST /api/v1/driver/tasks/{id}/reject`
- `PATCH /api/v1/driver/tasks/{id}/status`
- `POST /api/v1/driver/location`

## Phase 4 - Video feed APIs
- `GET /api/v1/videos/feed`
- `GET /api/v1/videos/{id}`
- `POST /api/v1/videos/{id}/engagement`
- `POST /api/v1/restaurant/videos`
- `PATCH /api/v1/restaurant/videos/{id}`

## Production hardening checklist
- Add Redis cache/queue in non-local environments.
- Add rate limits for auth, engagement, and write-heavy endpoints.
- Add payment integration with webhook handling and idempotency keys.
- Add push notification flows for customer, restaurant, and driver updates.
- Add OpenAPI docs and CI pipeline gates (`pint`, `phpstan`/`larastan`, `test`).
