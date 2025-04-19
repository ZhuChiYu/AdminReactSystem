import common from './common';
import form from './form';
import page from './page';
import request from './request';
import route from './route';
import theme from './theme';

const local: App.I18n.Schema['translation'] = {
  code: {
    confirm: 'Are you sure you want to regenerate the code?',
    confirmHelp: 'Regenerating will overwrite the original code, please confirm whether to backup',
    tip: 'Automatically generate front-end code, suitable for projects with independent front-end development and design',
    title: 'Code Generator'
  },
  common,
  course: {
    attachments: 'Course Attachments',
    category: 'Course Categories',
    list: 'Course List',
    title: 'Course Management'
  },
  datatable: {
    itemCount: 'Total {total} items'
  },
  dropdown: {
    closeAll: 'Close All',
    closeCurrent: 'Close Current',
    closeLeft: 'Close Left',
    closeOther: 'Close Other',
    closeRight: 'Close Right'
  },
  form,
  icon: {
    collapse: 'Collapse Menu',
    expand: 'Expand Menu',
    fullscreen: 'Fullscreen',
    fullscreenExit: 'Exit Fullscreen',
    lang: 'Switch Language',
    pin: 'Pin',
    reload: 'Reload Page',
    themeConfig: 'Theme Configuration',
    themeSchema: 'Theme Schema',
    unpin: 'Unpin'
  },
  page,
  request,
  route,
  system: {
    errorReason: 'Cause Error',
    reload: 'Reload Page',
    title: 'SoybeanAdmin',
    updateCancel: 'Later',
    updateConfirm: 'Refresh immediately',
    updateContent: 'A new version of the system has been detected. Do you want to refresh the page immediately?',
    updateTitle: 'System Version Update Notification'
  },
  table: {
    expanded: 'Expanded',
    folded: 'Folded',
    page: 'Page',
    pageSize: 'Items per page',
    reset: 'Reset',
    search: 'Search',
    submit: 'Search',
    total: 'Total {total} items'
  },
  theme
};

export default local;
