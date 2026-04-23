interface Props {
  size?: number;
}

export default function TappyLogo({ size = 40 }: Props) {
  const iconSize = Math.round(size * 0.55);
  const radius = Math.round(size * 0.3);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'linear-gradient(135deg, #7c5cff, #33d6c5)',
        boxShadow: '0 12px 30px rgba(124,92,255,0.25)',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" width={iconSize} height={iconSize}>
        <path
          d="M13 2L3 14h7l-1 8 12-14h-7l-1-6z"
          stroke="rgba(11,15,23,0.95)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
