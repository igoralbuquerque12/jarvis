import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  block?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'sm' ? 'btn--sm' : null,
    block ? 'btn--block' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...props} />;
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  danger?: boolean;
  outline?: boolean;
}

/** Square button that only shows an icon; `label` feeds title + aria-label. */
export function IconButton({
  label,
  danger = false,
  outline = false,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const classes = [
    'icon-btn',
    danger ? 'icon-btn--danger' : null,
    outline ? 'icon-btn--outline' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      title={label}
      aria-label={label}
      {...props}
    />
  );
}
