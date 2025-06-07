import { enableStatusOptions } from '@/constants/business';
import { useFormRules } from '@/features/form';

type Model = Pick<Api.SystemManage.Role, 'roleCode' | 'roleDesc' | 'roleName' | 'status'>;

type RuleKey = Exclude<keyof Model, 'roleDesc'>;

const RoleOperateDrawer: FC<Page.OperateDrawerProps> = memo(({ form, handleSubmit, onClose, open, operateType }) => {
  const { t } = useTranslation();

  const { defaultRequiredRule } = useFormRules();

  const rules: Record<RuleKey, App.Global.FormRule> = {
    roleCode: defaultRequiredRule,
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
          label={t('page.manage.role.roleCode')}
          name="roleCode"
          rules={[rules.roleCode]}
        >
          <AInput placeholder={t('page.manage.role.form.roleCode')} />
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
