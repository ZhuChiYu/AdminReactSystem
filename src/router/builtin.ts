import type { RouteObject } from 'react-router-dom';

function convert(m: any) {
  const { default: Component } = m;

  return {
    Component
  };
}

/**
 * 基础子路由
 *
 * - 班级管理和课程管理相关路由配置
 */
export const BaseChildrenRoutes = [
  {
    children: [
      {
        handle: {
          i18nKey: 'route.(base)_class-manage_list',
          icon: 'mdi:format-list-bulleted',
          order: 1,
          title: 'class_list'
        },
        id: 'class_list',
        lazy: () => import('@/pages/(base)/class-manage/list').then(convert),
        path: '/class-manage/list'
      },
      {
        handle: {
          hideInMenu: true,
          i18nKey: 'route.(base)_class-manage_detail',
          icon: 'mdi:card-account-details-outline',
          title: 'class_detail'
        },
        id: 'class_detail',
        lazy: () => import('@/pages/(base)/class-manage/detail').then(convert),
        path: '/class-manage/detail/:classId'
      }
    ],
    handle: {
      i18nKey: 'route.(base)_class-manage',
      icon: 'mdi:account-group',
      order: 3,
      title: 'class_manage'
    },
    id: 'class_manage',
    path: '/class-manage'
  },
  {
    children: [
      {
        handle: {
          i18nKey: 'route.(base)_course-manage_list',
          icon: 'mdi:book-open-variant',
          order: 1,
          title: 'course_list'
        },
        id: 'course_list',
        lazy: () => import('@/pages/(base)/course-manage/list').then(convert),
        path: '/course-manage/list'
      }
    ],
    handle: {
      i18nKey: 'route.(base)_course-manage',
      icon: 'mdi:book-open-variant',
      order: 2,
      title: 'course_manage'
    },
    id: 'course_manage',
    path: '/course-manage'
  }
] satisfies RouteObject[];
