import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

export type PageMotionKind = 'tab-forward' | 'tab-back' | 'stack' | 'fade';

type PageTransitionProps = {
  routeKey: string;
  motionKind: PageMotionKind;
  children: ReactNode;
};

export function PageTransition({ routeKey, motionKind, children }: PageTransitionProps) {
  return (
    <div key={routeKey} className={cn('page-transition')} data-motion={motionKind}>
      {children}
    </div>
  );
}
