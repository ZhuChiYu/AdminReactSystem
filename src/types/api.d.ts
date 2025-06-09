/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  namespace Common {
    /** common params of paginating */
    interface PaginatingCommonParams {
      /** current page number */
      current: number;
      /** page size */
      size: number;
      /** total count */
      total: number;
    }

    /** common params of paginating query list data */
    interface PaginatingQueryRecord<T = any> extends PaginatingCommonParams {
      records: T[];
    }

    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    /**
     * enable status
     *
     * - "1": enabled
     * - "2": disabled
     */
    type EnableStatus = '1' | '2';

    /** common record */
    type CommonRecord<T = any> = {
      /** record creator */
      createBy: string;
      /** record create time */
      createTime: string;
      /** record id */
      id: number;
      /** record status */
      status: EnableStatus | null;
      /** record updater */
      updateBy: string;
      /** record update time */
      updateTime: string;
    } & T;
  }

  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    interface LoginToken {
      refreshToken: string;
      token: string;
    }

    interface UserInfo {
      avatar?: string;
      buttons: string[];
      department?: string;
      email?: string;
      gender?: number;
      nickName?: string;
      phone?: string;
      position?: string;
      roles: string[];
      userId: string;
      userName: string;
    }

    type Info = {
      token: LoginToken['token'];
      userInfo: UserInfo;
    };
  }

  /**
   * namespace Route
   *
   * backend api module: "route"
   */
  namespace Route {
    type ElegantConstRoute = import('@soybean-react/vite-plugin-react-router').ElegantConstRoute;

    interface MenuRoute extends ElegantConstRoute {
      id: string;
    }

    interface UserRoute {
      home: import('@soybean-react/vite-plugin-react-router').LastLevelRouteKey;
      routes: string[];
    }
  }

  /**
   * namespace SystemManage
   *
   * backend api module: "systemManage"
   */
  namespace SystemManage {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    /** common params of paginating */
    type CommonSearchRequest = CommonType.RecordNullable<{
      endTime: string;
      keywords: string;
      startTime: string;
    }>;

    /** role */
    type Role = Common.CommonRecord<{
      /** department */
      department?: string;
      /** role code */
      roleCode: string;
      /** role description */
      roleDesc: string;
      /** role home */
      roleHome: string;
      /** role name */
      roleName: string;
      /** role type */
      roleType: 'permission' | 'position';
    }>;

    /** role search params */
    type RoleSearchParams = CommonType.RecordNullable<
      Pick<Role, 'roleCode' | 'roleName' | 'status'> & {
        roleType?: 'permission' | 'position';
      } & CommonSearchParams
    >;

    /** role list */
    type RoleList = Common.PaginatingQueryRecord<Role>;

    /** all role */
    type AllRole = Pick<Role, 'roleCode' | 'roleName'>;

    /** all role list */
    type AllRoleList = Common.CommonRecord<AllRole>;

    /**
     * user gender
     *
     * - "1": "male"
     * - "2": "female"
     */
    type UserGender = '1' | '2';

    /** user */
    type User = Common.CommonRecord<{
      /** user address */
      address?: string;
      /** user bank card */
      bankCard?: string;
      /** user ID card */
      idCard?: string;
      /** 管理的员工ID列表 */
      managedEmployees?: number[];
      /** 上级管理员ID */
      managerId?: number;
      /** user nick name */
      nickName: string;
      /** user password */
      password?: string;
      /** user TIM */
      tim?: string;
      /** user email */
      userEmail: string;
      /** user gender */
      userGender: UserGender | null;
      /** user name */
      userName: string;
      /** user phone */
      userPhone: string;
      /** user role code collection */
      userRoles: string[];
      /** user work WeChat */
      wechat?: string;
    }>;

    /** user search params */
    type UserSearchParams = CommonType.RecordNullable<
      Pick<Api.SystemManage.User, 'nickName' | 'status' | 'userEmail' | 'userGender' | 'userName' | 'userPhone'> &
        CommonSearchParams & {
          /** 管理员ID过滤 */
          managerId?: number;
          /** 角色过滤 */
          role?: string;
        }
    >;

    /** user list */
    type UserList = Common.PaginatingQueryRecord<User>;

    /** 员工-管理员关系 */
    type EmployeeManagerRelation = Common.CommonRecord<{
      /** 分配人ID */
      assignedBy: number;
      /** 分配人姓名 */
      assignedByName: string;
      /** 分配时间 */
      assignedTime: string;
      /** 员工ID */
      employeeId: number;
      /** 员工姓名 */
      employeeName: string;
      /** 管理员ID */
      managerId: number;
      /** 管理员姓名 */
      managerName: string;
    }>;

    /** 客户分配记录 */
    type CustomerAssignment = Common.CommonRecord<{
      /** 分配人ID（管理员） */
      assignedById: number;
      /** 分配人姓名 */
      assignedByName: string;
      /** 分配时间 */
      assignedTime: string;
      /** 分配给的员工ID */
      assignedToId: number;
      /** 分配给的员工姓名 */
      assignedToName: string;
      /** 客户ID */
      customerId: number;
      /** 客户姓名 */
      customerName: string;
      /** 分配备注 */
      remark?: string;
    }>;

    /**
     * menu type
     *
     * - "1": directory
     * - "2": menu
     */
    type MenuType = '1' | '2';

    type MenuButton = {
      /**
       * button code
       *
       * it can be used to control the button permission
       */
      code: string;
      /** button description */
      desc: string;
    };

    /**
     * icon type
     *
     * - "1": iconify icon
     * - "2": local icon
     */
    type IconType = '1' | '2';

    type MenuPropsOfRoute = Pick<
      import('@soybean-react/vite-plugin-react-router').RouteMeta,
      | 'activeMenu'
      | 'constant'
      | 'fixedIndexInTab'
      | 'hideInMenu'
      | 'href'
      | 'i18nKey'
      | 'keepAlive'
      | 'multiTab'
      | 'order'
      | 'query'
    >;

    type Menu = Common.CommonRecord<{
      /** buttons */
      buttons?: MenuButton[] | null;
      /** children menu */
      children?: Menu[] | null;
      /** component */
      component?: string;
      /** iconify icon name or local icon name */
      icon: string;
      /** icon type */
      iconType: IconType;
      /** menu name */
      menuName: string;
      /** menu type */
      menuType: MenuType;
      /** parent menu id */
      parentId: number;
      /** route name */
      routeName: string;
      /** route path */
      routePath: string;
    }> &
      MenuPropsOfRoute;

    /** menu list */
    type MenuList = Common.PaginatingQueryRecord<Menu>;

    type MenuTree = {
      children?: MenuTree[];
      id: number;
      label: string;
      pId: number;
    };
  }
}
