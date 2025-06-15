import {
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  SyncOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Radio,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import React, { useEffect, useState } from 'react';

import { expenseService } from '@/service/api';
import type { ExpenseApi } from '@/service/api/types';
import { isSuperAdmin } from '@/utils/auth';
import { getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface ExpenseItem {
  amount: number;
  applicant: string;
  applicationDate: string;
  approvalDate?: string;
  approver?: string;
  attachments?: Array<{
    description?: string;
    downloadUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    id: string;
    originalName: string;
    uploadTime: string;
  }>;
  comment?: string;
  department: string;
  description: string;
  expenseType: string;
  id: number;
  status: number;
}

const Component: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<ExpenseItem | null>(null);
  const [form] = Form.useForm();
  const [expenseData, setExpenseData] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 检查用户是否为超级管理员
  const isUserSuperAdmin = isSuperAdmin();

  // 获取费用申请列表
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await expenseService.getExpenseList({
        current: 1,
        size: 1000,
        status: 0 // 只获取待审批的申请
      });

      if (!response) {
        setExpenseData([]);
        return;
      }

      // 检查 records 是否存在（由于expenseService已经解包了data部分）
      if (!(response as any).records || !Array.isArray((response as any).records)) {
        setExpenseData([]);
        return;
      }

      // 转换API数据格式
      const formattedExpenses: ExpenseItem[] = (response as any).records.map((expense: ExpenseApi.ExpenseListItem) => ({
        amount: expense.amount || 0,
        applicant: expense.applicant?.name || '未知用户',
        applicationDate: expense.applicationTime || '',
        approvalDate: expense.approvalTime || '',
        approver: expense.approver?.name || '',
        comment: expense.remark || '',
        department: expense.department || '未知部门',
        description: expense.description || '',
        expenseType: expense.expenseType || '未知类型',
        id: expense.id,
        status: expense.status || 0
      }));

      setExpenseData(formattedExpenses);
    } catch (error) {
      console.error('获取费用申请列表失败:', error);
      setExpenseData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 只有超级管理员才获取数据
    if (isUserSuperAdmin) {
      fetchExpenses();
    }
  }, [isUserSuperAdmin]);

  // 如果不是超级管理员，显示提示信息
  if (!isUserSuperAdmin) {
    return (
      <Card>
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <Text type="secondary">您没有权限访问此页面，只有超级管理员可以审批报销申请。</Text>
        </div>
      </Card>
    );
  }

  const showApprovalModal = async (record: ExpenseItem) => {
    try {
      // 获取完整的费用申请详情，包括附件
      const detail = (await expenseService.getExpenseDetail(record.id)) as unknown as ExpenseApi.ExpenseListItem;

      // 转换详情数据格式 - detail已经包含附件信息
      const formattedDetail: ExpenseItem = {
        amount: detail.amount || 0,
        applicant: detail.applicant?.name || '未知用户',
        applicationDate: detail.applicationTime || '',
        approvalDate: detail.approvalTime || '',
        approver: detail.approver?.name || '',
        attachments: Array.isArray(detail.attachments)
          ? detail.attachments.map((att: any) => ({
              description: att.description || '',
              downloadUrl: att.downloadUrl || att.fileUrl || '',
              fileName: att.fileName || '',
              fileSize: att.fileSize || 0,
              fileType: att.fileType || '',
              id: att.id?.toString() || '',
              originalName: att.originalName || att.fileName || '',
              uploadTime: att.uploadTime || ''
            }))
          : [],
        comment: detail.remark || '',
        department: detail.department || '未知部门',
        description: detail.description || '',
        expenseType: detail.expenseType || '未知类型',
        id: detail.id,
        status: detail.status || 0
      };

      setCurrentExpense(formattedDetail);
      form.resetFields();
      setVisible(true);
    } catch (error) {
      console.error('获取费用申请详情失败:', error);
      message.error('获取详情失败');
    }
  };

  const showDetailModal = async (record: ExpenseItem) => {
    try {
      // 获取完整的费用申请详情，包括附件
      const detail = (await expenseService.getExpenseDetail(record.id)) as unknown as ExpenseApi.ExpenseListItem;

      // 转换详情数据格式 - detail已经包含附件信息
      const formattedDetail: ExpenseItem = {
        amount: detail.amount || 0,
        applicant: detail.applicant?.name || '未知用户',
        applicationDate: detail.applicationTime || '',
        approvalDate: detail.approvalTime || '',
        approver: detail.approver?.name || '',
        attachments: Array.isArray(detail.attachments)
          ? detail.attachments.map((att: any) => ({
              description: att.description || '',
              downloadUrl: att.downloadUrl || att.fileUrl || '',
              fileName: att.fileName || '',
              fileSize: att.fileSize || 0,
              fileType: att.fileType || '',
              id: att.id?.toString() || '',
              originalName: att.originalName || att.fileName || '',
              uploadTime: att.uploadTime || ''
            }))
          : [],
        comment: detail.remark || '',
        department: detail.department || '未知部门',
        description: detail.description || '',
        expenseType: detail.expenseType || '未知类型',
        id: detail.id,
        status: detail.status || 0
      };

      setCurrentExpense(formattedDetail);
      setDetailVisible(true);
    } catch (error) {
      console.error('获取费用申请详情失败:', error);
      message.error('获取详情失败');
    }
  };

  // 下载附件
  const handleDownloadAttachment = async (expenseId: number, fileName: string, originalName: string) => {
    try {
      const response = await expenseService.downloadExpenseAttachment(expenseId, fileName);

      // 创建下载链接
      const blob = new Blob([response]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('下载成功');
    } catch (error) {
      console.error('下载附件失败:', error);
      message.error('下载失败');
    }
  };

  const handleApprove = async () => {
    try {
      const values = await form.validateFields();

      if (currentExpense) {
        // 修正状态值：1表示通过，2表示拒绝
        const approvalStatus = values.approval === 1 ? 1 : 2;

        await expenseService.approveExpense(currentExpense.id, {
          remark: values.comment,
          status: approvalStatus
        });

        message.success('审批完成');
        setVisible(false);
        fetchExpenses(); // 重新获取列表
      }
    } catch (error) {
      message.error('审批失败');
      console.error('费用审批失败:', error);
    }
  };

  // 查看详情
  const handleView = (record: ExpenseItem) => {
    showDetailModal(record);
  };

  // 审批点击
  const handleApproveClick = (record: ExpenseItem) => {
    showApprovalModal(record);
  };

  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      ...getCenterColumnConfig(),
      title: '申请编号',
      width: 100
    },
    {
      dataIndex: 'applicant',
      key: 'applicant',
      ...getCenterColumnConfig(),
      render: (text: string) => <Text strong>{text}</Text>,
      title: '申请人'
    },
    {
      dataIndex: 'department',
      key: 'department',
      ...getCenterColumnConfig(),
      title: '部门'
    },
    {
      dataIndex: 'expenseType',
      key: 'expenseType',
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
      },
      title: '费用类型'
    },
    {
      dataIndex: 'amount',
      key: 'amount',
      ...getCenterColumnConfig(),
      render: (amount: number) => `¥${amount.toFixed(2)}`,
      title: '费用金额'
    },
    {
      dataIndex: 'applicationDate',
      key: 'applicationDate',
      ...getCenterColumnConfig(),
      render: (date: string) => {
        try {
          return new Date(date).toLocaleDateString('zh-CN');
        } catch {
          return date || '-';
        }
      },
      title: '申请日期'
    },
    {
      dataIndex: 'status',
      key: 'status',
      ...getCenterColumnConfig(),
      render: (status: number) => {
        if (status === 0) {
          return (
            <Badge
              status="processing"
              text="待审批"
            />
          );
        } else if (status === 1) {
          return (
            <Badge
              status="success"
              text="已通过"
            />
          );
        } else if (status === 2) {
          return (
            <Badge
              status="error"
              text="已拒绝"
            />
          );
        }
        return (
          <Badge
            status="default"
            text="未知状态"
          />
        );
      },
      title: '状态'
    },
    {
      fixed: 'right' as const,
      key: 'actions',
      render: (record: ExpenseItem) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            type="link"
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {record.status === 0 && (
            <Button
              icon={<CheckOutlined />}
              size="small"
              type="link"
              onClick={() => handleApproveClick(record)}
            >
              审批
            </Button>
          )}
        </Space>
      ),
      title: '操作',
      width: 150
    }
  ];

  return (
    <div className="p-4">
      <Card>
        <div className="mb-4">
          <Title level={4}>费用审批</Title>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              icon={<SyncOutlined />}
              onClick={fetchExpenses}
            >
              刷新
            </Button>
          </Space>
        </div>
        <Table<ExpenseItem>
          columns={columns}
          dataSource={expenseData}
          loading={loading}
          rowKey="id"
          locale={{
            emptyText: expenseData.length === 0 && !loading ? '暂无待审批的申请' : undefined
          }}
          {...getFullTableConfig(10)}
        />
      </Card>

      {/* 审批弹窗 */}
      <Modal
        destroyOnClose
        open={visible}
        title="费用审批"
        width={600}
        onCancel={() => setVisible(false)}
        onOk={handleApprove}
      >
        {currentExpense && (
          <div>
            <Descriptions
              bordered
              column={2}
              title="费用详情"
            >
              <Descriptions.Item label="申请人">
                <Space>
                  <UserOutlined />
                  {currentExpense.applicant}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="部门">{currentExpense.department}</Descriptions.Item>
              <Descriptions.Item label="费用类型">
                <Tag color="blue">
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
                    return typeMap[currentExpense.expenseType] || currentExpense.expenseType;
                  })()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请金额">
                <Space>
                  <DollarOutlined style={{ color: '#f50' }} />
                  <Text
                    strong
                    style={{ color: '#f50' }}
                  >
                    ¥{currentExpense.amount.toFixed(2)}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item
                label="申请时间"
                span={2}
              >
                <Space>
                  <CalendarOutlined />
                  {(() => {
                    try {
                      return new Date(currentExpense.applicationDate).toLocaleDateString('zh-CN', {
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      });
                    } catch {
                      return currentExpense.applicationDate || '-';
                    }
                  })()}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item
                label="费用说明"
                span={2}
              >
                <Space>
                  <FileTextOutlined />
                  {currentExpense.description || '暂无说明'}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            {/* 附件列表 */}
            {currentExpense.attachments && currentExpense.attachments.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>
                  <PaperClipOutlined /> 相关附件
                </Text>
                <div style={{ marginTop: 8 }}>
                  {currentExpense.attachments.map((attachment, index) => (
                    <div
                      key={attachment.id || index}
                      style={{
                        alignItems: 'center',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        padding: '8px 12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{attachment.originalName}</div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          {attachment.fileType} • {(attachment.fileSize / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <Button
                        icon={<DownloadOutlined />}
                        size="small"
                        type="link"
                        onClick={() =>
                          handleDownloadAttachment(currentExpense.id, attachment.fileName, attachment.originalName)
                        }
                      >
                        下载
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Form
              form={form}
              layout="vertical"
              style={{ marginTop: 24 }}
            >
              <Form.Item
                label="审批决定"
                name="approval"
                rules={[{ message: '请选择审批结果', required: true }]}
              >
                <Radio.Group>
                  <Radio value={1}>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    &nbsp;同意
                  </Radio>
                  <Radio value={2}>
                    <CloseCircleOutlined style={{ color: '#f5222d' }} />
                    &nbsp;拒绝
                  </Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="审批意见"
                name="comment"
              >
                <TextArea
                  placeholder="请输入审批意见（可选）"
                  rows={4}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        destroyOnClose
        footer={null}
        open={detailVisible}
        title="费用详情"
        width={700}
        onCancel={() => setDetailVisible(false)}
      >
        {currentExpense && (
          <div>
            <Descriptions
              bordered
              column={2}
            >
              <Descriptions.Item label="申请编号">{currentExpense.id}</Descriptions.Item>
              <Descriptions.Item label="申请人">
                <Space>
                  <UserOutlined />
                  {currentExpense.applicant}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="部门">{currentExpense.department}</Descriptions.Item>
              <Descriptions.Item label="费用类型">
                <Tag color="blue">
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
                    return typeMap[currentExpense.expenseType] || currentExpense.expenseType;
                  })()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请金额">
                <Space>
                  <DollarOutlined style={{ color: '#f50' }} />
                  <Text
                    strong
                    style={{ color: '#f50' }}
                  >
                    ¥{currentExpense.amount.toFixed(2)}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                <Space>
                  <CalendarOutlined />
                  {(() => {
                    try {
                      return new Date(currentExpense.applicationDate).toLocaleDateString('zh-CN', {
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      });
                    } catch {
                      return currentExpense.applicationDate || '-';
                    }
                  })()}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item
                label="费用说明"
                span={2}
              >
                <Space>
                  <FileTextOutlined />
                  {currentExpense.description || '暂无说明'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="审批状态">
                {currentExpense.status === 0 && (
                  <Badge
                    status="processing"
                    text="待审批"
                  />
                )}
                {currentExpense.status === 1 && (
                  <Badge
                    status="success"
                    text="已通过"
                  />
                )}
                {currentExpense.status === 2 && (
                  <Badge
                    status="error"
                    text="已拒绝"
                  />
                )}
              </Descriptions.Item>
              {currentExpense.approver && (
                <Descriptions.Item label="审批人">{currentExpense.approver}</Descriptions.Item>
              )}
              {currentExpense.approvalDate && (
                <Descriptions.Item
                  label="审批时间"
                  span={2}
                >
                  <Space>
                    <CalendarOutlined />
                    {(() => {
                      try {
                        return new Date(currentExpense.approvalDate).toLocaleDateString('zh-CN', {
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                      } catch {
                        return currentExpense.approvalDate || '-';
                      }
                    })()}
                  </Space>
                </Descriptions.Item>
              )}
              {currentExpense.comment && (
                <Descriptions.Item
                  label="审批意见"
                  span={2}
                >
                  {currentExpense.comment}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* 附件列表 */}
            {currentExpense.attachments && currentExpense.attachments.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Text strong>
                  <PaperClipOutlined /> 相关附件
                </Text>
                <div style={{ marginTop: 12 }}>
                  {currentExpense.attachments.map((attachment, index) => (
                    <div
                      key={attachment.id || index}
                      style={{
                        alignItems: 'center',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        padding: '8px 12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{attachment.originalName}</div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          {attachment.fileType} • {(attachment.fileSize / 1024).toFixed(1)} KB
                          {attachment.uploadTime && ` • ${new Date(attachment.uploadTime).toLocaleString('zh-CN')}`}
                        </div>
                        {attachment.description && (
                          <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                            {attachment.description}
                          </div>
                        )}
                      </div>
                      <Button
                        icon={<DownloadOutlined />}
                        size="small"
                        type="link"
                        onClick={() =>
                          handleDownloadAttachment(currentExpense.id, attachment.fileName, attachment.originalName)
                        }
                      >
                        下载
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Component;
