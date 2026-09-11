"use client"

import * as React from "react"
import { useRequireAuth, useAuth } from "@/hooks/useAuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import type { AcademicPeriod, ClassRoom, Criteria, Score } from "@/types/api"

export default function ScoresPage() {
  useRequireAuth()
  const { user } = useAuth()

  const [periods, setPeriods] = React.useState<AcademicPeriod[]>([])
  const [classes, setClasses] = React.useState<ClassRoom[]>([])
  const [students, setStudents] = React.useState<
    Array<{ id: string; name: string; student_code: string | null; class_id: string; is_active: boolean }>
  >([])
  const [criteria, setCriteria] = React.useState<Criteria[]>([])
  const [scores, setScores] = React.useState<Score[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [selectedPeriodId, setSelectedPeriodId] = React.useState("")
  const [selectedClassId, setSelectedClassId] = React.useState("")
  const [refreshKey, setRefreshKey] = React.useState(0)

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

  const filteredStudents = React.useMemo(() => {
    if (!selectedClassId) return students
    return students.filter((s) => s.class_id === selectedClassId)
  }, [students, selectedClassId])

  React.useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const [periodsData, classesData, studentsData, criteriaData, scoresData] =
          await Promise.all([
            apiClient.getAcademicPeriods().catch(() => []),
            apiClient.getClasses().catch(() => []),
            apiClient.getStudents().catch(() => []),
            apiClient.getCriteria().catch(() => []),
            apiClient.getScores().catch(() => []),
          ])
        if (!cancelled) {
          setPeriods(periodsData)
          setClasses(classesData)
          setStudents(studentsData)
          setCriteria(criteriaData)
          setScores(scoresData)
        }
      } catch {
        if (!cancelled) {
          setError("Gagal memuat data nilai")
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
  }, [refreshKey])

  const scoreMap = React.useMemo(() => {
    const m = new Map<string, Score>()
    scores.forEach((sc) => {
      if (sc.academic_period_id === selectedPeriodId) {
        m.set(`${sc.student_id}:${sc.criteria_id}`, sc)
      }
    })
    return m
  }, [scores, selectedPeriodId])

  const extractErrorMessage = (e: unknown): string | null => {
    if (e && typeof e === "object" && "message" in e) {
      const msg = (e as { message: string }).message
      if (typeof msg === "string") return msg
    }
    return null
  }

  const handleSaveAll = async () => {
    if (!selectedPeriodId || !canManage || filteredStudents.length === 0 || criteria.length === 0) return
    setSubmitting(true)
    try {
      const payload = filteredStudents.flatMap((s) =>
        criteria.map((c) => {
          const key = `${s.id}:${c.id}`
          const existing = scoreMap.get(key)
          const value = existing?.value ?? null
          const isMissing = existing?.is_missing ?? true
          return {
            student_id: s.id,
            criteria_id: c.id,
            academic_period_id: selectedPeriodId,
            value: !isMissing && value !== null ? value : undefined,
            is_missing: isMissing,
            note: existing?.note ?? undefined,
          }
        })
      )
      await apiClient.createBulkScores(payload)
      setSuccess("Nilai berhasil disimpan")
      setRefreshKey((k) => k + 1)
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal menyimpan nilai")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat data nilai...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Nilai Siswa</h1>
          <p className="text-muted-foreground">
            {canManage
              ? "Input dan kelola nilai siswa"
              : "Lihat data nilai siswa"}
          </p>
        </div>
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

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filter Data</CardTitle>
          <CardDescription>
            Pilih periode akademik dan kelas untuk meload data nilai.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="filter-period">Periode Akademik</Label>
              <select
                id="filter-period"
                value={selectedPeriodId}
                onChange={(e) => {
                  setSelectedPeriodId(e.target.value)
                  setRefreshKey((k) => k + 1)
                }}
                className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background"
              >
                <option value="">Pilih periode...</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.school_year} - {p.semester})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="filter-class">Kelas</Label>
              <select
                id="filter-class"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value)
                  setRefreshKey((k) => k + 1)
                }}
                className="flex h-10 w-full rounded-md border-0 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background"
              >
                <option value="">Semua kelas</option>
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {isGuru && (
              <span>
                Anda memiliki{" "}
                <span className="font-medium">{ownedClassIds.length}</span> kelas yang
                diwali.
              </span>
            )}
            {!isGuru && (
              <span>
                Anda dapat mengelola data nilai seluruh siswa.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPeriodId && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  Daftar Nilai —{" "}
                  {periods.find((p) => p.id === selectedPeriodId)?.name}
                </CardTitle>
                <CardDescription>
                  {selectedClassId
                    ? `Kelas: ${availableClasses.find((c) => c.id === selectedClassId)?.name}`
                    : "Semua kelas"}
                </CardDescription>
              </div>
              {canManage && (
                <Button onClick={handleSaveAll} disabled={submitting}>
                  {submitting ? "Menyimpan..." : "Simpan Semua"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredStudents.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center py-8">
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
                  Tidak ada siswa untuk periode dan kelas yang dipilih.
                </p>
              </div>
            ) : criteria.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center py-8">
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
                  Tambahkan kriteria terlebih dahulu di halaman Kriteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 text-sm font-semibold">Siswa</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Kode</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Kelas</th>
                      {criteria.map((c) => (
                        <th key={c.id} className="text-left px-4 py-3 text-sm font-semibold">
                          {c.code}
                          <span className="block text-xs font-normal text-muted-foreground">
                            {c.name}
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-sm font-semibold text-right">
                        {canManage ? "Aksi" : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <span className="font-medium">{student.name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {student.student_code || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {classes.find((c) => c.id === student.class_id)?.name || "-"}
                        </td>
                        {criteria.map((c) => {
                          const key = `${student.id}:${c.id}`
                          const existing = scoreMap.get(key)
                          const value = existing?.value ?? null
                          const isMissing = existing?.is_missing ?? true
                          return (
                            <td key={c.id} className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={isMissing ? "" : (value ?? "")}
                                  placeholder="..."
                                  className="h-8 w-20 text-center"
                                  disabled={!canManage}
                                  onChange={(e) => {
                                    if (!canManage) return
                                    const raw = e.target.value
                                    if (raw === "") {
                                      setScores((prev) =>
                                        prev.map((sc) =>
                                          sc.student_id === student.id &&
                                          sc.criteria_id === c.id &&
                                          sc.academic_period_id === selectedPeriodId
                                            ? { ...sc, value: null, is_missing: true }
                                            : sc
                                        )
                                      )
                                    } else {
                                      const num = Number(raw)
                                      setScores((prev) =>
                                        prev.map((sc) =>
                                          sc.student_id === student.id &&
                                          sc.criteria_id === c.id &&
                                          sc.academic_period_id === selectedPeriodId
                                            ? { ...sc, value: num, is_missing: false }
                                            : sc
                                        )
                                      )
                                    }
                                  }}
                                />
                                {canManage && (
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-input"
                                    checked={isMissing}
                                    onChange={(e) => {
                                      setScores((prev) =>
                                        prev.map((sc) =>
                                          sc.student_id === student.id &&
                                          sc.criteria_id === c.id &&
                                          sc.academic_period_id === selectedPeriodId
                                            ? {
                                                ...sc,
                                                is_missing: e.target.checked,
                                                value: e.target.checked ? null : sc.value,
                                              }
                                            : sc
                                        )
                                      )
                                    }}
                                  />
                                )}
                              </div>
                              {isMissing && (
                                <span className="text-xs text-muted-foreground">
                                  Missing
                                </span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-right">
                          {canManage && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSaveAll}
                              disabled={submitting}
                            >
                              Simpan
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}