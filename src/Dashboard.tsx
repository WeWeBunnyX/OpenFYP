import React from "react";
import { Button } from "@/components/ui/button";
import AppSidebar from "@/components/Sidebar";

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
    return (
        <div className="flex h-screen">
            <AppSidebar role="Coordinator" />
            <main className="flex-1">
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                    <div className="w-full max-w-4xl bg-white rounded-lg shadow p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-semibold">Dashboard</h1>
                            <Button variant="ghost" onClick={onLogout}>
                                Logout
                            </Button>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Welcome — this is the dashboard. Replace with your real content, or
                            add nested routes/components as needed.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
