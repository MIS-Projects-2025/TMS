import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import React, { useState } from "react";
import { usePage, router } from "@inertiajs/react";
import {
    Button,
    Card,
    Table,
    Drawer,
    Form,
    Input,
    Select,
    message,
    Popconfirm,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Option } = Select;

const ApproverList = () => {
    const { approverList, approverOptions } = usePage().props;
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [form] = Form.useForm();

    // Filter out employees already added
    const availableEmployees = approverOptions.filter(
        (emp) => !approverList.some((a) => a.employid === emp.EMPLOYID)
    );

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
        { title: "Employee ID", dataIndex: "employid", key: "employid" },
        { title: "Employee Name", dataIndex: "empname", key: "empname" },
        { title: "Department", dataIndex: "department", key: "department" },
        { title: "Product Line", dataIndex: "prodline", key: "prodline" },
        { title: "Station", dataIndex: "station", key: "station" },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Popconfirm
                    title="Are you sure to delete this approver?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button icon={<DeleteOutlined />} type="link" danger />
                </Popconfirm>
            ),
        },
    ];

    const openCreateDrawer = () => {
        form.resetFields();
        setDrawerVisible(true);
    };

    const closeDrawer = () => {
        setDrawerVisible(false);
        form.resetFields();
    };

    const handleEmployeeChange = (value) => {
        const emp = approverOptions.find((e) => e.EMPLOYID === value);
        if (emp) {
            form.setFieldsValue({
                employid: emp.EMPLOYID,
                empname: emp.EMPNAME,
                department: emp.DEPARTMENT,
                prodline: emp.PRODLINE,
                station: emp.STATION,
            });
        }
    };

    const handleSubmit = async (data) => {
        // console.log(data);

        try {
            const response = await axios.post(route("approvers.store"), data);

            if (response?.data?.success) {
                message.success(`Approver created successfully!`);
                closeDrawer();
                router.reload({ only: ["approverList"] });
            } else {
                message.error(response?.data?.message || "Operation failed");
            }
        } catch (error) {
            message.error("Failed to create approver. Please try again.");
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await axios.delete(route("approvers.destroy", id));
            if (response?.data?.success) {
                message.success("Approver deleted successfully!");
                router.reload({ only: ["approverList"] });
            } else {
                message.error(response?.data?.message || "Delete failed");
            }
        } catch (error) {
            message.error("Failed to delete approver. Please try again.");
            console.error(error);
        }
    };

    return (
        <AuthenticatedLayout>
            <Card
                title="Approver List"
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openCreateDrawer}
                        disabled={availableEmployees.length === 0} // Disable if no employees left
                    >
                        Add New Approver
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={approverList}
                    bordered
                    size="middle"
                    locale={{ emptyText: "No approver data available" }}
                    rowKey="id"
                />
            </Card>

            <Drawer
                title="Add New Approver"
                width={400}
                onClose={closeDrawer}
                open={drawerVisible}
            >
                <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    <Form.Item
                        name="employid"
                        label="Employee"
                        rules={[
                            {
                                required: true,
                                message: "Please select Employee",
                            },
                        ]}
                    >
                        <Select
                            placeholder="Select Employee"
                            showSearch
                            optionFilterProp="children"
                            onChange={handleEmployeeChange}
                        >
                            {availableEmployees.map((emp) => (
                                <Option key={emp.EMPLOYID} value={emp.EMPLOYID}>
                                    {emp.EMPLOYID} - {emp.EMPNAME}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Hidden empname */}
                    <Form.Item name="empname" hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item name="department" label="Department">
                        <Input allowClear readOnly />
                    </Form.Item>

                    <Form.Item name="prodline" label="Product Line">
                        <Input allowClear readOnly />
                    </Form.Item>

                    <Form.Item name="station" label="Station">
                        <Input allowClear readOnly />
                    </Form.Item>

                    <Button type="primary" htmlType="submit">
                        Add
                    </Button>
                </Form>
            </Drawer>
        </AuthenticatedLayout>
    );
};

export default ApproverList;
