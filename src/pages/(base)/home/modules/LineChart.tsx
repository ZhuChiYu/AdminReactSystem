import { useEcharts } from '@/packages/hooks';
import { statisticsService } from '@/service/api';

interface Props {
  className?: string;
}

const LineChart = (props: Props) => {
  const { className } = props;

  const { domRef } = useEcharts(() => getOption(), {
    refreshDeps: []
  });

  async function fetchData() {
    try {
      const response = await statisticsService.getLineChartData({
        period: 'month',
        type: 'revenue'
      });
      
      return {
        xAxisData: response.xAxisData || [],
        seriesData: response.seriesData || []
      };
    } catch (error) {
      console.error('获取图表数据失败:', error);
      // 返回默认数据
      return {
        xAxisData: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        seriesData: [120, 200, 150, 80, 70, 110, 130, 180, 160, 140, 190, 210]
      };
    }
  }

  async function getOption() {
    const data = await fetchData();
    
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        data: ['营收趋势']
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: data.xAxisData
        }
      ],
      yAxis: [
        {
          type: 'value'
        }
      ],
      series: [
        {
          name: '营收趋势',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: data.seriesData
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

export default LineChart;
