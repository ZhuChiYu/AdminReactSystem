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
 * - 关于为什么复用路由需要直接写成react-router的标准格式
 * - 因为每个路由都有自己的loader,action,shouldRevalidate,都是函数
 * - 在后续的通过菜单管理去动态生成路由的时候，函数的编写问题，安全性，性能，可维护性都是问题
 * - 所以需要直接写成react-router的标准格式
 * - 建议复用路由都通过前端自己手动配置去生成(在实际的开发中，复用路由的情况还是很少的)
 * - 所以开发量其实不会很大，其他的约定式都是自动生成并配置的
 */
export const BaseChildrenRoutes = [
  {
    handle: {
      i18nKey: 'route.(base)_home',
      icon: 'mdi:home',
      order: 1,
      title: '首页'
    },
    id: 'home',
    lazy: () => import('@/pages/(base)/home').then(convert),
    path: '/home'
  },
  {
    children: [
      {
        handle: {
          i18nKey: 'route.(base)_course-manage_list',
          icon: 'mdi:format-list-bulleted',
          order: 1,
          title: 'course_list'
        },
        id: 'course_list',
        lazy: () => import('@/pages/(base)/course-manage/list').then(convert),
        path: '/course-manage/list'
      },
      {
        handle: {
          i18nKey: 'route.(base)_course-manage_category',
          icon: 'mdi:folder-multiple-outline',
          order: 2,
          title: 'course_category'
        },
        id: 'course_category',
        lazy: () => import('@/pages/(base)/course-manage/category').then(convert),
        path: '/course-manage/category'
      },
      {
        handle: {
          hideInMenu: true,
          i18nKey: 'route.(base)_course-manage_detail',
          icon: 'mdi:card-account-details-outline',
          title: 'course_detail'
        },
        id: 'course_detail',
        lazy: () => import('@/pages/(base)/course-manage/detail').then(convert),
        path: '/course-manage/detail/:courseId'
      },
      {
        handle: {
          hideInMenu: true,
          i18nKey: 'route.(base)_course-manage_attachments-detail',
          icon: 'mdi:paperclip',
          title: 'course_attachments_detail'
        },
        id: 'course_attachments_detail',
        lazy: () => import('@/pages/(base)/course-manage/attachments').then(convert),
        path: '/course-manage/attachments/:courseId'
      },
      {
        handle: {
          hideInMenu: true,
          i18nKey: 'route.(base)_course-manage_attachments',
          icon: 'mdi:paperclip',
          title: 'course_attachments'
        },
        id: 'course_attachments',
        lazy: () => import('@/pages/(base)/course-manage/attachments').then(convert),
        path: '/course-manage/attachments'
      }
    ],
    handle: {
      i18nKey: 'route.(base)_course-manage',
      icon: 'mdi:book-education-outline',
      order: 2,
      title: 'course_manage'
    },
    id: 'course_manage',
    path: '/course-manage'
  },
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
          i18nKey: 'route.(base)_class-manage_category',
          icon: 'mdi:folder-multiple-outline',
          order: 2,
          title: 'class_category'
        },
        id: 'class_category',
        lazy: () => import('@/pages/(base)/class-manage/category').then(convert),
        path: '/class-manage/category'
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
          i18nKey: 'route.(base)_customer-manage_follow',
          icon: 'ic:round-transfer-within-a-station',
          order: 1,
          title: '客户跟进'
        },
        id: 'customer_follow',
        lazy: () => import('@/pages/(base)/customer-manage/follow').then(convert),
        path: '/customer-manage/follow'
      },
      {
        handle: {
          i18nKey: 'route.(base)_customer-manage_import',
          icon: 'ic:round-file-upload',
          order: 2,
          title: '客户导入'
        },
        id: 'customer_import',
        lazy: () => import('@/pages/(base)/customer-manage/import').then(convert),
        path: '/customer-manage/import'
      },
      {
        handle: {
          i18nKey: 'route.(base)_customer-manage_info',
          icon: 'ic:round-contacts',
          order: 3,
          title: '客户资料'
        },
        id: 'customer_info',
        lazy: () => import('@/pages/(base)/customer-manage/info').then(convert),
        path: '/customer-manage/info'
      }
    ],
    handle: {
      i18nKey: 'route.(base)_customer-manage',
      icon: 'mdi:account-supervisor',
      order: 4,
      title: '客户管理'
    },
    id: 'customer_manage',
    path: '/customer-manage'
  },
  {
    handle: {
      i18nKey: 'route.(base)_finance-dashboard',
      icon: 'mdi:finance',
      order: 5,
      title: '财务看板'
    },
    id: 'finance_dashboard',
    lazy: () => import('@/pages/(base)/finance-dashboard').then(convert),
    path: '/finance-dashboard'
  },
  {
    children: [
      {
        handle: {
          i18nKey: 'route.(base)_expense-process_apply',
          icon: 'mdi:file-document-plus-outline',
          order: 1,
          title: '报销申请'
        },
        id: 'expense_apply',
        lazy: () => import('@/pages/(base)/expense-process/apply').then(convert),
        path: '/expense-process/apply'
      },
      {
        handle: {
          auth: 'super_admin',
          i18nKey: 'route.(base)_expense-process_approve',
          icon: 'mdi:file-check-outline',
          order: 2,
          roles: ['super_admin'],
          title: '报销审核'
        },
        id: 'expense_approve',
        lazy: () => import('@/pages/(base)/expense-process/approve').then(convert),
        path: '/expense-process/approve'
      },
      {
        handle: {
          i18nKey: 'route.(base)_expense-process_history',
          icon: 'mdi:file-clock-outline',
          order: 3,
          title: '申请历史'
        },
        id: 'expense_history',
        lazy: () => import('@/pages/(base)/expense-process/history').then(convert),
        path: '/expense-process/history'
      }
    ],
    handle: {
      i18nKey: 'route.(base)_expense-process',
      icon: 'mdi:file-document-edit-outline',
      order: 7,
      title: '报销流程'
    },
    id: 'expense_process',
    path: '/expense-process'
  },
  {
    children: [
      {
        handle: {
          i18nKey: 'route.(base)_meeting-manage_list',
          icon: 'mdi:calendar-text-outline',
          order: 1,
          title: '会议列表'
        },
        id: 'meeting_list',
        lazy: () => import('@/pages/(base)/meeting-manage/list').then(convert),
        path: '/meeting-manage/list'
      },
      {
        handle: {
          i18nKey: 'route.(base)_meeting-manage_record',
          icon: 'mdi:note-text-outline',
          order: 2,
          title: '会议记录'
        },
        id: 'meeting_record',
        lazy: () => import('@/pages/(base)/meeting-manage/record').then(convert),
        path: '/meeting-manage/record'
      },
      {
        handle: {
          i18nKey: 'route.(base)_meeting-manage_summary',
          icon: 'mdi:file-document-outline',
          order: 3,
          title: '会议总结'
        },
        id: 'meeting_summary',
        lazy: () => import('@/pages/(base)/meeting-manage/summary').then(convert),
        path: '/meeting-manage/summary'
      },
      {
        handle: {
          auth: 'super_admin',
          i18nKey: 'route.(base)_meeting-manage_approve',
          icon: 'mdi:check-decagram-outline',
          order: 4,
          title: '会议审核'
        },
        id: 'meeting_approve',
        lazy: () => import('@/pages/(base)/meeting-manage/approve').then(convert),
        path: '/meeting-manage/approve'
      }
    ],
    handle: {
      i18nKey: 'route.(base)_meeting-manage',
      icon: 'mdi:account-group-outline',
      order: 8,
      title: '会议管理'
    },
    id: 'meeting_manage',
    path: '/meeting-manage'
  }
] satisfies RouteObject[];
