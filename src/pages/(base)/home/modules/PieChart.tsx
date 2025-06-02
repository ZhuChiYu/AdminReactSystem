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
        type: 'user_source',
        period: 'month'
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
      tooltip: {
        trigger: 'item'
      },
      legend: {
        bottom: '1%',
        left: 'center',
        itemStyle: {
          borderWidth: 0
        }
      },
      series: [
        {
          name: '时间安排',
          type: 'pie',
          radius: ['45%', '75%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 1
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '12'
            }
          },
          labelLine: {
            show: false
          },
          data: data,
          color: ['#5da8ff', '#8e9dff', '#fedc69', '#26deca']
        }
      ]
    };
    return option;
  }

  return (
    <div
      ref={domRef}
      className={className}
    />
  );
};

export default PieChart;
