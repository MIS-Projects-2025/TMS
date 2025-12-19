import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import React, { useMemo } from "react";
import { usePage, Head } from "@inertiajs/react";
import { Table, Spin, Empty, Tag, Tooltip } from "antd";
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

// Import new hooks
import { useTicketDrawer } from "@/Hooks/useTicketDrawer";
import { useTicketActions } from "@/Hooks/useTicketActions";
import { useRealtimeTicketUpdates } from "@/Hooks/useRealtimeTicketUpdates";

const TicketingTable = () => {
    const {
        emp_data,
        tickets,
        pagination,
        statusCounts,
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

    const userRoles = emp_data?.emp_user_roles ?? [];
    const isMISSupervisor = userRoles?.includes("MIS_SUPERVISOR");
    const supportStaff =
        isMISSupervisor || userRoles?.includes("SUPPORT_TECHNICIAN");

    const { ticketUpdates, clearTicketUpdates } = useNotifications();

    // Use ticket drawer hook
    const {
        isDrawerOpen,
        selectedTicket,
        ticketLogs,
        loadingHistory,
        openDrawer,
        closeDrawer,
        handleTicketAction,
    } = useTicketDrawer();

    // Use ticket actions hook
    const { processingTicket, handleRowClick, assignedApprovers } =
        useTicketActions({
            supportStaff,
        });

    // Use real-time updates hook
    useRealtimeTicketUpdates({ ticketUpdates, clearTicketUpdates });

    // Table columns definition (kept in component due to JSX)
    const columns = useMemo(() => {
        const baseColumns = [
            {
                title: "Ticket ID",
                dataIndex: "ticket_id",
                key: "ticket_id",
                width: 120,
                sorter: true,
            },
            {
                title: "Requestor",
                dataIndex: "empname",
                key: "empname",
                width: 150,
                sorter: true,
            },
            {
                title: "Request Type",
                dataIndex: "type_of_request",
                key: "type_of_request",
                width: 150,
                sorter: true,
            },
            {
                title: "Request Option",
                dataIndex: "request_option",
                key: "request_option",
                width: 150,
                sorter: true,
            },
            {
                title: "Item Name",
                dataIndex: "item_name",
                key: "item_name",
                width: 150,
                sorter: true,
                render: (itemName) => itemName || "-",
            },
            {
                title: "Details",
                dataIndex: "details",
                key: "details",
                width: 150,
                sorter: true,
                render: (itemName) => itemName || "-",
            },
            {
                title: "Status",
                dataIndex: "status",
                key: "status",
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
                                title={`Open for more than 30 minutes - created at ${record.created_at}`}
                            >
                                {tag}
                            </Tooltip>
                        );
                    }

                    return tag;
                },
            },
        ];

        const handledByColumn = {
            title: "Handled By",
            dataIndex: "handled_by_name",
            key: "handled_by_name",
            width: 120,
            sorter: true,
            render: (handledBy) => (
                <Tooltip title={handledBy || "Not yet assigned"}>
                    <div className="flex items-center gap-1">
                        {handledBy || "-"}
                    </div>
                </Tooltip>
            ),
        };

        const dateColumns = [
            {
                title: "Created At",
                dataIndex: "created_at",
                key: "created_at",
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

        // Conditionally insert "Handled By" column
        const shouldShowHandledBy =
            isMISSupervisor &&
            (activeFilter === "all" ||
                activeFilter === "resolved" ||
                activeFilter === "returned" ||
                activeFilter === "closed");

        return shouldShowHandledBy
            ? [...baseColumns, handledByColumn, ...dateColumns]
            : [...baseColumns, ...dateColumns];
    }, [isMISSupervisor, activeFilter, isTicketCritical]);

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
                                    rowKey={(record) => record.ticket_id}
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
                                        onClick: () =>
                                            handleRowClick(record, openDrawer),
                                        style: {
                                            cursor: "pointer",
                                            ...(supportStaff &&
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
                onClose={closeDrawer}
                handleButtonClick={handleTicketAction}
                action={selectedTicket?.action}
                ticketLogs={ticketLogs}
                loadingHistory={loadingHistory}
                assignedApprovers={assignedApprovers}
            />
        </AuthenticatedLayout>
    );
};

export default TicketingTable;
