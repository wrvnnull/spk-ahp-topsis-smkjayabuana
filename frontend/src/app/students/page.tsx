"use client"

import * as React from "react"
import { useRequireAuth, useAuth } from "@/hooks/useAuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import type { Student, ClassRoom } from "@/types/api"

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

function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold">{children}</h2>
}

export default function StudentsPage() {
  useRequireAuth()
  const { user } = useAuth()

  const [students, setStudents] = React.useState<Student[]>([])
  const [classes, setClasses] = React.useState<ClassRoom[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [formName, setFormName] = React.useState("")
  const [formStudentCode, setFormStudentCode] = React.useState("")
  const [formClassId, setFormClassId] = React.useState("")
  const [formIsActive, setFormIsActive] = React.useState(true)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [viewScoresOpen, setViewScoresOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  const [scoresData, setScoresData] = React.useState<{
    student_id: string
    scores: import("@/types/api").Score[]
  } | null>(null)
  const [scoresLoading, setScoresLoading] = React.useState(false)

  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "GURU" ? true : false
  const isGuru = user?.role === "GURU"
  const ownedClassIds = React.useMemo(
    () => user?.owned_class_ids || [],
    [user?.owned_class_ids]
  )

  const availableClasses = React.useMemo(() => {
    if (!isGuru) return classes
    return classes.filter((c) => ownedClassIds.includes(c.id))
  }, [classes, isGuru, ownedClassIds])

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getStudents()
      setStudents(data)
    } catch {
      setError("Gagal memuat data siswa")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClasses = React.useCallback(async () => {
    try {
      const data = await apiClient.getClasses()
      setClasses(data)
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      try {
        const [studentsData, classesData] = await Promise.all([
          apiClient.getStudents().catch(() => []),
          apiClient.getClasses().catch(() => []),
        ])
        if (!cancelled) {
          setStudents(studentsData)
          setClasses(classesData)
        }
      } catch {
        if (!cancelled) {
          setError("Gagal memuat data siswa")
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
  }, [fetchData, fetchClasses])

  const resetForm = () => {
    setFormName("")
    setFormStudentCode("")
    setFormClassId("")
    setEditingId(null)
  }

  const openCreate = () => {
    resetForm()
    setCreateOpen(true)
  }

  const openEdit = (student: Student) => {
    setFormName(student.name)
    setFormStudentCode(student.student_code || "")
    setFormClassId(student.class?.id || "")
    setFormIsActive(student.is_active)
    setEditingId(student.id)
    setEditDialogOpen(true)
  }

  const openViewScores = async (studentId: string) => {
    setScoresLoading(true)
    setScoresData(null)
    try {
      const data = await apiClient.getStudentScores(studentId)
      setScoresData(data)
      setViewScoresOpen(true)
    } catch {
      setError("Gagal memuat nilai siswa")
    } finally {
      setScoresLoading(false)
    }
  }

  const handleCreate = async (_e: React.FormEvent) => {
    _e.preventDefault()
    if (!formName.trim() || !formClassId)
      return

    setSubmitting(true)
    try {
      await apiClient.createStudent({
        name: formName.trim(),
        student_code: formStudentCode.trim() || undefined,
        class_id: formClassId,
      })
      setSuccess("Siswa berhasil ditambahkan")
      setCreateOpen(false)
      resetForm()
      await fetchData()
      await fetchClasses()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal menambahkan siswa")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (_e: React.FormEvent) => {
    _e.preventDefault()
    if (!editingId || !formName.trim() || !formClassId)
      return

    setSubmitting(true)
    try {
      await apiClient.updateStudent(editingId, {
        name: formName.trim(),
        student_code: formStudentCode.trim() || undefined,
        class_id: formClassId,
      })
      setSuccess("Siswa berhasil diperbarui")
      setEditDialogOpen(false)
      resetForm()
      await fetchData()
      await fetchClasses()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal memperbarui siswa")
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

  const classRoomName = (student: Student) => {
    if (!student.class)
      return "-"
    return student.class.name
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Siswa</h1>
          <p className="text-muted-foreground">
            {isGuru
              ? "Siswa di kelas yang Anda wali"
              : canManage
              ? "Kelola data siswa"
              : "Daftar siswa"}
          </p>
          {isGuru && ownedClassIds.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Anda memiliki {ownedClassIds.length} kelas yang diwali.
            </p>
          )}
        </div>
        {canManage && (
          <Button onClick={openCreate} disabled={submitting}>
            + Tambah Siswa
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
      ) : students.length === 0 ? (
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1m6 1v1m-6-1h6M9 7a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium">Belum ada siswa</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tambahkan siswa untuk memulai penggunaan sistem.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Daftar Siswa</CardTitle>
            <CardDescription>
              {isGuru
                ? "Siswa di kelas yang Anda wali"
                : canManage
                ? "Kelola data siswa"
                : "Daftar siswa"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {students.map((student) => (
                <div key={student.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{student.name}</span>
                      {!student.is_active && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Tidak Aktif
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                      <span>Kelas: {classRoomName(student)}</span>
                      {student.student_code && <span>Kode: {student.student_code}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(student)}
                          disabled={submitting}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewScores(student.id)}
                          disabled={submitting || scoresLoading}
                        >
                          Nilai
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

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <DialogTitle>Tambah Siswa</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="s-name">Nama Siswa</Label>
              <Input
                id="s-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nama lengkap siswa"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="s-code">Kode Siswa (opsional)</Label>
              <Input
                id="s-code"
                value={formStudentCode}
                onChange={(e) => setFormStudentCode(e.target.value)}
                placeholder="Mis. S001"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="s-class">Kelas</Label>
              <select
                id="s-class"
                value={formClassId}
                onChange={(e) => setFormClassId(e.target.value)}
                className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background"
                required
              >
                <option value="">Pilih kelas...</option>
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {availableClasses.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isGuru
                    ? "Anda tidak memiliki kelas yang diwali."
                    : "Belum ada kelas. Buat kelas terlebih dahulu."}
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
              disabled={submitting || !formName.trim() || !formClassId}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <DialogTitle>Edit Siswa</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="e-name">Nama Siswa</Label>
              <Input
                id="e-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="e-code">Kode Siswa</Label>
              <Input
                id="e-code"
                value={formStudentCode}
                onChange={(e) => setFormStudentCode(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="e-class">Kelas</Label>
              <select
                id="e-class"
                value={formClassId}
                onChange={(e) => setFormClassId(e.target.value)}
                className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background"
                required
              >
                <option value="">Pilih kelas...</option>
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="e-is_active"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="e-is_active" className="text-sm ml-0">
                Aktifkan siswa
              </Label>
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
              disabled={submitting || !formName.trim() || !formClassId}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={viewScoresOpen}
        onClose={() => {
          setViewScoresOpen(false)
          setScoresData(null)
        }}
      >
        <div className="space-y-4">
          <DialogTitle>Nilai Siswa</DialogTitle>
          {scoresLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="ml-3 text-sm text-muted-foreground">Memuat nilai...</p>
            </div>
          ) : scoresData && scoresData.scores.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scoresData.scores.map((score) => (
                <div key={score.id} className="rounded-lg border bg-card p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {score.criteria?.name || "Kriteria"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {score.criteria?.code} &bull;{" "}
                        {score.academicPeriod?.school_year} {score.academicPeriod?.semester}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {score.is_missing ? (
                          "-"
                        ) : (
                          score.value?.toString()
                        )}
                      </div>
                      {score.is_missing && (
                        <div className="text-xs text-muted-foreground">
                          Missing
                        </div>
                      )}
                    </div>
                  </div>
                  {score.note && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {score.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : scoresData ? (
            <div className="flex h-32 items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada nilai untuk siswa ini.
              </p>
            </div>
          ) : null}
        </div>
      </Dialog>
    </div>
  )
}
