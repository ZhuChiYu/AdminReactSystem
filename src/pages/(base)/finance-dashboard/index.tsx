import { Card, Col, DatePicker, Progress, Row, Space, Spin, Statistic, Table, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useEcharts } from '@/hooks/common/echarts';
import { expenseService, statisticsService } from '@/service/api';
import { isSuperAdmin } from '@/utils/auth';

// 报销类型数据
const expenseTypes = [
  { color: '#5470c6', label: '差旅费', value: 'travel' },
  { color: '#91cc75', label: '交通费', value: 'transportation' },
  { color: '#fac858', label: '住宿费', value: 'accommodation' },
  { color: '#ee6666', label: '办公用品', value: 'office' },
  { color: '#73c0de', label: '餐费', value: 'meal' },
  { color: '#3ba272', label: '招待费', value: 'entertainment' },
  { color: '#fc8452', label: '培训费', value: 'training' },
  { color: '#9a60b4', label: '通讯费', value: 'communication' },
  { color: '#ea7ccc', label: '物业费', value: 'property' },
  { color: '#5d6c8c', label: '其他', value: 'other' }
];

/** 财务看板组件 */
const FinanceDashboard = () => {
  // 判断当前用户是否为超级管理员
  const isSuperAdminUser = isSuperAdmin();

  // 当前激活的标签 - 超级管理员默认显示数据图表，普通用户显示员工业绩
  const [activeTab, setActiveTab] = useState<string>(isSuperAdminUser ? 'dataChart' : 'employee');

  // 跟踪图表是否已初始化和加载状态
  const chartInitialized = useRef<boolean>(false);
  const [chartLoading, setChartLoading] = useState<boolean>(true);

  // 当前选中的年份，默认为当前年份
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // 当前选中的月份，默认为当前月份
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // 示例员工业绩数据（按业绩从高到低排序）
  const employeeData = [
    {
      department: '研发部',
      id: 5,
      name: '孙七',
      performance: 200000,
      ratio: 100,
      target: 200000
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
    }
  ];

  // 根据年份生成模拟数据的函数
  const generateChartDataByYear = (year: number) => {
    // 使用年份作为随机种子，确保同一年份数据相同但不同年份数据不同
    const seed = year - 2020;

    return Array.from({ length: 12 }, (_, index) => {
      // 根据年份和月份生成不同的数据，模拟不同年份的增长趋势
      const monthFactor = (index + 1) / 12;
      const yearFactor = 1 + (year - 2020) * 0.1; // 每年增长10%
      const randomFactor = (Math.sin(seed * index) + 1) * 0.2; // 添加一些随机波动

      const baseIncome = 300000 * yearFactor * (1 + monthFactor + randomFactor);
      const baseSpending = 200000 * yearFactor * (1 + monthFactor * 0.7 + randomFactor * 0.5);

      return {
        income: Math.round(baseIncome),
        month: `${index + 1}月`,
        profit: Math.round(baseIncome - baseSpending),
        spending: Math.round(baseSpending)
      };
    });
  };

  // 生成支出类型数据的函数
  const generateExpenseTypeData = (year: number, month: number) => {
    // 使用年份和月份生成随机数据，但保持一致性
    const seed = year * 100 + month;
    const seedRand = (idx: number) => Math.abs(Math.sin(seed + idx * 20)) * 0.8 + 0.2;

    return expenseTypes.map((type, index) => {
      // 为每种支出类型生成随机金额，但保持同年同月的一致性
      const baseAmount = 20000 + index * 5000;
      const randomFactor = seedRand(index);

      return {
        amount: Math.round(baseAmount * randomFactor),
        itemStyle: {
          color: type.color
        },
        name: type.label,
        type: type.value,
        value: Math.round(baseAmount * randomFactor)
      };
    });
  };

  // 生成支出类型月度趋势数据
  const generateMonthlyExpenseData = (year: number) => {
    // 为每个月生成各类型支出数据
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const month = monthIndex + 1;
      const typesData = {};

      // 使用年份和月份生成随机数据，但保持一致性
      const seed = year * 100 + month;
      const seedRand = (idx: number, subIdx: number = 0) => Math.abs(Math.sin(seed + idx * 20 + subIdx)) * 0.8 + 0.2;

      // 为每种支出类型生成随机金额
      expenseTypes.forEach((type, index) => {
        const baseAmount = 20000 + index * 5000;
        // 添加月份因子，使数据有季节性变化
        const monthFactor = 1 + Math.sin((monthIndex / 12) * Math.PI * 2) * 0.3;
        const randomFactor = seedRand(index, monthIndex);

        typesData[type.value] = Math.round(baseAmount * randomFactor * monthFactor);
      });

      return {
        month: `${month}月`,
        ...typesData
      };
    });
  };

  // 使用useMemo生成按年计算的月度支出趋势数据
  const monthlyExpenseData = useMemo(() => generateMonthlyExpenseData(selectedYear), [selectedYear]);

  // 使用useMemo根据选中的年份生成图表数据
  const chartData = useMemo(() => generateChartDataByYear(selectedYear), [selectedYear]);

  // 使用useMemo根据选中的年份和月份生成支出类型数据
  const expenseTypeData = useMemo(
    () => generateExpenseTypeData(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  // 计算当月总支出
  const totalExpense = useMemo(() => expenseTypeData.reduce((sum, item) => sum + item.value, 0), [expenseTypeData]);

  // 饼图配置 - 支出类型分布
  const { domRef: expenseTypePieRef, updateOptions: updateExpenseTypePie } = useEcharts(() => ({
    legend: {
      data: expenseTypes.map(type => type.label),
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        avoidLabelOverlap: false,
        data: expenseTypeData,
        emphasis: {
          label: {
            fontSize: '14',
            fontWeight: 'bold',
            show: true
          }
        },
        label: {
          position: 'center',
          show: false
        },
        labelLine: {
          show: false
        },
        name: '支出类型',
        radius: ['50%', '70%'],
        type: 'pie'
      }
    ],
    tooltip: {
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      trigger: 'item'
    }
  }));

  // 月度支出趋势堆叠折线图
  const { domRef: monthlyExpenseTrendRef, updateOptions: updateMonthlyTrend } = useEcharts(() => ({
    grid: {
      bottom: '10%',
      containLabel: true,
      left: '3%',
      right: '4%',
      top: '15%'
    },
    legend: {
      bottom: '0%',
      data: expenseTypes.map(type => type.label)
    },
    series: expenseTypes.map(type => ({
      areaStyle: {
        opacity: 0.6
      },
      data: monthlyExpenseData.map(item => item[type.value]),
      emphasis: {
        focus: 'series'
      },
      itemStyle: {
        color: type.color
      },
      name: type.label,
      stack: '总量',
      type: 'line'
    })),
    title: {
      left: 'center',
      text: `${selectedYear}年月度支出趋势`
    },
    tooltip: {
      formatter: params => {
        let result = `${params[0].name}<br/>`;
        let sum = 0;

        // 先计算总和
        params.forEach(param => {
          sum += param.value;
        });

        // 然后添加每个类型的值和百分比
        params.forEach(param => {
          const percentage = ((param.value / sum) * 100).toFixed(1);
          result += `${param.marker} ${param.seriesName}: ¥${param.value.toLocaleString()} (${percentage}%)<br/>`;
        });

        // 添加总额
        result += `<br/><strong>总计: ¥${sum.toLocaleString()}</strong>`;
        return result;
      },
      trigger: 'axis'
    },
    xAxis: {
      boundaryGap: false,
      data: monthlyExpenseData.map(item => item.month),
      type: 'category'
    },
    yAxis: {
      axisLabel: {
        formatter: value => `¥${value.toLocaleString()}`
      },
      type: 'value'
    }
  }));

  // 历史支出与收入对比折线图
  const { domRef: incomeExpenseCompareRef, updateOptions: updateIncomeExpenseCompare } = useEcharts(() => ({
    grid: {
      bottom: '10%',
      containLabel: true,
      left: '3%',
      right: '4%',
      top: '15%'
    },
    legend: {
      bottom: '0%',
      data: ['收入', '支出', '利润率']
    },
    series: [
      {
        data: chartData.map(item => item.income),
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#3f8600'
        },
        lineStyle: {
          width: 3
        },
        name: '收入',
        type: 'line'
      },
      {
        data: chartData.map(item => item.spending),
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#cf1322'
        },
        lineStyle: {
          width: 3
        },
        name: '支出',
        type: 'line'
      },
      {
        data: chartData.map(item => Math.round(((item.income - item.spending) / item.income) * 100)),
        itemStyle: {
          color: '#1890ff'
        },
        name: '利润率',
        symbol: 'circle',
        symbolSize: 8,
        type: 'line',
        yAxisIndex: 1
      }
    ],
    title: {
      left: 'center',
      text: `${selectedYear}年收支趋势`
    },
    tooltip: {
      axisPointer: {
        label: {
          backgroundColor: '#6a7985'
        },
        type: 'cross'
      },
      formatter: params => {
        const income = params.find(p => p.seriesName === '收入')?.value || 0;
        const expense = params.find(p => p.seriesName === '支出')?.value || 0;
        const profit = income - expense;
        const profitColor = profit >= 0 ? 'green' : 'red';

        return `${params[0].name}<br/>
                ${params[0].marker} 收入: ¥${income.toLocaleString()}<br/>
                ${params[1].marker} 支出: ¥${expense.toLocaleString()}<br/>
                <span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${profitColor};"></span>
                利润: <span style="color:${profitColor}">¥${profit.toLocaleString()}</span>`;
      },
      trigger: 'axis'
    },
    xAxis: {
      boundaryGap: false,
      data: chartData.map(item => item.month),
      type: 'category'
    },
    yAxis: [
      {
        axisLabel: {
          formatter: value => `¥${value.toLocaleString()}`
        },
        name: '金额',
        type: 'value'
      },
      {
        axisLabel: {
          formatter: '{value}%'
        },
        interval: 20,
        max: 100,
        min: 0,
        name: '利润率',
        type: 'value'
      }
    ]
  }));

  // 员工业绩列
  const employeeColumns = [
    {
      dataIndex: 'name',
      key: 'name',
      title: '姓名'
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

  // 支出类型明细表格列
  const expenseTypeColumns = [
    {
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div style={{ alignItems: 'center', display: 'flex' }}>
          <div
            style={{
              backgroundColor: record.itemStyle.color,
              borderRadius: '50%',
              height: 10,
              marginRight: 8,
              width: 10
            }}
          />
          {text}
        </div>
      ),
      title: '支出类型'
    },
    {
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => `¥${value.toLocaleString()}`,
      sorter: (a: any, b: any) => a.amount - b.amount,
      title: '金额'
    },
    {
      dataIndex: 'value',
      key: 'percentage',
      render: (value: number) => {
        const percentage = Math.round((value / totalExpense) * 100);
        return (
          <div style={{ width: '100%' }}>
            <Progress
              percent={percentage}
              size="small"
              status="active"
              strokeColor={
                expenseTypes.find(t => t.label === expenseTypeData.find(d => d.value === value)?.name)?.color
              }
            />
          </div>
        );
      },
      title: '占比'
    }
  ];

  // 财务图表
  const { domRef: financialChartRef, updateOptions } = useEcharts(
    () => ({
      grid: {
        bottom: '3%',
        containLabel: true,
        left: '3%',
        right: '4%'
      },
      legend: {
        data: ['收入', '支出', '利润']
      },
      series: [
        {
          data: chartData.map(item => item.income),
          emphasis: {
            focus: 'series'
          },
          name: '收入',
          type: 'bar'
        },
        {
          data: chartData.map(item => item.spending),
          emphasis: {
            focus: 'series'
          },
          name: '支出',
          type: 'bar'
        },
        {
          data: chartData.map(item => item.profit),
          emphasis: {
            focus: 'series'
          },
          name: '利润',
          type: 'bar'
        }
      ],
      tooltip: {
        axisPointer: {
          type: 'shadow'
        },
        trigger: 'axis'
      },
      xAxis: [
        {
          data: chartData.map(item => item.month),
          type: 'category'
        }
      ],
      yAxis: [
        {
          type: 'value'
        }
      ]
    }),
    {
      onUpdated: instance => {
        // 隐藏echarts自带的loading
        instance.hideLoading();
      }
    }
  );

  // 初始化图表方法
  const initChart = () => {
    setChartLoading(true);

    // 使用更长的延迟确保图表容器完全就绪
    setTimeout(() => {
      if (activeTab === 'dataChart') {
        updateOptions();
      } else if (activeTab === 'analysis') {
        updateExpenseTypePie();
        updateMonthlyTrend();
        updateIncomeExpenseCompare();
      }
      chartInitialized.current = true;
      setChartLoading(false);
    }, 800);
  };

  // 处理月份选择变化
  const handleMonthChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedMonth(date.month() + 1);
    }
  };

  // 处理年份选择变化
  const handleYearChange = (date: Dayjs | null, _dateString: string | string[]) => {
    if (date) {
      setSelectedYear(date.year());
    }
  };

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);

    // 当切换到数据图表或数据分析标签页时，初始化相应的图表
    if (isSuperAdminUser) {
      if (key === 'dataChart') {
        if (!chartInitialized.current) {
          initChart();
        } else {
          updateOptions();
        }
      } else if (key === 'analysis') {
        if (!chartInitialized.current) {
          initChart();
        } else {
          updateExpenseTypePie();
          updateMonthlyTrend();
          updateIncomeExpenseCompare();
        }
      }
    }
  };

  // 组件首次挂载和激活标签变化时初始化图表
  useEffect(() => {
    if (isSuperAdminUser && (activeTab === 'dataChart' || activeTab === 'analysis')) {
      initChart();
    }
    return undefined;
  }, [isSuperAdminUser, activeTab]);

  // 年份或月份变化时更新图表
  useEffect(() => {
    if (chartInitialized.current) {
      if (activeTab === 'dataChart') {
        setChartLoading(true);
        setTimeout(() => {
          updateOptions();
          setChartLoading(false);
        }, 300);
      } else if (activeTab === 'analysis') {
        setChartLoading(true);
        setTimeout(() => {
          updateExpenseTypePie();
          updateMonthlyTrend();
          updateIncomeExpenseCompare();
          setChartLoading(false);
        }, 300);
      }
    }
  }, [selectedYear, selectedMonth, activeTab]);

  // 财务看板Tab页配置
  const tabItems: TabsProps['items'] = [
    {
      children: (
        <div className="mt-4">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card variant="borderless">
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
    }
  ];

  // 仅超级管理员可见的数据图表标签页
  if (isSuperAdminUser) {
    tabItems.push({
      children: (
        <div className="mt-4">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                title={`${selectedYear}年财务数据图表`}
                variant="borderless"
                extra={
                  <DatePicker
                    allowClear={false}
                    picker="year"
                    value={selectedYear ? dayjs(selectedYear.toString()) : undefined}
                    onChange={handleYearChange}
                  />
                }
              >
                <div style={{ height: '400px', position: 'relative' }}>
                  {chartLoading && (
                    <div
                      style={{
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        left: 0,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        zIndex: 10
                      }}
                    >
                      <Spin
                        size="large"
                        tip="图表加载中..."
                      />
                    </div>
                  )}
                  <div
                    ref={financialChartRef}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
      key: 'dataChart',
      label: '数据图表'
    });

    // 仅超级管理员可见的数据分析标签页
    tabItems.push({
      children: (
        <div className="mt-4">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                title={`${selectedYear}年${selectedMonth}月财务分析`}
                variant="borderless"
                extra={
                  <Space>
                    <DatePicker
                      allowClear={false}
                      picker="year"
                      value={selectedYear ? dayjs(selectedYear.toString()) : undefined}
                      onChange={handleYearChange}
                    />
                    <DatePicker
                      allowClear={false}
                      picker="month"
                      value={dayjs(`${selectedYear}-${selectedMonth}`)}
                      onChange={handleMonthChange}
                    />
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      precision={2}
                      prefix="¥"
                      title="本月收入"
                      value={chartData[selectedMonth - 1]?.income || 0}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      precision={2}
                      prefix="¥"
                      title="本月支出"
                      value={totalExpense}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      precision={2}
                      prefix="¥"
                      title="本月利润"
                      value={(chartData[selectedMonth - 1]?.income || 0) - totalExpense}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={12}>
              <Card
                title="支出类型分布"
                variant="borderless"
              >
                <div style={{ height: '400px', position: 'relative' }}>
                  {chartLoading && (
                    <div
                      style={{
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        left: 0,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        zIndex: 10
                      }}
                    >
                      <Spin
                        size="large"
                        tip="图表加载中..."
                      />
                    </div>
                  )}
                  <div
                    ref={expenseTypePieRef}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </Card>
            </Col>

            <Col span={12}>
              <Card
                title="支出类型明细"
                variant="borderless"
              >
                <Table
                  columns={expenseTypeColumns}
                  dataSource={expenseTypeData}
                  pagination={false}
                  rowKey="type"
                  size="middle"
                />
              </Card>
            </Col>

            <Col span={24}>
              <Card
                title="月度支出趋势分析"
                variant="borderless"
              >
                <div style={{ height: '400px', position: 'relative' }}>
                  {chartLoading && (
                    <div
                      style={{
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        left: 0,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        zIndex: 10
                      }}
                    >
                      <Spin
                        size="large"
                        tip="图表加载中..."
                      />
                    </div>
                  )}
                  <div
                    ref={monthlyExpenseTrendRef}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </Card>
            </Col>

            <Col span={24}>
              <Card
                title="收支趋势分析"
                variant="borderless"
              >
                <div style={{ height: '400px', position: 'relative' }}>
                  {chartLoading && (
                    <div
                      style={{
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        left: 0,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        zIndex: 10
                      }}
                    >
                      <Spin
                        size="large"
                        tip="图表加载中..."
                      />
                    </div>
                  )}
                  <div
                    ref={incomeExpenseCompareRef}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
      key: 'analysis',
      label: '数据分析'
    });
  }

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        className="h-full"
        title="财务看板"
        variant="borderless"
      >
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={handleTabChange}
        />
      </Card>
    </div>
  );
};

export default FinanceDashboard;
