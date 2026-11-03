import type { ReactNode, SVGProps } from 'react';

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

type IconProps = SVGProps<SVGSVGElement>;

const Svg = ({ children, ...p }: IconProps & { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {children}
  </svg>
);

export const Check = (p: IconProps) => <Svg strokeWidth={3} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>;
export const CheckBig = (p: IconProps) => <Svg strokeWidth={2.2} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>;
export const ChevronLeft = (p: IconProps) => <Svg strokeWidth={2} {...p}><path d="m15 6-6 6 6 6" /></Svg>;
export const ChevronRight = (p: IconProps) => <Svg strokeWidth={2} {...p}><path d="m9 6 6 6-6 6" /></Svg>;
export const ChevronDown = (p: IconProps) => <Svg strokeWidth={2} {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const Plus = (p: IconProps) => <Svg strokeWidth={2} {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const Close = (p: IconProps) => <Svg strokeWidth={2} {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const Download = (p: IconProps) => <Svg {...p}><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></Svg>;
export const Copy = (p: IconProps) => <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" /></Svg>;
export const Eye = (p: IconProps) => <Svg {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Svg>;
export const Trash = (p: IconProps) => <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Svg>;
export const LinkIcon = (p: IconProps) => <Svg strokeWidth={1.75} {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Svg>;

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cx('animate-skeleton rounded-md bg-muted', className)} />
);
