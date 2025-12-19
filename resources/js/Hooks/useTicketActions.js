import { useState } from "react";
import { message } from "antd";
import { router } from "@inertiajs/react";
import axios from "axios";

export const useTicketActions = ({ supportStaff }) => {
    const [processingTicket, setProcessingTicket] = useState(false);
    const [assignedApprovers, setAssignedApprovers] = useState([]);

    const autoProcessTicket = async (ticketId) => {
        if (!supportStaff) return false;
        console.log("Auto Process", ticketId);

        setProcessingTicket(true);
        try {
            const payload = {
                ticket_id: ticketId,
                action: "ONPROCESS",
                remarks: "Ticket automatically assigned to support staff",
            };

            const res = await axios.post(route("tickets.action"), payload);
            if (res.data.success) {
                message.success(`Ticket ${ticketId} is now being processed`);

                router.reload({
                    only: ["tickets", "statusCounts", "pagination"],
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        console.log("Table refreshed after auto-process");
                    },
                });

                return true;
            } else {
                message.warning(res.data.message);
                return false;
            }
        } catch (err) {
            console.error("Failed to auto-process ticket:", err);
            message.error("Failed to assign ticket");
            return false;
        } finally {
            setProcessingTicket(false);
        }
    };

    const fetchAssignedApprovers = async (ticketId) => {
        try {
            const res = await axios.get(
                route("tickets.assignedApprovers", ticketId)
            );
            console.log("Assigned Approvers:", res.data);

            // Store the approvers in state
            if (res.data.success && res.data.data?.approvers) {
                setAssignedApprovers(res.data.data.approvers);
            } else {
                setAssignedApprovers([]);
            }

            return res.data;
        } catch (error) {
            console.error("Failed to fetch assigned approvers", error);
            setAssignedApprovers([]);
            return null;
        }
    };

    const handleRowClick = async (record, openDrawer) => {
        console.log("Row clicked:", record);

        await fetchAssignedApprovers(record.ticket_id);

        if (supportStaff && (record.status == 1 || record.status == 3)) {
            const success = await autoProcessTicket(record.ticket_id);
            if (!success) return;
        }

        openDrawer(record);
    };

    return {
        processingTicket,
        autoProcessTicket,
        fetchAssignedApprovers,
        handleRowClick,
        assignedApprovers,
    };
};
