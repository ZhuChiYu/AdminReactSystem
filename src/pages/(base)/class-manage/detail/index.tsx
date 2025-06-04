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
        avatar: student.avatar || null,
        company: student.company || '',
        email: student.email || '',
        gender: student.gender || '',
        id: student.id,
        joinDate: student.joinDate || '',
        name: student.name,
        phone: student.phone || '',
        position: student.position || '',
        trainingFee: student.trainingFee || null
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

      // 获取课程附件
      const courseAttachmentsResponse = await attachmentService.getAttachmentList({
        courseId: Number.parseInt(classId, 10),
        current: 1,
        size: 1000
      });

      const formattedCourseAttachments = (courseAttachmentsResponse.data?.records || []).map(
        (attachment: AttachmentApi.AttachmentListItem) => ({
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
          fileType: attachment.fileType,
          id: attachment.id,
          uploader: attachment.uploader?.name || '未知',
          uploadTime: attachment.uploadTime
        })
      );

      setCourseAttachments(formattedCourseAttachments);
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
  const handleRemoveStudent = (studentId: number) => {
    Modal.confirm({
      content: '确定要移除该学员吗？',
      onOk: () => {
        setStudentList(prevList => prevList.filter(student => student.id !== studentId));
        message.success('学员已移除');
      },
      title: '移除学员'
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
      dataIndex: 'company',
      key: 'company',
      title: '单位',
      width: 150
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
      render: (_: unknown, record: any) => {
        return (
          <Space size="middle">
            <Button
              type="link"
              onClick={() => handleViewStudentDetail(record)}
            >
              详情
            </Button>
            <Button
              type="link"
              onClick={() => handleEditStudent(record)}
            >
              编辑
            </Button>
            <Button
              danger
              type="link"
              onClick={() => handleRemoveStudent(record.id)}
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
          avatar:
            student.avatar ||
            `https://xsgames.co/randomusers/avatar.php?g=${student.gender === '女' ? 'female' : 'male'}&id=${student.id}`,
          company: student.company || '',
          email: student.email || '',
          gender: student.gender || '',
          id: student.id,
          joinDate: student.joinDate || student.enrollmentDate || '',
          landline: student.landline || '',
          name: student.name,
          phone: student.phone || '',
          position: student.position || '',
          studentId: student.studentId || ''
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
  const handleViewCourseDetail = (course: any) => {
    setCurrentCourse(course);

    // 模拟加载课程附件数据
    const mockAttachments = [
      {
        id: 1,
        name: '课程大纲.pdf',
        size: '2.5MB',
        type: 'pdf',
        uploadTime: '2024-03-01 10:30:00',
        url: 'https://example.com/syllabus.pdf'
      },
      {
        id: 2,
        name: '课程资料.zip',
        size: '15MB',
        type: 'zip',
        uploadTime: '2024-03-02 14:20:00',
        url: 'https://example.com/materials.zip'
      },
      {
        id: 3,
        name: '课程PPT.pptx',
        size: '5.8MB',
        type: 'pptx',
        uploadTime: '2024-03-03 16:45:00',
        url: 'https://example.com/slides.pptx'
      }
    ];

    setCourseAttachments(mockAttachments);
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
    courseForm.resetFields();
    setCourseModalVisible(true);
  };

  // 保存课程
  const handleSaveCourse = async () => {
    try {
      const values = await courseForm.validateFields();

      // 使用真实的API创建课程
      const courseData = {
        // 生成唯一编码
        categoryId: 1,
        courseCode: `COURSE_${Date.now()}`,
        courseName: values.name,
        description: values.description || '',
        duration: values.duration || 30,
        endDate: values.endDate?.format('YYYY-MM-DD') || dayjs().add(30, 'day').format('YYYY-MM-DD'),
        // 默认分类ID，可以从课程分类API获取
        instructor: values.teacher,
        location: values.classroom || '线上',
        maxStudents: values.maxStudents || 50,
        originalPrice: values.price || 0,
        price: values.price || 0,
        startDate: values.startDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD')
      };

      await courseService.createCourse(courseData);

      message.success('课程添加成功');
      setCourseModalVisible(false);
      courseForm.resetFields();

      // 重新获取课程列表
      const coursesResponse = await courseService.getClassCourseList({
        classId: Number.parseInt(classId!, 10),
        current: 1,
        size: 1000
      });
      setCourseList(coursesResponse.records || []);
    } catch (error) {
      console.error('添加课程失败:', error);
      message.error('添加课程失败');
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
  const handleFileUpload = () => {
    if (fileList.length === 0) {
      message.error('请先选择要上传的文件');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // 计算总文件大小，以便显示
    const totalSize = fileList.reduce((total, file) => total + file.size, 0);
    const totalSizeText =
      totalSize < 1024 * 1024 ? `${(totalSize / 1024).toFixed(2)} KB` : `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;

    // 显示上传开始消息
    message.loading({
      content: `开始上传 ${fileList.length} 个文件 (总大小: ${totalSizeText})`,
      duration: 1,
      key: 'uploadMessage'
    });

    // 模拟上传文件
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 3) + 1;
      if (progress >= 100) {
        clearInterval(progressInterval);
        progress = 100;
      }
      setUploadProgress(progress);

      // 更新上传消息
      if (progress < 100) {
        message.loading({
          content: `正在上传: ${progress}%`,
          duration: 0,
          key: 'uploadMessage'
        });
      }
    }, 100);

    // 模拟上传完成
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);

      // 更新上传完成消息
      message.success({
        content: `上传完成!`,
        duration: 2,
        key: 'uploadMessage'
      });

      // 处理所有文件并添加到附件列表
      const newAttachments = fileList.map(file => {
        // 获取文件扩展名
        const fileExtension =
          file.name && typeof file.name === 'string' ? file.name.split('.').pop()?.toLowerCase() || '' : '';

        // 计算文件大小
        let fileSize;
        if (file.size < 1024 * 1024) {
          fileSize = `${(file.size / 1024).toFixed(2)} KB`;
        } else {
          fileSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
        }

        // 生成随机ID
        const fileId = Math.random().toString(36).substring(2);

        return {
          id: fileId,
          name: file.name,
          size: fileSize,
          type: fileExtension,
          uploadTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          url: URL.createObjectURL(file.originFileObj)
        };
      });

      // 添加到课程附件列表
      setCourseAttachments(prev => [...prev, ...newAttachments]);

      // 延迟一会儿显示上传完成状态
      setTimeout(() => {
        // 关闭模态框并重置状态
        setUploading(false);
        setUploadModalVisible(false);
        setFileList([]);
        setUploadProgress(0);

        // 显示最终成功消息
        message.success({
          content: `成功上传了 ${newAttachments.length} 个文件`,
          duration: 3
        });
      }, 1500);
    }, 1500);
  };

  // 处理附件删除
  const handleDeleteAttachment = (attachmentId: number) => {
    Modal.confirm({
      content: '确定要删除这个附件吗？',
      onOk: () => {
        const updatedAttachments = courseAttachments.filter(attachment => attachment.id !== attachmentId);
        setCourseAttachments(updatedAttachments);
        message.success('附件已删除');
      },
      title: '确认删除'
    });
  };

  // 处理附件下载
  const handleDownloadAttachment = (attachment: any) => {
    console.log('下载附件:', attachment);
    message.success(`开始下载: ${attachment.name}`);

    // 如果有真实URL，可以这样处理下载
    if (attachment.url) {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

      // 使用真实的API创建通知
      const notificationData = {
        content: values.content,
        // 班级通知类型
        relatedId: Number.parseInt(classId!, 10),
        relatedType: 'class',
        targetUserIds: [],
        title: values.title,
        type: 'class_announcement' // 空数组表示发给所有人
      };

      // 只支持创建新通知，暂不支持编辑
      await notificationService.createNotification(notificationData);
      message.success('通知发布成功');

      setAnnounceModalVisible(false);
      announceForm.resetFields();
      setCurrentAnnounce(null);

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
          importance: values.importance || 0,
          // 使用表单中的重要程度值
          publishDate: notification.createTime,
          title: notification.title
        })
      );

      setAnnounceList(formattedAnnouncements);
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

  const handleViewAnnounceDetail = (announce: any) => {
    setCurrentAnnounce(announce);

    // 模拟获取附件列表
    setTimeout(() => {
      const mockAttachments = [
        {
          id: 1,
          name: '通知附件1.pdf',
          size: '528.45 KB',
          type: 'pdf',
          uploadTime: '2024-05-15 10:00:05',
          url: '#'
        },
        {
          id: 2,
          name: '重要说明.docx',
          size: '125.32 KB',
          type: 'docx',
          uploadTime: '2024-05-15 10:01:22',
          url: '#'
        }
      ];
      setAnnounceAttachments(mockAttachments);
      setAnnounceDetailVisible(true);
    }, 500);
  };

  const handleUploadAnnounceFile = () => {
    setAnnounceFileList([]);
    setAnnounceUploadProgress(0);
    setAnnounceUploading(false);
    setAnnounceUploadModalVisible(true);
  };

  const handleAnnounceFileUpload = () => {
    setAnnounceUploading(true);

    // 模拟上传进度
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // 模拟上传延迟
        setTimeout(() => {
          // 生成上传的附件
          const newAttachments = announceFileList.map((file, index) => {
            return {
              id: announceAttachments.length + index + 1,
              name: file.name,
              size:
                file.size < 1024 * 1024
                  ? `${(file.size / 1024).toFixed(2)} KB`
                  : `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
              type: file.name.split('.').pop(),
              uploadTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              url: '#'
            };
          });

          setAnnounceAttachments([...announceAttachments, ...newAttachments]);
          message.success(`成功上传 ${announceFileList.length} 个文件`);

          // 延迟关闭模态框
          setTimeout(() => {
            setAnnounceUploadModalVisible(false);
            setAnnounceFileList([]);
          }, 1000);
        }, 1000);
      }
      setAnnounceUploadProgress(progress);
    }, 200);
  };

  const handleDeleteAnnounceAttachment = (attachmentId: number) => {
    Modal.confirm({
      content: '确定要删除该附件吗？此操作不可恢复。',
      onOk: () => {
        const updatedAttachments = announceAttachments.filter(a => a.id !== attachmentId);
        setAnnounceAttachments(updatedAttachments);
        message.success('附件已成功删除');
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
      dataIndex: 'id',
      key: 'id',
      title: 'ID',
      width: 50
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '课程名称',
      width: 150
    },
    {
      dataIndex: 'teacher',
      key: 'teacher',
      title: '任课老师',
      width: 120
    },
    {
      dataIndex: 'schedule',
      key: 'schedule',
      title: '上课时间',
      width: 200
    },
    {
      dataIndex: 'classroom',
      key: 'classroom',
      title: '教室',
      width: 100
    },
    {
      dataIndex: 'startDate',
      key: 'startDate',
      title: '开始日期',
      width: 120
    },
    {
      dataIndex: 'endDate',
      key: 'endDate',
      title: '结束日期',
      width: 120
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'processing' : 'default'}>{status === 1 ? '进行中' : '未开始'}</Tag>
      ),
      title: '状态',
      width: 100
    },
    {
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
        title="班级课程"
        variant="borderless"
        extra={
          <Button
            type="primary"
            onClick={handleAddCourse}
          >
            添加课程
          </Button>
        }
      >
        <Table
          columns={courseColumns}
          dataSource={courseList}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
        />

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
                      title: '大小',
                      width: 100
                    },
                    {
                      dataIndex: 'uploadTime',
                      key: 'uploadTime',
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
                      title: '大小',
                      width: 100
                    },
                    {
                      dataIndex: 'uploadTime',
                      key: 'uploadTime',
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
                            onClick={() => handleDeleteAnnounceAttachment(record.id)}
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

        {/* 附件上传模态框 */}
        <Modal
          footer={null}
          open={announceUploadModalVisible}
          title="上传附件"
          width={600}
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
                      dataSource={announceFileList.map((file, index) => ({
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
                  <Button onClick={() => setAnnounceUploadModalVisible(false)}>取消</Button>
                  <Button
                    disabled={announceFileList.length === 0}
                    type="primary"
                    onClick={handleAnnounceFileUpload}
                  >
                    开始上传
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
