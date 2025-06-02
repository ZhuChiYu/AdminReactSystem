import HeaderBanner from './modules/HeaderBanner';
import PerformanceChart from './modules/PerformanceChart';
import TodayMeetingsAndTasks from './modules/TodayMeetingsAndTasks';

const Home = () => {
  return (
    <ASpace
      className="w-full"
      direction="vertical"
      size={[16, 16]}
    >
      <HeaderBanner />

      <ARow gutter={[16, 16]}>
        <ACol
          lg={12}
          span={24}
        >
          <TodayMeetingsAndTasks />
        </ACol>
        <ACol
          lg={12}
          span={24}
        >
          <PerformanceChart />
        </ACol>
      </ARow>
    </ASpace>
  );
};

export default Home;
