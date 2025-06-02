import { Card, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useEffect, useState } from 'react';

import { useEcharts } from '@/hooks/common/echarts';

const PerformanceChart = () => {
  const [activeTab, setActiveTab] = useState<string>('month');

  // 客户统计图
  const { domRef: clientSourceRef, updateOptions: updateClientSourceChart } = useEcharts(() => ({
    legend: {
      data: ['已实到', '咨询', '早25客户', '有效回访', '新开发', '未实到', '已报名', '未通过', '大客户', '已加微信'],
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        avoidLabelOverlap: false,
        data: [
          { name: '已实到', value: 20 },
          { name: '咨询', value: 49 },
          { name: '早25客户', value: 13 },
          { name: '有效回访', value: 40 },
          { name: '新开发', value: 37 },
          { name: '未实到', value: 10 },
          { name: '已报名', value: 36 },
          { name: '未通过', value: 28 },
          { name: '大客户', value: 29 },
          { name: '已加微信', value: 46 }
        ],
        emphasis: {
          label: {
            fontSize: '14',
            fontWeight: 'bold',
            show: true
          }
        },
        label: {
          show: false
        },
        labelLine: {
          show: false
        },
        name: '客户统计',
        radius: ['50%', '70%'],
        type: 'pie'
      }
    ],
    tooltip: {
      formatter: '{b}: {c} ({d}%)',
      trigger: 'item'
    }
  }));

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
    switch (activeTab) {
      case 'clientSource':
        updateClientSourceChart();
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
  }, [activeTab, updateClientSourceChart, updateMonthChart, updateQuarterChart, updateYearChart]);

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
