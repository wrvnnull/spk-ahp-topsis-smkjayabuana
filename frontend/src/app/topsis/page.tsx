"use client"

import { useRequireAuth } from "@/hooks/useAuthContext"

export default function TopsisPage() {
  useRequireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">TOPSIS</h1>
        <p className="text-muted-foreground">
          Technique for Order Preference by Similarity to Ideal Solution.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-muted">
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Halaman dikembangkan - Fase selanjutnya
          </p>
        </div>
      </div>
    </div>
  )
}
