import boxen, { type Options as BoxenOptions } from 'boxen';
import gradientString from 'gradient-string';
import type { Plugin } from 'vite';

const welcomeMessage = gradientString('#646cff', 'magenta').multiline(
  `您好! 欢迎使用 一品华信 公司管理系统\n我们为您精心准备了精美的保姆级文档\n`
);

const boxenOptions: BoxenOptions = {
  borderColor: '#646cff',
  borderStyle: 'round',
  padding: 0.5
};

export function setupProjectInfo(): Plugin {
  return {
    buildStart() {},

    name: 'vite:buildInfo'
  };
}
