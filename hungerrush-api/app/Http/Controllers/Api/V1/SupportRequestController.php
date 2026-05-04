<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SupportRequest;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class SupportRequestController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'channel' => ['nullable', 'string', 'max:40'],
            'subject' => ['required', 'string', 'max:180'],
            'message' => ['required', 'string', 'max:4000'],
        ]);

        $supportRequest = SupportRequest::create([
            'user_id' => $request->user()?->id,
            'channel' => $validated['channel'] ?? 'app',
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'status' => 'open',
        ]);

        if ($request->user()) {
            UserNotification::create([
                'user_id' => $request->user()->id,
                'type' => 'support_request',
                'title' => 'Support request received',
                'body' => 'We received your support request and will review it soon.',
                'data' => ['support_request_id' => $supportRequest->id],
            ]);
        }

        return $this->successResponse([
            'id' => $supportRequest->id,
            'status' => $supportRequest->status,
        ], message: 'Support request submitted.', status: 201);
    }
}
