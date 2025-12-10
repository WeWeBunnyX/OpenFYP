import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Users,
  RefreshCw,
  CheckCircle2,
  Eye,
} from "lucide-react"

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

type InterimSchedule = {
    id: number
    registration_id?: number
    title?: string
    notes?: string
    student_email?: string
    status?: string
    start?: string | null
    end?: string | null
    slot_minutes?: number
    evaluators?: string[]
    created_at?: string
}

export default function SupervisorScheduling() {
    const { user } = useAuth()
    const [schedules, setSchedules] = React.useState<Schedule[]>([])
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [interimSchedules, setInterimSchedules] = React.useState<InterimSchedule[]>([])
    const [loadingInterim, setLoadingInterim] = React.useState(false)

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
        load();
        loadInterim();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.email])

    const loadInterim = async () => {
        setLoadingInterim(true)
        try {
            const res = await fetch("http://localhost:8000/interim_schedules", {
                headers: { "X-User-Email": user?.email || "" },
            })
            if (!res.ok) {
                const body = await res.json().catch(() => null)
                setError(body?.message || res.statusText || "Failed to load interim schedules")
                setInterimSchedules([])
                return
            }
            const json = await res.json().catch(() => null)
            const data = (json as { interim_schedules?: InterimSchedule[] } | null) || { interim_schedules: [] }
            setInterimSchedules(data.interim_schedules || [])
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            setError(msg || "Failed to load interim schedules")
            setInterimSchedules([])
        } finally {
            setLoadingInterim(false)
        }
    }

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "-"

        // If the datetime string has no timezone info (local time), parse it carefully
        // to avoid timezone conversion
        let date: Date
        if (dateStr.includes("Z") || dateStr.includes("+") || dateStr.includes("-")) {
            // Has timezone info, use normally
            date = new Date(dateStr)
        } else {
            // No timezone info, parse as local time
            // Parse the string manually to avoid UTC conversion
            const [datePart, timePart] = dateStr.split("T")
            if (!datePart || !timePart) {
                return dateStr
            }
            const [year, month, day] = datePart.split("-").map(Number)
            const [hour, minute] = timePart.split(":").map(Number)
            date = new Date(year, month - 1, day, hour, minute, 0, 0)
        }

        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case "scheduled":
                return <Badge className="bg-blue-500 gap-1"><Calendar className="h-3 w-3" />Scheduled</Badge>
            case "completed":
                return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" />Completed</Badge>
            default:
                return <Badge variant="outline">{status || "Unknown"}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Student Schedules</h1>
                    <p className="text-muted-foreground">View your students' defense and interim evaluation schedules</p>
                </div>
                <Button onClick={load} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="defense" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="defense" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Defense ({schedules.length})
                    </TabsTrigger>
                    <TabsTrigger value="interim" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Interim ({interimSchedules.length})
                    </TabsTrigger>
                </TabsList>

                {/* Defense Schedules */}
                <TabsContent value="defense" className="space-y-4">
                    {loading ? (
                        <Card className="p-8 text-center text-muted-foreground">Loading schedules...</Card>
                    ) : schedules.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-muted-foreground">No defense schedules found</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {schedules.map((s) => (
                                <Card key={s.id} className="overflow-hidden border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-blue-50">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg">{s.title || "Defense"}</CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Users className="h-3 w-3" />
                                                    {s.student_email || "Unknown"}
                                                </CardDescription>
                                            </div>
                                            {getStatusBadge(s.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                                                <Calendar className="h-6 w-6 text-indigo-600" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-medium">Start Time</p>
                                                    <p className="text-sm font-semibold">{formatDate(s.start)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-50 border border-rose-200">
                                                <Clock className="h-6 w-6 text-rose-600" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-medium">End Time</p>
                                                    <p className="text-sm font-semibold">{formatDate(s.end)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {s.committee && s.committee.length > 0 && (
                                            <div>
                                                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    Committee Members
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {s.committee.map((member, idx) => (
                                                        <Badge key={idx} variant="secondary">{member}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-2">
                                            <Eye className="h-5 w-5 text-indigo-600" />
                                            <p className="text-sm text-indigo-800">View only - Managed by Coordinator</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Interim Schedules */}
                <TabsContent value="interim" className="space-y-4">
                    {loadingInterim ? (
                        <Card className="p-8 text-center text-muted-foreground">Loading interim schedules...</Card>
                    ) : interimSchedules.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-muted-foreground">No interim evaluation schedules found</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {interimSchedules.map((s) => (
                                <Card key={s.id} className="overflow-hidden border-l-4 border-l-pink-500 hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3 bg-gradient-to-r from-pink-50 to-red-50">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg">{s.title || "Interim Evaluation"}</CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Users className="h-3 w-3" />
                                                    {s.student_email || "Unknown"}
                                                </CardDescription>
                                            </div>
                                            {getStatusBadge(s.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 p-4 rounded-lg bg-pink-50 border border-pink-200">
                                                <Calendar className="h-6 w-6 text-pink-600" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-medium">Start Time</p>
                                                    <p className="text-sm font-semibold">{formatDate(s.start)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                                                <Clock className="h-6 w-6 text-amber-600" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-medium">End Time</p>
                                                    <p className="text-sm font-semibold">{formatDate(s.end)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {s.evaluators && s.evaluators.length > 0 && (
                                            <div>
                                                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    Evaluators
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {s.evaluators.map((evaluator, idx) => (
                                                        <Badge key={idx} variant="secondary" className="bg-pink-100">{evaluator}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {s.notes && (
                                            <div className="p-3 rounded-lg bg-muted/50 border">
                                                <p className="text-sm"><span className="font-medium">Notes:</span> {s.notes}</p>
                                            </div>
                                        )}
                                        <div className="p-3 rounded-lg bg-pink-50 border border-pink-200 flex items-center gap-2">
                                            <Eye className="h-5 w-5 text-pink-600" />
                                            <p className="text-sm text-pink-800">View only - Managed by Coordinator</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

