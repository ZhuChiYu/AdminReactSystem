import { Button, DatePicker, Drawer, Flex, Form, Input, InputNumber, Radio, Select } from 'antd';
import { type FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { enableStatusOptions, userGenderOptions } from '@/constants/business';
import { useFormRules } from '@/features/form';
import { fetchGetRoleList } from '@/service/api';

interface OptionsProps {
  label: string;
  value: string;
}

// 扩展用户类型以包含新的角色字段
interface ExtendedUser extends Api.SystemManage.User {
  contractEndDate?: string;
  contractStartDate?: string;
  contractYears?: number;
  permissionRole?: string;
  positionRole?: string;
}

type Model = Pick<
  ExtendedUser,
  | 'address'
  | 'bankCard'
  | 'contractEndDate'
  | 'contractStartDate'
  | 'contractYears'
  | 'idCard'
  | 'nickName'
  | 'permissionRole'
  | 'positionRole'
  | 'status'
  | 'tim'
  | 'userEmail'
  | 'userGender'
  | 'userName'
  | 'userPhone'
  | 'wechat'
>;

type RuleKey = Extract<keyof Model, 'status' | 'userName'>;

// 权限角色选项 - 移除超级管理员选项
const permissionRoleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '员工', value: 'employee' }
];

const UserOperateDrawer: FC<Page.OperateDrawerProps> = ({ form, handleSubmit, onClose, open, operateType }) => {
  const { t } = useTranslation();

  const [positionRoleOptions, setPositionRoleOptions] = useState<OptionsProps[]>([]);

  // Add state to track if current user is super admin
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const { defaultRequiredRule } = useFormRules();

  const rules: Record<RuleKey, App.Global.FormRule> = {
    status: defaultRequiredRule,
    userName: defaultRequiredRule
  };

  useEffect(() => {
    // Check if current user is super admin when form values change
    const roles = form.getFieldValue('roles') || [];
    const isSuper = roles.some((role: any) => role.type === 'permission' && role.code === 'super_admin');
    setIsSuperAdmin(isSuper);
  }, [form, open]);

  useEffect(() => {
    async function fetchPositionRoles() {
      try {
        const response = await fetchGetRoleList({ current: 1, roleType: 'position', size: 100 });
        // 获取职位角色响应

        if (response && response.records) {
          const options = response.records.map((role: Api.SystemManage.Role) => ({
            label: role.roleName || role.roleCode,
            value: role.roleCode
          }));
          setPositionRoleOptions(options);
        } else {
          // 职位角色响应格式异常
          setPositionRoleOptions([]);
        }
      } catch (error) {
        // 获取职位角色失败
        // 设置默认的职位角色选项
        setPositionRoleOptions([
          { label: '总经理', value: 'general_manager' },
          { label: '销售总监', value: 'sales_director' },
          { label: '销售经理', value: 'sales_manager' },
          { label: '市场部经理', value: 'marketing_manager' },
          { label: '人力BP', value: 'hr_bp' },
          { label: '人力专员', value: 'hr_specialist' },
          { label: '顾问', value: 'consultant' }
        ]);
      }
    }

    if (open) {
      fetchPositionRoles();
    } else {
      setPositionRoleOptions([]);
    }
  }, [open]);

  return (
    <Drawer
      open={open}
      title={operateType === 'add' ? t('page.manage.user.addUser') : t('page.manage.user.editUser')}
      footer={
        <Flex justify="space-between">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
          >
            {t('common.confirm')}
          </Button>
        </Flex>
      }
      onClose={onClose}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          label={t('page.manage.user.userName')}
          name="userName"
          rules={[rules.userName]}
        >
          <Input placeholder={t('page.manage.user.form.userName')} />
        </Form.Item>

        {operateType === 'add' && (
          <Form.Item
            initialValue="123456"
            label={t('page.manage.user.initialPassword')}
            name="password"
            rules={[defaultRequiredRule]}
          >
            <Input.Password placeholder={t('page.manage.user.form.password')} />
          </Form.Item>
        )}

        <Form.Item
          label={t('page.manage.user.userGender')}
          name="userGender"
        >
          <Radio.Group>
            {userGenderOptions.map(item => (
              <Radio
                key={item.value}
                value={item.value}
              >
                {t(item.label)}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label={t('page.manage.user.nickName')}
          name="nickName"
        >
          <Input placeholder={t('page.manage.user.form.nickName')} />
        </Form.Item>

        <Form.Item
          label={t('page.manage.user.userPhone')}
          name="userPhone"
        >
          <Input placeholder={t('page.manage.user.form.userPhone')} />
        </Form.Item>

        <Form.Item
          label={t('page.manage.user.userEmail')}
          name="email"
        >
          <Input placeholder={t('page.manage.user.form.userEmail')} />
        </Form.Item>

        <Form.Item
          label="家庭住址"
          name="address"
        >
          <Input placeholder="请输入家庭住址" />
        </Form.Item>

        <Form.Item
          label="身份证号"
          name="idCard"
        >
          <Input placeholder="请输入身份证号" />
        </Form.Item>

        <Form.Item
          label="银行卡号"
          name="bankCard"
        >
          <Input placeholder="请输入银行卡号" />
        </Form.Item>

        <Form.Item
          label="工作微信号"
          name="wechat"
        >
          <Input placeholder="请输入工作微信号" />
        </Form.Item>

        <Form.Item
          label="TIM号"
          name="tim"
        >
          <Input placeholder="请输入TIM号" />
        </Form.Item>

        <Form.Item
          label="合同年限"
          name="contractYears"
        >
          <InputNumber
            addonAfter="年"
            max={50}
            min={0}
            placeholder="请输入合同年限"
            precision={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="合同开始时间"
          name="contractStartDate"
        >
          <DatePicker
            placeholder="请选择合同开始时间"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="合同结束时间"
          name="contractEndDate"
        >
          <DatePicker
            placeholder="请选择合同结束时间"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label={t('page.manage.user.userStatus')}
          name="status"
          rules={[rules.status]}
        >
          <Radio.Group>
            {enableStatusOptions.map(item => (
              <Radio
                key={item.value}
                value={item.value}
              >
                {t(item.label)}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        {/* Hide role selection dropdowns for super admin */}
        {!isSuperAdmin && (
          <>
            <Form.Item
              label="职位角色"
              name="positionRole"
            >
              <Select
                options={positionRoleOptions}
                placeholder="请选择职位角色"
              />
            </Form.Item>

            <Form.Item
              label="权限角色"
              name="permissionRole"
            >
              <Select
                options={permissionRoleOptions}
                placeholder="请选择权限角色"
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Drawer>
  );
};

export default UserOperateDrawer;
