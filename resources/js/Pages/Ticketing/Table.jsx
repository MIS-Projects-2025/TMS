import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const handleTicketAction = async (ticketId, action) => {
        console.log(action);

        try {
            const res = await axios.post(route("tickets.action"), {
                ticket_id: ticketId,
                action,
            });
            if (res.data.success) {
                message.success(res.data.message);
                setIsDrawerOpen(false);
                // optionally refresh table
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
            render: (status, record) => {
                const isCritical = isTicketCritical(record);

                const colorMap = {
                    1: isCritical ? "red" : "blue",
                    2: "green",
                    3: "gray",
                    4: "orange",
                };

                const labelMap = {
                    1: isCritical ? "Critical" : "Open",
                    2: "Resolved",
                    3: "Closed",
                    4: "Returned",
                };

                const tag = (
                    <Tag color={colorMap[status] || "default"}>
                        {labelMap[status] || "-"}
                    </Tag>
                );

                return isCritical ? (
                    <Tooltip
                        title={`Open for more than 30 minutes - created at ${record.CREATED_AT}`}
                    >
                        {tag}
                    </Tooltip>
                ) : (
                    tag
                );
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
                            color="primary"
                            icon={AppstoreOutlined}
                            onClick={() => handleStatusFilter("all")}
                            isActive={activeFilter === "all"}
                            filterType="all"
                        />
                        <StatCard
                            title="Open"
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
                            color="error"
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
                            title="Returned"
                            value={statusCounts?.returned || 0}
                            color="neutral"
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
                    <div className="p-6 bg-base-200 min-h-screen transition-all duration-300 border border-base-300 rounded-xl shadow-sm">
                        {/* Filters */}
                        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
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
                                        },
                                        style: { cursor: "pointer" }, // show pointer to indicate clickable
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
            />
        </AuthenticatedLayout>
    );
};

export default TicketingTable;
