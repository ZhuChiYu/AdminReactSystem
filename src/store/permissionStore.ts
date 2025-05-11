import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 权限类型
export enum PermissionType {
  // 编辑班级信息权限
  ASSIGN_CUSTOMER = 'assign_customer', // 查看客户姓名权限
  // 编辑客户信息权限
  EDIT_CLASS = 'edit_class', // 查看客户电话权限
  // 查看客户信息权限
  EDIT_CUSTOMER = 'edit_customer', // 查看客户手机权限
  VIEW_CUSTOMER = 'view_customer', // 查看客户信息权限
  // 查看客户电话权限
  VIEW_CUSTOMER_MOBILE = 'view_customer_mobile', // 编辑客户信息权限
  VIEW_CUSTOMER_NAME = 'view_customer_name', // 编辑班级信息权限
  // 查看客户姓名权限
  VIEW_CUSTOMER_PHONE = 'view_customer_phone' // 分配客户权限
}

// 用户权限接口
export interface UserPermission {
  // 权限关联的客户ID，如果未设置则表示对所有客户有权限
  classId?: number; // 权限类型
  customerId?: number; // 授权时间
  expiryTime?: string; // 权限关联的班级ID，如果未设置则表示对所有班级有权限
  grantedBy?: string; // 授权人ID
  grantedTime?: string; // 用户ID
  permissionType: PermissionType;
  userId: string; // 权限到期时间，如果未设置则表示永不过期
}

// 权限状态接口
interface PermissionState {
  // 添加权限
  addPermission: (permission: UserPermission) => void;

  // 批量添加权限
  addPermissions: (permissions: UserPermission[]) => void;

  // 获取用户的所有权限
  getUserPermissions: (userId: string) => UserPermission[];

  // 获取具有特定权限的用户ID列表
  getUsersWithPermission: (permissionType: PermissionType, customerId?: number, classId?: number) => string[];

  // 授予特定班级的权限
  grantClassPermission: (userId: string, classId: number, permissionTypes: PermissionType[], grantedBy: string) => void;

  // 授予特定客户的权限
  grantCustomerPermission: (
    userId: string,
    customerId: number,
    permissionTypes: PermissionType[],
    grantedBy: string
  ) => void;

  // 为用户授予全局权限
  grantGlobalPermission: (userId: string, permissionTypes: PermissionType[], grantedBy: string) => void;

  // 检查用户是否有指定权限
  hasPermission: (userId: string, permissionType: PermissionType, customerId?: number, classId?: number) => boolean;

  // 权限列表
  permissions: UserPermission[];

  // 移除权限
  removePermission: (userId: string, permissionType: PermissionType, customerId?: number, classId?: number) => void;

  // 重置权限
  resetPermissions: () => void;

  // 撤销特定班级的权限
  revokeClassPermission: (
    userId: string,
    classId: number,
    permissionTypes: PermissionType[],
    grantedBy: string
  ) => void;

  // 撤销特定客户的权限
  revokeCustomerPermission: (
    userId: string,
    customerId: number,
    permissionTypes: PermissionType[],
    grantedBy: string
  ) => void;

  // 撤销全局权限
  revokeGlobalPermission: (userId: string, permissionTypes: PermissionType[], grantedBy: string) => void;
}

// 创建权限状态管理器
const usePermissionStore = create<PermissionState>()(
  devtools(
    persist(
      (set, get) => ({
        // 添加权限
        addPermission: (permission: UserPermission) => {
          set(state => {
            // 检查是否已经存在相同的权限
            const exists = state.permissions.some(
              p =>
                p.userId === permission.userId &&
                p.permissionType === permission.permissionType &&
                p.customerId === permission.customerId &&
                p.classId === permission.classId
            );

            if (exists) return state;

            return {
              permissions: [
                ...state.permissions,
                {
                  ...permission,
                  grantedTime: permission.grantedTime || new Date().toISOString()
                }
              ]
            };
          });
        },

        // 批量添加权限
        addPermissions: (permissions: UserPermission[]) => {
          set(state => {
            const newPermissions = [...state.permissions];

            permissions.forEach(permission => {
              // 检查是否已经存在相同的权限
              const exists = newPermissions.some(
                p =>
                  p.userId === permission.userId &&
                  p.permissionType === permission.permissionType &&
                  p.customerId === permission.customerId &&
                  p.classId === permission.classId
              );

              if (!exists) {
                newPermissions.push({
                  ...permission,
                  grantedTime: permission.grantedTime || new Date().toISOString()
                });
              }
            });

            return {
              permissions: newPermissions
            };
          });
        },

        // 获取用户的所有权限
        getUserPermissions: (userId: string) => {
          return get().permissions.filter(p => p.userId === userId);
        },

        // 获取具有特定权限的用户ID列表
        getUsersWithPermission: (permissionType: PermissionType, customerId?: number, classId?: number) => {
          const permissions = get().permissions;

          // 定义匹配函数
          const matchPermission = (p: UserPermission) => {
            // 基本权限类型必须匹配
            if (p.permissionType !== permissionType) return false;

            // 如果指定了customerId，则匹配全局权限或指定客户权限
            if (customerId !== undefined) {
              return p.customerId === undefined || p.customerId === customerId;
            }

            // 如果指定了classId，则匹配全局权限或指定班级权限
            if (classId !== undefined) {
              return p.classId === undefined || p.classId === classId;
            }

            // 如果没有指定customerId和classId，则只匹配全局权限
            return p.customerId === undefined && p.classId === undefined;
          };

          // 过滤并提取userId，使用Set去重
          return [...new Set(permissions.filter(matchPermission).map(p => p.userId))];
        },

        // 授予特定班级的权限
        grantClassPermission: (
          userId: string,
          classId: number,
          permissionTypes: PermissionType[],
          grantedBy: string
        ) => {
          const permissions: UserPermission[] = permissionTypes.map(permissionType => ({
            classId,
            grantedBy,
            grantedTime: new Date().toISOString(),
            permissionType,
            userId
          }));

          get().addPermissions(permissions);
        },

        // 授予特定客户的权限
        grantCustomerPermission: (
          userId: string,
          customerId: number,
          permissionTypes: PermissionType[],
          grantedBy: string
        ) => {
          const permissions: UserPermission[] = permissionTypes.map(permissionType => ({
            customerId,
            grantedBy,
            grantedTime: new Date().toISOString(),
            permissionType,
            userId
          }));

          get().addPermissions(permissions);
        },

        // 为用户授予全局权限
        grantGlobalPermission: (userId: string, permissionTypes: PermissionType[], grantedBy: string) => {
          const permissions: UserPermission[] = permissionTypes.map(permissionType => ({
            grantedBy,
            grantedTime: new Date().toISOString(),
            permissionType,
            userId
          }));

          get().addPermissions(permissions);
        },

        // 检查用户是否有指定权限
        hasPermission: (userId: string, permissionType: PermissionType, customerId?: number, classId?: number) => {
          const permissions = get().permissions;

          // 检查是否有对应的全局权限（无customerId和classId限制）
          const hasGlobalPermission = permissions.some(
            p =>
              p.userId === userId &&
              p.permissionType === permissionType &&
              p.customerId === undefined &&
              p.classId === undefined
          );

          if (hasGlobalPermission) return true;

          // 对于客户权限的检查
          if (customerId !== undefined) {
            // 检查是否有特定客户的权限
            const hasCustomerPermission = permissions.some(
              p => p.userId === userId && p.permissionType === permissionType && p.customerId === customerId
            );
            if (hasCustomerPermission) return true;
          }

          // 对于班级权限的检查
          if (classId !== undefined) {
            // 检查是否有特定班级的权限
            const hasClassPermission = permissions.some(
              p => p.userId === userId && p.permissionType === permissionType && p.classId === classId
            );
            if (hasClassPermission) return true;
          }

          return false;
        },

        // 权限列表
        permissions: [],

        // 移除权限
        removePermission: (userId: string, permissionType: PermissionType, customerId?: number, classId?: number) => {
          set(state => ({
            permissions: state.permissions.filter(
              p =>
                !(
                  p.userId === userId &&
                  p.permissionType === permissionType &&
                  p.customerId === customerId &&
                  p.classId === classId
                )
            )
          }));
        },

        // 重置权限
        resetPermissions: () => {
          set({ permissions: [] });
        },

        // 撤销特定班级的权限
        revokeClassPermission: (
          userId: string,
          classId: number,
          permissionTypes: PermissionType[],
          grantedBy: string
        ) => {
          permissionTypes.forEach(permissionType => {
            get().removePermission(userId, permissionType, undefined, classId);
          });
        },

        // 撤销特定客户的权限
        revokeCustomerPermission: (
          userId: string,
          customerId: number,
          permissionTypes: PermissionType[],
          grantedBy: string
        ) => {
          permissionTypes.forEach(permissionType => {
            get().removePermission(userId, permissionType, customerId);
          });
        },

        // 撤销全局权限
        revokeGlobalPermission: (userId: string, permissionTypes: PermissionType[], grantedBy: string) => {
          permissionTypes.forEach(permissionType => {
            get().removePermission(userId, permissionType);
          });
        }
      }),
      {
        name: 'permission-storage'
      }
    )
  )
);

export default usePermissionStore;
