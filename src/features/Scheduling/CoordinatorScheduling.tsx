// typescript
// File: `src/features/Scheduling/CoordinatorScheduling.tsx`
import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Calendar,
  Clock,
  Users,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
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

export default function CoordinatorScheduling() {
    const { user } = useAuth()
    const [schedules, setSchedules] = React.useState<Schedule[]>([])
    const [loading, setLoading] = React.useState(false)
    const [deletingId, setDeletingId] = React.useState<number | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [interimSchedules, setInterimSchedules] = React.useState<InterimSchedule[]>([])
    const [loadingInterim, setLoadingInterim] = React.useState(false)
    const [deletingInterimId, setDeletingInterimId] = React.useState<number | null>(null)

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
            } else {
                const json = await res.json().catch(() => null)
                const data = (json as { schedules?: Schedule[] } | null) || { schedules: [] }
                setSchedules(data.schedules || [])
            }
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
                setError(prev => prev ? prev + " | " + (body?.message || res.statusText) : (body?.message || res.statusText))
                setInterimSchedules([])
            } else {
                const json = await res.json().catch(() => null)
                const data = (json as { interim_schedules?: InterimSchedule[] } | null) || { interim_schedules: [] }
                setInterimSchedules(data.interim_schedules || [])
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            setError(prev => prev ? prev + " | " + msg : msg)
            setInterimSchedules([])
        } finally {
            setLoadingInterim(false)
        }
    }

    const deleteSchedule = async (id: number) => {
        if (!user) return
        if (user.role !== "Coordinator") {
            setError("Only coordinators can delete schedules")
            toast.error("Only coordinators can delete schedules")
            return
        }
        const ok = window.confirm("Delete this schedule? This will clear the assigned defense for the student.")
        if (!ok) return
        setDeletingId(id)
        try {
            const res = await fetch(`http://localhost:8000/schedules/${id}`, {
                method: "DELETE",
                headers: { "X-User-Email": user.email || "" },
            })
            const body = await res.json().catch(() => null)
            if (!res.ok) {
                const msg = (body as { message?: string } | null)?.message
                setError(msg || res.statusText || "Delete failed")
                toast.error(`Delete failed: ${msg || res.statusText}`)
            } else {
                await load();
                await loadInterim();
                toast.success("Schedule deleted")
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            setError(msg || "Delete failed")
            toast.error(`Delete failed: ${msg}`)
        } finally {
            setDeletingId(null)
        }
    }

    const deleteInterim = async (id: number) => {
        if (!user) return
        if (user.role !== "Coordinator") {
            setError("Only coordinators can delete interim schedules")
            toast.error("Only coordinators can delete interim schedules")
            return
        }
        const ok = window.confirm("Delete this interim schedule?")
        if (!ok) return
        setDeletingInterimId(id)
        try {
            const res = await fetch(`http://localhost:8000/interim_schedules/${id}`, {
                method: "DELETE",
                headers: { "X-User-Email": user.email || "" },
            })
            const body = await res.json().catch(() => null)
            if (!res.ok) {
                const msg = (body as { message?: string } | null)?.message
                setError(msg || res.statusText || "Delete failed")
                toast.error(`Delete failed: ${msg || res.statusText}`)
            } else {
                await loadInterim()
                toast.success("Interim schedule deleted")
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            setError(msg || "Delete failed")
            toast.error(`Delete failed: ${msg}`)
        } finally {
            setDeletingInterimId(null)
        }
    }

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "-"
        return new Date(dateStr).toLocaleString("en-US", {
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
                    <h1 className="text-2xl font-bold tracking-tight">Scheduling</h1>
                    <p className="text-muted-foreground">Manage defense and interim evaluation schedules</p>
                </div>
                <Button onClick={load} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Tabs */}
            <Tabs defaultValue="defense" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="defense" className="gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Defense Schedules ({schedules.length})
                    </TabsTrigger>
                    <TabsTrigger value="interim" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Interim Schedules ({interimSchedules.length})
                    </TabsTrigger>
                </TabsList>

                {/* Defense Schedules Tab */}
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
                                <Card key={s.id} className="overflow-hidden border-l-4 border-l-blue-500">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg">{s.title || "Untitled"}</CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Users className="h-3 w-3" />
                                                    {s.student_email || "Unknown"}
                                                </CardDescription>
                                            </div>
                                            {getStatusBadge(s.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                                                <Calendar className="h-5 w-5 text-blue-600" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Start</p>
                                                    <p className="text-sm font-medium">{formatDate(s.start)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                                                <Clock className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">End</p>
                                                    <p className="text-sm font-medium">{formatDate(s.end)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {s.committee && s.committee.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    Committee Members
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {s.committee.map((member, idx) => (
                                                        <Badge key={idx} variant="outline">{member}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-end pt-2 border-t">
                                            <Button
                                                onClick={() => deleteSchedule(s.id)}
                                                disabled={deletingId === s.id}
                                                variant="destructive"
                                                size="sm"
                                                className="gap-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                {deletingId === s.id ? "Deleting..." : "Delete"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Interim Schedules Tab */}
                <TabsContent value="interim" className="space-y-4">
                    {loadingInterim ? (
                        <Card className="p-8 text-center text-muted-foreground">Loading interim schedules...</Card>
                    ) : interimSchedules.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-muted-foreground">No interim schedules found</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {interimSchedules.map((s) => (
                                <Card key={s.id} className="overflow-hidden border-l-4 border-l-purple-500">
                                    <CardHeader className="pb-3">
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
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                                                <Calendar className="h-5 w-5 text-purple-600" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Start</p>
                                                    <p className="text-sm font-medium">{formatDate(s.start)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                                                <Clock className="h-5 w-5 text-orange-600" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">End</p>
                                                    <p className="text-sm font-medium">{formatDate(s.end)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {s.evaluators && s.evaluators.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    Evaluators
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {s.evaluators.map((evaluator, idx) => (
                                                        <Badge key={idx} variant="outline" className="bg-purple-50">{evaluator}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {s.notes && (
                                            <div className="p-3 rounded-lg bg-muted/50 border">
                                                <p className="text-sm"><span className="font-medium">Notes:</span> {s.notes}</p>
                                            </div>
                                        )}
                                        <div className="flex justify-end pt-2 border-t">
                                            <Button
                                                onClick={() => deleteInterim(s.id)}
                                                disabled={deletingInterimId === s.id}
                                                variant="destructive"
                                                size="sm"
                                                className="gap-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                {deletingInterimId === s.id ? "Deleting..." : "Delete"}
                                            </Button>
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
