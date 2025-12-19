import { useEffect } from "react";
import { message } from "antd";
import { router } from "@inertiajs/react";

/**
 * Hook to handle real-time ticket updates
 */
export const useRealtimeTicketUpdates = ({
    ticketUpdates,
    clearTicketUpdates,
}) => {
    useEffect(() => {
        if (ticketUpdates.length === 0) return;

        console.log("🔄 Processing ticket updates:", ticketUpdates);

        // Show toast notification for updates
        ticketUpdates.forEach((update) => {
            message.info(`Ticket ${update.ticketId} has been updated`, 2);
        });

        // Clear processed updates
        clearTicketUpdates();

        // Refetch the table with current filters
        router.reload({
            only: ["tickets", "statusCounts", "pagination"],
            preserveScroll: true,
            preserveState: true,
        });
    }, [ticketUpdates, clearTicketUpdates]);
};
