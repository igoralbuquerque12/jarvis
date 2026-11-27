/**
 * Jarvis as a character: the logo re-read. The rounded "note" tile is the
 * being (its dot became two calm eyes); the three fading lines moved out into
 * a speech bubble, as what it says. Same geometry as images/jarvis-persona-*.svg;
 * colours come from the `--persona-*` tokens, so it follows the theme.
 *
 * - `full`: the being and its speech bubble (login, WhatsApp pairing).
 * - `face`: the being alone, with its ground shadow (empty states).
 * - `icon`: the being alone, tightly cropped (lockup next to the name).
 * - `mood="greet"` writes the bubble's lines in once; `mood="typing"` pulses
 *   them like a typing indicator (page loading).
 */
interface JarvisPersonaProps {
  variant?: 'full' | 'face' | 'icon';
  mood?: 'idle' | 'greet' | 'typing';
  className?: string;
}

const VIEWBOX = {
  full: '150 140 820 740',
  face: '166 350 508 530',
  icon: '183 367 474 474',
} as const;

export function JarvisPersona({
  variant = 'full',
  mood = 'idle',
  className,
}: JarvisPersonaProps) {
  const classes = [
    'persona',
    `persona--${variant}`,
    mood === 'idle' ? null : `persona--${mood}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <svg viewBox={VIEWBOX[variant]} aria-hidden="true" className={classes}>
      {variant === 'icon' ? null : (
        <ellipse
          className="persona__shadow"
          cx="420"
          cy="846"
          rx="196"
          ry="22"
        />
      )}
      <g transform="rotate(-7 420 600)">
        <rect
          className="persona__body"
          x="196"
          y="380"
          width="448"
          height="448"
          rx="112"
        />
        <g className="persona__eyes">
          <rect x="318" y="520" width="58" height="88" rx="29" />
          <rect x="456" y="520" width="58" height="88" rx="29" />
          <circle className="persona__shine" cx="358" cy="546" r="9" />
          <circle className="persona__shine" cx="496" cy="546" r="9" />
        </g>
      </g>
      {variant === 'full' ? (
        <g transform="translate(560 168)">
          <path
            className="persona__bubble"
            d="M56 0h272a56 56 0 0 1 56 56v108a56 56 0 0 1-56 56H120l-64 52 10-52A56 56 0 0 1 0 164V56A56 56 0 0 1 56 0z"
          />
          <rect
            className="persona__line persona__line--1"
            x="48"
            y="52"
            width="268"
            height="30"
            rx="15"
          />
          <rect
            className="persona__line persona__line--2"
            x="48"
            y="102"
            width="206"
            height="30"
            rx="15"
          />
          <rect
            className="persona__line persona__line--3"
            x="48"
            y="152"
            width="138"
            height="30"
            rx="15"
          />
        </g>
      ) : null}
    </svg>
  );
}
