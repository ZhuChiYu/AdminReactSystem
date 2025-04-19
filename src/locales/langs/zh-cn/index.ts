import common from './common';
import form from './form';
import page from './page';
import route from './route';
import theme from './theme';

const local: App.I18n.Schema['translation'] = {
  code: {
    confirm: '确认要重新生成代码吗？',
    confirmHelp: '重新生成将覆盖原有代码，请确认是否备份',
    tip: '自动生成前端代码，适用于使用前端独立开发和设计的项目',
    title: '代码生成器'
  },
  common,
  course: {
    attachments: '课程附件',
    category: '课程分类',
    list: '课程列表',
    title: '课程管理'
  },
  datatable: {
    itemCount: '共 {{total}} 条'
  },
  dropdown: {
    closeAll: '关闭所有',
    closeCurrent: '关闭',
    closeLeft: '关闭左侧',
    closeOther: '关闭其它',
    closeRight: '关闭右侧'
  },
  form,
  icon: {
    collapse: '折叠菜单',
    expand: '展开菜单',
    fullscreen: '全屏',
    fullscreenExit: '退出全屏',
    lang: '切换语言',
    pin: '固定',
    reload: '刷新页面',
    themeConfig: '主题配置',
    themeSchema: '主题模式',
    unpin: '取消固定'
  },
  page,
  request: {
    apiErrorMsg: '接口错误信息',
    error: '请求出错',
    errorInfo: '请求出现错误，可能是用户会话信息过期或权限不足，请查看具体错误信息',
    logout: '请求失败后登出用户',
    logoutMsg: '用户状态失效，请重新登录',
    logoutWithModal: '请求失败后弹出模态框再登出用户',
    logoutWithModalMsg: '用户状态失效，请重新登录',
    refreshToken: '请求的token已过期，刷新token',
    resendApiText: '重新发送请求',
    tokenExpired: 'token已过期'
  },
  route,
  system: {
    errorReason: '错误原因',
    reload: '重新渲染页面',
    title: '一品华信 管理系统',
    updateCancel: '稍后再说',
    updateConfirm: '立即刷新',
    updateContent: '检测到系统有新版本发布，是否立即刷新页面？',
    updateTitle: '系统版本更新通知'
  },
  table: {
    expanded: '已展开',
    folded: '已折叠',
    page: '页',
    pageSize: '每页显示',
    reset: '重置',
    search: '搜索',
    submit: '搜索',
    total: '共 {total} 条'
  },
  theme
};

export default local;
