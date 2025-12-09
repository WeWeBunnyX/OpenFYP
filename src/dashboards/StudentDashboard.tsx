import React from "react"
import AppSidebar from "@/components/Sidebar"
import DashboardHome from "@/components/DashboardHome"
import StudentForm from "@/features/registration/StudentForm"
import StudentScheduling from "@/features/Scheduling/StudentScheduling"
import StudentEvaluation from "@/features/Proposal_Evaluation/StudentEvaluation"
import StudentProgressTracking from "@/features/ProgressTracking/StudentProgressTracking"
import StudentEvalGrading from "@/features/EvaluationandGrading/StudentEvalGrading"
import StudentInterimEval from "@/features/Interim_Evaluation/StudentInterimEval"

export default function StudentDashboard(props: { onLogout?: () => void }) {
  const [view, setView] = React.useState<"home" | "registration" | "schedule" | "proposal" | "progress" | "grading" | "interim">("home")

  const handleNavigate = (key: string) => {
    if (key === "registration") setView("registration")
    else if (key === "schedule") setView("schedule")
    else if (key === "proposal") setView("proposal")
    else if (key === "progress") setView("progress")
    else if (key === "grading") setView("grading")
    else if (key === "interim") setView("interim")
    else setView("home")
  }

  return (
    <div className="flex h-screen">
      <AppSidebar
        role="Student"
        onSelect={handleNavigate}
      />
      <main className="flex-1 p-6 overflow-auto">
        {view === "home" && <DashboardHome role="Student" onNavigate={handleNavigate} />}
        {view === "registration" && <StudentForm />}
        {view === "schedule" && <StudentScheduling />}
        {view === "proposal" && <StudentEvaluation />}
        {view === "progress" && <StudentProgressTracking />}
        {view === "grading" && <StudentEvalGrading />}
        {view === "interim" && <StudentInterimEval />}
      </main>
    </div>
  )
}
