'use client';

import type { ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@flordoestudante/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@flordoestudante/ui';

type Props = {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
};

export function AdminRowActionsMenu({ children, align = 'end' }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground"
          aria-label="Mais ações"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
