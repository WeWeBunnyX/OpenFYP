import React from "react"
import AppSidebar from "@/components/Sidebar"
import DashboardHome from "@/components/DashboardHome"
import SupervisorPanel from "@/features/registration/SupervisorPanel"
import SupervisorScheduling from "@/features/Scheduling/SupervisorScheduling"
import SupervisorEvaluation from "@/features/Proposal_Evaluation/SupervisorEvaluation"
import SupervisorProgressTracking from "@/features/ProgressTracking/SupervisorProgressTracking"
import SupervisorEvalGrading from "@/features/EvaluationandGrading/SupervisorEvalGrading"
import SupervisorInterimEval from "@/features/Interim_Evaluation/SupervisorInterimEval"
import SupervisorFinalEvalViva from "@/features/FinalEvaluationandVivas/SupervisorFinalEvalViva"

export default function SupervisorDashboard(props: { onLogout?: () => void }) {
  const [view, setView] = React.useState<"home" | "registration" | "schedule" | "proposal" | "progress" | "grading" | "interim" | "final">("home")

  const handleNavigate = (key: string) => {
    if (key === "registration") setView("registration")
    else if (key === "schedule") setView("schedule")
    else if (key === "proposal") setView("proposal")
    else if (key === "progress") setView("progress")
    else if (key === "grading") setView("grading")
    else if (key === "interim") setView("interim")
    else if (key === "final") setView("final")
    else setView("home")
  }

  return (
    <div className="flex h-screen">
      <AppSidebar
        role="Supervisor"
        onSelect={handleNavigate}
      />
      <main className="flex-1 p-6 overflow-auto">
        {view === "home" && <DashboardHome role="Supervisor" onNavigate={handleNavigate} />}
        {view === "registration" && <SupervisorPanel />}
        {view === "schedule" && <SupervisorScheduling />}
        {view === "proposal" && <SupervisorEvaluation />}
        {view === "progress" && <SupervisorProgressTracking />}
        {view === "grading" && <SupervisorEvalGrading />}
        {view === "interim" && <SupervisorInterimEval />}
        {view === "final" && <SupervisorFinalEvalViva />}
      </main>
    </div>
  )
}
