"use client"

import * as React from "react"
import { useRequireAuth } from "@/hooks/useAuthContext"
import { useAuth } from "@/hooks/useAuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"

export default function DashboardPage() {
  const { isLoading: authLoading } = useRequireAuth()
  const { user } = useAuth()
  const [dataLoading, setDataLoading] = React.useState(true)
  const [periods, setPeriods] = React.useState<import("@/types/api").AcademicPeriod[]>([])
  const [criteria, setCriteria] = React.useState<import("@/types/api").Criteria[]>([])
  const [ahpCalculations, setAhpCalculations] = React.useState<import("@/types/api").AhpCalculation[]>([])
  const [topsisRankings, setTopsisRankings] = React.useState<import("@/types/api").TopsisRanking[]>([])
  const [error, setError] = React.useState<string | null>(null)

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Selamat Pagi"
    if (hour < 15) return "Selamat Siang"
    if (hour < 18) return "Selamat Sore"
    return "Selamat Malam"
  }, [])

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [periodsData, criteriaData, ahpData, topsisData] = await Promise.all([
          apiClient.getAcademicPeriods().catch(() => []),
          apiClient.getCriteria().catch(() => []),
          apiClient.getAhpCalculations().catch(() => []),
          apiClient.getTopsisRanking().catch(() => []),
        ])
        setPeriods(periodsData)
        setCriteria(criteriaData)
        setAhpCalculations(ahpData)
        setTopsisRankings(topsisData)
      } catch {
        setError("Gagal memuat data dashboard")
      } finally {
        setDataLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const activePeriod = periods.find((p) => p.is_active) || periods[0]
  const activeCriteria = criteria.filter((c) => c.is_active).length
  const totalCriteria = criteria.length
  const hasAhpResult = ahpCalculations.length > 0
  const hasTopsisResult = topsisRankings.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {greeting}, {user?.name}. Sistem Penunjang Keputusan Menentukan Siswa Berprestasi.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Periode Aktif</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activePeriod ? activePeriod.school_year : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {activePeriod ? activePeriod.semester : "Belum ada"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kriteria Aktif</CardTitle>
            <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCriteria}</div>
            <p className="text-xs text-muted-foreground">dari {totalCriteria} kriteria</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status AHP</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasAhpResult ? (
                <span className="text-green-600">Selesai</span>
              ) : (
                <span className="text-muted-foreground">Pending</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasAhpResult
                ? `${ahpCalculations.length} perhitungan`
                : "Belum ada perhitungan"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status TOPSIS</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v2m1-6V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasTopsisResult ? (
                <span className="text-green-600">Selesai</span>
              ) : (
                <span className="text-muted-foreground">Pending</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasTopsisResult
                ? `${topsisRankings.length} hasil ranking`
                : "Belum ada perhitungan"}
            </p>
          </CardContent>
        </Card>
      </div>

      {user?.role === "SUPER_ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Role</CardTitle>
            <CardDescription>Informasi akses untuk Super Admin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Periodes:</span>
                <span className="font-medium">{periods.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kriteria:</span>
                <span className="font-medium">{totalCriteria}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AHP Calculations:</span>
                <span className="font-medium">{ahpCalculations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TOPSIS Rankings:</span>
                <span className="font-medium">{topsisRankings.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}
