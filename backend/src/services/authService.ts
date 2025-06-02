import crypto from 'node:crypto';

import { redisUtils } from '@/config/redis';

class AuthService {
  /** 生成验证码 */
  async generateCaptcha() {
    // 生成4位随机验证码
    const code = Math.random().toString().slice(2, 6);

    // 生成验证码ID
    const captchaId = crypto.randomUUID();

    // 将验证码存储到Redis，5分钟过期
    await redisUtils.set(`captcha:${captchaId}`, code, 300);

    // 生成简单的验证码图片（Base64格式）
    const captchaImage = this.generateCaptchaImage(code);

    return {
      captchaId,
      captchaImage
    };
  }

  /** 验证验证码 */
  async verifyCaptcha(captchaId: string, code: string): Promise<boolean> {
    if (!captchaId || !code) {
      return false;
    }

    const storedCode = await redisUtils.get<string>(`captcha:${captchaId}`);

    if (!storedCode) {
      return false;
    }

    // 验证成功后删除验证码
    await redisUtils.del(`captcha:${captchaId}`);

    return storedCode.toLowerCase() === code.toLowerCase();
  }

  /** 生成简单的验证码图片（SVG转Base64） */
  private generateCaptchaImage(code: string): string {
    // 创建SVG验证码图片
    const width = 120;
    const height = 40;
    const fontSize = 20;

    // 生成随机颜色
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    const backgroundColor = '#F8F9FA';

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;

    // 添加干扰线
    for (let i = 0; i < 3; i++) {
      const x1 = Math.random() * width;
      const y1 = Math.random() * height;
      const x2 = Math.random() * width;
      const y2 = Math.random() * height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1"/>`;
    }

    // 添加验证码字符
    for (let i = 0; i < code.length; i++) {
      const x = 20 + i * 20;
      const y = 25 + (Math.random() - 0.5) * 6; // 随机偏移
      const rotation = (Math.random() - 0.5) * 30; // 随机旋转
      const color = colors[Math.floor(Math.random() * colors.length)];

      svg += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" `;
      svg += `font-weight="bold" fill="${color}" transform="rotate(${rotation} ${x} ${y})">${code[i]}</text>`;
    }

    // 添加干扰点
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      svg += `<circle cx="${x}" cy="${y}" r="1" fill="${color}"/>`;
    }

    svg += '</svg>';

    // 转换为Base64
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
}

export const authService = new AuthService();
