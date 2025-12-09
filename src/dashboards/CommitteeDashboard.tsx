import React from "react"
import AppSidebar from "@/components/Sidebar"
import UsersAndRoles from "@/features/UsersAndRoles/UsersAndRoles"

export default function CommitteeDashboard({ onLogout }: { onLogout?: () => void }) {
  const [view, setView] = React.useState<"home" | "users">("home")

  const handleNavigate = (key: string) => {
    if (key === "users") setView("users")
    else setView("home")
  }

  return (
    <div className="flex h-screen">
      <AppSidebar role="Committee" onSelect={handleNavigate} />
      <main className="flex-1 p-6 overflow-auto">
        {view === "home" && (
          <div className="w-full max-w-4xl p-6">Committee dashboard (placeholder)</div>
        )}
        {view === "users" && <UsersAndRoles />}
      </main>
    </div>
  )
}

