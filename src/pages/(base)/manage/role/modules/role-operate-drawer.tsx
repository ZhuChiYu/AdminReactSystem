import { Button as AButton, Drawer as ADrawer, Flex as AFlex, Form as AForm, Input as AInput, Radio as ARadio, Select as ASelect } from 'antd';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { enableStatusOptions } from '@/constants/business';
import { useFormRules } from '@/features/form';
import { fetchGetDepartmentList } from '@/service/api/system-manage';

type Model = Pick<Api.SystemManage.Role, 'department' | 'roleDesc' | 'roleName' | 'status'>;

type RuleKey = Exclude<keyof Model, 'roleDesc'>;

const RoleOperateDrawer: FC<Page.OperateDrawerProps> = memo(({ form, handleSubmit, onClose, open, operateType }) => {
  const { t } = useTranslation();
  
  // 部门选项状态
  const [departments, setDepartments] = useState<{ label: string; value: string }[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const { defaultRequiredRule } = useFormRules();

  const rules: Record<RuleKey, App.Global.FormRule> = {
    department: defaultRequiredRule,
    roleName: defaultRequiredRule,
    status: defaultRequiredRule
  };

  // 加载部门列表
  useEffect(() => {
    const loadDepartments = async () => {
      if (!open) return;
      
      try {
        setLoadingDepartments(true);
        const response = await fetchGetDepartmentList();
        if (response?.data) {
          const deptOptions = response.data.map((dept: any) => ({
            label: dept.name,
            value: dept.name
          }));
          setDepartments(deptOptions);
        }
      } catch (error) {
        console.error('获取部门列表失败:', error);
        // 设置默认部门选项
        setDepartments([
          { label: '管理部', value: '管理部' },
          { label: '销售部', value: '销售部' },
          { label: '教学部', value: '教学部' },
          { label: '财务部', value: '财务部' },
          { label: '人力资源部', value: '人力资源部' },
          { label: '市场部', value: '市场部' }
        ]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, [open]);

  return (
    <ADrawer
      open={open}
      title={operateType === 'add' ? t('page.manage.role.addRole') : t('page.manage.role.editRole')}
      footer={
        <AFlex justify="space-between">
          <AButton onClick={onClose}>{t('common.cancel')}</AButton>
          <AButton
            type="primary"
            onClick={handleSubmit}
          >
            {t('common.confirm')}
          </AButton>
        </AFlex>
      }
      onClose={onClose}
    >
      <AForm
        form={form}
        layout="vertical"
      >
        <AForm.Item
          label={t('page.manage.role.roleName')}
          name="roleName"
          rules={[rules.roleName]}
        >
          <AInput placeholder={t('page.manage.role.form.roleName')} />
        </AForm.Item>

        <AForm.Item
          label="所属部门"
          name="department"
          rules={[rules.department]}
        >
          <ASelect
            loading={loadingDepartments}
            options={departments}
            placeholder="请选择所属部门"
          />
        </AForm.Item>

        <AForm.Item
          label={t('page.manage.role.roleStatus')}
          name="status"
          rules={[rules.status]}
        >
          <ARadio.Group>
            {enableStatusOptions.map(item => (
              <ARadio
                key={item.value}
                value={item.value}
              >
                {t(item.label)}
              </ARadio>
            ))}
          </ARadio.Group>
        </AForm.Item>

        <AForm.Item
          label={t('page.manage.role.roleDesc')}
          name="roleDesc"
        >
          <AInput placeholder={t('page.manage.role.form.roleDesc')} />
        </AForm.Item>
      </AForm>
    </ADrawer>
  );
});

export default RoleOperateDrawer;
