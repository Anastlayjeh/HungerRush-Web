<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use App\Models\Restaurant;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'restaurant_id' => ['nullable', 'exists:restaurants,id'],
            'order_id' => ['nullable', 'exists:orders,id'],
            'subject' => ['required', 'string', 'max:180'],
            'message' => ['required', 'string', 'max:4000'],
        ]);

        $report = Report::create([
            'reporter_user_id' => $request->user()?->id,
            'restaurant_id' => $validated['restaurant_id'] ?? null,
            'order_id' => $validated['order_id'] ?? null,
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'status' => 'open',
        ]);

        if ($request->user()) {
            UserNotification::create([
                'user_id' => $request->user()->id,
                'type' => 'report',
                'title' => 'Report submitted',
                'body' => 'Your report was submitted for review.',
                'data' => ['report_id' => $report->id],
            ]);
        }

        return $this->successResponse(new ReportResource($report), message: 'Report submitted.', status: 201);
    }
}
