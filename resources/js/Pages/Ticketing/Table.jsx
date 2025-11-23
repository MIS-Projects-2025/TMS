import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import React, { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import { Table, Tag, Spin, Tooltip, Empty, message } from "antd";
import {
    AppstoreOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    SyncOutlined,
    CheckCircleOutlined,
    SearchOutlined,
    RollbackOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import TicketFormSkeleton from "@/Components/ticketing/TableSkeleton";
import StatCard from "@/Components/ticketing/StatCard";
import useTicketingTable from "@/Hooks/useTicketTable";
import TicketDetailsDrawer from "@/Components/ticketing/TicketDetailsDrawer";
import DurationCell from "@/Components/ticketing/DurationCell";
import { useNotifications } from "@/Context/NotificationContext";

const TicketingTable = () => {
    const {
        emp_data,
        tickets,
        pagination,
        statusCounts,
        filters: initialFilters,
    } = usePage().props;

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
            {isLoading ? (
                <TicketFormSkeleton />
            ) : (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                        <StatCard
                            title="All Tickets"
                            value={statusCounts?.all || 0}
                            color="neutral"
                            icon={AppstoreOutlined}
                            onClick={() => handleStatusFilter("all")}
                            isActive={activeFilter === "all"}
                            filterType="all"
                        />
                        <StatCard
                            title="Open / Ongoing"
                            value={statusCounts?.open || 0}
                            color="info"
                            icon={ClockCircleOutlined}
                            onClick={() => handleStatusFilter("open")}
                            isActive={activeFilter === "open"}
                            filterType="open"
                        />
                        <StatCard
                            title="Critical"
                            value={statusCounts?.critical || 0}
                            color="secondary"
                            icon={ExclamationCircleOutlined}
                            onClick={() => handleStatusFilter("critical")}
                            isActive={activeFilter === "critical"}
                            filterType="critical"
                            tooltip="Tickets open for more than 30 minutes"
                        />
                        <StatCard
                            title="Resolved"
                            value={statusCounts?.resolved || 0}
                            color="warning"
                            icon={SyncOutlined}
                            onClick={() => handleStatusFilter("resolved")}
                            isActive={activeFilter === "resolved"}
                            filterType="resolved"
                        />
                        <StatCard
                            title="Returned / Cancelled"
                            value={statusCounts?.returned || 0}
                            color="error"
                            icon={RollbackOutlined}
                            onClick={() => handleStatusFilter("returned")}
                            isActive={activeFilter === "returned"}
                            filterType="returned"
                        />
                        <StatCard
                            title="Closed"
                            value={statusCounts?.closed || 0}
                            color="success"
                            icon={CheckCircleOutlined}
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
                        <Spin spinning={loading}>
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
                                        onClick: () => {
                                            setSelectedTicket(record);
                                            setIsDrawerOpen(true);

                                            fetchTicketHistory(
                                                record.TICKET_ID
                                            );
                                        },
                                        style: { cursor: "pointer" },
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
