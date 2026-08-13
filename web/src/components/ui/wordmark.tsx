import type { SVGProps } from 'react';
import { useId } from 'react';

export function JarvisMark(props: SVGProps<SVGSVGElement>) {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.55" y2="1">
          <stop offset="0" stopColor="#FF9142" />
          <stop offset="1" stopColor="#EE5A05" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
      <circle cx="17.5" cy="17.5" r="4.5" fill="#FFF6EC" />
      <rect x="13" y="28" width="38" height="6" rx="3" fill="#FFF6EC" opacity="0.95" />
      <rect x="13" y="39" width="30" height="6" rx="3" fill="#FFE3C6" opacity="0.85" />
      <rect x="13" y="50" width="21" height="6" rx="3" fill="#FFD3AB" opacity="0.75" />
    </svg>
  );
}

interface WordmarkProps {
  size?: 'sm' | 'lg';
  tagline?: boolean;
}

export function Wordmark({ size = 'sm', tagline = false }: WordmarkProps) {
  return (
    <span className={size === 'lg' ? 'lockup lockup--lg' : 'lockup'}>
      <JarvisMark className="lockup__icon" />
      <span className="lockup__text">
        <span className="lockup__name">Jarvis</span>
        {tagline ? (
          <span className="lockup__tag">Assistente pessoal por WhatsApp</span>
        ) : null}
      </span>
    </span>
  );
}
