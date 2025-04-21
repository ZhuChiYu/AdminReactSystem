import { Card, Typography } from 'antd';
import React from 'react';

const { Title } = Typography;

const Component: React.FC = () => {
  return (
    <div className="p-4">
      <Card>
        <Title level={4}>身份证信息</Title>
        <p>员工身份证信息功能将在此处实现</p>
      </Card>
    </div>
  );
};

export default Component;
