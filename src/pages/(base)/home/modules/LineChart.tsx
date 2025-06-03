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
        seriesData: response.seriesData || [],
        xAxisData: response.xAxisData || []
      };
    } catch (error) {
      console.error('获取图表数据失败:', error);
      // 返回默认数据
      return {
        seriesData: [120, 200, 150, 80, 70, 110, 130, 180, 160, 140, 190, 210],
        xAxisData: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      };
    }
  }

  async function getOption() {
    const data = await fetchData();

    const option: echarts.EChartsOption = {
      grid: {
        bottom: '3%',
        containLabel: true,
        left: '3%',
        right: '4%'
      },
      legend: {
        data: ['营收趋势']
      },
      series: [
        {
          areaStyle: {},
          data: data.seriesData,
          emphasis: {
            focus: 'series'
          },
          name: '营收趋势',
          stack: 'Total',
          type: 'line'
        }
      ],
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      tooltip: {
        axisPointer: {
          label: {
            backgroundColor: '#6a7985'
          },
          type: 'cross'
        },
        trigger: 'axis'
      },
      xAxis: [
        {
          boundaryGap: false,
          data: data.xAxisData,
          type: 'category'
        }
      ],
      yAxis: [
        {
          type: 'value'
        }
      ]
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

export default LineChart;
