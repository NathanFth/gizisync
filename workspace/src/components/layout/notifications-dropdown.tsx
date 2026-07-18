'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle2, Clock, Bell, X, CheckCheck } from 'lucide-react';
import type { TipeNotifikasi } from '@/lib/data/types';
import type { LucideIcon } from 'lucide-react';

export function NotificationsDropdown() {
  // This component is a no-op shell — the actual dropdown panel (NotificationsPanel)
  // is rendered directly inside the Header component via conditional rendering.
  // This wrapper exists for potential future use as a portal-based dropdown.
  return null;
}

// --- The actual dropdown component used inside Header ---
export function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const notifikasiList = useStore((s) => s.notifikasiList);
  const markRead = useStore((s) => s.markNotifikasiRead);
  const markAllRead = useStore((s) => s.markAllNotifikasiRead);
  const setView = useStore((s) => s.setView);
  const viewBalitaDetail = useStore((s) => s.viewBalitaDetail);
  const panelRef = useRef<HTMLDivElement>(null);

  const tipeConfig: Record<TipeNotifikasi, { icon: LucideIcon; color: string; bg: string }> = {
    alert: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
    info: { icon: Info, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/10' },
    success: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    reminder: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  };

  if (!open) return null;

  const handleClick = (id: number, linkView?: string, linkId?: number) => {
    markRead(id);
    if (linkView === 'balita-detail' && linkId) {
      viewBalitaDetail(linkId);
    } else if (linkView) {
      setView(linkView as any);
    }
    onClose();
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Panel */}
      <Card
        ref={panelRef}
        className="fixed right-4 top-16 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden p-0 shadow-xl lg:right-6"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Notifikasi</h3>
            {notifikasiList.some((n) => !n.dibaca) && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {notifikasiList.filter((n) => !n.dibaca).length} baru
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllRead}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Tandai semua dibaca"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifikasiList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">Tidak ada notifikasi</p>
              <p className="text-xs text-muted-foreground">Anda sudah melihat semua</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifikasiList.map((n) => {
                const config = tipeConfig[n.tipe];
                const Icon = config.icon;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n.id, n.linkView, n.linkId)}
                      className={`flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-muted/50 ${!n.dibaca ? 'bg-emerald-50/40 dark:bg-emerald-500/5' : ''}`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{n.judul}</p>
                          {!n.dibaca && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.pesan}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{formatTime(n.timestamp)}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {notifikasiList.length > 0 && (
          <div className="border-t border-border p-2">
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={markAllRead}>
              Tandai semua sebagai dibaca
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
