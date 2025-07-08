import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Popconfirm, Row, Space, Spin, Statistic, Table, Tabs, message } from 'antd';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useEcharts } from '@/hooks/common/echarts';
import { financialService, statisticsService } from '@/service/api';
import type { FinancialRecord } from '@/service/api/financial';
import type { EmployeePerformance } from '@/service/api/statistics';
import { isSuperAdmin } from '@/utils/auth';

import FinancialRecordModal from './components/FinancialRecordModal';

// 支出类型数据
const expenseTypes = [
  { color: '#5470c6', label: '差旅费', value: 'travel' },
  { color: '#fac858', label: '住宿费', value: 'accommodation' },
  { color: '#ee6666', label: '办公费', value: 'office_supplies' },
  { color: '#73c0de', label: '餐费', value: 'meal' },
  { color: '#3ba272', label: '招待费', value: 'entertainment' },
  { color: '#fc8452', label: '培训费', value: 'training' },
  { color: '#9a60b4', label: '话费', value: 'phone' },
  { color: '#ea7ccc', label: '物业费', value: 'property' },
  { color: '#5d6c8c', label: '其他', value: 'other' },
  // 新增支出类型
  { color: '#f5222d', label: '房租', value: 'rent' },
  { color: '#faad14', label: '水电费', value: 'utilities' },
  { color: '#52c41a', label: '团建', value: 'team_building' },
  { color: '#1890ff', label: '工资', value: 'salary' },
  { color: '#722ed1', label: '社保', value: 'social_insurance' },
  { color: '#13c2c2', label: '补培训费', value: 'training_supplement' },
  // 添加数据库中存在的中文分类
  { color: '#eb2f96', label: '设备采购', value: '设备采购' }
];

// 收入类型数据
const incomeTypes = [
  { color: '#52c41a', label: '培训收入', value: 'training_income' },
  { color: '#1890ff', label: '项目收入', value: 'project_income' },
  { color: '#722ed1', label: '咨询收入', value: 'consulting_income' },
  { color: '#faad14', label: '其他收入', value: 'other_income' },
  // 新增收入类型
  { color: '#eb2f96', label: '返佣费', value: 'commission_income' }
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

  // 员工业绩数据状态
  const [employeeData, setEmployeeData] = useState<EmployeePerformance[]>([]);
  const [employeeDataLoading, setEmployeeDataLoading] = useState(false);

  // 真实财务数据状态
  const [realChartData, setRealChartData] = useState<any[]>([]);
  const [realExpenseTypeData, setRealExpenseTypeData] = useState<any[]>([]);
  const [realIncomeTypeData, setRealIncomeTypeData] = useState<any[]>([]);
  const [realMonthlyExpenseData, setRealMonthlyExpenseData] = useState<any[]>([]);
  const [expenseRecords, setExpenseRecords] = useState<FinancialRecord[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<FinancialRecord[]>([]);

  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalRecordType, setModalRecordType] = useState<1 | 2>(2); // 1: 收入, 2: 支出
  const [editRecord, setEditRecord] = useState<FinancialRecord | null>(null);

  // 分页状态
  const [incomePagination, setIncomePagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });
  const [expensePagination, setExpensePagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });

  // 获取员工业绩数据
  const fetchEmployeePerformance = async () => {
    setEmployeeDataLoading(true);
    try {
      const data = await statisticsService.getEmployeePerformance({
        month: selectedMonth,
        timeRange: 'month',
        year: selectedYear
      });
      setEmployeeData(data);
    } catch (error) {
    } finally {
      setEmployeeDataLoading(false);
    }
  };

  // 获取真实财务数据
  const fetchRealFinancialData = async () => {
    setChartLoading(true);
    try {
      const [
        monthlyTrendResponse,
        expenseDistributionResponse,
        incomeDistributionResponse,
        expenseRecordsResponse,
        incomeRecordsResponse
      ] = await Promise.all([
        financialService.getMonthlyTrend({ year: selectedYear }),
        financialService.getExpenseTypeDistribution({ month: selectedMonth, year: selectedYear }),
        // 获取收入分布数据
        financialService.getIncomeTypeDistribution({ month: selectedMonth, year: selectedYear }),
        // 获取支出记录
        financialService.getFinancialRecords({
          current: expensePagination.current,
          size: expensePagination.pageSize,
          type: 2
        }),
        // 获取收入记录
        financialService.getFinancialRecords({
          current: incomePagination.current,
          size: incomePagination.pageSize,
          type: 1
        })
      ]);

      // 处理月度趋势数据
      if (monthlyTrendResponse && Array.isArray(monthlyTrendResponse)) {
        setRealChartData(monthlyTrendResponse);
        setRealMonthlyExpenseData(monthlyTrendResponse);
      } else {
        setRealChartData([]);
        setRealMonthlyExpenseData([]);
      }

      // 处理支出类型分布数据
      if (expenseDistributionResponse && Array.isArray(expenseDistributionResponse)) {
        const formattedExpenseData = expenseDistributionResponse.map(item => ({
          amount: item.amount,
          itemStyle: {
            color: item.color
          },
          name: item.category,
          type: item.category,
          value: item.amount
        }));
        setRealExpenseTypeData(formattedExpenseData);
      } else {
        setRealExpenseTypeData([]);
      }

      // 处理收入类型分布数据
      if (incomeDistributionResponse && Array.isArray(incomeDistributionResponse)) {
        const formattedIncomeData = incomeDistributionResponse.map(item => ({
          amount: item.amount,
          itemStyle: {
            color: item.color
          },
          name: item.category,
          type: item.category,
          value: item.amount
        }));
        setRealIncomeTypeData(formattedIncomeData);
      } else {
        setRealIncomeTypeData([]);
      }

      // 处理支出记录数据
      if (expenseRecordsResponse && expenseRecordsResponse.records) {
        setExpenseRecords(expenseRecordsResponse.records);
        setExpensePagination(prev => ({
          ...prev,
          total: expenseRecordsResponse.total
        }));
      } else {
        setExpenseRecords([]);
        setExpensePagination(prev => ({ ...prev, total: 0 }));
      }

      // 处理收入记录数据
      if (incomeRecordsResponse && incomeRecordsResponse.records) {
        setIncomeRecords(incomeRecordsResponse.records);
        setIncomePagination(prev => ({
          ...prev,
          total: incomeRecordsResponse.total
        }));
      } else {
        setIncomeRecords([]);
        setIncomePagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (error) {
      // 如果获取失败，设置空数据
      setRealChartData([]);
      setRealExpenseTypeData([]);
      setRealIncomeTypeData([]);
      setRealMonthlyExpenseData([]);
      // 设置空的记录数组
      setExpenseRecords([]);
      setIncomeRecords([]);
    } finally {
      setChartLoading(false);
    }
  };

  // 弹窗操作函数
  const handleCreateIncomeRecord = () => {
    setModalMode('create');
    setModalRecordType(1); // 收入
    setEditRecord(null);
    setModalVisible(true);
  };

  const handleCreateExpenseRecord = () => {
    setModalMode('create');
    setModalRecordType(2); // 支出
    setEditRecord(null);
    setModalVisible(true);
  };

  const handleEditRecord = (record: FinancialRecord) => {
    setModalMode('edit');
    setModalRecordType(record.type as 1 | 2);
    setEditRecord(record);
    setModalVisible(true);
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      await financialService.deleteFinancialRecord(id);
      message.success('删除成功');
      // 重新获取数据
      await fetchRealFinancialData();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleModalSuccess = async () => {
    // 重新获取数据
    await fetchRealFinancialData();
  };

  // 分页处理函数
  const handleIncomePageChange = (page: number, pageSize?: number) => {
    setIncomePagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
  };

  const handleExpensePageChange = (page: number, pageSize?: number) => {
    setExpensePagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
  };

  // 使用真实月度支出数据
  const _monthlyExpenseData = realMonthlyExpenseData;

  // 使用真实数据（仅当月数据）
  const _chartData = realChartData;
  const expenseTypeData = realExpenseTypeData;
  const incomeTypeData = realIncomeTypeData;

  // 计算当月总支出
  const totalExpense = useMemo(() => {
    const total = expenseTypeData.reduce((sum, item) => sum + item.value, 0);
    return total;
  }, [expenseTypeData]);

  // 计算当月总收入
  const totalIncome = useMemo(() => {
    const total = incomeTypeData.reduce((sum, item) => sum + item.value, 0);
    return total;
  }, [incomeTypeData]);

  // 饼图配置 - 支出类型分布
  const { domRef: expenseTypePieRef, updateOptions: updateExpenseTypePie } = useEcharts(() => {
    return {
      legend: {
        data: expenseTypeData.map(item => item.name),
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
        formatter: '{a} <br/>{b}: ¥{c} ({d}%)',
        trigger: 'item'
      }
    };
  });

  // 饼图配置 - 收入类型分布
  const { domRef: incomeTypePieRef, updateOptions: updateIncomeTypePie } = useEcharts(() => {
    return {
      legend: {
        data: incomeTypeData.map(item => item.name),
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [
        {
          avoidLabelOverlap: false,
          data: incomeTypeData,
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
          name: '收入类型',
          radius: ['50%', '70%'],
          type: 'pie'
        }
      ],
      tooltip: {
        formatter: '{a} <br/>{b}: ¥{c} ({d}%)',
        trigger: 'item'
      }
    };
  });

  // 月度支出趋势堆叠折线图
  const { domRef: monthlyExpenseTrendRef, updateOptions: updateMonthlyTrend } = useEcharts(() => {
    return {
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
        data: realChartData.map(item => item[type.value] || 0),
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
        formatter: (params: any) => {
          let result = `${params[0].name}<br/>`;
          let sum = 0;

          // 先计算总和
          params.forEach((param: any) => {
            sum += param.value;
          });

          // 然后添加每个类型的值和百分比
          params.forEach((param: any) => {
            const percentage = sum > 0 ? ((param.value / sum) * 100).toFixed(1) : '0.0';
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
        data: realChartData.map(item => item.month),
        type: 'category'
      },
      yAxis: {
        axisLabel: {
          formatter: (value: number) => `¥${value.toLocaleString()}`
        },
        type: 'value'
      }
    };
  });

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
      dataIndex: 'trainingFeeAmount',
      key: 'trainingFeeAmount',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '培训费收入'
    },
    {
      dataIndex: 'taskAmount',
      key: 'taskAmount',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '项目收入'
    },
    {
      dataIndex: 'totalPerformance',
      key: 'totalPerformance',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '总业绩'
    }
  ];

  // 支出类型明细表格列
  const expenseTypeColumns = [
    {
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        // 先尝试通过value匹配，再尝试通过label匹配
        let expenseType = expenseTypes.find(type => type.value === category);
        if (!expenseType) {
          expenseType = expenseTypes.find(type => type.label === category);
        }
        return (
          <div style={{ alignItems: 'center', display: 'flex' }}>
            <div
              style={{
                backgroundColor: expenseType?.color || '#ee6666',
                borderRadius: '50%',
                height: 10,
                marginRight: 8,
                width: 10
              }}
            />
            {expenseType?.label || category}
          </div>
        );
      },
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
      dataIndex: 'recordDate',
      key: 'recordDate',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
      sorter: (a: any, b: any) => dayjs(a.recordDate).valueOf() - dayjs(b.recordDate).valueOf(),
      title: '支出日期',
      width: 150
    },
    {
      dataIndex: 'description',
      key: 'description',
      title: '描述'
    },
    {
      key: 'action',
      render: (_: string, record: FinancialRecord) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => handleEditRecord(record)}
          >
            编辑
          </Button>
          <Popconfirm
            cancelText="取消"
            okText="确定"
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDeleteRecord(record.id)}
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
        </Space>
      ),
      title: '操作',
      width: 120
    }
  ];

  // 收入类型明细表格列
  const incomeTypeColumns = [
    {
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        // 先尝试通过value匹配，再尝试通过label匹配
        let incomeType = incomeTypes.find(type => type.value === category);
        if (!incomeType) {
          incomeType = incomeTypes.find(type => type.label === category);
        }
        return (
          <div style={{ alignItems: 'center', display: 'flex' }}>
            <div
              style={{
                backgroundColor: incomeType?.color || '#52c41a',
                borderRadius: '50%',
                height: 10,
                marginRight: 8,
                width: 10
              }}
            />
            {incomeType?.label || category}
          </div>
        );
      },
      title: '收入类型'
    },
    {
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => `¥${value.toLocaleString()}`,
      sorter: (a: any, b: any) => a.amount - b.amount,
      title: '金额'
    },
    {
      dataIndex: 'recordDate',
      key: 'recordDate',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
      sorter: (a: any, b: any) => dayjs(a.recordDate).valueOf() - dayjs(b.recordDate).valueOf(),
      title: '收入日期',
      width: 150
    },
    {
      dataIndex: 'description',
      key: 'description',
      title: '描述'
    },
    {
      key: 'action',
      render: (_: string, record: FinancialRecord) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => handleEditRecord(record)}
          >
            编辑
          </Button>
          <Popconfirm
            cancelText="取消"
            okText="确定"
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDeleteRecord(record.id)}
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
        </Space>
      ),
      title: '操作',
      width: 120
    }
  ];

  // 财务图表
  const { domRef: financialChartRef, updateOptions } = useEcharts(
    () => {
      return {
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
            data: realChartData.map(item => item.income),
            emphasis: {
              focus: 'series'
            },
            name: '收入',
            type: 'bar'
          },
          {
            data: realChartData.map(item => item.expense),
            emphasis: {
              focus: 'series'
            },
            name: '支出',
            type: 'bar'
          },
          {
            data: realChartData.map(item => item.profit),
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
            data: realChartData.map(item => item.month),
            type: 'category'
          }
        ],
        yAxis: [
          {
            type: 'value'
          }
        ]
      };
    },
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
        updateOptions(() => ({
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
              data: realChartData.map(item => item.income),
              emphasis: {
                focus: 'series'
              },
              name: '收入',
              type: 'bar'
            },
            {
              data: realChartData.map(item => item.expense),
              emphasis: {
                focus: 'series'
              },
              name: '支出',
              type: 'bar'
            },
            {
              data: realChartData.map(item => item.profit),
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
              data: realChartData.map(item => item.month),
              type: 'category'
            }
          ],
          yAxis: [
            {
              type: 'value'
            }
          ]
        }));
      } else if (activeTab === 'analysis') {
        updateExpenseTypePie();
        updateIncomeTypePie();
        updateMonthlyTrend();
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
          updateIncomeTypePie();
          updateMonthlyTrend();
        }
      }
    }
  };

  // 组件首次挂载和激活标签变化时初始化图表
  useEffect(() => {
    if (isSuperAdminUser && (activeTab === 'dataChart' || activeTab === 'analysis')) {
      // 获取真实财务数据
      fetchRealFinancialData().then(() => {
        initChart();
      });
    }
    // 获取员工业绩数据
    if (activeTab === 'employee') {
      fetchEmployeePerformance();
    }
    return undefined;
  }, [isSuperAdminUser, activeTab]);

  // 年份或月份变化时重新获取数据
  useEffect(() => {
    if (isSuperAdminUser && (activeTab === 'dataChart' || activeTab === 'analysis')) {
      fetchRealFinancialData();
    }
    // 员工业绩数据也需要在年份/月份变化时重新获取
    if (activeTab === 'employee') {
      fetchEmployeePerformance();
    }
  }, [selectedYear, selectedMonth, isSuperAdminUser, activeTab]);

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
          updateIncomeTypePie();
          updateMonthlyTrend();
          setChartLoading(false);
        }, 300);
      }
    }
  }, [selectedYear, selectedMonth, activeTab]);

  // 分页状态变化时重新获取数据
  useEffect(() => {
    if (isSuperAdminUser && (activeTab === 'dataChart' || activeTab === 'analysis')) {
      fetchRealFinancialData();
    }
  }, [incomePagination.current, incomePagination.pageSize, expensePagination.current, expensePagination.pageSize]);

  // 当真实数据变化时更新图表
  useEffect(() => {
    if (activeTab === 'analysis') {
      // 强制更新饼图
      setTimeout(() => {
        // 更新支出饼图
        if (realExpenseTypeData.length > 0) {
          updateExpenseTypePie(() => ({
            legend: {
              data: realExpenseTypeData.map(item => item.name),
              orient: 'vertical',
              right: 10,
              top: 'center'
            },
            series: [
              {
                avoidLabelOverlap: false,
                data: realExpenseTypeData,
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
              formatter: '{a} <br/>{b}: ¥{c} ({d}%)',
              trigger: 'item'
            }
          }));
        }

        // 更新收入饼图
        if (realIncomeTypeData.length > 0) {
          updateIncomeTypePie(() => ({
            legend: {
              data: realIncomeTypeData.map(item => item.name),
              orient: 'vertical',
              right: 10,
              top: 'center'
            },
            series: [
              {
                avoidLabelOverlap: false,
                data: realIncomeTypeData,
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
                name: '收入类型',
                radius: ['50%', '70%'],
                type: 'pie'
              }
            ],
            tooltip: {
              formatter: '{a} <br/>{b}: ¥{c} ({d}%)',
              trigger: 'item'
            }
          }));
        }

        // 更新月度支出趋势图表
        if (realChartData.length > 0) {
          updateMonthlyTrend(() => ({
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
              data: realChartData.map(item => item[type.value] || 0),
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
              confine: true,
              enterable: true,
              extraCssText: 'max-height: 300px; overflow-y: auto; max-width: 350px;',
              formatter: (params: any) => {
                let result = `<div style="padding: 8px;"><strong>${params[0].name}</strong><br/>`;
                let sum = 0;

                // 先计算总和
                params.forEach((param: any) => {
                  sum += param.value;
                });

                // 只显示有值的类型，限制最多显示6个
                const validParams = params.filter((param: any) => param.value > 0);
                const displayParams = validParams.slice(0, 6);

                displayParams.forEach((param: any) => {
                  const percentage = sum > 0 ? ((param.value / sum) * 100).toFixed(1) : '0.0';
                  result += `<div style="margin: 2px 0;">${param.marker} ${param.seriesName}: ¥${param.value.toLocaleString()} (${percentage}%)</div>`;
                });

                // 如果有更多项目，显示省略提示
                if (validParams.length > 6) {
                  result += `<div style="margin: 4px 0; color: #999; font-style: italic;">...及其他${validParams.length - 6}项</div>`;
                }

                // 添加总额
                result += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;"><strong>总计: ¥${sum.toLocaleString()}</strong></div></div>`;
                return result;
              },
              position: ['50%', '10%'],
              trigger: 'axis'
            },
            xAxis: {
              boundaryGap: false,
              data: realChartData.map(item => item.month),
              type: 'category'
            },
            yAxis: {
              axisLabel: {
                formatter: (value: number) => `¥${value.toLocaleString()}`
              },
              type: 'value'
            }
          }));
        }
      }, 100);
    } else if (activeTab === 'dataChart') {
      // 更新年度财务图表
      if (realChartData.length > 0) {
        setTimeout(() => {
          updateOptions(() => ({
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
                data: realChartData.map(item => item.income),
                emphasis: {
                  focus: 'series'
                },
                name: '收入',
                type: 'bar'
              },
              {
                data: realChartData.map(item => item.expense),
                emphasis: {
                  focus: 'series'
                },
                name: '支出',
                type: 'bar'
              },
              {
                data: realChartData.map(item => item.profit),
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
                data: realChartData.map(item => item.month),
                type: 'category'
              }
            ],
            yAxis: [
              {
                type: 'value'
              }
            ]
          }));
        }, 100);
      }
    }
  }, [realExpenseTypeData, realIncomeTypeData, realChartData, activeTab]);

  // 财务看板Tab页配置
  const tabItems: TabsProps['items'] = [
    {
      children: (
        <div className="mt-4">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                title={`${selectedYear}年${selectedMonth}月员工业绩排名`}
                variant="borderless"
                extra={
                  <DatePicker
                    allowClear={false}
                    picker="month"
                    value={dayjs(`${selectedYear}-${selectedMonth}`)}
                    onChange={date => {
                      if (date) {
                        setSelectedYear(date.year());
                        setSelectedMonth(date.month() + 1);
                      }
                    }}
                  />
                }
              >
                <Table
                  columns={employeeColumns}
                  dataSource={employeeData}
                  loading={employeeDataLoading}
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
                  <DatePicker
                    allowClear={false}
                    picker="month"
                    value={dayjs(`${selectedYear}-${selectedMonth}`)}
                    onChange={handleMonthChange}
                  />
                }
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      precision={2}
                      prefix="¥"
                      title="本月收入"
                      value={totalIncome}
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
                      value={totalIncome - totalExpense}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={12}>
              <Card
                title="收入类型分布"
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
                    ref={incomeTypePieRef}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
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
                title="收入类型明细"
                variant="borderless"
                extra={
                  <Button
                    icon={<PlusOutlined />}
                    type="primary"
                    onClick={handleCreateIncomeRecord}
                  >
                    新增收入记录
                  </Button>
                }
              >
                <Table
                  columns={incomeTypeColumns}
                  dataSource={incomeRecords}
                  rowKey="id"
                  size="middle"
                  pagination={{
                    current: incomePagination.current,
                    onChange: handleIncomePageChange,
                    onShowSizeChange: handleIncomePageChange,
                    pageSize: incomePagination.pageSize,
                    pageSizeOptions: ['5', '10', '20', '50'],
                    showQuickJumper: true,
                    showSizeChanger: true,
                    showTotal: (total, range) => `共 ${total} 条，第 ${range[0]}-${range[1]} 条`,
                    total: incomePagination.total
                  }}
                />
              </Card>
            </Col>

            <Col span={12}>
              <Card
                title="支出类型明细"
                variant="borderless"
                extra={
                  <Button
                    icon={<PlusOutlined />}
                    type="primary"
                    onClick={handleCreateExpenseRecord}
                  >
                    新增支出记录
                  </Button>
                }
              >
                <Table
                  columns={expenseTypeColumns}
                  dataSource={expenseRecords}
                  rowKey="id"
                  size="middle"
                  pagination={{
                    current: expensePagination.current,
                    onChange: handleExpensePageChange,
                    onShowSizeChange: handleExpensePageChange,
                    pageSize: expensePagination.pageSize,
                    pageSizeOptions: ['5', '10', '20', '50'],
                    showQuickJumper: true,
                    showSizeChanger: true,
                    showTotal: (total, range) => `共 ${total} 条，第 ${range[0]}-${range[1]} 条`,
                    total: expensePagination.total
                  }}
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

      {/* 财务记录弹窗 */}
      <FinancialRecordModal
        mode={modalMode}
        record={editRecord}
        recordType={modalRecordType}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default FinanceDashboard;
