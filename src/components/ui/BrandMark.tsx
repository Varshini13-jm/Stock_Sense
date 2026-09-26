// Brand mark: geometric grid of 4 squares — matches the favicon
export function BrandMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  const s = size / 2 - 2
  const gap = 2
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="28" height="28" rx="6" fill="#4f6ef7" />
      <rect x="5" y="5" width={s} height={s} rx="1.5" fill="white" />
      <rect x={5 + s + gap} y="5" width={s} height={s} rx="1.5" fill="white" opacity="0.65" />
      <rect x="5" y={5 + s + gap} width={s} height={s} rx="1.5" fill="white" opacity="0.65" />
      <rect x={5 + s + gap} y={5 + s + gap} width={s} height={s} rx="1.5" fill="white" />
    </svg>
  )
}
