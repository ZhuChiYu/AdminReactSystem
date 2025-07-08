import {
  ArrowRightOutlined,
  CheckOutlined,
  CloseOutlined,
  ContainerOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  MoneyCollectOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Tooltip,
  Upload,
  message
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectUserInfo } from '@/features/auth/authStore';
import { employeeService, projectService } from '@/service/api';
import { taskAttachmentService } from '@/service/api/taskAttachment';
import type { TaskAttachmentListItem } from '@/service/api/taskAttachment';
import type { EmployeeApi, TaskApi } from '@/service/api/types';
import { getActionColumnConfig, getCenterColumnConfig } from '@/utils/table';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

/** 项目阶段步骤配置 */
const PROJECT_STAGES = [
  { description: '负责人发起项目', key: 'customer_inquiry', title: '客户询价' },
  { description: '咨询部上传方案', key: 'proposal_submission', title: '方案申报' },
  { description: '咨询部确认授课老师', key: 'teacher_confirmation', title: '师资确定' },
  { description: '市场部经理审批', key: 'project_approval', title: '项目审批' },
  { description: '咨询部确认合同签订', key: 'contract_signing', title: '签订合同' },
  { description: '咨询部跟进项目过程', key: 'project_execution', title: '项目进行' },
  { description: '负责人确认收款', key: 'project_settlement', title: '项目结算' }
];

/** 获取当前阶段在步骤中的索引 */
const getCurrentStageIndex = (stage: string): number => {
  return PROJECT_STAGES.findIndex(s => s.key === stage);
};

/** 获取阶段标签颜色 */
const getStageTagColor = (stage: string): string => {
  const colors: Record<string, string> = {
    contract_signing: 'green',
    customer_inquiry: 'blue',
    project_approval: 'cyan',
    project_execution: 'lime',
    project_settlement: 'gold',
    proposal_submission: 'orange',
    teacher_confirmation: 'purple'
  };
  return colors[stage] || 'default';
};

/** 获取优先级标签颜色 */
const getPriorityTagColor = (priority: number): string => {
  const colors: Record<number, string> = {
    1: 'red',
    2: 'orange',
    3: 'green'
  };
  return colors[priority] || 'default';
};

/** 优先级名称映射 */
const PRIORITY_NAMES: Record<number, string> = {
  1: '高',
  2: '中',
  3: '低'
};

/** 操作名称映射 */
const ACTION_NAMES: Record<string, string> = {
  advance_to_proposal: '推进到方案申报',
  approve_project: '审批通过',
  confirm_completion: '确认完成',
  confirm_contract: '确认合同签订',
  confirm_payment: '确认收款',
  confirm_proposal: '确认方案',
  confirm_teacher: '确认师资',
  reject_project: '审批拒绝',
  upload_proposal: '上传方案',
  上传方案: '上传方案',
  创建项目: '创建项目',
  // 新增打回相关的操作名称
  审批拒绝: '审批拒绝',
  审批通过: '审批通过',
  客户同意方案: '客户同意方案',
  客户已签合同: '客户已签合同',
  客户拒绝方案: '客户拒绝方案',
  客户未签合同: '客户未签合同',
  已收到客户款项: '已收到客户款项',
  打回重新确认师资: '打回重新确认师资',
  未收到客户款项: '未收到客户款项',
  确认授课老师: '确认授课老师',
  阶段推进: '阶段推进',
  项目已完成: '项目已完成',
  项目进行中: '项目进行中'
};

/** 根据阶段获取当前办理人 */
const getCurrentExecutor = (stage: string, task: TaskApi.TaskListItem) => {
  switch (stage) {
    case 'customer_inquiry':
    case 'project_settlement':
      return task.responsiblePerson;
    case 'proposal_submission':
    case 'teacher_confirmation':
    case 'contract_signing':
    case 'project_execution':
      return task.consultant;
    case 'project_approval':
      return task.marketManager;
    default:
      return null;
  }
};

/** 任务状态枚举 */
enum TaskStatus {
  NOT_STARTED = 0, // 未开始
  IN_PROGRESS = 1, // 进行中
  COMPLETED = 2, // 已完成
  PAUSED = 3, // 已暂停
  CANCELLED = 4 // 已取消
}

/** 任务状态名称 */
const taskStatusNames = {
  [TaskStatus.NOT_STARTED]: '未开始',
  [TaskStatus.IN_PROGRESS]: '进行中',
  [TaskStatus.COMPLETED]: '已完成',
  [TaskStatus.PAUSED]: '已暂停',
  [TaskStatus.CANCELLED]: '已取消'
};

/** 任务状态颜色 */
const taskStatusColors = {
  [TaskStatus.NOT_STARTED]: 'default',
  [TaskStatus.IN_PROGRESS]: 'processing',
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.PAUSED]: 'warning',
  [TaskStatus.CANCELLED]: 'error'
};

/** 优先级枚举 */
enum Priority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3
}

/** 优先级名称 */
const priorityNames = {
  [Priority.HIGH]: '高',
  [Priority.MEDIUM]: '中',
  [Priority.LOW]: '低'
};

interface TaskRecord {
  actualCount?: number;
  assignee?: {
    id: number;
    nickName?: string;
    userName?: string;
  };
  createTime: string;
  dueDate?: string;
  id: number;
  priority: number;
  progress: number;
  projectName?: string;
  targetCount?: number;
  taskDesc?: string;
  taskName: string;
  taskStatus: number;
  taskType: string;
  updateTime?: string;
}

/** 检查用户权限 */
const checkUserPermissions = (currentUser: any, task: TaskApi.TaskListItem) => {
  const currentExecutor = getCurrentExecutor(task.currentStage, task);
  const userIdNumber = Number.parseInt(currentUser.userId, 10);

  // 检查是否是当前阶段办理人（通过ID和用户名双重验证）
  let isCurrentExecutor = false;
  if (currentExecutor) {
    // 优先通过ID匹配（确保userId不为空且有效）
    if (!Number.isNaN(userIdNumber) && userIdNumber > 0) {
      isCurrentExecutor = currentExecutor.id === userIdNumber;
    }
    // 如果ID匹配不上，尝试通过用户名匹配
    if (!isCurrentExecutor) {
      isCurrentExecutor =
        currentExecutor.userName === currentUser.userName || currentExecutor.nickName === currentUser.userName;
    }
  }

  // 检查是否是负责人（通过ID和用户名双重验证）
  let isResponsiblePerson = false;
  if (task.responsiblePerson) {
    // 优先通过ID匹配（确保userId不为空且有效）
    if (!Number.isNaN(userIdNumber) && userIdNumber > 0) {
      isResponsiblePerson = task.responsiblePerson.id === userIdNumber;
    }
    // 如果ID匹配不上，尝试通过用户名匹配
    if (!isResponsiblePerson) {
      isResponsiblePerson =
        task.responsiblePerson.userName === currentUser.userName ||
        task.responsiblePerson.nickName === currentUser.userName;
    }
  }

  // 只有超级管理员才有全局权限，普通管理员没有
  const isSuperAdmin = currentUser.roles?.includes('super_admin') || currentUser.roles?.includes('SUPER_ADMIN');
  const isAdmin = currentUser.roles?.includes('admin') || currentUser.roles?.includes('ADMIN');

  return {
    // 只有办理人、负责人或超级管理员才能执行操作，普通管理员不能
    canPerformAction: isCurrentExecutor || isResponsiblePerson || isSuperAdmin,
    isAdmin,
    isCurrentExecutor,
    isResponsiblePerson,
    isSuperAdmin
  };
};

/** 根据阶段获取可用操作 */
const getStageActions = (stage: string, permissions: any): Array<{ color: string; key: string; title: string }> => {
  const { isCurrentExecutor, isResponsiblePerson, isSuperAdmin } = permissions;
  const actions: Array<{ color: string; key: string; title: string }> = [];

  switch (stage) {
    case 'customer_inquiry':
      // 客户询价阶段：只有负责人或超级管理员可以操作
      if (isResponsiblePerson || isSuperAdmin) {
        actions.push({ color: 'blue', key: 'advance_to_proposal', title: '推进到方案提交' });
      }
      break;
    case 'proposal_submission':
      // 方案申报阶段：只有当前办理人（咨询部）或超级管理员可以操作
      if (isCurrentExecutor || isSuperAdmin) {
        actions.push({ color: 'blue', key: 'upload_proposal', title: '上传方案' });
        actions.push({ color: 'green', key: 'confirm_proposal', title: '已发方案' });
      }
      break;
    case 'teacher_confirmation':
      // 师资确定阶段：只有当前办理人（咨询部）或超级管理员可以操作
      if (isCurrentExecutor || isSuperAdmin) {
        actions.push({ color: 'purple', key: 'confirm_teacher', title: '确认授课老师' });
      }
      break;
    case 'project_approval':
      // 项目审批阶段：只有当前办理人（市场部经理）或超级管理员可以操作
      if (isCurrentExecutor || isSuperAdmin) {
        actions.push({ color: 'green', key: 'approve_project', title: '审批通过' });
        actions.push({ color: 'red', key: 'reject_project', title: '审批拒绝' });
      }
      break;
    case 'contract_signing':
      // 签订合同阶段：只有当前办理人（咨询部）或超级管理员可以操作
      if (isCurrentExecutor || isSuperAdmin) {
        actions.push({ color: 'green', key: 'confirm_contract', title: '客户已签合同' });
      }
      break;
    case 'project_execution':
      // 项目进行阶段：只有当前办理人（咨询部）或超级管理员可以操作
      if (isCurrentExecutor || isSuperAdmin) {
        actions.push({ color: 'green', key: 'confirm_completion', title: '项目已完成' });
      }
      break;
    case 'project_settlement':
      // 项目结算阶段：只有负责人或超级管理员可以操作
      if (isResponsiblePerson || isSuperAdmin) {
        actions.push({ color: 'gold', key: 'confirm_payment', title: '已收到客户款项' });
      }
      break;
    default:
      break;
  }

  return actions;
};

/** 事项列表组件 */
const ItemList = () => {
  const [tasks, setTasks] = useState<TaskApi.TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskApi.TaskListItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskApi.TaskListItem | null>(null);
  const [attachments, setAttachments] = useState<TaskAttachmentListItem[]>([]);
  const [isStageActionModalVisible, setIsStageActionModalVisible] = useState(false);
  const [stageActionForm] = Form.useForm();
  const [uploadFileList, setUploadFileList] = useState<File[]>([]);
  const navigate = useNavigate();

  const currentUser = useSelector(selectUserInfo);

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 搜索和筛选状态
  const [searchParams, setSearchParams] = useState({
    currentStage: undefined as string | undefined,
    keyword: '',
    priority: undefined as number | undefined,
    responsiblePersonId: undefined as number | undefined,
    timeRange: null as any
  });

  // 获取员工列表
  const fetchEmployees = async () => {
    try {
      const employeeList = await employeeService.getAllEmployees();
      setEmployees(employeeList);
    } catch (error) {
      console.error('获取员工列表失败:', error);
    }
  };

  // 获取项目事项列表（只获取当前用户相关的项目事项）
  const fetchTasks = async (params?: any) => {
    setLoading(true);
    try {
      const requestParams = {
        current: pagination.current,
        size: pagination.pageSize,
        ...params
      };
      // 使用 getMyTasks 获取当前用户相关的项目事项
      const response = await projectService.getMyTasks(requestParams);
      setTasks(response.records || []);

      // 更新分页信息
      setPagination(prev => ({
        ...prev,
        current: response.current || 1,
        total: response.total || 0
      }));
    } catch (error) {
      console.error('获取项目事项列表失败:', error);
      // 使用 App 组件包装的 message
      message.error('获取项目事项列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取项目事项附件列表
  const fetchTaskAttachments = async (taskId: number) => {
    try {
      const response = await taskAttachmentService.getTaskAttachmentList({
        current: 1,
        size: 100,
        taskId
      });

      // 兼容不同的响应结构
      let attachmentList = [];
      if (response.data?.records) {
        attachmentList = response.data.records;
      } else if ((response as any).records) {
        attachmentList = (response as any).records;
      } else if (Array.isArray(response.data)) {
        attachmentList = response.data;
      } else if (Array.isArray(response)) {
        attachmentList = response as any[];
      }

      setAttachments(attachmentList);
    } catch (error) {
      console.error('获取附件列表失败:', error);
    }
  };

  // 处理附件上传
  const handleFileUpload = async (file: File, taskId: number, stage?: string) => {
    try {
      await taskAttachmentService.uploadTaskAttachment({
        description: `${stage || '阶段'}附件`,
        file,
        stage: stage || currentTask?.currentStage,
        taskId
      });

      message.success('附件上传成功');
      await fetchTaskAttachments(taskId);
    } catch (error: any) {
      console.error('❌ 上传附件失败:', error);

      // 根据不同错误类型显示不同的错误信息
      let errorMessage = '上传附件失败';

      if (error.response?.status === 401) {
        errorMessage = '登录已过期，请重新登录';
      } else if (error.response?.status === 413) {
        errorMessage = '文件太大，请选择较小的文件';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || '请求参数错误';
      } else if (error.response?.status === 500) {
        errorMessage = '服务器内部错误，请稍后重试';
      } else if (error.message?.includes('common.serverError')) {
        errorMessage = '服务器出现错误，请检查网络连接或联系管理员';
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);

      // 如果是认证问题，跳转到登录页
      if (error.response?.status === 401) {
        navigate('/login-out');
      }
    }
  };

  // 删除附件
  const handleDeleteAttachment = async (attachmentId: number, taskId: number) => {
    try {
      await taskAttachmentService.deleteTaskAttachment(attachmentId);
      message.success('附件删除成功');
      await fetchTaskAttachments(taskId);
    } catch (error: any) {
      console.error('删除附件失败:', error);
      message.error(error.message || '删除附件失败');
    }
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
    } catch (error: any) {
      console.error('下载附件失败:', error);
      message.error(error.message || '下载附件失败');
    }
  };

  // 检查用户权限 - 只有当前办理人和管理员可以编辑/删除
  const canEditAttachment = (attachment: TaskAttachmentListItem) => {
    if (!currentUser || !currentTask) return false;

    // 超级管理员可以操作所有附件
    const isSuperAdmin = currentUser.roles?.includes('super_admin');
    if (isSuperAdmin) return true;

    // 附件上传者可以删除自己的附件
    if (attachment.uploader?.id === Number(currentUser.userId)) return true;

    // 当前阶段的办理人可以操作
    const currentExecutor = getCurrentExecutor(currentTask.currentStage, currentTask);
    return currentExecutor?.id === Number(currentUser.userId);
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  // 搜索处理 - 调用后端API进行搜索
  const handleSearch = () => {
    // 构建搜索参数
    const searchQueryParams: any = {
      current: 1, // 搜索时重置到第一页
      size: pagination.pageSize
    };

    if (searchParams.keyword) {
      searchQueryParams.keyword = searchParams.keyword;
    }

    if (searchParams.currentStage) {
      searchQueryParams.currentStage = searchParams.currentStage;
    }

    if (searchParams.priority) {
      searchQueryParams.priority = searchParams.priority;
    }

    if (searchParams.responsiblePersonId) {
      searchQueryParams.responsiblePersonId = searchParams.responsiblePersonId;
    }

    // 注意：时间范围搜索暂时不支持，因为后端getMyTasks接口还没有实现时间范围查询
    // if (searchParams.timeRange && searchParams.timeRange.length === 2) {
    //   const [start, end] = searchParams.timeRange;
    //   searchQueryParams.startTime = dayjs(start).toISOString();
    //   searchQueryParams.endTime = dayjs(end).toISOString();
    // }

    // 重新获取数据
    fetchTasks(searchQueryParams);
  };

  // 重置搜索
  const resetSearch = () => {
    setSearchParams({
      currentStage: undefined,
      keyword: '',
      priority: undefined,
      responsiblePersonId: undefined,
      timeRange: null
    });
    // 重置搜索后重新获取所有数据
    fetchTasks();
  };

  // 打开新增/编辑弹窗
  const openModal = (task?: TaskApi.TaskListItem) => {
    form.resetFields();
    if (task) {
      setCurrentTask(task);
      form.setFieldsValue({
        consultantId: task.consultant?.id,
        endTime: task.endTime ? dayjs(task.endTime) : null,
        marketManagerId: task.marketManager?.id,
        priority: task.priority,
        projectName: task.projectName,
        projectType: task.projectType,
        remark: task.remark,
        responsiblePersonId: task.responsiblePerson?.id,
        startTime: task.startTime ? dayjs(task.startTime) : null
      });
    } else {
      setCurrentTask(null);
      form.setFieldsValue({
        priority: 2
      });
    }
    setIsModalVisible(true);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentTask(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = {
        ...values,
        consultantId: values.consultantId ? Number(values.consultantId) : null,
        endTime: values.endTime ? dayjs(values.endTime).toISOString() : null,
        marketManagerId: values.marketManagerId ? Number(values.marketManagerId) : null,
        priority: values.priority ? Number(values.priority) : 2,
        responsiblePersonId: values.responsiblePersonId ? Number(values.responsiblePersonId) : null,
        startTime: values.startTime ? dayjs(values.startTime).toISOString() : null
      };

      if (currentTask) {
        await projectService.updateTask(currentTask.id, formData);
        message.success('更新项目事项成功');
      } else {
        await projectService.createTask(formData);
        message.success('创建项目事项成功');
      }

      setIsModalVisible(false);
      setCurrentTask(null);
      form.resetFields();
      await fetchTasks();
    } catch (error: any) {
      console.error('操作失败:', error);
      message.error(error.message || '操作失败，请重试');
    }
  };

  // 处理阶段操作
  const handleStageAction = (task: TaskApi.TaskListItem, action: string) => {
    setCurrentTask(task);
    setUploadFileList([]); // 清空文件列表
    setIsStageActionModalVisible(true);
    stageActionForm.setFieldsValue({
      action: ACTION_NAMES[action] || action,
      actionKey: action // 保存原始key用于API调用
    });
  };

  // 删除项目事项
  const handleDelete = (id: number) => {
    Modal.confirm({
      content: '确定要删除这条记录吗？',
      onOk: async () => {
        try {
          await projectService.deleteTask(id);
          message.success('删除成功');
          await fetchTasks();
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败，请重试');
        }
      },
      title: '删除确认'
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的项目事项');
      return;
    }

    Modal.confirm({
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      onOk: async () => {
        try {
          const deletePromises = selectedRowKeys.map(id => projectService.deleteTask(id));
          await Promise.all(deletePromises);
          message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
          setSelectedRowKeys([]);
          await fetchTasks();
        } catch (error) {
          console.error('批量删除失败:', error);
          message.error('批量删除失败，请重试');
        }
      },
      title: '批量删除确认'
    });
  };

  // 获取当前用户可以执行的操作
  const getAvailableActions = (task: TaskApi.TaskListItem): Array<{ color: string; key: string; title: string }> => {
    if (!currentUser) {
      return [];
    }

    const permissions = checkUserPermissions(currentUser, task);

    if (!permissions.canPerformAction) {
      return []; // 没有权限，返回空操作列表
    }

    return getStageActions(task.currentStage, permissions);
  };

  // 查看详情
  const handleViewDetail = (task: TaskApi.TaskListItem) => {
    setCurrentTask(task);
    setIsDetailModalVisible(true);
    // 获取附件列表
    fetchTaskAttachments(task.id);
  };

  // 表格行选择配置
  const rowSelection = {
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys as number[]);
    },
    selectedRowKeys
  };

  // 处理分页变化
  const handleTableChange = (page: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize
    }));

    // 构建包含当前搜索条件的参数
    const queryParams: any = {
      current: page,
      size: pageSize
    };

    // 保持当前的搜索条件
    if (searchParams.keyword) {
      queryParams.keyword = searchParams.keyword;
    }
    if (searchParams.currentStage) {
      queryParams.currentStage = searchParams.currentStage;
    }
    if (searchParams.priority) {
      queryParams.priority = searchParams.priority;
    }
    if (searchParams.responsiblePersonId) {
      queryParams.responsiblePersonId = searchParams.responsiblePersonId;
    }

    fetchTasks(queryParams);
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '序号',
      width: 60,
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'projectType',
      key: 'projectType',
      title: '项目类型',
      width: 120,
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'projectName',
      key: 'projectName',
      title: '项目名称',
      width: 200,
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'currentStage',
      key: 'currentStage',
      title: '所属阶段',
      width: 120,
      ...getCenterColumnConfig(),
      render: (stage: string) => {
        const stageInfo = PROJECT_STAGES.find(s => s.key === stage);
        return <Tag color={getStageTagColor(stage)}>{stageInfo?.title || stage}</Tag>;
      }
    },
    {
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
      title: '负责人',
      width: 100,
      ...getCenterColumnConfig(),
      render: (person: any) => person?.nickName || person?.userName || '未分配'
    },
    {
      dataIndex: 'executor',
      key: 'executor',
      title: '办理人',
      width: 100,
      ...getCenterColumnConfig(),
      render: (_: any, record: TaskApi.TaskListItem) => {
        const currentExecutor = getCurrentExecutor(record.currentStage, record);
        return currentExecutor?.nickName || currentExecutor?.userName || '未分配';
      }
    },
    {
      dataIndex: 'priority',
      key: 'priority',
      title: '优先级',
      width: 80,
      ...getCenterColumnConfig(),
      render: (priority: number) => <Tag color={getPriorityTagColor(priority)}>{PRIORITY_NAMES[priority]}</Tag>
    },
    {
      dataIndex: 'startTime',
      key: 'startTime',
      title: '开始时间',
      width: 150,
      ...getCenterColumnConfig(),
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      dataIndex: 'endTime',
      key: 'endTime',
      title: '结束时间',
      width: 150,
      ...getCenterColumnConfig(),
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      key: 'action',
      title: '操作',
      ...getActionColumnConfig(250),
      render: (_: any, record: TaskApi.TaskListItem) => {
        const actions = getAvailableActions(record);

        return (
          <Space wrap>
            <Tooltip title="查看详情">
              <Button
                icon={<EyeOutlined />}
                size="small"
                type="link"
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            <Tooltip title="编辑">
              <Button
                icon={<EditOutlined />}
                size="small"
                type="link"
                onClick={() => openModal(record)}
              />
            </Tooltip>
            {actions.map(action => {
              // 获取操作对应的图标
              const getActionIcon = (key: string) => {
                switch (key) {
                  case 'advance_to_proposal':
                    return <ArrowRightOutlined />;
                  case 'upload_proposal':
                    return <UploadOutlined />;
                  case 'confirm_proposal':
                    return <CheckOutlined />;
                  case 'confirm_teacher':
                    return <UserOutlined />;
                  case 'approve_project':
                    return <CheckOutlined />;
                  case 'reject_project':
                    return <CloseOutlined />;
                  case 'confirm_contract':
                    return <FileTextOutlined />;
                  case 'confirm_completion':
                    return <ContainerOutlined />;
                  case 'confirm_payment':
                    return <MoneyCollectOutlined />;
                  default:
                    return <ArrowRightOutlined />;
                }
              };

              return (
                <Tooltip
                  key={action.key}
                  title={action.title}
                >
                  <Button
                    icon={getActionIcon(action.key)}
                    size="small"
                    style={{ color: action.color }}
                    type="link"
                    onClick={() => handleStageAction(record, action.key)}
                  />
                </Tooltip>
              );
            })}
            <Tooltip title="删除">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                type="link"
                onClick={() => handleDelete(record.id)}
              />
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  // 检查当前用户是否是超级管理员
  const isSuperAdmin = currentUser?.roles?.includes('super_admin') || currentUser?.roles?.includes('SUPER_ADMIN');

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        className="h-full"
        title={isSuperAdmin ? '项目事项列表（全部）' : '我的项目事项'}
        variant="borderless"
        extra={
          <Space>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => openModal()}
            >
              新建项目事项
            </Button>
            {selectedRowKeys.length > 0 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
              >
                批量删除 ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
        }
      >
        {/* 搜索筛选栏 */}
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Input
            allowClear
            placeholder="请输入关键词搜索（项目名称、项目类型、负责人、备注）"
            style={{ width: 280 }}
            value={searchParams.keyword}
            onChange={e => setSearchParams({ ...searchParams, keyword: e.target.value })}
          />
          <Select
            allowClear
            placeholder="请选择所属阶段"
            style={{ width: 150 }}
            value={searchParams.currentStage}
            onChange={value => setSearchParams({ ...searchParams, currentStage: value })}
          >
            {PROJECT_STAGES.map(stage => (
              <Select.Option
                key={stage.key}
                value={stage.key}
              >
                {stage.title}
              </Select.Option>
            ))}
          </Select>
          <Select
            allowClear
            placeholder="请选择优先级"
            style={{ width: 120 }}
            value={searchParams.priority}
            onChange={value => setSearchParams({ ...searchParams, priority: value })}
          >
            <Select.Option value={1}>高</Select.Option>
            <Select.Option value={2}>中</Select.Option>
            <Select.Option value={3}>低</Select.Option>
          </Select>
          <Select
            allowClear
            placeholder="请选择负责人"
            style={{ width: 150 }}
            value={searchParams.responsiblePersonId}
            onChange={value => setSearchParams({ ...searchParams, responsiblePersonId: value })}
          >
            {employees.map(emp => (
              <Select.Option
                key={emp.id}
                value={emp.id}
              >
                {emp.nickName || emp.userName}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            placeholder={['开始时间', '结束时间']}
            style={{ width: 280 }}
            value={searchParams.timeRange}
            onChange={value => setSearchParams({ ...searchParams, timeRange: value })}
          />
          <Button
            icon={<SearchOutlined />}
            type="primary"
            onClick={handleSearch}
          >
            搜索
          </Button>
          <Button onClick={resetSearch}>重置</Button>
        </div>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={tasks}
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          scroll={{ x: 1200, y: 600 }}
          pagination={{
            current: pagination.current,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
            pageSize: pagination.pageSize,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 项，共 ${total} 项`,
            total: pagination.total
          }}
        />

        {/* 新建/编辑项目事项弹窗 */}
        <Modal
          open={isModalVisible}
          title={currentTask ? '编辑项目事项' : '新建项目事项'}
          width={800}
          onCancel={handleCancel}
          onOk={handleSubmit}
        >
          <Form
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item
              label="项目类型"
              name="projectType"
              rules={[{ message: '请输入项目类型', required: true }]}
            >
              <Input placeholder="请输入项目类型" />
            </Form.Item>
            <Form.Item
              label="项目名称"
              name="projectName"
              rules={[{ message: '请输入项目名称', required: true }]}
            >
              <Input placeholder="请输入项目名称" />
            </Form.Item>
            <Form.Item
              label="负责人"
              name="responsiblePersonId"
              rules={[{ message: '请选择负责人', required: true }]}
            >
              <Select
                showSearch
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                placeholder="请选择负责人"
                options={employees.map(emp => ({
                  label: `${emp.nickName || emp.userName} (${emp.userName})`,
                  value: emp.id
                }))}
              />
            </Form.Item>
            <Form.Item
              label="咨询部人员"
              name="consultantId"
              rules={[{ message: '请选择咨询部人员', required: true }]}
            >
              <Select
                showSearch
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                placeholder="请选择咨询部人员"
                options={employees.map(emp => ({
                  label: `${emp.nickName || emp.userName} (${emp.userName})`,
                  value: emp.id
                }))}
              />
            </Form.Item>
            <Form.Item
              label="市场部经理"
              name="marketManagerId"
              rules={[{ message: '请选择市场部经理', required: true }]}
            >
              <Select
                showSearch
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                placeholder="请选择市场部经理"
                options={employees.map(emp => ({
                  label: `${emp.nickName || emp.userName} (${emp.userName})`,
                  value: emp.id
                }))}
              />
            </Form.Item>
            <Form.Item
              initialValue={2}
              label="优先级"
              name="priority"
              rules={[{ message: '请选择优先级', required: true }]}
            >
              <Select placeholder="请选择优先级">
                <Select.Option value={1}>高</Select.Option>
                <Select.Option value={2}>中</Select.Option>
                <Select.Option value={3}>低</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="开始时间"
              name="startTime"
              rules={[{ message: '请选择开始时间', required: true }]}
            >
              <DatePicker
                showTime
                placeholder="请选择开始时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label="结束时间"
              name="endTime"
              rules={[{ message: '请选择结束时间', required: true }]}
            >
              <DatePicker
                showTime
                placeholder="请选择结束时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label="备注"
              name="remark"
            >
              <TextArea
                placeholder="请输入备注"
                rows={3}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 查看详情弹窗 */}
        <Modal
          footer={null}
          open={isDetailModalVisible}
          title="项目事项详情"
          width={800}
          onCancel={() => setIsDetailModalVisible(false)}
        >
          {currentTask && (
            <>
              <Descriptions
                bordered
                column={2}
              >
                <Descriptions.Item label="项目类型">{currentTask.projectType}</Descriptions.Item>
                <Descriptions.Item label="项目名称">{currentTask.projectName}</Descriptions.Item>
                <Descriptions.Item label="当前阶段">
                  <Tag color={getStageTagColor(currentTask.currentStage)}>
                    {PROJECT_STAGES.find(s => s.key === currentTask.currentStage)?.title}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="优先级">
                  <Tag color={getPriorityTagColor(currentTask.priority)}>{PRIORITY_NAMES[currentTask.priority]}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="负责人">
                  {currentTask.responsiblePerson?.nickName || currentTask.responsiblePerson?.userName}
                </Descriptions.Item>
                <Descriptions.Item label="办理人">
                  {(() => {
                    const currentExecutor = getCurrentExecutor(currentTask.currentStage, currentTask);
                    return currentExecutor?.nickName || currentExecutor?.userName || '未分配';
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="咨询部人员">
                  {currentTask.consultant?.nickName || currentTask.consultant?.userName || '未分配'}
                </Descriptions.Item>
                <Descriptions.Item label="市场部经理">
                  {currentTask.marketManager?.nickName || currentTask.marketManager?.userName || '未分配'}
                </Descriptions.Item>
                <Descriptions.Item label="开始时间">
                  {dayjs(currentTask.startTime).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="结束时间">
                  {dayjs(currentTask.endTime).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(currentTask.createTime).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {dayjs(currentTask.updateTime).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item
                  label="备注"
                  span={2}
                >
                  {currentTask.remark || '无'}
                </Descriptions.Item>
              </Descriptions>

              {/* 操作历史 */}
              {currentTask.stageHistory && currentTask.stageHistory.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>操作历史</h4>
                  <Steps
                    direction="vertical"
                    size="small"
                    items={(() => {
                      try {
                        const history =
                          typeof currentTask.stageHistory === 'string'
                            ? JSON.parse(currentTask.stageHistory)
                            : currentTask.stageHistory;

                        return history.map((item: any, index: number) => {
                          const stageInfo = PROJECT_STAGES.find(s => s.key === item.stage);

                          // 获取操作人姓名
                          let operatorName = item.operatorName;
                          if (!operatorName && item.operator) {
                            // 尝试从员工列表中查找（支持多种匹配方式）
                            const operatorId = Number(item.operator);
                            let operator = employees.find(emp => emp.id === operatorId);

                            // 如果通过ID找不到，尝试通过用户名查找
                            if (!operator && typeof item.operator === 'string') {
                              operator = employees.find(
                                emp => emp.userName === item.operator || emp.nickName === item.operator
                              );
                            }

                            // 如果还是找不到，检查是否是当前任务相关的人员
                            if (!operator && currentTask) {
                              // 检查是否是负责人
                              if (
                                currentTask.responsiblePerson &&
                                (currentTask.responsiblePerson.id === operatorId ||
                                  currentTask.responsiblePerson.userName === item.operator)
                              ) {
                                operatorName =
                                  currentTask.responsiblePerson.nickName || currentTask.responsiblePerson.userName;
                              }
                              // 检查是否是咨询部人员
                              else if (
                                currentTask.consultant &&
                                (currentTask.consultant.id === operatorId ||
                                  currentTask.consultant.userName === item.operator)
                              ) {
                                operatorName = currentTask.consultant.nickName || currentTask.consultant.userName;
                              }
                              // 检查是否是市场部经理
                              else if (
                                currentTask.marketManager &&
                                (currentTask.marketManager.id === operatorId ||
                                  currentTask.marketManager.userName === item.operator)
                              ) {
                                operatorName = currentTask.marketManager.nickName || currentTask.marketManager.userName;
                              }
                            }

                            // 最终设置操作人姓名
                            if (operator) {
                              operatorName = operator.nickName || operator.userName;
                            } else if (!operatorName) {
                              operatorName = `用户${item.operator}`;
                            }
                          }

                          // 获取中文操作名称
                          const actionName = ACTION_NAMES[item.action] || item.action || '阶段推进';

                          return {
                            description: (
                              <div>
                                <div>操作：{actionName}</div>
                                <div>操作人：{operatorName || '未知用户'}</div>
                                <div>时间：{dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}</div>
                                {item.comment && <div>备注：{item.comment}</div>}
                              </div>
                            ),
                            status: index === history.length - 1 ? 'process' : 'finish',
                            title: stageInfo?.title || item.stage
                          };
                        });
                      } catch (error) {
                        console.error('解析操作历史失败:', error);
                        return [];
                      }
                    })()}
                  />
                </div>
              )}

              {/* 项目附件 */}
              <div style={{ marginTop: '24px' }}>
                <div
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}
                >
                  <h4 style={{ margin: 0 }}>项目附件</h4>
                  {(() => {
                    // 检查当前用户是否可以上传附件
                    if (!currentUser) return null;

                    // 检查权限
                    const permissions = checkUserPermissions(currentUser, currentTask);
                    const canUpload = permissions.canPerformAction;

                    if (canUpload) {
                      return (
                        <Upload
                          accept="*"
                          showUploadList={false}
                          beforeUpload={file => {
                            handleFileUpload(file, currentTask.id);
                            return false; // 阻止自动上传
                          }}
                        >
                          <Button
                            icon={<UploadOutlined />}
                            size="small"
                            type="primary"
                          >
                            上传附件
                          </Button>
                        </Upload>
                      );
                    }

                    return null;
                  })()}
                </div>

                {attachments && attachments.length > 0 ? (
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: '6px', padding: '16px' }}>
                    {attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        style={{
                          alignItems: 'center',
                          borderBottom: '1px solid #f5f5f5',
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{attachment.originalName || attachment.fileName}</div>
                          <div style={{ color: '#666', fontSize: '12px' }}>
                            大小: {attachment.fileSize ? (attachment.fileSize / 1024).toFixed(1) : 0}KB | 上传者:{' '}
                            {(() => {
                              // 尝试获取上传者姓名
                              let uploaderName =
                                (attachment.uploader as any)?.name ||
                                (attachment.uploader as any)?.nickName ||
                                (attachment.uploader as any)?.userName;

                              // 如果还是没有，从员工列表中查找
                              if (!uploaderName && attachment.uploader?.id) {
                                const uploader = employees.find(emp => emp.id === attachment.uploader?.id);
                                if (uploader) {
                                  uploaderName = uploader.nickName || uploader.userName;
                                }
                              }

                              return uploaderName || '未知';
                            })()}{' '}
                            | 时间:{' '}
                            {attachment.uploadTime
                              ? dayjs(attachment.uploadTime).format('YYYY-MM-DD HH:mm')
                              : '未知时间'}
                            {attachment.description && ` | 描述: ${attachment.description}`}
                          </div>
                        </div>
                        <Space>
                          <Button
                            size="small"
                            type="link"
                            onClick={() =>
                              handleDownloadAttachment(attachment.id, attachment.originalName || attachment.fileName)
                            }
                          >
                            下载
                          </Button>
                          {canEditAttachment(attachment) && (
                            <Button
                              danger
                              size="small"
                              type="link"
                              onClick={() => handleDeleteAttachment(attachment.id, currentTask.id)}
                            >
                              删除
                            </Button>
                          )}
                        </Space>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      border: '1px dashed #d9d9d9',
                      borderRadius: '6px',
                      color: '#999',
                      padding: '20px',
                      textAlign: 'center'
                    }}
                  >
                    暂无附件
                  </div>
                )}
              </div>
            </>
          )}
        </Modal>

        {/* 阶段操作弹窗 */}
        <Modal
          open={isStageActionModalVisible}
          title="阶段操作"
          width={600}
          onCancel={() => {
            setIsStageActionModalVisible(false);
            setUploadFileList([]); // 清空文件列表
            stageActionForm.resetFields();
          }}
          onOk={async () => {
            try {
              const values = await stageActionForm.validateFields();
              if (!currentTask) return;

              // 根据不同的操作调用不同的API
              switch (values.actionKey) {
                case 'advance_to_proposal':
                  await projectService.advanceStage({
                    action: 'advance_to_proposal',
                    remark: values.comment,
                    taskId: currentTask.id
                  });
                  break;
                case 'upload_proposal':
                  // 先上传附件（如果有）
                  if (uploadFileList.length > 0) {
                    try {
                      const uploadPromises = uploadFileList.map(file =>
                        handleFileUpload(file, currentTask.id, 'proposal_submission')
                      );
                      await Promise.all(uploadPromises);
                    } catch (error) {
                      console.error('上传附件失败:', error);
                      message.error('部分附件上传失败');
                    }
                  }

                  // 然后调用上传方案API
                  await projectService.uploadProposal({
                    attachments: [],
                    remark: values.comment,
                    taskId: currentTask.id
                  });

                  message.success('方案上传成功！');
                  break;
                case 'confirm_proposal':
                  // 客户已同意方案，推进到师资确定阶段
                  await projectService.confirmProposal({
                    remark: values.comment,
                    taskId: currentTask.id
                  });
                  message.success('方案确认成功，已进入师资确定阶段！');
                  break;
                case 'confirm_teacher':
                  await projectService.confirmTeacher({
                    remark: values.comment,
                    taskId: currentTask.id,
                    teacherInfo: {
                      experience: '',
                      name: values.teacherName || '',
                      specialties: [],
                      title: ''
                    }
                  });
                  break;
                case 'approve_project':
                  await projectService.approveProject(currentTask.id, true, values.comment);
                  break;
                case 'reject_project':
                  // 审批拒绝，打回到师资确定阶段
                  await projectService.approveProject(currentTask.id, false, values.comment);
                  message.success('审批已拒绝，项目已打回到师资确定阶段');
                  break;
                case 'confirm_contract':
                  await projectService.confirmContract(currentTask.id, true, values.comment);
                  break;
                case 'confirm_completion':
                  await projectService.confirmProjectCompletion(currentTask.id, true, values.comment);
                  break;
                case 'confirm_payment':
                  const receivedPayment = values.paymentReceived !== false;
                  const paymentAmount = values.amount ? Number(values.amount) : undefined;

                  await projectService.confirmPayment(currentTask.id, receivedPayment, paymentAmount, values.comment);

                  if (receivedPayment) {
                    message.success('收款确认成功，项目已完成并归档！所有相关人员已收到通知。');
                  } else {
                    message.success('收款状态已更新');
                  }
                  break;
                default:
                  break;
              }

              setIsStageActionModalVisible(false);
              message.success('操作成功');
              await fetchTasks();
            } catch (error: any) {
              console.error('操作失败:', error);
              message.error(error.message || '操作失败，请重试');
            }
          }}
        >
          <Form
            form={stageActionForm}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item
              label="操作"
              name="action"
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              hidden
              name="actionKey"
            >
              <Input />
            </Form.Item>

            {/* 款项金额字段 - 只在确认收款时显示，位于操作和备注之间 */}
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.actionKey !== currentValues.actionKey}
            >
              {({ getFieldValue }) => {
                const actionKey = getFieldValue('actionKey');

                if (actionKey === 'confirm_payment') {
                  return (
                    <Form.Item
                      label="款项金额"
                      name="amount"
                      rules={[{ message: '请输入款项金额', required: true }]}
                    >
                      <Input
                        placeholder="请输入款项金额"
                        prefix="¥"
                        type="number"
                      />
                    </Form.Item>
                  );
                }

                return null;
              }}
            </Form.Item>

            <Form.Item
              label="备注"
              name="comment"
            >
              <TextArea
                placeholder="请输入操作备注"
                rows={3}
              />
            </Form.Item>

            {/* 根据操作类型显示其他特殊字段 */}
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.actionKey !== currentValues.actionKey}
            >
              {({ getFieldValue }) => {
                const actionKey = getFieldValue('actionKey');

                // 上传方案操作显示文件上传
                if (actionKey === 'upload_proposal') {
                  return (
                    <Form.Item label="方案附件">
                      <Upload
                        multiple
                        beforeUpload={file => {
                          setUploadFileList([...uploadFileList, file]);
                          return false; // 阻止自动上传
                        }}
                        fileList={uploadFileList.map((file, index) => ({
                          name: file.name,
                          size: file.size,
                          status: 'done' as const,
                          type: file.type,
                          uid: `${index}`
                        }))}
                        onRemove={file => {
                          const index = Number.parseInt(file.uid || '0', 10);
                          const newFileList = [...uploadFileList];
                          newFileList.splice(index, 1);
                          setUploadFileList(newFileList);
                        }}
                      >
                        <Button icon={<UploadOutlined />}>选择文件</Button>
                      </Upload>
                      <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                        支持上传方案文档、设计图等相关文件
                      </div>
                    </Form.Item>
                  );
                }

                if (actionKey === 'confirm_teacher') {
                  return (
                    <>
                      <Form.Item
                        label="授课老师"
                        name="teacherName"
                        rules={[{ message: '请输入授课老师姓名', required: true }]}
                      >
                        <Input placeholder="请输入授课老师姓名" />
                      </Form.Item>
                      <Form.Item
                        label="联系方式"
                        name="teacherContact"
                      >
                        <Input placeholder="请输入老师联系方式" />
                      </Form.Item>
                    </>
                  );
                }

                return null;
              }}
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default ItemList;
