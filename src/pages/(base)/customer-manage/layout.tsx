import { Outlet } from 'react-router-dom';

const CustomerManageLayout = () => {
  return (
    <div className="h-full">
      <Outlet />
    </div>
  );
};

export default CustomerManageLayout;
