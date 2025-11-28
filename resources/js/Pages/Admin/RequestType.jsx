import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Table, Tag, Card, Button, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useRequestTypeDrawer } from '@/Hooks/useRequestTypeDrawer';
import RequestTypeDrawer from '@/Components/requestType/RequestTypeDrawer';

const RequestType = () => {
  const { requestTypes } = usePage().props;
  console.log(usePage().props);
  
  const {
    drawerVisible,
    drawerMode,
    editingRequestType,
    openCreateDrawer,
    closeDrawer,
    handleRowClick,
  } = useRequestTypeDrawer();

  // Map backend collection to table data
  const dataSource = React.useMemo(
    () =>
      requestTypes?.map((type) => ({
        key: type.id,
        id: type.id,
        name: type.name,
        category: type.category,
        has_data: Boolean(type.has_data),
        is_active: Boolean(type.is_active),
        created_at: type.created_at,
        updated_at: type.updated_at,
      })) || [],
    [requestTypes]
  );

 const handleSubmit = async (data) => {
    console.log("Form values:", data);

    try {
      const { id, ...formData } = data;
      let response;

      if (id) {
     
        response = await axios.put(route('request-types.update', id), formData);
        // console.log("update values:", data);
      } else {

        response = await axios.post(route('request-types.store'), formData);
        // console.log("New values:", data);
      }

      if (response.data.success) {
        message.success(
          id 
            ? 'Request type updated successfully!' 
            : `Request type created successfully! ID: ${response.data.id || ''}`
        );

        closeDrawer();
        router.reload({ only: ['requestTypes'] }); // Refresh the table data
      } else {
        message.error(response.data.message || 'Operation failed');
      }
    } catch (error) {
      message.error(
        id 
          ? 'Failed to update request type. Please try again.' 
          : 'Failed to create request type. Please try again.'
      );
      console.error('Request type submission error:', error);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a, b) => a.category.localeCompare(b.category),
      filters: [...new Set(dataSource.map((item) => item.category))].map((cat) => ({
        text: cat,
        value: cat,
      })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Has Data',
      dataIndex: 'has_data',
      key: 'has_data',
      align: 'center',
      width: 120,
      filters: [
        { text: 'Yes', value: '1' },
        { text: 'No', value: '0' },
      ],
      onFilter: (value, record) => record.has_data == value,
      render: (has_data) => (
        <Tag color={has_data ? 'blue' : 'default'}>{has_data ? 'Yes' : 'No'}</Tag>
      ),
    },
{
  title: 'Status',
  dataIndex: 'is_active',
  key: 'is_active',
  align: 'center',
  width: 120,
  filters: [
    { text: 'Active', value: '1' },
    { text: 'Inactive', value: '0' },
  ],
  onFilter: (value, record) => record.is_active === value,
  render: (is_active) => {
    const isActive = is_active == '1';
    return (
      <Tag
        icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        color={isActive ? 'success' : 'error'}
      >
        {isActive ? 'Active' : 'Inactive'}
      </Tag>
    );
  },
}

  ];

  return (
    <AuthenticatedLayout>
      <Head title="Request Types" />
      <div className="container mx-auto">
        <Card 
          title="Request Types"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateDrawer}
            >
              Create Request Type
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={dataSource}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' },
            })}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '25', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            bordered
            size="middle"
            locale={{ emptyText: 'No request types data available' }}
          />
        </Card>

        <RequestTypeDrawer
          visible={drawerVisible}
          mode={drawerMode}
          requestType={editingRequestType}
          onClose={closeDrawer}
          onSubmit={handleSubmit}
        />
      </div>
    </AuthenticatedLayout>
  );
};

export default RequestType;