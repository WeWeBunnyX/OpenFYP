import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"

type Schedule = {
    id: number
    registration_id?: number
    title?: string
    proposal?: string
    student_email?: string
    status?: string
    start?: string | null
    end?: string | null
    slot_minutes?: number
    committee?: string[]
    created_at?: string
}

export default function SupervisorScheduling() {
    const { user } = useAuth()
    const [schedules, setSchedules] = React.useState<Schedule[]>([])
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("http://localhost:8000/schedules", {
                headers: { "X-User-Email": user?.email || "" },
            })
            if (!res.ok) {
                const body = await res.json().catch(() => null)
                setError(body?.message || res.statusText || "Failed to load schedules")
                setSchedules([])
                return
            }
            const json = await res.json().catch(() => null)
            const data = (json as { schedules?: Schedule[] } | null) || { schedules: [] }
            setSchedules(data.schedules || [])
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            setError(msg || "Failed to load schedules")
            setSchedules([])
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.email])

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Schedules (Supervisor view)</h2>
                <div className="flex gap-2">
                    <Button onClick={load} variant="outline" size="sm">Refresh</Button>
                </div>
            </div>

            {loading && <div className="mb-2">Loading schedules…</div>}
            {error && <div className="mb-2 text-red-600">{error}</div>}

            <div className="overflow-auto border rounded w-full min-w-0">
                <table className="w-full table-auto">
                    <thead className="text-left bg-gray-50">
                        <tr>
                            <th className="p-2">#</th>
                            <th className="p-2">Title</th>
                            <th className="p-2">Student</th>
                            <th className="p-2">Start</th>
                            <th className="p-2">End</th>
                            <th className="p-2">Committee</th>
                            <th className="p-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedules.length === 0 && !loading && (
                            <tr><td colSpan={7} className="p-4 text-center text-sm text-muted-foreground">No schedules found</td></tr>
                        )}
                        {schedules.map(s => (
                            <tr key={s.id} className="border-t">
                                <td className="p-2 align-top">{s.id}</td>
                                <td className="p-2 align-top">{s.title || "-"}</td>
                                <td className="p-2 align-top">{s.student_email || "-"}</td>
                                <td className="p-2 align-top">{s.start ? new Date(s.start).toLocaleString() : "-"}</td>
                                <td className="p-2 align-top">{s.end ? new Date(s.end).toLocaleString() : "-"}</td>
                                <td className="p-2 align-top text-sm">{s.committee && s.committee.length ? s.committee.join(", ") : "-"}</td>
                                <td className="p-2 align-top">{s.status || "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

