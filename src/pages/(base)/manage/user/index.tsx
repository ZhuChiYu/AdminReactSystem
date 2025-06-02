import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Suspense, lazy, useState } from 'react';

import { enableStatusRecord, userGenderRecord } from '@/constants/business';
import { ATG_MAP } from '@/constants/common';
import { TableHeaderOperation, useTable, useTableOperate, useTableScroll } from '@/features/table';
import { type EmployeeApi, employeeService } from '@/service/api';

import UserSearch from './modules/UserSearch';

const UserOperateDrawer = lazy(() => import('./modules/UserOperateDrawer'));

const tagUserGenderMap: Record<Api.SystemManage.UserGender, string> = {
  1: 'processing',
  2: 'error'
};

const UserManage = () => {
  const { t } = useTranslation();
  const [passwordVisible, setPasswordVisible] = useState<Record<number, boolean>>({});
  const [importLoading, setImportLoading] = useState(false);

  const { scrollConfig, tableWrapperRef } = useTableScroll();

  const nav = useNavigate();

  const isMobile = useMobile();

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
  const fetchEmployeeListAdapter = async (params: any) => {
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
          records: response.records.map((record, index) => ({
            ...record,
            // 默认密码显示
            // 添加TableData必需的字段
            createBy: 'system',
            createTime: record.createdAt,
            index: (response.current - 1) * response.size + index + 1,
            password: '123456',
            status: (record.status === 'active'
              ? '1'
              : record.status === 'inactive'
                ? '2'
                : null) as Api.Common.EnableStatus | null,
            updateBy: 'system',
            updateTime: record.updatedAt,
            userEmail: record.email,
            userGender: record.gender === 'male' ? 1 : record.gender === 'female' ? 2 : null,
            userPhone: record.phone
          })),
          size: response.size,
          total: response.total
        },
        error: null,
        response: {} as any
      };
    } catch (error) {
      return {
        data: null,
        error: error as any,
        response: {} as any
      };
    }
  };

  const { columnChecks, data, run, searchProps, setColumnChecks, tableProps } = useTable(
    {
      apiFn: fetchEmployeeListAdapter,
      apiParams: {
        current: 1,
        department: null,
        nickName: null,
        size: 10,
        status: null,
        userName: null
      } as any,
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
          render: (_, record: any) => (
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
                title={t('common.confirmDelete')}
                onConfirm={() => handleDelete(record.id)}
              >
                <AButton
                  danger
                  size="small"
                >
                  {t('common.delete')}
                </AButton>
              </APopconfirm>
            </div>
          ),
          title: t('common.operate'),
          width: 195
        }
      ]
    },
    { showQuickJumper: true }
  );

  const { checkedRowKeys, generalPopupOperation, handleAdd, handleEdit, onBatchDeleted, onDeleted, rowSelection } =
    useTableOperate(data, run, async (res, type) => {
      if (type === 'add') {
        // add request 调用新增的接口
        console.log(res);
      } else {
        // edit request 调用编辑的接口
        console.log(res);
      }
    });

  async function handleBatchDelete() {
    // request
    console.log(checkedRowKeys);
    onBatchDeleted();
  }

  function handleDelete(id: number) {
    // request
    console.log(id);

    onDeleted();
  }

  function edit(id: number) {
    handleEdit(id);
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
            rowSelection={rowSelection}
            scroll={{ x: 'max-content' }}
            size="small"
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
