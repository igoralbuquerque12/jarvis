import type { SVGProps } from 'react';
import { JarvisPersona } from './jarvis-persona';

/**
 * The Jarvis "note" icon, monochrome: the tile takes the theme's ink and the
 * glyph its ground (colours come from `.mark__*` in index.css). The app's
 * lockup uses Jarvis's face instead; this stays as the logo (favicon).
 */
export function JarvisMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={['mark', className].filter(Boolean).join(' ')}
      {...props}
    >
      <rect className="mark__tile" width="64" height="64" rx="16" />
      <g className="mark__glyph">
        <circle cx="17.5" cy="17.5" r="4.5" />
        <rect x="13" y="28" width="38" height="6" rx="3" />
        <rect x="13" y="39" width="30" height="6" rx="3" opacity="0.72" />
        <rect x="13" y="50" width="21" height="6" rx="3" opacity="0.48" />
      </g>
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
      <JarvisPersona variant="icon" className="lockup__icon" />
      <span className="lockup__text">
        <span className="lockup__name">Jarvis</span>
        {tagline ? (
          <span className="lockup__tag">Assistente pessoal por WhatsApp</span>
        ) : null}
      </span>
    </span>
  );
}
