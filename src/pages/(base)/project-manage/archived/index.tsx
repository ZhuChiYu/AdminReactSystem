import { EyeOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, List, Modal, Steps, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

import { projectService } from '@/service/api';
import { taskAttachmentService } from '@/service/api/taskAttachment';
import type { TaskAttachmentApi } from '@/service/api/taskAttachment';
import type { TaskApi } from '@/service/api/types';

const ArchivedProjectPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [archivedTasks, setArchivedTasks] = useState<TaskApi.TaskListItem[]>([]);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskApi.TaskListItem | null>(null);
  const [currentTaskAttachments, setCurrentTaskAttachments] = useState<TaskAttachmentApi.TaskAttachmentListItem[]>([]);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 优先级映射
  const priorityMap = {
    1: { color: 'red', text: '高' },
    2: { color: 'orange', text: '中' },
    3: { color: 'green', text: '低' }
  };

  // 阶段映射 - 添加更多可能的状态值
  const stageMap: Record<string, string> = {
    complete: '已完成',
    completed: '已完成',
    contract_signing: '签订合同',
    customer_inquiry: '客户询价',
    done: '已完成',
    finished: '已完成',
    project_approval: '项目审批',
    project_execution: '项目进行',
    project_settlement: '项目结算',
    proposal_submission: '方案申报',
    teacher_confirmation: '师资确定'
  };

  // 获取阶段中文名称的函数
  const getStageText = (stage: string): string => {
    return stageMap[stage] || stageMap[stage.toLowerCase()] || '已完成';
  };

  // 项目阶段步骤配置
  const PROJECT_STAGES = [
    { description: '负责人发起项目', key: 'customer_inquiry', title: '客户询价' },
    { description: '咨询部上传方案', key: 'proposal_submission', title: '方案申报' },
    { description: '咨询部确认授课老师', key: 'teacher_confirmation', title: '师资确定' },
    { description: '市场部经理审批', key: 'project_approval', title: '项目审批' },
    { description: '咨询部确认合同签订', key: 'contract_signing', title: '签订合同' },
    { description: '咨询部跟进项目过程', key: 'project_execution', title: '项目进行' },
    { description: '负责人确认收款', key: 'project_settlement', title: '项目结算' }
  ];

  // 获取历史项目列表 - 支持分页
  const fetchArchivedTasks = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const response = await projectService.getArchivedTaskList({
        current: page,
        size
      });

      setArchivedTasks(response.records || []);
      setPagination({
        current: page,
        pageSize: size,
        total: response.total || 0
      });
    } catch (error) {
      console.error('获取历史项目失败:', error);
      message.error('获取历史项目失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取任务附件
  const fetchTaskAttachments = async (taskId: number) => {
    setAttachmentLoading(true);
    try {
      console.log('正在获取任务附件，taskId:', taskId);
      const response = await taskAttachmentService.getTaskAttachmentList({
        current: 1,
        size: 100,
        taskId
      });

      console.log('附件响应数据:', response);

      // 处理不同的响应格式
      let attachmentList: TaskAttachmentApi.TaskAttachmentListItem[] = [];
      if (response?.data?.records) {
        attachmentList = response.data.records;
      } else if ((response as any)?.records) {
        attachmentList = (response as any).records;
      } else if (Array.isArray(response?.data)) {
        attachmentList = response.data;
      } else if (Array.isArray(response)) {
        attachmentList = response as TaskAttachmentApi.TaskAttachmentListItem[];
      }

      console.log('解析的附件列表:', attachmentList);
      setCurrentTaskAttachments(attachmentList);
    } catch (error) {
      console.error('获取附件失败:', error);
      message.error('获取附件失败');
      setCurrentTaskAttachments([]);
    } finally {
      setAttachmentLoading(false);
    }
  };

  // 查看详情
  const handleViewDetail = async (task: TaskApi.TaskListItem) => {
    setCurrentTask(task);
    setIsDetailModalVisible(true);

    // 获取该任务的附件
    await fetchTaskAttachments(task.id);
  };

  // 下载附件
  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    try {
      const blob = await taskAttachmentService.downloadTaskAttachment(attachmentId);

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // 清理
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      message.success('文件下载成功');
    } catch (error) {
      console.error('下载失败:', error);
      message.error('文件下载失败');
    }
  };

  // 获取当前阶段在步骤中的索引
  const getCurrentStageIndex = (stage: string): number => {
    return PROJECT_STAGES.findIndex(s => s.key === stage);
  };

  // 获取阶段标签颜色
  const getStageTagColor = (stage: string): string => {
    const colors: Record<string, string> = {
      completed: 'success',
      contract_signing: 'green',
      customer_inquiry: 'blue',
      done: 'success',
      finished: 'success',
      project_approval: 'cyan',
      project_execution: 'lime',
      project_settlement: 'gold',
      proposal_submission: 'orange',
      teacher_confirmation: 'purple'
    };
    return colors[stage] || 'default';
  };

  // 处理分页变化
  const handleTableChange = (page: number, pageSize?: number) => {
    const newPageSize = pageSize || pagination.pageSize;
    fetchArchivedTasks(page, newPageSize);
  };

  // 表格列定义
  const columns = [
    {
      align: 'center' as const,
      dataIndex: 'projectName',
      key: 'projectName',
      title: '项目名称',
      width: 200
    },
    {
      align: 'center' as const,
      dataIndex: 'projectType',
      key: 'projectType',
      title: '项目类型',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
      render: (person: any) => person?.nickName || person?.userName || '-',
      title: '负责人',
      width: 100
    },
    {
      align: 'center' as const,
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => {
        const config = priorityMap[priority as keyof typeof priorityMap];
        return config ? <Tag color={config.color}>{config.text}</Tag> : '-';
      },
      title: '优先级',
      width: 80
    },
    {
      align: 'center' as const,
      dataIndex: 'currentStage',
      key: 'currentStage',
      render: (stage: string) => {
        const stageText = getStageText(stage);
        return <Tag color={getStageTagColor(stage)}>{stageText}</Tag>;
      },
      title: '完成阶段',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'completionTime',
      key: 'completionTime',
      render: (_time: string, record: TaskApi.TaskListItem) => {
        // 尝试使用completionTime，如果不存在则使用updateTime
        const displayTime = (record as any).completionTime || record.updateTime;
        return displayTime ? dayjs(displayTime).format('YYYY-MM-DD HH:mm') : '-';
      },
      title: '完成时间',
      width: 150
    },
    {
      align: 'center' as const,
      fixed: 'right' as const,
      key: 'action',
      render: (_: any, record: TaskApi.TaskListItem) => (
        <Button
          icon={<EyeOutlined />}
          type="link"
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
      title: '操作',
      width: 100
    }
  ];

  useEffect(() => {
    fetchArchivedTasks();
  }, []);

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      {/* 添加内联样式 */}
      <style>
        {`
          .archived-project-table .ant-table-thead > tr > th {
            text-align: center !important;
          }
          .archived-project-table .ant-table-tbody > tr > td {
            text-align: center !important;
            vertical-align: middle !important;
          }
        `}
      </style>

      <Card
        className="h-full"
        title="历史项目"
        variant="borderless"
      >
        {/* 项目列表表格 */}
        <Table
          className="archived-project-table"
          columns={columns}
          dataSource={archivedTasks}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            current: pagination.current,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
            pageSize: pagination.pageSize,
            pageSizeOptions: ['10', '20', '50', '100'],
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 项，共 ${total} 项`,
            total: pagination.total
          }}
        />

        {/* 项目详情弹窗 */}
        <Modal
          footer={null}
          open={isDetailModalVisible}
          title="项目详情"
          width={900}
          onCancel={() => setIsDetailModalVisible(false)}
        >
          {currentTask && (
            <div>
              {/* 基本信息 */}
              <Descriptions
                bordered
                column={2}
                style={{ marginBottom: 24 }}
                title="基本信息"
              >
                <Descriptions.Item label="项目名称">{currentTask.projectName}</Descriptions.Item>
                <Descriptions.Item label="项目类型">{currentTask.projectType}</Descriptions.Item>
                <Descriptions.Item label="负责人">
                  {currentTask.responsiblePerson?.nickName || currentTask.responsiblePerson?.userName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="咨询部人员">
                  {currentTask.consultant?.nickName || currentTask.consultant?.userName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="市场部经理">
                  {currentTask.marketManager?.nickName || currentTask.marketManager?.userName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="优先级">
                  {(() => {
                    const config = priorityMap[currentTask.priority as keyof typeof priorityMap];
                    return config ? <Tag color={config.color}>{config.text}</Tag> : '-';
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="开始时间">
                  {currentTask.startTime ? dayjs(currentTask.startTime).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="结束时间">
                  {currentTask.endTime ? dayjs(currentTask.endTime).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item
                  label="完成时间"
                  span={2}
                >
                  {(() => {
                    const displayTime = (currentTask as any).completionTime || currentTask.updateTime;
                    return displayTime ? dayjs(displayTime).format('YYYY-MM-DD HH:mm') : '-';
                  })()}
                </Descriptions.Item>
                <Descriptions.Item
                  label="备注"
                  span={2}
                >
                  {currentTask.remark || '-'}
                </Descriptions.Item>
              </Descriptions>

              {/* 项目附件 */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16 }}>项目附件</h3>
                {attachmentLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>加载附件中...</div>
                ) : (
                  <>
                    {currentTaskAttachments.length > 0 ? (
                      <List
                        bordered
                        dataSource={currentTaskAttachments}
                        size="small"
                        renderItem={(attachment: TaskAttachmentApi.TaskAttachmentListItem) => (
                          <List.Item
                            actions={[
                              <Button
                                key="download"
                                type="link"
                                onClick={() =>
                                  handleDownloadAttachment(
                                    attachment.id,
                                    attachment.originalName || attachment.fileName
                                  )
                                }
                              >
                                下载
                              </Button>
                            ]}
                          >
                            <List.Item.Meta
                              title={attachment.originalName || attachment.fileName}
                              description={
                                <div>
                                  <div>文件大小: {(attachment.fileSize / 1024 / 1024).toFixed(2)}MB</div>
                                  <div>文件类型: {attachment.fileType}</div>
                                  <div>上传时间: {dayjs(attachment.uploadTime).format('YYYY-MM-DD HH:mm')}</div>
                                  {attachment.uploader && <div>上传者: {attachment.uploader.name}</div>}
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <div style={{ color: '#999', padding: '20px', textAlign: 'center' }}>暂无附件</div>
                    )}
                  </>
                )}
              </div>

              {/* 审批流程 */}
              <div>
                <h3 style={{ marginBottom: 16 }}>审批流程</h3>
                <Steps
                  current={getCurrentStageIndex(currentTask.currentStage)}
                  direction="vertical"
                  status="finish"
                >
                  {PROJECT_STAGES.map((stage, index) => {
                    const isPassed = getCurrentStageIndex(currentTask.currentStage) >= index;

                    return (
                      <Steps.Step
                        description={stage.description}
                        key={stage.key}
                        status={isPassed ? 'finish' : 'wait'}
                        title={stage.title}
                      />
                    );
                  })}
                </Steps>
              </div>
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default ArchivedProjectPage;
