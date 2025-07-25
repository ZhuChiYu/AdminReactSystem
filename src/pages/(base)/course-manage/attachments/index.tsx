import {
  CloudDownloadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileTextOutlined,
  FileWordOutlined,
  InboxOutlined,
  PaperClipOutlined
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
  Upload
} from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { attachmentService, courseService } from '@/service/api';
import type { AttachmentApi, CourseApi } from '@/service/api/types';
import { isSuperAdmin } from '@/utils/auth';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface Attachment {
  courseId: number;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  id: number;
  originalName?: string;
  uploader?: {
    id: number;
    name: string;
  };
  uploadTime: string;
}

interface Course {
  id: number;
  name: string;
}

// 获取课程名称的辅助函数
const getCourseName = (courseId: string): string => {
  const courseMap: Record<string, string> = {
    '4': 'Python编程入门',
    '5': '企业管理培训'
  };

  return courseMap[courseId] || `课程${courseId}`;
};

function Component() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { message } = App.useApp();

  const [course, setCourse] = useState<Course | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttachments, setFilteredAttachments] = useState<Attachment[]>([]);

  // 上传相关状态
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // 获取课程和附件数据
  const fetchData = async () => {
    if (!courseId) return;

    setLoading(true);
    try {
      // 获取课程信息（如果失败则使用fallback）
      try {
        const courseResponse = await courseService.getCourseDetail(Number.parseInt(courseId, 10));
        setCourse(courseResponse);
      } catch (courseError) {
        console.error('获取课程详情失败:', courseError);
        message.warning(`课程 ${courseId} 不存在，使用默认名称`);
        // 使用fallback课程信息
        const fallbackCourse: Course = {
          id: Number.parseInt(courseId, 10),
          name: getCourseName(courseId)
        };
        setCourse(fallbackCourse);
      }

      // 获取附件列表
      const requestParams = {
        courseId: Number.parseInt(courseId, 10),
        current: 1,
        size: 1000 // 获取所有附件，前端进行分页
      };
      const attachmentResponse = await attachmentService.getAttachmentList(requestParams);

      // 检查响应数据是否有效
      // attachmentService.getAttachmentList 现在返回的是 PageResponse.data 部分
      if (attachmentResponse && attachmentResponse.records) {
        const records = attachmentResponse.records || [];

        if (Array.isArray(records) && records.length > 0) {
          // 转换API数据格式
          const formattedAttachments: Attachment[] = records.map((attachment: AttachmentApi.AttachmentListItem) => ({
            courseId: attachment.courseId,
            downloadUrl: attachment.downloadUrl,
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            fileType: attachment.fileType,
            id: attachment.id,
            originalName: attachment.originalName,
            uploader: attachment.uploader,
            uploadTime: attachment.uploadTime
          }));

          setAttachments(formattedAttachments);
          setFilteredAttachments(formattedAttachments);
        } else {
          setAttachments([]);
          setFilteredAttachments([]);
          // 没有附件时不显示提示消息，保持静默
        }
      } else {
        setAttachments([]);
        setFilteredAttachments([]);
        // 响应为空时不显示提示消息，保持静默
      }
    } catch (error: any) {
      message.error(`获取附件数据失败: ${error?.message || '未知错误'}`);
      // 确保在错误情况下也设置空数组
      setAttachments([]);
      setFilteredAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  // 处理搜索
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAttachments(attachments);
    } else {
      const filtered = attachments.filter(attachment => {
        const displayName = attachment.originalName || attachment.fileName;
        return displayName.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredAttachments(filtered);
    }
  }, [searchQuery, attachments]);

  // 处理搜索输入
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  // 处理返回列表页
  const handleBackToList = () => {
    navigate('/course-manage/list');
  };

  // 获取文件图标
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'docx':
      case 'doc':
        return <FileWordOutlined style={{ color: '#2a5699', fontSize: 24 }} />;
      case 'pptx':
      case 'ppt':
        return <FilePptOutlined style={{ color: '#d24726', fontSize: 24 }} />;
      case 'xlsx':
      case 'xls':
        return <FileExcelOutlined style={{ color: '#217346', fontSize: 24 }} />;
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff0000', fontSize: 24 }} />;
      case 'txt':
        return <FileTextOutlined style={{ color: '#888888', fontSize: 24 }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImageOutlined style={{ color: '#36b37e', fontSize: 24 }} />;
      default:
        return <FileTextOutlined style={{ color: '#888888', fontSize: 24 }} />;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  // 格式化时间显示
  const formatUploadTime = (uploadTime: string): string => {
    const date = new Date(uploadTime);
    return date.toLocaleString('zh-CN', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
      second: '2-digit',
      year: 'numeric'
    });
  };

  // 处理文件下载
  const handleDownload = async (attachment: Attachment) => {
    try {
      message.loading({ content: '准备下载...', key: 'download' });

      // 使用attachmentService的下载方法，它会自动携带认证信息
      const blob = await attachmentService.downloadAttachment(attachment.id);

      // 创建下载链接
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.originalName || attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 清理URL对象
      window.URL.revokeObjectURL(downloadUrl);

      message.success({ content: `下载成功: ${attachment.originalName || attachment.fileName}`, key: 'download' });
    } catch (error) {
      console.error('下载文件失败:', error);
      message.error({ content: '下载失败，请重试', key: 'download' });
    }
  };

  // 处理文件删除
  const handleDelete = async (attachmentId: number) => {
    try {
      await attachmentService.deleteAttachment(attachmentId);
      message.success('文件删除成功');
      fetchData(); // 重新获取列表
    } catch (error) {
      message.error('删除失败');
      console.error('删除附件失败:', error);
    }
  };

  // 显示上传弹窗
  const showUploadModal = () => {
    setIsUploadModalVisible(true);
    setFileList([]);
    setUploadProgress(0);
  };

  // 取消上传
  const handleUploadCancel = () => {
    setIsUploadModalVisible(false);
    setFileList([]);
    setUploadProgress(0);
  };

  // 处理文件上传
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    if (!courseId) {
      message.error('课程ID无效');
      return;
    }

    setUploading(true);

    try {
      let completedCount = 0;
      const totalFiles = fileList.length;

      const promises = fileList.map(async (file, index) => {
        if (file.originFileObj) {
          return await attachmentService
            .uploadAttachment({
              courseId: Number.parseInt(courseId, 10),
              file: file.originFileObj,
              onProgress: progress => {
                // 计算整体进度：已完成文件数 + 当前文件进度
                const overallProgress = Math.round(((completedCount + progress / 100) / totalFiles) * 100);
                setUploadProgress(overallProgress);
              }
            })
            .then(result => {
              completedCount++;
              return result;
            });
        }
        return null;
      });

      await Promise.all(promises);

      setUploadProgress(100);
      message.success('文件上传成功');
      setIsUploadModalVisible(false);
      setFileList([]);
      fetchData(); // 重新获取列表
    } catch (error) {
      message.error('上传失败');
      console.error('上传附件失败:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 上传配置
  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    fileList,
    multiple: true, // 阻止自动上传
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    onRemove: file => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    }
  };

  // 表格列配置
  const columns = [
    {
      dataIndex: 'fileName',
      key: 'fileName',
      title: '文件名',
      ...getCenterColumnConfig(),
      render: (fileName: string, record: Attachment) => (
        <Space>
          {getFileIcon(record.fileType)}
          <span>{record.originalName || fileName}</span>
        </Space>
      )
    },
    {
      dataIndex: 'fileType',
      key: 'fileType',
      title: '文件类型',
      ...getCenterColumnConfig(),
      render: (fileType: string) => <Tag>{fileType.toUpperCase()}</Tag>
    },
    {
      dataIndex: 'fileSize',
      key: 'fileSize',
      title: '文件大小',
      ...getCenterColumnConfig(),
      render: (size: number) => formatFileSize(size)
    },
    {
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      title: '上传时间',
      ...getCenterColumnConfig(),
      render: (uploadTime: string) => formatUploadTime(uploadTime)
    },
    {
      dataIndex: 'uploader',
      key: 'uploader',
      title: '上传人',
      ...getCenterColumnConfig(),
      render: (uploader: { id: number; name: string } | undefined) => uploader?.name || '未知'
    },
    {
      key: 'action',
      title: '操作',
      ...getActionColumnConfig(140),
      render: (_: any, record: Attachment) => (
        <Space>
          <Button
            icon={<DownloadOutlined />}
            type="link"
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
          {isSuperAdmin() && (
            <Popconfirm
              cancelText="取消"
              okText="确定"
              title="确定要删除这个文件吗？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                type="link"
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  // 分页配置
  const paginationConfig: TablePaginationConfig = {
    pageSize: 10,
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="shadow-sm">
        {/* 顶部操作栏 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={handleBackToList}>返回课程列表</Button>
            <Divider type="vertical" />
            <div>
              <Title
                level={4}
                style={{ margin: 0 }}
              >
                <PaperClipOutlined className="mr-2" />
                课程附件管理
              </Title>
              {course && (
                <Text
                  style={{ fontSize: '14px' }}
                  type="secondary"
                >
                  课程：{course.name}
                </Text>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Input.Search
              allowClear
              placeholder="搜索文件名"
              style={{ width: 250 }}
              onChange={e => !e.target.value && setSearchQuery('')}
              onSearch={handleSearch}
            />
            {isSuperAdmin() && (
              <Button
                icon={<CloudDownloadOutlined />}
                type="primary"
                onClick={showUploadModal}
              >
                上传文件
              </Button>
            )}
          </div>
        </div>

        {/* 附件表格 */}
        {loading ? (
          <div className="py-20 text-center">
            <Text>加载中...</Text>
          </div>
        ) : filteredAttachments.length === 0 ? (
          <Empty
            description="暂无附件"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredAttachments}
            rowKey="id"
            {...getFullTableConfig(10)}
          />
        )}

        {/* 上传弹窗 */}
        <Modal
          destroyOnClose
          open={isUploadModalVisible}
          title="上传文件"
          width={600}
          footer={[
            <Button
              key="cancel"
              onClick={handleUploadCancel}
            >
              取消
            </Button>,
            <Button
              disabled={fileList.length === 0}
              key="upload"
              loading={uploading}
              type="primary"
              onClick={handleUpload}
            >
              开始上传
            </Button>
          ]}
          onCancel={handleUploadCancel}
        >
          <div className="space-y-4">
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">支持单个或批量上传，支持各种格式的文档、图片、音视频文件</p>
            </Dragger>

            {uploading && (
              <div>
                <Text>上传进度：</Text>
                <Progress
                  percent={uploadProgress}
                  status={uploadProgress === 100 ? 'success' : 'active'}
                />
              </div>
            )}
          </div>
        </Modal>
      </Card>
    </div>
  );
}

export default Component;
