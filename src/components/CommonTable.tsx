import { Table } from 'antd';
import type { TableProps } from 'antd';

import { getFullTableConfig } from '@/utils/table';

interface CommonTableProps<T> extends Omit<TableProps<T>, 'bordered' | 'scroll' | 'size'> {
  // 额外的自定义属性
}

/** 通用表格组件，统一应用表格样式和配置 */
export function CommonTable<T = any>(props: CommonTableProps<T>) {
  const { columns, ...restProps } = props;

  // 为所有列添加居中对齐
  const enhancedColumns = columns?.map(col => ({
    ...col,
    align: col.align || ('center' as const)
  }));

  return (
    <Table
      {...getFullTableConfig(10)}
      {...restProps}
      columns={enhancedColumns}
    />
  );
}

export default CommonTable;
