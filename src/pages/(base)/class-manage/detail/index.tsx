import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  InboxOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  UploadOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Progress,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import UserAvatar from '@/components/common/UserAvatar';
import { attachmentService, classService, courseService, customerService, notificationService } from '@/service/api';
import type { AttachmentApi, NotificationApi } from '@/service/api/types';
import { getCurrentUserId, isSuperAdmin } from '@/utils/auth';

const { Text } = Typography;

// 时间格式化工具函数
const formatUploadTime = (uploadTime: string): string => {
  const now = new Date();
  const uploadTimeDate = new Date(uploadTime);
  const diffMs = now.getTime() - uploadTimeDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return '刚才';
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  // 超过7天显示具体日期
  return uploadTimeDate.toLocaleString('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// 文件大小格式化工具函数
const formatFileSize = (sizeInBytes: number): string => {
  if (!sizeInBytes || sizeInBytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

/** 班级状态枚举 */
enum ClassStatus {
  NOT_STARTED = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2
}

/** 班级详情组件 */
const ClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // 检查是否为超级管理员
  const isSuperAdminUser = isSuperAdmin();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [courseList, setCourseList] = useState<any[]>([]);
  const [announceList, setAnnounceList] = useState<any[]>([]);

  // 编辑学员信息弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormStudent, setEditFormStudent] = useState<any>(null);
  const [editForm] = Form.useForm();

  // 头像上传状态
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarFileList, setAvatarFileList] = useState<any[]>([]);

  // 课程相关状态
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [courseDetailVisible, setCourseDetailVisible] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<any>(null);
  const [courseForm] = Form.useForm();
  const [courseAttachments, setCourseAttachments] = useState<any[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 通知公告相关状态
  const [announceModalVisible, setAnnounceModalVisible] = useState(false);
  const [currentAnnounce, setCurrentAnnounce] = useState<any>(null);
  const [announceForm] = Form.useForm();
  const [announceAttachments, setAnnounceAttachments] = useState<any[]>([]);
  const [announceDetailVisible, setAnnounceDetailVisible] = useState(false);
  const [announceUploadModalVisible, setAnnounceUploadModalVisible] = useState(false);
  const [announceFileList, setAnnounceFileList] = useState<any[]>([]);
  const [announceUploading, setAnnounceUploading] = useState(false);
  const [announceUploadProgress, setAnnounceUploadProgress] = useState(0);

  // 课程选择相关状态
  const [courseSelectModalVisible, setCourseSelectModalVisible] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseSelectLoading, setCourseSelectLoading] = useState(false);

  // 搜索相关状态
  const [searchText, setSearchText] = useState('');

  // 添加选择相关状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 客户导入相关状态
  const [isCustomerSelectModalVisible, setIsCustomerSelectModalVisible] = useState(false);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<any[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerSearchParams, setCustomerSearchParams] = useState({
    company: '',
    customerName: '',
    followStatus: ''
  });
  // 存储每个客户的培训费
  const [customerTrainingFees, setCustomerTrainingFees] = useState<Record<number, number>>({});
  // 客户列表分页状态
  const [customerPagination, setCustomerPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 学员列表分页状态
  const [studentPagination, setStudentPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 计算总培训费
  const calculateTotalTrainingFee = () => {
    return studentList.reduce((total, student) => {
      const fee = student.trainingFee ? Number.parseFloat(student.trainingFee) : 0;
      return total + fee;
    }, 0);
  };

  // 获取客户列表用于导入学员
  const fetchCustomerList = async (page = 1, pageSize = 10) => {
    try {
      setCustomerLoading(true);
      const params = {
        company: customerSearchParams.company || undefined,
        current: page,
        customerName: customerSearchParams.customerName || undefined,
        followStatus: customerSearchParams.followStatus || undefined,
        size: pageSize
      };

      const response = await customerService.getCustomerList(params);
      setCustomerList(response.records || []);
      setCustomerPagination({
        current: page,
        pageSize,
        total: response.total || 0
      });
    } catch {
      message.error('获取客户列表失败');
    } finally {
      setCustomerLoading(false);
    }
  };

  // 打开客户选择弹窗
  const openCustomerSelectModal = () => {
    setIsCustomerSelectModalVisible(true);
    setSelectedCustomers([]);
    setCustomerPagination({ current: 1, pageSize: 10, total: 0 });
    fetchCustomerList(1, 10);
  };

  // 处理客户列表分页变化
  const handleCustomerPaginationChange = (page: number, pageSize?: number) => {
    const newPageSize = pageSize || customerPagination.pageSize;
    fetchCustomerList(page, newPageSize);
  };

  // 获取学员列表
  const fetchStudentList = async (page = 1, pageSize = 20, search = '') => {
    if (!classId) return;

    try {
      setLoading(true);
      const params: any = {
        classId: Number.parseInt(classId, 10),
        current: page,
        size: pageSize
      };

      // 如果有搜索关键词，添加到参数中
      if (search.trim()) {
        params.keyword = search.trim();
      }

      const studentsResponse = await classService.getClassStudentList(params);

      const formattedStudents = studentsResponse.records.map((student: any) => ({
        attendance: student.attendanceRate || 0,
        avatar: student.avatar || null,
        company: student.company || '',
        createdBy: student.createdBy || null,
        email: student.email || '',
        gender: student.gender || '',
        id: student.id,
        joinDate: student.joinDate || '',
        landline: student.landline || '',
        name: student.name || '',
        phone: student.phone || '',
        position: student.position || '',
        trainingFee: student.trainingFee || 0
      }));

      setStudentList(formattedStudents);
      setStudentPagination({
        current: page,
        pageSize,
        total: studentsResponse.total || 0
      });
    } catch {
      message.error('获取学员列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理学员列表分页变化
  const handleStudentPaginationChange = (page: number, pageSize?: number) => {
    const newPageSize = pageSize || studentPagination.pageSize;
    fetchStudentList(page, newPageSize, searchText);
  };

  // 获取班级数据
  const fetchClassInfo = async () => {
    if (!classId) return;

    setLoading(true);
    try {
      // 获取班级基本信息
      const classResponse = await classService.getClassDetail(Number.parseInt(classId, 10));
      setClassInfo({
        categoryId: classResponse.categoryId || 1,
        categoryName: classResponse.categoryName || '未分类',
        courseName: classResponse.courseName || '',
        coursePrice: classResponse.coursePrice || 0,
        createdAt: classResponse.createdAt || '',
        description: classResponse.description || '',
        endDate: classResponse.endDate || '',
        id: classResponse.id,
        name: classResponse.name || '',
        startDate: classResponse.startDate || '',
        status: classResponse.status || 0,
        studentCount: classResponse.studentCount || 0,
        trainingFee: classResponse.trainingFee || '0.00'
      });

      // 获取课程列表
      const coursesResponse = await courseService.getClassCourseList({
        classId: Number.parseInt(classId, 10),
        current: 1,
        size: 1000
      });

      setCourseList(coursesResponse.records);

      // 获取班级相关的通知公告列表（只获取真正的班级通知，不包含系统通知）
      const announceResponse = await notificationService.getNotificationList({
        current: 1,
        relatedId: Number.parseInt(classId, 10),
        relatedType: 'class',
        // 只获取班级通知公告，不包含系统通知
        size: 1000,
        type: 'class_announcement'
      });

      // 格式化通知数据，保持数据结构一致性
      const formattedAnnouncements = announceResponse.records.map(
        (announcement: NotificationApi.NotificationListItem) => ({
          content: announcement.content,
          id: announcement.id,
          publishDate: dayjs(announcement.createTime).format('YYYY-MM-DD HH:mm:ss'),
          status: 1,
          title: announcement.title
        })
      );
      setAnnounceList(formattedAnnouncements);
    } catch (error) {
      console.error('获取班级数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 导入选中的客户为学员
  const handleImportCustomers = async () => {
    if (selectedCustomers.length === 0) {
      message.warning('请选择要导入的客户');
      return;
    }

    try {
      setLoading(true);

      // 检查重复学员
      const existingStudentNames = new Set(studentList.map(student => student.name));
      const duplicateCustomers: any[] = [];
      const validCustomers: any[] = [];

      selectedCustomers.forEach(customer => {
        if (existingStudentNames.has(customer.customerName)) {
          duplicateCustomers.push(customer);
        } else {
          validCustomers.push(customer);
        }
      });

      // 如果有重复的学员，给出提示
      if (duplicateCustomers.length > 0) {
        const duplicateNames = duplicateCustomers.map(c => c.customerName).join('、');

        if (validCustomers.length === 0) {
          message.warning(`所选客户 ${duplicateNames} 已经是班级学员，无法重复导入`);
          return;
        }
        message.warning(`客户 ${duplicateNames} 已经是班级学员，将跳过导入`);
      }

      if (validCustomers.length === 0) {
        message.warning('没有可导入的客户');
        return;
      }

      // 检查是否所有有效客户都填写了培训费
      const customersWithoutFee: string[] = [];
      validCustomers.forEach(customer => {
        const fee = customerTrainingFees[customer.id];
        if (!fee || fee <= 0) {
          customersWithoutFee.push(customer.customerName);
        }
      });

      if (customersWithoutFee.length > 0) {
        message.error(`请为以下客户填写培训费：${customersWithoutFee.join('、')}`);
        return;
      }

      // 批量导入有效客户为学员
      const importPromises = validCustomers.map(customer => {
        const studentData = {
          classId: Number.parseInt(classId!, 10),
          company: customer.company,
          email: customer.email || '',
          gender: customer.gender || '',
          joinDate: dayjs().format('YYYY-MM-DD'),
          landline: customer.landline || '',
          name: customer.customerName,
          phone: customer.phone || customer.mobile || '',
          position: customer.position || '',
          trainingFee: customerTrainingFees[customer.id] || 0
        };

        return classService.createStudent(studentData);
      });

      await Promise.all(importPromises);

      const successMessage =
        duplicateCustomers.length > 0
          ? `成功导入 ${validCustomers.length} 名学员，跳过 ${duplicateCustomers.length} 名重复学员`
          : `成功导入 ${validCustomers.length} 名学员`;

      message.success(successMessage);

      // 关闭弹窗并重新获取学员列表
      setIsCustomerSelectModalVisible(false);
      setSelectedCustomers([]);
      setCustomerTrainingFees({});
      await fetchStudentList();
    } catch (error) {
      console.error('导入学员失败:', error);
      message.error('导入学员失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassInfo();
    fetchStudentList();
  }, [classId]);

  // 添加页面焦点事件监听，当页面重新获得焦点时刷新学员数据
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleFocus = () => {
      // 使用防抖，避免频繁请求
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // 当页面重新获得焦点时，刷新学员列表以获取最新数据
        fetchStudentList(studentPagination.current, studentPagination.pageSize, searchText);
      }, 500); // 500ms 防抖
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearTimeout(timeoutId);
    };
  }, [fetchStudentList, studentPagination.current, studentPagination.pageSize, searchText]);

  // 获取状态标签颜色
  const getStatusColor = (status: ClassStatus) => {
    if (status === ClassStatus.IN_PROGRESS) return 'processing';
    if (status === ClassStatus.NOT_STARTED) return 'default';
    return 'success';
  };

  // 获取状态文本
  const getStatusText = (status: ClassStatus) => {
    if (status === ClassStatus.IN_PROGRESS) return '进行中';
    if (status === ClassStatus.NOT_STARTED) return '未开始';
    return '已结束';
  };



  // 返回列表页
  const handleBack = () => {
    navigate('/class-manage/list');
  };

  // 处理查看学员详情
  const handleViewStudentDetail = (student: any) => {
    Modal.info({
      content: (
        <div>
          <p>
            <strong>姓名：</strong> {student.name}
          </p>
          <p>
            <strong>报名人：</strong>{' '}
            {student.createdBy ? student.createdBy.nickName || student.createdBy.userName : '-'}
          </p>
          {isSuperAdminUser && (
            <>
              <p>
                <strong>学员ID：</strong> {student.studentId || student.id}
              </p>
              <p>
                <strong>性别：</strong> {student.gender || '-'}
              </p>
              <p>
                <strong>单位：</strong> {student.company || '-'}
              </p>
              <p>
                <strong>职务：</strong> {student.position || '-'}
              </p>
              <p>
                <strong>电话：</strong> {student.phone || '-'}
              </p>
              <p>
                <strong>座机号：</strong> {student.landline || '-'}
              </p>
              <p>
                <strong>邮箱：</strong> {student.email || '-'}
              </p>
              <p>
                <strong>加入日期：</strong> {student.joinDate || '-'}
              </p>
              <p>
                <strong>培训费：</strong> {student.trainingFee ? `¥${student.trainingFee}` : '-'}
              </p>
            </>
          )}
        </div>
      ),
      title: '学员详情',
      width: 500
    });
  };

  // 处理编辑学员
  const handleEditStudent = (student: any) => {
    setEditFormStudent(student);
    // 处理日期字段
    const formData = {
      ...student,
      joinDate: student.joinDate ? dayjs(student.joinDate) : null
    };
    editForm.setFieldsValue(formData);
    setEditModalVisible(true);
  };

  // 处理移除学员
  const handleRemoveStudent = async (studentId: number) => {
    Modal.confirm({
      content: '确定要删除该学员吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await classService.deleteStudent(studentId);
          message.success('学员删除成功');
          // 重新获取学员列表
          await fetchStudentList(studentPagination.current, studentPagination.pageSize, searchText);
        } catch (error) {
          message.error('删除失败');
          console.error('删除学员失败:', error);
        }
      },
      title: '删除学员'
    });
  };

  // 保存编辑学员信息
  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const values = await editForm.validateFields();

      // 合并表单数据和当前头像信息
      const updateData = {
        ...values,
        // 确保包含当前的头像信息
        avatar: editFormStudent?.avatar || null,
        // 处理日期格式
        joinDate: values.joinDate ? values.joinDate.format('YYYY-MM-DD') : null
      };

      // 调用后端API更新学员信息
      const updatedStudent = await classService.updateStudent(editFormStudent.id, updateData);

      // 更新本地学员列表
      setStudentList(prevList =>
        prevList.map(student => (student.id === editFormStudent.id ? { ...student, ...updatedStudent } : student))
      );

      setEditModalVisible(false);
      message.success('学员信息更新成功');
    } catch (error) {
      console.error('更新学员信息失败:', error);
      message.error('更新学员信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 验证上传文件
  const validateUploadFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB！');
      return false;
    }

    return true;
  };

  // 处理上传错误
  const handleUploadError = (error: any) => {
    console.error('头像上传失败，详细错误信息:', error);
    console.error('错误堆栈:', error.stack);

    let errorMessage = '头像上传失败';

    if (error?.response?.status === 500) {
      errorMessage = '服务器内部错误，请联系管理员';
    } else if (error?.response?.status === 404) {
      errorMessage = '学员不存在';
    } else if (error?.response?.status === 400) {
      errorMessage = error?.response?.data?.message || '请求参数错误';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    message.error(errorMessage);
  };

  // 处理头像上传
  const handleAvatarUpload = async (file: File) => {
    if (!validateUploadFile(file)) {
      return false;
    }

    try {
      setAvatarUploading(true);

      const result = await classService.uploadStudentAvatar(editFormStudent.id, file);

      // 提取头像URL
      let avatarUrl = result.data?.avatar || result.avatar;

      // 确保URL是完整的
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        avatarUrl = `http://localhost:3001${avatarUrl}`;
      }

      // 更新编辑表单中的头像字段
      setEditFormStudent((prev: any) => ({
        ...prev,
        avatar: avatarUrl
      }));

      // 更新本地学员列表中的头像
      setStudentList(prevList =>
        prevList.map(student => (student.id === editFormStudent.id ? { ...student, avatar: avatarUrl } : student))
      );

      message.success('头像上传成功');
      return false; // 阻止Upload组件的默认上传行为
    } catch (error: any) {
      handleUploadError(error);
      return false;
    } finally {
      setAvatarUploading(false);
    }
  };

  // 学员列表表格列配置 - 根据权限动态生成
  const getStudentColumns = () => {
    const currentUserId = getCurrentUserId();

    // 基础列（所有用户都能看到）
    const basicColumns = [
      {
        align: 'center' as const,
        dataIndex: 'index',
        key: 'index',
        render: (_: any, __: any, index: number) => index + 1,
        title: '序号',
        width: 80
      },
      {
        align: 'center' as const,
        dataIndex: 'name',
        key: 'name',
        render: (text: string, record: any) => (
          <Space>
            <UserAvatar
              avatar={record.avatar}
              gender={record.gender}
              size={40}
            />
            {text}
          </Space>
        ),
        title: '姓名',
        width: 120
      },
      {
        align: 'center' as const,
        dataIndex: 'trainingFee',
        key: 'trainingFee',
        render: (fee: string | null) => (fee ? `¥${fee}` : '-'),
        title: '培训费',
        width: 100
      },
      {
        align: 'center' as const,
        dataIndex: 'createdBy',
        key: 'createdBy',
        render: (createdBy: any) => {
          if (!createdBy) return '-';
          return <span title={`用户名: ${createdBy.userName}`}>{createdBy.nickName || createdBy.userName}</span>;
        },
        title: '导入人',
        width: 100
      }
    ];

    // 超级管理员可以看到的额外列
    const adminColumns = isSuperAdminUser
      ? [
          {
            align: 'center' as const,
            dataIndex: 'company',
            key: 'company',
            title: '单位',
            width: 150
          },
          {
            align: 'center' as const,
            dataIndex: 'gender',
            key: 'gender',
            render: (gender: string) => {
              if (!gender) return '-';
              if (gender === 'male') return '男';
              if (gender === 'female') return '女';
              return gender;
            },
            title: '性别',
            width: 80
          },
          {
            align: 'center' as const,
            dataIndex: 'position',
            key: 'position',
            title: '职务',
            width: 120
          },
          {
            align: 'center' as const,
            dataIndex: 'phone',
            key: 'phone',
            title: '电话',
            width: 120
          },
          {
            align: 'center' as const,
            dataIndex: 'email',
            key: 'email',
            title: '邮箱',
            width: 180
          },
          {
            align: 'center' as const,
            dataIndex: 'joinDate',
            key: 'joinDate',
            title: '加入日期',
            width: 120
          }
        ]
      : [];

    // 操作列
    const actionColumn = {
      align: 'center' as const,
      fixed: 'right' as const,
      key: 'action',
      render: (_: unknown, record: any) => {
        // 检查是否是学员的创建者或超级管理员
        const isCreator = record.createdBy && record.createdBy.id === currentUserId;
        const canEdit = isSuperAdminUser || isCreator;

        return (
          <Space size={[4, 0]}>
            <Button
              size="small"
              type="link"
              onClick={() => handleViewStudentDetail(record)}
            >
              详情
            </Button>
            {canEdit && (
              <>
                <Button
                  size="small"
                  type="link"
                  onClick={() => handleEditStudent(record)}
                >
                  编辑
                </Button>
                <Button
                  danger
                  size="small"
                  type="link"
                  onClick={() => handleRemoveStudent(record.id)}
                >
                  删除
                </Button>
              </>
            )}
          </Space>
        );
      },
      title: '操作',
      width: 160
    };

    return [...basicColumns, ...adminColumns, actionColumn];
  };

  // 查看课程详情
  const handleViewCourseDetail = async (course: any) => {
    setCurrentCourse(course);

    try {
      // 使用真实的API获取课程附件数据
      const courseAttachmentsResponse = await attachmentService.getAttachmentList({
        courseId: course.id,
        current: 1,
        size: 1000
      });

      // 修正数据路径 - API客户端已经自动提取data字段
      const formattedCourseAttachments = ((courseAttachmentsResponse as any)?.records || []).map(
        (attachment: AttachmentApi.AttachmentListItem) => ({
          id: attachment.id,
          name: attachment.originalName || attachment.fileName, // 优先使用原始文件名
          size: attachment.fileSize,
          type: attachment.fileType?.toUpperCase() || 'UNKNOWN',
          uploader: attachment.uploader?.name || '未知',
          uploadTime: attachment.uploadTime,
          url: attachment.downloadUrl || '#' // 使用downloadUrl字段
        })
      );

      setCourseAttachments(formattedCourseAttachments);
    } catch (error) {
      console.error('获取课程附件失败:', error);
      // 如果获取附件失败，设置为空数组
      setCourseAttachments([]);
    }

    setCourseDetailVisible(true);
  };

  // 编辑课程信息
  const handleEditCourse = (course: any) => {
    setCurrentCourse(course);

    // 只设置授课教师字段的初值，兼容instructor和teacher字段
    courseForm.setFieldsValue({
      teacher: course.instructor || course.teacher || ''
    });

    setCourseModalVisible(true);
  };

  // 获取可用课程列表
  const fetchAvailableCourses = async () => {
    setCourseSelectLoading(true);
    try {
      const response = await courseService.getCourseList({
        current: 1,
        size: 1000
      });

      if (response && response.records) {
        setAvailableCourses(response.records);
        if (response.records.length === 0) {
          message.info('暂无可用的课程，请先在课程管理中创建课程');
        }
      } else {
        setAvailableCourses([]);
        message.warning('获取课程列表响应格式异常');
      }
    } catch (error: any) {
      console.error('获取课程列表失败:', error);

      if (error?.message?.includes('401') || error?.response?.status === 401) {
        message.error('登录已过期，请重新登录');
      } else if (error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
        message.error('网络连接失败，请检查网络设置');
      } else {
        message.error(`获取课程列表失败: ${error?.message || '未知错误'}`);
      }
      setAvailableCourses([]);
    } finally {
      setCourseSelectLoading(false);
    }
  };

  // 确认选择课程并替换
  const handleConfirmCourseSelect = async () => {
    if (!selectedCourseId) {
      message.warning('请选择一个课程');
      return;
    }

    try {
      // 调用API关联课程到班级，需要传入完整的班级信息
      const updateData = {
        categoryId: classInfo?.categoryId || 1,
        courseId: selectedCourseId,
        description: classInfo?.description || '',
        endDate: classInfo?.endDate || '',
        name: classInfo?.name || '',
        startDate: classInfo?.startDate || ''
      };

      await classService.updateClass(Number.parseInt(classId!, 10), updateData);
      message.success('课程更换成功');

      // 重新获取班级数据
      await fetchClassInfo();

      // 关闭弹窗并重置状态
      setCourseSelectModalVisible(false);
      setSelectedCourseId(null);
    } catch (error) {
      console.error('更换课程失败:', error);
      message.error('更换课程失败');
    }
  };

  // 添加/更换课程
  const handleAddCourse = () => {
    // 如果班级已有课程，提醒用户将会替换现有课程
    if (courseList.length > 0) {
      Modal.confirm({
        cancelText: '取消',
        content: (
          <div>
            <p>
              当前班级已有课程：<strong>{courseList[0]?.name}</strong>
            </p>
            <p>
              添加新课程将会<span style={{ color: '#ff4d4f' }}>替换</span>现有课程，确定要继续吗？
            </p>
          </div>
        ),
        okText: '确定替换',
        onOk: () => {
          fetchAvailableCourses();
          setCourseSelectModalVisible(true);
        },
        title: '确认添加课程'
      });
    } else {
      fetchAvailableCourses();
      setCourseSelectModalVisible(true);
    }
  };

  // 保存课程（只更新授课教师）
  const handleSaveCourse = async () => {
    try {
      const values = await courseForm.validateFields();

      if (currentCourse) {
        // 只传递需要更新的字段，避免数据库字段冲突
        const courseData = {
          instructor: values.teacher
        };

        await courseService.updateCourse(currentCourse.id, courseData);
        message.success('授课教师更新成功');

        setCourseModalVisible(false);
        courseForm.resetFields();
        setCurrentCourse(null);

        // 重新获取所有班级数据，确保课程列表更新
        await fetchClassInfo();
      } else {
        message.error('无法找到课程信息');
      }
    } catch (error) {
      message.error('更新授课教师失败');
      console.error('更新授课教师失败:', error);
    }
  };

  // 导出学员数据
  const handleExportStudents = () => {
    Modal.confirm({
      content: '确定要导出所有学员数据吗？',
      onOk: () => {
        // 创建一个假的进度通知
        const key = 'exportProgress';
        message.loading({ content: '导出准备中...', key });

        // 模拟进度过程
        setTimeout(() => {
          message.loading({ content: '导出进行中 (30%)...', key });

          setTimeout(() => {
            message.loading({ content: '导出进行中 (60%)...', key });

            setTimeout(() => {
              message.loading({ content: '导出完成中 (90%)...', key });

              setTimeout(() => {
                // 性别转换函数
                const formatGender = (gender: string) => {
                  if (!gender) return '-';
                  if (gender === 'male') return '男';
                  if (gender === 'female') return '女';
                  return gender;
                };

                // 构建CSV内容
                const headers = ['学员ID', '姓名', '性别', '单位', '职务', '电话', '座机号', '邮箱', '加入日期'];
                const csvContent = [
                  headers.join(','),
                  ...studentList.map(student =>
                    [
                      student.studentId,
                      student.name,
                      formatGender(student.gender),
                      student.company,
                      student.position,
                      student.phone,
                      student.landline,
                      student.email,
                      student.joinDate
                    ].join(',')
                  )
                ].join('\n');

                // 创建下载链接
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');

                // 设置下载属性
                link.href = url;
                link.setAttribute('download', `班级学员列表_${dayjs().format('YYYYMMDD')}.csv`);
                document.body.appendChild(link);

                // 触发下载并清理
                link.click();
                document.body.removeChild(link);

                // 更新成功消息
                message.success({ content: '学员数据导出成功！', duration: 2, key });
              }, 500);
            }, 500);
          }, 500);
        }, 500);
      },
      title: '导出学员数据'
    });
  };

  // 处理文件上传
  const handleUploadFile = () => {
    setUploadModalVisible(true);
    setFileList([]);
    setUploadProgress(0);
  };

  // 处理文件上传完成
  const handleFileUpload = async () => {
    if (fileList.length === 0) {
      message.error('请先选择要上传的文件');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 使用真实的API上传文件
      const uploadPromises = fileList.map(async (file, index) => {
        setUploadProgress(Math.floor(((index + 1) / fileList.length) * 80)); // 进度到80%

        try {
          const uploadData = {
            courseId: currentCourse?.id || 0,
            description: '课程附件',
            file: file.originFileObj || file
          };

          const result = await attachmentService.uploadAttachment(uploadData);
          return result;
        } catch (error) {
          console.error(`上传文件 ${file.name} 失败:`, error);
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      setUploadProgress(100);

      message.success(`成功上传了 ${fileList.length} 个文件`);

      // 重新获取课程附件列表并刷新整个班级信息
      await fetchClassInfo(); // 重新获取完整的班级数据，包括附件列表

      // 如果当前有打开的课程详情，也需要刷新该课程的附件列表
      if (currentCourse?.id) {
        await handleViewCourseDetail(currentCourse);
      }

      // 延迟一会儿显示上传完成状态
      setTimeout(() => {
        setUploading(false);
        setUploadModalVisible(false);
        setFileList([]);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('文件上传失败:', error);
      message.error('文件上传失败，请重试');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 处理附件删除
  const handleDeleteAttachment = async (attachmentId: number) => {
    Modal.confirm({
      content: '确定要删除这个附件吗？',
      onOk: async () => {
        try {
          await attachmentService.deleteAttachment(attachmentId);
          message.success('附件已删除');

          // 重新获取课程附件列表
          if (currentCourse?.id) {
            const courseAttachmentsResponse = await attachmentService.getAttachmentList({
              courseId: currentCourse.id,
              current: 1,
              size: 1000
            });

            // 修正数据路径
            const formattedCourseAttachments = ((courseAttachmentsResponse as any)?.records || []).map(
              (attachment: AttachmentApi.AttachmentListItem) => ({
                id: attachment.id,
                name: attachment.originalName || attachment.fileName, // 优先使用原始文件名
                size: attachment.fileSize,
                type: attachment.fileType?.toUpperCase() || 'UNKNOWN',
                uploader: attachment.uploader?.name || '未知',
                uploadTime: attachment.uploadTime,
                url: attachment.downloadUrl || '#'
              })
            );

            setCourseAttachments(formattedCourseAttachments);
          }
        } catch (error) {
          console.error('删除附件失败:', error);
          message.error('删除附件失败');
        }
      },
      title: '确认删除'
    });
  };

  // 处理课程附件下载
  const handleDownloadCourseAttachment = async (attachment: any) => {
    try {
      // 使用课程附件服务的下载方法
      const response = await attachmentService.downloadAttachment(attachment.id);

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`下载成功: ${attachment.name}`);
    } catch (error) {
      console.error('下载课程附件失败:', error);
      message.error('下载失败，请重试');
    }
  };

  // 处理通知附件下载
  const handleDownloadNotificationAttachment = async (attachment: any) => {
    if (!currentAnnounce?.id) {
      message.error('通知ID无效');
      return;
    }

    try {
      // 使用通知服务的下载方法
      const response = await notificationService.downloadNotificationAttachment(currentAnnounce.id, attachment.id);

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`下载成功: ${attachment.name}`);
    } catch (error) {
      console.error('下载通知附件失败:', error);
      message.error('下载失败，请重试');
    }
  };

  // 发布通知
  const handlePublishAnnounce = () => {
    setCurrentAnnounce(null);
    announceForm.resetFields();
    setAnnounceModalVisible(true);
  };

  // 保存通知公告
  const handleSaveAnnounce = async () => {
    try {
      const values = await announceForm.validateFields();

      const announceData = {
        content: values.content,
        relatedId: Number.parseInt(classId!, 10),
        relatedType: 'class',
        title: values.title,
        type: 'class_announcement'
      };

      if (currentAnnounce) {
        // 编辑模式 - 这里暂时只更新本地状态，实际项目中应该调用更新API
        const updatedAnnounce = {
          ...currentAnnounce,
          ...values,
          publishDate: new Date().toLocaleString()
        };

        setAnnounceList(prev => prev.map(item => (item.id === currentAnnounce.id ? updatedAnnounce : item)));
        message.success('通知已更新');
      } else {
        // 新建模式 - 调用API创建通知
        const _result = await notificationService.createNotification(announceData);

        // 重新获取通知列表（只获取班级通知公告，不包含系统通知）
        const announcementsResponse = await notificationService.getNotificationList({
          current: 1,
          relatedId: Number.parseInt(classId!, 10),
          relatedType: 'class',
          // 只获取班级通知公告
          size: 1000,
          type: 'class_announcement'
        });

        const formattedAnnouncements = announcementsResponse.records.map(
          (announcement: NotificationApi.NotificationListItem) => ({
            content: announcement.content,
            id: announcement.id,

            publishDate: dayjs(announcement.createTime).format('YYYY-MM-DD HH:mm:ss'),
            status: 1,
            title: announcement.title
          })
        );

        setAnnounceList(formattedAnnouncements);
        message.success('通知发布成功');
      }

      setAnnounceModalVisible(false);
      setCurrentAnnounce(null);
      announceForm.resetFields();
    } catch (error) {
      console.error('保存通知失败:', error);
      message.error('保存通知失败');
    }
  };

  const handleEditAnnounce = (announce: any) => {
    setCurrentAnnounce(announce);
    announceForm.setFieldsValue({
      content: announce.content,
      title: announce.title
    });
    setAnnounceModalVisible(true);
  };

  // 删除通知
  const handleDeleteAnnounce = async (announceId: number) => {
    Modal.confirm({
      content: '确定要删除这条通知吗？',
      onOk: async () => {
        try {
          await notificationService.deleteNotification(announceId);
          message.success('通知删除成功');

          // 重新获取通知列表（只获取班级通知公告，不包含系统通知）
          const notificationsResponse = await notificationService.getNotificationList({
            current: 1,
            relatedId: Number.parseInt(classId!, 10),
            relatedType: 'class',
            // 只获取班级通知公告
            size: 1000,
            type: 'class_announcement'
          });

          const formattedAnnouncements = notificationsResponse.records.map(
            (notification: NotificationApi.NotificationListItem) => ({
              content: notification.content,
              id: notification.id,
              publishDate: dayjs(notification.createTime).format('YYYY-MM-DD HH:mm:ss'),
              title: notification.title
            })
          );

          setAnnounceList(formattedAnnouncements);
        } catch (error) {
          console.error('删除通知失败:', error);
          message.error('删除通知失败');
        }
      },
      title: '确认删除'
    });
  };

  const handleViewAnnounceDetail = async (announce: any) => {
    setCurrentAnnounce(announce);

    try {
      // 使用专门的通知附件API获取附件列表
      const announceAttachmentsResponse = await notificationService.getNotificationAttachments(announce.id, {
        current: 1,
        size: 1000
      });

      const formattedAnnounceAttachments =
        announceAttachmentsResponse.records?.map((attachment: NotificationApi.NotificationAttachmentListItem) => ({
          id: attachment.id,
          name: attachment.originalName || attachment.fileName, // 优先使用原始文件名
          size: attachment.fileSize,
          type: attachment.fileType?.toUpperCase() || 'UNKNOWN',
          uploader: attachment.uploader?.name || '未知',
          uploadTime: attachment.uploadTime,
          url: attachment.downloadUrl || '#'
        })) || [];

      setAnnounceAttachments(formattedAnnounceAttachments);
    } catch (error) {
      console.error('获取通知附件失败:', error);
      // 如果获取附件失败，设置为空数组
      setAnnounceAttachments([]);
    }

    setAnnounceDetailVisible(true);
  };

  const handleUploadAnnounceFile = () => {
    setAnnounceFileList([]);
    setAnnounceUploadProgress(0);
    setAnnounceUploading(false);
    setAnnounceUploadModalVisible(true);
  };

  const handleAnnounceFileUpload = async () => {
    if (announceFileList.length === 0) {
      message.error('请先选择要上传的文件');
      return;
    }

    if (!currentAnnounce?.id) {
      message.error('通知ID无效');
      return;
    }

    setAnnounceUploading(true);
    setAnnounceUploadProgress(0);

    try {
      // 使用专门的通知附件上传API
      const uploadPromises = announceFileList.map(async (file, index) => {
        setAnnounceUploadProgress(Math.floor(((index + 1) / announceFileList.length) * 80));

        try {
          const result = await notificationService.uploadNotificationAttachment({
            description: `通知附件 - ${currentAnnounce.title}`,
            file: file.originFileObj || file,
            notificationId: currentAnnounce.id
          });
          return result;
        } catch (error) {
          console.error(`上传文件 ${file.name} 失败:`, error);
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      setAnnounceUploadProgress(100);

      message.success(`成功上传了 ${announceFileList.length} 个文件`);

      // 重新获取通知附件列表
      const announceAttachmentsResponse = await notificationService.getNotificationAttachments(currentAnnounce.id, {
        current: 1,
        size: 1000
      });

      const formattedAnnounceAttachments =
        announceAttachmentsResponse.records?.map((attachment: NotificationApi.NotificationAttachmentListItem) => ({
          id: attachment.id,
          name: attachment.originalName || attachment.fileName, // 优先使用原始文件名
          size: attachment.fileSize,
          type: attachment.fileType?.toUpperCase() || 'UNKNOWN',
          uploader: attachment.uploader?.name || '未知',
          uploadTime: attachment.uploadTime,
          url: attachment.downloadUrl || '#'
        })) || [];

      setAnnounceAttachments(formattedAnnounceAttachments);

      // 延迟关闭模态框
      setTimeout(() => {
        setAnnounceUploading(false);
        setAnnounceUploadModalVisible(false);
        setAnnounceFileList([]);
        setAnnounceUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('通知附件上传失败:', error);
      message.error('文件上传失败，请重试');
      setAnnounceUploading(false);
      setAnnounceUploadProgress(0);
    }
  };

  const handleDeleteAnnounceAttachment = async (attachmentId: number) => {
    Modal.confirm({
      content: '确定要删除该附件吗？此操作不可恢复。',
      onOk: async () => {
        try {
          if (!currentAnnounce?.id) {
            message.error('通知ID无效');
            return;
          }

          await notificationService.deleteNotificationAttachment(currentAnnounce.id, attachmentId);
          message.success('附件已成功删除');

          // 重新获取通知附件列表
          const announceAttachmentsResponse = await notificationService.getNotificationAttachments(currentAnnounce.id, {
            current: 1,
            size: 1000
          });

          const formattedAnnounceAttachments =
            announceAttachmentsResponse.records?.map((attachment: NotificationApi.NotificationAttachmentListItem) => ({
              id: attachment.id,
              name: attachment.originalName || attachment.fileName, // 优先使用原始文件名
              size: attachment.fileSize,
              type: attachment.fileType?.toUpperCase() || 'UNKNOWN',
              uploader: attachment.uploader?.name || '未知',
              uploadTime: attachment.uploadTime,
              url: attachment.downloadUrl || '#'
            })) || [];

          setAnnounceAttachments(formattedAnnounceAttachments);
        } catch (error) {
          console.error('删除通知附件失败:', error);
          message.error('删除附件失败');
        }
      },
      title: '确认删除'
    });
  };

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

    // 如果搜索框被清空，自动重新加载数据
    if (value === '') {
      setStudentPagination({ current: 1, pageSize: 20, total: 0 });
      fetchStudentList(1, 20, '');
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setStudentPagination({ current: 1, pageSize: 20, total: 0 });
    fetchStudentList(1, 20, value);
  };

  // 处理表格选择变化
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的学员');
      return;
    }

    Modal.confirm({
      content: `确定要删除选中的 ${selectedRowKeys.length} 名学员吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          setDeleteLoading(true);
          const studentIdsToDelete = selectedRowKeys.map(key => Number(key));
          await classService.deleteStudentsBatch(studentIdsToDelete);
          message.success(`成功删除 ${selectedRowKeys.length} 名学员`);
          setSelectedRowKeys([]);
          // 重新获取学员列表
          await fetchStudentList(studentPagination.current, studentPagination.pageSize, searchText);
        } catch (error) {
          message.error('批量删除失败');
          console.error('批量删除失败:', error);
        } finally {
          setDeleteLoading(false);
        }
      },
      title: '批量删除学员'
    });
  };

  // 渲染主要信息区域
  const renderBasicInfo = () => {
    if (!classInfo) return null;

    const totalTrainingFee = calculateTotalTrainingFee();

    return (
      <Card
        className="mb-4"
        variant="borderless"
      >
        <Descriptions
          column={{ lg: 3, md: 2, sm: 1, xl: 4, xs: 1, xxl: 4 }}
          title={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                type="link"
                onClick={handleBack}
              >
                返回
              </Button>
              <span>班级信息</span>
            </Space>
          }
        >
          <Descriptions.Item label="班级名称">{classInfo.name}</Descriptions.Item>
          <Descriptions.Item label="班级ID">{classInfo.id}</Descriptions.Item>
          <Descriptions.Item label="班级类型">{classInfo.categoryName}</Descriptions.Item>
          <Descriptions.Item label="培训课程">{classInfo.courseName || '暂无'}</Descriptions.Item>
          <Descriptions.Item label="学员人数">{classInfo.studentCount}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(classInfo.status)}>{getStatusText(classInfo.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="培训费">
            <span className="text-blue-600 font-semibold">¥{totalTrainingFee.toFixed(2)}</span>
            <span className="ml-2 text-sm text-gray-500">(共{studentList.length}名学员)</span>
          </Descriptions.Item>
          <Descriptions.Item label="开始日期">{classInfo.startDate}</Descriptions.Item>
          <Descriptions.Item label="结束日期">{classInfo.endDate}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{classInfo.createdAt}</Descriptions.Item>
          <Descriptions.Item
            label="班级描述"
            span={3}
          >
            {classInfo.description || '暂无描述'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  // 渲染学员列表
  const renderStudentList = () => {
    return (
      <Card
        title="班级学员"
        variant="borderless"
        extra={
          <Space>
            <Button
              icon={<UserAddOutlined />}
              type="primary"
              onClick={openCustomerSelectModal}
            >
              导入学员
            </Button>
            <Button
              icon={<ReloadOutlined />}
              title="刷新学员信息"
              onClick={() => fetchStudentList(studentPagination.current, studentPagination.pageSize, searchText)}
            >
              刷新
            </Button>
            {isSuperAdminUser && <Button onClick={handleExportStudents}>导出学员</Button>}
            {selectedRowKeys.length > 0 && (
              <Button
                danger
                disabled={selectedRowKeys.length === 0}
                loading={deleteLoading}
                onClick={handleBatchDelete}
              >
                批量删除 ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
        }
      >
        {/* 搜索框 */}
        <div className="mb-4">
          <Input.Search
            allowClear
            enterButton="搜索"
            placeholder="请输入姓名、单位或导入人进行搜索"
            size="large"
            style={{ maxWidth: 400 }}
            value={searchText}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
        </div>

        <Table
          columns={getStudentColumns()}
          dataSource={studentList}
          loading={loading}
          rowKey="id"
          scroll={{ x: isSuperAdmin() ? 1200 : 500 }}
          pagination={{
            current: studentPagination.current,
            onChange: handleStudentPaginationChange,
            onShowSizeChange: handleStudentPaginationChange,
            pageSize: studentPagination.pageSize,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            total: studentPagination.total
          }}
          rowSelection={{
            getCheckboxProps: (record: any) => {
              // 只允许选择自己导入的学员或超级管理员可以选择所有学员
              const currentUserId = getCurrentUserId();
              const isCreator = record.createdBy && record.createdBy.id === currentUserId;
              const canSelect = isSuperAdmin() || isCreator;

              return {
                disabled: !canSelect
              };
            },
            onChange: onSelectChange,
            selectedRowKeys
          }}
        />

        {/* 客户选择弹窗 */}
        <Modal
          okButtonProps={{ disabled: selectedCustomers.length === 0 }}
          okText={`导入选中的客户 (${selectedCustomers.length})`}
          open={isCustomerSelectModalVisible}
          title="从客户资料中导入学员"
          width={1200}
          onCancel={() => setIsCustomerSelectModalVisible(false)}
          onOk={handleImportCustomers}
        >
          {/* 客户搜索区域 */}
          <div className="mb-4 flex items-center gap-4">
            <Input
              allowClear
              placeholder="客户姓名"
              style={{ width: 150 }}
              value={customerSearchParams.customerName}
              onChange={e => setCustomerSearchParams({ ...customerSearchParams, customerName: e.target.value })}
            />
            <Input
              allowClear
              placeholder="单位名称"
              style={{ width: 200 }}
              value={customerSearchParams.company}
              onChange={e => setCustomerSearchParams({ ...customerSearchParams, company: e.target.value })}
            />
            <Select
              allowClear
              placeholder="跟进状态"
              style={{ width: 150 }}
              value={customerSearchParams.followStatus}
              onChange={value => setCustomerSearchParams({ ...customerSearchParams, followStatus: value })}
            >
              <Select.Option value="consult">咨询</Select.Option>
              <Select.Option value="new_develop">新开发</Select.Option>
              <Select.Option value="effective_visit">有效回访</Select.Option>
              <Select.Option value="registered">已报名</Select.Option>
              <Select.Option value="vip">大客户</Select.Option>
            </Select>
            <Button
              type="primary"
              onClick={() => {
                setCustomerPagination({ current: 1, pageSize: 10, total: 0 });
                fetchCustomerList(1, 10);
              }}
            >
              搜索
            </Button>
          </div>

          {/* 客户列表表格 */}
          <Table
            dataSource={customerList}
            loading={customerLoading}
            rowKey="id"
            scroll={{ x: 1020, y: 400 }}
            columns={[
              {
                dataIndex: 'customerName',
                key: 'customerName',
                title: '客户姓名',
                width: 120
              },
              {
                dataIndex: 'gender',
                key: 'gender',
                render: (gender: string) => {
                  if (!gender) return '-';
                  if (gender === 'male') return '男';
                  if (gender === 'female') return '女';
                  return gender;
                },
                title: '性别',
                width: 80
              },
              {
                dataIndex: 'company',
                key: 'company',
                title: '单位名称',
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
                width: 120
              },
              {
                dataIndex: 'mobile',
                key: 'mobile',
                title: '手机',
                width: 120
              },
              {
                dataIndex: 'followStatus',
                key: 'followStatus',
                render: (status: string) => {
                  if (status === 'empty') {
                    return <span style={{ color: '#8c8c8c' }}>-</span>;
                  }
                  const statusMap: Record<string, { color: string; text: string }> = {
                    consult: { color: 'blue', text: '咨询' },
                    effective_visit: { color: 'orange', text: '有效回访' },
                    new_develop: { color: 'green', text: '新开发' },
                    registered: { color: 'purple', text: '已报名' },
                    vip: { color: 'red', text: '大客户' }
                  };
                  const config = statusMap[status] || { color: 'default', text: status };
                  return <Tag color={config.color}>{config.text}</Tag>;
                },
                title: '跟进状态',
                width: 100
              },
              {
                key: 'trainingFee',
                render: (_: any, record: any) => {
                  const existingStudentNames = new Set(studentList.map(student => student.name));
                  const isExisting = existingStudentNames.has(record.customerName);

                  if (isExisting) {
                    return <span style={{ color: '#999' }}>-</span>;
                  }

                  return (
                    <InputNumber
                      min={0}
                      placeholder="培训费"
                      size="small"
                      style={{ width: 100 }}
                      value={customerTrainingFees[record.id] || undefined}
                      onChange={value => {
                        setCustomerTrainingFees(prev => ({
                          ...prev,
                          [record.id]: value || 0
                        }));
                      }}
                    />
                  );
                },
                title: '培训费(¥)',
                width: 120
              },
              {
                key: 'isExistingStudent',
                render: (_: any, record: any) => {
                  const existingStudentNames = new Set(studentList.map(student => student.name));
                  const isExisting = existingStudentNames.has(record.customerName);
                  return isExisting ? <Tag color="red">已是学员</Tag> : <Tag color="green">可导入</Tag>;
                },
                title: '状态',
                width: 80
              }
            ]}
            pagination={{
              current: customerPagination.current,
              onChange: handleCustomerPaginationChange,
              onShowSizeChange: handleCustomerPaginationChange,
              pageSize: customerPagination.pageSize,
              showQuickJumper: true,
              showSizeChanger: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              total: customerPagination.total
            }}
            rowSelection={{
              getCheckboxProps: (record: any) => {
                const existingStudentNames = new Set(studentList.map(student => student.name));
                const isExisting = existingStudentNames.has(record.customerName);
                return {
                  disabled: isExisting
                };
              },
              onChange: (keys: React.Key[]) => {
                const selected = customerList.filter(customer => keys.includes(customer.id));
                setSelectedCustomers(selected);
              },
              selectedRowKeys: selectedCustomers.map(c => c.id)
            }}
          />
        </Modal>

        {/* 编辑学员弹窗 */}
        <Modal
          confirmLoading={loading}
          open={editModalVisible}
          title="编辑学员信息"
          width={600}
          onCancel={() => setEditModalVisible(false)}
          onOk={handleSaveEdit}
        >
          <Form
            form={editForm}
            labelCol={{ span: 6 }}
            style={{ marginTop: 20 }}
            wrapperCol={{ span: 16 }}
          >
            {/* 头像上传 */}
            <Form.Item label="头像">
              <div className="flex items-center space-x-4">
                <UserAvatar
                  avatar={editFormStudent?.avatar}
                  gender={editFormStudent?.gender}
                  size={80}
                />
                <Upload
                  accept="image/*"
                  beforeUpload={handleAvatarUpload}
                  fileList={avatarFileList}
                  showUploadList={false}
                  onChange={({ fileList: uploadFileList }) => setAvatarFileList(uploadFileList)}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={avatarUploading}
                  >
                    {avatarUploading ? '上传中...' : '更换头像'}
                  </Button>
                </Upload>
              </div>
            </Form.Item>

            <Form.Item
              label="姓名"
              name="name"
              rules={[{ message: '请输入学员姓名', required: true }]}
            >
              <Input placeholder="请输入学员姓名" />
            </Form.Item>
            <Form.Item
              label="性别"
              name="gender"
              rules={[{ message: '请选择性别', required: true }]}
            >
              <Select placeholder="请选择性别">
                <Select.Option value="男">男</Select.Option>
                <Select.Option value="女">女</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="单位"
              name="company"
              rules={[{ message: '请输入单位', required: true }]}
            >
              <Input placeholder="请输入单位" />
            </Form.Item>
            <Form.Item
              label="职务"
              name="position"
            >
              <Input placeholder="请输入职务" />
            </Form.Item>
            <Form.Item
              label="电话"
              name="phone"
              rules={[{ message: '请输入电话', required: true }]}
            >
              <Input placeholder="请输入电话" />
            </Form.Item>
            <Form.Item
              label="座机号"
              name="landline"
            >
              <Input placeholder="请输入座机号" />
            </Form.Item>
            <Form.Item
              label="邮箱"
              name="email"
              rules={[{ message: '请输入有效的邮箱地址', type: 'email' }]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item
              label="加入日期"
              name="joinDate"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="培训费"
              name="trainingFee"
            >
              <InputNumber
                addonAfter="元"
                min={0}
                placeholder="请输入培训费"
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    );
  };

  // 课程列表表格列配置
  const courseColumns = [
    {
      align: 'center' as const,
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => {
        // 显示具体的培训课程名称
        return classInfo?.courseName || name || '-';
      },
      title: '课程名称',
      width: 200
    },
    {
      align: 'center' as const,
      dataIndex: 'instructor',
      key: 'instructor',
      render: (instructor: string, record: any) => instructor || record.teacher || '-',
      title: '任课老师',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'startDate',
      key: 'startDate',
      title: '开始日期',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'endDate',
      key: 'endDate',
      title: '结束日期',
      width: 120
    },
    {
      align: 'center' as const,
      fixed: 'right' as const,
      key: 'action',
      render: (_: unknown, record: any) => {
        return (
          <Space size="middle">
            <Button
              type="link"
              onClick={() => handleViewCourseDetail(record)}
            >
              详情
            </Button>
            {isSuperAdminUser && (
              <>
                <Button
                  type="link"
                  onClick={() => handleEditCourse(record)}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  onClick={handleAddCourse}
                >
                  更换课程
                </Button>
              </>
            )}
          </Space>
        );
      },
      title: '操作',
      width: 200
    }
  ];

  // 渲染课程列表
  const renderCourseList = () => {
    return (
      <Card
        variant="borderless"
        title={
          <div className="flex items-center gap-2">
            <span>班级课程</span>
            <Text
              style={{ fontSize: '14px', fontWeight: 'normal' }}
              type="secondary"
            >
              （每个班级只能关联一个课程）
            </Text>
          </div>
        }
      >
        {courseList.length === 0 ? (
          <Empty
            description="暂无关联课程"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={courseColumns}
            dataSource={courseList}
            loading={loading}
            rowKey="id"
            scroll={{ x: 800 }}
          />
        )}

        {/* 课程详情模态框 */}
        <Modal
          open={courseDetailVisible}
          title="课程详情"
          width={700}
          footer={[
            <Button
              key="back"
              onClick={() => setCourseDetailVisible(false)}
            >
              关闭
            </Button>
          ]}
          onCancel={() => setCourseDetailVisible(false)}
        >
          {currentCourse && (
            <>
              <Descriptions
                bordered
                column={2}
                size="small"
                title="基本信息"
              >
                <Descriptions.Item
                  label="课程名称"
                  span={2}
                >
                  {classInfo?.courseName || currentCourse.name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="授课教师">
                  {currentCourse.instructor || currentCourse.teacher || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="开始日期">{currentCourse.startDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="结束日期">{currentCourse.endDate || '-'}</Descriptions.Item>
              </Descriptions>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-medium">课程附件</h3>
                  {isSuperAdminUser && (
                    <Button
                      icon={<UploadOutlined />}
                      type="primary"
                      onClick={handleUploadFile}
                    >
                      上传附件
                    </Button>
                  )}
                </div>
                <Table
                  dataSource={courseAttachments}
                  pagination={false}
                  rowKey="id"
                  columns={[
                    {
                      dataIndex: 'name',
                      key: 'name',
                      render: (text, record) => {
                        // 根据文件类型显示不同的图标
                        const fileExtension = record.type ? record.type.toLowerCase() : '';
                        let icon = <PaperClipOutlined />;

                        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                          icon = (
                            <span
                              aria-label="图片文件"
                              role="img"
                            >
                              🖼️
                            </span>
                          );
                        } else if (['doc', 'docx'].includes(fileExtension)) {
                          icon = (
                            <span
                              aria-label="Word文档"
                              role="img"
                            >
                              📝
                            </span>
                          );
                        } else if (['xls', 'xlsx', 'csv'].includes(fileExtension)) {
                          icon = (
                            <span
                              aria-label="Excel表格"
                              role="img"
                            >
                              📊
                            </span>
                          );
                        } else if (['ppt', 'pptx'].includes(fileExtension)) {
                          icon = (
                            <span
                              aria-label="PPT演示文稿"
                              role="img"
                            >
                              📊
                            </span>
                          );
                        } else if (fileExtension === 'pdf') {
                          icon = (
                            <span
                              aria-label="PDF文档"
                              role="img"
                            >
                              📑
                            </span>
                          );
                        } else if (fileExtension === 'zip') {
                          icon = (
                            <span
                              aria-label="压缩文件"
                              role="img"
                            >
                              📦
                            </span>
                          );
                        }

                        return (
                          <Space>
                            {icon}
                            <span>{text}</span>
                          </Space>
                        );
                      },
                      title: '文件名'
                    },
                    {
                      dataIndex: 'type',
                      key: 'type',
                      render: text => (text ? text.toUpperCase() : ''),
                      title: '类型',
                      width: 100
                    },
                    {
                      dataIndex: 'size',
                      key: 'size',
                      render: (size: number) => formatFileSize(size),
                      title: '大小',
                      width: 100
                    },
                    {
                      dataIndex: 'uploadTime',
                      key: 'uploadTime',
                      render: (uploadTime: string) => formatUploadTime(uploadTime),
                      title: '上传时间',
                      width: 180
                    },
                    {
                      key: 'action',
                      render: (_, record: any) => (
                        <Space>
                          <Button
                            icon={<DownloadOutlined />}
                            size="small"
                            type="primary"
                            onClick={() => handleDownloadCourseAttachment(record)}
                          >
                            下载
                          </Button>
                          {isSuperAdmin() && (
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              size="small"
                              onClick={() => handleDeleteAttachment(record.id)}
                            >
                              删除
                            </Button>
                          )}
                        </Space>
                      ),
                      title: '操作',
                      width: 180
                    }
                  ]}
                />
              </div>
            </>
          )}
        </Modal>

        {/* 课程编辑模态框 */}
        <Modal
          open={courseModalVisible}
          title="编辑课程"
          onCancel={() => setCourseModalVisible(false)}
          onOk={handleSaveCourse}
        >
          <Form
            form={courseForm}
            labelCol={{ span: 6 }}
            style={{ marginTop: 20 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item
              label="授课教师"
              name="teacher"
              rules={[{ message: '请输入授课教师', required: true }]}
            >
              <Input placeholder="请输入授课教师姓名" />
            </Form.Item>
          </Form>
        </Modal>

        {/* 课程选择模态框 */}
        <Modal
          cancelText="取消"
          okText="确认选择"
          open={courseSelectModalVisible}
          title="选择课程"
          width={800}
          onOk={handleConfirmCourseSelect}
          onCancel={() => {
            setCourseSelectModalVisible(false);
            setSelectedCourseId(null);
          }}
        >
          <div className="mb-4">
            <Typography.Text type="secondary">请从下列课程中选择一个作为班级的培训课程：</Typography.Text>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table
              dataSource={availableCourses}
              loading={courseSelectLoading}
              pagination={false}
              rowKey="id"
              columns={[
                {
                  dataIndex: 'courseName',
                  ellipsis: true,
                  key: 'courseName',
                  title: '课程名称',
                  width: 180
                },
                {
                  dataIndex: 'instructor',
                  key: 'instructor',
                  render: (instructor: string) => instructor || '-',
                  title: '任课老师',
                  width: 120
                },
                {
                  dataIndex: 'price',
                  key: 'price',
                  render: (price: number | string) => {
                    const priceNum = typeof price === 'string' ? Number.parseFloat(price) : price;
                    return `¥${priceNum?.toFixed(2) || '0.00'}`;
                  },
                  title: '价格',
                  width: 100
                },
                {
                  dataIndex: 'startDate',
                  key: 'startDate',
                  render: (date: string) => {
                    if (!date) return '-';
                    try {
                      return dayjs(date).format('YYYY-MM-DD');
                    } catch {
                      return date;
                    }
                  },
                  title: '开始日期',
                  width: 100
                },
                {
                  dataIndex: 'endDate',
                  key: 'endDate',
                  render: (date: string) => {
                    if (!date) return '-';
                    try {
                      return dayjs(date).format('YYYY-MM-DD');
                    } catch {
                      return date;
                    }
                  },
                  title: '结束日期',
                  width: 100
                }
              ]}
              rowSelection={{
                onChange: keys => {
                  setSelectedCourseId((keys[0] as number) || null);
                },
                selectedRowKeys: selectedCourseId ? [selectedCourseId] : [],
                type: 'radio'
              }}
            />
          </div>

          {availableCourses.length === 0 && !courseSelectLoading && (
            <div className="py-8 text-center">
              <Typography.Text type="secondary">暂无可用的课程，请先在课程管理中创建课程</Typography.Text>
            </div>
          )}
        </Modal>

        {/* 文件上传模态框 */}
        <Modal
          centered
          footer={null}
          open={uploadModalVisible}
          width={600}
          title={(() => {
            if (uploading) {
              if (uploadProgress === 100) {
                return (
                  <div className="flex items-center text-success">
                    <CheckCircleOutlined className="mr-2" />
                    上传完成
                  </div>
                );
              }
              return (
                <div className="flex items-center">
                  <LoadingOutlined className="mr-2" />
                  正在上传文件
                </div>
              );
            }
            return '上传课程附件';
          })()}
          onCancel={() => {
            if (!uploading) {
              setUploadModalVisible(false);
              setFileList([]);
              setUploadProgress(0);
            }
          }}
        >
          {!uploading ? (
            <>
              <div className="px-10 py-6">
                <Upload.Dragger
                  fileList={fileList}
                  multiple={true}
                  beforeUpload={file => {
                    // 文件大小限制为10MB
                    if (file.size > 10 * 1024 * 1024) {
                      message.error(`${file.name} 超过10MB限制，无法上传`);
                      return Upload.LIST_IGNORE;
                    }

                    // 验证文件类型
                    const fileExtension =
                      file.name && typeof file.name === 'string' ? file.name.split('.').pop()?.toLowerCase() || '' : '';
                    const allowedTypes = [
                      'doc',
                      'docx',
                      'ppt',
                      'pptx',
                      'xls',
                      'xlsx',
                      'pdf',
                      'txt',
                      'jpg',
                      'jpeg',
                      'png',
                      'gif',
                      'csv',
                      'zip'
                    ];

                    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
                      message.error(`不支持的文件类型: ${fileExtension || '未知'}`);
                      return Upload.LIST_IGNORE;
                    }

                    // 添加文件到列表
                    setFileList([...fileList, file]);
                    return false; // 阻止自动上传
                  }}
                  onRemove={file => {
                    const updatedFileList = fileList.filter(f => f.uid !== file.uid);
                    setFileList(updatedFileList);
                    return true;
                  }}
                >
                  <div className="p-4">
                    <p className="ant-upload-drag-icon mb-4">
                      <InboxOutlined style={{ color: '#6366f1', fontSize: 48 }} />
                    </p>
                    <p className="ant-upload-text mb-2 text-lg">点击或拖拽文件到此区域上传</p>
                    <p className="ant-upload-hint text-gray-500">
                      支持单个或批量上传。支持Word, PowerPoint, Excel, TXT, PDF, CSV和常见图片格式。
                      单个文件大小不超过10MB。
                    </p>
                  </div>
                </Upload.Dragger>

                {fileList.length > 0 && (
                  <div className="mt-4 border rounded p-3">
                    <Typography.Text
                      strong
                      className="mb-2 block"
                    >
                      已选择 {fileList.length} 个文件
                      {fileList.length > 0 && (
                        <Typography.Text
                          className="ml-2"
                          type="secondary"
                        >
                          (总大小:{' '}
                          {(() => {
                            const totalSize = fileList.reduce((total, file) => total + file.size, 0);
                            return totalSize < 1024 * 1024
                              ? `${(totalSize / 1024).toFixed(2)} KB`
                              : `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
                          })()}
                          )
                        </Typography.Text>
                      )}
                    </Typography.Text>
                    <Table
                      pagination={false}
                      size="small"
                      columns={[
                        { dataIndex: 'name', ellipsis: true, title: '文件名' },
                        { dataIndex: 'type', title: '类型', width: 80 },
                        { dataIndex: 'size', title: '大小', width: 100 }
                      ]}
                      dataSource={fileList.map((file, index) => ({
                        key: file.uid || index,
                        name: file.name,
                        size:
                          file.size < 1024 * 1024
                            ? `${(file.size / 1024).toFixed(2)} KB`
                            : `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                        type: file.name?.split('.')?.pop()?.toUpperCase() || '未知'
                      }))}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t bg-gray-50 px-6 py-3">
                <Space>
                  <Button onClick={() => setUploadModalVisible(false)}>取消</Button>
                  <Button
                    disabled={fileList.length === 0}
                    type="primary"
                    onClick={handleFileUpload}
                  >
                    开始上传
                  </Button>
                </Space>
              </div>
            </>
          ) : (
            <div className="p-6">
              <div className="mb-4 text-center">
                {uploadProgress === 100 ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 48 }} />
                ) : (
                  <Spin
                    indicator={
                      <LoadingOutlined
                        spin
                        style={{ fontSize: 36 }}
                      />
                    }
                  />
                )}

                <Typography.Title
                  className="mb-4 mt-3"
                  level={4}
                >
                  {uploadProgress === 100 ? '上传完成！' : '正在上传文件...'}
                </Typography.Title>

                <Progress
                  percent={uploadProgress}
                  status={uploadProgress < 100 ? 'active' : 'success'}
                  strokeColor={uploadProgress < 100 ? '#6366f1' : '#52c41a'}
                  strokeWidth={8}
                />

                <Typography.Paragraph className="mt-3 text-gray-500">
                  {uploadProgress === 100 ? (
                    <>
                      <CheckCircleOutlined className="mr-1 text-success" />
                      文件上传成功，正在处理中...
                    </>
                  ) : (
                    `正在上传文件 (${uploadProgress}%)...`
                  )}
                </Typography.Paragraph>
              </div>

              <div className="mt-4 flex justify-end border-t pt-3">
                <Button
                  disabled={uploadProgress < 100}
                  onClick={() => setUploadModalVisible(false)}
                >
                  {uploadProgress === 100 ? '关闭' : '取消'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </Card>
    );
  };

  // 渲染通知公告
  const renderAnnouncements = () => {
    return (
      <Card
        title="通知公告"
        variant="borderless"
        extra={
          isSuperAdminUser && (
            <Button
              type="primary"
              onClick={handlePublishAnnounce}
            >
              发布通知
            </Button>
          )
        }
      >
        <List
          dataSource={announceList}
          itemLayout="horizontal"
          loading={loading}
          renderItem={item => (
            <List.Item
              actions={[
                <Button
                  key="list-view"
                  type="link"
                  onClick={() => handleViewAnnounceDetail(item)}
                >
                  查看
                </Button>,
                ...(isSuperAdminUser
                  ? [
                      <Button
                        key="list-edit"
                        type="link"
                        onClick={() => handleEditAnnounce(item)}
                      >
                        编辑
                      </Button>,
                      <Button
                        danger
                        key="list-delete"
                        type="link"
                        onClick={() => handleDeleteAnnounce(item.id)}
                      >
                        删除
                      </Button>
                    ]
                  : [])
              ]}
            >
              <List.Item.Meta
                description={
                  <div>
                    <div>{item.content}</div>
                    <div className="mt-2 text-gray-400">发布时间：{item.publishDate}</div>
                  </div>
                }
                title={item.title}
              />
            </List.Item>
          )}
        />

        {/* 通知详情模态框 */}
        <Modal
          open={announceDetailVisible}
          title="通知详情"
          width={700}
          footer={[
            <Button
              key="back"
              onClick={() => setAnnounceDetailVisible(false)}
            >
              关闭
            </Button>
          ]}
          onCancel={() => setAnnounceDetailVisible(false)}
        >
          {currentAnnounce && (
            <>
              <Descriptions
                column={2}
                title="通知信息"
              >
                <Descriptions.Item label="通知标题">{currentAnnounce.title}</Descriptions.Item>
                <Descriptions.Item label="发布时间">{currentAnnounce.publishDate}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color="processing">已发布</Tag>
                </Descriptions.Item>
                <Descriptions.Item
                  label="通知内容"
                  span={2}
                >
                  <div className="whitespace-pre-wrap">{currentAnnounce.content}</div>
                </Descriptions.Item>
              </Descriptions>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-medium">通知附件</h3>
                  {isSuperAdminUser && (
                    <Button
                      icon={<UploadOutlined />}
                      type="primary"
                      onClick={handleUploadAnnounceFile}
                    >
                      上传附件
                    </Button>
                  )}
                </div>
                <Table
                  dataSource={announceAttachments}
                  pagination={false}
                  rowKey="id"
                  scroll={{ x: 600 }}
                  size="small"
                  columns={[
                    {
                      dataIndex: 'name',
                      ellipsis: {
                        showTitle: true
                      },
                      key: 'name',
                      render: (text, record) => {
                        // 根据文件类型显示不同的图标
                        const fileExtension = record.type ? record.type.toLowerCase() : '';
                        let icon = <PaperClipOutlined />;

                        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                          icon = (
                            <span
                              aria-label="图片文件"
                              role="img"
                            >
                              🖼️
                            </span>
                          );
                        } else if (['doc', 'docx'].includes(fileExtension)) {
                          icon = (
                            <span
                              aria-label="Word文档"
                              role="img"
                            >
                              📝
                            </span>
                          );
                        } else if (['xls', 'xlsx', 'csv'].includes(fileExtension)) {
                          icon = (
                            <span
                              aria-label="Excel表格"
                              role="img"
                            >
                              📊
                            </span>
                          );
                        } else if (['ppt', 'pptx'].includes(fileExtension)) {
                          icon = (
                            <span
                              aria-label="PPT演示文稿"
                              role="img"
                            >
                              📊
                            </span>
                          );
                        } else if (fileExtension === 'pdf') {
                          icon = (
                            <span
                              aria-label="PDF文档"
                              role="img"
                            >
                              📑
                            </span>
                          );
                        } else if (fileExtension === 'zip') {
                          icon = (
                            <span
                              aria-label="压缩文件"
                              role="img"
                            >
                              📦
                            </span>
                          );
                        }

                        return (
                          <Space>
                            {icon}
                            <span title={text}>{text}</span>
                          </Space>
                        );
                      },
                      title: '文件名',
                      width: 200
                    },
                    {
                      dataIndex: 'size',
                      key: 'size',
                      render: (size: number) => formatFileSize(size),
                      title: '大小',
                      width: 100
                    },
                    {
                      dataIndex: 'uploadTime',
                      key: 'uploadTime',
                      render: (uploadTime: string) => formatUploadTime(uploadTime),
                      title: '上传时间',
                      width: 120
                    },
                    {
                      dataIndex: 'uploader',
                      key: 'uploader',
                      title: '上传者',
                      width: 100
                    },
                    {
                      fixed: 'right',
                      key: 'action',
                      render: (_, record: any) => (
                        <Space size="small">
                          <Button
                            icon={<DownloadOutlined />}
                            size="small"
                            type="primary"
                            onClick={() => handleDownloadNotificationAttachment(record)}
                          >
                            下载
                          </Button>
                          {isSuperAdminUser && (
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              size="small"
                              onClick={() => handleDeleteAnnounceAttachment(record.id)}
                            >
                              删除
                            </Button>
                          )}
                        </Space>
                      ),
                      title: '操作',
                      width: 120
                    }
                  ]}
                />
              </div>
            </>
          )}
        </Modal>

        {/* 发布/编辑通知模态框 */}
        <Modal
          open={announceModalVisible}
          title={currentAnnounce ? '编辑通知' : '发布通知'}
          width={700}
          onCancel={() => setAnnounceModalVisible(false)}
          onOk={handleSaveAnnounce}
        >
          <Form
            form={announceForm}
            labelCol={{ span: 4 }}
            style={{ marginTop: 20 }}
            wrapperCol={{ span: 18 }}
          >
            <Form.Item
              label="通知标题"
              name="title"
              rules={[{ message: '请输入通知标题', required: true }]}
            >
              <Input placeholder="请输入通知标题" />
            </Form.Item>

            <Form.Item
              label="通知内容"
              name="content"
              rules={[{ message: '请输入通知内容', required: true }]}
            >
              <Input.TextArea
                placeholder="请输入通知内容"
                rows={6}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 附件上传模态框 - 优化UI布局 */}
        <Modal
          footer={null}
          open={announceUploadModalVisible}
          title="上传通知附件"
          width={800}
          onCancel={() => {
            if (!announceUploading) {
              setAnnounceUploadModalVisible(false);
            }
          }}
        >
          {!announceUploading ? (
            <>
              <div className="p-6">
                <Upload.Dragger
                  multiple
                  fileList={[]}
                  beforeUpload={file => {
                    // 文件大小检查
                    const isLt10M = file.size / 1024 / 1024 < 10;
                    if (!isLt10M) {
                      message.error('文件大小不能超过 10MB!');
                      return false;
                    }
                    setAnnounceFileList(prev => [...prev, file]);
                    return false;
                  }}
                  onRemove={file => {
                    setAnnounceFileList(files => files.filter(f => f.uid !== file.uid));
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">支持单个或批量上传，最大支持10MB的文件</p>
                </Upload.Dragger>

                {announceFileList.length > 0 && (
                  <div className="mt-4">
                    <Typography.Text className="mb-2 block text-sm font-medium">
                      待上传文件列表:
                      {announceFileList.length > 0 && (
                        <Typography.Text
                          className="ml-2 text-xs text-gray-500"
                          type="secondary"
                        >
                          (总大小:{' '}
                          {(() => {
                            const totalSize = announceFileList.reduce((total, file) => total + file.size, 0);
                            return formatFileSize(totalSize);
                          })()}
                          )
                        </Typography.Text>
                      )}
                    </Typography.Text>
                    <Table
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                      size="small"
                      columns={[
                        {
                          dataIndex: 'name',
                          ellipsis: true,
                          title: '文件名',
                          width: '40%'
                        },
                        {
                          dataIndex: 'type',
                          render: (_, record) => {
                            const ext = record.name?.split('.')?.pop()?.toUpperCase();
                            return ext || '未知';
                          },
                          title: '类型',
                          width: 80
                        },
                        {
                          dataIndex: 'size',
                          render: (size: number) => formatFileSize(size),
                          title: '大小',
                          width: 100
                        },
                        {
                          dataIndex: 'lastModified',
                          render: (lastModified: number) => {
                            return lastModified ? new Date(lastModified).toLocaleString() : '未知时间';
                          },
                          title: '修改时间',
                          width: 140
                        },
                        {
                          fixed: 'right',
                          key: 'action',
                          render: (_, record: any) => (
                            <Button
                              danger
                              size="small"
                              onClick={() => {
                                setAnnounceFileList(files => files.filter(f => f.uid !== record.uid));
                              }}
                            >
                              移除
                            </Button>
                          ),
                          title: '操作',
                          width: 80
                        }
                      ]}
                      dataSource={announceFileList.map((file, index) => ({
                        key: file.uid || index,
                        lastModified: file.lastModified,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        uid: file.uid
                      }))}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t bg-gray-50 px-6 py-3">
                <Space>
                  <Button onClick={() => setAnnounceUploadModalVisible(false)}>取消</Button>
                  <Button
                    disabled={announceFileList.length === 0}
                    loading={announceUploading}
                    type="primary"
                    onClick={handleAnnounceFileUpload}
                  >
                    开始上传 ({announceFileList.length} 个文件)
                  </Button>
                </Space>
              </div>
            </>
          ) : (
            <div className="p-6">
              <div className="mb-4 text-center">
                {announceUploadProgress === 100 ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 48 }} />
                ) : (
                  <Spin
                    indicator={
                      <LoadingOutlined
                        spin
                        style={{ fontSize: 36 }}
                      />
                    }
                  />
                )}

                <Typography.Title
                  className="mb-4 mt-3"
                  level={4}
                >
                  {announceUploadProgress === 100 ? '上传完成！' : '正在上传文件...'}
                </Typography.Title>

                <Progress
                  percent={announceUploadProgress}
                  status={announceUploadProgress < 100 ? 'active' : 'success'}
                  strokeColor={announceUploadProgress < 100 ? '#6366f1' : '#52c41a'}
                  strokeWidth={8}
                />

                <Typography.Paragraph className="mt-3 text-gray-500">
                  {announceUploadProgress === 100 ? (
                    <>
                      <CheckCircleOutlined className="mr-1 text-success" />
                      文件上传成功，正在处理中...
                    </>
                  ) : (
                    `正在上传文件 (${announceUploadProgress}%)...`
                  )}
                </Typography.Paragraph>
              </div>

              <div className="mt-4 flex justify-end border-t pt-3">
                <Button
                  disabled={announceUploadProgress < 100}
                  onClick={() => setAnnounceUploadModalVisible(false)}
                >
                  {announceUploadProgress === 100 ? '关闭' : '取消'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </Card>
    );
  };

  if (!classInfo && !loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-xl">未找到班级信息</h2>
          <Button
            type="primary"
            onClick={handleBack}
          >
            返回班级列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 dark:bg-[#141414]">
      {renderBasicInfo()}
      <Tabs
        defaultActiveKey="students"
        items={[
          {
            children: renderStudentList(),
            key: 'students',
            label: '班级学员'
          },
          {
            children: renderCourseList(),
            key: 'courses',
            label: '课程安排'
          },
          {
            children: renderAnnouncements(),
            key: 'announcements',
            label: '通知公告'
          }
        ]}
      />
    </div>
  );
};

export default ClassDetail;
