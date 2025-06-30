/**
 * 文件名编码处理工具
 */

/**
 * 尝试修复乱码的中文文件名
 * @param filename 原始文件名
 * @returns 修复后的文件名
 */
export function fixEncodedFileName(filename: string): string {
  if (!filename) return filename;

  try {
    // 如果文件名包含明显的乱码字符，尝试修复
    const garbledChars = /[ā-žīćēūōļķņĀ-Ž]/;
    if (garbledChars.test(filename)) {
      // 尝试多种编码方式修复
      const attempts = [
        // 尝试ISO-8859-1到UTF-8的转换
        () => {
          const bytes = new Uint8Array(filename.length);
          for (let i = 0; i < filename.length; i++) {
            bytes[i] = filename.charCodeAt(i) & 0xFF;
          }
          return new TextDecoder('utf-8').decode(bytes);
        },
        // 尝试从Latin1解码
        () => decodeURIComponent(escape(filename)),
        // 尝试Windows-1252解码
        () => {
          const encoded = filename.split('').map(char =>
            '%' + char.charCodeAt(0).toString(16).padStart(2, '0')
          ).join('');
          return decodeURIComponent(encoded);
        }
      ];

      for (const attempt of attempts) {
        try {
          const decoded = attempt();
          // 检查解码结果是否包含常见的中文字符
          if (/[\u4e00-\u9fff]/.test(decoded)) {
            console.log(`文件名编码修复成功: "${filename}" -> "${decoded}"`);
            return decoded;
          }
        } catch (error) {
          // 忽略解码错误，继续尝试下一种方法
          continue;
        }
      }
    }

    // 如果都无法修复，返回原始文件名
    return filename;
  } catch (error) {
    console.warn('修复文件名编码时出错:', error);
    return filename;
  }
}

/**
 * 安全的文件名显示，包含乱码修复和后备显示
 * @param originalName 原始文件名
 * @param fileName 备用文件名
 * @returns 显示用的文件名
 */
export function getDisplayFileName(originalName?: string, fileName?: string): string {
  if (!originalName && !fileName) return '未知文件';

  const nameToFix = originalName || fileName || '未知文件';
  const fixedName = fixEncodedFileName(nameToFix);

  // 如果修复后的文件名仍然包含乱码或为空，使用备用方案
  if (!fixedName || fixedName === nameToFix && /[^\x00-\x7F\u4e00-\u9fff]/.test(fixedName)) {
    return fileName || originalName || '文件名显示异常';
  }

  return fixedName;
}

/**
 * 检查字符串是否包含乱码
 * @param str 要检查的字符串
 * @returns 是否包含乱码
 */
export function isGarbledText(str: string): boolean {
  if (!str) return false;

  // 检查是否包含明显的乱码字符
  const garbledPatterns = [
    /[ā-žīćēūōļķņĀ-Ž]/,  // 拉丁字符乱码
    /[àáâãäåæçèéêëìíîï]/,  // 其他拉丁字符
    /â€|â™|Ã¢/,  // 常见UTF-8乱码模式
    /\?{2,}/,  // 多个问号（解码失败的标志）
  ];

  return garbledPatterns.some(pattern => pattern.test(str));
}
