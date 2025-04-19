import DarkModeContainer from '@/components/DarkModeContainer';

const GlobalFooter = () => {
  return (
    <DarkModeContainer className="h-full flex-center">
      <a
        href="https://github.com/honghuangdc/soybean-admin/blob/main/LICENSE"
        rel="noopener noreferrer"
        target="_blank"
      >
        Copyright © 2025 一品华信
      </a>
    </DarkModeContainer>
  );
};

export default GlobalFooter;
