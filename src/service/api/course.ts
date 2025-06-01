import { apiClient, createMockPageResponse, createMockResponse } from './client';
import type { CourseApi, PageResponse } from './types';

/** 课程管理相关API服务 */
export class CourseService {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 模拟课程数据
  private mockCourses: CourseApi.CourseListItem[] = [
    {
      category: { id: 1, name: '财务管理' },
      courseCode: 'CWGL001',
      courseName: '企业财务管理基础',
      courseType: 1,
      coverImage: 'https://via.placeholder.com/300x200',
      createTime: '2024-01-15',
      duration: 120,
      enrollCount: 890,
      id: 1,
      isFeatured: true,
      maxStudents: 50,
      price: 2999,
      rating: 4.8,
      status: 1,
      teacher: { id: 1, name: '张教授' },
      viewCount: 1250
    },
    {
      category: { id: 2, name: '风险管理' },
      courseCode: 'FXGL002',
      courseName: '风险管理与内控体系建设',
      courseType: 1,
      coverImage: 'https://via.placeholder.com/300x200',
      createTime: '2024-01-20',
      duration: 180,
      enrollCount: 650,
      id: 2,
      isFeatured: false,
      maxStudents: 40,
      price: 3999,
      rating: 4.9,
      status: 1,
      teacher: { id: 2, name: '李专家' },
      viewCount: 890
    },
    {
      category: { id: 3, name: '税务管理' },
      courseCode: 'SWGL003',
      courseName: '税务筹划与合规管理',
      courseType: 1,
      coverImage: 'https://via.placeholder.com/300x200',
      createTime: '2024-01-25',
      duration: 150,
      enrollCount: 420,
      id: 3,
      isFeatured: false,
      maxStudents: 45,
      price: 3499,
      rating: 4.7,
      status: 1,
      teacher: { id: 3, name: '王顾问' },
      viewCount: 650
    }
  ];

  /** 获取课程列表 */
  async getCourseList(
    params?: CourseApi.CourseQueryParams
  ): Promise<{ data: { current: number; records: CourseApi.CourseListItem[]; size: number; total: number } }> {
    await this.delay(500);

    let filteredCourses = [...this.mockCourses];

    if (params?.categoryId) {
      filteredCourses = filteredCourses.filter(course => course.category.id === params.categoryId);
    }

    if (params?.courseName) {
      filteredCourses = filteredCourses.filter(course => course.courseName.includes(params.courseName!));
    }

    if (params?.courseCode) {
      filteredCourses = filteredCourses.filter(course => course.courseCode.includes(params.courseCode!));
    }

    const current = params?.current || 1;
    const size = params?.size || 10;
    const start = (current - 1) * size;
    const end = start + size;

    return {
      data: {
        current,
        records: filteredCourses.slice(start, end),
        size,
        total: filteredCourses.length
      }
    };
  }

  /** 获取课程详情 */
  async getCourseDetail(id: number): Promise<CourseApi.CourseListItem> {
    await this.delay(300);

    return {
      category: { id: 1, name: '财务管理' },
      courseCode: 'CWGL001',
      courseName: '企业财务管理基础',
      courseType: 1,
      coverImage: 'https://via.placeholder.com/300x200',
      createTime: '2024-01-15',
      duration: 120,
      enrollCount: 890,
      id,
      isFeatured: true,
      maxStudents: 50,
      price: 2999,
      rating: 4.8,
      status: 1,
      teacher: { id: 1, name: '张教授' },
      viewCount: 1250
    };
  }

  /** 创建课程 */
  async createCourse(params: CourseApi.CreateCourseRequest): Promise<{ id: number }> {
    await this.delay(800);
    return { id: Date.now() };
  }

  /** 更新课程 */
  async updateCourse(id: number, params: Partial<CourseApi.CreateCourseRequest>): Promise<void> {
    await this.delay(600);
  }

  /** 删除课程 */
  async deleteCourse(id: number): Promise<void> {
    await this.delay(400);
  }

  /** 发布课程 */
  async publishCourse(id: number): Promise<void> {
    // return apiClient.post(`/courses/${id}/publish`);

    return createMockResponse(undefined);
  }

  /** 下架课程 */
  async unpublishCourse(id: number): Promise<void> {
    // return apiClient.post(`/courses/${id}/unpublish`);

    return createMockResponse(undefined);
  }

  /** 获取课程分类列表 */
  async getCourseCategories(): Promise<CourseApi.CourseCategory[]> {
    await this.delay(200);

    const mockCategories: CourseApi.CourseCategory[] = [
      { description: '企业财务管理相关课程', id: 1, name: '财务管理' },
      { description: '企业风险识别与控制课程', id: 2, name: '风险管理' },
      { description: '税务筹划与合规管理课程', id: 3, name: '税务管理' },
      { description: '人力资源管理课程', id: 4, name: '人力资源' },
      { description: '市场营销策略课程', id: 5, name: '市场营销' },
      { description: '项目管理方法与实践课程', id: 6, name: '项目管理' },
      { description: '企业数字化转型课程', id: 7, name: '数字化转型' },
      { description: '管理者领导力提升课程', id: 8, name: '领导力' }
    ];

    return mockCategories;
  }

  /** 获取课程统计数据 */
  async getCourseStatistics(): Promise<Record<string, number>> {
    // return apiClient.get('/courses/statistics');

    const mockStatistics = {
      archived: 10,
      draft: 18,
      published: 128,
      total: 156,
      totalRevenue: 486000,
      totalStudents: 2580
    };

    return createMockResponse(mockStatistics);
  }

  /** 批量操作课程 */
  async batchOperateCourses(courseIds: number[], operation: 'delete' | 'publish' | 'unpublish'): Promise<void> {
    // return apiClient.post('/courses/batch-operate', { courseIds, operation });

    return createMockResponse(undefined);
  }

  /** 复制课程 */
  async copyCourse(id: number, newName: string): Promise<{ id: number }> {
    // return apiClient.post(`/courses/${id}/copy`, { newName });

    return createMockResponse({ id: Date.now() });
  }

  /** 获取课程评价列表 */
  async getCourseReviews(courseId: number): Promise<CourseApi.CourseReview[]> {
    await this.delay(300);

    const mockReviews: CourseApi.CourseReview[] = [
      {
        comment: '课程内容非常实用，老师讲解清晰，受益匪浅！',
        courseId,
        createTime: '2024-01-20 10:30:00',
        id: 1,
        rating: 5,
        userId: 1,
        userName: '张三'
      },
      {
        comment: '整体不错，但希望能增加更多实际案例分析。',
        courseId,
        createTime: '2024-01-18 14:20:00',
        id: 2,
        rating: 4,
        userId: 2,
        userName: '李四'
      }
    ];

    return mockReviews;
  }
}

// 导出课程服务实例
export const courseService = new CourseService();

// 导出API函数
export const fetchGetCourseList = courseService.getCourseList.bind(courseService);
export const fetchGetCourseDetail = courseService.getCourseDetail.bind(courseService);
export const fetchCreateCourse = courseService.createCourse.bind(courseService);
export const fetchUpdateCourse = courseService.updateCourse.bind(courseService);
export const fetchDeleteCourse = courseService.deleteCourse.bind(courseService);
export const fetchGetCourseCategories = courseService.getCourseCategories.bind(courseService);
export const fetchGetCourseReviews = courseService.getCourseReviews.bind(courseService);
