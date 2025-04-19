/** The global namespace for the app */
declare namespace App {
  /** Theme namespace */
  namespace Theme {
    type ColorPaletteNumber = import('@sa/color').ColorPaletteNumber;

    /** Theme setting */
    interface ThemeSetting {
      /** colour weakness mode */
      colourWeakness: boolean;
      /** Fixed header and tab */
      fixedHeaderAndTab: boolean;
      /** Footer */
      footer: {
        /** Whether fixed the footer */
        fixed: boolean;
        /** Footer height */
        height: number;
        /** Whether float the footer to the right when the layout is 'horizontal-mix' */
        right: boolean;
        /** Whether to show the footer */
        visible: boolean;
      };
      /** grayscale mode */
      grayscale: boolean;
      /** Header */
      header: {
        /** Header breadcrumb */
        breadcrumb: {
          /** Whether to show the breadcrumb icon */
          showIcon: boolean;
          /** Whether to show the breadcrumb */
          visible: boolean;
        };
        /** Header height */
        height: number;
      };
      /** Whether info color is followed by the primary color */
      isInfoFollowPrimary: boolean;
      /** Whether only expand the current parent menu when the layout is 'vertical-mix' or 'horizontal-mix' */
      isOnlyExpandCurrentParentMenu: boolean;
      /** Layout */
      layout: {
        /** Layout mode */
        mode: UnionKey.ThemeLayoutMode;
        /**
         * Whether to reverse the horizontal mix
         *
         * if true, the vertical child level menus in left and horizontal first level menus in top
         */
        reverseHorizontalMix: boolean;
        /** Scroll mode */
        scrollMode: UnionKey.ThemeScrollMode;
      };
      /** Other color */
      otherColor: OtherColor;
      /** Page */
      page: {
        /** Whether to show the page transition */
        animate: boolean;
        /** Page animate mode */
        animateMode: UnionKey.ThemePageAnimateMode;
      };
      /** Whether to recommend color */
      recommendColor: boolean;
      /** Sider */
      sider: {
        /** Collapsed sider width */
        collapsedWidth: number;
        /** Inverted sider */
        inverted: boolean;
        /** Child menu width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixChildMenuWidth: number;
        /** Collapsed sider width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixCollapsedWidth: number;
        /** Sider width when the layout is 'vertical-mix' or 'horizontal-mix' */
        mixWidth: number;
        /** Sider width */
        width: number;
      };
      /** Tab */
      tab: {
        /**
         * Whether to cache the tab
         *
         * If cache, the tabs will get from the local storage when the page is refreshed
         */
        cache: boolean;
        /** Tab height */
        height: number;
        /** Tab mode */
        mode: UnionKey.ThemeTabMode;
        /** Whether to show the tab */
        visible: boolean;
      };
      /** Theme color */
      themeColor: string;
      /** define some theme settings tokens, will transform to css variables */
      tokens: {
        dark?: {
          [K in keyof ThemeSettingToken]?: Partial<ThemeSettingToken[K]>;
        };
        light: ThemeSettingToken;
      };
      /** Watermark */
      watermark: {
        /** Watermark text */
        text: string;
        /** Whether to show the watermark */
        visible: boolean;
      };
    }

    interface OtherColor {
      error: string;
      info: string;
      success: string;
      warning: string;
    }

    interface ThemeColor extends OtherColor {
      primary: string;
    }

    type ThemeColorKey = keyof ThemeColor;

    type ThemePaletteColor = {
      [key in ThemeColorKey | `${ThemeColorKey}-${ColorPaletteNumber}`]: string;
    };

    type BaseToken = Record<string, Record<string, string>>;

    interface ThemeSettingTokenColor {
      'base-text': string;
      container: string;
      inverted: string;
      layout: string;
      /** the progress bar color, if not set, will use the primary color */
      nprogress?: string;
    }

    interface ThemeSettingTokenBoxShadow {
      header: string;
      sider: string;
      tab: string;
    }

    interface ThemeSettingToken {
      boxShadow: ThemeSettingTokenBoxShadow;
      colors: ThemeSettingTokenColor;
    }

    type ThemeTokenColor = ThemePaletteColor & ThemeSettingTokenColor;

    /** Theme token CSS variables */
    type ThemeTokenCSSVars = {
      boxShadow: ThemeSettingTokenBoxShadow & { [key: string]: string };
      colors: ThemeTokenColor & { [key: string]: string };
    };
  }

  /** Global namespace */
  namespace Global {
    type RouteKey = import('@soybean-react/vite-plugin-react-router').RouteKey;
    type RouteMap = import('@soybean-react/vite-plugin-react-router').RouteMap;
    type RoutePath = import('@soybean-react/vite-plugin-react-router').RoutePath;
    type LastLevelRouteKey = import('@soybean-react/vite-plugin-react-router').LastLevelRouteKey;

    /** The global header props */
    interface HeaderProps {
      /** Whether to show the logo */
      showLogo?: boolean;
      /** Whether to show the menu */
      showMenu?: boolean;
      /** Whether to show the menu toggler */
      showMenuToggler?: boolean;
    }

    interface IconProps {
      className?: string;
      /** Iconify icon name */
      icon?: string;
      /** Local svg icon name */
      localIcon?: string;
      style?: React.CSSProperties;
    }

    /** The global menu */
    interface Menu {
      /** The menu children */
      children?: Menu[];
      /** The menu i18n key */
      i18nKey?: I18n.I18nKey | null;
      /** The menu icon */
      icon?: React.ReactElement;
      /**
       * The menu key
       *
       * Equal to the route key
       */
      key: string;
      /** The menu label */
      label: React.ReactNode;
      /** The tooltip title */
      title?: string;
    }

    type Breadcrumb = Omit<Menu, 'children'> & {
      options?: Breadcrumb[];
    };

    /** Tab route */
    type TabRoute = Router.Route;

    /** The global tab */
    type Tab = {
      /** The tab fixed index */
      fixedIndex?: number | null;
      /** The tab route full path */
      fullPath: string;
      /** I18n key */
      i18nKey?: I18n.I18nKey | null | string;
      /**
       * Tab icon
       *
       * Iconify icon
       */
      icon?: string;
      /** The tab id */
      id: string;
      /** The tab label */
      label: string;
      /**
       * Tab local icon
       *
       * Local icon
       */
      localIcon?: string;
      /**
       * The new tab label
       *
       * If set, the tab label will be replaced by this value
       */
      newLabel?: string;
      /**
       * The old tab label
       *
       * when reset the tab label, the tab label will be replaced by this value
       */
      oldLabel?: string | null;
      /** The tab route key */
      routeKey: LastLevelRouteKey;
      /** The tab route path */
      routePath: RouteMap[LastLevelRouteKey];
    };

    /** Form rule */
    type FormRule = import('antd').FormRule;

    /** The global dropdown key */
    type DropdownKey = 'closeAll' | 'closeCurrent' | 'closeLeft' | 'closeOther' | 'closeRight';
  }

  /**
   * I18n namespace
   *
   * Locales type
   */
  namespace I18n {
    type RouteKey = import('@soybean-react/vite-plugin-react-router').RouteKey;

    type LangType = 'en-US' | 'zh-CN';

    type LangOption = {
      key: LangType;
      label: string;
    };

    type I18nRouteKey = Exclude<RouteKey, 'not-found' | 'root'>;

    type FormMsg = {
      invalid: string;
      required: string;
    };

    type Schema = {
      translation: {
        class: {
          detail: string;
          list: string;
          title: string;
        };
        code: {
          confirm: string;
          confirmHelp: string;
          tip: string;
          title: string;
        };
        common: {
          action: string;
          add: string;
          addSuccess: string;
          backToHome: string;
          batchDelete: string;
          cancel: string;
          check: string;
          close: string;
          columnSetting: string;
          config: string;
          confirm: string;
          confirmDelete: string;
          delete: string;
          deleteSuccess: string;
          edit: string;
          error: string;
          errorHint: string;
          expandColumn: string;
          index: string;
          keywordSearch: string;
          logout: string;
          logoutConfirm: string;
          lookForward: string;
          modify: string;
          modifySuccess: string;
          noData: string;
          operate: string;
          pleaseCheckValue: string;
          refresh: string;
          reset: string;
          search: string;
          switch: string;
          tip: string;
          trigger: string;
          tryAlign: string;
          update: string;
          updateSuccess: string;
          userCenter: string;
          warning: string;
          yesOrNo: {
            no: string;
            yes: string;
          };
        };
        course: {
          attachments: string;
          category: string;
          class: string;
          classDetail: string;
          list: string;
          title: string;
        };
        datatable: {
          itemCount: string;
        };
        dropdown: Record<Global.DropdownKey, string>;
        form: {
          code: FormMsg;
          confirmPwd: FormMsg;
          email: FormMsg;
          phone: FormMsg;
          pwd: FormMsg;
          required: string;
          userName: FormMsg;
        };
        icon: {
          collapse: string;
          expand: string;
          fullscreen: string;
          fullscreenExit: string;
          lang: string;
          pin: string;
          reload: string;
          themeConfig: string;
          themeSchema: string;
          unpin: string;
        };
        page: {
          about: {
            devDep: string;
            introduction: string;
            prdDep: string;
            projectInfo: {
              githubLink: string;
              latestBuildTime: string;
              previewLink: string;
              title: string;
              version: string;
            };
            title: string;
          };
          function: {
            multiTab: {
              backTab: string;
              routeParam: string;
            };
            request: {
              repeatedError: string;
              repeatedErrorMsg1: string;
              repeatedErrorMsg2: string;
              repeatedErrorOccurOnce: string;
            };
            tab: {
              tabOperate: {
                addMultiTab: string;
                addMultiTabDesc1: string;
                addMultiTabDesc2: string;
                addTab: string;
                addTabDesc: string;
                closeAboutTab: string;
                closeCurrentTab: string;
                closeTab: string;
                title: string;
              };
              tabTitle: {
                change: string;
                changeTitle: string;
                reset: string;
                resetTitle: string;
                title: string;
              };
            };
            toggleAuth: {
              adminOrUserVisible: string;
              adminVisible: string;
              authHook: string;
              superAdminVisible: string;
              toggleAccount: string;
            };
          };
          home: {
            creativity: string;
            dealCount: string;
            downloadCount: string;
            entertainment: string;
            greeting: string;
            message: string;
            projectCount: string;
            projectNews: {
              desc1: string;
              desc2: string;
              desc3: string;
              desc4: string;
              desc5: string;
              moreNews: string;
              title: string;
            };
            registerCount: string;
            rest: string;
            schedule: string;
            study: string;
            todo: string;
            turnover: string;
            visitCount: string;
            weatherDesc: string;
            work: string;
          };
          login: {
            bindWeChat: {
              title: string;
            };
            codeLogin: {
              getCode: string;
              imageCodePlaceholder: string;
              reGetCode: string;
              sendCodeSuccess: string;
              title: string;
            };
            common: {
              back: string;
              codeLogin: string;
              codePlaceholder: string;
              confirm: string;
              confirmPasswordPlaceholder: string;
              loginOrRegister: string;
              loginSuccess: string;
              passwordPlaceholder: string;
              phonePlaceholder: string;
              userNamePlaceholder: string;
              validateSuccess: string;
              welcomeBack: string;
            };
            pwdLogin: {
              admin: string;
              forgetPassword: string;
              otherAccountLogin: string;
              otherLoginMode: string;
              register: string;
              rememberMe: string;
              superAdmin: string;
              title: string;
              user: string;
            };
            register: {
              agreement: string;
              policy: string;
              protocol: string;
              title: string;
            };
            resetPwd: {
              title: string;
            };
          };
          manage: {
            common: {
              status: {
                disable: string;
                enable: string;
              };
            };
            menu: {
              activeMenu: string;
              addChildMenu: string;
              addMenu: string;
              button: string;
              buttonCode: string;
              buttonDesc: string;
              constant: string;
              editMenu: string;
              fixedIndexInTab: string;
              form: {
                activeMenu: string;
                button: string;
                buttonCode: string;
                buttonDesc: string;
                fixedIndexInTab: string;
                fixedInTab: string;
                hideInMenu: string;
                home: string;
                href: string;
                i18nKey: string;
                icon: string;
                keepAlive: string;
                layout: string;
                localIcon: string;
                menuName: string;
                menuStatus: string;
                menuType: string;
                multiTab: string;
                order: string;
                page: string;
                parent: string;
                pathParam: string;
                queryKey: string;
                queryValue: string;
                routeName: string;
                routePath: string;
              };
              hideInMenu: string;
              home: string;
              href: string;
              i18nKey: string;
              icon: string;
              iconType: {
                iconify: string;
                local: string;
              };
              iconTypeTitle: string;
              id: string;
              keepAlive: string;
              layout: string;
              localIcon: string;
              menuName: string;
              menuStatus: string;
              menuType: string;
              multiTab: string;
              order: string;
              page: string;
              parent: string;
              parentId: string;
              pathParam: string;
              query: string;
              routeName: string;
              routePath: string;
              title: string;
              type: {
                directory: string;
                menu: string;
              };
            };
            role: {
              addRole: string;
              buttonAuth: string;
              editRole: string;
              form: {
                roleCode: string;
                roleDesc: string;
                roleName: string;
                roleStatus: string;
              };
              menuAuth: string;
              roleCode: string;
              roleDesc: string;
              roleName: string;
              roleStatus: string;
              title: string;
            };
            roleDetail: {
              content: string;
              explain: string;
            };
            user: {
              addUser: string;
              editUser: string;
              form: {
                nickName: string;
                userEmail: string;
                userGender: string;
                userName: string;
                userPhone: string;
                userRole: string;
                userStatus: string;
              };
              gender: {
                female: string;
                male: string;
              };
              nickName: string;
              title: string;
              userEmail: string;
              userGender: string;
              userName: string;
              userPhone: string;
              userRole: string;
              userStatus: string;
            };
            userDetail: {
              content: string;
              explain: string;
            };
          };
        };
        request: {
          apiErrorMsg: string;
          error: string;
          errorInfo: string;
          logout: string;
          logoutMsg: string;
          logoutWithModal: string;
          logoutWithModalMsg: string;
          refreshToken: string;
          resendApiText: string;
          tokenExpired: string;
        };
        route: Record<I18nRouteKey, string> & {
          notFound: string;
          root: string;
          'route.(base)_about': string;
          'route.(base)_class-manage': string;
          'route.(base)_class-manage_detail': string;
          'route.(base)_class-manage_list': string;
          'route.(base)_course-manage': string;
          'route.(base)_course-manage_attachments': string;
          'route.(base)_course-manage_attachments_detail': string;
          'route.(base)_course-manage_category': string;
          'route.(base)_course-manage_class': string;
          'route.(base)_course-manage_class_detail': string;
          'route.(base)_course-manage_list': string;
          'route.(base)_home': string;
          'route.about': string;
          'route.class_detail': string;
          'route.class_list': string;
          'route.class_manage': string;
          'route.course_attachments': string;
          'route.course_attachments_detail': string;
          'route.course_category': string;
          'route.course_list': string;
          'route.course_manage': string;
          'route.document': string;
          'route.document_antd': string;
          'route.document_procomponents': string;
          'route.document_project': string;
          'route.document_project-link': string;
          'route.document_react': string;
          'route.document_unocss': string;
          'route.document_vite': string;
          'route.exception': string;
          'route.exception_403': string;
          'route.exception_404': string;
          'route.exception_500': string;
          'route.function': string;
          'route.function_form': string;
          'route.function_form_button': string;
          'route.function_form_cascade-select': string;
          'route.function_form_custom-select': string;
          'route.function_form_date-range-select': string;
          'route.function_form_date-select': string;
          'route.function_form_draggable-modal': string;
          'route.function_form_file-upload': string;
          'route.function_form_image-upload': string;
          'route.function_form_input': string;
          'route.function_form_keyboard': string;
          'route.function_form_modal': string;
          'route.function_form_radio': string;
          'route.function_form_richtext': string;
          'route.function_form_select': string;
          'route.function_form_table-select': string;
          'route.function_form_transfer': string;
          'route.function_form_tree-select': string;
          'route.function_form_validate': string;
          'route.function_hide-child': string;
          'route.function_hide-child_child1': string;
          'route.function_hide-child_child2': string;
          'route.function_hide-child_child3': string;
          'route.function_request': string;
          'route.function_tab': string;
          'route.function_tab_child1': string;
          'route.function_tab_child2': string;
          'route.function_toggle-auth': string;
          'route.home': string;
          'route.manage': string;
          'route.manage_auth': string;
          'route.manage_role': string;
          'route.manage_route': string;
          'route.manage_user': string;
          'route.multi-menu': string;
          'route.multi-menu_first': string;
          'route.multi-menu_first_child': string;
          'route.multi-menu_second': string;
          'route.multi-menu_second_child': string;
          'route.multi-menu_second_child_home': string;
          'route.projects': string;
          'route.projects_details': string;
          'route.projects_join': string;
          'route.projects_list': string;
          'route.user-center': string;
        };
        system: {
          errorReason: string;
          reload: string;
          title: string;
          updateCancel: string;
          updateConfirm: string;
          updateContent: string;
          updateTitle: string;
        };
        table: {
          expanded: string;
          folded: string;
          page: string;
          pageSize: string;
          reset: string;
          search: string;
          submit: string;
          total: string;
        };
        theme: {
          colourWeakness: string;
          configOperation: {
            copyConfig: string;
            copySuccessMsg: string;
            resetConfig: string;
            resetSuccessMsg: string;
          };
          fixedHeaderAndTab: string;
          footer: {
            fixed: string;
            height: string;
            right: string;
            visible: string;
          };
          grayscale: string;
          header: {
            breadcrumb: {
              showIcon: string;
              visible: string;
            };
            height: string;
          };
          isOnlyExpandCurrentParentMenu: string;
          layoutMode: { reverseHorizontalMix: string; title: string } & Record<UnionKey.ThemeLayoutMode, string>;
          page: {
            animate: string;
            mode: { title: string } & Record<UnionKey.ThemePageAnimateMode, string>;
          };
          pageFunTitle: string;
          recommendColor: string;
          recommendColorDesc: string;
          scrollMode: { title: string } & Record<UnionKey.ThemeScrollMode, string>;
          sider: {
            collapsedWidth: string;
            inverted: string;
            mixChildMenuWidth: string;
            mixCollapsedWidth: string;
            mixWidth: string;
            width: string;
          };
          tab: {
            cache: string;
            height: string;
            mode: { title: string } & Record<UnionKey.ThemeTabMode, string>;
            visible: string;
          };
          themeColor: {
            followPrimary: string;
            title: string;
          } & Theme.ThemeColor;
          themeDrawerTitle: string;
          themeSchema: { title: string };
          watermark: {
            text: string;
            visible: string;
          };
        };
      };
    };

    type GetI18nKey<T extends Record<string, unknown>, K extends keyof T = keyof T> = K extends string
      ? T[K] extends Record<string, unknown>
        ? `${K}.${GetI18nKey<T[K]>}`
        : K
      : never;

    type I18nKey = GetI18nKey<Schema['translation']>;

    type TranslateOptions<Locales extends string> = import('react-i18next').TranslationProps<Locales>;

    interface $T {
      (key: I18nKey): string;
      (key: I18nKey, plural: number, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, defaultMsg: string, options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], options?: TranslateOptions<I18nKey>): string;
      (key: I18nKey, list: unknown[], plural: number): string;
      (key: I18nKey, list: unknown[], defaultMsg: string): string;
      (key: I18nKey, named: Record<string, unknown>, options?: TranslateOptions<LangType>): string;
      (key: I18nKey, named: Record<string, unknown>, plural: number): string;
      (key: I18nKey, named: Record<string, unknown>, defaultMsg: string): string;
    }
  }

  /** Service namespace */
  namespace Service {
    /** Other baseURL key */
    type OtherBaseURLKey = 'demo';

    interface ServiceConfigItem {
      /** The backend service base url */
      baseURL: string;
      /** The proxy pattern of the backend service base url */
      proxyPattern: string;
    }

    interface OtherServiceConfigItem extends ServiceConfigItem {
      key: OtherBaseURLKey;
    }

    /** The backend service config */
    interface ServiceConfig extends ServiceConfigItem {
      /** Other backend service config */
      other: OtherServiceConfigItem[];
    }

    interface SimpleServiceConfig extends Pick<ServiceConfigItem, 'baseURL'> {
      other: Record<OtherBaseURLKey, string>;
    }

    /** The backend service response data */
    type Response<T = unknown> = {
      /** The backend service response code */
      code: string;
      /** The backend service response data */
      data: T;
      /** The backend service response message */
      msg: string;
    };

    /** The demo backend service response data */
    type DemoResponse<T = unknown> = {
      /** The backend service response message */
      message: string;
      /** The backend service response data */
      result: T;
      /** The backend service response code */
      status: string;
    };
  }
}
