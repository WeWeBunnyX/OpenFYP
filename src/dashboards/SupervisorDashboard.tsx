import React from "react"
import AppSidebar from "@/components/Sidebar"
import SupervisorPanel from "@/features/registration/SupervisorPanel"

export default function SupervisorDashboard({ onLogout }: { onLogout?: () => void }) {
  const [view, setView] = React.useState<"home" | "registration">("home")

  return (
    <div className="flex h-screen">
      <AppSidebar role="Supervisor" onSelect={(key) => key === "registration" ? setView("registration") : setView("home")} />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Supervisor Dashboard</h2>
          <div>
            <button className="btn" onClick={() => setView("registration")}>Open Registration</button>
          </div>
        </div>

        {view === "home" && <div className="w-full max-w-4xl">Supervisor dashboard (placeholder)</div>}
        {view === "registration" && <SupervisorPanel />}
      </main>
    </div>
  )
}
