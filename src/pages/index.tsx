import { Navigate } from 'react-router-dom';

const Index = () => {
  return (
    <Navigate
      replace
      to="/course-manage/list"
    />
  );
};

export const handle = {
  constant: true,
  hideInMenu: true,
  i18nKey: 'route.index',
  title: 'index'
};

export default Index;
