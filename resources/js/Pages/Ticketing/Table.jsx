import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import React, { useState, useEffect } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import { Table, Tag, Spin, Tooltip, Empty, message, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import TicketFormSkeleton from "@/Components/ticketing/TableSkeleton";
import StatCard from "@/Components/ticketing/StatCard";
import useTicketingTable from "@/Hooks/useTicketTable";
import TicketDetailsDrawer from "@/Components/ticketing/TicketDetailsDrawer";
import DurationCell from "@/Components/ticketing/DurationCell";
import { useNotifications } from "@/Context/NotificationContext";
import {
    PlayCircle,
    MonitorCog,
    AlertCircle,
    TicketCheck,
    ArrowRightLeft,
    TicketPercent,
} from "lucide-react";
const TicketingTable = () => {
    const {
        emp_data,
        tickets,
        pagination,
        statusCounts,
        user_roles,
        is_support_staff,
        filters: initialFilters,
    } = usePage().props;
    console.log(usePage().props);

    const {
        loading,
        searchValue,
        activeFilter,
        handleStatusFilter,
        handleTableChange,
        handleSearch,
        isTicketCritical,
    } = useTicketingTable({
        pagination,
        filters: initialFilters,
        statusCounts,
    });

    const { ticketUpdates, clearTicketUpdates } = useNotifications();

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketLogs, setTicketLogs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [processingTicket, setProcessingTicket] = useState(false);

    const isMISSupervisor = user_roles?.includes("MIS_SUPERVISOR");
    // Handle real-time ticket updates by refetching the table
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
    const autoProcessTicket = async (ticketId) => {
        if (!is_support_staff) return false;
        console.log("Auto Process");

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

                // Refresh the table data immediately after successful auto-process
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

    const fetchTicketHistory = async (ticketId) => {
        setLoadingHistory(true);
        try {
            const { data } = await axios.get(
                route("tickets.details", { ticketId })
            );

            const { success, message: msg, data: ticketData } = data;

            if (!success) {
                message.error(msg);
                setTicketLogs([]);
                return;
            }

            const { logs } = ticketData;
            setTicketLogs(logs || []);
        } catch (err) {
            console.error(err.response || err);
            message.error("Failed to fetch ticket history.");
            setTicketLogs([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleTicketAction = async (ticketId, action, remarks, rating) => {
        console.log(action);

        if (!remarks) {
            message.error("Please enter remarks.");
            return;
        }

        // Build payload
        const payload = {
            ticket_id: ticketId,
            action,
            remarks,
            // Only include rating for CLOSE action
            ...(action.toUpperCase() === "CLOSE" ? { rating } : {}),
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
    const fetchAssignedApprovers = async (ticketId) => {
        try {
            const res = await axios.get(
                route("tickets.assignedApprovers", ticketId)
            );
            console.log("Assigned Approvers:", res.data);
            return res.data;
        } catch (error) {
            console.error("Failed to fetch assigned approvers", error);
            return null;
        }
    };
    const handleRowClick = async (record) => {
        console.log("Row clicked:", record);

        // Fetch approvers for THIS ticket only
        await fetchAssignedApprovers(record.TICKET_ID);

        if (is_support_staff && (record.STATUS == 1 || record.STATUS == 3)) {
            const success = await autoProcessTicket(record.TICKET_ID);
            if (!success) return;
        }

        setSelectedTicket(record);
        setIsDrawerOpen(true);
        fetchTicketHistory(record.TICKET_ID);
    };
    const columns = [
        {
            title: "Ticket ID",
            dataIndex: "TICKET_ID",
            key: "TICKET_ID",
            width: 120,
            sorter: true,
        },
        {
            title: "Requestor",
            dataIndex: "EMPNAME",
            key: "EMPNAME",
            width: 150,
            sorter: true,
        },
        {
            title: "Request Type",
            dataIndex: "TYPE_OF_REQUEST",
            key: "TYPE_OF_REQUEST",
            width: 150,
            sorter: true,
        },
        {
            title: "Request Option",
            dataIndex: "REQUEST_OPTION",
            key: "REQUEST_OPTION",
            width: 150,
            sorter: true,
        },
        {
            title: "Item Name",
            dataIndex: "ITEM_NAME",
            key: "ITEM_NAME",
            width: 150,
            sorter: true,
            render: (itemName) => itemName || "-",
        },
        {
            title: "Details",
            dataIndex: "DETAILS",
            key: "DETAILS",
            width: 150,
            sorter: true,
            render: (itemName) => itemName || "-",
        },
        {
            title: "Status",
            dataIndex: "STATUS",
            key: "STATUS",
            width: 120,
            sorter: true,
            render: (_, record) => {
                const tag = (
                    <Tag color={record.status_color || "default"}>
                        {record.status_label || "-"}
                    </Tag>
                );

                if (record.STATUS === 1 && isTicketCritical(record)) {
                    return (
                        <Tooltip
                            title={`Open for more than 30 minutes - created at ${record.CREATED_AT}`}
                        >
                            {tag}
                        </Tooltip>
                    );
                }

                return tag;
            },
        },

        ...(isMISSupervisor &&
        (activeFilter === "all" ||
            activeFilter === "resolved" ||
            activeFilter === "returned" ||
            activeFilter === "closed")
            ? [
                  {
                      title: "Handled By",
                      dataIndex: "handled_by_name",
                      key: "handled_by_name",
                      width: 120,
                      sorter: true,
                      render: (handledBy, record) => (
                          <Tooltip title={handledBy || "Not yet assigned"}>
                              <div className="flex items-center gap-1">
                                  {handledBy || "-"}
                              </div>
                          </Tooltip>
                      ),
                  },
              ]
            : []),
        {
            title: "Created At",
            dataIndex: "CREATED_AT",
            key: "CREATED_AT",
            width: 150,
            sorter: true,
            render: (createdAt, record) => {
                const isCritical = isTicketCritical(record);
                const formatted = dayjs(createdAt).format("MMM DD, YYYY");

                return isCritical ? (
                    <Tooltip title="This ticket is critical - open for more than 30 minutes">
                        <span style={{ color: "red", fontWeight: "bold" }}>
                            {formatted}
                        </span>
                    </Tooltip>
                ) : (
                    formatted
                );
            },
        },
        {
            title: "Duration",
            key: "duration",
            width: 100,
            render: (_, record) => <DurationCell record={record} />,
        },
    ];

    const isLoading = false;

    return (
        <AuthenticatedLayout>
            <Head title="Tickets Table" />
            {isLoading ? (
                <TicketFormSkeleton />
            ) : (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
                        <StatCard
                            title="All Tickets"
                            value={statusCounts?.all || 0}
                            color="neutral"
                            icon={TicketPercent}
                            onClick={() => handleStatusFilter("all")}
                            isActive={activeFilter === "all"}
                            filterType="all"
                        />
                        <StatCard
                            title="Open / Ongoing"
                            value={statusCounts?.open || 0}
                            color="info"
                            icon={PlayCircle}
                            onClick={() => handleStatusFilter("open")}
                            isActive={activeFilter === "open"}
                            filterType="open"
                        />
                        <StatCard
                            title="On Process"
                            value={statusCounts?.onProcess || 0}
                            color="info"
                            icon={MonitorCog}
                            onClick={() => handleStatusFilter("onProcess")}
                            isActive={activeFilter === "onProcess"}
                            filterType="onProcess"
                        />
                        <StatCard
                            title="Critical"
                            value={statusCounts?.critical || 0}
                            color="secondary"
                            icon={AlertCircle}
                            onClick={() => handleStatusFilter("critical")}
                            isActive={activeFilter === "critical"}
                            filterType="critical"
                            tooltip="Tickets open for more than 30 minutes"
                        />
                        <StatCard
                            title="Resolved"
                            value={statusCounts?.resolved || 0}
                            color="warning"
                            icon={TicketCheck}
                            onClick={() => handleStatusFilter("resolved")}
                            isActive={activeFilter === "resolved"}
                            filterType="resolved"
                        />
                        <StatCard
                            title="Returned / Cancelled"
                            value={statusCounts?.returned || 0}
                            color="error"
                            icon={ArrowRightLeft}
                            onClick={() => handleStatusFilter("returned")}
                            isActive={activeFilter === "returned"}
                            filterType="returned"
                        />
                        <StatCard
                            title="Closed"
                            value={statusCounts?.closed || 0}
                            color="success"
                            icon={TicketCheck}
                            onClick={() => handleStatusFilter("closed")}
                            isActive={activeFilter === "closed"}
                            filterType="closed"
                        />
                    </div>

                    {/* Table Container */}
                    <div className="p-6 bg-base-200 transition-all duration-300 border border-base-300 rounded-xl shadow-sm">
                        {/* Filters */}
                        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                            {tickets && tickets.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <SearchOutlined className="w-4 h-4 text-base-content/70" />
                                    <input
                                        type="text"
                                        placeholder="Search tickets..."
                                        value={searchValue}
                                        onChange={(e) =>
                                            handleSearch(e.target.value)
                                        }
                                        className="input input-bordered input-sm w-64"
                                    />
                                </div>
                            )}

                            {activeFilter === "critical" && (
                                <div className="bg-red-100 border border-red-300 text-red-800 px-3 py-1 rounded-lg text-sm">
                                    ⚠️ Showing tickets open for more than 30
                                    minutes
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <Spin spinning={loading || processingTicket}>
                            {tickets && tickets.length > 0 ? (
                                <Table
                                    columns={columns}
                                    dataSource={tickets}
                                    rowKey={(record) =>
                                        record.TICKET_ID || record.ticket_id
                                    }
                                    pagination={{
                                        current: pagination?.current_page || 1,
                                        pageSize: pagination?.per_page || 10,
                                        total: pagination?.total || 0,
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        pageSizeOptions: ["10", "20", "50"],
                                    }}
                                    onChange={handleTableChange}
                                    bordered
                                    size="middle"
                                    scroll={{ x: 1100, y: "50vh" }}
                                    className="bg-base-100 rounded-xl shadow-md"
                                    loading={loading}
                                    onRow={(record) => ({
                                        onClick: () => handleRowClick(record),
                                        style: {
                                            cursor: "pointer",
                                            // Highlight open tickets for support staff
                                            ...(is_support_staff &&
                                            (record.STATUS === 1 ||
                                                record.status === 1)
                                                ? { backgroundColor: "#f0f9ff" }
                                                : {}),
                                        },
                                    })}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-base-100 rounded-xl shadow-md">
                                    <Empty description="No tickets found" />
                                </div>
                            )}
                        </Spin>
                    </div>
                </>
            )}
            <TicketDetailsDrawer
                open={isDrawerOpen}
                ticket={selectedTicket}
                onClose={() => setIsDrawerOpen(false)}
                handleButtonClick={handleTicketAction}
                action={selectedTicket?.action}
                ticketLogs={ticketLogs}
                loadingHistory={loadingHistory}
            />
        </AuthenticatedLayout>
    );
};

export default TicketingTable;
