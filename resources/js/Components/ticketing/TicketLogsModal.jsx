import React from "react";
import { Modal } from "antd";
import TicketLogs from "./TicketLogs";

const TicketLogsModal = ({
    visible,
    onClose,
    history = [],
    loading = false,
}) => {
    return (
        <Modal
            title="Activity History"
            style={{ top: 20 }}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
        >
            <TicketLogs history={history} loading={loading} />
        </Modal>
    );
};

export default TicketLogsModal;
