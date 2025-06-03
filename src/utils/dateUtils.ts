import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

/**
 * 生成结束日期的禁用日期函数
 *
 * @param startDate 开始日期
 * @returns 禁用日期的函数
 */
export const getEndDateDisabledDate = (startDate?: Dayjs | null) => {
  return (current: Dayjs) => {
    if (!startDate) return false;
    // 禁用开始日期之前的所有日期
    return current && current.isBefore(startDate, 'day');
  };
};

/**
 * 生成开始日期的禁用日期函数
 *
 * @param endDate 结束日期
 * @param allowPastDates 是否允许选择过去的日期，默认为 true
 * @returns 禁用日期的函数
 */
export const getStartDateDisabledDate = (endDate?: Dayjs | null, allowPastDates = true) => {
  return (current: Dayjs) => {
    const conditions: boolean[] = [];

    // 如果不允许选择过去的日期，禁用今天之前的日期
    if (!allowPastDates) {
      conditions.push(current && current.isBefore(dayjs(), 'day'));
    }

    // 如果有结束日期，禁用结束日期之后的所有日期
    if (endDate) {
      conditions.push(current && current.isAfter(endDate, 'day'));
    }

    return conditions.some(condition => condition);
  };
};

/**
 * 为 RangePicker 生成禁用日期函数
 *
 * @param allowPastDates 是否允许选择过去的日期，默认为 true
 * @returns 禁用日期的函数
 */
export const getRangePickerDisabledDate = (allowPastDates = true) => {
  return (current: Dayjs) => {
    if (!allowPastDates) {
      // 禁用今天之前的日期
      return current && current.isBefore(dayjs(), 'day');
    }
    return false;
  };
};

/**
 * 验证日期范围是否有效
 *
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 是否有效的布尔值和错误信息
 */
export const validateDateRange = (startDate?: Dayjs | null, endDate?: Dayjs | null) => {
  if (!startDate || !endDate) {
    return { isValid: true, message: '' };
  }

  if (startDate.isAfter(endDate)) {
    return { isValid: false, message: '开始日期不能晚于结束日期' };
  }

  return { isValid: true, message: '' };
};

/**
 * 格式化日期为标准格式
 *
 * @param date 日期对象
 * @param format 格式字符串，默认为 'YYYY-MM-DD'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: Dayjs | null | undefined, format = 'YYYY-MM-DD'): string => {
  if (!date) return '';
  return date.format(format);
};
