import React from "react"
import AppSidebar from "@/components/Sidebar"
import DashboardHome from "@/components/DashboardHome"
import StudentForm from "@/features/registration/StudentForm"
import StudentScheduling from "@/features/Scheduling/StudentScheduling"
import StudentEvaluation from "@/features/Proposal_Evaluation/StudentEvaluation"
import StudentProgressTracking from "@/features/ProgressTracking/StudentProgressTracking"
import StudentEvalGrading from "@/features/EvaluationandGrading/StudentEvalGrading"
import StudentInterimEval from "@/features/Interim_Evaluation/StudentInterimEval"
import StudentFinalEvalViva from "@/features/FinalEvaluationandVivas/StudentFinalEvalViva"
import UsersAndRoles from "@/features/UsersAndRoles/UsersAndRoles"

export default function StudentDashboard(props: { onLogout?: () => void }) {
  const [view, setView] = React.useState<"home" | "registration" | "schedule" | "proposal" | "progress" | "grading" | "interim" | "final" | "users">("home")

  const handleNavigate = (key: string) => {
    if (key === "registration") setView("registration")
    else if (key === "schedule") setView("schedule")
    else if (key === "proposal") setView("proposal")
    else if (key === "progress") setView("progress")
    else if (key === "grading") setView("grading")
    else if (key === "interim") setView("interim")
    else if (key === "final") setView("final")
    else if (key === "users") setView("users")
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
        {view === "final" && <StudentFinalEvalViva />}
        {view === "users" && <UsersAndRoles />}
      </main>
    </div>
  )
}
