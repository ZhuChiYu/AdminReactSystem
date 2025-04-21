import { UserAddOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';

/** 跟进状态枚举 */
enum FollowUpStatus {
  ARRIVED = 'arrived', // 已实到
  CONSULT = 'consult', // 咨询
  EARLY_25 = 'early_25', // 早25客户
  EFFECTIVE_VISIT = 'effective_visit', // 有效回访
  NEW_DEVELOP = 'new_develop', // 新开发
  NOT_ARRIVED = 'not_arrived', // 未实到
  REGISTERED = 'registered', // 已报名
  REJECTED = 'rejected', // 未通过
  VIP = 'vip', // 大客户
  WECHAT_ADDED = 'wechat_added' // 已加微信
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

/** 客户信息管理组件 */
const CustomerInfo = () => {
  const [loading, setLoading] = useState(false);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    company: '',
    followStatus: '',
    name: '',
    phone: ''
  });

  // 模拟获取客户列表
  const fetchCustomerList = () => {
    setLoading(true);

    // 模拟API请求
    setTimeout(() => {
      // 使用与导入页面相同的数据结构
      const mockData = [
        {
          company: '上海民用航空电源系统有限公司',
          createTime: new Date().toLocaleString(),
          followContent: '发计划数智化简章微信15802910233',
          followStatus: FollowUpStatus.WECHAT_ADDED,
          id: 1,
          mobile: '',
          name: '马芳',
          phone: '029-81112543',
          position: '财务负责培训',
          source: '网站'
        },
        {
          company: '中国电力工程顾问集团中南电力设计院有限公司',
          createTime: new Date().toLocaleString(),
          followContent: '看看课微信18229295812',
          followStatus: FollowUpStatus.EARLY_25,
          id: 2,
          mobile: '',
          name: '万娜',
          phone: '027-65263855',
          position: '财务负责培训',
          source: '朋友推荐'
        },
        {
          company: '太原钢铁（集团）有限公司',
          createTime: new Date().toLocaleString(),
          followContent: '负责培训推荐微信',
          followStatus: FollowUpStatus.WECHAT_ADDED,
          id: 3,
          mobile: '',
          name: '陈建英',
          phone: '微信',
          position: '财务负责培训',
          source: '广告'
        },
        {
          company: '中国电力工程顾问集团中南电力设计院有限公司',
          createTime: new Date().toLocaleString(),
          followContent: '数智财务发课程微信18717397529/3.4天接3.5天接2.24天接',
          followStatus: FollowUpStatus.EFFECTIVE_VISIT,
          id: 4,
          mobile: '',
          name: '刘老师',
          phone: '027-65263854',
          position: '财务',
          source: '展会'
        },
        {
          company: '中国能源建设集团江苏省电力设计院有限公司',
          createTime: new Date().toLocaleString(),
          followContent: '数智化还有年计划发一下微信13813844478',
          followStatus: FollowUpStatus.REGISTERED,
          id: 5,
          mobile: '',
          name: '陶主任',
          phone: '025-85081060',
          position: '财务主任',
          source: '其他'
        },
        {
          company: '中国能源建设集团天津电力设计院有限公司',
          createTime: new Date().toLocaleString(),
          followContent: '其他单位能学应该是有发文，看一下，课程和计划发过来微信13821110961',
          followStatus: FollowUpStatus.ARRIVED,
          id: 6,
          mobile: '',
          name: '迟主任',
          phone: '022-58339303',
          position: '财务主任',
          source: '网站'
        }
      ];

      // 添加更多随机数据
      const additionalData = Array(44)
        .fill(null)
        .map((_, idx) => {
          const statusArray = Object.values(FollowUpStatus);
          const randomStatus = statusArray[Math.floor(Math.random() * statusArray.length)];

          return {
            company: `公司名称 ${idx + 7}`,
            createTime: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toLocaleString(),
            followContent: `跟进内容 ${idx + 7}`,
            followStatus: randomStatus,
            id: idx + 7,
            mobile: Math.random() > 0.5 ? `1381234${(idx + 7).toString().padStart(4, '0')}` : '',
            name: `客户${idx + 7}`,
            phone: Math.random() > 0.3 ? `010-8531${(idx + 7).toString().padStart(4, '0')}` : '',
            position: ['经理', '主管', '总监', '财务', '技术员'][Math.floor(Math.random() * 5)],
            source: ['网站', '朋友推荐', '广告', '展会', '其他'][Math.floor(Math.random() * 5)]
          };
        });

      const allData = [...mockData, ...additionalData];
      setCustomerList(allData);
      setFilteredList(allData);
      setLoading(false);
    }, 1000);
  };

  // 组件初始化时获取客户列表
  useEffect(() => {
    fetchCustomerList();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    const { company, followStatus, name, phone } = searchParams;

    let filtered = [...customerList];

    if (name) {
      filtered = filtered.filter(item => item.name.includes(name));
    }

    if (phone) {
      filtered = filtered.filter(item => item.phone?.includes(phone) || item.mobile?.includes(phone));
    }

    if (company) {
      filtered = filtered.filter(item => item.company.includes(company));
    }

    if (followStatus) {
      filtered = filtered.filter(item => item.followStatus === followStatus);
    }

    setFilteredList(filtered);
  };

  // 添加一个Effect用于在搜索参数变化时自动筛选
  useEffect(() => {
    handleSearch();
  }, [searchParams]);

  // 重置搜索条件
  const resetSearch = () => {
    setSearchParams({
      company: '',
      followStatus: '',
      name: '',
      phone: ''
    });
    setFilteredList(customerList);
  };

  // 打开修改跟进状态弹窗
  const openFollowStatusModal = (record: any) => {
    setCurrentCustomer(record);
    form.setFieldsValue({
      followStatus: record.followStatus
    });
    setIsModalVisible(true);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentCustomer(null);
  };

  // 提交修改跟进状态
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const { followStatus } = values;

      // 更新客户跟进状态
      const updatedList = customerList.map(item => {
        if (item.id === currentCustomer.id) {
          return { ...item, followStatus };
        }
        return item;
      });

      setCustomerList(updatedList);
      setFilteredList(
        filteredList.map(item => {
          if (item.id === currentCustomer.id) {
            return { ...item, followStatus };
          }
          return item;
        })
      );

      message.success('更新成功');
      setIsModalVisible(false);
      setCurrentCustomer(null);
    });
  };

  // 添加新客户
  const addNewCustomer = () => {
    addForm.resetFields();
    setIsAddModalVisible(true);
  };

  // 关闭添加客户弹窗
  const handleAddCancel = () => {
    setIsAddModalVisible(false);
  };

  // 提交添加客户
  const handleAddSubmit = () => {
    addForm.validateFields().then(values => {
      const { company, followContent, followStatus, mobile, name, phone, position, source } = values;

      // 创建新客户记录
      const newCustomer = {
        company,
        createTime: new Date().toLocaleString(),
        followContent,
        followStatus,
        id: customerList.length > 0 ? Math.max(...customerList.map(item => item.id)) + 1 : 1,
        mobile: mobile || '',
        name,
        phone: phone || '',
        position: position || '',
        source: source || '网站'
      };

      // 添加到客户列表
      const updatedList = [newCustomer, ...customerList];
      setCustomerList(updatedList);
      setFilteredList([newCustomer, ...filteredList]);

      message.success('添加客户成功');
      setIsAddModalVisible(false);
    });
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
      dataIndex: 'source',
      key: 'source',
      title: '来源',
      width: 100
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
    {
      dataIndex: 'createTime',
      key: 'createTime',
      title: '创建时间',
      width: 150
    },
    {
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          size="small"
          type="link"
          onClick={() => openFollowStatusModal(record)}
        >
          修改跟进状态
        </Button>
      ),
      title: '操作',
      width: 120
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        bordered={false}
        className="h-full"
        title="客户资料"
      >
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Input
            allowClear
            placeholder="姓名"
            style={{ width: 120 }}
            value={searchParams.name}
            onChange={e => setSearchParams({ ...searchParams, name: e.target.value })}
          />
          <Input
            allowClear
            placeholder="单位"
            style={{ width: 180 }}
            value={searchParams.company}
            onChange={e => setSearchParams({ ...searchParams, company: e.target.value })}
          />
          <Input
            allowClear
            placeholder="电话/手机"
            style={{ width: 150 }}
            value={searchParams.phone}
            onChange={e => setSearchParams({ ...searchParams, phone: e.target.value })}
          />
          <Select
            allowClear
            placeholder="跟进状态"
            style={{ width: 120 }}
            value={searchParams.followStatus}
            options={Object.values(FollowUpStatus).map(status => ({
              label: followUpStatusNames[status],
              value: status
            }))}
            onChange={value => setSearchParams({ ...searchParams, followStatus: value })}
          />
          <Button onClick={resetSearch}>重置</Button>
          <Button
            icon={<UserAddOutlined />}
            type="primary"
            onClick={addNewCustomer}
          >
            添加客户
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredList}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1400, y: 'calc(100vh - 300px)' }}
        />

        <Modal
          open={isModalVisible}
          title="修改跟进状态"
          onCancel={handleCancel}
          onOk={handleSubmit}
        >
          <Form
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item label="客户姓名">{currentCustomer?.name}</Form.Item>
            <Form.Item label="单位">{currentCustomer?.company}</Form.Item>
            <Form.Item
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
          </Form>
        </Modal>

        <Modal
          open={isAddModalVisible}
          title="添加客户"
          width={600}
          onCancel={handleAddCancel}
          onOk={handleAddSubmit}
        >
          <Form
            form={addForm}
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
              initialValue="网站"
              label="来源"
              name="source"
            >
              <Select
                placeholder="请选择客户来源"
                options={[
                  { label: '网站', value: '网站' },
                  { label: '朋友推荐', value: '朋友推荐' },
                  { label: '广告', value: '广告' },
                  { label: '展会', value: '展会' },
                  { label: '其他', value: '其他' }
                ]}
              />
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
      </Card>
    </div>
  );
};

export default CustomerInfo;
