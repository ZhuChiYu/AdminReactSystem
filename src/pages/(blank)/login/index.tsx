import { Button, Checkbox, Form, Input, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useInitAuth } from '@/features/auth/auth';
import { SubmitEnterButton, useFormRules } from '@/features/form';

type LoginParams = {
  password: string;
  userName: string;
};

const INITIAL_VALUES = {
  password: '',
  userName: ''
};

const PwdLogin = () => {
  const { t } = useTranslation();
  const { loading, toLogin } = useInitAuth();
  const [form] = Form.useForm<LoginParams>();
  const navigate = useNavigate();

  const {
    formRules: { pwd, userName: userNameRules }
  } = useFormRules();

  async function handleSubmit() {
    const params = await form.validateFields();
    toLogin(params);
  }

  function goResetPwd() {
    navigate('reset-pwd');
  }

  return (
    <>
      <h3 className="text-18px text-primary font-medium">{t('page.login.pwdLogin.title')}</h3>
      <Form
        className="pt-24px"
        form={form}
        initialValues={INITIAL_VALUES}
      >
        <Form.Item
          name="userName"
          rules={userNameRules}
        >
          <Input placeholder={t('page.login.common.userNamePlaceholder')} />
        </Form.Item>

        <Form.Item
          name="password"
          rules={pwd}
        >
          <Input.Password
            autoComplete="current-password"
            placeholder={t('page.login.common.passwordPlaceholder')}
          />
        </Form.Item>
        <Space
          className="w-full"
          direction="vertical"
          size={24}
        >
          <div className="flex-y-center justify-between">
            <Checkbox>{t('page.login.pwdLogin.rememberMe')}</Checkbox>

            <Button
              type="text"
              onClick={goResetPwd}
            >
              {t('page.login.pwdLogin.forgetPassword')}
            </Button>
          </div>
          <SubmitEnterButton
            block
            loading={loading}
            shape="round"
            size="large"
            type="primary"
            onClick={handleSubmit}
          >
            {t('common.confirm')}
          </SubmitEnterButton>
        </Space>
      </Form>
    </>
  );
};

export const handle = {
  constant: true,
  i18nKey: 'route.(blank)_login',
  title: 'login'
};

export default PwdLogin;
