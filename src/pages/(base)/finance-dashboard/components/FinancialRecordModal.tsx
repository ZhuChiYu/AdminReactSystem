import { DatePicker, Form, Input, InputNumber, Modal, Radio, Select, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';

import { financialService } from '@/service/api';
import type { CreateFinancialRecordRequest, FinancialRecord, UpdateFinancialRecordRequest } from '@/service/api/financial';

const { Option } = Select;
const { TextArea } = Input;

interface FinancialRecordModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record?: FinancialRecord | null;
  mode: 'create' | 'edit';
  recordType: 1 | 2; // 1: 收入, 2: 支出
}

// 支出类型选项
const expenseTypes = [
  { label: '差旅费', value: 'travel' },
  { label: '住宿费', value: 'accommodation' },
  { label: '办公费', value: 'office_supplies' },
  { label: '餐费', value: 'meal' },
  { label: '招待费', value: 'entertainment' },
  { label: '培训费', value: 'training' },
  { label: '话费', value: 'phone' },
  { label: '物业费', value: 'property' },
  { label: '其他', value: 'other' },
  // 新增支出类型
  { label: '房租', value: 'rent' },
  { label: '水电费', value: 'utilities' },
  { label: '团建', value: 'team_building' },
  { label: '工资', value: 'salary' },
  { label: '社保', value: 'social_insurance' },
  { label: '补培训费', value: 'training_supplement' },
  { label: '设备采购', value: 'equipment_purchase' }
];

// 收入类型选项
const incomeTypes = [
  { label: '培训收入', value: 'training_income' },
  { label: '项目收入', value: 'project_income' },
  { label: '咨询收入', value: 'consulting_income' },
  { label: '其他收入', value: 'other_income' },
  // 新增收入类型
  { label: '返佣费', value: 'commission_income' }
];

const FinancialRecordModal: React.FC<FinancialRecordModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
  mode,
  recordType
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && record) {
        // 编辑模式，填充表单数据（包含日期）
        form.setFieldsValue({
          category: record.category,
          amount: record.amount,
          description: record.description,
          recordDate: dayjs(record.recordDate)
        });
      } else {
        // 新增模式，重置表单并设置默认日期
        form.resetFields();
        form.setFieldsValue({
          recordDate: dayjs()
        });
      }
    }
  }, [visible, mode, record, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = {
        ...values,
        type: recordType,
        // 使用表单日期（新增或编辑都允许修改）
        recordDate: values.recordDate.format('YYYY-MM-DD HH:mm:ss')
      };

      if (mode === 'create') {
        await financialService.createFinancialRecord(formData as CreateFinancialRecordRequest);
        message.success('创建财务记录成功');
      } else {
        if (!record?.id) {
          message.error('记录ID不存在');
          return;
        }
        await financialService.updateFinancialRecord(record.id, formData as UpdateFinancialRecordRequest);
        message.success('更新财务记录成功');
      }

      onSuccess();
      onCancel();
    } catch (error) {
      console.error('保存财务记录失败:', error);
      message.error(mode === 'create' ? '创建财务记录失败' : '更新财务记录失败');
    }
  };

  const getCategoryOptions = () => {
    return recordType === 1 ? incomeTypes : expenseTypes;
  };

  return (
    <Modal
      title={
        mode === 'create'
          ? (recordType === 1 ? '新增收入记录' : '新增支出记录')
          : (recordType === 1 ? '编辑收入记录' : '编辑支出记录')
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          recordDate: dayjs()
        }}
      >
        <Form.Item
          label="分类"
          name="category"
          rules={[{ required: true, message: '请选择分类' }]}
        >
          <Select placeholder="请选择分类">
            {getCategoryOptions().map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="金额（元）"
          name="amount"
          rules={[
            { required: true, message: '请输入金额' },
            { type: 'number', min: 0.01, message: '金额必须大于0' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入金额"
            precision={2}
            min={0.01}
          />
        </Form.Item>

        <Form.Item
          label={recordType === 1 ? '收入日期' : '支出日期'}
          name="recordDate"
          rules={[{ required: true, message: `请选择${recordType === 1 ? '收入' : '支出'}日期` }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            placeholder={`请选择${recordType === 1 ? '收入' : '支出'}日期`}
            showTime
            format="YYYY-MM-DD HH:mm:ss"
          />
        </Form.Item>

        <Form.Item
          label="描述"
          name="description"
          rules={[{ required: true, message: '请输入描述' }]}
        >
          <TextArea
            rows={4}
            placeholder="请输入详细描述"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FinancialRecordModal;
