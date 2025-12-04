import React from "react"
import Dashboard from "@/Dashboard"

export default function CoordinatorDashboard({ onLogout }: { onLogout?: () => void }) {
  return <Dashboard onLogout={onLogout ?? (() => {})} />
}
