// typescript
// File: `src/dashboards/CoordinatorDashboard.tsx`
import React from "react"
import AppSidebar from "@/components/Sidebar"
import DashboardHome from "@/components/DashboardHome"
import CoordinatorPanel from "@/features/registration/CoordinatorPanel"
import CoordinatorEvaluation from "@/features/Proposal_Evaluation/CoordinatorEvaluation"
import CoordinatorScheduling from "@/features/Scheduling/CoordinatorScheduling"
import CoordinatorProgressTracking from "@/features/ProgressTracking/CoordinatorProgressTracking"
import CoordinatorEvalGrading from "@/features/EvaluationandGrading/CoordinatorEvalGrading"
import CoordinatorInterimEval from "@/features/Interim_Evaluation/CoordinatorInterimEval"

export default function CoordinatorDashboard({ onLogout }: { onLogout?: () => void }) {
    // include 'schedule' view so the Sidebar's 'schedule' key can show the scheduling UI
    const [view, setView] = React.useState<"home" | "registration" | "proposal" | "schedule" | "progress" | "grading" | "interim">("home")

    const handleNavigate = (key: string) => {
        if (key === "registration") setView("registration")
        else if (key === "proposal") setView("proposal")
        else if (key === "schedule") setView("schedule")
        else if (key === "progress") setView("progress")
        else if (key === "grading") setView("grading")
        else if (key === "interim") setView("interim")
        else setView("home")
    }

    return (
        <div className="flex h-screen">
            <AppSidebar
                role="Coordinator"
                onSelect={handleNavigate}
            />
            <main className="flex-1 p-6 overflow-auto">
                {view === "home" && <DashboardHome role="Coordinator" onNavigate={handleNavigate} />}
                {view === "registration" && <CoordinatorPanel />}
                {view === "proposal" && <CoordinatorEvaluation />}
                {view === "schedule" && <CoordinatorScheduling />}
                {view === "progress" && <CoordinatorProgressTracking />}
                {view === "grading" && <CoordinatorEvalGrading />}
                {view === "interim" && <CoordinatorInterimEval />}
            </main>
        </div>
    )
}
