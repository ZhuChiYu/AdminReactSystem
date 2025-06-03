import { useEcharts } from '@/packages/hooks';
import { statisticsService } from '@/service/api';

interface Props {
  className?: string;
}

const PieChart = (props: Props) => {
  const { className } = props;

  const { domRef } = useEcharts(() => getOption(), {
    refreshDeps: []
  });

  async function fetchData() {
    try {
      const response = await statisticsService.getPieChartData({
        period: 'month',
        type: 'user_source'
      });

      return response.map(item => ({
        name: item.name,
        value: item.value
      }));
    } catch (error) {
      console.error('获取饼图数据失败:', error);
      // 返回默认数据
      return [
        { name: '工作', value: 40 },
        { name: '学习', value: 20 },
        { name: '休息', value: 30 },
        { name: '娱乐', value: 10 }
      ];
    }
  }

  async function getOption() {
    const data = await fetchData();

    const option: echarts.EChartsOption = {
      legend: {
        bottom: '1%',
        itemStyle: {
          borderWidth: 0
        },
        left: 'center'
      },
      series: [
        {
          avoidLabelOverlap: false,
          color: ['#5da8ff', '#8e9dff', '#fedc69', '#26deca'],
          data,
          emphasis: {
            label: {
              fontSize: '12',
              show: true
            }
          },
          itemStyle: {
            borderColor: '#fff',
            borderRadius: 10,
            borderWidth: 1
          },
          label: {
            position: 'center',
            show: false
          },
          labelLine: {
            show: false
          },
          name: '时间安排',
          radius: ['45%', '75%'],
          type: 'pie'
        }
      ],
      tooltip: {
        trigger: 'item'
      }
    };
    return option;
  }

  return (
    <div
      className={className}
      ref={domRef}
    />
  );
};

export default PieChart;
