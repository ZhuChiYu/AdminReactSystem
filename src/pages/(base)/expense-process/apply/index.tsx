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
  Steps,
  Table,
  Tag,
  Typography,
  Upload,
  message
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import type dayjs from 'dayjs';
import React, { useState } from 'react';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Step } = Steps;

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
  { label: '其他', value: 'other' }
];

const departments = [
  { label: '研发部', value: 'rd' },
  { label: '市场部', value: 'marketing' },
  { label: '销售部', value: 'sales' },
  { label: '财务部', value: 'finance' },
  { label: '人力资源部', value: 'hr' },
  { label: '行政部', value: 'admin' }
];

const approvers = [
  { label: '张经理', value: 'manager1' },
  { label: '李经理', value: 'manager2' },
  { label: '王总监', value: 'director1' },
  { label: '赵总监', value: 'director2' },
  { label: '财务主管', value: 'finance_manager' }
];

const Component: React.FC = () => {
  const [form] = Form.useForm();
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // 添加报销项目
  const handleAddItem = () => {
    form.validateFields().then(values => {
      const newItem: ExpenseItem = {
        amount: values.itemAmount,
        date: values.itemDate,
        description: values.itemDescription,
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
  const handleSaveDraft = () => {
    const draftData = {
      ...form.getFieldsValue(),
      invoices: fileList,
      items: expenseItems
    };
    console.log('保存草稿:', draftData);
    // 实际应用中，这里可以调用API保存到后端
    message.success('草稿保存成功');
  };

  // 提交申请
  const handleSubmit = (values: any) => {
    if (expenseItems.length === 0) {
      message.error('请至少添加一个报销项目');
      return;
    }

    setSubmitting(true);

    const submitData = {
      ...values,
      invoices: fileList.map(file => file.name),
      items: expenseItems,
      submitTime: new Date().toISOString(),
      totalAmount: expenseItems.reduce((sum, item) => sum + item.amount, 0)
    };

    console.log('提交的表单数据:', submitData);

    // 模拟提交
    setTimeout(() => {
      setSubmitting(false);
      message.success('报销申请提交成功');
      // 提交成功后清空表单
      form.resetFields();
      setExpenseItems([]);
      setFileList([]);
    }, 1500);
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

  return (
    <div className="p-4">
      <Card>
        <Title level={4}>报销申请</Title>
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
              rules={[{ message: '请选择所属部门', required: true }]}
            >
              <Select
                options={departments}
                placeholder="请选择所属部门"
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

          <Divider orientation="left">审批流程</Divider>

          <div className="mb-4">
            <Steps
              current={-1}
              size="small"
            >
              <Step
                description="填写报销信息"
                title="提交申请"
              />
              <Step
                description="部门主管审批"
                title="部门审批"
              />
              <Step
                description="财务部门审核"
                title="财务审核"
              />
              <Step
                description="总经理最终审批"
                title="总经理审批"
              />
              <Step
                description="财务部门支付"
                title="财务打款"
              />
            </Steps>
          </div>

          <Form.Item
            label="审批人"
            name="approvers"
            rules={[{ message: '请选择审批人', required: true }]}
          >
            <Select
              mode="multiple"
              options={approvers}
              placeholder="请选择审批人"
            />
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
              <Button htmlType="reset">重置</Button>
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
                <Tag color="blue">{departments.find(d => d.value === previewData.department)?.label}</Tag>
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
              {previewData.invoices.length > 0 ? (
                previewData.invoices.map((file: any) => <Tag key={file.uid || file.name}>{file.name}</Tag>)
              ) : (
                <Text type="secondary">未上传发票/凭证</Text>
              )}
            </div>

            <Divider orientation="left">审批人</Divider>
            <div>
              {previewData.approvers?.map((id: string) => (
                <Tag
                  color="green"
                  key={id}
                >
                  {approvers.find(a => a.value === id)?.label}
                </Tag>
              ))}
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
