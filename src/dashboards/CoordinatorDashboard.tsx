// typescript
// File: `src/dashboards/CoordinatorDashboard.tsx`
import React from "react"
import AppSidebar from "@/components/Sidebar"
import CoordinatorPanel from "@/features/registration/CoordinatorPanel"
import CoordinatorEvaluation from "@/features/Proposal_Evaluation/CoordinatorEvaluation"
import CoordinatorScheduling from "@/features/Scheduling/CoordinatorScheduling"
import CoordinatorProgressTracking from "@/features/ProgressTracking/CoordinatorProgressTracking"
import CoordinatorEvalGrading from "@/features/EvaluationandGrading/CoordinatorEvalGrading"
import CoordinatorInterimEval from "@/features/Interim_Evaluation/CoordinatorInterimEval"

export default function CoordinatorDashboard({ onLogout }: { onLogout?: () => void }) {
    // include 'schedule' view so the Sidebar's 'schedule' key can show the scheduling UI
    const [view, setView] = React.useState<"home" | "registration" | "proposal" | "schedule" | "progress" | "grading" | "interim">("home")

    return (
        <div className="flex h-screen">
            <AppSidebar
                role="Coordinator"
                onSelect={(key) =>
                    key === "registration"
                        ? setView("registration")
                        : key === "proposal"
                        ? setView("proposal")
                        : key === "schedule"
                        ? setView("schedule")
                        : key === "progress"
                        ? setView("progress")
                        : key === "grading"
                        ? setView("grading")
                        : key === "interim"
                        ? setView("interim")
                        : setView("home")
                }
            />
            <main className="flex-1 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Coordinator Dashboard</h2>
                </div>

                {view === "home" && <div className="w-full max-w-4xl">Coordinator dashboard (placeholder)</div>}
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
