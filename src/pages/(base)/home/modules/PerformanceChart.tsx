import { Card, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useEffect, useState } from 'react';

import { useEcharts } from '@/hooks/common/echarts';
import { type CustomerApi, customerService } from '@/service/api';
import { isSuperAdmin } from '@/utils/auth';
import { localStg } from '@/utils/storage';

// 客户跟进状态枚举 - 根据实际数据更新
enum FollowUpStatus {
  ARRIVED = 'arrived',           // 已实到
  CONSULT = 'consult',          // 咨询中
  EFFECTIVE_VISIT = 'effective_visit', // 有效回访
  NEW_DEVELOP = 'new_develop',   // 新开发
  NOT_ARRIVED = 'not_arrived',   // 未实到
  REGISTERED = 'registered',     // 已报名
  WECHAT_ADDED = 'wechat_added', // 已加微信
  EARLY_25 = 'early_25'         // 25日前
}

// 跟进状态中文映射
const followUpStatusNames = {
  [FollowUpStatus.ARRIVED]: '已实到',
  [FollowUpStatus.CONSULT]: '咨询中',
  [FollowUpStatus.EFFECTIVE_VISIT]: '有效回访',
  [FollowUpStatus.NEW_DEVELOP]: '新开发',
  [FollowUpStatus.NOT_ARRIVED]: '未实到',
  [FollowUpStatus.REGISTERED]: '已报名',
  [FollowUpStatus.WECHAT_ADDED]: '已加微信',
  [FollowUpStatus.EARLY_25]: '早25'
};

// 跟进状态颜色映射
const followUpStatusColors = [
  '#5B8FF9',
  '#5AD8A6',
  '#5D7092',
  '#F6BD16',
  '#E8684A',
  '#6DC8EC',
  '#9270CA',
  '#FF9D4D',
  '#269A99',
  '#FF99C3'
];

const PerformanceChart = () => {
  const [activeTab, setActiveTab] = useState<string>('clientSource');
  const [customerData, setCustomerData] = useState<CustomerApi.CustomerListItem[]>([]);

  // 获取用户信息
  const userInfo = localStg.get('userInfo');
  const isAdmin = isSuperAdmin() || userInfo?.userName === 'admin';

  // 获取客户数据
  const fetchCustomerData = async () => {
    try {
      // 根据用户角色决定获取数据的范围
      const scope = isAdmin ? 'all' : 'own';

      const response = await customerService.getCustomerList({
        current: 1,
        scope,
        // 获取所有数据用于统计
        size: 1000
      });

      console.log('🔍 客户数据详情:', response.records);

      // 打印所有不同的 followStatus 值
      const statusValues = [...new Set(response.records.map(customer => customer.followStatus))];
      console.log('🔍 所有跟进状态值:', statusValues);

      setCustomerData(response.records);
    } catch (error) {
      console.error('获取客户数据失败:', error);
    }
  };

  // 统计客户跟进状态
  const getCustomerStatistics = () => {
    const stats = customerData.reduce(
      (acc, customer) => {
        const status = customer.followStatus || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('🔍 统计结果:', stats);

    const result = Object.entries(stats).map(([status, count], index) => {
      // 获取状态的中文名称，如果未定义则使用原状态值
      const displayName = followUpStatusNames[status as keyof typeof followUpStatusNames] || status;

      return {
        itemStyle: {
          color: followUpStatusColors[index % followUpStatusColors.length]
        },
        name: displayName,
        value: count
      };
    });

    console.log('🔍 图表数据:', result);
    console.log('🔍 客户数据总数:', customerData.length);

    return result;
  };

  // 客户统计图
  const { domRef: clientSourceRef, updateOptions: updateClientSourceChart } = useEcharts(() => {
    console.log('🔍 useEcharts 初始化回调执行，customerData.length:', customerData.length);

    if (customerData.length === 0) {
      return {
        title: {
          left: 'center',
          text: '暂无数据',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          },
          top: 20
        }
      };
    }

    const statisticsData = getCustomerStatistics();
    const legendData = statisticsData.map(item => item.name);

    return {
      legend: {
        data: legendData,
        orient: 'vertical' as const,
        right: 10,
        top: 'center'
      },
      series: [
        {
          avoidLabelOverlap: false,
          data: statisticsData,
          emphasis: {
            label: {
              fontSize: '14',
              fontWeight: 'bold' as const,
              show: true
            }
          },
          label: {
            show: false
          },
          labelLine: {
            show: false
          },
          name: isAdmin ? '全部客户统计' : '我的客户统计',
          radius: ['50%', '70%'],
          type: 'pie' as const
        }
      ],
      title: {
        left: 'center',
        text: isAdmin ? '全部客户统计' : '我的客户统计',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold' as const
        },
        top: 20
      },
      tooltip: {
        formatter: '{b}: {c} ({d}%)',
        trigger: 'item' as const
      }
    };
  });

  // 业绩趋势图 - 月度
  const { domRef: monthPerformanceRef, updateOptions: updateMonthChart } = useEcharts(() => ({
    grid: {
      bottom: '3%',
      containLabel: true,
      left: '3%',
      right: '4%'
    },
    legend: {
      data: ['目标业绩', '实际业绩']
    },
    series: [
      {
        data: [120000, 130000, 140000, 150000, 160000, 170000],
        emphasis: {
          focus: 'series'
        },
        name: '目标业绩',
        stack: '业绩',
        type: 'bar'
      },
      {
        data: [125000, 132000, 141000, 154000, 165000, 172000],
        emphasis: {
          focus: 'series'
        },
        name: '实际业绩',
        stack: '业绩',
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
        data: ['1月', '2月', '3月', '4月', '5月', '6月'],
        type: 'category'
      }
    ],
    yAxis: [
      {
        axisLabel: {
          formatter: '¥{value}'
        },
        type: 'value'
      }
    ]
  }));

  // 业绩趋势图 - 季度
  const { domRef: quarterPerformanceRef, updateOptions: updateQuarterChart } = useEcharts(() => ({
    grid: {
      bottom: '3%',
      containLabel: true,
      left: '3%',
      right: '4%'
    },
    legend: {
      data: ['目标业绩', '实际业绩']
    },
    series: [
      {
        data: [390000, 480000, 520000, 580000],
        emphasis: {
          focus: 'series'
        },
        name: '目标业绩',
        type: 'bar'
      },
      {
        data: [398000, 491000, 534000, 590000],
        emphasis: {
          focus: 'series'
        },
        name: '实际业绩',
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
        data: ['Q1', 'Q2', 'Q3', 'Q4'],
        type: 'category'
      }
    ],
    yAxis: [
      {
        axisLabel: {
          formatter: '¥{value}'
        },
        type: 'value'
      }
    ]
  }));

  // 业绩趋势图 - 年度
  const { domRef: yearPerformanceRef, updateOptions: updateYearChart } = useEcharts(() => ({
    grid: {
      bottom: '3%',
      containLabel: true,
      left: '3%',
      right: '4%'
    },
    legend: {
      data: ['目标业绩', '实际业绩', '增长率']
    },
    series: [
      {
        data: [1500000, 1800000, 2100000, 2350000, 2600000],
        emphasis: {
          focus: 'series'
        },
        name: '目标业绩',
        type: 'bar'
      },
      {
        data: [1520000, 1750000, 2180000, 2410000, 2680000],
        emphasis: {
          focus: 'series'
        },
        name: '实际业绩',
        type: 'bar'
      },
      {
        data: [0, 15.1, 24.6, 10.6, 11.2],
        emphasis: {
          focus: 'series'
        },
        name: '增长率',
        type: 'line',
        yAxisIndex: 1
      }
    ],
    tooltip: {
      axisPointer: {
        type: 'line'
      },
      trigger: 'axis'
    },
    xAxis: [
      {
        data: ['2019', '2020', '2021', '2022', '2023'],
        type: 'category'
      }
    ],
    yAxis: [
      {
        axisLabel: {
          formatter: '¥{value}'
        },
        name: '业绩',
        type: 'value'
      },
      {
        axisLabel: {
          formatter: '{value}%'
        },
        name: '增长率',
        position: 'right',
        type: 'value'
      }
    ]
  }));

  useEffect(() => {
    // 初始化数据加载
    fetchCustomerData();
  }, []);

  useEffect(() => {
    console.log('🔍 useEffect 触发，activeTab:', activeTab, 'customerData.length:', customerData.length);

    switch (activeTab) {
      case 'clientSource':
        if (customerData.length > 0) {
          console.log('🔍 准备更新客户统计图表');

          // 使用 updateOptions 重新生成图表配置
          updateClientSourceChart(() => {
            const statisticsData = getCustomerStatistics();
            const legendData = statisticsData.map(item => item.name);

            const chartOptions = {
              legend: {
                data: legendData,
                orient: 'vertical' as const,
                right: 10,
                top: 'center'
              },
              series: [
                {
                  avoidLabelOverlap: false,
                  data: statisticsData,
                  emphasis: {
                    label: {
                      fontSize: '14',
                      fontWeight: 'bold' as const,
                      show: true
                    }
                  },
                  label: {
                    show: false
                  },
                  labelLine: {
                    show: false
                  },
                  name: isAdmin ? '全部客户统计' : '我的客户统计',
                  radius: ['50%', '70%'],
                  type: 'pie' as const
                }
              ],
              title: {
                left: 'center',
                text: isAdmin ? '全部客户统计' : '我的客户统计',
                textStyle: {
                  fontSize: 16,
                  fontWeight: 'bold' as const
                },
                top: 20
              },
              tooltip: {
                formatter: '{b}: {c} ({d}%)',
                trigger: 'item' as const
              }
            };

            console.log('🔍 图表更新配置:', chartOptions);
            return chartOptions;
          });
        } else {
          console.log('🔍 客户数据为空，跳过图表更新');
        }
        break;
      case 'month':
        updateMonthChart();
        break;
      case 'quarter':
        updateQuarterChart();
        break;
      case 'year':
        updateYearChart();
        break;
      default:
        break;
    }
  }, [activeTab, customerData, updateClientSourceChart, updateMonthChart, updateQuarterChart, updateYearChart, isAdmin]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const items: TabsProps['items'] = [
    {
      children: (
        <div style={{ height: '300px' }}>
          <div
            ref={clientSourceRef}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      ),
      key: 'clientSource',
      label: '客户统计'
    },
    {
      children: (
        <div style={{ height: '300px' }}>
          <div
            ref={monthPerformanceRef}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      ),
      key: 'month',
      label: '月度业绩'
    },
    {
      children: (
        <div style={{ height: '300px' }}>
          <div
            ref={quarterPerformanceRef}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      ),
      key: 'quarter',
      label: '季度业绩'
    },
    {
      children: (
        <div style={{ height: '300px' }}>
          <div
            ref={yearPerformanceRef}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      ),
      key: 'year',
      label: '年度业绩'
    }
  ];

  return (
    <Card
      className="card-wrapper"
      title="客户与业绩统计"
      variant="borderless"
    >
      <Tabs
        activeKey={activeTab}
        items={items}
        onChange={handleTabChange}
      />
    </Card>
  );
};

export default PerformanceChart;
