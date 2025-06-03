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

import UserAvatar from '@/components/UserAvatar';
import { attachmentService, classService, courseService, notificationService } from '@/service/api';
import type { AttachmentApi, NotificationApi } from '@/service/api/types';
import type { UserPermission } from '@/store/permissionStore';
import usePermissionStore, { PermissionType } from '@/store/permissionStore';
import { getCurrentUserId, isSuperAdmin } from '@/utils/auth';

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
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [editForm] = Form.useForm();

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

  // 添加用于权限管理的状态
  const [staffList, setStaffList] = useState<any[]>([]);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<any>(null);
  const [permissionForm] = Form.useForm();
  const [permissionType, setPermissionType] = useState<string | null>(null);

  const { hasPermission } = usePermissionStore();
  const currentUserId = getCurrentUserId();
  const isUserSuperAdmin = isSuperAdmin();

  // 获取班级数据
  const fetchClassData = async () => {
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
        avatar:
          student.avatar ||
          `https://xsgames.co/randomusers/avatar.php?g=${student.gender === '女' ? 'female' : 'male'}&id=${student.id}`,
        company: student.company || '',
        email: student.email || '',
        gender: student.gender || '',
        id: student.id,
        joinDate: student.enrollmentDate || '',
        landline: student.landline || '',
        name: student.name,
        phone: student.phone || '',
        position: student.position || '',
        studentId: student.studentId || ''
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

      // 获取教职工列表
      const staffResponse = await classService.getClassStaffList({
        classId: Number.parseInt(classId, 10)
      });

      setStaffList(staffResponse || []);

      // 获取课程附件
      const courseAttachmentsResponse = await attachmentService.getAttachmentList({
        courseId: Number.parseInt(classId, 10),
        current: 1,
        size: 1000
      });

      const formattedCourseAttachments = courseAttachmentsResponse.records.map(
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
    fetchClassData();
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
    setCurrentStudent(student);
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
      const values = await editForm.validateFields();
      setStudentList(prevList =>
        prevList.map(student => (student.id === currentStudent.id ? { ...student, ...values } : student))
      );
      setEditModalVisible(false);
      message.success('学员信息更新成功');
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 学员列表表格列配置
  const studentColumns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: 'ID',
      width: 50
    },
    {
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <UserAvatar
            avatar={record.avatar}
            gender={record.gender}
            size={40}
            userId={record.id}
          />
          {text}
        </Space>
      ),
      title: '姓名',
      width: 120
    },
    {
      dataIndex: 'gender',
      key: 'gender',
      title: '性别',
      width: 80
    },
    {
      dataIndex: 'company',
      key: 'company',
      title: '单位',
      width: 150
    },
    {
      dataIndex: 'position',
      key: 'position',
      title: '职务',
      width: 120
    },
    {
      dataIndex: 'phone',
      key: 'phone',
      title: '电话',
      width: 120
    },
    {
      dataIndex: 'landline',
      key: 'landline',
      title: '座机号',
      width: 120
    },
    {
      dataIndex: 'email',
      key: 'email',
      title: '邮箱',
      width: 180
    },
    {
      dataIndex: 'joinDate',
      key: 'joinDate',
      title: '加入日期',
      width: 120
    },
    {
      key: 'action',
      render: (_: unknown, record: any) => {
        // 权限判断：超级管理员或有特定权限才显示编辑和删除按钮
        const canEditStudent =
          isUserSuperAdmin || hasPermission(currentUserId, PermissionType.EDIT_STUDENT, undefined, record.id);

        return (
          <Space size="middle">
            <Button
              type="link"
              onClick={() => handleViewStudentDetail(record)}
            >
              详情
            </Button>
            {canEditStudent && (
              <Button
                type="link"
                onClick={() => handleEditStudent(record)}
              >
                编辑
              </Button>
            )}
            {canEditStudent && (
              <Button
                danger
                type="link"
                onClick={() => handleRemoveStudent(record.id)}
              >
                移除
              </Button>
            )}
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
        // 生成随机学员ID
        avatar: `https://xsgames.co/randomusers/avatar.php?g=${values.gender === '男' ? 'male' : 'female'}&id=${newId + 10}`,
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

  // 移除课程
  const handleRemoveCourse = (courseId: number) => {
    Modal.confirm({
      content: '确定要移除该课程吗？此操作不可恢复。',
      onOk: () => {
        // 过滤掉要移除的课程
        const updatedCourseList = courseList.filter(c => c.id !== courseId);
        setCourseList(updatedCourseList);

        // 显示成功消息
        message.success('课程已成功移除');
      },
      title: '确认移除'
    });
  };

  // 添加新课程
  const handleAddCourse = () => {
    setCurrentCourse(null);
    courseForm.resetFields();
    setCourseModalVisible(true);
  };

  // 提交课程表单
  const handleSaveCourse = async () => {
    try {
      const values = await courseForm.validateFields();

      // 获取课程状态
      let courseStatus = 1; // 默认为进行中
      const startDate = dayjs(values.startDate);
      const endDate = dayjs(values.endDate);
      const now = dayjs();

      if (startDate.isAfter(now)) {
        courseStatus = 0; // 未开始
      } else if (endDate.isBefore(now)) {
        courseStatus = 2; // 已结束
      }

      if (currentCourse) {
        // 编辑现有课程
        const updatedCourseList = courseList.map(item => {
          if (item.id === currentCourse.id) {
            return {
              ...item,
              ...values,
              status: courseStatus
            };
          }
          return item;
        });
        setCourseList(updatedCourseList);
        message.success('课程已更新');
      } else {
        // 添加新课程
        const newCourse = {
          ...values,
          attachments: [],
          id: courseList.length + 1,
          status: courseStatus
        };
        setCourseList([...courseList, newCourse]);
        message.success('课程已添加');
      }

      setCourseModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
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

  // 通知公告相关处理函数
  const handlePublishAnnounce = () => {
    announceForm.resetFields();
    setCurrentAnnounce(null);
    setAnnounceModalVisible(true);
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

  const handleDeleteAnnounce = (announceId: number) => {
    Modal.confirm({
      content: '确定要删除该通知吗？此操作不可恢复。',
      onOk: () => {
        const updatedAnnounceList = announceList.filter(a => a.id !== announceId);
        setAnnounceList(updatedAnnounceList);
        message.success('通知已成功删除');
      },
      title: '确认删除'
    });
  };

  const handleSaveAnnounce = async () => {
    try {
      const values = await announceForm.validateFields();

      if (currentAnnounce) {
        // 编辑现有通知
        const updatedAnnounceList = announceList.map(item => {
          if (item.id === currentAnnounce.id) {
            return {
              ...item,
              ...values,
              publishDate: dayjs().format('YYYY-MM-DD HH:mm:ss')
            };
          }
          return item;
        });
        setAnnounceList(updatedAnnounceList);
        message.success('通知已更新');
      } else {
        // 添加新通知
        const newAnnounce = {
          ...values,
          attachments: [],
          id: announceList.length + 1,
          publishDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          status: 1
        };
        setAnnounceList([...announceList, newAnnounce]);
        message.success('通知已发布');
      }

      setAnnounceModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
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

  // 处理授权
  const handleGrantPermission = (staffId: string, staffName: string, permType: string) => {
    setCurrentStaff({ id: staffId, name: staffName });
    setPermissionType(permType);
    setPermissionModalVisible(true);
  };

  // 保存权限设置
  const handleSavePermission = async () => {
    try {
      const values = await permissionForm.validateFields();

      if (permissionType && currentStaff) {
        // 获取权限类型
        const permType = permissionType === 'student' ? PermissionType.EDIT_STUDENT : PermissionType.EDIT_ANNOUNCE;

        // 授予特定班级的权限
        if (classInfo && classInfo.id) {
          // 设置授权期限
          const expiryDate = values.expiry ? values.expiry.format('YYYY-MM-DD HH:mm:ss') : undefined;

          // 创建带有到期时间的权限对象
          const permission: UserPermission = {
            classId: classInfo.id,
            expiryTime: expiryDate,
            grantedBy: currentUserId,
            permissionType: permType,
            userId: currentStaff.id
          };

          // 添加权限
          usePermissionStore.getState().addPermission(permission);

          message.success(
            `已成功授予 ${currentStaff.name} ${permissionType === 'student' ? '编辑学员' : '编辑通知'} 权限`
          );
        }
      }

      setPermissionModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 渲染主要信息区域
  const renderBasicInfo = () => {
    if (!classInfo) return null;

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
            {classInfo.trainingFee ? `¥${Number(classInfo.trainingFee).toFixed(2)}` : '¥0.00'}
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
              type="primary"
              onClick={handleShowAddModal}
            >
              添加学员
            </Button>
            <Button onClick={handleExportStudents}>导出学员</Button>
          </Space>
        }
      >
        <Table
          columns={studentColumns}
          dataSource={studentList}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1300 }}
        />

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
          onCancel={() => setEditModalVisible(false)}
          onOk={handleSaveEdit}
        >
          <Form
            form={editForm}
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
        const canEdit =
          isUserSuperAdmin || hasPermission(currentUserId, PermissionType.EDIT_CLASS, undefined, classInfo?.id);
        return (
          <Space size="middle">
            <Button
              type="link"
              onClick={() => handleViewCourseDetail(record)}
            >
              详情
            </Button>
            {canEdit && (
              <Button
                type="link"
                onClick={() => handleEditCourse(record)}
              >
                编辑
              </Button>
            )}
            {isUserSuperAdmin && (
              <Button
                danger
                type="link"
                onClick={() => handleRemoveCourse(record.id)}
              >
                移除
              </Button>
            )}
          </Space>
        );
      },
      title: '操作',
      width: 180
    }
  ];

  // 渲染课程列表
  const renderCourseList = () => {
    const canEdit =
      isUserSuperAdmin || hasPermission(currentUserId, PermissionType.EDIT_CLASS, undefined, classInfo?.id);
    return (
      <Card
        title="班级课程"
        variant="borderless"
        extra={
          canEdit && (
            <Button
              type="primary"
              onClick={handleAddCourse}
            >
              添加课程
            </Button>
          )
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
              label="上课时间"
              name="schedule"
              rules={[{ message: '请输入上课时间', required: true }]}
            >
              <Input placeholder="如：周一、周三 9:00-10:30" />
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
    const canEditAnnounce =
      isUserSuperAdmin || hasPermission(currentUserId, PermissionType.EDIT_ANNOUNCE, undefined, classInfo?.id);

    return (
      <Card
        title="通知公告"
        variant="borderless"
        extra={
          canEditAnnounce && (
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
                canEditAnnounce && (
                  <Button
                    key="list-edit"
                    type="link"
                    onClick={() => handleEditAnnounce(item)}
                  >
                    编辑
                  </Button>
                ),
                canEditAnnounce && (
                  <Button
                    danger
                    key="list-delete"
                    type="link"
                    onClick={() => handleDeleteAnnounce(item.id)}
                  >
                    删除
                  </Button>
                )
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

  // 渲染权限管理
  const renderPermissions = () => {
    if (!isUserSuperAdmin) {
      return (
        <div className="h-64 flex items-center justify-center">
          <Typography.Text className="text-lg text-gray-500">您没有查看此页面的权限</Typography.Text>
        </div>
      );
    }

    const columns = [
      {
        dataIndex: 'name',
        key: 'name',
        title: '姓名',
        width: 150
      },
      {
        dataIndex: 'role',
        key: 'role',
        title: '角色',
        width: 150
      },
      {
        dataIndex: 'department',
        key: 'department',
        title: '部门',
        width: 200
      },
      {
        key: 'action',
        render: (_: unknown, record: any) => (
          <Space size="middle">
            <Button
              size="small"
              type="primary"
              onClick={() => handleGrantPermission(record.id, record.name, 'student')}
            >
              授予编辑学员权限
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => handleGrantPermission(record.id, record.name, 'announce')}
            >
              授予编辑通知权限
            </Button>
          </Space>
        ),
        title: '操作',
        width: 350
      }
    ];

    return (
      <Card
        title="权限管理"
        variant="borderless"
      >
        <Typography.Paragraph className="mb-4">在此管理员工和管理员对当前班级的特殊权限。</Typography.Paragraph>

        <Table
          columns={columns}
          dataSource={staffList}
          rowKey="id"
        />

        <Modal
          open={permissionModalVisible}
          title={`授予 ${currentStaff?.name || ''} ${permissionType === 'student' ? '编辑学员' : '编辑通知'} 权限`}
          onCancel={() => setPermissionModalVisible(false)}
          onOk={handleSavePermission}
        >
          <Form
            form={permissionForm}
            labelCol={{ span: 6 }}
            style={{ marginTop: 20 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item label="权限类型">
              <Input
                disabled
                value={permissionType === 'student' ? '编辑学员权限' : '编辑通知权限'}
              />
            </Form.Item>
            <Form.Item
              label="权限到期时间"
              name="expiry"
            >
              <DatePicker
                showTime
                placeholder="不设置则永久有效"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label="备注"
              name="remark"
            >
              <Input.TextArea
                placeholder="可选备注信息"
                rows={4}
              />
            </Form.Item>
          </Form>
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
          },
          {
            children: renderPermissions(),
            key: 'permissions',
            label: '权限管理'
          }
        ]}
      />
    </div>
  );
};

export default ClassDetail;
