"use client"

import * as React from "react"
import { useRequireAuth, useAuth } from "@/hooks/useAuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import type { AcademicPeriod, TopsisRanking } from "@/types/api"

interface RankingEntry {
  student_code: string
  rank: number
  nilai_preferensi: number
}

function Badge({ variant = "default", children }: { variant?: "default" | "destructive"; children: React.ReactNode }) {
  return (
    <span className={variant === "destructive" ? "inline-flex items-center rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive" : "inline-flex items-center rounded-full border border-transparent bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"}>
      {children}
    </span>
  )
}

export default function TopsisPage() {
  useRequireAuth()
  const { user } = useAuth()

  const [periods, setPeriods] = React.useState<AcademicPeriod[]>([])
  const [rankings, setRankings] = React.useState<TopsisRanking[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [selectedPeriodId, setSelectedPeriodId] = React.useState("")
  const [refreshKey, setRefreshKey] = React.useState(0)

  const canManage = user?.role === "SUPER_ADMIN" ? true : false

  const extractErrorMessage = (e: unknown): string | null => {
    if (e && typeof e === "object" && "message" in e) {
      const msg = (e as { message: string }).message
      if (typeof msg === "string") return msg
    }
    return null
  }

  React.useEffect(() => {
    const doFetch = async () => {
      try {
        const periodsData = await apiClient.getAcademicPeriods().catch(() => [])
        setPeriods(periodsData)
      } catch {
        setError("Gagal memuat data periode")
      }
    }
    doFetch()
  }, [refreshKey])

  const loadRankings = React.useCallback(async (periodId: string) => {
    if (!periodId) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getTopsisRanking(periodId)
      if (!data || data.length === 0) {
        setRankings([])
      } else {
        setRankings(data)
      }
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal memuat ranking TOPSIS")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!selectedPeriodId) return
    async function doLoad() {
      await loadRankings(selectedPeriodId)
    }
    doLoad()
  }, [selectedPeriodId, loadRankings])

  const handleCalculate = async () => {
    if (!selectedPeriodId || !canManage) return
    setSubmitting(true)
    setError(null)
    try {
      await apiClient.calculateTopsis(selectedPeriodId)
      setSuccess("Perhitungan TOPSIS berhasil")
      setRefreshKey((k) => k + 1)
      await loadRankings(selectedPeriodId)
    } catch (e) {
      const message = extractErrorMessage(e)
      setError(message || "Gagal menghitung TOPSIS")
    } finally {
      setSubmitting(false)
    }
  }

  // Flatten ranking ke array terurut
  const rankingEntries: RankingEntry[] = React.useMemo(() => {
    const entries: RankingEntry[] = []
    for (const r of rankings) {
      if (r.rank) {
        const sorted = Object.entries(r.rank)
          .map(([code, rank]) => ({
            student_code: code,
            rank,
            nilai_preferensi: r.preference_value?.[code] ?? 0,
          }))
          .sort((a, b) => a.rank - b.rank)
        entries.push(...sorted)
      }
    }
    return entries
  }, [rankings])

  // Ambil bobot AHP dari ranking pertama (jika ada)
  const ahpInfo = rankings.length > 0 ? rankings[0].ahp : null
  const hasAHP = ahpInfo !== null && ahpInfo !== undefined

  if (loading && !selectedPeriodId) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">TOPSIS</h1>
          <p className="text-muted-foreground">
            Technique for Order Preference by Similarity to Ideal Solution.
          </p>
        </div>
        {canManage && (
          <Button onClick={handleCalculate} disabled={submitting || !selectedPeriodId}>
            {submitting ? "Menghitung..." : "Hitung TOPSIS"}
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

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filter Data</CardTitle>
          <CardDescription>Pilih periode akademik untuk melihat/mengelola hasil TOPSIS.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
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
            {periods.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Belum ada periode. Buat periode terlebih dahulu.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {hasAHP && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Status AHP</CardTitle>
            <CardDescription>Bobot AHP yang digunakan untuk perhitungan TOPSIS.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Perhitungan AHP:</span>
                <span className="font-medium">
                  {ahpInfo?.is_valid ? (
                    <Badge>Valid (CR ≤ 0.10)</Badge>
                  ) : (
                    <Badge variant="destructive">Tidak Valid (CR lebih dari 0.10)</Badge>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">λ max:</span>
                <span className="font-medium">{ahpInfo?.lambda_max?.toFixed(4) ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CI:</span>
                <span className="font-medium">{ahpInfo?.ci.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CR:</span>
                <span className="font-medium">{ahpInfo?.cr !== null ? ahpInfo.cr.toFixed(4) : "-"}</span>
              </div>
              <div className="pt-2">
                <span className="text-muted-foreground text-xs">Bobot kriteria:</span>
              </div>
              {ahpInfo?.weight_vector && Object.entries(ahpInfo.weight_vector).map(([code, weight]: [string, number]) => (
                <div key={code} className="text-xs flex justify-between">
                  <span className="text-muted-foreground">{code}:</span>
                  <span className="font-medium">{weight.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasAHP && selectedPeriodId && (
        <Card>
          <CardContent className="flex h-24 flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada perhitungan AHP untuk periode ini. Lakukan perhitungan AHP terlebih dahulu.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedPeriodId && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Hasil Ranking TOPSIS</CardTitle>
                <CardDescription>
                  Ranking siswa berdasarkan nilai preferensi (semakin tinggi, semakin baik).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {rankingEntries.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {!hasAHP
                    ? "Belum ada data. Lakukan perhitungan AHP dan TOPSIS terlebih dahulu."
                    : "Belum ada ranking untuk periode ini."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 text-sm font-semibold">No</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Kode Siswa</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Nilai Preferensi</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingEntries.map((entry) => (
                      <tr key={entry.student_code} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm text-muted-foreground">{entry.rank}</td>
                        <td className="px-4 py-3 font-medium">{entry.student_code}</td>
                        <td className="px-4 py-3 text-sm">{entry.nilai_preferensi.toFixed(5)}</td>
                        <td className="px-4 py-3">
                          <Badge>{entry.rank}</Badge>
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

      {/* History section */}
      {selectedPeriodId && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Histori Perhitungan</CardTitle>
            <CardDescription>
              Riwayat perhitungan TOPSIS untuk periode terpilih.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {rankings.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Belum ada riwayat perhitungan untuk periode ini.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {rankings.map((r) => {
                  const studentCount = r.rank ? Object.keys(r.rank).length : 0
                  const hasRanking = r.rank && studentCount > 0

                  return (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center gap-4 p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">
                          {r.academic_period_name || `Periode ${r.academic_period_id.slice(0, 8)}`}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {r.calculated_at
                            ? new Date(r.calculated_at).toLocaleString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Tanggal tidak tersedia"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasRanking ? (
                          <Badge>
                            {studentCount} siswa
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Tanpa ranking
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedPeriodId && (
        <Card>
          <CardContent className="flex h-32 flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              Pilih periode akademik untuk melihat hasil ranking TOPSIS.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
