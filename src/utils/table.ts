import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { courseService } from '@/service/api';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

// ... existing code ...

  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      ...getCenterColumnConfig(),
      title: '序号',
      width: 80
    },
    {
      dataIndex: 'name',
      key: 'name',
      ...getCenterColumnConfig(),
      title: '分类名称'
    },
    {
      dataIndex: 'description',
      key: 'description',
      ...getCenterColumnConfig(),
      render: (text: string) => text || '-',
      title: '描述'
    },
    {
      dataIndex: 'status',
      key: 'status',
      ...getCenterColumnConfig(),
      render: (status: string) => <Tag color={status === '启用' ? 'green' : 'red'}>{status}</Tag>,
      title: '状态'
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      ...getCenterColumnConfig(),
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      title: '创建时间'
    },
    {
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      ...getCenterColumnConfig(),
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      title: '更新时间'
    },
    {
      key: 'action',
      ...getActionColumnConfig(120),
      render: (_: any, record: CategoryItem) => (
        <Space>
          <Button
            type="link"
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            cancelText="取消"
            okText="确定"
            title="确定要删除这个分类吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              danger
              type="link"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
      title: '操作'
    }
  ];