import React, { useState, useEffect } from "react";
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
    StopOutlined,
    HistoryOutlined,
    StarOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import { TicketIcon } from "lucide-react";
import TicketLogsModal from "./TicketLogsModal";

const TicketDetailsDrawer = ({
    open,
    ticket,
    onClose,
    handleButtonClick,
    action,
    ticketLogs = [],
    loadingHistory = false,
}) => {
    const [remarks, setRemarks] = useState("");
    const [currentAction, setCurrentAction] = useState("");
    const [rating, setRating] = useState(0);
    const [logsModalOpen, setLogsModalOpen] = useState(false);

    useEffect(() => {
        if (ticket) {
            setRemarks(ticket.remarks || "");
            if (ticket.RATING) setRating(ticket.RATING);
        }
    }, [ticket]);

    if (!ticket) return null;
    const calcDuration = () => {
        const created = new Date(ticket.CREATED_AT.replace(" ", "T"));

        // Use CLOSED_AT first, then HANDLED_AT, then fallback to now
        const endTime = ticket.CLOSED_AT
            ? new Date(ticket.CLOSED_AT.replace(" ", "T"))
            : ticket.HANDLED_AT
            ? new Date(ticket.HANDLED_AT.replace(" ", "T"))
            : new Date();

        const mins = Math.floor((endTime - created) / 60000);
        const hours = Math.floor(mins / 60);
        const m = mins % 60;

        return hours > 0 ? `${hours}h ${m}m` : `${mins}m`;
    };

    // Combine logs (all history is in logs now)
    const combinedHistory = ticketLogs
        .map((log) => ({
            ...log,
            timestamp: log.ACTION_AT || log.CREATED_AT,
            type: "log",
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const handleCloseDrawer = () => {
        setRemarks(ticket.remarks || "");
        setRating(ticket.RATING || 0);
        setCurrentAction("");
        onClose();
    };

    const hasExistingRating = ticket.RATING && ticket.RATING > 0;
    const isViewAction =
        Array.isArray(action?.actions) &&
        action.actions.length === 1 &&
        action.actions[0].toLowerCase() === "view";
    return (
        <Drawer
            title={
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4">
                        <TicketIcon className="w-6 h-6 text-blue-500" />
                        <span className="font-semibold text-lg ">
                            {ticket.TICKET_ID}
                        </span>

                        {combinedHistory.length > 0 && (
                            <button
                                className="flex items-center gap-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full hover:bg-blue-200 transition-colors duration-150"
                                onClick={() => setLogsModalOpen(true)}
                            >
                                <HistoryOutlined className="w-4 h-4" />
                                {combinedHistory.length}
                            </button>
                        )}
                    </div>
                    {/* Display existing rating if it exists */}
                    {hasExistingRating && (
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-base-800 flex items-center gap-2">
                                    Requestor Rating:
                                </span>
                                <div className="rating rating-xs rating-disabled">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <input
                                            key={star}
                                            type="radio"
                                            name="rating-display"
                                            className="mask mask-star-2 bg-orange-400"
                                            checked={ticket.RATING === star}
                                            readOnly
                                        />
                                    ))}
                                </div>
                                <span className="text-base-600 font-medium">
                                    ({ticket.RATING}/5)
                                </span>
                            </div>
                        </div>
                    )}
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {currentAction.toLowerCase() !== "close" &&
                            Array.isArray(action?.actions) &&
                            action.actions
                                .filter((a) => a.toLowerCase() !== "view")
                                .map((a) => {
                                    const type = a.toLowerCase();
                                    const colorClasses = {
                                        close: "bg-green-500 hover:bg-green-600",
                                        return: "bg-yellow-500 hover:bg-yellow-600",
                                        resolve:
                                            "bg-green-500 hover:bg-green-600",
                                        ongoing:
                                            "bg-yellow-500 hover:bg-yellow-600",
                                        cancel: "bg-red-500 hover:bg-red-600",
                                    };
                                    const btnColor =
                                        colorClasses[type] ||
                                        "bg-blue-500 hover:bg-blue-600";

                                    const icons = {
                                        close: (
                                            <CheckCircleOutlined className="w-4 h-4" />
                                        ),
                                        return: (
                                            <RollbackOutlined className="w-4 h-4" />
                                        ),
                                        resolve: (
                                            <CheckCircleOutlined className="w-4 h-4" />
                                        ),
                                        ongoing: (
                                            <CheckCircleOutlined className="w-4 h-4" />
                                        ),
                                        cancel: (
                                            <StopOutlined className="w-4 h-4" />
                                        ),
                                    };

                                    return (
                                        <button
                                            key={a}
                                            className={`flex items-center gap-1 px-3 py-1 text-white rounded-lg text-sm shadow-sm ${btnColor} transition-colors duration-150`}
                                            onClick={() => {
                                                if (type === "close") {
                                                    setCurrentAction("close");
                                                } else {
                                                    handleButtonClick(
                                                        ticket.TICKET_ID,
                                                        a,
                                                        remarks,
                                                        rating
                                                    );
                                                }
                                            }}
                                        >
                                            {icons[type] || (
                                                <CheckCircleOutlined className="w-4 h-4" />
                                            )}
                                            {a}
                                        </button>
                                    );
                                })}

                        {/* Show Confirm Close only if Close is clicked */}
                        {currentAction.toLowerCase() === "close" && (
                            <button
                                className={`flex items-center gap-1 px-3 py-1 text-white rounded-lg text-sm shadow-sm ${
                                    rating <= 0
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-green-500 hover:bg-green-600"
                                } transition-colors duration-150`}
                                disabled={rating <= 0}
                                onClick={() => {
                                    if (rating <= 0) return;
                                    handleButtonClick(
                                        ticket.TICKET_ID,
                                        "Close",
                                        remarks,
                                        rating
                                    );
                                    setCurrentAction("");
                                    setRemarks(ticket.remarks || "");
                                    setRating(0);
                                }}
                            >
                                <CheckCircleOutlined className="w-4 h-4" />
                                Confirm Close
                            </button>
                        )}
                    </div>
                </div>
            }
            open={open}
            onClose={handleCloseDrawer}
            width={800}
            styles={{ body: { padding: 0 } }}
        >
            {/* Status, Date, Duration */}
            <div className="flex flex-wrap gap-4 mt-4 ml-4">
                <Tag color={ticket.status_color || "default"}>
                    {ticket.status_label || "-"}
                </Tag>
                <Tag color={ticket.status_color || "default"}>
                    Created At:{" "}
                    {dayjs(ticket.CREATED_AT).format("MMM DD, YYYY - hh:mm A")}
                </Tag>
                <Tag color={ticket.status_color || "default"}>
                    <FieldTimeOutlined /> {calcDuration()}
                </Tag>
            </div>
            <div className="p-5 space-y-6">
                {/* Ticket Timeline */}
                {(ticket.handled_by_name && ticket.HANDLED_AT) ||
                (ticket.closed_by_name && ticket.CLOSED_AT) ? (
                    <div>
                        <h3 className="font-semibold text-base-700 mb-3">
                            Ticket Timeline
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
                            {ticket.handled_by_name && ticket.HANDLED_AT && (
                                <div>
                                    <div className="text-base-500 text-md flex items-center gap-2">
                                        <ClockCircleOutlined /> Handled By
                                    </div>
                                    <div className="font-semibold text-base-800">
                                        {ticket.handled_by_name}
                                    </div>
                                    <div className="text-base-500 text-sm mt-1">
                                        {dayjs(ticket.HANDLED_AT).format(
                                            "MMM DD, YYYY - hh:mm A"
                                        )}
                                    </div>
                                </div>
                            )}
                            {ticket.closed_by_name && ticket.CLOSED_AT && (
                                <div>
                                    <div className="text-base-500 text-md flex items-center gap-2">
                                        <CheckCircleOutlined /> Closed By
                                    </div>
                                    <div className="font-semibold text-base-800">
                                        {ticket.closed_by_name}
                                    </div>
                                    <div className="text-base-500 text-sm mt-1">
                                        {dayjs(ticket.CLOSED_AT).format(
                                            "MMM DD, YYYY - hh:mm A"
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Employee Details */}
                <div>
                    <h3 className="font-semibold text-base-700 mb-3">
                        Employee Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
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

                {/* Ticket Details */}
                <div>
                    <h3 className="font-semibold text-base-700 mb-3">
                        Ticket Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
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
                        {ticket.ITEM_NAME && (
                            <div className="sm:col-span-2">
                                <div className="text-base-500 text-md flex items-center gap-2">
                                    <FileTextOutlined /> {ticket.REQUEST_OPTION}{" "}
                                    Name
                                </div>
                                <div className="font-semibold text-base-800">
                                    {ticket.ITEM_NAME || "-"}
                                </div>
                            </div>
                        )}
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

                {/* Remarks & Rating for actions */}

                {!isViewAction && (
                    <div>
                        <h3 className="font-semibold text-base-700 mt-2">
                            Remarks
                        </h3>
                        <textarea
                            className="textarea textarea-bordered w-full rounded-lg text-sm resize-y mt-2"
                            rows={4}
                            placeholder="Enter remarks here..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        ></textarea>

                        {/* Rating only for CLOSE action without existing rating */}
                        {currentAction.toLowerCase() === "close" &&
                            !hasExistingRating && (
                                <div className="mt-4">
                                    <label className="block">
                                        <span className="font-semibold text-base-700 flex items-center gap-2">
                                            <StarOutlined /> Rate your
                                            experience (Required)
                                        </span>
                                    </label>
                                    <div className="rating rating-lg mt-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <input
                                                key={star}
                                                type="radio"
                                                name="rating"
                                                className="mask mask-star-2 bg-orange-400"
                                                checked={rating === star}
                                                onChange={() => setRating(star)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                )}

                <TicketLogsModal
                    visible={logsModalOpen}
                    onClose={() => setLogsModalOpen(false)}
                    history={combinedHistory}
                    loading={loadingHistory}
                />
            </div>
        </Drawer>
    );
};

export default TicketDetailsDrawer;
