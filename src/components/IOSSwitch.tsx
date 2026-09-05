import React from 'react';
import clsx from 'clsx';

interface IOSSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  onHaptic?: (style?: 'light' | 'medium' | 'heavy') => void;
  id?: string;
  'aria-label'?: string;
}

export const IOSSwitch: React.FC<IOSSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  onHaptic,
  id,
  'aria-label': ariaLabel,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onHaptic?.('light');
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch (_) {}
    onChange(!checked);
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      className={clsx(
        'relative inline-flex items-center w-[51px] h-[31px] rounded-full flex-shrink-0 transition-colors duration-300 ease-in-out select-none outline-none focus:outline-none active:scale-[0.96]',
        checked ? 'bg-ios-green' : 'bg-[#E5E5EA] dark:bg-[#3A3A3C]',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      <span
        className={clsx(
          'inline-block w-[27px] h-[27px] bg-white rounded-full pointer-events-none transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'shadow-[0_3px_8px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.06)]',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        )}
      />
    </button>
  );
};
