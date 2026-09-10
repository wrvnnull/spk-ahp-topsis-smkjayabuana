import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/hooks/useAuthContext"
import { Sidebar, Header } from "@/components/layout"

export const metadata: Metadata = {
  title: "SPK AHP-TOPSIS | SMK Jaya Buana",
  description: "Sistem Penunjang Keputusan Menentukan Siswa Berprestasi Metode AHP-TOPSIS - SMK Jaya Buana Kabupaten Tangerang",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar className="w-64" />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 p-6">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
