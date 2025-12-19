import { Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import DurationCell from "@/Components/ticketing/DurationCell";

/**
 * Hook to generate table columns based on filters and permissions
 */
export const useTicketColumns = ({
    isMISSupervisor,
    activeFilter,
    isTicketCritical,
}) => {
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

    const columns = shouldShowHandledBy
        ? [...baseColumns, handledByColumn, ...dateColumns]
        : [...baseColumns, ...dateColumns];

    return columns;
};
