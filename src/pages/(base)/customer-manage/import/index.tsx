import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Row, Table, Tabs, Tag, Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { useState } from 'react';

/** 客户跟进状态枚举 */
enum FollowUpStatus {
  FOLLOWING = 'following',
  INITIAL = 'initial',
  REJECTED = 'rejected',
  SIGNED = 'signed',
  VISITED = 'visited'
}

/** 客户跟进状态名称 */
const followUpStatusNames: Record<FollowUpStatus, string> = {
  [FollowUpStatus.INITIAL]: '未跟进',
  [FollowUpStatus.FOLLOWING]: '跟进中',
  [FollowUpStatus.VISITED]: '已回访',
  [FollowUpStatus.SIGNED]: '已签约',
  [FollowUpStatus.REJECTED]: '已拒绝'
};

/** 客户跟进状态颜色 */
const followUpStatusColors: Record<FollowUpStatus, string> = {
  [FollowUpStatus.INITIAL]: 'default',
  [FollowUpStatus.FOLLOWING]: 'processing',
  [FollowUpStatus.VISITED]: 'success',
  [FollowUpStatus.SIGNED]: 'success',
  [FollowUpStatus.REJECTED]: 'error'
};

/** 客户导入组件 */
const CustomerImport = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('excel');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus | ''>('');

  /** 文件上传属性配置 */
  const uploadProps: UploadProps = {
    beforeUpload: file => {
      const isExcel =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';

      if (!isExcel) {
        message.error('只支持上传Excel文件!');
        return Upload.LIST_IGNORE;
      }

      setFileList([file]);
      return false;
    },
    fileList,
    listType: 'text',
    maxCount: 1,
    onRemove: () => {
      setFileList([]);
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
      // 模拟解析Excel数据预览
      setTimeout(() => {
        // 使用表格中的真实数据结构
        const mockData = [
          {
            company: '上海民用航空电源系统有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.FOLLOWING,
            followUp: '发计划数智化简章微信15802910233',
            id: 1,
            mobile: '',
            name: '马芳',
            phone: '029-81112543',
            position: '财务负责培训'
          },
          {
            company: '中国电力工程顾问集团中南电力设计院有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.INITIAL,
            followUp: '看看课微信18229295812',
            id: 2,
            mobile: '',
            name: '万娜',
            phone: '027-65263855',
            position: '财务负责培训'
          },
          {
            company: '太原钢铁（集团）有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.FOLLOWING,
            followUp: '负责培训推荐微信',
            id: 3,
            mobile: '',
            name: '陈建英',
            phone: '微信',
            position: '财务负责培训'
          },
          {
            company: '中国电力工程顾问集团中南电力设计院有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.VISITED,
            followUp: '数智财务发课程微信18717397529/3.4天接3.5天接2.24天接',
            id: 4,
            mobile: '',
            name: '刘老师',
            phone: '027-65263854',
            position: '财务'
          },
          {
            company: '中国能源建设集团江苏省电力设计院有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.SIGNED,
            followUp: '数智化还有年计划发一下微信13813844478',
            id: 5,
            mobile: '',
            name: '陶主任',
            phone: '025-85081060',
            position: '财务主任'
          },
          {
            company: '中国能源建设集团天津电力设计院有限公司',
            createTime: new Date().toLocaleString(),
            followStatus: FollowUpStatus.SIGNED,
            followUp: '其他单位能学应该是有发文，看一下，课程和计划发过来微信13821110961',
            id: 6,
            mobile: '',
            name: '迟主任',
            phone: '022-58339303',
            position: '财务主任'
          }
        ];

        setPreviewData(mockData);
        setUploading(false);
        message.success('数据预览成功');
      }, 1500);
    } catch {
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
      // 模拟导入过程
      setTimeout(() => {
        setUploading(false);
        message.success('导入成功');
      }, 2000);
    } catch {
      message.error('导入失败');
      setUploading(false);
    }
  };

  /** 过滤客户数据基于跟进状态 */
  const filteredData = previewData.filter(item => {
    if (!followUpStatus) return true;
    return item.followStatus === followUpStatus;
  });

  /** 表格列定义 */
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '序号',
      width: 60
    },
    {
      dataIndex: 'company',
      ellipsis: true,
      key: 'company',
      title: '单位',
      width: 220
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '姓名',
      width: 100
    },
    {
      dataIndex: 'position',
      key: 'position',
      title: '职位',
      width: 140
    },
    {
      dataIndex: 'phone',
      key: 'phone',
      title: '电话',
      width: 150
    },
    {
      dataIndex: 'mobile',
      key: 'mobile',
      title: '手机',
      width: 120
    },
    {
      dataIndex: 'followUp',
      ellipsis: true,
      key: 'followUp',
      title: '跟进',
      width: 250
    },
    {
      dataIndex: 'followStatus',
      key: 'followStatus',
      render: (status: FollowUpStatus) => <Tag color={followUpStatusColors[status]}>{followUpStatusNames[status]}</Tag>,
      title: '状态',
      width: 80
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
      key: FollowUpStatus.INITIAL,
      label: followUpStatusNames[FollowUpStatus.INITIAL]
    },
    {
      key: FollowUpStatus.FOLLOWING,
      label: followUpStatusNames[FollowUpStatus.FOLLOWING]
    },
    {
      key: FollowUpStatus.VISITED,
      label: followUpStatusNames[FollowUpStatus.VISITED]
    },
    {
      key: FollowUpStatus.SIGNED,
      label: followUpStatusNames[FollowUpStatus.SIGNED]
    },
    {
      key: FollowUpStatus.REJECTED,
      label: followUpStatusNames[FollowUpStatus.REJECTED]
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        bordered={false}
        className="h-full"
        title="客户导入"
      >
        <Tabs
          activeKey={activeTab}
          items={[
            {
              children: (
                <div className="mt-4">
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Card bordered={false}>
                        <Row justify="center">
                          <Col span={12}>
                            <Upload.Dragger {...uploadProps}>
                              <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                              </p>
                              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                              <p className="ant-upload-hint">支持单个Excel文件上传，请使用标准模板导入数据</p>
                            </Upload.Dragger>
                          </Col>
                        </Row>
                        <Row
                          className="mt-4"
                          justify="center"
                        >
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
                            一键导入
                          </Button>
                        </Row>
                      </Card>
                    </Col>

                    {previewData.length > 0 && (
                      <Col span={24}>
                        <Divider>数据预览</Divider>
                        <Tabs
                          activeKey={followUpStatus}
                          items={followUpStatusTabs}
                          onChange={key => setFollowUpStatus(key as FollowUpStatus | '')}
                        />
                        <Table
                          columns={columns}
                          dataSource={filteredData}
                          rowKey="id"
                          scroll={{ x: 1300 }}
                        />
                      </Col>
                    )}
                  </Row>
                </div>
              ),
              key: 'excel',
              label: 'Excel导入'
            },
            {
              children: (
                <div className="mt-4">
                  <Row>
                    <Col span={24}>
                      <Card
                        bordered={false}
                        title="手动添加客户信息"
                      >
                        <p className="text-center">此功能正在开发中...</p>
                        {/* 这里可以添加表单用于手动录入客户信息 */}
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
              key: 'manual',
              label: '手动录入'
            }
          ]}
          onChange={key => setActiveTab(key)}
        />
      </Card>
    </div>
  );
};

export default CustomerImport;
