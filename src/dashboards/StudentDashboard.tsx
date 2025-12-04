import React from "react"
import AppSidebar from "@/components/Sidebar"

export default function StudentDashboard({ onLogout }: { onLogout?: () => void }) {
  return (
    <div className="flex h-screen">
      <AppSidebar role="Student" />
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl p-6">Student dashboard (placeholder)</div>
      </main>
    </div>
  )
}
