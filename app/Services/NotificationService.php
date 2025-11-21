<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use App\Notifications\TicketNotification;
use App\Models\NotificationUser;
use App\Repositories\UserRepository;

class NotificationService
{
    protected UserRoleService $userRoleService;
    protected UserRepository $userRepo;

    public function __construct(UserRoleService $userRoleService, UserRepository $userRepo)
    {
        $this->userRoleService = $userRoleService;
        $this->userRepo = $userRepo;
    }

    /**
     * Notify ticket action dynamically
     */
    public function notifyTicketAction($ticket, string $action, array $actor)
    {
        Log::info("=== NOTIFYING TICKET ACTION: {$ticket->TICKET_ID}, ACTION: {$action} ===");

        try {
            // Determine recipients based on action type
            $recipients = $this->getRecipients($ticket, $actor, $action);

            if (empty($recipients)) {
                Log::info("No recipients for ticket {$ticket->TICKET_ID}, action {$action}");
                return ['success' => 0, 'failed' => 0, 'total' => 0];
            }

            // Create notification
            $notification = new TicketNotification(
                $ticket->TICKET_ID,
                $ticket->request_type ?? '',
                $actor['name'] ?? '',
                $ticket->details ?? '',
                ucwords($action)
            );

            $notification->setActionRequired($this->getActionRequired($action));

            // Send notifications
            $success = 0;
            $failed = 0;
            foreach ($recipients as $recipient) {
                $user = NotificationUser::where('emp_id', $recipient->emp_id)->first();
                if (!$user) {
                    Log::warning("User not found in notification_users: {$recipient->emp_id}");
                    $failed++;
                    continue;
                }
                $user->notify($notification);
                $success++;
            }

            Log::info("Notification summary for ticket {$ticket->TICKET_ID}: success={$success}, failed={$failed}");

            return ['success' => $success, 'failed' => $failed, 'total' => count($recipients)];
        } catch (\Exception $e) {
            Log::error("Failed to notify ticket action {$ticket->TICKET_ID}: " . $e->getMessage());
            return ['success' => 0, 'failed' => 0, 'total' => 0, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get recipients based on action
     */
    private function getRecipients($ticket, array $actor, string $action): array
    {
        switch (strtoupper($action)) {
            case 'CREATED':
            case 'ONGOING':
            case 'RETURN':
            case 'CLOSE':
                // MIS support except actor
                $supports = $this->userRepo->getMISSupportUsers();
                return array_filter($supports, fn($u) => $u->emp_id !== $actor['emp_id']);
            case 'RESOLVE':
                // Notify requestor
                $requestor = $this->userRepo->findUserById($ticket->employid);
                return $requestor ? [$requestor] : [];
            case 'CANCEL':
                if ($ticket->employid === $actor['emp_id']) {
                    return $this->userRepo->getMISSupportUsers();
                } else {
                    $requestor = $this->userRepo->findUserById($ticket->employid);
                    return $requestor ? [$requestor] : [];
                }
            default:
                return [];
        }
    }

    /**
     * Map action type to action required text
     */
    private function getActionRequired(string $action): ?string
    {
        return match (strtoupper($action)) {
            'CREATED' => 'REVIEW',
            'ONGOING' => 'ASSESS',
            'RESOLVE' => 'CLOSE',
            'RETURN' => 'REASSESS',
            'CANCEL' => 'INFO',
            'CLOSE' => 'CLOSED',
            default => null,
        };
    }
}
