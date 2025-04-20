import { BaseChildrenRoutes } from './builtin';
import { generatedRoutes } from './elegant/routes';
import { filterRoutes, getReactRoutes } from './routes';
/**
 * - 初始化路由
 * - 生成所有路由ex
 * - 生成权限路由
 * - 生成常量路由
 *
 * @returns {Object} 返回路由对象
 */
function initRoutes() {
  // 获取所有文件夹生成的路由并转换成 react-router 路由
  const customRoutes = getReactRoutes(generatedRoutes);

  // 获取基础路由
  const baseRoute = customRoutes[0]?.children?.find(route => route.id === '(base)');

  // 找到并过滤掉自动生成的班级管理路由以及不需要的菜单项
  if (baseRoute?.children) {
    // 要移除的菜单项ID列表
    const removeMenuIds = [
      'class-manage', // 避免班级管理重复
      'multi-menu', // 多级菜单
      'function', // 系统功能
      'projects' // 多级动态路由
    ];

    // 移除这些菜单项
    baseRoute.children = baseRoute.children.filter(route => {
      const id = route.id || '';
      const path = route.path || '';

      return !removeMenuIds.includes(id) && !removeMenuIds.some(removeId => path === `/${removeId}`);
    });
  }

  // 添加自定义复用路由至基础路由
  baseRoute?.children?.push(...BaseChildrenRoutes);

  const authRoutes: Router.SingleAuthRoute[] = [];

  const cacheRoutes: string[] = [];

  const allRoutes = { ...customRoutes };

  const constantRoutes = filterRoutes(customRoutes, null, authRoutes, cacheRoutes);

  return { allRoutes, authRoutes, cacheRoutes, routes: constantRoutes };
}

export const { allRoutes, authRoutes, cacheRoutes: initCacheRoutes, routes } = initRoutes();
