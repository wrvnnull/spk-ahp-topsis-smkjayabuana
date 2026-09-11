"use client"

import * as React from "react"
import { useRequireAuth } from "@/hooks/useAuthContext"
import { useAuth } from "@/hooks/useAuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import type { AcademicPeriod } from "@/types/api"

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

function Dialog({ open, onClose, children, className }: DialogProps) {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleEsc)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative z-50 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg ${className || ""}`}>
        {children}
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
}

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Ya",
  cancelLabel = "Batal",
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <div className="mt-4 text-sm text-muted-foreground">{message}</div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "destructive" ? "destructive" : "default"}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}

function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold">{children}</h2>
}

export default function AcademicPeriodsPage() {
  useRequireAuth()
  const { user } = useAuth()

  const [periods, setPeriods] = React.useState<AcademicPeriod[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [formName, setFormName] = React.useState("")
  const [formSchoolYear, setFormSchoolYear] = React.useState("")
  const [formSemester, setFormSemester] = React.useState<"GANJIL" | "GENAP">("GANJIL")
  const [formIsActive, setFormIsActive] = React.useState(false)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const canManage = user?.role === "SUPER_ADMIN" ? true : false

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getAcademicPeriods()
      setPeriods(data)
    } catch {
      setError("Gagal memuat data periode akademik")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiClient.getAcademicPeriods()
        if (!cancelled) {
          setPeriods(data)
        }
      } catch {
        if (!cancelled) {
          setError("Gagal memuat data periode akademik")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    doFetch()
    return () => {
      cancelled = true
    }
  }, [fetchData])

  const resetForm = () => {
    setFormName("")
    setFormSchoolYear("")
    setFormSemester("GANJIL")
    setFormIsActive(false)
    setEditingId(null)
  }

  const openCreate = () => {
    resetForm()
    setCreateOpen(true)
  }

  const openEdit = (period: AcademicPeriod) => {
    setFormName(period.name)
    setFormSchoolYear(period.school_year)
    setFormSemester(period.semester)
    setFormIsActive(period.is_active)
    setEditingId(period.id)
    setEditDialogOpen(true)
  }

  const handleCreate = async (_e: React.FormEvent) => {
    _e.preventDefault()
    if (!formName.trim() || !formSchoolYear.trim()) return

    setSubmitting(true)
    try {
      await apiClient.createAcademicPeriod({
        name: formName.trim(),
        school_year: formSchoolYear.trim(),
        semester: formSemester,
        is_active: formIsActive,
      })
      setSuccess("Periode akademik berhasil dibuat")
      setCreateOpen(false)
      resetForm()
      await fetchData()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal membuat periode akademik")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (_e: React.FormEvent) => {
    _e.preventDefault()
    if (!editingId || !formName.trim() || !formSchoolYear.trim()) return

    setSubmitting(true)
    try {
      await apiClient.updateAcademicPeriod(editingId, {
        name: formName.trim(),
        school_year: formSchoolYear.trim(),
        semester: formSemester,
        is_active: formIsActive,
      })
      setSuccess("Periode akademik berhasil diperbarui")
      setEditDialogOpen(false)
      resetForm()
      await fetchData()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal memperbarui periode akademik")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setSubmitting(true)
    try {
      await apiClient.deleteAcademicPeriod(deletingId)
      setSuccess("Periode akademik berhasil dihapus")
      setDeleteDialogOpen(false)
      setDeletingId(null)
      await fetchData()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal menghapus periode akademik")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSetActive = async (id: string) => {
    setSubmitting(true)
    try {
      await apiClient.setActiveAcademicPeriod(id)
      setSuccess("Periode akademik aktif berhasil diatur")
      await fetchData()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal mengatur periode aktif")
    } finally {
      setSubmitting(false)
    }
  }

  const extractErrorMessage = (e: unknown): string | null => {
    if (e && typeof e === "object" && "message" in e) {
      const msg = (e as { message: string }).message
      if (typeof msg === "string") return msg
    }
    return null
  }

  const activePeriod = periods.find((p) => p.is_active)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Periode Akademik</h1>
          <p className="text-muted-foreground">
            Kelola periode akademik dan tahun ajaran.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} disabled={submitting}>
            + Tambah Periode
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-600">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Memuat data...</p>
          </div>
        </div>
      ) : periods.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-center">
            <svg
              className="mb-4 h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium">Belum ada periode akademik</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tambahkan periode akademik untuk memulai penggunaan sistem.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Daftar Periode Akademik</CardTitle>
            <CardDescription>Periode yang tersedia di sistem</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {periods.map((period) => (
                <div key={period.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{period.name}</span>
                      {period.is_active && (
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {period.school_year} &bull; Semester {period.semester}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && !period.is_active && activePeriod && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(period.id)}
                        disabled={submitting}
                      >
                        Set Aktif
                      </Button>
                    )}
                    {canManage && period.is_active && activePeriod && activePeriod.id === period.id && (
                      <span className="text-xs text-muted-foreground">Sudah aktif</span>
                    )}
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(period)}
                        disabled={submitting}
                      >
                        Edit
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeletingId(period.id)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={submitting}
                      >
                        Hapus
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <DialogTitle>Tambah Periode Akademik</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Nama Periode</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Mis. Semester Ganjil 2026/2027"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="school_year">Tahun Ajaran</Label>
              <Input
                id="school_year"
                value={formSchoolYear}
                onChange={(e) => setFormSchoolYear(e.target.value)}
                placeholder="2026/2027"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Semester</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="semester"
                    checked={formSemester === "GANJIL"}
                    onChange={() => setFormSemester("GANJIL")}
                    className="h-4 w-4"
                  />
                  GANJIL
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="semester"
                    checked={formSemester === "GENAP"}
                    onChange={() => setFormSemester("GENAP")}
                    className="h-4 w-4"
                  />
                  GENAP
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="is_active" className="text-sm ml-0">
                Aktifkan periode ini
              </Label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting || !formName.trim() || !formSchoolYear.trim()}>
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <DialogTitle>Edit Periode Akademik</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-name">Nama Periode</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nama periode"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-school_year">Tahun Ajaran</Label>
              <Input
                id="edit-school_year"
                value={formSchoolYear}
                onChange={(e) => setFormSchoolYear(e.target.value)}
                placeholder="Tahun ajaran"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Semester</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="edit_semester"
                    checked={formSemester === "GANJIL"}
                    onChange={() => setFormSemester("GANJIL")}
                    className="h-4 w-4"
                  />
                  GANJIL
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="edit_semester"
                    checked={formSemester === "GENAP"}
                    onChange={() => setFormSemester("GENAP")}
                    className="h-4 w-4"
                  />
                  GENAP
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-is_active"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="edit-is_active" className="text-sm ml-0">
                Aktifkan periode ini
              </Label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting || !formName.trim() || !formSchoolYear.trim()}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Periode Akademik"
        message="Apakah Anda yakin ingin menghapus periode ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="destructive"
      />
    </div>
  )
}
