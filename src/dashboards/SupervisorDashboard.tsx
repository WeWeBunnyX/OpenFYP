import React from "react"
import AppSidebar from "@/components/Sidebar"
import SupervisorPanel from "@/features/registration/SupervisorPanel"
import SupervisorScheduling from "@/features/Scheduling/SupervisorScheduling"
import SupervisorEvaluation from "@/features/Proposal_Evaluation/SupervisorEvaluation"
import SupervisorProgressTracking from "@/features/ProgressTracking/SupervisorProgressTracking"
import SupervisorEvalGrading from "@/features/EvaluationandGrading/SupervisorEvalGrading"

export default function SupervisorDashboard(props: { onLogout?: () => void }) {
  const [view, setView] = React.useState<"home" | "registration" | "schedule" | "proposal" | "progress" | "grading">("home")

  return (
    <div className="flex h-screen">
      <AppSidebar
        role="Supervisor"
        onSelect={(key) => {
          if (key === "registration") return setView("registration")
          if (key === "schedule") return setView("schedule")
          if (key === "proposal") return setView("proposal")
          if (key === "progress") return setView("progress")
          if (key === "grading") return setView("grading")
          return setView("home")
        }}
      />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Supervisor Dashboard</h2>
          <div className="flex gap-2">
            <button className="btn" onClick={() => setView("registration")}>Open Registration</button>
            <button className="btn" onClick={() => props.onLogout?.()}>Logout</button>
          </div>
        </div>

        {view === "home" && <div className="w-full max-w-4xl">Supervisor dashboard (placeholder)</div>}
        {view === "registration" && <SupervisorPanel />}
        {view === "schedule" && <SupervisorScheduling />}
        {view === "proposal" && <SupervisorEvaluation />}
        {view === "progress" && <SupervisorProgressTracking />}
        {view === "grading" && <SupervisorEvalGrading />}
      </main>
    </div>
  )
}
