"use client"

import * as React from "react"
import { useRequireAuth } from "@/hooks/useAuthContext"
import { useAuth } from "@/hooks/useAuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import type { ClassRoom, AcademicPeriod } from "@/types/api"

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

function Dialog({ open, onClose, children, className }: DialogProps) {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape")
        onClose()
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

  if (!open)
    return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative z-50 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg ${className || ""}`}
      >
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

export default function ClassesPage() {
  useRequireAuth()
  const { user } = useAuth()

  const [classes, setClasses] = React.useState<ClassRoom[]>([])
  const [periods, setPeriods] = React.useState<AcademicPeriod[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  // Form state
  const [formName, setFormName] = React.useState("")
  const [formAcademicPeriodId, setFormAcademicPeriodId] = React.useState("")
  const [formWaliTeacherId, setFormWaliTeacherId] = React.useState("")

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const canManage = user?.role === "SUPER_ADMIN" ? true : false

  // Guru yang tersedia (dari list kelas yang sudah ada)
  const availableTeachers = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>()
    classes.forEach((c) => {
      const wt = c.wali_teacher
      if (wt && wt.id && !map.has(wt.id)) {
        map.set(wt.id, { id: wt.id, name: wt.name, email: wt.email })
      }
    })
    return Array.from(map.values())
  }, [classes])

  // Period yang tersedia
  const availablePeriods = React.useMemo(() => {
    const map = new Map<string, AcademicPeriod>()
    periods.forEach((p) => {
      if (p.id && !map.has(p.id)) {
        map.set(p.id, p)
      }
    })
    return Array.from(map.values())
  }, [periods])

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const classesData = await apiClient.getClasses()
      setClasses(classesData)
    } catch {
      setError("Gagal memuat data kelas")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPeriods = React.useCallback(async () => {
    try {
      const data = await apiClient.getAcademicPeriods()
      setPeriods(data)
    } catch {
      // ignore - periods used only for dropdown
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      try {
        const [classesData, periodsData] = await Promise.all([
          apiClient.getClasses().catch(() => []),
          apiClient.getAcademicPeriods().catch(() => []),
        ])
        if (!cancelled) {
          setClasses(classesData)
          setPeriods(periodsData)
        }
      } catch {
        if (!cancelled) {
          setError("Gagal memuat data kelas")
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
  }, [fetchData, fetchPeriods])

  const resetForm = () => {
    setFormName("")
    setFormAcademicPeriodId("")
    setFormWaliTeacherId("")
    setEditingId(null)
  }

  const openCreate = () => {
    resetForm()
    setCreateOpen(true)
  }

  const openEdit = (classRoom: ClassRoom) => {
    if (!classRoom.academic_period_id) return
    setFormName(classRoom.name)
    setFormAcademicPeriodId(classRoom.academic_period_id)
    setFormWaliTeacherId(classRoom.wali_teacher_id || "")
    setEditingId(classRoom.id)
    setEditDialogOpen(true)
  }

  const handleCreate = async (_e: React.FormEvent) => {
    _e.preventDefault()
    if (!formName.trim() || !formAcademicPeriodId || !formWaliTeacherId)
      return

    setSubmitting(true)
    try {
      await apiClient.createClass({
        name: formName.trim(),
        academic_period_id: formAcademicPeriodId,
        wali_teacher_id: formWaliTeacherId,
      })
      setSuccess("Kelas berhasil dibuat")
      setCreateOpen(false)
      resetForm()
      await fetchData()
      await fetchPeriods()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal membuat kelas")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (_e: React.FormEvent) => {
    _e.preventDefault()
    if (!editingId || !formName.trim() || !formAcademicPeriodId || !formWaliTeacherId)
      return

    setSubmitting(true)
    try {
      await apiClient.updateClass(editingId, {
        name: formName.trim(),
        academic_period_id: formAcademicPeriodId,
        wali_teacher_id: formWaliTeacherId,
      })
      setSuccess("Kelas berhasil diperbarui")
      setEditDialogOpen(false)
      resetForm()
      await fetchData()
      await fetchPeriods()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal memperbarui kelas")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId)
      return
    setSubmitting(true)
    try {
      await apiClient.deleteClass(deletingId)
      setSuccess("Kelas berhasil dihapus")
      setDeleteDialogOpen(false)
      setDeletingId(null)
      await fetchData()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal menghapus kelas")
    } finally {
      setSubmitting(false)
    }
  }

  const extractErrorMessage = (e: unknown): string | null => {
    if (e && typeof e === "object" && "message" in e) {
      const msg = (e as { message: string }).message
      if (typeof msg === "string")
        return msg
    }
    return null
  }

  const waliTeacherName = (classRoom: ClassRoom) => {
    if (!classRoom.wali_teacher)
      return "-"
    return classRoom.wali_teacher.name
  }

  const periodName = (classRoom: ClassRoom) => {
    if (!classRoom.academic_period)
      return "-"
    const p = classRoom.academic_period
    return `${p.school_year} - ${p.semester}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kelas</h1>
          <p className="text-muted-foreground">
            Kelola kelas dan penugasan wali kelas.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} disabled={submitting}>
            + Tambah Kelas
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
      ) : classes.length === 0 ? (
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium">Belum ada kelas</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tambahkan kelas untuk memulai penggunaan sistem.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Daftar Kelas</CardTitle>
            <CardDescription>
              {canManage
                ? "Kelola kelas dan wali kelas"
                : "Daftar kelas yang Anda kelola"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {classes.map((cr) => (
                <div key={cr.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{cr.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Periode: {periodName(cr)} &bull; Wali: {waliTeacherName(cr)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(cr)}
                          disabled={submitting}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingId(cr.id)
                            setDeleteDialogOpen(true)
                          }}
                          disabled={submitting}
                        >
                          Hapus
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <DialogTitle>Tambah Kelas</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="c-name">Nama Kelas</Label>
              <Input
                id="c-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Mis. Kelas X IPA 1"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="c-period">Periode Akademik</Label>
              <select
                id="c-period"
                value={formAcademicPeriodId}
                onChange={(e) => setFormAcademicPeriodId(e.target.value)}
                className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background"
                required
              >
                <option value="">Pilih periode...</option>
                {availablePeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.school_year} - {p.semester})
                  </option>
                ))}
              </select>
              {availablePeriods.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Belum ada periode. Buat periode terlebih dahulu.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="c-wali">Wali Kelas</Label>
              <select
                id="c-wali"
                value={formWaliTeacherId}
                onChange={(e) => setFormWaliTeacherId(e.target.value)}
                className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background"
                required
              >
                <option value="">Pilih wali kelas...</option>
                {availableTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
              {availableTeachers.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Belum ada guru yang terdaftar sebagai wali kelas.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                !formName.trim() ||
                !formAcademicPeriodId ||
                !formWaliTeacherId
              }
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <DialogTitle>Edit Kelas</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="e-name">Nama Kelas</Label>
              <Input
                id="e-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nama kelas"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="e-period">Periode Akademik</Label>
              <select
                id="e-period"
                value={formAcademicPeriodId}
                onChange={(e) => setFormAcademicPeriodId(e.target.value)}
                className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background"
                required
              >
                <option value="">Pilih periode...</option>
                {availablePeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.school_year} - {p.semester})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="e-wali">Wali Kelas</Label>
              <select
                id="e-wali"
                value={formWaliTeacherId}
                onChange={(e) => setFormWaliTeacherId(e.target.value)}
                className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background"
                required
              >
                <option value="">Pilih wali kelas...</option>
                {availableTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                !formName.trim() ||
                !formAcademicPeriodId ||
                !formWaliTeacherId
              }
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Kelas"
        message="Apakah Anda yakin ingin menghapus kelas ini? Data siswa dan nilai terkait akan terpengaruh."
        confirmLabel="Hapus"
        variant="destructive"
      />
    </div>
  )
}
