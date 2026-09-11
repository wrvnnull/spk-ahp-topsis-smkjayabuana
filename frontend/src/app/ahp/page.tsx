"use client"

import * as React from "react"
import { useRequireAuth, useAuth } from "@/hooks/useAuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import type { AcademicPeriod, Criteria, AhpMatrix, AhpCalculation } from "@/types/api"

// Badge sederhana (mengikuti pola shadcn tanpa import)
function Badge({ variant = "default", children }: { variant?: "default" | "destructive"; children: React.ReactNode }) {
  return (
    <span className={variant === "destructive" ? "inline-flex items-center rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive" : "inline-flex items-center rounded-full border border-transparent bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"}>
      {children}
    </span>
  )
}

interface PairwisePair {
  i: number
  j: number
  iCode: string
  jCode: string
  iId: string
  jId: string
  value: number
}

export default function AhpPage() {
  useRequireAuth()
  const { user } = useAuth()

  const [periods, setPeriods] = React.useState<AcademicPeriod[]>([])
  const [criteria, setCriteria] = React.useState<Criteria[]>([])
  const [matrixData, setMatrixData] = React.useState<AhpMatrix | null>(null)
  const [calculations, setCalculations] = React.useState<AhpCalculation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [selectedPeriodId, setSelectedPeriodId] = React.useState("")
  const [refreshKey, setRefreshKey] = React.useState(0)

  const isSuperAdmin = user?.role === "SUPER_ADMIN"
  const isKepalaSekolah = user?.role === "KEPALA_SEKOLAH"
  const canManage = isSuperAdmin
  const canRead = isSuperAdmin || isKepalaSekolah

  // Generate pairwise pairs (upper triangle only) — nilai bisa diedit, disimpan terpisah
  const [editedValues, setEditedValues] = React.useState<Record<string, number>>({})

  const pairs = React.useMemo(() => {
    const generated: PairwisePair[] = []
    criteria.forEach((c1, i) => {
      criteria.forEach((c2, j) => {
        if (i < j) {
          generated.push({ i, j, iCode: c1.code, jCode: c2.code, iId: c1.id, jId: c2.id, value: 1 })
        }
      })
    })
    return generated
  }, [criteria])



  React.useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const [periodsData, criteriaData] = await Promise.all([
          apiClient.getAcademicPeriods().catch(() => []),
          apiClient.getCriteria().catch(() => []),
        ])
        if (!cancelled) {
          setPeriods(periodsData)
          setCriteria(criteriaData)
        }
      } catch {
        if (!cancelled) setError("Gagal memuat data")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    doFetch()
    return () => { cancelled = true }
  }, [refreshKey])

  const extractErrorMessage = (e: unknown): string | null => {
    if (e && typeof e === "object" && "message" in e) {
      const msg = (e as { message: string }).message
      if (typeof msg === "string") return msg
    }
    return null
  }

  const loadMatrix = React.useCallback(async (periodId: string) => {
    if (!periodId) return
    try {
      const data = await apiClient.getAhpMatrix(periodId)
      setMatrixData(data)
      if (data.criteria && data.matrix) {
        // Sync pair values from matrix
        const updated: Record<string, number> = {}
        pairs.forEach((pair) => {
          const existing = data.matrix[pair.i]?.[pair.j]
          updated[`${pair.iId}|${pair.jId}`] = existing ?? 1
        })
        setEditedValues(updated)
      }
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal memuat matriks")
    }
  }, [pairs])

  const loadCalculations = React.useCallback(async () => {
    try {
      const data = await apiClient.getAhpCalculations()
      setCalculations(data)
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    if (!selectedPeriodId) return
    let cancelled = false
    async function doLoad() {
      await loadMatrix(selectedPeriodId)
      if (!cancelled) loadCalculations()
    }
    doLoad()
    return () => { cancelled = true }
  }, [selectedPeriodId, loadMatrix, loadCalculations])

  const handleBulkSave = async () => {
    if (!selectedPeriodId || !canManage) return
    setSubmitting(true)
    try {
      const payload = pairs.map((pair) => ({
        academic_period_id: selectedPeriodId,
        criteria_i_id: pair.iId,
        criteria_j_id: pair.jId,
        comparison_value: editedValues[`${pair.iId}|${pair.jId}`] ?? pair.value,
      }))
      await apiClient.createBulkAhpComparisons(payload)
      setSuccess("Perbandingan berhasil disimpan")
      setRefreshKey((k) => k + 1)
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal menyimpan perbandingan")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCalculate = async () => {
    if (!selectedPeriodId || !canManage) return
    setSubmitting(true)
    try {
      await apiClient.calculateAHP(selectedPeriodId)
      setSuccess("Perhitungan AHP berhasil")
      setRefreshKey((k) => k + 1)
      await loadMatrix(selectedPeriodId)
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal menghitung AHP")
    } finally {
      setSubmitting(false)
    }
  }

  // Akses AHP hanya untuk SUPER_ADMIN / KEPALA_SEKOLAH
  if (user?.role === "GURU") {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-medium text-destructive">
            Akses AHP dinonaktifkan untuk peran Anda. Hubungi administrator.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat data AHP...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analisis AHP</h1>
          <p className="text-muted-foreground">
            {canManage
              ? "Kelola perbandingan berpasangan dan hitung bobot kriteria"
              : "Lihat hasil perhitungan AHP"}
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
            Pilih periode akademik untuk melihat/mengelola matriks AHP.
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
          </div>
        </CardContent>
      </Card>

      {selectedPeriodId && (
        <>
          {/* Pairwise Comparison (SUPER_ADMIN only) */}
          {canManage && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">Perbandingan Berpasangan</CardTitle>
                    <CardDescription>
                      Isi nilai perbandingan untuk setiap pasangan kriteria (skala 1–9).
                      Reciprocal akan dihitung otomatis oleh sistem.
                    </CardDescription>
                  </div>
                  {pairs.length > 0 && (
                    <Button onClick={handleBulkSave} disabled={submitting}>
                      {submitting ? "Menyimpan..." : "Simpan Semua"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {criteria.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Tidak ada kriteria aktif. Tambahkan kriteria terlebih dahulu.
                    </p>
                  </div>
                ) : criteria.length < 2 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Minimal diperlukan 2 kriteria aktif untuk perhitungan AHP.
                    </p>
                  </div>
                ) : pairs.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Tidak ada pasangan kriteria.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-3 text-sm font-semibold">No</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Kriteria I</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Kriteria J</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Nilai Perbandingan (I vs J)</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Reciprocal (J vs I)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pairs.map((pair, idx) => {
                          const reciprocal = 1 / pair.value
                          return (
                            <tr key={`${pair.iId}-${pair.jId}`} className="border-b hover:bg-muted/30">
                              <td className="px-4 py-3 text-sm text-muted-foreground">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium">{pair.iCode}</td>
                              <td className="px-4 py-3 font-medium">{pair.jCode}</td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  min={1}
                                  max={9}
                                  step={1}
                                  value={editedValues[`${pair.iId}|${pair.jId}`] ?? pair.value}
                                  onChange={(e) => {
                                    const v = Number(e.target.value)
                                    if (v >= 1 && v <= 9) {
                                      setEditedValues((prev) => ({
                                        ...prev,
                                        [`${pair.iId}|${pair.jId}`]: v,
                                      }))
                                    }
                                  }}
                                  className="h-8 w-20 text-center"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {reciprocal.toFixed(3)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Matrix display */}
          {matrixData && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">Matriks Perbandingan</CardTitle>
                    <CardDescription>
                      Matriks terkini untuk periode terpilih ({criteria.length} kriteria).
                    </CardDescription>
                  </div>
                  {canManage && (
                    <Button onClick={handleCalculate} disabled={submitting}>
                      {submitting ? "Menghitung..." : "Hitung AHP"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto p-4">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-2 text-sm font-semibold">Kriteria</th>
                        {matrixData.criteria.map((c) => (
                          <th key={c.id} className="text-center px-4 py-2 text-sm font-semibold">
                            {c.code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixData.criteria.map((rowCriterion, i) => (
                        <tr key={rowCriterion.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-2 font-medium text-left">{rowCriterion.code}</td>
                          {matrixData.criteria.map((colCriterion, j) => (
                            <td key={colCriterion.id} className="px-4 py-2 text-center">
                              {matrixData.matrix[i]?.[j]?.toFixed(3) ?? "1.000"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current period calculation results */}
          {calculations
            .filter((c) => c.academic_period_id === selectedPeriodId)
            .length > 0 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Hasil Perhitungan AHP</CardTitle>
                  <CardDescription>
                    Riwayat perhitungan untuk periode terpilih.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-3 text-sm font-semibold">Tanggal</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">λ max</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">CI</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">CR</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold">Berat Kriteria</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculations
                          .filter((c) => c.academic_period_id === selectedPeriodId)
                          .map((calc) => {
                            const statusBadge = calc.is_valid ? (
                              <Badge>Valid</Badge>
                            ) : (
                              <Badge variant="destructive">Tidak Valid (CR &gt; 0.10)</Badge>
                            )
                            return (
                              <tr key={calc.id} className="border-b hover:bg-muted/30">
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {new Date(calc.calculated_at).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm">{calc.lambda_max?.toFixed(4) ?? "—"}</td>
                                <td className="px-4 py-3 text-sm">{calc.ci.toFixed(4)}</td>
                                <td className="px-4 py-3 text-sm">{calc.cr !== null ? calc.cr.toFixed(4) : "—"}</td>
                                <td className="px-4 py-3">{statusBadge}</td>
                                <td className="px-4 py-3 text-sm">
                                  {calc.weight_vector && Object.entries(calc.weight_vector).map(([code, weight]) => (
                                    <div key={code} className="text-xs">
                                      {code}: {weight.toFixed(4)}
                                    </div>
                                  ))}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Available Calculations (all periods) — for KEPALA_SEKOLAH too */}
          {canRead && calculations.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Histori Perhitungan</CardTitle>
                <CardDescription>
                  Riwayat perhitungan AHP untuk semua periode.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 text-sm font-semibold">Periode</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold">Tanggal</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold">λ max</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold">CI</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold">CR</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold">Anggota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculations.map((calc) => {
                        const statusBadge = calc.is_valid ? (
                          <Badge>Valid</Badge>
                        ) : (
                          <Badge variant="destructive">Tidak Valid</Badge>
                        )
                        return (
                          <tr key={calc.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm">
                              {calc.academic_period_name || "—"}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(calc.calculated_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm">{calc.lambda_max?.toFixed(4) ?? "—"}</td>
                            <td className="px-4 py-3 text-sm">{calc.ci.toFixed(4)}</td>
                            <td className="px-4 py-3 text-sm">{calc.cr !== null ? calc.cr.toFixed(4) : "—"}</td>
                            <td className="px-4 py-3">{statusBadge}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {calc.weight_vector ? Object.keys(calc.weight_vector).length : 0} kriteria
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}