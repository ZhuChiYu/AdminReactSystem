import { Button as AButton, Drawer as ADrawer, Flex as AFlex, Form as AForm, Input as AInput, Radio as ARadio, Switch as ASwitch } from 'antd';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { enableStatusOptions } from '@/constants/business';
import { useFormRules } from '@/features/form';

type Model = Pick<Api.SystemManage.Role, 'canCreateClass' | 'department' | 'roleDesc' | 'roleName' | 'status'>;

type RuleKey = Exclude<keyof Model, 'canCreateClass' | 'roleDesc'>;

const RoleOperateDrawer: FC<Page.OperateDrawerProps> = memo(({ form, handleSubmit, onClose, open, operateType }) => {
  const { t } = useTranslation();

  const { defaultRequiredRule } = useFormRules();

  const rules: Record<RuleKey, App.Global.FormRule> = {
    department: defaultRequiredRule,
    roleName: defaultRequiredRule,
    status: defaultRequiredRule
  };

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
          <AInput placeholder="请输入所属部门" />
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
          label="新增班级权限"
          name="canCreateClass"
          valuePropName="checked"
        >
          <ASwitch checkedChildren="开启" unCheckedChildren="关闭" />
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
