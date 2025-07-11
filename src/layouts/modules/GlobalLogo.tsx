import clsx from 'clsx';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

interface Props extends Omit<LinkProps, 'to'> {
  /** Whether to show the title */
  showTitle?: boolean;
}
const GlobalLogo: FC<Props> = memo(({ className, showTitle = true, ...props }) => {
  const { t } = useTranslation();

  return (
    <Link
      className={clsx('w-full flex-center nowrap-hidden', className)}
      to="/"
      {...props}
    >
      <h2
        className="text-16px text-primary font-bold transition duration-300 ease-in-out"
        style={{ display: showTitle ? 'block' : 'none' }}
      >
        {t('system.title')}
      </h2>
    </Link>
  );
});

export default GlobalLogo;
