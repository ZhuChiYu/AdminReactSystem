import type { TableProps } from 'antd';

/** 表格通用配置 */
export const getTableConfig = (): Pick<TableProps<any>, 'bordered' | 'scroll' | 'size'> => ({
  bordered: false,
  scroll: { x: 'max-content' },
  size: 'middle'
});

/** 为操作列添加固定配置 */
export const getActionColumnConfig = (width: number = 120) => ({
  align: 'center' as const,
  fixed: 'right' as const,
  width
});

/** 为普通列添加居中配置 */
export const getCenterColumnConfig = () => ({
  align: 'center' as const
});

/** 获取完整的表格配置，包含分页，排除可能冲突的属性 */
export const getFullTableConfig = (
  pageSize: number = 10
): Omit<TableProps<any>, 'columns' | 'dataSource' | 'rowKey'> => ({
  ...getTableConfig(),
  pagination: {
    pageSize,
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
  }
});
