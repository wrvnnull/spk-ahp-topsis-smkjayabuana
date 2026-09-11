"use client"

import * as React from "react"
import { useRequireAuth, useAuth } from "@/hooks/useAuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import type { Criteria } from "@/types/api"

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

export default function CriteriaPage() {
  useRequireAuth()
  const { user } = useAuth()

  const [criteria, setCriteria] = React.useState<Criteria[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [formCode, setFormCode] = React.useState("")
  const [formName, setFormName] = React.useState("")
  const [formType, setFormType] = React.useState<"BENEFIT" | "COST">("BENEFIT")
  const [formDescription, setFormDescription] = React.useState("")
  const [formIsActive, setFormIsActive] = React.useState(true)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  const canManage = user?.role === "SUPER_ADMIN" ? true : false

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getCriteria()
      setCriteria(data)
    } catch {
      setError("Gagal memuat data kriteria")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      try {
        const data = await apiClient.getCriteria().catch(() => [])
        if (!cancelled) setCriteria(data)
      } catch {
        if (!cancelled) setError("Gagal memuat data kriteria")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    doFetch()
    return () => {
      cancelled = true
    }
  }, [fetchData])

  const resetForm = () => {
    setFormCode("")
    setFormName("")
    setFormType("BENEFIT")
    setFormDescription("")
    setFormIsActive(true)
    setEditingId(null)
  }

  const openCreate = () => {
    resetForm()
    setCreateOpen(true)
  }

  const openEdit = (criteriaItem: Criteria) => {
    setFormCode(criteriaItem.code)
    setFormName(criteriaItem.name)
    setFormType(criteriaItem.type)
    setFormDescription(criteriaItem.description || "")
    setFormIsActive(criteriaItem.is_active)
    setEditingId(criteriaItem.id)
    setEditDialogOpen(true)
  }

  const handleCreate = async (_e: React.FormEvent) => {
    _e.preventDefault()
    if (!formCode.trim() || !formName.trim()) return

    setSubmitting(true)
    try {
      await apiClient.createCriteria({
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        type: formType,
        description: formDescription.trim() || undefined,
        is_active: formIsActive,
      })
      setSuccess("Kriteria berhasil ditambahkan")
      setCreateOpen(false)
      resetForm()
      await fetchData()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal menambahkan kriteria")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (_e: React.FormEvent) => {
    _e.preventDefault()
    if (!editingId || !formCode.trim() || !formName.trim()) return

    setSubmitting(true)
    try {
      await apiClient.updateCriteria(editingId, {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        type: formType,
        description: formDescription.trim() || undefined,
        is_active: formIsActive,
      })
      setSuccess("Kriteria berhasil diperbarui")
      setEditDialogOpen(false)
      resetForm()
      await fetchData()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal memperbarui kriteria")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setSubmitting(true)
    try {
      await apiClient.deleteCriteria(deletingId)
      setSuccess("Kriteria dinonaktifkan")
      setDeletingId(null)
      await fetchData()
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal menonaktifkan kriteria")
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

  const typeLabel = (type: "BENEFIT" | "COST") =>
    type === "BENEFIT" ? "Benefit" : "Cost"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kriteria</h1>
          <p className="text-muted-foreground">
            {canManage ? "Kelola kriteria penilaian" : "Daftar kriteria penilaian"}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} disabled={submitting}>
            + Tambah Kriteria
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
      ) : criteria.length === 0 ? (
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-medium">Belum ada kriteria</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tambahkan kriteria untuk memulai penggunaan sistem.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Daftar Kriteria</CardTitle>
            <CardDescription>
              {canManage ? "Kelola kriteria penilaian" : "Daftar kriteria penilaian"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {criteria.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-xs text-muted-foreground">[{c.code}]</span>
                      {!c.is_active && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                      <span className="capitalize">Tipe: {typeLabel(c.type)}</span>
                      {c.description && <span>{c.description}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(c)}
                          disabled={submitting}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingId(c.id)
                          }}
                          disabled={submitting || !c.is_active}
                        >
                          {c.is_active ? "Nonaktifkan" : "Sudah Nonaktif"}
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
          <DialogTitle>Tambah Kriteria</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="c-code">Kode Kriteria</Label>
              <Input
                id="c-code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="Mis. C1"
                required
              />
              <p className="text-xs text-muted-foreground">Akan dikonversi ke huruf kapital.</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="c-name">Nama Kriteria</Label>
              <Input
                id="c-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Mis. Kinerja Akademik"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Tipe</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="c-type"
                    checked={formType === "BENEFIT"}
                    onChange={() => setFormType("BENEFIT")}
                    className="h-4 w-4"
                  />
                  BENEFIT
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="c-type"
                    checked={formType === "COST"}
                    onChange={() => setFormType("COST")}
                    className="h-4 w-4"
                  />
                  COST
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="c-desc">Deskripsi / Keterangan (opsional)</Label>
              <textarea
                id="c-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Keterangan singkat..."
                rows={2}
                className="flex min-h-0 w-full rounded-md border-0 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="c-is_active"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="c-is_active" className="text-sm ml-0">
                Aktifkan kriteria ini
              </Label>
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
              disabled={submitting || !formCode.trim() || !formName.trim()}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <DialogTitle>Edit Kriteria</DialogTitle>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="e-code">Kode Kriteria</Label>
              <Input
                id="e-code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="e-name">Nama Kriteria</Label>
              <Input
                id="e-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Tipe</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="e-type"
                    checked={formType === "BENEFIT"}
                    onChange={() => setFormType("BENEFIT")}
                    className="h-4 w-4"
                  />
                  BENEFIT
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="e-type"
                    checked={formType === "COST"}
                    onChange={() => setFormType("COST")}
                    className="h-4 w-4"
                  />
                  COST
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="e-desc">Deskripsi / Keterangan</Label>
              <textarea
                id="e-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                className="flex min-h-0 w-full rounded-md border-0 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background resize-none"
              />
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
                Aktifkan kriteria ini
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
              disabled={submitting || !formCode.trim() || !formName.trim()}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>

      {deletingId && (
        <Dialog
          open={true}
          onClose={() => setDeletingId(null)}
        >
          <div className="space-y-4">
            <DialogTitle>Nonaktifkan Kriteria</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Tindakan ini akan menonaktifkan kriteria (soft delete). Kriteria tidak akan muncul dalam daftar aktif.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingId(null)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? "Menonaktifkan..." : "Nonaktifkan"}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
