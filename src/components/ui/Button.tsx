import { ReactNode, ButtonHTMLAttributes } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full' : '',
    disabled ? 'btn-disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

interface ListButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  label: ReactNode;
  value?: ReactNode;
  variant?: ButtonVariant;
}

export function ListButton({
  label,
  value,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: ListButtonProps) {
  const classes = [
    'btn-list',
    `btn-${variant}`,
    disabled ? 'btn-disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled} {...props}>
      <span className="btn-list-label">{label}</span>
      {value !== undefined && <span className="btn-list-value">{value}</span>}
    </button>
  );
}
