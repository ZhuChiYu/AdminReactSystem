import { InboxOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Form, Input, Row, Select, Space, Table, Tabs, Tag, Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { useState } from 'react';

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

/** 客户导入组件 */
const CustomerImport = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('excel');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus | ''>('');
  const [manualForm] = Form.useForm();
  const [manualEntryList, setManualEntryList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  /** 文件上传属性配置 */
  const uploadProps: UploadProps = {
    beforeUpload: file => {
      const isExcel =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';

      if (!isExcel) {
        message.error('只支持上传Excel文件!');
        return Upload.LIST_IGNORE;
      }

      setFileList([file]);
      return false;
    },
    fileList,
    listType: 'text',
    maxCount: 1,
    onRemove: () => {
      setFileList([]);
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
      // 模拟解析Excel数据预览
      setTimeout(() => {
        // 使用表格中的真实数据结构
        const mockData = [
          {
            company: '上海民用航空电源系统有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.WECHAT_ADDED,
            followUp: '发计划数智化简章微信15802910233',
            id: 1,
            mobile: '',
            name: '马芳',
            phone: '029-81112543',
            position: '财务负责培训'
          },
          {
            company: '中国电力工程顾问集团中南电力设计院有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.EARLY_25,
            followUp: '看看课微信18229295812',
            id: 2,
            mobile: '',
            name: '万娜',
            phone: '027-65263855',
            position: '财务负责培训'
          },
          {
            company: '太原钢铁（集团）有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.WECHAT_ADDED,
            followUp: '负责培训推荐微信',
            id: 3,
            mobile: '',
            name: '陈建英',
            phone: '微信',
            position: '财务负责培训'
          },
          {
            company: '中国电力工程顾问集团中南电力设计院有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.EFFECTIVE_VISIT,
            followUp: '数智财务发课程微信18717397529/3.4天接3.5天接2.24天接',
            id: 4,
            mobile: '',
            name: '刘老师',
            phone: '027-65263854',
            position: '财务'
          },
          {
            company: '中国能源建设集团江苏省电力设计院有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.REGISTERED,
            followUp: '数智化还有年计划发一下微信13813844478',
            id: 5,
            mobile: '',
            name: '陶主任',
            phone: '025-85081060',
            position: '财务主任'
          },
          {
            company: '中国能源建设集团天津电力设计院有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.REGISTERED,
            followUp: '其他单位能学应该是有发文，看一下，课程和计划发过来微信13821110961',
            id: 6,
            mobile: '',
            name: '迟主任',
            phone: '022-58339303',
            position: '财务主任'
          }
        ];

        setPreviewData(mockData);
        setUploading(false);
        message.success('数据预览成功');
      }, 1500);
    } catch {
      message.error('预览失败');
      setUploading(false);
    }
  };

  /** 导入Excel文件 */
  const handleImport = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    setUploading(true);

    try {
      // 模拟导入过程
      setTimeout(() => {
        setUploading(false);
        message.success('导入成功');
      }, 2000);
    } catch {
      message.error('导入失败');
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

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        variant="borderless"
        className="h-full"
        title="客户导入"
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
                        <Row justify="center">
                          <Col span={12}>
                            <Upload.Dragger {...uploadProps}>
                              <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                              </p>
                              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                              <p className="ant-upload-hint">支持单个Excel文件上传，请使用标准模板导入数据</p>
                            </Upload.Dragger>
                          </Col>
                        </Row>
                        <Row
                          className="mt-4"
                          justify="center"
                        >
                          <Button
                            disabled={fileList.length === 0}
                            style={{ marginRight: 16 }}
                            type="primary"
                            onClick={handlePreview}
                          >
                            预览数据
                          </Button>
                          <Button
                            disabled={previewData.length === 0}
                            icon={<UploadOutlined />}
                            loading={uploading}
                            type="primary"
                            onClick={handleImport}
                          >
                            一键导入
                          </Button>
                        </Row>
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
                        variant="borderless"
                        title="客户信息录入"
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
    </div>
  );
};

export default CustomerImport;
