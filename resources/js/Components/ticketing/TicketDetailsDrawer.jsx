import React from "react";
import { Drawer, Tag } from "antd";
import dayjs from "dayjs";
import {
    UserOutlined,
    TagsOutlined,
    FileTextOutlined,
    FieldTimeOutlined,
    AppstoreOutlined,
    ApartmentOutlined,
    CheckCircleOutlined,
    RollbackOutlined,
} from "@ant-design/icons";
import { TicketIcon } from "lucide-react";

const statusColors = {
    1: "blue",
    2: "green",
    3: "gray",
    4: "orange",
};

const statusLabels = {
    1: "Open",
    2: "Resolved",
    3: "Closed",
    4: "Returned",
};

const TicketDetailsDrawer = ({
    open,
    ticket,
    onClose,
    handleButtonClick,
    action,
}) => {
    if (!ticket) return null;

    const calcDuration = () => {
        const created = new Date(ticket.CREATED_AT.replace(" ", "T"));
        const mins = Math.floor((Date.now() - created) / 60000);
        const hours = Math.floor(mins / 60);
        const m = mins % 60;
        return hours > 0 ? `${hours}h ${m}m` : `${mins}m`;
    };

    return (
        <Drawer
            title={
                <div className="flex justify-between items-center">
                    {/* Left: Ticket # */}
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <TicketIcon className="w-5 h-5" />
                        {ticket.TICKET_ID}
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex gap-2">
                        {action?.toLowerCase() === "close" ? (
                            <>
                                {/* Close button: positive action */}
                                <button
                                    className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-md"
                                    onClick={() =>
                                        handleButtonClick(
                                            ticket.TICKET_ID,
                                            "Close"
                                        )
                                    }
                                >
                                    <CheckCircleOutlined className="w-4 h-4" />
                                    Close
                                </button>

                                {/* Return button: back to support */}
                                <button
                                    className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-md"
                                    onClick={() =>
                                        handleButtonClick(
                                            ticket.TICKET_ID,
                                            "Return"
                                        )
                                    }
                                >
                                    <RollbackOutlined className="w-4 h-4" />
                                    Return
                                </button>
                            </>
                        ) : action?.toLowerCase() !== "view" ? (
                            <button
                                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-md"
                                onClick={() =>
                                    handleButtonClick(ticket.TICKET_ID, action)
                                }
                            >
                                {/* optional icon for other actions */}
                                <CheckCircleOutlined className="w-4 h-4" />
                                {action}
                            </button>
                        ) : null}
                    </div>
                </div>
            }
            open={open}
            onClose={onClose}
            width={700}
            styles={{ body: { padding: 0 } }}
        >
            <div className="p-5 space-y-6">
                {/* ===== Top Row: Status, Date, Duration ===== */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <Tag color={statusColors[ticket.STATUS]}>
                        {statusLabels[ticket.STATUS]}
                    </Tag>
                    <span className="text-base-500 text-md">
                        {dayjs(ticket.CREATED_AT).format(
                            "MMM DD, YYYY - hh:mm A"
                        )}
                    </span>
                    <span className="text-base-500 text-md flex items-center gap-1">
                        <FieldTimeOutlined /> {calcDuration()}
                    </span>
                </div>

                {/* ===== Employee Details ===== */}
                <div>
                    <h3 className="font-semibold text-base-700 mb-3">
                        Employee Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <div className="text-base-500 text-md flex items-center gap-2">
                                <UserOutlined /> Requestor
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.EMPLOYID} - {ticket.EMPNAME}
                            </div>
                        </div>
                        <div>
                            <div className="text-base-500 text-md flex items-center gap-2">
                                <ApartmentOutlined /> Department
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.DEPARTMENT || "-"}
                            </div>
                        </div>
                        <div>
                            <div className="text-base-500 text-md flex items-center gap-2">
                                <ApartmentOutlined /> Station
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.STATION || "-"}
                            </div>
                        </div>
                        <div>
                            <div className="text-base-500 text-md flex items-center gap-2">
                                <ApartmentOutlined /> Prodline
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.PRODLINE || "-"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== Ticket Details ===== */}
                <div>
                    <h3 className="font-semibold text-base-700 mb-3">
                        Ticket Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <div className="text-base-500 text-md flex items-center gap-2">
                                <TagsOutlined /> Request Type
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.TYPE_OF_REQUEST}
                            </div>
                        </div>
                        <div>
                            <div className="text-base-500 text-md flex items-center gap-2">
                                <AppstoreOutlined /> Request Option
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.REQUEST_OPTION}
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <div className="text-base-500 text-md flex items-center gap-2">
                                <FileTextOutlined /> Item Name
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.ITEM_NAME || "-"}
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <div className="text-base-500 text-md mb-1 flex items-center gap-2">
                                <FileTextOutlined /> Details
                            </div>
                            <div className="font-semibold text-base-800">
                                {ticket.DETAILS || "No details provided."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

export default TicketDetailsDrawer;
