import { Suspense } from 'react';

import { enableStatusRecord } from '@/constants/business';
import { ATG_MAP } from '@/constants/common';
import { TableHeaderOperation, useTable, useTableOperate, useTableScroll } from '@/features/table';
import { fetchGetRoleList } from '@/service/api';

import RoleSearch from './modules/role-search';

const RoleOperateDrawer = lazy(() => import('./modules/role-operate-drawer'));

const Role = () => {
  const { t } = useTranslation();

  const isMobile = useMobile();

  const nav = useNavigate();

  const { scrollConfig, tableWrapperRef } = useTableScroll();

  // 创建适配器函数来包装角色列表API
  const fetchRoleListAdapter = async (params?: Api.SystemManage.RoleSearchParams) => {
    try {
      // 默认只获取职务角色
      const response = await fetchGetRoleList({
        ...params,
        roleType: 'position'
      });
      console.log('角色列表适配器收到数据:', response);

      // 如果response已经是解包后的格式，需要重新包装为{data: response}格式
      if (response && typeof response === 'object' && 'records' in response) {
        return {
          data: response
        };
      }

      // 如果response已经是{data: {...}}格式，直接返回
      return response;
    } catch (error) {
      console.error('角色列表适配器错误:', error);
      return {
        data: {
          current: params?.current || 1,
          pages: 0,
          records: [],
          size: params?.size || 10,
          total: 0
        }
      };
    }
  };

  const { columnChecks, data, run, searchProps, setColumnChecks, tableProps } = useTable({
    apiFn: fetchRoleListAdapter,
    apiParams: {
      current: 1,
      roleCode: undefined,
      roleName: undefined,
      size: 10,
      status: undefined
    },
    columns: () => [
      {
        align: 'center',
        dataIndex: 'index',
        key: 'index',
        title: t('common.index'),
        width: 64
      },
      {
        align: 'center',
        dataIndex: 'roleName',
        key: 'roleName',
        minWidth: 120,
        title: t('page.manage.role.roleName')
      },
      {
        align: 'center',
        dataIndex: 'roleCode',
        key: 'roleCode',
        minWidth: 120,
        title: t('page.manage.role.roleCode')
      },
      {
        align: 'center',
        dataIndex: 'remark', // 使用API返回的实际字段名
        key: 'roleDesc',
        minWidth: 120,
        title: t('page.manage.role.roleDesc')
      },
      {
        align: 'center',
        dataIndex: 'status',
        key: 'status',
        render: (_, record: any) => {
          if (record.status === null) {
            return null;
          }
          const label = t(enableStatusRecord[record.status]);
          return <ATag color={ATG_MAP[record.status]}>{label}</ATag>;
        },
        title: t('page.manage.role.roleStatus'),
        width: 100
      },
      {
        align: 'center',
        fixed: 'right' as const,
        key: 'operate',
        render: (_, record: any) => {
          const isSuperAdmin = record.roleCode === 'super_admin';

          return (
            <div className="flex-center gap-8px">
              <AButton
                ghost
                size="small"
                type="primary"
                onClick={() => edit(record.id)}
              >
                {t('common.edit')}
              </AButton>
              <AButton
                size="small"
                onClick={() => nav(`/manage/role/${record.id}/${record.roleName}/${record.status}`)}
              >
                详情
              </AButton>
              <APopconfirm
                title={isSuperAdmin ? '超级管理员角色不允许删除' : t('common.confirmDelete')}
                onConfirm={isSuperAdmin ? undefined : () => handleDelete(record.id)}
              >
                <AButton
                  danger
                  disabled={isSuperAdmin}
                  size="small"
                  title={isSuperAdmin ? '超级管理员角色不允许删除' : ''}
                >
                  {t('common.delete')}
                </AButton>
              </APopconfirm>
            </div>
          );
        },
        title: t('common.operate'),
        width: 195
      }
    ]
  } as any);

  const {
    checkedRowKeys,
    editingData,
    generalPopupOperation,
    handleAdd,
    handleEdit,
    onBatchDeleted,
    onDeleted,
    rowSelection
  } = useTableOperate(data as any[], run, async (res, type) => {
    if (type === 'add') {
      // add request 调用新增的接口
      console.log(res);
    } else {
      // edit request 调用编辑的接口
      console.log(res);
    }
  });

  async function handleBatchDelete() {
    // 检查是否包含超级管理员角色
    const selectedRoles = (data as any[]).filter(item => checkedRowKeys.includes(item.id));
    const hasSuperAdmin = selectedRoles.some(role => role.roleCode === 'super_admin');

    if (hasSuperAdmin) {
      window.$message?.error('选中的角色中包含超级管理员，无法删除');
      return;
    }

    // request
    console.log(checkedRowKeys);
    onBatchDeleted();
  }

  async function handleDelete(id: number) {
    // 找到要删除的角色
    const roleToDelete = (data as any[]).find(item => item.id === id);
    if (roleToDelete?.roleType === 'permission') {
      window.$message?.error('权限角色不允许删除');
      return;
    }

    // request
    console.log(id);
    onDeleted();
  }

  function edit(id: number) {
    handleEdit(id);
  }

  return (
    <div className="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
      <ACollapse
        className="card-wrapper"
        defaultActiveKey={isMobile ? undefined : '1'}
        items={[
          {
            children: <RoleSearch {...searchProps} />,
            key: '1',
            label: t('common.search')
          }
        ]}
      />

      <ACard
        className="flex-col-stretch sm:flex-1-hidden card-wrapper"
        ref={tableWrapperRef}
        title="职务角色列表"
        extra={
          <TableHeaderOperation
            add={handleAdd}
            columns={columnChecks}
            disabledDelete={checkedRowKeys.length === 0}
            loading={tableProps.loading}
            refresh={run}
            setColumnChecks={setColumnChecks}
            onDelete={handleBatchDelete}
          />
        }
      >
        <ATable
          rowSelection={rowSelection}
          scroll={scrollConfig}
          size="small"
          {...tableProps}
        />

        <Suspense>
          <RoleOperateDrawer
            {...generalPopupOperation}
            rowId={editingData?.id || -1}
          />
        </Suspense>
      </ACard>
    </div>
  );
};

export default Role;
