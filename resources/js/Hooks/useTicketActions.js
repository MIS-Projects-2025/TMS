import { useState } from "react";
import { message, Modal } from "antd";
import { router } from "@inertiajs/react";
import axios from "axios";
import { ExclamationCircleFilled } from "@ant-design/icons";

export const useTicketActions = ({ supportStaff }) => {
    const [processingTicket, setProcessingTicket] = useState(false);
    const [assignedApprovers, setAssignedApprovers] = useState([]);

    const autoProcessTicket = async (ticketId) => {
        if (!supportStaff) return false;

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
                route("tickets.assignedApprovers", ticketId),
            );

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
        try {
            // If ticket status is 4, fetch assigned approvers
            if (record.status == 4) {
                await fetchAssignedApprovers(record.ticket_id);
            }

            // If user is support staff and ticket is Open (status 1)
            if (supportStaff && record.status == 1) {
                Modal.confirm({
                    title: "Take this ticket?",
                    content: `Ticket #${record.ticket_id} is currently Open. Do you want to mark it as On-Process and assign it to yourself?`,
                    okText: "Yes, Process It",
                    okType: "primary",
                    cancelText: "Just View",
                    okButtonProps: {
                        style: { backgroundColor: "#1677ff" },
                    },
                    cancelButtonProps: {
                        type: "default",
                    },
                    onOk: async () => {
                        try {
                            const success = await autoProcessTicket(
                                record.ticket_id,
                            );
                            if (success) {
                                openDrawer(record);
                            } else {
                                message.error("Failed to process the ticket.");
                            }
                        } catch (err) {
                            console.error(err);
                            message.error(
                                "An error occurred while processing the ticket.",
                            );
                        }
                    },
                    onCancel: () => {
                        openDrawer(record);
                    },
                });
                return; // stop further execution after showing modal
            }

            // Default behavior: just open the drawer
            openDrawer(record);
        } catch (error) {
            console.error("Error handling row click:", error);
            message.error("Something went wrong while opening the ticket.");
        }
    };

    return {
        processingTicket,
        autoProcessTicket,
        fetchAssignedApprovers,
        handleRowClick,
        assignedApprovers,
    };
};
