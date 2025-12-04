import React from "react"
import AppSidebar from "@/components/Sidebar"

export default function CommitteeDashboard({ onLogout }: { onLogout?: () => void }) {
  return (
    <div className="flex h-screen">
      <AppSidebar role="Committee" />
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl p-6">Committee dashboard (placeholder)</div>
      </main>
    </div>
  )
}
