import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button as AButton,
  Card as ACard,
  Collapse as ACollapse,
  Popconfirm as APopconfirm,
  Table as ATable,
  Tag as ATag,
  Upload as AUpload,
  Select,
  message
} from 'antd';
import dayjs from 'dayjs';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { enableStatusRecord, userGenderRecord } from '@/constants/business';
import { ATG_MAP } from '@/constants/common';
import { TableHeaderOperation, useTable, useTableOperate, useTableScroll } from '@/features/table';
import { useMobile } from '@/hooks/common/mobile';
import { apiClient, employeeService, fetchGetRoleList } from '@/service/api';
import { isSuperAdmin } from '@/utils/auth';

import UserSearch from './modules/UserSearch';

const UserOperateDrawer = lazy(() => import('./modules/UserOperateDrawer'));

interface Role {
  code: string;
  id: number;
  name: string;
  type: 'permission' | 'position';
}

interface UserRecord {
  address?: string;
  bankCard?: string;
  contractEndDate?: string;
  contractStartDate?: string;
  contractYears?: number;
  createBy: string;
  createTime: string;
  email?: string;
  id: number;
  idCard?: string;
  index: number;
  nickName?: string;
  password: string;
  phone?: string;
  roleCode?: string;
  roles: Role[];
  status: Api.Common.EnableStatus | null;
  tim?: string;
  updateBy: string;
  updateTime: string;
  userEmail?: string;
  userGender?: Api.SystemManage.UserGender;
  userName: string;
  userPhone?: string;
  wechat?: string;
}

type FetchEmployeeListParams = {
  current: number;
  department?: string | null;
  nickName?: string | null;
  size: number;
  status?: Api.Common.EnableStatus | null;
  userName?: string | null;
};

type FetchEmployeeListFn = AntDesign.TableApiFn<UserRecord, FetchEmployeeListParams>;

const tagUserGenderMap: Record<Api.SystemManage.UserGender, string> = {
  1: 'processing',
  2: 'error'
};

// 权限角色选项 - 移除超级管理员选项
const permissionRoleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '员工', value: 'employee' }
];

// Helper functions - moved to the top level
function getGenderValue(userGender: Api.SystemManage.UserGender | undefined) {
  if (userGender === '1') return 'male';
  if (userGender === '2') return 'female';
  return undefined;
}

function getStatusValue(status: Api.Common.EnableStatus | null) {
  if (status === '1') return 'active';
  if (status === '2') return 'inactive';
  return undefined;
}

// 角色中文名称映射
const roleNames = {
  admin: '管理员',
  consultant: '顾问',
  employee: '员工',
  general_manager: '总经理',
  hr_bp: '人力BP',
  hr_specialist: '人力专员',
  marketing_manager: '市场部经理',
  sales_director: '销售总监',
  sales_manager: '销售经理',
  super_admin: '超级管理员'
};

const UserManage = () => {
  const { t } = useTranslation();
  const [passwordVisible, setPasswordVisible] = useState<Record<number, boolean>>({});
  const [importLoading, setImportLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingPermissionRole, setEditingPermissionRole] = useState<{ currentRole: string; id: number } | null>(null);

  const { tableWrapperRef } = useTableScroll();
  const isMobile = useMobile();

  const nav = useNavigate();

  const { columnChecks, data, run, searchProps, setColumnChecks, tableProps } = useTable<FetchEmployeeListFn>(
    {
      apiFn: fetchEmployeeListAdapter as FetchEmployeeListFn,
      apiParams: {
        current: 1,
        department: null,
        nickName: null,
        size: 10,
        status: null,
        userName: null
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
          dataIndex: 'userName',
          key: 'userName',
          minWidth: 100,
          title: t('page.manage.user.userName')
        },
        {
          align: 'center',
          dataIndex: 'password',
          key: 'password',
          minWidth: 150,
          render: (_, record: any) => {
            const password = record.password || '123456';
            return (
              <div className="flex-center gap-4px">
                <span>{passwordVisible[record.id] ? password : '******'}</span>
                <AButton
                  size="small"
                  type="link"
                  onClick={e => {
                    e.stopPropagation();
                    togglePasswordVisibility(record.id);
                  }}
                >
                  {passwordVisible[record.id] ? t('common.hide') : t('common.show')}
                </AButton>
              </div>
            );
          },
          title: t('page.manage.user.password')
        },
        {
          align: 'center',
          dataIndex: 'nickName',
          key: 'nickName',
          minWidth: 100,
          title: '姓名'
        },
        {
          align: 'center',
          dataIndex: 'roles',
          key: 'positionRole',
          render: (roles: Array<{ code: string; name: string; type: string }>) => {
            const positionRole = roles.find(role => role.type === 'position');
            return positionRole ? (
              <ATag color="blue">{roleNames[positionRole.code as keyof typeof roleNames] || positionRole.code}</ATag>
            ) : (
              <ATag color="default">未分配职位</ATag>
            );
          },
          title: '职位角色',
          width: 120
        },
        {
          align: 'center',
          dataIndex: 'roles',
          key: 'permissionRole',
          render: (roles: Array<{ code: string; name: string; type: string }>, record: any) => {
            const permissionRole = roles.find(role => role.type === 'permission');
            const currentRole = permissionRole?.code || 'employee';

            if (editingPermissionRole?.id === record.id) {
              return (
                <Select
                  autoFocus
                  defaultValue={currentRole}
                  options={permissionRoleOptions}
                  style={{ width: 120 }}
                  onBlur={() => setEditingPermissionRole(null)}
                  onChange={value => handlePermissionRoleChange(record.id, value)}
                  onClick={e => e.stopPropagation()}
                />
              );
            }

            let roleColor = 'blue';
            let roleName = '员工';

            if (currentRole === 'super_admin') {
              roleColor = 'gold';
              roleName = '超级管理员';
            } else if (currentRole === 'admin') {
              roleColor = 'green';
              roleName = '管理员';
            }

            return (
              <ATag
                color={roleColor}
                style={{ cursor: isSuperAdmin() && currentRole !== 'super_admin' ? 'pointer' : 'default' }}
                onClick={e => {
                  e.stopPropagation();
                  // 超级管理员角色不能被编辑，且只有超级管理员能编辑其他角色
                  if (isSuperAdmin() && currentRole !== 'super_admin') {
                    setEditingPermissionRole({ currentRole, id: record.id });
                  }
                }}
              >
                {roleName}
              </ATag>
            );
          },
          title: '权限角色',
          width: 120
        },
        {
          align: 'center',
          dataIndex: 'userGender',
          key: 'userGender',
          render: (_, record: any) => {
            if (record?.userGender === null) {
              return null;
            }

            const label = t(userGenderRecord[record.userGender as keyof typeof userGenderRecord]);

            return <ATag color={tagUserGenderMap[record.userGender as keyof typeof tagUserGenderMap]}>{label}</ATag>;
          },
          title: t('page.manage.user.userGender'),
          width: 100
        },
        {
          align: 'center',
          dataIndex: 'userPhone',
          key: 'userPhone',
          title: t('page.manage.user.userPhone'),
          width: 120
        },
        {
          align: 'center',
          dataIndex: 'userEmail',
          key: 'userEmail',
          minWidth: 200,
          title: t('page.manage.user.userEmail')
        },
        {
          align: 'center',
          dataIndex: 'address',
          key: 'address',
          minWidth: 200,
          title: '家庭住址'
        } as any,
        {
          align: 'center',
          dataIndex: 'bankCard',
          key: 'bankCard',
          minWidth: 180,
          title: '银行卡号'
        } as any,
        {
          align: 'center',
          dataIndex: 'wechat',
          key: 'wechat',
          minWidth: 150,
          title: '工作微信号'
        } as any,
        {
          align: 'center',
          dataIndex: 'tim',
          key: 'tim',
          minWidth: 150,
          title: 'TIM号'
        } as any,
        {
          align: 'center',
          dataIndex: 'contractYears',
          key: 'contractYears',
          render: (_: any, record: any) => {
            return record.contractYears ? `${record.contractYears}年` : '-';
          },
          title: '合同年限',
          width: 100
        } as any,
        {
          align: 'center',
          dataIndex: 'contractStartDate',
          key: 'contractStartDate',
          render: (_: any, record: any) => {
            if (!record.contractStartDate) return '-';
            return new Date(record.contractStartDate).toLocaleDateString('zh-CN');
          },
          title: '合同开始时间',
          width: 120
        } as any,
        {
          align: 'center',
          dataIndex: 'contractEndDate',
          key: 'contractEndDate',
          render: (_: any, record: any) => {
            if (!record.contractEndDate) return '-';
            return new Date(record.contractEndDate).toLocaleDateString('zh-CN');
          },
          title: '合同结束时间',
          width: 120
        } as any,
        {
          align: 'center',
          dataIndex: 'status',
          key: 'status',
          render: (_, record: any) => {
            if (record.status === null) {
              return null;
            }
            const label = t(enableStatusRecord[record.status as keyof typeof enableStatusRecord]);
            return <ATag color={ATG_MAP[record.status as keyof typeof ATG_MAP]}>{label}</ATag>;
          },
          title: t('page.manage.user.userStatus'),
          width: 100
        },
        {
          align: 'center',
          fixed: 'right' as const,
          key: 'operate',
          render: (_, record: any) => {
            const isUserSuperAdmin = record.roles?.some((role: any) => role.code === 'super_admin');

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
                  onClick={() => nav(`/manage/user/${record.id}`)}
                >
                  详情
                </AButton>
                <APopconfirm
                  title={isUserSuperAdmin ? '超级管理员不能删除' : t('common.confirmDelete')}
                  onConfirm={() => !isUserSuperAdmin && handleDelete(record.id)}
                >
                  <AButton
                    danger
                    disabled={isUserSuperAdmin}
                    size="small"
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
    },
    { showQuickJumper: true }
  );

  const { checkedRowKeys, generalPopupOperation, handleAdd, handleEdit, onBatchDeleted, onDeleted, rowSelection } =
    useTableOperate(data, run, async (res: any, type) => {
      if (type === 'add') {
                try {
          // 获取所有角色数据，将角色代码转换为角色ID
          const roleCodes = [res.positionRole, res.permissionRole || 'employee'].filter(Boolean);
          const roleIds: number[] = [];

          // 获取所有角色数据
          try {
            const [positionRolesResponse, permissionRolesResponse] = await Promise.all([
              fetchGetRoleList({ current: 1, size: 100, roleType: 'position' }),
              fetchGetRoleList({ current: 1, size: 100, roleType: 'permission' })
            ]);

            const allRoles = [
              ...(positionRolesResponse?.records || []),
              ...(permissionRolesResponse?.records || [])
            ];

            // 根据角色代码查找角色ID
            for (const roleCode of roleCodes) {
              const role = allRoles.find((r: any) => r.roleCode === roleCode);
              if (role) {
                roleIds.push(role.id);
              } else {
                console.warn(`未找到角色: ${roleCode}`);
              }
            }
          } catch (error) {
            console.error('获取角色数据失败:', error);
            window.$message?.error('获取角色数据失败，请重试');
            return;
          }

          // 转换前端表单数据为后端API格式
          const createData = {
            address: res.address,
            bankCard: res.bankCard,
            contractEndDate: res.contractEndDate?.format?.('YYYY-MM-DD') || res.contractEndDate,
            contractStartDate: res.contractStartDate?.format?.('YYYY-MM-DD') || res.contractStartDate,
            contractYears: res.contractYears,
            email: res.email || res.userEmail,
            gender: getGenderValue(res.userGender),
            idCard: res.idCard,
            nickName: res.nickName,
            password: res.password,
            phone: res.userPhone,
            roleIds: roleIds, // 使用角色ID而不是角色代码
            status: getStatusValue(res.status),
            tim: res.tim,
            userName: res.userName,
            wechat: res.wechat
          };

          console.log('创建用户数据:', createData);
          console.log('角色映射:', { roleCodes, roleIds });

          await apiClient.post('/system/users', createData);

          window.$message?.success('创建成功');
          run(); // 刷新表格数据
        } catch (error: any) {
          console.error('创建用户失败:', error);
          window.$message?.error('创建失败');
          throw error;
        }
      } else {
        // edit request 调用编辑的接口
        try {
          console.log('编辑数据调试:', res);
          console.log('编辑用户ID:', editingUserId);

          if (!editingUserId) {
            window.$message?.error('用户ID缺失，无法更新');
            console.error('编辑失败：用户ID缺失', { editingUserId, res });
            return;
          }

          // 转换前端表单数据为后端API格式
          const updateData = {
            address: res.address,
            bankCard: res.bankCard,
            contractEndDate: res.contractEndDate?.format?.('YYYY-MM-DD') || res.contractEndDate,
            contractStartDate: res.contractStartDate?.format?.('YYYY-MM-DD') || res.contractStartDate,
            contractYears: res.contractYears,
            email: res.email || res.userEmail,
            gender: getGenderValue(res.userGender),
            idCard: res.idCard,
            nickName: res.nickName,
            phone: res.userPhone,
            // 合并职位角色和权限角色，确保两个角色都存在
            roles: [res.positionRole, res.permissionRole].filter(Boolean),
            status: getStatusValue(res.status),
            tim: res.tim,
            userName: res.userName,
            wechat: res.wechat
          };

          console.log('更新用户数据:', { id: editingUserId, updateData });
          await employeeService.updateEmployee(editingUserId, updateData);

          window.$message?.success('更新成功');
          run(); // 刷新表格数据
        } catch (error: any) {
          console.error('更新用户失败:', error);
          window.$message?.error('更新失败');
          throw error;
        }
      }
    });

  async function handleBatchDelete() {
    try {
      if (checkedRowKeys.length === 0) {
        window.$message?.warning('请选择要删除的员工');
        return;
      }

      const result = await employeeService.batchDeleteEmployees(checkedRowKeys as number[]);

      if (result.skippedSuperAdmins && result.skippedSuperAdmins.length > 0) {
        window.$message?.warning(
          `删除完成！共删除 ${result.deletedCount} 个员工，跳过 ${result.skippedSuperAdmins.length} 个超级管理员`
        );
      } else {
        window.$message?.success(`批量删除成功！共删除 ${result.deletedCount} 个员工`);
      }

      onBatchDeleted();
      run(); // 刷新表格数据
    } catch (error) {
      console.error('批量删除失败:', error);
      window.$message?.error('批量删除失败');
    }
  }

  async function handleDelete(id: number) {
    try {
      await employeeService.deleteEmployee(id);
      window.$message?.success('删除成功');
      onDeleted();
      run(); // 刷新表格数据
    } catch (error: any) {
      console.error('删除失败:', error);
      if (error?.response?.status === 403) {
        window.$message?.error('不允许删除超级管理员');
      } else {
        window.$message?.error('删除失败');
      }
    }
  }

  function edit(id: number) {
    // 自定义数据处理：将角色数据分离为职位角色和权限角色
    const findItem = data.find(item => item.id === id);
    if (findItem) {
      const positionRole = findItem.roles?.find(role => role.type === 'position')?.code;
      const permissionRole = findItem.roles?.find(role => role.type === 'permission')?.code || 'employee';

      const formData = {
        ...findItem,
        contractEndDate: findItem.contractEndDate ? dayjs(findItem.contractEndDate) : undefined,
        contractStartDate: findItem.contractStartDate ? dayjs(findItem.contractStartDate) : undefined,
        id: findItem.id,
        permissionRole,
        positionRole
      };
      setEditingUserId(id);
      handleEdit(formData);
    }
  }

  const runRef = useRef(run);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  // 处理权限角色修改
  const handlePermissionRoleChange = async (userId: number, newRole: string) => {
    try {
      await employeeService.updateEmployeePermissionRole(userId, newRole);
      message.success('权限角色更新成功');
      // Refresh the list
      if (runRef.current) {
        await runRef.current();
      }
    } catch (error) {
      console.error('更新权限角色失败:', error);
      message.error('权限角色更新失败');
    }
    setEditingPermissionRole(null);
  };

  const togglePasswordVisibility = (id: number) => {
    setPasswordVisible(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 下载导入模板
  const handleDownloadTemplate = async () => {
    try {
      const blob = await employeeService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'employee_import_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      window.$message?.success('模板下载成功');
    } catch (error) {
      console.error('下载模板失败:', error);
      window.$message?.error('下载模板失败');
    }
  };

  // 处理文件导入
  const handleImport = async (file: File) => {
    setImportLoading(true);
    try {
      const result = await employeeService.importEmployees(file);

      // 显示导入结果
      const { errorList, failed, success, total } = result;

      if (failed === 0) {
        window.$message?.success(`导入成功！共导入 ${success} 条记录`);
      } else {
        const errorMsg = errorList
          .slice(0, 3)
          .map(item => `第${item.row}行: ${item.error}`)
          .join('\n');

        window.$message?.warning(
          `导入完成！成功 ${success} 条，失败 ${failed} 条。${failed > 0 ? `\n失败原因:\n${errorMsg}` : ''}`
        );
      }

      // 刷新表格数据
      run();
    } catch (error) {
      console.error('导入失败:', error);
      window.$message?.error('导入失败，请检查文件格式');
    } finally {
      setImportLoading(false);
    }
  };

  // 创建适配器函数来匹配表格组件的API格式
  async function fetchEmployeeListAdapter(params: FetchEmployeeListParams) {
    try {
      const response = await employeeService.getEmployeeList({
        current: params.current || 1,
        department: params.department || undefined,
        nickName: params.nickName || undefined,
        size: params.size || 10,
        status: params.status || undefined,
        userName: params.userName || undefined
      });

      return {
        data: {
          current: response.current,
          records: response.records.map((record, index): UserRecord => {
            let userGender: Api.SystemManage.UserGender | undefined;
            if (record.gender === 'male') {
              userGender = 1 as unknown as Api.SystemManage.UserGender;
            } else if (record.gender === 'female') {
              userGender = 2 as unknown as Api.SystemManage.UserGender;
            }

            let status: Api.Common.EnableStatus | null = null;
            if (record.status === 'active') {
              status = '1';
            } else if (record.status === 'inactive') {
              status = '2';
            }

            const roles = record.roles.map(
              role =>
                ({
                  // 由于后端API没有返回id，我们设置一个默认值
                  code: role.code,
                  id: 0,
                  name: role.name,
                  type:
                    role.code === 'super_admin' || role.code === 'admin' || role.code === 'employee'
                      ? 'permission'
                      : 'position'
                }) as Role
            );

            return {
              address: record.address,
              bankCard: record.bankCard,
              contractEndDate: record.contractEndDate,
              contractStartDate: record.contractStartDate,
              contractYears: record.contractYears,
              createBy: 'system',
              createTime: record.createdAt,
              email: record.email,
              id: record.id,
              idCard: record.idCard,
              index: (response.current - 1) * response.size + index + 1,
              nickName: record.nickName,
              password: record.password || '123456',
              phone: record.phone,
              roleCode: record.roles?.[0]?.code,
              roles,
              status,
              tim: record.tim,
              updateBy: 'system',
              updateTime: record.updatedAt,
              userEmail: record.email,
              userGender,
              userName: record.userName,
              userPhone: record.phone,
              wechat: record.wechat
            };
          }),
          size: response.size,
          total: response.total
        }
      };
    } catch (error) {
      console.error('获取员工列表失败:', error);
      return {
        data: {
          current: 1,
          records: [],
          size: 10,
          total: 0
        }
      };
    }
  }

  return (
    <div className="h-full min-h-600px flex-col-stretch gap-16px overflow-auto p-16px">
      <ACollapse
        className="card-wrapper"
        defaultActiveKey={isMobile ? undefined : '1'}
        ghost={true}
        items={[
          {
            children: <UserSearch {...searchProps} />,
            key: '1',
            label: t('common.search')
          }
        ]}
      />

      <ACard
        className="flex-col-stretch flex-1 card-wrapper"
        ref={tableWrapperRef}
        title="员工管理"
        variant="borderless"
        extra={
          <div className="flex gap-8px">
            <AButton
              icon={<DownloadOutlined />}
              type="default"
              onClick={handleDownloadTemplate}
            >
              下载模板
            </AButton>
            <AUpload
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={file => {
                handleImport(file);
                return false; // 阻止自动上传
              }}
            >
              <AButton
                icon={<UploadOutlined />}
                loading={importLoading}
                type="primary"
              >
                导入员工
              </AButton>
            </AUpload>
            <TableHeaderOperation
              add={handleAdd}
              columns={columnChecks}
              disabledDelete={checkedRowKeys.length === 0}
              loading={tableProps.loading}
              refresh={run}
              setColumnChecks={setColumnChecks}
              onDelete={handleBatchDelete}
            />
          </div>
        }
        styles={{
          body: { display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }
        }}
      >
        <div style={{ flex: 1, overflow: 'auto' }}>
          <ATable
            scroll={{ x: 'max-content' }}
            size="small"
            rowClassName={(record: any) => {
              return record.roles?.some((role: any) => role.code === 'super_admin') ? 'super-admin-row' : '';
            }}
            rowSelection={{
              ...rowSelection,
              getCheckboxProps: (record: any) => ({
                disabled: record.roles?.some((role: any) => role.code === 'super_admin'),
                name: record.userName
              })
            }}
            {...tableProps}
            pagination={{
              ...tableProps.pagination,
              showQuickJumper: true,
              showSizeChanger: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
            }}
          />
        </div>
        <Suspense>
          <UserOperateDrawer {...generalPopupOperation} />
        </Suspense>
      </ACard>
    </div>
  );
};

export default UserManage;
