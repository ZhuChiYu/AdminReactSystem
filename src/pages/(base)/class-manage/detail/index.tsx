import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  InboxOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  UploadOutlined
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
import { attachmentService, classService, courseService, notificationService } from '@/service/api';
import type { AttachmentApi, NotificationApi } from '@/service/api/types';

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

  // 添加学员弹窗状态
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();

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

  // 批量导入学员相关状态
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileList, setImportFileList] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // 搜索相关状态
  const [searchText, setSearchText] = useState('');
  const [filteredStudentList, setFilteredStudentList] = useState<any[]>([]);

  // 添加选择相关状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 计算总培训费
  const calculateTotalTrainingFee = () => {
    return studentList.reduce((total, student) => {
      const fee = student.trainingFee ? Number.parseFloat(student.trainingFee) : 0;
      return total + fee;
    }, 0);
  };

  // 获取班级数据
  const fetchClassInfo = async () => {
    if (!classId) return;

    setLoading(true);
    try {
      // 获取班级基本信息
      const classResponse = await classService.getClassDetail(Number.parseInt(classId, 10));
      setClassInfo({
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

      // 获取学生列表
      const studentsResponse = await classService.getClassStudentList({
        classId: Number.parseInt(classId, 10),
        current: 1,
        size: 1000
      });

      const formattedStudents = studentsResponse.records.map((student: any) => ({
        attendance: student.attendanceRate || 0,
        avatar: null, // 使用默认头像
        company: student.company || '',
        email: student.email || '',
        gender: student.gender || '',
        id: student.id,
        joinDate: student.joinDate || student.enrollmentDate || '',
        landline: student.landline || '',
        name: student.name,
        phone: student.phone || '',
        position: student.position || '',
        studentId: student.studentId || '',
        trainingFee: student.trainingFee || 0 // 确保培训费有默认值
      }));

      setStudentList(formattedStudents);

      // 获取课程列表
      const coursesResponse = await courseService.getClassCourseList({
        classId: Number.parseInt(classId, 10),
        current: 1,
        size: 1000
      });

      const formattedCourses = coursesResponse.records.map((course: any) => ({
        classroom: course.classroom || '',
        endDate: course.endDate || '',
        id: course.id,
        name: course.courseName,
        schedule: course.schedule || '',
        startDate: course.startDate || '',
        status: course.status || 1,
        teacher: course.instructor || ''
      }));

      setCourseList(formattedCourses);

      // 获取公告列表
      const announcementsResponse = await notificationService.getNotificationList({
        current: 1,
        relatedId: Number.parseInt(classId, 10),
        size: 1000,
        type: 'class_announcement'
      });

      const formattedAnnouncements = announcementsResponse.records.map(
        (announcement: NotificationApi.NotificationListItem) => ({
          content: announcement.content,
          id: announcement.id,
          importance: 1,
          publishDate: announcement.createTime,
          status: 1,
          title: announcement.title
        })
      );

      setAnnounceList(formattedAnnouncements);

      // 获取课程附件 - 使用班级关联的实际课程ID
      if (classResponse.courseId) {
        const courseAttachmentsResponse = await attachmentService.getAttachmentList({
          courseId: classResponse.courseId,
          current: 1,
          size: 1000
        });

        console.log('课程附件API响应 (课程ID:', classResponse.courseId, '):', courseAttachmentsResponse);

        // API客户端自动提取data字段，这里得到的是PageResponse.data的内容
        const attachmentRecords = (courseAttachmentsResponse as any)?.records || [];
        console.log('提取的附件记录:', attachmentRecords);

        if (Array.isArray(attachmentRecords)) {
          const formattedCourseAttachments = attachmentRecords.map((attachment: AttachmentApi.AttachmentListItem) => {
            console.log('格式化附件:', attachment);
            return {
              id: attachment.id,
              name: attachment.originalName || attachment.fileName, // 优先使用原始文件名
              size: attachment.fileSize,
              type: attachment.fileType?.toUpperCase() || 'UNKNOWN',
              uploader: attachment.uploader?.name || '未知',
              uploadTime: attachment.uploadTime,
              url: attachment.downloadUrl || '#'
            };
          });

          console.log('格式化后的附件列表:', formattedCourseAttachments);
          setCourseAttachments(formattedCourseAttachments);
        } else {
          console.warn('附件列表数据格式不正确:', courseAttachmentsResponse);
          setCourseAttachments([]);
        }
      } else {
        console.log('班级暂无关联课程，无法获取课程附件');
        setCourseAttachments([]);
      }
    } catch (error) {
      message.error('获取班级数据失败');
      console.error('获取班级数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassInfo();
  }, [classId]);

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

  // 获取通知重要性标签颜色
  const getImportanceColor = (importance: number) => {
    if (importance === 2) return 'red';
    if (importance === 1) return 'orange';
    return 'blue';
  };

  // 获取通知重要性文本
  const getImportanceText = (importance: number) => {
    if (importance === 2) return '紧急';
    if (importance === 1) return '重要';
    return '普通';
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
            <strong>学员ID：</strong> {student.studentId}
          </p>
          <p>
            <strong>姓名：</strong> {student.name}
          </p>
          <p>
            <strong>性别：</strong> {student.gender}
          </p>
          <p>
            <strong>单位：</strong> {student.company}
          </p>
          <p>
            <strong>职务：</strong> {student.position}
          </p>
          <p>
            <strong>电话：</strong> {student.phone}
          </p>
          <p>
            <strong>座机号：</strong> {student.landline}
          </p>
          <p>
            <strong>邮箱：</strong> {student.email}
          </p>
          <p>
            <strong>加入日期：</strong> {student.joinDate}
          </p>
        </div>
      ),
      title: '学员详情',
      width: 500
    });
  };

  // 处理编辑学员
  const handleEditStudent = (student: any) => {
    setEditFormStudent(student);
    editForm.setFieldsValue(student);
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
          await fetchClassInfo();
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
        avatar: editFormStudent?.avatar || null
      };

      console.log('保存学员信息，数据:', {
        currentAvatar: editFormStudent?.avatar,
        studentId: editFormStudent.id,
        updateData
      });

      // 调用后端API更新学员信息
      const updatedStudent = await classService.updateStudent(editFormStudent.id, updateData);

      console.log('学员信息更新成功，返回数据:', updatedStudent);

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

      console.log('开始上传头像:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        studentId: editFormStudent.id
      });

      const result = await classService.uploadStudentAvatar(editFormStudent.id, file);

      console.log('头像上传成功，完整返回数据:', result);

      // 提取头像URL
      let avatarUrl = result.data?.avatar || result.avatar;

      // 确保URL是完整的
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        avatarUrl = `http://localhost:3001${avatarUrl}`;
      }

      console.log('处理后的头像URL:', avatarUrl);

      // 更新编辑表单中的头像字段
      setEditFormStudent((prev: any) => ({
        ...prev,
        avatar: avatarUrl
      }));

      // 更新本地学员列表中的头像
      setStudentList(prevList =>
        prevList.map(student => (student.id === editFormStudent.id ? { ...student, avatar: avatarUrl } : student))
      );

      console.log('头像更新完成，新的editFormStudent:', {
        avatar: avatarUrl,
        id: editFormStudent.id,
        name: editFormStudent.name
      });

      message.success('头像上传成功');
      return false; // 阻止Upload组件的默认上传行为
    } catch (error: any) {
      handleUploadError(error);
      return false;
    } finally {
      setAvatarUploading(false);
    }
  };

  // 学员列表表格列配置
  const studentColumns = [
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
      dataIndex: 'company',
      key: 'company',
      title: '单位',
      width: 150
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
      dataIndex: 'gender',
      key: 'gender',
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
      dataIndex: 'trainingFee',
      key: 'trainingFee',
      render: (fee: string | null) => (fee ? `¥${fee}` : '-'),
      title: '培训费',
      width: 100
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
    },
    {
      align: 'center' as const,
      fixed: 'right' as const,
      key: 'action',
      render: (_: unknown, record: any) => (
        <Space size={[4, 0]}>
          <Button
            size="small"
            type="link"
            onClick={() => handleViewStudentDetail(record)}
          >
            详情
          </Button>
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
        </Space>
      ),
      title: '操作',
      width: 160
    }
  ];

  // 显示添加学员弹窗
  const handleShowAddModal = () => {
    addForm.resetFields();
    setAddModalVisible(true);
  };

  // 保存新增学员
  const handleAddStudent = async () => {
    try {
      const values = await addForm.validateFields();

      // 生成新的学员ID
      const newId = studentList.length > 0 ? Math.max(...studentList.map(s => s.id)) + 1 : 1;

      // 创建新学员对象
      const newStudent = {
        ...values,
        // 不设置avatar，让UserAvatar组件根据gender显示默认头像
        avatar: null,
        id: newId,
        joinDate: values.joinDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
        studentId: `${Date.now()}`.slice(-10)
      };

      // 更新学员列表
      setStudentList([...studentList, newStudent]);

      // 关闭弹窗并清空表单
      setAddModalVisible(false);
      addForm.resetFields();

      message.success('学员添加成功');
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 显示批量导入弹窗
  const handleShowImportModal = () => {
    setImportFileList([]);
    setImportProgress(0);
    setImportModalVisible(true);
  };

  // 下载导入模板
  const handleDownloadTemplate = async () => {
    try {
      const blob = await classService.downloadStudentTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '学员导入模板.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('模板下载成功');
    } catch (error) {
      message.error('模板下载失败');
      console.error('下载模板失败:', error);
    }
  };

  // 批量导入学员
  const handleImportStudents = async () => {
    if (importFileList.length === 0) {
      message.warning('请选择要导入的文件');
      return;
    }

    const file = importFileList[0].originFileObj || importFileList[0];

    try {
      setImporting(true);
      setImportProgress(30);

      const result = await classService.importStudentsBatch(Number.parseInt(classId!, 10), file);

      setImportProgress(100);

      // 检查导入结果 - 根据后端实际返回的数据结构
      if (result && result.importedCount !== undefined) {
        message.success(`导入成功：${result.importedCount} 条记录`);

        // 重新获取学员列表
        const studentsResponse = await classService.getClassStudentList({
          classId: Number.parseInt(classId!, 10),
          current: 1,
          size: 1000
        });

        const formattedStudents = studentsResponse.records.map((student: any) => ({
          attendance: student.attendanceRate || 0,
          avatar: null, // 使用默认头像
          company: student.company || '',
          email: student.email || '',
          gender: student.gender || '',
          id: student.id,
          joinDate: student.joinDate || student.enrollmentDate || '',
          landline: student.landline || '',
          name: student.name,
          phone: student.phone || '',
          position: student.position || '',
          studentId: student.studentId || '',
          trainingFee: student.trainingFee || 0 // 确保培训费有默认值
        }));

        setStudentList(formattedStudents);
      } else {
        message.error(`导入失败：${result?.errorMessage || '未知错误'}`);
      }

      // 关闭弹窗
      setImportModalVisible(false);
      setImportFileList([]);
      setImportProgress(0);
    } catch (error) {
      message.error('导入失败，请检查文件格式');
      console.error('批量导入失败:', error);
    } finally {
      setImporting(false);
    }
  };

  // 文件上传前的验证
  const beforeUpload = (file: File) => {
    const isExcel =
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel';
    if (!isExcel) {
      message.error('只能上传 Excel 文件！');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('文件大小不能超过 5MB！');
      return false;
    }

    return false; // 阻止自动上传
  };

  // 文件列表变化处理
  const handleFileChange = ({ fileList: newFileList }: any) => {
    setImportFileList(newFileList);
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

    // 设置表单初值
    courseForm.setFieldsValue({
      classroom: course.classroom,
      endDate: dayjs(course.endDate),
      name: course.name,
      schedule: course.schedule,
      startDate: dayjs(course.startDate),
      teacher: course.teacher
    });

    setCourseModalVisible(true);
  };

  // 删除课程
  const handleRemoveCourse = async (courseId: number) => {
    Modal.confirm({
      content: '确定要删除这门课程吗？',
      onOk: async () => {
        try {
          await courseService.deleteCourse(courseId);
          message.success('课程删除成功');

          // 重新获取课程列表
          const coursesResponse = await courseService.getClassCourseList({
            classId: Number.parseInt(classId!, 10),
            current: 1,
            size: 1000
          });
          setCourseList(coursesResponse.records || []);
        } catch (error) {
          console.error('删除课程失败:', error);
          message.error('删除课程失败');
        }
      },
      title: '确认删除'
    });
  };

  // 添加课程
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
          courseForm.resetFields();
          setCourseModalVisible(true);
        },
        title: '确认添加课程'
      });
    } else {
      courseForm.resetFields();
      setCourseModalVisible(true);
    }
  };

  // 保存课程
  const handleSaveCourse = async () => {
    try {
      const values = await courseForm.validateFields();

      if (currentCourse) {
        // 编辑现有课程
        const courseData = {
          categoryId: currentCourse.categoryId || 1,
          classId: Number.parseInt(classId!, 10),
          courseCode: currentCourse.courseCode,
          courseName: values.name,
          description: values.description || currentCourse.description || '',
          duration: values.duration || currentCourse.duration || 30,
          endDate: values.endDate?.format('YYYY-MM-DD') || currentCourse.endDate,
          instructor: values.teacher,
          location: values.classroom || '线上',
          maxStudents: values.maxStudents || currentCourse.maxStudents || 50,
          originalPrice: values.price || currentCourse.originalPrice || 0,
          price: values.price || currentCourse.price || 0,
          startDate: values.startDate?.format('YYYY-MM-DD') || currentCourse.startDate
        };

        await courseService.updateCourse(currentCourse.id, courseData);
        message.success('课程更新成功');
      } else {
        // 创建新课程
        const courseData = {
          categoryId: 1,
          classId: Number.parseInt(classId!, 10),
          courseCode: `COURSE_${Date.now()}`,
          courseName: values.name,
          description: values.description || '',
          duration: values.duration || 30,
          endDate: values.endDate?.format('YYYY-MM-DD') || dayjs().add(30, 'day').format('YYYY-MM-DD'),
          instructor: values.teacher,
          location: values.classroom || '线上',
          maxStudents: values.maxStudents || 50,
          originalPrice: values.price || 0,
          price: values.price || 0,
          startDate: values.startDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD')
        };

        await courseService.createCourse(courseData);
        message.success('课程添加成功');
      }

      setCourseModalVisible(false);
      courseForm.resetFields();
      setCurrentCourse(null);

      // 重新获取所有班级数据，确保课程列表更新
      await fetchClassInfo();
    } catch (error) {
      const errorMessage = currentCourse ? '更新课程失败' : '添加课程失败';
      message.error(errorMessage);
      console.error(`${errorMessage}:`, error);
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
                // 构建CSV内容
                const headers = ['学员ID', '姓名', '性别', '单位', '职务', '电话', '座机号', '邮箱', '加入日期'];
                const csvContent = [
                  headers.join(','),
                  ...studentList.map(student =>
                    [
                      student.studentId,
                      student.name,
                      student.gender,
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
          console.log('上传文件数据:', uploadData);

          const result = await attachmentService.uploadAttachment(uploadData);
          console.log(`文件 ${file.name} 上传结果:`, result);
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

  // 处理附件下载
  const handleDownloadAttachment = async (attachment: any) => {
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

      console.log(`成功下载通知附件: ${attachment.name}`, attachment);
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
          importance: values.importance || 0,
          publishDate: new Date().toLocaleString()
        };

        setAnnounceList(prev => prev.map(item => (item.id === currentAnnounce.id ? updatedAnnounce : item)));
        message.success('通知已更新');
      } else {
        // 新建模式 - 调用API创建通知
        const result = await notificationService.createNotification(announceData);
        console.log('创建通知成功:', result);

        // 重新获取通知列表
        const announcementsResponse = await notificationService.getNotificationList({
          current: 1,
          relatedId: Number.parseInt(classId!, 10),
          size: 1000,
          type: 'class_announcement'
        });

        const formattedAnnouncements = announcementsResponse.records.map(
          (announcement: NotificationApi.NotificationListItem) => ({
            content: announcement.content,
            id: announcement.id,
            importance: values.importance || 0,
            publishDate: announcement.createTime,
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
      importance: announce.importance,
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

          // 重新获取通知列表
          const notificationsResponse = await notificationService.getNotificationList({
            current: 1,
            relatedId: Number.parseInt(classId!, 10),
            relatedType: 'class',
            size: 1000
          });

          const formattedAnnouncements = notificationsResponse.records.map(
            (notification: NotificationApi.NotificationListItem) => ({
              content: notification.content,
              id: notification.id,
              importance: 1,
              publishDate: notification.createTime,
              title: notification.title // 默认重要程度
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

          console.log(`通知附件上传成功: ${file.name}`, result);
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

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // 按拼音排序学员列表
  const sortStudentsByPinyin = (students: any[]) => {
    return students.sort((a, b) => {
      return a.name.localeCompare(b.name, 'zh-CN', { sensitivity: 'base' });
    });
  };

  // 过滤和排序学员列表
  const getFilteredAndSortedStudents = () => {
    let filtered = studentList;

    // 如果有搜索文本，进行过滤
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = studentList.filter(
        student =>
          student.name.toLowerCase().includes(searchLower) || student.company.toLowerCase().includes(searchLower)
      );
    }

    // 按拼音排序
    return sortStudentsByPinyin(filtered);
  };

  // 更新过滤后的学员列表
  useEffect(() => {
    const filteredAndSorted = getFilteredAndSortedStudents();
    setFilteredStudentList(filteredAndSorted);
  }, [studentList, searchText]);

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
          await classService.deleteStudentsBatch(selectedRowKeys as number[]);
          message.success(`成功删除 ${selectedRowKeys.length} 名学员`);
          setSelectedRowKeys([]);
          // 重新获取学员列表
          await fetchClassInfo();
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
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              下载模板
            </Button>
            <Button
              icon={<UploadOutlined />}
              type="default"
              onClick={handleShowImportModal}
            >
              批量导入
            </Button>
            <Button
              type="primary"
              onClick={handleShowAddModal}
            >
              添加学员
            </Button>
            <Button onClick={handleExportStudents}>导出学员</Button>
            <Button
              danger
              disabled={selectedRowKeys.length === 0}
              loading={deleteLoading}
              onClick={handleBatchDelete}
            >
              批量删除
            </Button>
          </Space>
        }
      >
        {/* 搜索框 */}
        <div className="mb-4">
          <Input.Search
            allowClear
            enterButton="搜索"
            placeholder="请输入姓名或单位进行搜索"
            size="large"
            style={{ maxWidth: 400 }}
            onChange={e => handleSearch(e.target.value)}
            onSearch={handleSearch}
          />
        </div>

        <Table
          columns={studentColumns}
          dataSource={filteredStudentList}
          loading={loading}
          rowKey="id"
          rowSelection={{
            onChange: onSelectChange,
            selectedRowKeys
          }}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
        />

        {/* 批量导入弹窗 */}
        <Modal
          confirmLoading={importing}
          open={importModalVisible}
          title="批量导入学员"
          width={600}
          onOk={handleImportStudents}
          onCancel={() => {
            setImportModalVisible(false);
            setImportFileList([]);
            setImportProgress(0);
          }}
        >
          <div style={{ padding: '20px 0' }}>
            <Space
              direction="vertical"
              size="large"
              style={{ width: '100%' }}
            >
              <div>
                <Typography.Title level={5}>导入说明：</Typography.Title>
                <Typography.Text type="secondary">
                  1. 请先下载模板文件，按照模板格式填写学员信息
                  <br />
                  2. 支持 .xlsx 和 .xls 格式的Excel文件
                  <br />
                  3. 文件大小不能超过 5MB
                  <br />
                  4. 必填字段：姓名、性别、单位、电话
                </Typography.Text>
              </div>

              <Upload.Dragger
                accept=".xlsx,.xls"
                beforeUpload={beforeUpload}
                fileList={importFileList}
                multiple={false}
                name="file"
                onChange={handleFileChange}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p className="ant-upload-hint">支持单个文件上传，仅支持 .xlsx 和 .xls 格式</p>
              </Upload.Dragger>

              {importing && (
                <div>
                  <Typography.Text>导入进度：</Typography.Text>
                  <Progress
                    percent={importProgress}
                    status="active"
                  />
                </div>
              )}
            </Space>
          </div>
        </Modal>

        {/* 添加学员弹窗 */}
        <Modal
          confirmLoading={loading}
          open={addModalVisible}
          title="添加学员"
          onCancel={() => setAddModalVisible(false)}
          onOk={handleAddStudent}
        >
          <Form
            form={addForm}
            labelCol={{ span: 6 }}
            style={{ marginTop: 20 }}
            wrapperCol={{ span: 16 }}
          >
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
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item
              label="加入日期"
              name="joinDate"
            >
              <DatePicker className="w-full" />
            </Form.Item>
          </Form>
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
              label="培训费"
              name="trainingFee"
            >
              <InputNumber
                addonBefore="¥"
                min={0}
                placeholder="请输入培训费"
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label="邮箱"
              name="email"
              rules={[{ message: '请输入有效的邮箱地址', type: 'email' }]}
            >
              <Input placeholder="请输入邮箱" />
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
      dataIndex: 'id',
      key: 'id',
      title: 'ID',
      width: 50
    },
    {
      align: 'center' as const,
      dataIndex: 'name',
      key: 'name',
      title: '课程名称',
      width: 150
    },
    {
      align: 'center' as const,
      dataIndex: 'teacher',
      key: 'teacher',
      title: '任课老师',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'schedule',
      key: 'schedule',
      title: '上课时间',
      width: 200
    },
    {
      align: 'center' as const,
      dataIndex: 'classroom',
      key: 'classroom',
      title: '教室',
      width: 100
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
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'processing' : 'default'}>{status === 1 ? '进行中' : '未开始'}</Tag>
      ),
      title: '状态',
      width: 100
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
            <Button
              type="link"
              onClick={() => handleEditCourse(record)}
            >
              编辑
            </Button>
            <Button
              danger
              type="link"
              onClick={() => handleRemoveCourse(record.id)}
            >
              移除
            </Button>
          </Space>
        );
      },
      title: '操作',
      width: 180
    }
  ];

  // 渲染课程列表
  const renderCourseList = () => {
    return (
      <Card
        variant="borderless"
        extra={
          <Button
            type="primary"
            onClick={handleAddCourse}
          >
            {courseList.length > 0 ? '更换课程' : '添加课程'}
          </Button>
        }
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
            scroll={{ x: 1200 }}
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
                column={2}
                title="基本信息"
              >
                <Descriptions.Item label="课程名称">{currentCourse.name}</Descriptions.Item>
                <Descriptions.Item label="授课教师">{currentCourse.teacher}</Descriptions.Item>
                <Descriptions.Item label="上课地点">{currentCourse.classroom}</Descriptions.Item>
                <Descriptions.Item label="上课时间">{currentCourse.schedule}</Descriptions.Item>
                <Descriptions.Item label="开始日期">{currentCourse.startDate}</Descriptions.Item>
                <Descriptions.Item label="结束日期">{currentCourse.endDate}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={currentCourse.status === 1 ? 'processing' : 'default'}>
                    {currentCourse.status === 1 ? '进行中' : '未开始'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-medium">课程附件</h3>
                  <Button
                    icon={<UploadOutlined />}
                    type="primary"
                    onClick={handleUploadFile}
                  >
                    上传附件
                  </Button>
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
                            onClick={() => handleDownloadAttachment(record)}
                          >
                            下载
                          </Button>
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => handleDeleteAttachment(record.id)}
                          >
                            删除
                          </Button>
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

        {/* 课程编辑/添加模态框 */}
        <Modal
          open={courseModalVisible}
          title={currentCourse ? '编辑课程' : '添加课程'}
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
              label="课程名称"
              name="name"
              rules={[{ message: '请输入课程名称', required: true }]}
            >
              <Input placeholder="请输入课程名称" />
            </Form.Item>
            <Form.Item
              label="课程描述"
              name="description"
            >
              <Input.TextArea
                placeholder="请输入课程描述"
                rows={3}
              />
            </Form.Item>
            <Form.Item
              label="授课教师"
              name="teacher"
              rules={[{ message: '请输入授课教师', required: true }]}
            >
              <Input placeholder="请输入授课教师姓名" />
            </Form.Item>
            <Form.Item
              label="上课地点"
              name="classroom"
              rules={[{ message: '请输入上课地点', required: true }]}
            >
              <Input placeholder="请输入上课地点" />
            </Form.Item>
            <Form.Item
              label="课程时长"
              name="duration"
              rules={[{ message: '请输入课程时长', required: true }]}
            >
              <InputNumber
                addonAfter="天"
                max={365}
                min={1}
                placeholder="请输入课程时长"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label="课程价格"
              name="price"
              rules={[{ message: '请输入课程价格', required: true }]}
            >
              <InputNumber
                addonBefore="¥"
                min={0}
                placeholder="请输入课程价格"
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label="最大学员数"
              name="maxStudents"
              rules={[{ message: '请输入最大学员数', required: true }]}
            >
              <InputNumber
                max={1000}
                min={1}
                placeholder="请输入最大学员数"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label="开始日期"
              name="startDate"
              rules={[{ message: '请选择开始日期', required: true }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item
              label="结束日期"
              name="endDate"
              rules={[{ message: '请选择结束日期', required: true }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
          </Form>
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
          <Button
            type="primary"
            onClick={handlePublishAnnounce}
          >
            发布通知
          </Button>
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
              ]}
            >
              <List.Item.Meta
                description={
                  <div>
                    <div>{item.content}</div>
                    <div className="mt-2 text-gray-400">发布时间：{item.publishDate}</div>
                  </div>
                }
                title={
                  <Space>
                    <span>{item.title}</span>
                    <Tag color={getImportanceColor(item.importance)}>{getImportanceText(item.importance)}</Tag>
                  </Space>
                }
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
                <Descriptions.Item label="重要程度">
                  <Tag color={getImportanceColor(currentAnnounce.importance)}>
                    {getImportanceText(currentAnnounce.importance)}
                  </Tag>
                </Descriptions.Item>
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
                  <Button
                    icon={<UploadOutlined />}
                    type="primary"
                    onClick={handleUploadAnnounceFile}
                  >
                    上传附件
                  </Button>
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
                            onClick={() => handleDownloadAttachment(record)}
                          >
                            下载
                          </Button>
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => handleDeleteAnnounceAttachment(record.id)}
                          >
                            删除
                          </Button>
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
              label="重要程度"
              name="importance"
              rules={[{ message: '请选择重要程度', required: true }]}
            >
              <Select placeholder="请选择重要程度">
                <Select.Option value={0}>普通</Select.Option>
                <Select.Option value={1}>重要</Select.Option>
                <Select.Option value={2}>紧急</Select.Option>
              </Select>
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
