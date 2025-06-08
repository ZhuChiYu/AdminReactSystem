import { InboxOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Upload,
  message
} from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import React, { useEffect, useState } from 'react';

import { customerService } from '@/service/api';
import type { CustomerApi } from '@/service/api/types';

const { Dragger } = Upload;
const { TextArea } = Input;

/** 客户跟进状态枚举 */
enum FollowUpStatus {
  ARRIVED = 'arrived',
  CONSULT = 'consult',
  EARLY_25 = 'early_25',
  EFFECTIVE_VISIT = 'effective_visit',
  NEW_DEVELOP = 'new_develop',
  NOT_ARRIVED = 'not_arrived',
  REGISTERED = 'registered',
  REJECTED = 'rejected',
  VIP = 'vip',
  WECHAT_ADDED = 'wechat_added'
}

/** 客户跟进状态名称 */
const followUpStatusNames: Record<FollowUpStatus, string> = {
  [FollowUpStatus.WECHAT_ADDED]: '已加微信',
  [FollowUpStatus.REJECTED]: '未通过',
  [FollowUpStatus.EARLY_25]: '早25客户',
  [FollowUpStatus.VIP]: '大客户',
  [FollowUpStatus.EFFECTIVE_VISIT]: '有效回访',
  [FollowUpStatus.CONSULT]: '咨询',
  [FollowUpStatus.REGISTERED]: '已报名',
  [FollowUpStatus.ARRIVED]: '已实到',
  [FollowUpStatus.NOT_ARRIVED]: '未实到',
  [FollowUpStatus.NEW_DEVELOP]: '新开发'
};

/** 客户跟进状态颜色 */
const followUpStatusColors: Record<FollowUpStatus, string> = {
  [FollowUpStatus.WECHAT_ADDED]: 'blue',
  [FollowUpStatus.REJECTED]: 'error',
  [FollowUpStatus.EARLY_25]: 'purple',
  [FollowUpStatus.VIP]: 'gold',
  [FollowUpStatus.EFFECTIVE_VISIT]: 'success',
  [FollowUpStatus.CONSULT]: 'cyan',
  [FollowUpStatus.REGISTERED]: 'success',
  [FollowUpStatus.ARRIVED]: 'green',
  [FollowUpStatus.NOT_ARRIVED]: 'orange',
  [FollowUpStatus.NEW_DEVELOP]: 'geekblue'
};

interface CustomerImportItem {
  company: string;
  createTime: string;
  followStatus: FollowUpStatus;
  followUp: string;
  id: number;
  mobile: string;
  name: string;
  phone: string;
  position: string;
}

/** 客户导入组件 */
const CustomerImport = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<CustomerImportItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('excel');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus | ''>('');
  const [manualForm] = Form.useForm();
  const [manualEntryList, setManualEntryList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);

  /** 文件上传属性配置 */
  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    beforeUpload: () => false, // 阻止自动上传
    fileList,
    maxCount: 1,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    onRemove: () => {
      setPreviewData([]);
    }
  };

  /** 预览Excel文件内容 */
  const handlePreview = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    setUploading(true);

    try {
      const file = fileList[0].originFileObj as File;

      // 动态导入xlsx库
      const XLSX = await import('xlsx');

      // 使用FileReader读取文件
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = e.target?.result;
          if (!data) {
            message.error('文件读取失败');
            setUploading(false);
            return;
          }

          // 使用xlsx库解析Excel
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // 转换为JSON数据
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length <= 1) {
            message.warning('Excel文件中没有数据行');
            setUploading(false);
            return;
          }

          // 跳过标题行，处理数据
          const dataRows = jsonData.slice(1);
          const previewItems: CustomerImportItem[] = [];

          dataRows.forEach((row: any[], index: number) => {
            if (row && !row.every(cell => !cell || cell.toString().trim() === '')) {
              // Excel列顺序：A=姓名, B=单位, C=职务, D=电话, E=手机, F=跟进, G=状态
              const item: CustomerImportItem = {
                // A列：姓名
                company: row[1]?.toString().trim() || '',
                // G列：状态
                createTime: new Date().toLocaleString(), // F列：跟进
                followStatus: mapStatusToEnum(row[6]?.toString().trim() || 'consult'), // E列：手机
                followUp: row[5]?.toString().trim() || '暂无跟进内容',
                id: index + 1, // D列：电话
                mobile: row[4]?.toString().trim() || '',
                name: row[0]?.toString().trim() || '', // C列：职务
                phone: row[3]?.toString().trim() || '', // B列：单位
                position: row[2]?.toString().trim() || ''
              };

              if (item.name || item.company) {
                // 至少有姓名或公司
                previewItems.push(item);
              }
            }
          });

          setPreviewData(previewItems);
          setUploading(false);
          message.success(`预览成功，共${previewItems.length}条记录`);
        } catch (error) {
          console.error('Excel解析失败:', error);
          message.error('Excel文件格式不正确或数据有误');
          setUploading(false);
        }
      };

      reader.onerror = () => {
        message.error('文件读取失败');
        setUploading(false);
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('预览失败:', error);
      message.error('预览失败');
      setUploading(false);
    }
  };

  /** 将字符串状态映射为枚举值 */
  const mapStatusToEnum = (status: string): FollowUpStatus => {
    const statusMap: Record<string, FollowUpStatus> = {
      arrived: FollowUpStatus.ARRIVED,
      // 英文状态映射
      consult: FollowUpStatus.CONSULT,
      early_25: FollowUpStatus.EARLY_25,
      effective_visit: FollowUpStatus.EFFECTIVE_VISIT,
      new_develop: FollowUpStatus.NEW_DEVELOP,
      not_arrived: FollowUpStatus.NOT_ARRIVED,
      registered: FollowUpStatus.REGISTERED,
      rejected: FollowUpStatus.REJECTED,
      vip: FollowUpStatus.VIP,
      wechat_added: FollowUpStatus.WECHAT_ADDED,
      // 中文状态映射
      咨询: FollowUpStatus.CONSULT,
      大客户: FollowUpStatus.VIP,
      已加微信: FollowUpStatus.WECHAT_ADDED,
      已实到: FollowUpStatus.ARRIVED,
      已报名: FollowUpStatus.REGISTERED,
      新开发: FollowUpStatus.NEW_DEVELOP,
      早25: FollowUpStatus.EARLY_25,
      早25客户: FollowUpStatus.EARLY_25,
      有效回访: FollowUpStatus.EFFECTIVE_VISIT,
      未实到: FollowUpStatus.NOT_ARRIVED,
      未通过: FollowUpStatus.REJECTED
    };

    return statusMap[status] || FollowUpStatus.CONSULT;
  };

  /** 导入Excel文件 */
  const handleImport = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj as File);

      // 调用实际的导入API
      const result = await customerService.importCustomers(formData);

      setUploading(false);

      // 显示导入结果
      if (result.successCount > 0) {
        message.success(`导入成功！成功导入 ${result.successCount} 条记录，失败 ${result.failureCount} 条`);
      } else {
        message.warning(`导入完成，但没有成功记录。失败 ${result.failureCount} 条`);
      }

      // 如果有错误信息，显示详细错误
      if (result.errors && result.errors.length > 0) {
        Modal.info({
          content: (
            <div>
              <p>成功：{result.successCount} 条</p>
              <p>失败：{result.failureCount} 条</p>
              {result.errors.length > 0 && (
                <div>
                  <p>错误详情：</p>
                  <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {result.errors.map((error, index) => (
                      <li
                        key={index}
                        style={{ color: 'red', fontSize: '12px' }}
                      >
                        {error}
                      </li>
                    ))}
                  </ul>
                  {result.hasMoreErrors && <p style={{ color: 'orange' }}>还有更多错误未显示...</p>}
                </div>
              )}
            </div>
          ),
          title: '导入详情',
          width: 600
        });
      }

      // 清空文件列表和预览数据
      setFileList([]);
      setPreviewData([]);
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败，请检查文件格式是否正确');
      setUploading(false);
    }
  };

  /** 过滤客户数据基于跟进状态 */
  const filteredData = previewData.filter(item => {
    if (!followUpStatus) return true;
    return item.followStatus === followUpStatus;
  });

  /** 表格列定义 */
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '序号',
      width: 60
    },
    {
      dataIndex: 'company',
      ellipsis: true,
      key: 'company',
      title: '单位',
      width: 220
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '姓名',
      width: 100
    },
    {
      dataIndex: 'position',
      key: 'position',
      title: '职位',
      width: 140
    },
    {
      dataIndex: 'phone',
      key: 'phone',
      title: '电话',
      width: 150
    },
    {
      dataIndex: 'mobile',
      key: 'mobile',
      title: '手机',
      width: 120
    },
    {
      dataIndex: 'followUp',
      ellipsis: true,
      key: 'followUp',
      title: '跟进',
      width: 250
    },
    {
      dataIndex: 'followStatus',
      key: 'followStatus',
      render: (status: FollowUpStatus) => <Tag color={followUpStatusColors[status]}>{followUpStatusNames[status]}</Tag>,
      title: '状态',
      width: 80
    },
    {
      dataIndex: 'createTime',
      key: 'createTime',
      title: '时间',
      width: 150
    }
  ];

  /** 跟进状态Tab页 */
  const followUpStatusTabs = [
    {
      key: '',
      label: '全部'
    },
    {
      key: FollowUpStatus.EARLY_25,
      label: followUpStatusNames[FollowUpStatus.EARLY_25]
    },
    {
      key: FollowUpStatus.VIP,
      label: followUpStatusNames[FollowUpStatus.VIP]
    },
    {
      key: FollowUpStatus.EFFECTIVE_VISIT,
      label: followUpStatusNames[FollowUpStatus.EFFECTIVE_VISIT]
    },
    {
      key: FollowUpStatus.CONSULT,
      label: followUpStatusNames[FollowUpStatus.CONSULT]
    },
    {
      key: FollowUpStatus.REGISTERED,
      label: followUpStatusNames[FollowUpStatus.REGISTERED]
    },
    {
      key: FollowUpStatus.ARRIVED,
      label: followUpStatusNames[FollowUpStatus.ARRIVED]
    },
    {
      key: FollowUpStatus.NOT_ARRIVED,
      label: followUpStatusNames[FollowUpStatus.NOT_ARRIVED]
    },
    {
      key: FollowUpStatus.NEW_DEVELOP,
      label: followUpStatusNames[FollowUpStatus.NEW_DEVELOP]
    }
  ];

  /** 手动录入表单提交 */
  const handleManualSubmit = async () => {
    try {
      const values = await manualForm.validateFields();
      setSubmitting(true);

      // 模拟处理表单数据
      setTimeout(() => {
        // 创建新客户记录
        const newCustomer = {
          company: values.company,
          createTime: new Date().toLocaleString(),
          followStatus: values.followStatus,
          followUp: values.followUp,
          id: manualEntryList.length > 0 ? Math.max(...manualEntryList.map(item => item.id)) + 1 : 1,
          mobile: values.mobile || '',
          name: values.name,
          phone: values.phone || '',
          position: values.position || ''
        };

        // 添加到手动录入列表
        setManualEntryList([newCustomer, ...manualEntryList]);

        // 重置表单
        manualForm.resetFields();
        message.success('客户添加成功');
        setSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /** 批量导入手动录入的客户 */
  const handleBatchImport = () => {
    if (manualEntryList.length === 0) {
      message.warning('请先添加客户');
      return;
    }

    setSubmitting(true);

    // 模拟导入过程
    setTimeout(() => {
      message.success(`成功导入 ${manualEntryList.length} 名客户`);
      setManualEntryList([]);
      setSubmitting(false);
    }, 1500);
  };

  /** 打开单个录入弹窗 */
  const openImportModal = () => {
    manualForm.resetFields();
    setIsImportModalVisible(true);
  };

  /** 单个客户录入 */
  const handleSingleImport = async () => {
    try {
      const values = await manualForm.validateFields();

      const customerData = {
        address: values.address || '',
        company: values.company,
        email: values.email || '',
        followNotes: values.followUp || '',
        followStatus: values.followStatus,
        industry: 'other',
        level: 'potential',
        mobile: values.mobile || '',
        name: values.name,
        phone: values.phone,
        position: values.position,
        source: 'manual'
      };

      await customerService.createCustomer(customerData);

      message.success('客户录入成功');
      setIsImportModalVisible(false);
      manualForm.resetFields();
    } catch (error) {
      message.error('客户录入失败');
      console.error('录入失败:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'preview') {
      // 获取真实的导入预览数据
      fetchImportPreview();
    }
  }, [activeTab]);

  // 获取导入预览数据
  const fetchImportPreview = async () => {
    try {
      // 这里可以调用API获取预览数据，或者基于上传的文件生成预览
      // 如果是Excel导入，可能需要解析Excel文件内容
      setPreviewData([]); // 暂时设为空，等待实际实现
    } catch (error) {
      console.error('获取导入预览数据失败:', error);
      setPreviewData([]);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        className="h-full"
        title="客户导入"
        variant="borderless"
      >
        <Tabs
          activeKey={activeTab}
          items={[
            {
              children: (
                <div className="mt-4">
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Card variant="borderless">
                        <div className="ant-row ant-row-center mt-4 css-dev-only-do-not-override-t23gha css-var-r0">
                          <Upload.Dragger {...uploadProps}>
                            <p className="ant-upload-drag-icon">
                              <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                            <p className="ant-upload-hint">支持.xlsx, .xls格式的Excel文件</p>
                          </Upload.Dragger>
                        </div>

                        {fileList.length > 0 && (
                          <div className="mt-4">
                            <div className="text-sm text-gray-500 mb-2">
                              已选择文件：{fileList[0].name}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-center mt-6">
                          <Button
                            type="primary"
                            style={{ marginRight: 16 }}
                            disabled={fileList.length === 0}
                            onClick={handlePreview}
                          >
                            预览数据
                          </Button>
                          <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            disabled={previewData.length === 0}
                            loading={uploading}
                            onClick={handleImport}
                          >
                            确认导入
                          </Button>
                        </div>
                      </Card>
                    </Col>

                    {previewData.length > 0 && (
                      <Col span={24}>
                        <Divider>数据预览</Divider>
                        <Tabs
                          activeKey={followUpStatus}
                          items={followUpStatusTabs}
                          onChange={key => setFollowUpStatus(key as FollowUpStatus | '')}
                        />
                        <Table
                          columns={columns}
                          dataSource={filteredData}
                          rowKey="id"
                          scroll={{ x: 1300 }}
                        />
                      </Col>
                    )}
                  </Row>
                </div>
              ),
              key: 'excel',
              label: 'Excel导入'
            },
            {
              children: (
                <div className="mt-4">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card
                        title="客户信息录入"
                        variant="borderless"
                      >
                        <Form
                          form={manualForm}
                          labelCol={{ span: 6 }}
                          wrapperCol={{ span: 16 }}
                        >
                          <Form.Item
                            label="单位名称"
                            name="company"
                            rules={[{ message: '请输入单位名称', required: true }]}
                          >
                            <Input placeholder="请输入单位名称" />
                          </Form.Item>
                          <Form.Item
                            label="姓名"
                            name="name"
                            rules={[{ message: '请输入客户姓名', required: true }]}
                          >
                            <Input placeholder="请输入客户姓名" />
                          </Form.Item>
                          <Form.Item
                            label="职位"
                            name="position"
                          >
                            <Input placeholder="请输入职位" />
                          </Form.Item>
                          <Form.Item
                            label="电话"
                            name="phone"
                          >
                            <Input placeholder="请输入电话号码" />
                          </Form.Item>
                          <Form.Item
                            label="手机"
                            name="mobile"
                          >
                            <Input placeholder="请输入手机号码" />
                          </Form.Item>
                          <Form.Item
                            initialValue={FollowUpStatus.NEW_DEVELOP}
                            label="跟进状态"
                            name="followStatus"
                            rules={[{ message: '请选择跟进状态', required: true }]}
                          >
                            <Select
                              placeholder="请选择跟进状态"
                              options={Object.values(FollowUpStatus).map(status => ({
                                label: (
                                  <Space>
                                    <Tag color={followUpStatusColors[status]}>{followUpStatusNames[status]}</Tag>
                                  </Space>
                                ),
                                value: status
                              }))}
                            />
                          </Form.Item>
                          <Form.Item
                            label="跟进内容"
                            name="followUp"
                            rules={[{ message: '请输入跟进内容', required: true }]}
                          >
                            <Input.TextArea
                              placeholder="请输入跟进内容"
                              rows={4}
                            />
                          </Form.Item>
                          <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
                            <Button
                              icon={<PlusOutlined />}
                              loading={submitting}
                              type="primary"
                              onClick={handleManualSubmit}
                            >
                              添加客户
                            </Button>
                          </Form.Item>
                        </Form>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card
                        variant="borderless"
                        extra={
                          <Button
                            disabled={manualEntryList.length === 0}
                            loading={submitting}
                            type="primary"
                            onClick={handleBatchImport}
                          >
                            批量导入
                          </Button>
                        }
                        title={
                          <div>
                            已添加客户 <Tag color="blue">{manualEntryList.length}</Tag>
                          </div>
                        }
                      >
                        {manualEntryList.length > 0 ? (
                          <Table
                            columns={columns}
                            dataSource={manualEntryList}
                            pagination={{ pageSize: 5 }}
                            rowKey="id"
                            scroll={{ x: 800, y: 300 }}
                            size="small"
                          />
                        ) : (
                          <div className="py-10 text-center text-gray-400">暂无添加的客户信息</div>
                        )}
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
              key: 'manual',
              label: '手动录入'
            }
          ]}
          onChange={key => setActiveTab(key)}
        />
      </Card>

      {/* 预览数据弹窗 */}
      <Modal
        footer={null}
        open={isPreviewVisible}
        title="预览导入数据"
        width={1200}
        onCancel={() => setIsPreviewVisible(false)}
      >
        <Table
          columns={columns}
          dataSource={previewData}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          scroll={{ x: 1000 }}
          size="small"
        />
      </Modal>

      {/* 单个录入弹窗 */}
      <Modal
        open={isImportModalVisible}
        title="录入客户信息"
        width={600}
        onCancel={() => setIsImportModalVisible(false)}
        onOk={handleSingleImport}
      >
        <Form
          form={manualForm}
          layout="vertical"
        >
          <Form.Item
            label="客户姓名"
            name="name"
            rules={[{ message: '请输入客户姓名', required: true }]}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>

          <Form.Item
            label="公司名称"
            name="company"
            rules={[{ message: '请输入公司名称', required: true }]}
          >
            <Input placeholder="请输入公司名称" />
          </Form.Item>

          <Form.Item
            label="职位"
            name="position"
            rules={[{ message: '请输入职位', required: true }]}
          >
            <Input placeholder="请输入职位" />
          </Form.Item>

          <Form.Item
            label="电话"
            name="phone"
          >
            <Input placeholder="请输入电话" />
          </Form.Item>

          <Form.Item
            label="手机"
            name="mobile"
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="地址"
            name="address"
          >
            <Input placeholder="请输入地址" />
          </Form.Item>

          <Form.Item
            label="跟进状态"
            name="followStatus"
            rules={[{ message: '请选择跟进状态', required: true }]}
          >
            <Select placeholder="请选择跟进状态">
              <Select.Option value={FollowUpStatus.EARLY_25}>早25</Select.Option>
              <Select.Option value={FollowUpStatus.WECHAT_ADDED}>加微信</Select.Option>
              <Select.Option value={FollowUpStatus.EFFECTIVE_VISIT}>有效拜访</Select.Option>
              <Select.Option value={FollowUpStatus.REGISTERED}>已注册</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="跟进内容"
            name="followUp"
          >
            <TextArea
              placeholder="请输入跟进内容"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerImport;
