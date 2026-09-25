import type { SVGProps } from 'react'

const paths: Record<string, string> = {
  arrow: 'm9 18 6-6-6-6',
  check: 'm5 12 4 4L19 6',
  chevron: 'm9 18 6-6-6-6',
  close: 'M18 6 6 18M6 6l12 12',
  copy: 'M8 8h10v10H8zM6 16H4V4h12v2',
  download: 'M12 3v12m0 0 4-4m-4 4-4-4M5 21h14',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  folder: 'M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  link: 'M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.15-1.15',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  shared: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  upload: 'M12 16V4m0 0L8 8m4-4 4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3',
}

export function Icon({
  name,
  size = 20,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  )
}
