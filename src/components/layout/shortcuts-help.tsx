'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Keyboard, Search, Bell, Moon, Sun, ArrowUp, ArrowDown, CornerDownLeft, X, Command } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  description: string;
  icon?: LucideIcon;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigasi',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Buka command palette / pencarian global', icon: Search },
      { keys: ['?'], description: 'Buka bantuan keyboard shortcuts', icon: Keyboard },
      { keys: ['Esc'], description: 'Tutup modal/dialog aktif', icon: X },
    ],
  },
  {
    title: 'Tema & Notifikasi',
    items: [
      { keys: ['T'], description: 'Toggle dark/light mode', icon: Moon },
      { keys: ['N'], description: 'Buka panel notifikasi', icon: Bell },
    ],
  },
  {
    title: 'Command Palette',
    items: [
      { keys: ['↑'], description: 'Navigasi ke atas', icon: ArrowUp },
      { keys: ['↓'], description: 'Navigasi ke bawah', icon: ArrowDown },
      { keys: ['Enter'], description: 'Pilih item', icon: CornerDownLeft },
      { keys: ['Esc'], description: 'Tutup command palette', icon: X },
    ],
  },
];

export function ShortcutsHelpModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-emerald-600" />
            Pintasan Keyboard
          </DialogTitle>
          <DialogDescription>
            Gunakan pintasan keyboard berikut untuk navigasi cepat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h4>
              <ul className="space-y-1.5">
                {group.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                    <div className="flex items-center gap-2.5">
                      {item.icon && <item.icon className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm text-foreground">{item.description}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, j) => (
                        <span key={j} className="flex items-center gap-1">
                          {j > 0 && <span className="text-xs text-muted-foreground">+</span>}
                          <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 text-xs font-semibold text-foreground">
                            {key === 'Ctrl' ? (
                              <span className="flex items-center gap-0.5"><Command className="h-3 w-3" />{key}</span>
                            ) : key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          💡 <strong>Tip:</strong> Tekan <kbd className="rounded border border-emerald-300 bg-white px-1 font-semibold dark:border-emerald-500/30 dark:bg-emerald-500/10">Ctrl+K</kbd> kapan saja untuk mencari balita, ibu hamil, atau navigasi cepat ke modul mana pun.
        </div>
      </DialogContent>
    </Dialog>
  );
}
