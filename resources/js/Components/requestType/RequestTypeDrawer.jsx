import React, { useState, useEffect } from "react";
import {
    Drawer,
    Form,
    Input,
    Select,
    Switch,
    Button,
    Space,
    message,
} from "antd";

const { Option } = Select;

const RequestTypeDrawer = ({
    visible,
    mode,
    requestType,
    onClose,
    onSubmit,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Reset form when drawer opens/closes or when requestType changes
    useEffect(() => {
        if (visible) {
            if (mode === "edit" && requestType) {
                form.setFieldsValue({
                    name: requestType.name,
                    category: requestType.category,
                    has_data: requestType.has_data,
                    is_active: requestType.is_active,
                });
            } else {
                form.resetFields();
                form.setFieldsValue({
                    has_data: false,
                    is_active: true,
                });
            }
        }
    }, [visible, mode, requestType, form]);

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Just pass the data to parent, let parent handle the backend call
            await onSubmit({
                ...values,
                id: mode === "edit" ? requestType.id : undefined,
            });

            // Success message can be shown here or in parent
            message.success(
                `Request type ${
                    mode === "create" ? "created" : "updated"
                } successfully`
            );

            form.resetFields();
        } catch (error) {
            console.error("Form validation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Drawer
            title={
                mode === "create" ? "Create Request Type" : "Edit Request Type"
            }
            open={visible}
            onClose={handleClose}
            width={520}
            footer={
                <div style={{ textAlign: "right" }}>
                    <Space>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button
                            type="primary"
                            onClick={handleFormSubmit}
                            loading={loading}
                        >
                            {mode === "create" ? "Create" : "Update"}
                        </Button>
                    </Space>
                </div>
            }
        >
            <Form form={form} layout="vertical" requiredMark="optional">
                <Form.Item
                    name="category"
                    label="Category"
                    rules={[
                        { required: true, message: "Please select a category" },
                    ]}
                >
                    <Input
                        size="large"
                        placeholder="Enter Category"
                        style={{ borderRadius: 6 }}
                    />
                </Form.Item>
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[
                        {
                            required: true,
                            message: "Please enter request type name",
                        },
                        {
                            min: 2,
                            message: "Name must be at least 2 characters",
                        },
                    ]}
                >
                    <Input
                        size="large"
                        placeholder="Enter request type name"
                        style={{ borderRadius: 6 }}
                    />
                </Form.Item>
                <Form.Item
                    name="has_data"
                    label="Has Data"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>
                <Form.Item
                    name="is_active"
                    label="Active Status"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>
            </Form>
        </Drawer>
    );
};

export default RequestTypeDrawer;
