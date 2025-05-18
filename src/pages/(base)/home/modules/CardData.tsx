import NumberTicker from '@/components/NumberTicker';

interface CardDataProps {
  color: {
    end: string;
    start: string;
  };
  icon: string;
  key: string;
  title: string;
  unit: string;
  value: number;
}

function getGradientColor(color: CardDataProps['color']) {
  return `linear-gradient(to bottom right, ${color.start}, ${color.end})`;
}

function useGetCardData() {
  const cardData: CardDataProps[] = [
    {
      color: {
        end: '#b955a4',
        start: '#ec4786'
      },
      icon: 'mdi:account-multiple',
      key: 'clientCount',
      title: '总客户数',
      unit: '',
      value: 126
    },
    {
      color: {
        end: '#5144b4',
        start: '#865ec0'
      },
      icon: 'mdi:currency-cny',
      key: 'totalPerformance',
      title: '总业绩',
      unit: '¥',
      value: 856200
    },
    {
      color: {
        end: '#719de3',
        start: '#56cdf3'
      },
      icon: 'mdi:chart-line',
      key: 'monthPerformance',
      title: '本月业绩',
      unit: '¥',
      value: 125800
    },
    {
      color: {
        end: '#f68057',
        start: '#fcbc25'
      },
      icon: 'mdi:file-document-check',
      key: 'approvalCount',
      title: '待审批申请',
      unit: '',
      value: 8
    }
  ];

  return cardData;
}

const CardItem = (data: CardDataProps) => {
  return (
    <ACol
      key={data.key}
      lg={6}
      md={12}
      span={24}
    >
      <div
        className="flex-1 rd-8px px-16px pb-4px pt-8px text-white"
        style={{ backgroundImage: getGradientColor(data.color) }}
      >
        <h3 className="text-16px">{data.title}</h3>
        <div className="flex justify-between pt-12px">
          <SvgIcon
            className="text-32px"
            icon={data.icon}
          />
          <NumberTicker
            className="text-30px"
            prefix={data.unit}
            value={data.value}
          />
        </div>
      </div>
    </ACol>
  );
};

const CardData = () => {
  const data = useGetCardData();

  return (
    <ACard
      className="card-wrapper"
      size="small"
      variant="borderless"
    >
      <ARow gutter={[16, 16]}>{data.map(CardItem)}</ARow>
    </ACard>
  );
};

export default CardData;
