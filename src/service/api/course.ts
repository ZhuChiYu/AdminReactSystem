import { apiClient, createMockPageResponse, createMockResponse } from './client';
import type { CourseApi, PageResponse } from './types';

/** 课程管理相关API服务 */
export class CourseService {
  /** 获取课程列表 */
  async getCourseList(params: CourseApi.CourseQueryParams): Promise<PageResponse<CourseApi.CourseListItem>['data']> {
    // 目前使用模拟数据，实际项目中替换为真实API调用
    // return apiClient.get('/courses', { params });

    // 模拟课程数据
    const mockCourses: CourseApi.CourseListItem[] = [
      {
        category: '财务管理',
        courseCode: 'SZHHCWGL001',
        courseName: '数智化财务管理',
        createTime: '2024-03-01 10:00:00',
        currentStudents: 35,
        description: '深入学习数字化时代的财务管理理念和实践方法',
        duration: 3,
        endDate: '2024-04-17',
        id: 1,
        instructor: '张教授',
        level: 'intermediate',
        location: '上海培训中心',
        maxStudents: 50,
        objectives: ['掌握数字化财务管理理念', '学会使用财务数字化工具', '提升财务分析能力'],
        originalPrice: 4500,
        outline: [
          { chapter: '第一章', duration: 4, title: '数字化财务概述' },
          { chapter: '第二章', duration: 6, title: '财务数据分析' },
          { chapter: '第三章', duration: 4, title: '财务决策支持' }
        ],
        price: 3800,
        rating: 4.8,
        reviewCount: 128,
        startDate: '2024-04-15',
        status: 'published',
        tags: ['财务', '数字化', '管理'],
        updateTime: '2024-03-20 15:30:00'
      },
      {
        category: '风险管理',
        courseCode: 'QYNKYFXGL002',
        courseName: '企业内控与风险管理',
        createTime: '2024-02-15 14:20:00',
        currentStudents: 28,
        description: '全面掌握企业内部控制体系建设和风险管理实务',
        duration: 2,
        endDate: '2024-04-21',
        id: 2,
        instructor: '李专家',
        level: 'advanced',
        location: '北京培训中心',
        maxStudents: 40,
        objectives: ['建立内控体系', '识别和评估风险', '制定风险应对策略'],
        originalPrice: 3200,
        outline: [
          { chapter: '第一章', duration: 4, title: '内控体系建设' },
          { chapter: '第二章', duration: 4, title: '风险识别与评估' }
        ],
        price: 2800,
        rating: 4.6,
        reviewCount: 89,
        startDate: '2024-04-20',
        status: 'published',
        tags: ['内控', '风险', '管理'],
        updateTime: '2024-03-18 09:45:00'
      },
      {
        category: '税务管理',
        courseCode: 'SWCHYHGGL003',
        courseName: '税务筹划与合规管理',
        createTime: '2024-02-20 11:15:00',
        currentStudents: 32,
        description: '掌握税务筹划技巧和合规管理要点',
        duration: 2,
        endDate: '2024-04-26',
        id: 3,
        instructor: '王老师',
        level: 'intermediate',
        location: '深圳培训中心',
        maxStudents: 45,
        objectives: ['掌握税务筹划方法', '了解税务合规要求', '降低税务风险'],
        originalPrice: 2800,
        outline: [
          { chapter: '第一章', duration: 3, title: '税务筹划基础' },
          { chapter: '第二章', duration: 5, title: '合规管理实务' }
        ],
        price: 2500,
        rating: 4.7,
        reviewCount: 156,
        startDate: '2024-04-25',
        status: 'published',
        tags: ['税务', '筹划', '合规'],
        updateTime: '2024-03-22 16:20:00'
      }
    ];

    // 根据查询参数过滤数据
    let filteredCourses = mockCourses;

    if (params.courseName) {
      filteredCourses = filteredCourses.filter(course => course.courseName.includes(params.courseName!));
    }

    if (params.category) {
      filteredCourses = filteredCourses.filter(course => course.category === params.category);
    }

    if (params.status) {
      filteredCourses = filteredCourses.filter(course => course.status === params.status);
    }

    if (params.level) {
      filteredCourses = filteredCourses.filter(course => course.level === params.level);
    }

    return createMockPageResponse(filteredCourses, params.current || 1, params.size || 10);
  }

  /** 获取课程详情 */
  async getCourseDetail(id: number): Promise<CourseApi.CourseListItem> {
    // return apiClient.get(`/courses/${id}`);

    const mockCourse: CourseApi.CourseListItem = {
      category: '财务管理',
      courseCode: 'SZHHCWGL001',
      courseName: '数智化财务管理',
      createTime: '2024-03-01 10:00:00',
      currentStudents: 35,
      description: '深入学习数字化时代的财务管理理念和实践方法',
      duration: 3,
      endDate: '2024-04-17',
      id,
      instructor: '张教授',
      level: 'intermediate',
      location: '上海培训中心',
      maxStudents: 50,
      objectives: ['掌握数字化财务管理理念', '学会使用财务数字化工具', '提升财务分析能力'],
      originalPrice: 4500,
      outline: [
        { chapter: '第一章', duration: 4, title: '数字化财务概述' },
        { chapter: '第二章', duration: 6, title: '财务数据分析' },
        { chapter: '第三章', duration: 4, title: '财务决策支持' }
      ],
      price: 3800,
      rating: 4.8,
      reviewCount: 128,
      startDate: '2024-04-15',
      status: 'published',
      tags: ['财务', '数字化', '管理'],
      updateTime: '2024-03-20 15:30:00'
    };

    return createMockResponse(mockCourse);
  }

  /** 创建课程 */
  async createCourse(params: CourseApi.CreateCourseRequest): Promise<{ id: number }> {
    // return apiClient.post('/courses', params);

    return createMockResponse({ id: Date.now() });
  }

  /** 更新课程 */
  async updateCourse(id: number, params: Partial<CourseApi.CreateCourseRequest>): Promise<void> {
    // return apiClient.put(`/courses/${id}`, params);

    return createMockResponse(undefined);
  }

  /** 删除课程 */
  async deleteCourse(id: number): Promise<void> {
    // return apiClient.delete(`/courses/${id}`);

    return createMockResponse(undefined);
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
    // return apiClient.get('/courses/categories');

    const mockCategories: CourseApi.CourseCategory[] = [
      { code: 'finance', description: '财务相关课程', id: 1, name: '财务管理' },
      { code: 'risk', description: '风险控制相关课程', id: 2, name: '风险管理' },
      { code: 'tax', description: '税务相关课程', id: 3, name: '税务管理' },
      { code: 'audit', description: '审计相关课程', id: 4, name: '审计管理' },
      { code: 'investment', description: '投资相关课程', id: 5, name: '投资管理' }
    ];

    return createMockResponse(mockCategories);
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
    // return apiClient.get(`/courses/${courseId}/reviews`);

    const mockReviews: CourseApi.CourseReview[] = [
      {
        comment: '课程内容很实用，老师讲解清晰',
        courseId,
        id: 1,
        rating: 5,
        reviewTime: '2024-03-15 14:30:00',
        studentName: '张三'
      },
      {
        comment: '整体不错，希望能增加更多案例',
        courseId,
        id: 2,
        rating: 4,
        reviewTime: '2024-03-16 09:20:00',
        studentName: '李四'
      }
    ];

    return createMockResponse(mockReviews);
  }
}

// 导出课程服务实例
export const courseService = new CourseService();
