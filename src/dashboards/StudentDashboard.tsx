import React from "react"
import AppSidebar from "@/components/Sidebar"
import StudentForm from "@/features/registration/StudentForm"
import StudentScheduling from "@/features/Scheduling/StudentScheduling"
import StudentEvaluation from "@/features/Proposal_Evaluation/StudentEvaluation"
import StudentProgressTracking from "@/features/ProgressTracking/StudentProgressTracking"
import StudentEvalGrading from "@/features/EvaluationandGrading/StudentEvalGrading"

export default function StudentDashboard(props: { onLogout?: () => void }) {
  const [view, setView] = React.useState<"home" | "registration" | "schedule" | "proposal" | "progress" | "grading">("home")

  return (
    <div className="flex h-screen">
      <AppSidebar
        role="Student"
        onSelect={(key) =>
          key === "registration"
            ? setView("registration")
            : key === "schedule"
            ? setView("schedule")
            : key === "proposal"
            ? setView("proposal")
            : key === "progress"
            ? setView("progress")
            : key === "grading"
            ? setView("grading")
            : setView("home")
        }
      />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Student Dashboard</h2>
          <div className="flex gap-2">
            <button className="btn" onClick={() => setView("registration")}>Open Registration</button>
            <button className="btn" onClick={() => props.onLogout?.()}>Logout</button>
          </div>
        </div>

        {view === "home" && <div className="w-full max-w-4xl">Student dashboard (placeholder)</div>}
        {view === "registration" && <StudentForm />}
        {view === "schedule" && <StudentScheduling />}
        {view === "proposal" && <StudentEvaluation />}
        {view === "progress" && <StudentProgressTracking />}
        {view === "grading" && <StudentEvalGrading />}
      </main>
    </div>
  )
}
