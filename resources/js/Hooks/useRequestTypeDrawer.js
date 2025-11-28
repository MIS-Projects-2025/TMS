import { useState } from 'react';

export const useRequestTypeDrawer = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRequestType, setEditingRequestType] = useState(null);
  const [drawerMode, setDrawerMode] = useState('create'); // 'create' or 'edit'

  const openCreateDrawer = () => {
    setDrawerMode('create');
    setEditingRequestType(null);
    setDrawerVisible(true);
  };

  const openEditDrawer = (requestType) => {
    setDrawerMode('edit');
    setEditingRequestType(requestType);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingRequestType(null);
  };

  const handleRowClick = (record) => {
    openEditDrawer(record);
  };

  return {
    drawerVisible,
    drawerMode,
    editingRequestType,
    openCreateDrawer,
    openEditDrawer,
    closeDrawer,
    handleRowClick,
  };
};