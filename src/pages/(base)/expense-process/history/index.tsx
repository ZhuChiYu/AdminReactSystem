import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  SendOutlined
} from '@ant-design/icons';
import { Button, Card, Descriptions, Modal, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { expenseService } from '@/service/api';
import { isSuperAdmin } from '@/utils/auth';
import { getDisplayFileName } from '@/utils/encoding';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

const { Text, Title } = Typography;

interface HistoryItem {
  applicationNo?: string;
  approvalTime?: string;
  attachments?: Array<{
    description?: string;
    downloadUrl?: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    id: string;
    originalName: string;
    uploadTime: string;
  }>;
  createdAt: string;
  expenseType: string;
  id: number;
  isDraft?: boolean;
  status: number;
  title: string;
  totalAmount: number;
}

const Component: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const navigate = useNavigate();

  // 检查权限 - 移除这个检查，因为员工也应该能查看自己的申请历史

  // 获取申请历史
  const fetchHistory = async () => {
    setLoading(true);
    try {
      // 获取已提交的申请
      const submittedResponse = await expenseService.getExpenseList({
        current: 1,
        size: 1000
      });

      console.log('API响应:', submittedResponse);

      let submittedItems: HistoryItem[] = [];

      // 检查API响应格式
      if (
        submittedResponse &&
        (submittedResponse as any).records &&
        Array.isArray((submittedResponse as any).records)
      ) {
        submittedItems = (submittedResponse as any).records.map((item: any) => ({
          applicationNo: item.applicationNo || `APP${item.id}`,
          approvalTime: item.approvalTime,
          createdAt: item.applicationTime,
          expenseType: item.expenseType,
          id: item.id,
          isDraft: false,
          status: item.status,
          title: item.description || item.applicationReason || '报销申请',
          totalAmount: item.amount || 0
        }));
      } else {
        console.warn('API响应格式不正确或无数据:', submittedResponse);
      }

      // 获取草稿
      const drafts = JSON.parse(localStorage.getItem('expenseDrafts') || '[]');
      const draftItems: HistoryItem[] = drafts.map((draft: any) => ({
        // 草稿状态
        createdAt: draft.createdAt,
        expenseType: draft.expenseType,
        id: draft.id,
        isDraft: true,
        status: -1,
        title: draft.title,
        totalAmount: draft.totalAmount
      }));

      // 合并数据并按创建时间排序
      const allItems = [...submittedItems, ...draftItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setHistoryData(allItems);
    } catch (err) {
      console.error('获取申请历史失败:', err);
      message.error('获取申请历史失败');
      // 设置空数组避免页面崩溃
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 查看详情
  const handleViewDetail = async (record: HistoryItem) => {
    if (record.isDraft) {
      // 从localStorage获取草稿详情
      const drafts = JSON.parse(localStorage.getItem('expenseDrafts') || '[]');
      const draft = drafts.find((d: any) => d.id === record.id);
      setCurrentItem(draft);
    } else {
      // 从API获取详情，包括附件
      try {
        const detail = (await expenseService.getExpenseDetail(record.id)) as unknown as any;

        // 详情API已经包含了附件信息，不需要单独获取
        setCurrentItem({
          ...detail,
          attachments: detail.attachments || []
        });
      } catch {
        message.error('获取详情失败');
        return;
      }
    }
    setDetailVisible(true);
  };

  // 删除草稿
  const handleDeleteDraft = (record: HistoryItem) => {
    const drafts = JSON.parse(localStorage.getItem('expenseDrafts') || '[]');
    const updatedDrafts = drafts.filter((d: any) => d.id !== record.id);
    localStorage.setItem('expenseDrafts', JSON.stringify(updatedDrafts));
    message.success('草稿删除成功');
    fetchHistory();
  };

  // 提交草稿
  const handleSubmitDraft = async (record: HistoryItem) => {
    try {
      const drafts = JSON.parse(localStorage.getItem('expenseDrafts') || '[]');
      const draft = drafts.find((d: any) => d.id === record.id);

      if (!draft) {
        message.error('草稿不存在');
        return;
      }

      // 提交草稿
      await expenseService.createExpense({
        applicationReason: draft.applicationReason,
        expensePeriodEnd: draft.expensePeriodEnd,
        expensePeriodStart: draft.expensePeriodStart,
        expenseType: draft.expenseType,
        items: draft.items,
        remark: draft.remark
      });

      // 删除草稿
      handleDeleteDraft(record);
      message.success('草稿提交成功');
      fetchHistory();
    } catch (err) {
      console.error('提交草稿失败:', err);
      message.error('提交草稿失败');
    }
  };

  // 下载附件
  const handleDownloadAttachment = async (expenseId: number, fileName: string, originalName?: string) => {
    try {
      const response = await expenseService.downloadExpenseAttachment(expenseId, fileName);

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.download = getDisplayFileName(originalName, fileName); // 使用修复后的文件名
      document.body.appendChild(link);
      link.click();

      // 清理
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      message.success('文件下载成功');
    } catch (error) {
      console.error('下载附件失败:', error);
      message.error('下载附件失败');
    }
  };

  // 获取状态标签
  const getStatusTag = (status: number, isDraft?: boolean) => {
    if (isDraft) {
      return <Tag color="orange">草稿</Tag>;
    }

    switch (status) {
      case 0:
        return <Tag color="processing">待审批</Tag>;
      case 1:
        return <Tag color="success">已通过</Tag>;
      case 2:
        return <Tag color="error">已拒绝</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  const columns: ColumnsType<HistoryItem> = [
    {
      dataIndex: 'title',
      key: 'title',
      title: '申请标题',
      ...getCenterColumnConfig(),
      render: (text: string, record: HistoryItem) => (
        <Space>
          <FileTextOutlined />
          <Text strong={record.isDraft}>{text || '报销申请'}</Text>
        </Space>
      )
    },
    {
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      title: '申请编号',
      ...getCenterColumnConfig(),
      render: (text: string, record: HistoryItem) => (record.isDraft ? <Text type="secondary">草稿</Text> : text)
    },
    {
      dataIndex: 'expenseType',
      key: 'expenseType',
      title: '费用类型',
      ...getCenterColumnConfig(),
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          accommodation: '住宿费',
          communication: '通讯费',
          entertainment: '招待费',
          meal: '餐费',
          medical: '医疗费',
          office: '办公用品',
          other: '其他',
          property: '物业费',
          training: '培训费',
          transportation: '交通费',
          travel: '差旅费'
        };
        return typeMap[type] || type;
      }
    },
    {
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      title: '申请金额',
      ...getCenterColumnConfig(),
      render: (amount: number) => {
        const validAmount = amount || 0;
        return <Text style={{ color: '#f50', fontWeight: 'bold' }}>¥{validAmount.toFixed(2)}</Text>;
      }
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: '状态',
      ...getCenterColumnConfig(),
      render: (status: number, record: HistoryItem) => getStatusTag(status, record.isDraft)
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      title: '创建时间',
      ...getCenterColumnConfig(),
      render: (time: string) => {
        if (!time) return '-';
        try {
          return new Date(time).toLocaleString('zh-CN', {
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        } catch {
          return time;
        }
      }
    },
    {
      key: 'action',
      title: '操作',
      ...getActionColumnConfig(160),
      render: (_: any, record: HistoryItem) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            size="small"
            type="link"
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.isDraft && (
            <>
              <Button
                icon={<SendOutlined />}
                size="small"
                type="link"
                onClick={() => handleSubmitDraft(record)}
              >
                提交
              </Button>
              <Popconfirm
                cancelText="取消"
                okText="确定"
                title="确定删除这个草稿吗？"
                onConfirm={() => handleDeleteDraft(record)}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  type="link"
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Title level={4}>{isSuperAdmin() ? '申请历史（全部）' : '我的申请历史'}</Title>
          <Button
            type="primary"
            onClick={() => navigate('/expense-process/apply')}
          >
            新建申请
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={historyData}
          loading={loading}
          rowKey="id"
          {...getFullTableConfig(10)}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        footer={null}
        open={detailVisible}
        title="申请详情"
        width={700}
        onCancel={() => setDetailVisible(false)}
      >
        {currentItem && (
          <Descriptions
            bordered
            column={2}
          >
            <Descriptions.Item
              label="申请标题"
              span={2}
            >
              {currentItem.title || currentItem.description || currentItem.applicationReason || '报销申请'}
            </Descriptions.Item>
            {!currentItem.isDraft && (
              <Descriptions.Item label="申请编号">{currentItem.applicationNo}</Descriptions.Item>
            )}
            <Descriptions.Item label="申请金额">
              <Text style={{ color: '#f50', fontWeight: 'bold' }}>
                ¥{(currentItem.totalAmount || currentItem.amount || 0).toFixed(2)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="费用类型">
              {(() => {
                const typeMap: Record<string, string> = {
                  accommodation: '住宿费',
                  communication: '通讯费',
                  entertainment: '招待费',
                  meal: '餐费',
                  medical: '医疗费',
                  office: '办公用品',
                  other: '其他',
                  property: '物业费',
                  training: '培训费',
                  transportation: '交通费',
                  travel: '差旅费'
                };
                return typeMap[currentItem.expenseType] || currentItem.expenseType;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(currentItem.status, currentItem.isDraft)}</Descriptions.Item>
            {currentItem.applicant && (
              <Descriptions.Item label="申请人">
                {currentItem.applicant.name}
                {currentItem.department && ` (${currentItem.department})`}
              </Descriptions.Item>
            )}
            {currentItem.approver && <Descriptions.Item label="审批人">{currentItem.approver.name}</Descriptions.Item>}
            {currentItem.approvalTime && (
              <Descriptions.Item label="审批时间">
                {new Date(currentItem.approvalTime).toLocaleString('zh-CN', {
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </Descriptions.Item>
            )}
            <Descriptions.Item
              label="创建时间"
              span={2}
            >
              {(() => {
                const timeField = currentItem.createdAt || currentItem.applicationTime;
                if (!timeField) return '-';
                try {
                  return new Date(timeField).toLocaleString('zh-CN', {
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                } catch {
                  return timeField;
                }
              })()}
            </Descriptions.Item>
            {(currentItem.remark || currentItem.description) && (
              <Descriptions.Item
                label="申请说明"
                span={2}
              >
                {currentItem.remark || currentItem.description}
              </Descriptions.Item>
            )}
            {currentItem.items && currentItem.items.length > 0 && (
              <Descriptions.Item
                label="费用明细"
                span={2}
              >
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {currentItem.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      style={{ background: '#f5f5f5', borderRadius: '4px', marginBottom: '8px', padding: '8px' }}
                    >
                      <Text strong>{item.itemName}</Text> - <Text style={{ color: '#f50' }}>¥{item.amount}</Text>
                      {item.description && (
                        <div>
                          <Text type="secondary">{item.description}</Text>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Descriptions.Item>
            )}
            {currentItem.attachments && currentItem.attachments.length > 0 && (
              <Descriptions.Item
                span={2}
                label={
                  <span>
                    <PaperClipOutlined /> 附件
                  </span>
                }
              >
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {currentItem.attachments.map((attachment: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        alignItems: 'center',
                        background: '#f5f5f5',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        padding: '8px'
                      }}
                    >
                      <div>
                        <Text strong>{getDisplayFileName(attachment.originalName, attachment.fileName)}</Text>
                        <div>
                          <Text type="secondary">大小: {(attachment.fileSize / 1024 / 1024).toFixed(2)}MB</Text>
                          {attachment.description && <Text type="secondary"> | {attachment.description}</Text>}
                        </div>
                      </div>
                      <Button
                        icon={<DownloadOutlined />}
                        size="small"
                        type="link"
                        onClick={() =>
                          handleDownloadAttachment(currentItem.id, attachment.fileName, attachment.originalName)
                        }
                      >
                        下载
                      </Button>
                    </div>
                  ))}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Component;
