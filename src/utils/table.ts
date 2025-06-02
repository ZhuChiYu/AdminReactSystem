import type { TableProps } from 'antd';

/**
 * 表格通用配置
 */
export const getTableConfig = (): Pick<TableProps<any>, 'scroll' | 'size' | 'bordered'> => ({
  scroll: { x: 'max-content' },
  size: 'middle',
  bordered: false,
});

/**
 * 为操作列添加固定配置
 */
export const getActionColumnConfig = (width: number = 120) => ({
  fixed: 'right' as const,
  width,
  align: 'center' as const,
});

/**
 * 为普通列添加居中配置
 */
export const getCenterColumnConfig = () => ({
  align: 'center' as const,
});

/**
 * 获取完整的表格配置，包含分页，排除可能冲突的属性
 */
export const getFullTableConfig = (pageSize: number = 10): Omit<TableProps<any>, 'rowKey' | 'columns' | 'dataSource'> => ({
  ...getTableConfig(),
  pagination: {
    pageSize,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
  },
}); 