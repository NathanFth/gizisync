"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { BalitaFormModal } from "./balita-form-modal";
import { PengukuranFormModal } from "./pengukuran-form-modal";
import { SearchBar, EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Scale,
  Users,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import type { Balita, JenisKelamin, StatusBalita } from "@/lib/data/types";
import { formatTanggalID } from "@/lib/data/mock-data";
import { toast } from "sonner";

const PAGE_SIZE = 8;

export function BalitaRegisterView() {
  const { balitaList, pengukuranList, viewBalitaDetail, deleteBalita } =
    useStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBalita, setEditingBalita] = useState<Balita | null>(null);
  const [pengukuranModalBalita, setPengukuranModalBalita] =
    useState<Balita | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Balita | null>(null);

  // Advanced filters
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAgeRange, setFilterAgeRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return balitaList.filter((b) => {
      // Search filter - dilindungi dengan Nullish Coalescing (??) agar tahan nilai null
      if (
        q &&
        !(b.namaLengkap ?? "").toLowerCase().includes(q) &&
        !(b.nik ?? "").toLowerCase().includes(q) &&
        !(b.namaIbu ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      // Gender filter - aman karena perbandingan string vs null tetap valid
      if (filterGender !== "all" && b.jenisKelamin !== filterGender)
        return false;
      // Status filter
      if (filterStatus !== "all" && b.status !== filterStatus) return false;
      // Age range filter
      if (filterAgeRange !== "all") {
        const [min, max] = filterAgeRange.split("-").map(Number);
        if (filterAgeRange === "60+") {
          if (b.usiaBulan < 60) return false;
        } else if (b.usiaBulan < min || b.usiaBulan > max) {
          return false;
        }
      }
      return true;
    });
  }, [balitaList, search, filterGender, filterStatus, filterAgeRange]);

  const activeFilterCount = [filterGender, filterStatus, filterAgeRange].filter(
    (f) => f !== "all",
  ).length;

  const clearFilters = () => {
    setFilterGender("all");
    setFilterStatus("all");
    setFilterAgeRange("all");
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleAdd = () => {
    setEditingBalita(null);
    setModalOpen(true);
  };
  const handleEdit = (b: Balita) => {
    setEditingBalita(b);
    setModalOpen(true);
  };
  const handleDelete = (b: Balita) => {
    setDeleteTarget(b);
  };
  const confirmDelete = () => {
    if (deleteTarget) {
      // FIX ERROR 1: Paksa deleteTarget.id menjadi String
      deleteBalita(String(deleteTarget.id));
      toast.success("Data balita dihapus", {
        description: deleteTarget.namaLengkap,
      });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Cari nama, NIK, atau nama ibu..."
              className="flex-1 sm:max-w-xs"
            />
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" /> Filter
              {activeFilterCount > 0 && (
                <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={`ml-1 h-3.5 w-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </Button>
          </div>

          {/* Advanced Filter Panel */}
          {showFilters && (
            <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Filter Lanjutan
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    <X className="h-3 w-3" /> Reset Filter
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Jenis Kelamin
                  </label>
                  <Select
                    value={filterGender}
                    onValueChange={(v) => {
                      setFilterGender(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <Select
                    value={filterStatus}
                    onValueChange={(v) => {
                      setFilterStatus(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Rentang Usia
                  </label>
                  <Select
                    value={filterAgeRange}
                    onValueChange={(v) => {
                      setFilterAgeRange(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Usia</SelectItem>
                      <SelectItem value="0-5">0-5 bulan</SelectItem>
                      <SelectItem value="6-11">6-11 bulan</SelectItem>
                      <SelectItem value="12-23">12-23 bulan</SelectItem>
                      <SelectItem value="24-35">24-35 bulan</SelectItem>
                      <SelectItem value="36-47">36-47 bulan</SelectItem>
                      <SelectItem value="48-59">48-59 bulan</SelectItem>
                      <SelectItem value="60+">60+ bulan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <Button
            onClick={handleAdd}
            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Balita
          </Button>
        </div>

        {/* Table */}
        {pageData.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada data balita"
            description={
              search || activeFilterCount > 0
                ? "Tidak ada hasil yang cocok dengan filter/pencarian Anda."
                : "Tambahkan data balita pertama Anda."
            }
            action={
              !search && activeFilterCount === 0 ? (
                <Button
                  onClick={handleAdd}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> Tambah Balita
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nama Balita</th>
                  <th className="px-4 py-3 font-medium">NIK</th>
                  <th className="px-4 py-3 font-medium">Usia</th>
                  <th className="px-4 py-3 font-medium">Jenis Kelamin</th>
                  <th className="px-4 py-3 font-medium">Nama Ibu</th>
                  <th className="px-4 py-3 font-medium">Pengukuran</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageData.map((b) => {
                  const pengukuranCount = pengukuranList.filter(
                    (p) => p.balitaId === b.id,
                  ).length;
                  return (
                    <tr
                      key={b.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <button
                          // FIX ERROR 2: Paksa b.id menjadi String
                          onClick={() => viewBalitaDetail(String(b.id))}
                          className="font-semibold text-foreground hover:text-emerald-600"
                        >
                          {b.namaLengkap}
                        </button>
                        {/* AUDIT TRAIL */}
                        <div className="mt-0.5 text-[10px] text-muted-foreground/70">
                          {b.createdByNama ?? "Data Migrasi Awal"}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {b.nik || "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.usiaBulan} bln
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-medium ${
                            b.jenisKelamin === "Laki-laki"
                              ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400"
                              : b.jenisKelamin === "Perempuan"
                                ? "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400"
                          }`}
                        >
                          {b.jenisKelamin === "Laki-laki"
                            ? "L"
                            : b.jenisKelamin === "Perempuan"
                              ? "P"
                              : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.namaIbu || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">
                          {pengukuranCount}x
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-medium ${b.status === "Aktif" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400"}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            // FIX ERROR 3: Paksa b.id menjadi String
                            onClick={() => viewBalitaDetail(String(b.id))}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setPengukuranModalBalita(b)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-emerald-600"
                            title="Input Pengukuran"
                          >
                            <Scale className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(b)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-sky-600"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(b)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </Card>

      <BalitaFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        balita={editingBalita}
      />
      {pengukuranModalBalita && (
        <PengukuranFormModal
          open={!!pengukuranModalBalita}
          onOpenChange={(v) => !v && setPengukuranModalBalita(null)}
          balita={pengukuranModalBalita}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Hapus Data Balita"
        description={`Apakah Anda yakin ingin menghapus data "${deleteTarget?.namaLengkap}"? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua riwayat pengukuran terkait.`}
        confirmLabel="Hapus"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
