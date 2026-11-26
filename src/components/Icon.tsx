import type { SVGProps } from 'react';

const paths = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  box: 'M12 3 3 7.5v9L12 21l9-4.5v-9zM3 7.5l9 4.5 9-4.5M12 12v9',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.3-.5-.5-2.3z',
  folder: 'M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
  plus: 'M12 5v14M5 12h14',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  check: 'M5 12.5 10 17.5 19 7',
  alert: 'M12 4 2.5 20h19zM12 10v5M12 17.5v.5',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
} as const;
export type IconName = keyof typeof paths;

export function Icon({ name, size = 22, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={paths[name]} />
    </svg>
  );
}
