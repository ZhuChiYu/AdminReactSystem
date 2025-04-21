import { Card, Col, Row, Statistic, Table, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useState } from 'react';

/** 财务看板组件 */
const FinanceDashboard = () => {
  // 当前激活的标签
  const [activeTab, setActiveTab] = useState<string>('employee');

  // 示例员工业绩数据
  const employeeData = [
    {
      department: '销售部',
      id: 1,
      name: '张三',
      performance: 125000,
      ratio: 110,
      target: 100000
    },
    {
      department: '销售部',
      id: 2,
      name: '李四',
      performance: 98000,
      ratio: 98,
      target: 100000
    },
    {
      department: '市场部',
      id: 3,
      name: '王五',
      performance: 88000,
      ratio: 110,
      target: 80000
    },
    {
      department: '咨询部',
      id: 4,
      name: '赵六',
      performance: 150000,
      ratio: 125,
      target: 120000
    },
    {
      department: '研发部',
      id: 5,
      name: '孙七',
      performance: 200000,
      ratio: 100,
      target: 200000
    }
  ];

  // 示例财务数据图表数据
  const chartData = [
    { income: 350000, month: '1月', profit: 130000, spending: 220000 },
    { income: 420000, month: '2月', profit: 170000, spending: 250000 },
    { income: 380000, month: '3月', profit: 100000, spending: 280000 },
    { income: 450000, month: '4月', profit: 150000, spending: 300000 },
    { income: 520000, month: '5月', profit: 200000, spending: 320000 },
    { income: 480000, month: '6月', profit: 130000, spending: 350000 }
  ];

  // 示例部门业务数据
  const departmentData = [
    { department: '销售部', expenses: 120000, income: 380000, profit: 260000 },
    { department: '市场部', expenses: 150000, income: 280000, profit: 130000 },
    { department: '咨询部', expenses: 100000, income: 350000, profit: 250000 },
    { department: '研发部', expenses: 200000, income: 180000, profit: -20000 },
    { department: '财务部', expenses: 80000, income: 100000, profit: 20000 },
    { department: '人力资源部', expenses: 90000, income: 120000, profit: 30000 }
  ];

  // 生成趋势数据函数
  const generateTrendData = () => {
    const trendData = [];
    for (let i = 1; i <= 12; i += 1) {
      trendData.push({
        income: Math.floor(Math.random() * 50000) + 300000,
        month: `${i}月`,
        profit: Math.floor(Math.random() * 40000) + 100000,
        spending: Math.floor(Math.random() * 30000) + 200000
      });
    }
    return trendData;
  };

  // 预生成的趋势数据
  const trendData = generateTrendData();

  // 员工业绩列
  const employeeColumns = [
    {
      dataIndex: 'name',
      key: 'name',
      title: '姓名'
    },
    {
      dataIndex: 'department',
      key: 'department',
      title: '部门'
    },
    {
      dataIndex: 'target',
      key: 'target',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '目标'
    },
    {
      dataIndex: 'performance',
      key: 'performance',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '业绩'
    },
    {
      dataIndex: 'ratio',
      key: 'ratio',
      render: (value: number) => `${value}%`,
      title: '完成率'
    }
  ];

  // 部门业绩列
  const departmentColumns = [
    {
      dataIndex: 'department',
      key: 'department',
      title: '部门'
    },
    {
      dataIndex: 'income',
      key: 'income',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '收入'
    },
    {
      dataIndex: 'expenses',
      key: 'expenses',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '支出'
    },
    {
      dataIndex: 'profit',
      key: 'profit',
      render: (value: number) => {
        const color = value >= 0 ? 'green' : 'red';
        return <span style={{ color }}>{`¥${value.toLocaleString()}`}</span>;
      },
      title: '利润'
    }
  ];

  // 趋势数据表格列
  const trendColumns = [
    {
      dataIndex: 'month',
      key: 'month',
      title: '月份'
    },
    {
      dataIndex: 'income',
      key: 'income',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '收入'
    },
    {
      dataIndex: 'spending',
      key: 'spending',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '支出'
    },
    {
      dataIndex: 'profit',
      key: 'profit',
      render: (value: number) => {
        const color = value >= 0 ? 'green' : 'red';
        return <span style={{ color }}>{`¥${value.toLocaleString()}`}</span>;
      },
      title: '利润'
    }
  ];

  // 财务图表数据表格列
  const chartColumns = [
    {
      dataIndex: 'month',
      key: 'month',
      title: '月份'
    },
    {
      dataIndex: 'income',
      key: 'income',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '收入'
    },
    {
      dataIndex: 'spending',
      key: 'spending',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '支出'
    },
    {
      dataIndex: 'profit',
      key: 'profit',
      render: (value: number) => {
        const color = value >= 0 ? 'green' : 'red';
        return <span style={{ color }}>{`¥${value.toLocaleString()}`}</span>;
      },
      title: '利润'
    }
  ];

  // 财务看板Tab页配置
  const tabItems: TabsProps['items'] = [
    {
      children: (
        <div className="mt-4">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card bordered={false}>
                <Table
                  columns={employeeColumns}
                  dataSource={employeeData}
                  pagination={false}
                  rowKey="id"
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
      key: 'employee',
      label: '员工业绩'
    },
    {
      children: (
        <div className="mt-4">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                bordered={false}
                title="财务数据图表"
              >
                <Table
                  columns={chartColumns}
                  dataSource={chartData}
                  pagination={false}
                  rowKey="month"
                />
              </Card>
            </Col>

            <Col span={24}>
              <Card
                bordered={false}
                title="部门业绩"
              >
                <Table
                  columns={departmentColumns}
                  dataSource={departmentData}
                  pagination={false}
                  rowKey="department"
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
      key: 'dataChart',
      label: '数据图表'
    },
    {
      children: (
        <div className="mt-4">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card bordered={false}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      precision={2}
                      prefix="¥"
                      title="本月收入"
                      value={480000}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      precision={2}
                      prefix="¥"
                      title="本月支出"
                      value={350000}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      precision={2}
                      prefix="¥"
                      title="本月利润"
                      value={130000}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <Card
                bordered={false}
                title="月度趋势"
              >
                <Table
                  columns={trendColumns}
                  dataSource={trendData}
                  pagination={false}
                  rowKey="month"
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
      key: 'analysis',
      label: '数据分析'
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        bordered={false}
        className="h-full"
        title="财务看板"
      >
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={key => setActiveTab(key)}
        />
      </Card>
    </div>
  );
};

export default FinanceDashboard;
