/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback } from 'react';

interface UserFormData {
  username: string;
  password: string;
  role?: string;
  tags?: string[];
  enabledApis?: string[];
  showAdultContent?: boolean;
}

interface UserGroupData {
  name: string;
  description?: string;
  enabledApis?: string[];
  showAdultContent?: boolean;
}

/**
 * 用户管理数据Hook
 */
export function useUserData() {
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [showAddUserGroupForm, setShowAddUserGroupForm] = useState(false);
  const [showEditUserGroupForm, setShowEditUserGroupForm] = useState(false);

  const [newUser, setNewUser] = useState<UserFormData>({
    username: '',
    password: '',
    role: 'user',
    tags: [],
    enabledApis: [],
    showAdultContent: false
  });

  const [changePasswordUser, setChangePasswordUser] = useState({
    username: '',
    oldPassword: '',
    newPassword: ''
  });

  const [newUserGroup, setNewUserGroup] = useState<UserGroupData>({
    name: '',
    description: '',
    enabledApis: [],
    showAdultContent: false
  });

  const [editingUserGroup, setEditingUserGroup] = useState<{
    name: string;
    originalName: string;
    description?: string;
    enabledApis?: string[];
    showAdultContent?: boolean;
  }>({
    name: '',
    originalName: '',
    description: '',
    enabledApis: [],
    showAdultContent: false
  });

  const [showConfigureApisModal, setShowConfigureApisModal] = useState(false);
  const [configuringUser, setConfiguringUser] = useState<string | null>(null);

  // 重置表单数据
  const resetForms = useCallback(() => {
    setNewUser({
      username: '',
      password: '',
      role: 'user',
      tags: [],
      enabledApis: [],
      showAdultContent: false
    });
    setChangePasswordUser({
      username: '',
      oldPassword: '',
      newPassword: ''
    });
    setNewUserGroup({
      name: '',
      description: '',
      enabledApis: [],
      showAdultContent: false
    });
    setEditingUserGroup({
      name: '',
      originalName: '',
      description: '',
      enabledApis: [],
      showAdultContent: false
    });
    setConfiguringUser(null);
  }, []);

  // 关闭所有表单
  const closeAllForms = useCallback(() => {
    setShowAddUserForm(false);
    setShowChangePasswordForm(false);
    setShowAddUserGroupForm(false);
    setShowEditUserGroupForm(false);
    setShowConfigureApisModal(false);
    resetForms();
  }, [resetForms]);

  return {
    // 表单显示状态
    showAddUserForm,
    showChangePasswordForm,
    showAddUserGroupForm,
    showEditUserGroupForm,
    showConfigureApisModal,
    
    // 表单数据
    newUser,
    changePasswordUser,
    newUserGroup,
    editingUserGroup,
    configuringUser,
    
    // 设置函数
    setShowAddUserForm,
    setShowChangePasswordForm,
    setShowAddUserGroupForm,
    setShowEditUserGroupForm,
    setShowConfigureApisModal,
    setNewUser,
    setChangePasswordUser,
    setNewUserGroup,
    setEditingUserGroup,
    setConfiguringUser,
    
    // 工具函数
    resetForms,
    closeAllForms
  };
}