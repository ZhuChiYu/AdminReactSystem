import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  message
} from 'antd';
import { useEffect, useState } from 'react';

/** 跟进状态枚举 */
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

/** 跟进状态名称 */
const followUpStatusNames = {
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

/** 跟进状态颜色 */
const followUpStatusColors = {
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

/** 客户跟进管理组件 */
const CustomerFollow = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<Record<string, number>>({});
  const [followRecords, setFollowRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [selectedFollowStatus, setSelectedFollowStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  // 用户角色状态，可以在开发环境下切换测试
  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');

  // 切换用户角色（仅供开发测试使用）
  const toggleUserRole = () => {
    setUserRole(prev => (prev === 'admin' ? 'user' : 'admin'));
  };

  // 模拟获取跟进数据
  const fetchFollowData = () => {
    setLoading(true);

    // 模拟API请求
    setTimeout(() => {
      // 生成各类型的随机统计数据
      const stats: Record<string, number> = {
        all: 0
      };

      Object.values(FollowUpStatus).forEach(type => {
        const count = Math.floor(Math.random() * 50) + 1;
        stats[type] = count;
        stats.all += count;
      });

      setStatistics(stats);

      // 生成跟进记录数据
      const records = [
        {
          company: '上海民用航空电源系统有限公司',
          createdBy: '管理员',
          createdTime: new Date().toLocaleString(),
          followContent: '发计划数智化简章微信15802910233',
          followStatus: FollowUpStatus.WECHAT_ADDED,
          id: 1,
          mobile: '',
          name: '马芳',
          phone: '029-81112543',
          position: '财务负责培训'
        },
        {
          company: '中国电力工程顾问集团中南电力设计院有限公司',
          createdBy: '销售顾问',
          createdTime: new Date().toLocaleString(),
          followContent: '看看课微信18229295812',
          followStatus: FollowUpStatus.EARLY_25,
          id: 2,
          mobile: '',
          name: '万娜',
          phone: '027-65263855',
          position: '财务负责培训'
        },
        {
          company: '太原钢铁（集团）有限公司',
          createdBy: '咨询师',
          createdTime: new Date().toLocaleString(),
          followContent: '负责培训推荐微信',
          followStatus: FollowUpStatus.WECHAT_ADDED,
          id: 3,
          mobile: '',
          name: '陈建英',
          phone: '微信',
          position: '财务负责培训'
        },
        {
          company: '中国电力工程顾问集团中南电力设计院有限公司',
          createdBy: '班主任',
          createdTime: new Date().toLocaleString(),
          followContent: '数智财务发课程微信18717397529/3.4天接3.5天接2.24天接',
          followStatus: FollowUpStatus.EFFECTIVE_VISIT,
          id: 4,
          mobile: '',
          name: '刘老师',
          phone: '027-65263854',
          position: '财务'
        },
        {
          company: '中国能源建设集团江苏省电力设计院有限公司',
          createdBy: '管理员',
          createdTime: new Date().toLocaleString(),
          followContent: '数智化还有年计划发一下微信13813844478',
          followStatus: FollowUpStatus.REGISTERED,
          id: 5,
          mobile: '',
          name: '陶主任',
          phone: '025-85081060',
          position: '财务主任'
        },
        {
          company: '中国能源建设集团天津电力设计院有限公司',
          createdBy: '销售顾问',
          createdTime: new Date().toLocaleString(),
          followContent: '其他单位能学应该是有发文，看一下，课程和计划发过来微信13821110961',
          followStatus: FollowUpStatus.REGISTERED,
          id: 6,
          mobile: '',
          name: '迟主任',
          phone: '022-58339303',
          position: '财务主任'
        }
      ];

      setFollowRecords(records);
      setFilteredRecords(records);
      setLoading(false);
    }, 1000);
  };

  // 组件初始化时获取数据
  useEffect(() => {
    fetchFollowData();
  }, []);

  // 根据选择的跟进类型过滤记录
  useEffect(() => {
    if (selectedFollowStatus === 'all') {
      setFilteredRecords(followRecords);
    } else {
      setFilteredRecords(followRecords.filter(record => record.followStatus === selectedFollowStatus));
    }
  }, [selectedFollowStatus, followRecords]);

  // 打开添加跟进记录弹窗
  const openAddModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 提交添加跟进记录
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const { company, followContent, followStatus, mobile, name, phone, position } = values;

      // 添加新记录
      const newRecord = {
        company,
        createdBy: userRole === 'admin' ? '管理员' : '销售顾问',
        createdTime: new Date().toLocaleString(),
        followContent,
        followStatus,
        id: followRecords.length + 1,
        mobile,
        name,
        phone,
        position
      };

      const updatedRecords = [newRecord, ...followRecords];
      setFollowRecords(updatedRecords);

      // 更新统计数据
      const updatedStats = { ...statistics };
      updatedStats[followStatus] = (updatedStats[followStatus] || 0) + 1;
      updatedStats.all += 1;
      setStatistics(updatedStats);

      message.success('添加成功');
      setIsModalVisible(false);
    });
  };

  // 统计卡片渲染
  const renderStatistics = () => {
    return (
      <Card
        bordered={false}
        className="mb-4"
        title="客户跟进统计"
      >
        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Statistic
              title="总客户"
              value={statistics.all || 0}
            />
          </Col>
          {Object.values(FollowUpStatus).map(type => (
            <Col
              key={type}
              span={4}
            >
              <Statistic
                title={<Tag color={followUpStatusColors[type]}>{followUpStatusNames[type]}</Tag>}
                value={statistics[type] || 0}
              />
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  // 表格列定义
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
      dataIndex: 'followContent',
      ellipsis: true,
      key: 'followContent',
      title: '跟进内容',
      width: 250
    },
    {
      dataIndex: 'followStatus',
      key: 'followStatus',
      render: (status: FollowUpStatus) => <Tag color={followUpStatusColors[status]}>{followUpStatusNames[status]}</Tag>,
      title: '状态',
      width: 100
    },
    ...(userRole === 'admin'
      ? [
          {
            dataIndex: 'createdBy',
            key: 'createdBy',
            title: '创建人',
            width: 100
          }
        ]
      : []),
    {
      dataIndex: 'createdTime',
      key: 'createdTime',
      title: '创建时间',
      width: 150
    }
  ];

  /** 跟进状态Tab选项 */
  const followUpStatusOptions = [
    {
      label: '全部',
      value: 'all'
    },
    ...Object.values(FollowUpStatus).map(type => ({
      label: <Tag color={followUpStatusColors[type]}>{followUpStatusNames[type]}</Tag>,
      value: type
    }))
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <div className="p-4">
        {userRole === 'admin' && renderStatistics()}

        <Card
          bordered={false}
          className="h-full"
          title="客户跟进记录"
          extra={
            <Space>
              {/* 此按钮仅用于开发环境测试不同角色 */}
              {import.meta.env.DEV && (
                <Button onClick={toggleUserRole}>当前角色: {userRole === 'admin' ? '管理员' : '员工'}</Button>
              )}
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={openAddModal}
              >
                新增跟进
              </Button>
            </Space>
          }
        >
          <Space
            className="mb-4"
            direction="vertical"
            style={{ width: '100%' }}
          >
            <Segmented
              options={followUpStatusOptions}
              value={selectedFollowStatus}
              onChange={value => setSelectedFollowStatus(value as string)}
            />

            <Divider style={{ margin: '12px 0' }} />

            <Table
              columns={columns}
              dataSource={filteredRecords}
              loading={loading}
              rowKey="id"
              scroll={{ x: 1300, y: 'calc(100vh - 450px)' }}
            />
          </Space>
        </Card>
      </div>

      <Modal
        open={isModalVisible}
        title="添加跟进记录"
        onCancel={handleCancel}
        onOk={handleSubmit}
      >
        <Form
          form={form}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
        >
          <Form.Item
            label="单位"
            name="company"
            rules={[{ message: '请输入单位名称', required: true }]}
          >
            <Input placeholder="请输入单位名称" />
          </Form.Item>
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ message: '请输入姓名', required: true }]}
          >
            <Input placeholder="请输入姓名" />
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
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item
            label="手机"
            name="mobile"
          >
            <Input placeholder="请输入手机号码" />
          </Form.Item>
          <Form.Item
            label="跟进状态"
            name="followStatus"
            rules={[{ message: '请选择跟进状态', required: true }]}
          >
            <Select
              placeholder="请选择跟进状态"
              options={Object.values(FollowUpStatus).map(type => ({
                label: (
                  <Space>
                    <Tag color={followUpStatusColors[type]}>{followUpStatusNames[type]}</Tag>
                  </Space>
                ),
                value: type
              }))}
            />
          </Form.Item>
          <Form.Item
            label="跟进内容"
            name="followContent"
            rules={[{ message: '请输入跟进内容', required: true }]}
          >
            <Input.TextArea
              placeholder="请输入跟进内容"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerFollow;
