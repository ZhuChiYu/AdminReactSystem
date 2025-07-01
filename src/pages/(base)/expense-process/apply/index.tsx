import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
  UploadOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import type dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { expenseService } from '@/service/api';
import { fetchGetRoleList } from '@/service/api/system-manage';
import { isSuperAdmin } from '@/utils/auth';
import { localStg } from '@/utils/storage';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface ExpenseItem {
  amount: number;
  date: dayjs.Dayjs;
  description: string;
  itemName: string;
  itemType: string;
  key: string;
}

const expenseTypes = [
  { label: '差旅费', value: 'travel' },
  { label: '交通费', value: 'transportation' },
  { label: '住宿费', value: 'accommodation' },
  { label: '办公用品', value: 'office' },
  { label: '餐费', value: 'meal' },
  { label: '招待费', value: 'entertainment' },
  { label: '培训费', value: 'training' },
  { label: '通讯费', value: 'communication' },
  { label: '物业费', value: 'property' },
  { label: '其他', value: 'other' }
];

const Component: React.FC = () => {
  const [form] = Form.useForm();
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userDepartment, setUserDepartment] = useState<string>('');
  const navigate = useNavigate();
  const isUserSuperAdmin = isSuperAdmin();

  // 获取用户职务角色对应的部门信息
  const getUserDepartmentFromRole = async (): Promise<string> => {
    try {
      // 从localStg获取用户信息
      const userInfo = (localStg.get('userInfo') as any) || {};

      console.log('🔍 [报销申请] localStg中的完整userInfo:', userInfo);
      console.log('🔍 [报销申请] userInfo.roles 类型:', typeof userInfo.roles, userInfo.roles);

      if (!userInfo.roles || userInfo.roles.length === 0) {
        console.warn('⚠️ [报销申请] 用户没有分配角色，userInfo.roles:', userInfo.roles);
        return '未分配部门';
      }

      console.log('📡 [报销申请] 开始获取职务角色列表...');

      // 获取所有职务角色
      const roleResponse = await fetchGetRoleList({
        current: 1,
        roleType: 'position',
        size: 100
      });

      console.log('📡 [报销申请] 职务角色API响应:', roleResponse);

      if (!roleResponse?.records) {
        console.warn('⚠️ [报销申请] 获取职务角色列表失败，roleResponse:', roleResponse);
        return '未知部门';
      }

      console.log('🔍 [报销申请] 用户角色数组:', userInfo.roles);
      console.log('🔍 [报销申请] 用户角色类型:', typeof userInfo.roles[0]);
      console.log(`🔍 [报销申请] 职务角色列表 (共 ${roleResponse.records.length} 个):`);

      roleResponse.records.forEach((role: any) => {
        console.log(`  - ${role.roleName} (${role.roleCode}) - 部门: ${role.department}`);
      });

      // 查找用户的职务角色对应的部门
      for (const userRoleCode of userInfo.roles) {
        console.log(`🔍 [报销申请] 正在查找角色: ${userRoleCode}`);

        const matchedRole = roleResponse.records.find((role: any) => role.roleCode === userRoleCode);

        if (matchedRole) {
          console.log(`✅ [报销申请] 找到匹配的职务角色:`, matchedRole);

          if (matchedRole.department) {
            console.log(`🎯 [报销申请] 返回部门: ${matchedRole.department}`);
            return matchedRole.department;
          }
          console.warn(`⚠️ [报销申请] 角色 ${matchedRole.roleName} 没有设置部门`);
        } else {
          console.log(`❌ [报销申请] 未找到角色: ${userRoleCode}`);
        }
      }

      console.warn('⚠️ [报销申请] 未找到任何职务角色对应的部门');
      return '未分配部门';
    } catch (error) {
      console.error('❌ [报销申请] 获取用户部门失败:', error);
      return '未知部门';
    }
  };

  // 初始化表单默认值
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // 从localStg获取用户信息
        const userInfo = (localStg.get('userInfo') as any) || {};
        const currentUser = userInfo.nickName || userInfo.userName || '当前用户';

        // 获取用户部门信息
        const department = await getUserDepartmentFromRole();
        setUserDepartment(department);

        // 设置表单默认值
        form.setFieldsValue({
          applicant: currentUser,
          department
        });
      } catch (error) {
        console.error('初始化表单失败:', error);
        message.error('获取用户信息失败');

        // 设置默认值
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const currentUser = userInfo.nickName || userInfo.userName || '当前用户';

        form.setFieldsValue({
          applicant: currentUser,
          department: '未知部门'
        });
        setUserDepartment('未知部门');
      }
    };

    initializeForm();
  }, [form]);

  // 添加报销项目
  const handleAddItem = () => {
    form
      .validateFields(['itemName', 'itemType', 'itemAmount', 'itemDate', 'itemDescription'])
      .then(values => {
        // 检查必填字段
        if (!values.itemName) {
          message.error('请输入项目名称');
          return;
        }
        if (!values.itemType) {
          message.error('请选择报销类型');
          return;
        }
        if (!values.itemAmount) {
          message.error('请输入报销金额');
          return;
        }
        if (!values.itemDate) {
          message.error('请选择报销日期');
          return;
        }

        const newItem: ExpenseItem = {
          amount: values.itemAmount,
          date: values.itemDate,
          description: values.itemDescription || '',
          itemName: values.itemName,
          itemType: values.itemType,
          key: Date.now().toString()
        };

        setExpenseItems([...expenseItems, newItem]);

        // 清空表单项目部分
        form.setFieldsValue({
          itemAmount: undefined,
          itemDate: null,
          itemDescription: '',
          itemName: '',
          itemType: undefined
        });

        message.success('报销项目添加成功');
      })
      .catch(error => {
        console.error('表单验证失败:', error);
      });
  };

  // 删除报销项目
  const handleDeleteItem = (key: string) => {
    setExpenseItems(expenseItems.filter(item => item.key !== key));
  };

  // 上传文件改变
  const handleFileChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 预览提交内容
  const handlePreview = () => {
    form
      .validateFields()
      .then(values => {
        const data = {
          ...values,
          invoices: fileList,
          items: expenseItems,
          totalAmount: expenseItems.reduce((sum, item) => sum + item.amount, 0)
        };
        setPreviewData(data);
        setPreviewOpen(true);
      })
      .catch(() => {
        message.error('请填写完整的报销信息');
      });
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    try {
      const values = form.getFieldsValue();

      // 检查基本信息
      if (!values.title) {
        message.error('请填写报销标题');
        return;
      }

      if (expenseItems.length === 0) {
        message.error('请至少添加一个报销项目');
        return;
      }

      setSaving(true);

      const draftData = {
        applicationReason: values.title,
        expensePeriodEnd: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        expensePeriodStart: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        expenseType: expenseItems.length > 0 ? expenseItems[0].itemType : '其他',
        // 草稿状态特殊标记
        isDraft: true,
        items: expenseItems.map(item => ({
          amount: item.amount,
          description: item.description,
          expenseDate: item.date.format('YYYY-MM-DD'),
          itemName: item.itemName,
          itemType: item.itemType
        })),
        remark: values.remarks || ''
      };

      // 保存到localStorage作为草稿
      const drafts = JSON.parse(localStorage.getItem('expenseDrafts') || '[]');
      const newDraft = {
        id: Date.now(),
        ...draftData,
        createdAt: new Date().toISOString(),
        title: values.title,
        totalAmount: expenseItems.reduce((sum, item) => sum + item.amount, 0)
      };
      drafts.push(newDraft);
      localStorage.setItem('expenseDrafts', JSON.stringify(drafts));

      message.success('草稿保存成功');
    } catch (error) {
      console.error('保存草稿失败:', error);
      message.error('保存草稿失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    Modal.confirm({
      cancelText: '取消',
      content: '确定要重置表单吗？所有填写的内容将被清空。',
      okText: '确认',
      onOk: async () => {
        form.resetFields();
        setExpenseItems([]);
        setFileList([]);

        // 重新设置默认值
        const userInfo = (localStg.get('userInfo') as any) || {};
        const currentUser = userInfo.nickName || userInfo.userName || '当前用户';

        form.setFieldsValue({
          applicant: currentUser,
          department: userDepartment
        });

        message.success('表单重置成功');
      },
      title: '确认重置'
    });
  };

  // 上传附件的辅助函数
  const uploadAttachments = async (applicationId: number) => {
    if (fileList.length === 0) return;

    message.info('正在上传附件...');

    const uploadPromises = fileList
      .filter(file => file.originFileObj)
      .map(async file => {
        try {
          await expenseService.uploadExpenseAttachment(applicationId, file.originFileObj!, file.name);
        } catch (uploadError) {
          console.error('上传附件失败:', uploadError);
          message.warning(`附件 ${file.name} 上传失败，但申请已提交成功`);
        }
      });

    await Promise.all(uploadPromises);
  };

  // 提交申请
  const handleSubmit = async (values: any) => {
    if (expenseItems.length === 0) {
      message.error('请至少添加一个报销项目');
      return;
    }

    setSubmitting(true);

    try {
      // 构造API请求数据
      const expenseData = {
        applicationReason: values.title,
        expensePeriodEnd: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        expensePeriodStart: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        expenseType: expenseItems.length > 0 ? expenseItems[0].itemType : '其他',
        items: expenseItems.map(item => ({
          amount: item.amount,
          description: item.description,
          expenseDate: item.date.format('YYYY-MM-DD'),
          itemName: item.itemName,
          itemType: item.itemType
        })),
        remark: values.remarks
      };

      // 调用API提交费用申请
      const result = await expenseService.createExpense(expenseData);
      const applicationId = result.id;

      if (!applicationId || typeof applicationId !== 'number') {
        console.error('创建申请响应数据:', result);
        throw new Error('创建申请失败，未获取到申请ID');
      }

      // 上传附件
      await uploadAttachments(applicationId);

      message.success('报销申请提交成功，已通知超级管理员审核');

      // 提交成功后清空表单
      form.resetFields();
      setExpenseItems([]);
      setFileList([]);
    } catch (error) {
      message.error('提交报销申请失败');
      console.error('提交报销申请失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'itemName',
      key: 'itemName',
      title: '报销项目'
    },
    {
      dataIndex: 'itemType',
      key: 'itemType',
      render: (type: string) => {
        const item = expenseTypes.find(t => t.value === type);
        return item ? item.label : type;
      },
      title: '报销类型'
    },
    {
      dataIndex: 'amount',
      key: 'amount',
      title: '金额(元)'
    },
    {
      dataIndex: 'date',
      key: 'date',
      render: (date: dayjs.Dayjs) => date.format('YYYY-MM-DD'),
      title: '日期'
    },
    {
      dataIndex: 'description',
      ellipsis: true,
      key: 'description',
      title: '说明'
    },
    {
      key: 'action',
      render: (_: any, record: ExpenseItem) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          type="link"
          onClick={() => handleDeleteItem(record.key)}
        >
          删除
        </Button>
      ),
      title: '操作'
    }
  ];

  const totalAmount = expenseItems.reduce((sum, item) => sum + item.amount, 0);

  // 跳转到审核页面 (仅超级管理员可见)
  const handleGoToApprove = () => {
    navigate('/expense-process/approve');
  };

  return (
    <div className="p-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Title level={4}>报销申请</Title>
          {isUserSuperAdmin && (
            <Button
              type="primary"
              onClick={handleGoToApprove}
            >
              查看待审批报销
            </Button>
          )}
        </div>

        <Form
          autoComplete="off"
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              label="报销标题"
              name="title"
              rules={[{ message: '请输入报销标题', required: true }]}
            >
              <Input placeholder="请输入报销标题" />
            </Form.Item>

            <Form.Item
              label="所属部门"
              name="department"
            >
              <Input
                disabled
                placeholder="自动获取"
                style={{
                  backgroundColor: '#f0f0f0',
                  cursor: 'not-allowed'
                }}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              label="申请人"
              name="applicant"
              rules={[{ message: '请输入申请人姓名', required: true }]}
            >
              <Input placeholder="请输入申请人姓名" />
            </Form.Item>

            <Form.Item
              label="报销时间范围"
              name="dateRange"
              rules={[{ message: '请选择报销时间范围', required: true }]}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Divider orientation="left">报销项目</Divider>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              label="项目名称"
              name="itemName"
            >
              <Input placeholder="请输入报销项目名称" />
            </Form.Item>

            <Form.Item
              label="报销类型"
              name="itemType"
            >
              <Select
                options={expenseTypes}
                placeholder="请选择报销类型"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              label="报销金额"
              name="itemAmount"
            >
              <InputNumber
                addonAfter="元"
                min={0}
                placeholder="请输入报销金额"
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="报销日期"
              name="itemDate"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            label="报销说明"
            name="itemDescription"
          >
            <TextArea
              placeholder="请详细描述报销项目的原因和用途"
              rows={2}
            />
          </Form.Item>

          <Form.Item>
            <Button
              block
              icon={<PlusOutlined />}
              type="dashed"
              onClick={handleAddItem}
            >
              添加报销项目
            </Button>
          </Form.Item>

          {expenseItems.length > 0 && (
            <>
              <Table
                columns={columns}
                dataSource={expenseItems}
                pagination={false}
                size="small"
                footer={() => (
                  <div className="text-right">
                    <Text strong>报销总金额：</Text>
                    <Text
                      strong
                      type="danger"
                    >
                      {totalAmount.toFixed(2)} 元
                    </Text>
                  </div>
                )}
              />
              <div className="h-4" />
            </>
          )}

          <Divider orientation="left">发票凭证</Divider>

          <Form.Item
            extra="支持的文件格式：jpg、jpeg、png、pdf，单个文件不超过5MB"
            label="上传发票/凭证"
            name="invoices"
          >
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              listType="picture"
              maxCount={10}
              onChange={handleFileChange}
            >
              <Button icon={<UploadOutlined />}>上传发票/凭证</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="备注说明"
            name="remarks"
          >
            <TextArea
              placeholder="请输入其他补充说明（选填）"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                htmlType="submit"
                icon={<SendOutlined />}
                loading={submitting}
                type="primary"
              >
                提交申请
              </Button>
              <Button
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSaveDraft}
              >
                保存草稿
              </Button>
              <Button
                icon={<EyeOutlined />}
                onClick={handlePreview}
              >
                预览
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 预览弹窗 */}
      <Modal
        open={previewOpen}
        title="报销申请预览"
        width={700}
        footer={[
          <Button
            key="close"
            onClick={() => setPreviewOpen(false)}
          >
            关闭
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              setPreviewOpen(false);
              form.submit();
            }}
          >
            确认提交
          </Button>
        ]}
        onCancel={() => setPreviewOpen(false)}
      >
        {previewData && (
          <div>
            <div className="mb-4">
              <div className="flex justify-between">
                <Title level={5}>{previewData.title}</Title>
                <Tag color="blue">{userDepartment}</Tag>
              </div>
              <div>
                <Text type="secondary">申请人：{previewData.applicant}</Text>
                <Text
                  className="ml-4"
                  type="secondary"
                >
                  报销时间范围：{previewData.dateRange?.[0]?.format('YYYY-MM-DD')} 至{' '}
                  {previewData.dateRange?.[1]?.format('YYYY-MM-DD')}
                </Text>
              </div>
            </div>

            <Divider orientation="left">报销项目</Divider>
            <Table
              columns={columns.filter(col => col.key !== 'action')}
              dataSource={previewData.items}
              pagination={false}
              size="small"
              footer={() => (
                <div className="text-right">
                  <Text strong>报销总金额：</Text>
                  <Text
                    strong
                    type="danger"
                  >
                    {previewData.totalAmount?.toFixed(2)} 元
                  </Text>
                </div>
              )}
            />

            <Divider orientation="left">发票凭证</Divider>
            <div className="mb-4">
              {previewData.invoices && previewData.invoices.length > 0 ? (
                previewData.invoices.map((file: any) => <Tag key={file.uid || file.name}>{file.name}</Tag>)
              ) : (
                <Text type="secondary">未上传发票/凭证</Text>
              )}
            </div>

            {previewData.remarks && (
              <>
                <Divider orientation="left">备注说明</Divider>
                <Text>{previewData.remarks}</Text>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Component;
