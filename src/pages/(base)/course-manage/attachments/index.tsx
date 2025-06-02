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
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface Attachment {
  id: number;
  courseId: number;
  fileName: string;
  originalName?: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
  uploadTime: string;
  uploader?: {
    id: number;
    name: string;
  };
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
    
    console.log('=== 开始获取数据 ===');
    console.log('courseId:', courseId, 'type:', typeof courseId);
    
    setLoading(true);
    try {
      // 获取课程信息（如果失败则使用fallback）
      try {
        console.log('步骤1：获取课程详情...');
        const courseResponse = await courseService.getCourseDetail(parseInt(courseId, 10));
        console.log('课程详情获取成功:', courseResponse);
        const courseData: Course = {
          id: courseResponse.id,
          name: courseResponse.courseName
        };
        setCourse(courseData);
      } catch (courseError) {
        console.error('获取课程详情失败:', courseError);
        message.warning(`课程 ${courseId} 不存在，使用默认名称`);
        // 使用fallback课程信息
        const fallbackCourse: Course = {
          id: parseInt(courseId, 10),
          name: getCourseName(courseId)
        };
        setCourse(fallbackCourse);
      }

      // 获取附件列表
      console.log('步骤2：开始获取附件列表...');
      const requestParams = {
        courseId: parseInt(courseId, 10),
        current: 1,
        size: 1000
      };
      console.log('请求参数:', requestParams);
      
      console.log('调用 attachmentService.getAttachmentList...');
      const attachmentResponse = await attachmentService.getAttachmentList(requestParams);
      
      console.log('=== API响应详情 ===');
      console.log('响应类型:', typeof attachmentResponse);
      console.log('响应是否为null:', attachmentResponse === null);
      console.log('响应是否为undefined:', attachmentResponse === undefined);
      console.log('响应的构造函数:', attachmentResponse?.constructor?.name);
      console.log('响应的所有属性:', Object.keys(attachmentResponse || {}));
      console.log('完整响应:', JSON.stringify(attachmentResponse, null, 2));

      // 检查响应数据是否有效
      if (attachmentResponse?.data) {
        console.log('=== 响应数据分析 ===');
        console.log('- 响应存在:', true);
        console.log('- 有data字段:', 'data' in attachmentResponse);
        console.log('- data值:', attachmentResponse.data);
        console.log('- data类型:', typeof attachmentResponse.data);
        console.log('- data是数组:', Array.isArray(attachmentResponse.data?.records));
        console.log('- data长度:', attachmentResponse.data?.records?.length);

        const records = attachmentResponse.data?.records || [];
        console.log('提取的records:', records);
        
        if (Array.isArray(records) && records.length > 0) {
          console.log('=== 数据处理 ===');
          console.log('找到附件数量:', records.length);
          console.log('第一个附件示例:', records[0]);
          
          // 转换API数据格式
          const formattedAttachments: Attachment[] = records.map((attachment: AttachmentApi.AttachmentListItem) => ({
            id: attachment.id,
            courseId: attachment.courseId,
            fileName: attachment.fileName,
            originalName: attachment.originalName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            downloadUrl: attachment.downloadUrl,
            uploadTime: attachment.uploadTime,
            uploader: attachment.uploader
          }));

          console.log('格式化后的附件:', formattedAttachments);
          setAttachments(formattedAttachments);
          setFilteredAttachments(formattedAttachments);
          message.success(`成功加载 ${formattedAttachments.length} 个附件`);
        } else {
          console.log('=== 空数据处理 ===');
          console.log('没有找到有效的附件数据');
          console.log('records值:', records);
          console.log('records长度:', records?.length);
          setAttachments([]);
          setFilteredAttachments([]);
          message.info('该课程暂无附件');
        }
      } else {
        console.log('=== 响应为空处理 ===');
        console.log('API响应为空或未定义');
        console.log('attachmentResponse:', attachmentResponse);
        setAttachments([]);
        setFilteredAttachments([]);
        message.warning('获取附件数据失败：响应为空');
      }
    } catch (error: any) {
      console.log('=== 错误处理 ===');
      console.error('获取数据失败:', error);
      console.error('错误类型:', error?.constructor?.name);
      console.error('错误消息:', error?.message);
      console.error('错误代码:', error?.code);
      console.error('错误响应:', error?.response);
      console.error('错误请求:', error?.request);
      console.error('错误配置:', error?.config);
      console.error('完整错误堆栈:', error?.stack);
      
      message.error(`获取附件数据失败: ${error?.message || '未知错误'}`);
      // 确保在错误情况下也设置空数组
      setAttachments([]);
      setFilteredAttachments([]);
    } finally {
      console.log('=== 数据获取完成 ===');
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间显示
  const formatUploadTime = (uploadTime: string): string => {
    const date = new Date(uploadTime);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
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
          return await attachmentService.uploadAttachment({
            courseId: parseInt(courseId, 10),
            file: file.originFileObj,
            onProgress: (progress) => {
              // 计算整体进度：已完成文件数 + 当前文件进度
              const overallProgress = Math.round(((completedCount + progress / 100) / totalFiles) * 100);
              setUploadProgress(overallProgress);
            }
          }).then(result => {
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
    multiple: true,
    fileList,
    beforeUpload: () => false, // 阻止自动上传
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ...getCenterColumnConfig(),
      render: (fileName: string, record: Attachment) => (
        <Space>
          {getFileIcon(record.fileType)}
          <span>{record.originalName || fileName}</span>
        </Space>
      )
    },
    {
      title: '文件类型',
      dataIndex: 'fileType',
      key: 'fileType',
      ...getCenterColumnConfig(),
      render: (fileType: string) => <Tag>{fileType.toUpperCase()}</Tag>
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      ...getCenterColumnConfig(),
      render: (size: number) => formatFileSize(size)
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      ...getCenterColumnConfig(),
      render: (uploadTime: string) => formatUploadTime(uploadTime)
    },
    {
      title: '上传人',
      dataIndex: 'uploader',
      key: 'uploader',
      ...getCenterColumnConfig(),
      render: (uploader: { id: number; name: string } | undefined) => uploader?.name || '未知'
    },
    {
      title: '操作',
      key: 'action',
      ...getActionColumnConfig(140),
      render: (_: any, record: Attachment) => (
        <Space>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
          <Popconfirm
            title="确定要删除这个文件吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 分页配置
  const paginationConfig: TablePaginationConfig = {
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="shadow-sm">
        {/* 顶部操作栏 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={handleBackToList}>
              返回课程列表
            </Button>
            <Divider type="vertical" />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                <PaperClipOutlined className="mr-2" />
                课程附件管理
              </Title>
              {course && (
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  课程：{course.name}
                </Text>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Input.Search
              placeholder="搜索文件名"
              allowClear
              style={{ width: 250 }}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && setSearchQuery('')}
            />
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              onClick={showUploadModal}
            >
              上传文件
            </Button>
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
          title="上传文件"
          open={isUploadModalVisible}
          onCancel={handleUploadCancel}
          footer={[
            <Button key="cancel" onClick={handleUploadCancel}>
              取消
            </Button>,
            <Button
              key="upload"
              type="primary"
              loading={uploading}
              onClick={handleUpload}
              disabled={fileList.length === 0}
            >
              开始上传
            </Button>
          ]}
          width={600}
          destroyOnClose
        >
          <div className="space-y-4">
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持单个或批量上传，支持各种格式的文档、图片、音视频文件
              </p>
            </Dragger>

            {uploading && (
              <div>
                <Text>上传进度：</Text>
                <Progress percent={uploadProgress} status={uploadProgress === 100 ? 'success' : 'active'} />
              </div>
            )}
          </div>
        </Modal>
      </Card>
    </div>
  );
}

export default Component;
