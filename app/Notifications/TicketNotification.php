<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Support\Facades\Log;

class TicketNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public $ticketId;
    public $requestType;
    public $actorName;
    public $details;
    public $requestTypeLabel;
    public $actionRequired;

    public function __construct($ticketId, $requestType, $actorName, $details, $requestTypeLabel = '')
    {
        $this->ticketId = $ticketId;
        $this->requestType = $requestType;
        $this->actorName = $actorName;
        $this->details = $details;
        $this->requestTypeLabel = $requestTypeLabel;
        $this->actionRequired = null;
    }

    public function setActionRequired($action)
    {
        $this->actionRequired = $action;
        return $this;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    private function getMessageAndType()
    {
        $action = $this->actionRequired;

        $message = match ($action) {
            'REVIEW' => "New ticket {$this->ticketId} created by {$this->actorName}",
            'ASSESS' => "Ticket {$this->ticketId} is ongoing. Please assess.",
            'CLOSE' => "Ticket {$this->ticketId} resolved by {$this->actorName}. Please close it.",
            'INFO' => "Ticket {$this->ticketId} cancelled by {$this->actorName}.",
            'REASSESS' => "Ticket {$this->ticketId} returned by {$this->actorName}. Please reassess.",
            'CLOSED' => "Ticket {$this->ticketId} closed by {$this->actorName}.",
            default => "Ticket {$this->ticketId} updated."
        };

        $type = match ($action) {
            'REVIEW' => 'TICKET_CREATED',
            'ASSESS' => 'TICKET_ONGOING',
            'CLOSE' => 'TICKET_RESOLVED',
            'INFO' => 'TICKET_CANCELLED',
            'REASSESS' => 'TICKET_RETURNED',
            'CLOSED' => 'TICKET_CLOSED',
            default => 'TICKET_UPDATED'
        };

        return [$message, $type];
    }

    public function toBroadcast($notifiable)
    {
        [$message, $type] = $this->getMessageAndType();

        return new BroadcastMessage([
            'id' => uniqid('notif_', true),
            'ticket_id' => $this->ticketId,
            'message' => $message,
            'request_type' => $this->requestTypeLabel,
            'details' => substr($this->details, 0, 100),
            'type' => $type,
            'action_required' => $this->actionRequired,
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    public function broadcastOn($notifiable = null)
    {
        if (!$notifiable) return [];

        Log::info('Broadcasting to channel:', [
            'channel' => 'users.' . $notifiable->emp_id,
            'ticket_id' => $this->ticketId
        ]);

        return new PrivateChannel('users.' . $notifiable->emp_id);
    }

    public function broadcastAs()
    {
        return 'notification.created';
    }

    public function toDatabase($notifiable)
    {
        [$message, $type] = $this->getMessageAndType();

        return [
            'ticket_id' => $this->ticketId,
            'message' => $message,
            'request_type' => $this->requestTypeLabel,
            'details' => $this->details,
            'type' => $type,
            'action_required' => $this->actionRequired,
            'created_at' => now()->toDateTimeString(),
        ];
    }
}
