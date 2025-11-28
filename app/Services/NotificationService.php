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
     * This is the main entry point for all ticket notifications
     */
    public function notifyTicketAction($ticket, string $action, array $actor)
    {
        Log::info("=== NOTIFYING TICKET ACTION: {$ticket->TICKET_ID}, ACTION: {$action} ===");

        try {
            // Check if this is a Support Service type request with status 1-3
            if ($this->shouldSkipNotification($ticket, $action)) {
                Log::info("Skipping notification for Support Service ticket {$ticket->TICKET_ID}, status: {$ticket->status}");
                return ['success' => 0, 'failed' => 0, 'total' => 0, 'skipped' => true];
            }

            // Determine recipients based on action type
            $recipients = $this->getRecipients($ticket, $actor, $action);

            if (empty($recipients)) {
                Log::info("No recipients for ticket {$ticket->TICKET_ID}, action {$action}");
                return ['success' => 0, 'failed' => 0, 'total' => 0];
            }

            // Get action required for this action type
            $actionRequired = $this->getActionRequired($action);

            // Create the notification prototype
            $notificationPrototype = new TicketNotification(
                $ticket->TICKET_ID,
                $ticket->request_type ?? '',
                $actor['name'] ?? '',
                $ticket->details ?? '',
                ucwords($action)
            );

            // Send notifications to all recipients
            return $this->sendNotifications(
                $recipients,
                $notificationPrototype,
                $actionRequired,
                strtoupper($action)
            );
        } catch (\Exception $e) {
            Log::error("Failed to notify ticket action {$ticket->TICKET_ID}: " . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return ['success' => 0, 'failed' => 0, 'total' => 0, 'error' => $e->getMessage()];
        }
    }

    /**
     * Check if notification should be skipped for Support Service requests
     */
    private function shouldSkipNotification($ticket, string $action): bool
    {
        // Check if this is a Support Service type request
        $requestType = strtolower($ticket->request_type ?? '');
        $isSupportService = str_contains($requestType, 'support service');

        if (!$isSupportService) {
            return false;
        }

        // For Support Service, skip notifications for status 1-3
        $status = $ticket->status ?? 0;
        $action = strtoupper($action);

        // Skip if status is 1, 2, or 3 (and not RESOLVE, CLOSE, or RETURN actions)
        if (in_array($status, [1, 2, 3]) && !in_array($action, ['RESOLVE', 'CLOSE', 'RETURN'])) {
            return true;
        }

        return false;
    }

    /**
     * Core method to send notifications to multiple recipients
     * This is reusable for any notification type
     */
    private function sendNotifications($recipients, $notificationPrototype, $actionRequired, $notificationType)
    {
        // Ensure recipients is an array of unique values
        $recipients = array_values(array_unique(array_map(function ($recipient) {
            // Handle both object and string recipients
            return is_object($recipient) ? $recipient->emp_id : $recipient;
        }, $recipients)));

        $success = 0;
        $failed = 0;

        Log::info("=== STARTING NOTIFICATIONS ===", [
            'type' => $notificationType,
            'recipients' => $recipients,
            'total_recipients' => count($recipients),
            'action_required' => $actionRequired
        ]);

        foreach ($recipients as $recipientId) {
            try {
                Log::info("🔔 Processing recipient", [
                    'recipient_id' => $recipientId,
                    'notification_type' => $notificationType
                ]);

                // Get or create notification user
                $user = NotificationUser::firstOrCreate(
                    ['emp_id' => $recipientId],
                    [
                        'emp_name' => $this->getEmployeeName($recipientId),
                        'emp_dept' => $this->getEmployeeDept($recipientId)
                    ]
                );

                // 🔥 CRITICAL: CREATE NEW NOTIFICATION INSTANCE PER RECIPIENT
                // This ensures each recipient gets their own notification with correct recipient_id
                $notification = clone $notificationPrototype;

                // Set recipient-specific data
                $notification->setActionRequired($actionRequired, $recipientId);

                Log::info("🚀 About to send notification", [
                    'recipient_id' => $recipientId,
                    'notification_recipient_id' => $notification->recipientId,
                    'action_required' => $actionRequired,
                    'channel' => 'users.' . $recipientId
                ]);

                // CRITICAL FIX: Use notifyNow() to send immediately without queuing
                $user->notifyNow($notification);

                Log::info("✅ Notification sent successfully", [
                    'user_emp_id' => $recipientId,
                    'channel' => 'users.' . $recipientId
                ]);

                $success++;
            } catch (\Exception $e) {
                Log::error("❌ Failed to notify {$recipientId}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $failed++;
            }
        }

        Log::info("=== NOTIFICATION BATCH COMPLETE ===", [
            'type' => $notificationType,
            'success' => $success,
            'failed' => $failed,
            'total' => count($recipients)
        ]);

        return ['success' => $success, 'failed' => $failed, 'total' => count($recipients)];
    }

    /**
     * Get recipients based on action type
     * This is where the business logic for recipient selection lives
     */
    private function getRecipients($ticket, array $actor, string $action): array
    {
        $action = strtoupper($action);

        // Check if this is a Support Service type request
        $isSupportService = isset($ticket->type_of_request) &&
            str_contains(strtolower(trim($ticket->type_of_request)), 'support service');


        // Special handling for Support Service requests
        if ($isSupportService) {
            switch ($action) {
                case 'RESOLVE':
                    // Notify senior approvers
                    $seniorApproverIds = $this->userRepo->getSeniorApproverIds();
                    $seniorApprovers = [];
                    foreach ($seniorApproverIds as $approverId) {
                        $user = $this->userRepo->findUserById($approverId);
                        if ($user) {
                            $seniorApprovers[] = $user;
                        }
                    }
                    Log::info("Support Service RESOLVE - Notifying senior approvers", [
                        'ticket_id' => $ticket->TICKET_ID,
                        'senior_approver_count' => count($seniorApprovers)
                    ]);
                    return $seniorApprovers;

                case 'CLOSE':
                case 'RETURN':
                    // Notify requestor only
                    $requestor = $this->userRepo->findUserById($ticket->employid);
                    Log::info("Support Service {$action} - Notifying requestor", [
                        'ticket_id' => $ticket->TICKET_ID,
                        'requestor_id' => $ticket->employid
                    ]);
                    return $requestor ? [$requestor] : [];

                default:
                    // For other actions in Support Service, no notifications
                    Log::info("Support Service {$action} - No notifications", [
                        'ticket_id' => $ticket->TICKET_ID
                    ]);
                    return [];
            }
        }

        // Default notification logic for non-Support Service requests
        switch ($action) {
            case 'CREATED':
                // New ticket - notify all MIS support except the creator
                $supports = $this->userRepo->getMISSupportUsers();
                return array_filter($supports, fn($u) => $u->emp_id !== $actor['emp_id']);

            case 'ONGOING':
                // Ticket is being worked on - notify all MIS support except the actor
                $supports = $this->userRepo->getMISSupportUsers();
                return array_filter($supports, fn($u) => $u->emp_id !== $actor['emp_id']);

            case 'ONPROCESS':
                // Ticket is in progress - notify the requestor
                $requestor = $this->userRepo->findUserById($ticket->employid);
                return $requestor ? [$requestor] : [];

            case 'RESOLVE':
                // Ticket resolved - notify the requestor
                $requestor = $this->userRepo->findUserById($ticket->employid);
                return $requestor ? [$requestor] : [];

            case 'RETURN':
                // Ticket returned - notify all MIS support except the actor
                $supports = $this->userRepo->getMISSupportUsers();
                return array_filter($supports, fn($u) => $u->emp_id !== $actor['emp_id']);

            case 'CLOSE':
                // Ticket closed - notify all MIS support except the actor
                $supports = $this->userRepo->getMISSupportUsers();
                return array_filter($supports, fn($u) => $u->emp_id !== $actor['emp_id']);

            case 'CANCEL':
                // Ticket cancelled - logic depends on who cancelled
                if ($ticket->employid === $actor['emp_id']) {
                    // Requestor cancelled - notify MIS support
                    return $this->userRepo->getMISSupportUsers();
                } else {
                    // MIS cancelled - notify requestor
                    $requestor = $this->userRepo->findUserById($ticket->employid);
                    return $requestor ? [$requestor] : [];
                }

            default:
                Log::warning("Unknown action type: {$action}");
                return [];
        }
    }

    /**
     * Map action type to action required text
     * This determines what action the recipient should take
     */
    private function getActionRequired(string $action): ?string
    {
        return match (strtoupper($action)) {
            'CREATED' => 'REVIEW',
            'ONGOING' => 'ASSESS',
            'ONPROCESS' => 'WAIT',
            'RESOLVE' => 'CLOSE',
            'RETURN' => 'REASSESS',
            'CANCEL' => 'INFO',
            'CLOSE' => 'CLOSED',
            default => null,
        };
    }

    /**
     * Helper method to get employee name from masterlist
     */
    private function getEmployeeName($empId)
    {
        try {
            $user = $this->userRepo->findUserById($empId);
            return $user ? $user->empname : 'User ' . $empId;
        } catch (\Exception $e) {
            Log::warning("Could not fetch employee name for {$empId}");
            return 'User ' . $empId;
        }
    }

    /**
     * Helper method to get employee department from masterlist
     */
    private function getEmployeeDept($empId)
    {
        try {
            $user = $this->userRepo->findUserById($empId);
            return $user ? ($user->emp_dept ?? 'Unknown') : 'Unknown';
        } catch (\Exception $e) {
            Log::warning("Could not fetch employee department for {$empId}");
            return 'Unknown';
        }
    }
}
