import React from "react";
import { Button, Form, Input, Select } from "antd";
import { TicketIcon } from "lucide-react";

const { Option } = Select;
const { TextArea } = Input;

const TicketForm = ({
    form,
    request_types,
    selectedType,
    selectedOption,
    selectedItem,
    itemOptions,
    showItemSelect,
    showCustomInput,
    handleChange,
    getItemLabel,
    onFinish,
}) => {
    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
        >
            {/* Request Type and Option Row */}
            <div className="grid grid-cols-2 gap-4">
                <Form.Item
                    label={
                        <span className="font-semibold">Type of Request</span>
                    }
                    name="request_type"
                    rules={[
                        {
                            required: true,
                            message: "Please select a request type",
                        },
                    ]}
                >
                    <Select
                        showSearch
                        placeholder="Select request type..."
                        onChange={(value) => handleChange("type", value)}
                        filterOption={(input, option) =>
                            (option?.children ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
                        size="large"
                    >
                        {Object.keys(request_types).map((type) => (
                            <Option key={type} value={type}>
                                {type}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {selectedType && (
                    <Form.Item
                        label={
                            <span className="font-semibold">
                                Request Option
                            </span>
                        }
                        name="request_option"
                        rules={[
                            {
                                required: true,
                                message: "Please select an option",
                            },
                        ]}
                    >
                        <Select
                            showSearch
                            placeholder="Select option..."
                            onChange={(value) => handleChange("option", value)}
                            filterOption={(input, option) =>
                                (option?.children ?? "")
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            }
                            size="large"
                        >
                            {request_types[selectedType]?.map((option) => (
                                <Option key={option} value={option}>
                                    {option}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}
            </div>

            {/* Item Name Select (sa mga option na may kaugnay na data) */}
            {showItemSelect && (
                <Form.Item
                    label={
                        <span className="font-semibold">{getItemLabel()}</span>
                    }
                    name="item_name"
                    rules={[
                        {
                            required: true,
                            message: `Please select a ${getItemLabel().toLowerCase()}`,
                        },
                    ]}
                >
                    <Select
                        showSearch
                        placeholder={`Select ${getItemLabel().toLowerCase()}...`}
                        onChange={(value) => handleChange("item", value)}
                        filterOption={(input, option) =>
                            (option?.children ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
                        size="large"
                    >
                        {itemOptions.map((item) => (
                            <Option key={item.id} value={item.name}>
                                {item.name}
                            </Option>
                        ))}
                        <Option key="others" value="Others">
                            Others
                        </Option>
                    </Select>
                </Form.Item>
            )}

            {/* Custom Input */}
            {showCustomInput && (
                <Form.Item
                    label={
                        <span className="font-semibold">
                            {showItemSelect
                                ? "Specify Details"
                                : "Item Name/Details"}
                        </span>
                    }
                    name="custom_input"
                    rules={[
                        {
                            required: true,
                            message: "Please specify details",
                        },
                    ]}
                >
                    <Input size="large" placeholder="Enter details..." style={{ borderRadius: 6 }} />
                </Form.Item>
            )}

            {selectedOption && (
                <Form.Item
                    label={
                        <span className="font-semibold">
                            Details of Request
                        </span>
                    }
                    name="details"
                    rules={[
                        {
                            required: true,
                            message: "Please provide details of your request",
                        },
                    ]}
                >
                    <TextArea
                        rows={4}
                        placeholder="Please provide detailed information about your request..."
                    />
                </Form.Item>
            )}

            {/* Submit Button */}
            {selectedOption && (
                <Form.Item>
                    <button type="submit" className="btn btn-success w-full">
                        <TicketIcon className="inline mr-2" />
                        Generate Ticket
                    </button>
                </Form.Item>
            )}
        </Form>
    );
};

export default TicketForm;
