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
  Upload,
  message
} from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface Attachment {
  courseId: number;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  id: number;
  uploadTime: string;
}

interface Course {
  id: number;
  name: string;
}

// 获取课程名称的辅助函数
const getCourseName = (courseId: string): string => {
  const courseMap: Record<string, string> = {
    '1': '企业人才培训管理',
    '2': 'Python数据分析',
    '3': '高级项目管理',
    '4': '数字营销策略',
    '5': '财务分析与决策',
    '6': '人才招聘与培养'
  };

  return courseMap[courseId] || `课程${courseId}`;
};

function Component() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();

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

  // 模拟加载课程数据
  useEffect(() => {
    setLoading(true);

    // 模拟API请求延迟
    setTimeout(() => {
      if (courseId) {
        const mockCourse = {
          id: Number(courseId),
          name: getCourseName(courseId)
        };

        setCourse(mockCourse);

        // 模拟附件数据
        const mockAttachments: Attachment[] = [
          {
            courseId: Number(courseId),
            downloadUrl: '#',
            fileName: '课程大纲.docx',
            fileSize: 256000,
            fileType: 'docx',
            id: 1,
            uploadTime: '2024-05-15 10:30:45'
          },
          {
            courseId: Number(courseId),
            downloadUrl: '#',
            fileName: '教材PPT.pptx',
            fileSize: 3500000,
            fileType: 'pptx',
            id: 2,
            uploadTime: '2024-05-15 11:20:30'
          },
          {
            courseId: Number(courseId),
            downloadUrl: '#',
            fileName: '学习资料.pdf',
            fileSize: 1250000,
            fileType: 'pdf',
            id: 3,
            uploadTime: '2024-05-16 09:15:22'
          },
          {
            courseId: Number(courseId),
            downloadUrl: '#',
            fileName: '练习题.xlsx',
            fileSize: 450000,
            fileType: 'xlsx',
            id: 4,
            uploadTime: '2024-05-17 14:05:10'
          },
          {
            courseId: Number(courseId),
            downloadUrl: '#',
            fileName: '阅读材料.txt',
            fileSize: 35000,
            fileType: 'txt',
            id: 5,
            uploadTime: '2024-05-18 16:45:33'
          }
        ];

        setAttachments(mockAttachments);
        setFilteredAttachments(mockAttachments);
      }

      setLoading(false);
    }, 800);
  }, [courseId]);

  // 处理搜索
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAttachments(attachments);
    } else {
      const filtered = attachments.filter(attachment =>
        attachment.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      );
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
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // 处理文件下载
  const handleDownload = (attachment: Attachment) => {
    // 在实际环境中，这将是一个真实的下载URL
    message.success(`开始下载文件：${attachment.fileName}`);

    // 模拟下载过程
    // 在实际实现中，可以使用：
    // const link = document.createElement('a');
    // link.href = attachment.downloadUrl;
    // link.download = attachment.fileName;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  };

  // 处理文件删除
  const handleDelete = (attachmentId: number) => {
    // 模拟删除请求
    const newAttachments = attachments.filter(item => item.id !== attachmentId);
    setAttachments(newAttachments);
    setFilteredAttachments(
      newAttachments.filter(attachment => attachment.fileName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    message.success('附件已删除');

    // 更新课程列表中的附件数量
    try {
      const storedCourses = localStorage.getItem('courseList');
      if (storedCourses && courseId) {
        const courses = JSON.parse(storedCourses);
        const courseIndex = courses.findIndex((c: any) => c.id === Number(courseId));

        if (courseIndex !== -1) {
          courses[courseIndex].attachmentCount = newAttachments.length;
          courses[courseIndex].attachment = newAttachments.length > 0 ? `${newAttachments.length}个附件` : '无附件';
          localStorage.setItem('courseList', JSON.stringify(courses));
        }
      }
    } catch (error) {
      console.error('更新课程附件状态失败', error);
    }
  };

  // 打开上传模态框
  const showUploadModal = () => {
    setFileList([]);
    setUploadProgress(0);
    setIsUploadModalVisible(true);
  };

  // 关闭上传模态框
  const handleUploadCancel = () => {
    setIsUploadModalVisible(false);
    setFileList([]);
    setUploadProgress(0);
  };

  // 处理文件上传
  const handleUpload = () => {
    if (fileList.length === 0) {
      message.error('请先选择文件');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // 模拟上传进度
    const intervalId = setInterval(() => {
      setUploadProgress(prevProgress => {
        const newProgress = prevProgress + Math.floor(Math.random() * 10);
        if (newProgress >= 100) {
          clearInterval(intervalId);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    // 模拟上传完成
    setTimeout(() => {
      clearInterval(intervalId);
      setUploadProgress(100);

      // 模拟创建新附件记录
      const newAttachments = [...attachments];

      fileList.forEach((file, index) => {
        const fileType = file.name.split('.').pop() || '';
        const newAttachment: Attachment = {
          courseId: Number(courseId),
          downloadUrl: '#',
          fileName: file.name,
          fileSize: file.size || 0,
          fileType,
          id: attachments.length + index + 1,
          uploadTime: new Date().toLocaleString()
        };

        newAttachments.push(newAttachment);
      });

      setAttachments(newAttachments);
      setFilteredAttachments(newAttachments);

      // 模拟更新课程列表中的附件状态
      // 在实际环境中，这里应该调用API来更新数据库中的课程信息
      // 这里我们仅模拟这个过程，因为在单页应用中页面跳转会丢失状态
      try {
        // 获取本地存储中的课程列表
        const storedCourses = localStorage.getItem('courseList');
        if (storedCourses) {
          const courses = JSON.parse(storedCourses);
          const courseIndex = courses.findIndex((c: any) => c.id === Number(courseId));

          if (courseIndex !== -1) {
            courses[courseIndex].attachmentCount = newAttachments.length;
            courses[courseIndex].attachment = `${newAttachments.length}个附件`;
            localStorage.setItem('courseList', JSON.stringify(courses));
          }
        }
      } catch (error) {
        console.error('更新课程附件状态失败', error);
      }

      setTimeout(() => {
        setUploading(false);
        message.success('文件上传成功');
        setIsUploadModalVisible(false);
      }, 500);
    }, 2000);
  };

  // 附件上传组件属性
  const uploadProps: UploadProps = {
    beforeUpload: file => {
      // 验证文件类型
      const isValidType = [
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'text/plain', // .txt
        'application/pdf', // .pdf
        'image/jpeg', // .jpg, .jpeg
        'image/png', // .png
        'image/gif' // .gif
      ].includes(file.type);

      if (!isValidType) {
        message.error('只支持Word, PowerPoint, Excel, TXT, PDF 和常见图片格式');
        return Upload.LIST_IGNORE;
      }

      // 验证文件大小（最大10MB）
      const isLessThan10M = file.size / 1024 / 1024 < 10;
      if (!isLessThan10M) {
        message.error('文件大小不能超过10MB');
        return Upload.LIST_IGNORE;
      }

      setFileList([...fileList, file]);
      return false; // 阻止自动上传
    },
    fileList,
    multiple: true,
    onRemove: file => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    }
  };

  // 定义表格列
  const columns = [
    {
      dataIndex: 'fileType',
      key: 'fileType',
      render: (fileType: string) => getFileIcon(fileType),
      title: '文件类型',
      width: 80
    },
    {
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string) => <Text strong>{text}</Text>,
      title: '文件名'
    },
    {
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (fileSize: number) => formatFileSize(fileSize),
      title: '文件大小',
      width: 120
    },
    {
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      title: '上传时间',
      width: 180
    },
    {
      key: 'action',
      render: (_: any, record: Attachment) => (
        <Space>
          <Button
            icon={<DownloadOutlined />}
            type="primary"
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
          <Popconfirm
            cancelText="取消"
            description="删除后将无法恢复"
            okText="确定"
            title="确定要删除这个附件吗?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              type="primary"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
      title: '操作',
      width: 200
    }
  ];

  // 定义分页配置
  const paginationConfig: TablePaginationConfig = {
    defaultPageSize: 10,
    pageSizeOptions: ['5', '10', '20', '50'],
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: total => `共 ${total} 个附件`
  };

  return (
    <div className="p-16px">
      <Card variant="borderless">
        <div className="mb-4 flex items-center">
          <Button
            className="mr-4"
            onClick={handleBackToList}
          >
            返回课程列表
          </Button>
          <Title
            className="m-0"
            level={4}
          >
            {course ? `${course.name} - 课程附件管理` : '加载中...'}
          </Title>
          {attachments.length > 0 && (
            <Tag
              className="ml-3"
              color="blue"
            >
              <PaperClipOutlined /> {attachments.length}个附件
            </Tag>
          )}
        </div>

        <Divider />

        <div className="mb-4 flex justify-between">
          <Input.Search
            allowClear
            placeholder="搜索附件名称"
            style={{ width: 300 }}
            onChange={e => setSearchQuery(e.target.value)}
            onSearch={handleSearch}
          />

          <Button
            icon={<CloudDownloadOutlined />}
            type="primary"
            onClick={showUploadModal}
          >
            上传附件
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredAttachments}
          loading={loading}
          pagination={paginationConfig}
          rowKey="id"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    暂无附件
                    <Button
                      className="ml-1 p-0"
                      type="link"
                      onClick={showUploadModal}
                    >
                      立即上传
                    </Button>
                  </span>
                }
              />
            )
          }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell
                colSpan={5}
                index={0}
              >
                <div className="text-right">
                  <Text strong>附件总数: </Text>
                  <Text>{filteredAttachments.length}个</Text>
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      {/* 上传附件模态框 */}
      <Modal
        open={isUploadModalVisible}
        title="上传课程附件"
        width={600}
        footer={[
          <Button
            key="back"
            onClick={handleUploadCancel}
          >
            取消
          </Button>,
          <Button
            disabled={fileList.length === 0}
            key="submit"
            loading={uploading}
            type="primary"
            onClick={handleUpload}
          >
            {uploading ? '上传中' : '开始上传'}
          </Button>
        ]}
        onCancel={handleUploadCancel}
      >
        <Dragger
          {...uploadProps}
          disabled={uploading}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个或批量上传。支持Word, PowerPoint, Excel, TXT, PDF和常见图片格式，单个文件大小不超过10MB。
          </p>
        </Dragger>

        {fileList.length > 0 && (
          <div className="mt-4">
            <Text strong>已选择 {fileList.length} 个文件</Text>
            <div className="mt-2 max-h-40 overflow-y-auto">
              {fileList.map((file, index) => (
                <div
                  className="mb-2 flex items-center"
                  key={index}
                >
                  {getFileIcon(file.name.split('.').pop() || '')}
                  <Text
                    ellipsis
                    className="ml-2"
                    style={{ maxWidth: '400px' }}
                  >
                    {file.name}
                  </Text>
                  <Text className="ml-2 text-gray-500">({formatFileSize(file.size || 0)})</Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploading && (
          <div className="mt-4">
            <Progress
              format={percent => `${percent}% 完成`}
              percent={uploadProgress}
              status={uploadProgress === 100 ? 'success' : 'active'}
            />
            <div className="mt-1 text-center">
              <Text type={uploadProgress === 100 ? 'success' : undefined}>
                {uploadProgress === 100 ? '上传完成！' : '正在上传...'}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Component;
