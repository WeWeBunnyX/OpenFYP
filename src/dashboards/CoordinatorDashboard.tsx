// typescript
// File: `src/dashboards/CoordinatorDashboard.tsx`
import React from "react"
import AppSidebar from "@/components/Sidebar"
import CoordinatorPanel from "@/features/registration/CoordinatorPanel"
import CoordinatorEvaluation from "@/features/Proposal_Evaluation/CoordinatorEvaluation"
import CoordinatorScheduling from "@/features/Scheduling/CoordinatorScheduling"

export default function CoordinatorDashboard({ onLogout }: { onLogout?: () => void }) {
    // include 'schedule' view so the Sidebar's 'schedule' key can show the scheduling UI
    const [view, setView] = React.useState<"home" | "registration" | "proposal" | "schedule">("home")

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
                        : setView("home")
                }
            />
            <main className="flex-1 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Coordinator Dashboard</h2>
                    <div className="flex gap-2">
                        <button className="btn" onClick={() => setView("proposal")}>Proposal Evaluation</button>
                        <button className="btn" onClick={() => setView("registration")}>Open Registration</button>
                        <button className="btn" onClick={() => setView("schedule")}>Scheduling</button>
                    </div>
                </div>

                {view === "home" && <div className="w-full max-w-4xl">Coordinator dashboard (placeholder)</div>}
                {view === "registration" && <CoordinatorPanel />}
                {view === "proposal" && <CoordinatorEvaluation />}
                {view === "schedule" && <CoordinatorScheduling />}
            </main>
        </div>
    )
}
