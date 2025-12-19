import { useState } from "react";
import { message } from "antd";
import axios from "axios";

/**
 * Hook to manage ticket drawer state and actions
 */
export const useTicketDrawer = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketLogs, setTicketLogs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Fetch ticket details only (no logs)
    const fetchTicketDetails = async (ticketId) => {
        try {
            const { data } = await axios.get(
                route("tickets.details", { ticketId })
            );
            const { success, message: msg, data: ticketData } = data;

            if (!success) {
                message.error(msg);
                setSelectedTicket(null);
                return;
            }

            setSelectedTicket(ticketData.ticket);
        } catch (err) {
            console.error(err.response || err);
            message.error("Failed to fetch ticket details.");
            setSelectedTicket(null);
        }
    };

    // Fetch logs separately
    const fetchTicketLogs = async (ticketId) => {
        // console.log(ticketId);

        setLoadingHistory(true);
        try {
            const { data } = await axios.get(
                route("tickets.logs", { ticketId })
            );
            const { success, data: logs } = data;

            if (!success) {
                setTicketLogs([]);
                return;
            }

            setTicketLogs(logs || []);
        } catch (err) {
            console.error(err.response || err);
            message.error("Failed to fetch ticket logs.");
            setTicketLogs([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleTicketAction = async (
        ticketId,
        action,
        remarks,
        rating,
        assignedEmployee
    ) => {
        if (!remarks) {
            message.error("Please enter remarks.");
            return;
        }

        const payload = {
            ticket_id: ticketId,
            action,
            remarks,
            ...(action.toUpperCase() === "CLOSE" ? { rating } : {}),
            ...(assignedEmployee ? { assigned_to: assignedEmployee } : {}),
        };

        try {
            const res = await axios.post(route("tickets.action"), payload);
            if (res.data.success) {
                message.success(res.data.message);
                setIsDrawerOpen(false);
                window.location.reload();
            } else {
                message.error(res.data.message);
            }
        } catch (err) {
            message.error("Failed to update ticket.");
        }
    };

    const openDrawer = (ticketId) => {
        setIsDrawerOpen(true);
        fetchTicketDetails(ticketId.ticket_id);
        fetchTicketLogs(ticketId.ticket_id); // fetch logs separately
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedTicket(null);
        setTicketLogs([]);
    };

    return {
        isDrawerOpen,
        selectedTicket,
        ticketLogs,
        loadingHistory,
        openDrawer,
        closeDrawer,
        handleTicketAction,
        fetchTicketLogs,
    };
};
