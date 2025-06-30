import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Modal, Row, Table, Tabs, Tag, Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import React, { useState } from 'react';

import { customerService } from '@/service/api';

/** 客户跟进状态枚举 */
enum FollowUpStatus {
  ARRIVED = 'arrived',
  CONSULT = 'consult',
  EARLY_25 = 'early_25',
  EFFECTIVE_VISIT = 'effective_visit',
  NEW_DEVELOP = 'new_develop',
  NOT_ARRIVED = 'not_arrived',
  REGISTERED = 'registered',
  REJECTED = 'rejected',
  VIP = 'vip',
  WECHAT_ADDED = 'wechat_added'
}

/** 客户跟进状态名称 */
const followUpStatusNames: Record<FollowUpStatus, string> = {
  [FollowUpStatus.WECHAT_ADDED]: '已加微信',
  [FollowUpStatus.REJECTED]: '未通过',
  [FollowUpStatus.EARLY_25]: '早25客户',
  [FollowUpStatus.VIP]: '大客户',
  [FollowUpStatus.EFFECTIVE_VISIT]: '有效回访',
  [FollowUpStatus.CONSULT]: '咨询',
  [FollowUpStatus.REGISTERED]: '已报名',
  [FollowUpStatus.ARRIVED]: '已实到',
  [FollowUpStatus.NOT_ARRIVED]: '未实到',
  [FollowUpStatus.NEW_DEVELOP]: '新开发'
};

/** 客户跟进状态颜色 */
const followUpStatusColors: Record<FollowUpStatus, string> = {
  [FollowUpStatus.WECHAT_ADDED]: 'blue',
  [FollowUpStatus.REJECTED]: 'error',
  [FollowUpStatus.EARLY_25]: 'purple',
  [FollowUpStatus.VIP]: 'gold',
  [FollowUpStatus.EFFECTIVE_VISIT]: 'success',
  [FollowUpStatus.CONSULT]: 'cyan',
  [FollowUpStatus.REGISTERED]: 'success',
  [FollowUpStatus.ARRIVED]: 'green',
  [FollowUpStatus.NOT_ARRIVED]: 'orange',
  [FollowUpStatus.NEW_DEVELOP]: 'geekblue'
};

interface CustomerImportItem {
  company: string;
  createTime: string;
  followStatus: FollowUpStatus;
  followUp: string;
  gender: string;
  id: number;
  mobile: string;
  name: string;
  phone: string;
  position: string;
}

/** 客户导入组件 */
const CustomerImport = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<CustomerImportItem[]>([]);
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus | ''>('');

  // 分页状态管理
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  /** 将字符串状态映射为枚举值 */
  const mapStatusToEnum = (status: string): FollowUpStatus => {
    const statusMap: Record<string, FollowUpStatus> = {
      arrived: FollowUpStatus.ARRIVED,
      // 英文状态映射
      consult: FollowUpStatus.CONSULT,
      early_25: FollowUpStatus.EARLY_25,
      effective_visit: FollowUpStatus.EFFECTIVE_VISIT,
      new_develop: FollowUpStatus.NEW_DEVELOP,
      not_arrived: FollowUpStatus.NOT_ARRIVED,
      registered: FollowUpStatus.REGISTERED,
      rejected: FollowUpStatus.REJECTED,
      vip: FollowUpStatus.VIP,
      wechat_added: FollowUpStatus.WECHAT_ADDED,
      // 中文状态映射
      咨询: FollowUpStatus.CONSULT,
      大客户: FollowUpStatus.VIP,
      已加微信: FollowUpStatus.WECHAT_ADDED,
      已实到: FollowUpStatus.ARRIVED,
      已报名: FollowUpStatus.REGISTERED,
      新开发: FollowUpStatus.NEW_DEVELOP,
      早25: FollowUpStatus.EARLY_25,
      早25客户: FollowUpStatus.EARLY_25,
      有效回访: FollowUpStatus.EFFECTIVE_VISIT,
      未实到: FollowUpStatus.NOT_ARRIVED,
      未通过: FollowUpStatus.REJECTED
    };

    return statusMap[status] || FollowUpStatus.CONSULT;
  };

  /** 文件上传属性配置 */
  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    beforeUpload: () => false, // 阻止自动上传
    fileList,
    maxCount: 1,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    onRemove: () => {
      setPreviewData([]);
    }
  };

  /** 预览Excel文件内容 */
  const handlePreview = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    setUploading(true);

    try {
      const file = fileList[0].originFileObj as File;

      // 动态导入xlsx库
      const XLSX = await import('xlsx');

      // 使用FileReader读取文件
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = e.target?.result;
          if (!data) {
            message.error('文件读取失败');
            setUploading(false);
            return;
          }

          // 使用xlsx库解析Excel
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // 转换为JSON数据
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length <= 1) {
            message.warning('Excel文件中没有数据行');
            setUploading(false);
            return;
          }

          // 跳过标题行，处理数据
          const dataRows = jsonData.slice(1) as any[][];
          const previewItems: CustomerImportItem[] = [];

          dataRows.forEach((row: any[], index: number) => {
            if (row && !row.every(cell => !cell || cell.toString().trim() === '')) {
              // Excel列顺序：A=姓名, B=性别, C=单位, D=职位, E=电话, F=手机, G=跟进, H=状态
              const item: CustomerImportItem = {
                // B列：性别
                company: row[2]?.toString().trim() || '', // H列：状态
                createTime: new Date().toLocaleString(), // G列：跟进
                followStatus: mapStatusToEnum(row[7]?.toString().trim() || 'consult'), // F列：手机
                followUp: row[6]?.toString().trim() || '暂无跟进内容', // A列：姓名
                gender: row[1]?.toString().trim() || '',
                id: index + 1, // E列：电话
                mobile: row[5]?.toString().trim() || '',
                name: row[0]?.toString().trim() || '', // D列：职位
                phone: row[4]?.toString().trim() || '',
                // C列：单位
                position: row[3]?.toString().trim() || ''
              };

              if (item.name || item.company) {
                // 至少有姓名或公司
                previewItems.push(item);
              }
            }
          });

          setPreviewData(previewItems);
          setUploading(false);
          message.success(`预览成功，共${previewItems.length}条记录`);
        } catch (error) {
          console.error('Excel解析失败:', error);
          message.error('Excel文件格式不正确或数据有误');
          setUploading(false);
        }
      };

      reader.onerror = () => {
        message.error('文件读取失败');
        setUploading(false);
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('预览失败:', error);
      message.error('预览失败');
      setUploading(false);
    }
  };

  /** 导入Excel文件 */
  const handleImport = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj as File);

      // 调用实际的导入API
      const result = await customerService.importCustomers(formData);

      setUploading(false);

      // 显示导入结果
      if (result.successCount > 0) {
        message.success(`导入成功！成功导入 ${result.successCount} 条记录，失败 ${result.failureCount} 条`);
      } else {
        message.warning(`导入完成，但没有成功记录。失败 ${result.failureCount} 条`);
      }

      // 如果有错误信息，显示详细错误
      if (result.errors && result.errors.length > 0) {
        Modal.info({
          content: (
            <div>
              <p>成功：{result.successCount} 条</p>
              <p>失败：{result.failureCount} 条</p>
              {result.errors.length > 0 && (
                <div>
                  <p>错误详情：</p>
                  <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {result.errors.map((error, index) => (
                      <li
                        key={index}
                        style={{ color: 'red', fontSize: '12px' }}
                      >
                        {error}
                      </li>
                    ))}
                  </ul>
                  {result.hasMoreErrors && <p style={{ color: 'orange' }}>还有更多错误未显示...</p>}
                </div>
              )}
            </div>
          ),
          title: '导入详情',
          width: 600
        });
      }

      // 清空文件列表和预览数据
      setFileList([]);
      setPreviewData([]);
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败，请检查文件格式是否正确');
      setUploading(false);
    }
  };

  /** 过滤客户数据基于跟进状态 */
  const filteredData = previewData.filter(item => {
    if (!followUpStatus) return true;
    return item.followStatus === followUpStatus;
  });

  // 处理分页变化
  const handlePaginationChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
  };

  // 当筛选状态变化时，重置分页并更新总数
  const handleStatusChange = (key: string) => {
    setFollowUpStatus(key as FollowUpStatus | '');
    const filtered = previewData.filter(item => {
      if (!key) return true;
      return item.followStatus === key;
    });
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: filtered.length
    }));
  };

  // 更新分页总数当预览数据变化时
  React.useEffect(() => {
    const filtered = previewData.filter(item => {
      if (!followUpStatus) return true;
      return item.followStatus === followUpStatus;
    });
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: filtered.length
    }));
  }, [previewData, followUpStatus]);

  /** 表格列定义 */
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '序号',
      width: 60
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '姓名',
      width: 100
    },
    {
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => {
        if (!gender) return '-';
        if (gender === '男' || gender === 'male') return '男';
        if (gender === '女' || gender === 'female') return '女';
        return gender;
      },
      title: '性别',
      width: 80
    },
    {
      dataIndex: 'company',
      ellipsis: true,
      key: 'company',
      title: '单位',
      width: 200
    },
    {
      dataIndex: 'position',
      key: 'position',
      title: '职位',
      width: 120
    },
    {
      dataIndex: 'phone',
      key: 'phone',
      title: '电话',
      width: 130
    },
    {
      dataIndex: 'mobile',
      key: 'mobile',
      title: '手机',
      width: 130
    },
    {
      dataIndex: 'followUp',
      ellipsis: true,
      key: 'followUp',
      title: '跟进',
      width: 200
    },
    {
      dataIndex: 'followStatus',
      key: 'followStatus',
      render: (status: FollowUpStatus) => <Tag color={followUpStatusColors[status]}>{followUpStatusNames[status]}</Tag>,
      title: '状态',
      width: 100
    },
    {
      dataIndex: 'createTime',
      key: 'createTime',
      title: '时间',
      width: 150
    }
  ];

  /** 跟进状态Tab页 */
  const followUpStatusTabs = [
    {
      key: '',
      label: '全部'
    },
    {
      key: FollowUpStatus.EARLY_25,
      label: followUpStatusNames[FollowUpStatus.EARLY_25]
    },
    {
      key: FollowUpStatus.VIP,
      label: followUpStatusNames[FollowUpStatus.VIP]
    },
    {
      key: FollowUpStatus.EFFECTIVE_VISIT,
      label: followUpStatusNames[FollowUpStatus.EFFECTIVE_VISIT]
    },
    {
      key: FollowUpStatus.CONSULT,
      label: followUpStatusNames[FollowUpStatus.CONSULT]
    },
    {
      key: FollowUpStatus.REGISTERED,
      label: followUpStatusNames[FollowUpStatus.REGISTERED]
    },
    {
      key: FollowUpStatus.ARRIVED,
      label: followUpStatusNames[FollowUpStatus.ARRIVED]
    },
    {
      key: FollowUpStatus.NOT_ARRIVED,
      label: followUpStatusNames[FollowUpStatus.NOT_ARRIVED]
    },
    {
      key: FollowUpStatus.NEW_DEVELOP,
      label: followUpStatusNames[FollowUpStatus.NEW_DEVELOP]
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      {/* 添加自定义样式 */}
      <style>
        {`
          .customer-import-table .ant-table-thead > tr > th {
            background-color: #fafafa !important;
          }
          .customer-import-table .ant-table-tbody > tr > td {
            background-color: #ffffff !important;
          }
          .dark .customer-import-table .ant-table-thead > tr > th {
            background-color: #1f1f1f !important;
            color: #ffffff !important;
          }
          .dark .customer-import-table .ant-table-tbody > tr > td {
            background-color: #141414 !important;
            color: #ffffff !important;
          }
          .customer-import-preview {
            background-color: #ffffff !important;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #d9d9d9;
          }
          .dark .customer-import-preview {
            background-color: #1f1f1f !important;
            border-color: #434343;
          }
        `}
      </style>
      <Card
        className="h-full"
        title="客户导入"
        variant="borderless"
      >
        <div className="mt-4">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card variant="borderless">
                <div className="ant-row ant-row-center css-dev-only-do-not-override-t23gha css-var-r0 mt-4">
                  <Upload.Dragger {...uploadProps}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                    <p className="ant-upload-hint">支持.xlsx, .xls格式的Excel文件</p>
                  </Upload.Dragger>
                </div>

                {fileList.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-sm text-gray-500">已选择文件：{fileList[0].name}</div>
                  </div>
                )}

                <div className="mt-6 flex justify-center">
                  <Button
                    disabled={fileList.length === 0}
                    style={{ marginRight: 16 }}
                    type="primary"
                    onClick={handlePreview}
                  >
                    预览数据
                  </Button>
                  <Button
                    disabled={previewData.length === 0}
                    icon={<UploadOutlined />}
                    loading={uploading}
                    type="primary"
                    onClick={handleImport}
                  >
                    确认导入
                  </Button>
                </div>
              </Card>
            </Col>

            {previewData.length > 0 && (
              <Col span={24}>
                <Card
                  className="bg-white dark:bg-[#1f1f1f]"
                  title="数据预览"
                  variant="borderless"
                >
                  <Tabs
                    activeKey={followUpStatus}
                    items={followUpStatusTabs}
                    onChange={handleStatusChange}
                  />
                  <div className="customer-import-preview">
                    <Table
                      className="customer-import-table"
                      columns={columns}
                      dataSource={filteredData}
                      rowKey="id"
                      scroll={{ x: 1300 }}
                      pagination={{
                        current: pagination.current,
                        onChange: handlePaginationChange,
                        onShowSizeChange: handlePaginationChange,
                        pageSize: pagination.pageSize,
                        showQuickJumper: true,
                        showSizeChanger: true,
                        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 项，共 ${total} 项`,
                        total: pagination.total
                      }}
                    />
                  </div>
                </Card>
              </Col>
            )}
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default CustomerImport;
