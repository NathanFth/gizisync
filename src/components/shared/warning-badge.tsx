import { AlertTriangle } from "lucide-react";

interface WarningBadgeProps {
  jenisKelamin: "Laki-laki" | "Perempuan" | null | undefined;
}

export function WarningBadge({ jenisKelamin }: WarningBadgeProps) {
  if (jenisKelamin) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
      <div>
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
          Peringatan: Data Jenis Kelamin Kosong!
        </p>
        <p className="mt-0.5 text-sm text-red-600/90 dark:text-red-400/90">
          Algoritma Z-Score WHO tidak dapat memproses status gizi. Segera
          lengkapi data.
        </p>
      </div>
    </div>
  );
}
