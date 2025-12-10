import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Calendar,
    Clock,
    FileText,
    Users,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Download,
    RefreshCw,
    Trash2,
    CalendarPlus,
    GraduationCap,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronUp,
} from "lucide-react"

type Registration = {
    id: number
    owner: string
    title: string
    abstract?: string
    status?: string
    defense?: {
        start: string
        end: string
        committee: string[]
    }
}

type ProposalEvaluation = {
    id: number
    registration_id?: number
    student_email?: string
    scheduled_start?: string
    scheduled_end?: string
    status?: string
    result?: string
    remarks?: string
    created_at?: string
    updated_at?: string
}

export default function CoordinatorEvaluation() {
    const { user } = useAuth()
    const [registrations, setRegistrations] = React.useState<Registration[]>([])
    const [loading, setLoading] = React.useState(false)
    const [assignState, setAssignState] = React.useState<Record<number, {
        start: string
        end?: string
        slotMinutes: number
        committeeCsv: string
        loading?: boolean
        error?: string | null
        success?: string | null
    }>>({})
    const [interimAssignState, setInterimAssignState] = React.useState<Record<number, {
        start: string
        end?: string
        slotMinutes: number
        evaluatorsCsv: string
        loading?: boolean
        error?: string | null
        success?: string | null
    }>>({})
    const [abstractVisible, setAbstractVisible] = React.useState<Record<number, boolean>>({})
    const [attachmentsMap, setAttachmentsMap] = React.useState<Record<number, any[]>>({})
    const [attachmentsLoadingMap, setAttachmentsLoadingMap] = React.useState<Record<number, boolean>>({})
    const [evaluations, setEvaluations] = React.useState<ProposalEvaluation[]>([])
    const [evaluationDrafts, setEvaluationDrafts] = React.useState<Record<number, {
        result?: string
        remarks?: string
        loading?: boolean
        error?: string | null
        success?: string | null
    }>>({})
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [deleteTargetId, setDeleteTargetId] = React.useState<number | null>(null)
    const [deleting, setDeleting] = React.useState(false)

    React.useEffect(() => {
        fetchRegistrations()
        fetchEvaluations()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.email])

    const fetchEvaluations = async () => {
        try {
            const resp = await fetch("http://localhost:8000/proposal_evaluations", { headers: { "X-User-Email": user?.email || "" } })
            if (!resp.ok) throw new Error(`Failed to load evaluations (${resp.status})`)
            const body = await resp.json()
            const all: ProposalEvaluation[] = body.proposal_evaluations || body || []
            setEvaluations(all)
            const drafts: typeof evaluationDrafts = {}
            all.forEach(ev => {
                drafts[ev.id] = { result: ev.result || undefined, remarks: ev.remarks || undefined }
            })
            setEvaluationDrafts(drafts)
        } catch (err) {
            console.warn('Failed to fetch evaluations', err)
            setEvaluations([])
        }
    }

    const updateDraft = (id: number, patch: Partial<typeof evaluationDrafts[number]>) => {
        setEvaluationDrafts(s => ({ ...s, [id]: { ...(s[id] || {}), ...patch } }))
    }

    const submitEvaluation = async (id: number) => {
        const draft = evaluationDrafts[id]
        if (!draft || !draft.result) {
            toast.error('Select a result (approved or rejected)')
            return
        }
        updateDraft(id, { loading: true, error: null, success: null })
        try {
            const resp = await fetch(`http://localhost:8000/proposal_evaluations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-User-Email': user?.email || '' },
                body: JSON.stringify({ result: draft.result, remarks: draft.remarks || '' })
            })
            const data = await resp.json().catch(() => null)
            if (!resp.ok) {
                const msg = data?.message || resp.statusText
                updateDraft(id, { loading: false, error: msg })
                toast.error(`Save failed: ${msg}`)
            } else {
                updateDraft(id, { loading: false, success: 'Saved' })
                toast.success('Evaluation saved')
                await fetchEvaluations()
                await fetchRegistrations()
            }
        } catch (err) {
            console.error('Submit evaluation failed', err)
            updateDraft(id, { loading: false, error: 'Request failed' })
            toast.error('Save failed: request error')
        }
    }

    const openDeleteDialog = (id: number) => {
        setDeleteTargetId(id)
        setDeleteDialogOpen(true)
    }

    const confirmDeleteEvaluation = async () => {
        if (deleteTargetId === null) return
        setDeleting(true)
        try {
            const resp = await fetch(`http://localhost:8000/proposal_evaluations/${deleteTargetId}`, {
                method: 'DELETE',
                headers: { 'X-User-Email': user?.email || '' }
            })
            if (!resp.ok) {
                const data = await resp.json().catch(() => null)
                toast.error(`Delete failed: ${data?.message || resp.statusText}`)
            } else {
                toast.success('Evaluation deleted')
                // Remove from local state immediately
                setEvaluations(prev => prev.filter(e => e.id !== deleteTargetId))
                setEvaluationDrafts(prev => {
                    const copy = { ...prev }
                    delete copy[deleteTargetId]
                    return copy
                })
            }
        } catch (err) {
            console.error('Delete evaluation failed', err)
            toast.error('Delete failed: request error')
        } finally {
            setDeleting(false)
            setDeleteDialogOpen(false)
            setDeleteTargetId(null)
        }
    }

    const fetchRegistrations = async () => {
        setLoading(true)
        try {
            const resp = await fetch("http://localhost:8000/registrations", { headers: { "X-User-Email": user?.email || "" } })
            if (!resp.ok) throw new Error(`Failed to load (${resp.status})`)
            const body = await resp.json()
            const all: Registration[] = body.registrations || body || []
            // Show proposals that are verified (registered) or already scheduled
            const verified = all.filter(r => r.status === "registered" || r.status === "scheduled" || (r.defense && r.defense.start))
            setRegistrations(verified)
        } catch (err) {
            console.error(err)
            setRegistrations([])
        } finally {
            setLoading(false)
        }
    }

    const openAssign = (id: number) => {
        setAssignState(s => s[id] ? s : {
            ...s,
            [id]: { start: "", slotMinutes: 30, committeeCsv: "", error: null, success: null }
        })
        setInterimAssignState(s => s[id] ? s : {
            ...s,
            [id]: { start: "", slotMinutes: 30, evaluatorsCsv: "", error: null, success: null }
        })
    }

    const toggleAbstract = (id: number) => {
        const next = !abstractVisible[id]
        setAbstractVisible(s => ({ ...s, [id]: next }))
        if (next) {
            fetchAttachments(id)
        }
    }

    const updateAssign = (id: number, patch: Partial<typeof assignState[number]>) => {
        setAssignState(s => ({ ...s, [id]: { ...(s[id] || { start: "", slotMinutes: 30, committeeCsv: "" }), ...patch } }))
    }
    const updateInterimAssign = (id: number, patch: Partial<typeof interimAssignState[number]>) => {
        setInterimAssignState(s => ({ ...s, [id]: { ...(s[id] || { start: "", slotMinutes: 30, evaluatorsCsv: "" }), ...patch } }))
    }

    const toIso = (localValue: string) => {
        if (!localValue) return ""
        // localValue is from datetime-local input (e.g., "2025-12-10T01:00")
        // Just return it as-is without timezone conversion - the backend expects local time
        // Add seconds if missing
        if (localValue.length === 16) {
            return localValue + ":00"
        }
        return localValue
    }

    const handleAssign = async (id: number) => {
        const state = assignState[id]
        if (!state) return
        updateAssign(id, { loading: true, error: null, success: null })
        if (!state.start || !state.committeeCsv) {
            updateAssign(id, { loading: false, error: "Provide start time and committee emails" })
            toast.error("Missing required fields: start time and committee emails")
            return
        }

        try {
            const committee_pool = state.committeeCsv.split(",").map(s => s.trim()).filter(Boolean)
            const body = {
                start: toIso(state.start),
                end: state.end ? toIso(state.end as string) : toIso(state.start),
                slot_minutes: state.slotMinutes,
                committee_pool,
                registration_ids: [id]
            }
            const resp = await fetch("http://localhost:8000/schedule", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Email": user?.email || ""
                },
                body: JSON.stringify(body)
            })
            const data = await resp.json().catch(() => null)
            if (!resp.ok) {
                const msg = data?.message || resp.statusText
                updateAssign(id, { loading: false, error: msg })
                toast.error(`Schedule not saved: ${msg}`)
            } else {
                updateAssign(id, { loading: false, success: "Scheduled" })
                toast.success("Defense schedule saved")
                // refresh list so defense info appears
                await fetchRegistrations()
                // also refresh evaluation records which are created when scheduling
                try {
                    await fetchEvaluations()
                } catch (e) {
                    console.warn('Failed to refresh evaluations after scheduling', e)
                }
            }
        } catch (err) {
            console.error(err)
            updateAssign(id, { loading: false, error: "Scheduling failed" })
            toast.error("Schedule not saved: request failed")
        }
    }

    const fetchAttachments = async (regId: number) => {
        setAttachmentsLoadingMap(m => ({ ...m, [regId]: true }))
        try {
            const resp = await fetch(`http://localhost:8000/registrations/${regId}/attachments`, {
                headers: { "X-User-Email": user?.email || "" }
            })
            const json = await resp.json().catch(() => null)
            if (resp.ok && Array.isArray(json.attachments)) {
                setAttachmentsMap(m => ({ ...m, [regId]: json.attachments }))
            } else {
                setAttachmentsMap(m => ({ ...m, [regId]: [] }))
            }
        } catch (err) {
            setAttachmentsMap(m => ({ ...m, [regId]: [] }))
        } finally {
            setAttachmentsLoadingMap(m => ({ ...m, [regId]: false }))
        }
    }

    const downloadAttachment = async (attId: number, filename?: string) => {
        try {
            const resp = await fetch(`http://localhost:8000/attachments/${attId}/download`, {
                headers: { "X-User-Email": user?.email || "" }
            })
            if (!resp.ok) {
                console.warn('Download failed', resp.status)
                return
            }
            const blob = await resp.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename || 'attachment'
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Download error', err)
        }
    }

    // Use the same verify endpoint as CoordinatorPanel and refresh the list on success
    const verifyRegistration = async (id: number) => {
        try {
            const resp = await fetch(`http://localhost:8000/registrations/${id}/verify`, {
                method: "PATCH",
                headers: { "X-User-Email": user?.email || "" }
            })
            const data = await resp.json().catch(() => null)
            if (resp.ok) {
                // reload verified proposals
                await fetchRegistrations()
            } else {
                console.warn("Verify failed", resp.status, data)
            }
        } catch (err) {
            console.warn("Verify request error", err)
        }
    }

    const truncate = (text?: string, len = 120) => {
        if (!text) return ""
        return text.length > len ? text.slice(0, len) + "…" : text
    }

    const handleInterimAssign = async (id: number) => {
        const s = interimAssignState[id]
        if (!s) return
        updateInterimAssign(id, { loading: true, error: null, success: null })
        if (!s.start || !s.evaluatorsCsv) {
            updateInterimAssign(id, { loading: false, error: "Provide start time and evaluator emails" })
            toast.error("Missing required fields: start time and evaluator emails")
            return
        }
        try {
            const evaluators = s.evaluatorsCsv.split(",").map(x => x.trim()).filter(Boolean)
            const body = {
                start: toIso(s.start),
                end: s.end ? toIso(s.end as string) : toIso(s.start),
                slot_minutes: s.slotMinutes,
                evaluators,
                registration_ids: [id]
            }
            const resp = await fetch("http://localhost:8000/interim_schedule", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Email": user?.email || ""
                },
                body: JSON.stringify(body)
            })
            const data = await resp.json().catch(() => null)
            if (!resp.ok) {
                const msg = data?.message || resp.statusText
                updateInterimAssign(id, { loading: false, error: msg })
                toast.error(`Interim schedule not saved: ${msg}`)
            } else {
                updateInterimAssign(id, { loading: false, success: "Interim scheduled" })
                toast.success("Interim evaluation schedule saved")
            }
        } catch (err) {
            updateInterimAssign(id, { loading: false, error: "Interim scheduling failed" })
            toast.error("Interim schedule not saved: request failed")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Proposal Evaluation</h1>
                    <p className="text-muted-foreground">Manage defense schedules and evaluate student proposals</p>
                </div>
                <Button onClick={() => { fetchRegistrations(); fetchEvaluations(); }} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Proposals</CardDescription>
                        <CardTitle className="text-2xl">{registrations.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Scheduled Defenses</CardDescription>
                        <CardTitle className="text-2xl">{registrations.filter(r => r.defense).length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Pending Evaluations</CardDescription>
                        <CardTitle className="text-2xl">{evaluations.filter(e => e.status !== 'evaluated').length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Completed</CardDescription>
                        <CardTitle className="text-2xl">{evaluations.filter(e => e.status === 'evaluated').length}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="proposals" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="proposals" className="gap-2">
                        <CalendarPlus className="h-4 w-4" />
                        Assign Defense
                    </TabsTrigger>
                    <TabsTrigger value="evaluations" className="gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Evaluations
                    </TabsTrigger>
                </TabsList>

                {/* Proposals Tab */}
                <TabsContent value="proposals" className="space-y-4">
                    {loading ? (
                        <Card className="p-8 text-center text-muted-foreground">Loading proposals...</Card>
                    ) : registrations.length === 0 ? (
                        <Card className="p-8 text-center">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-muted-foreground">No proposals found</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {registrations.map(reg => {
                                const s = assignState[reg.id]
                                const absVisible = !!abstractVisible[reg.id]
                                return (
                                    <Card key={reg.id} className="overflow-hidden">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        {reg.title}
                                                        <Badge variant="outline" className="text-xs">#{reg.id}</Badge>
                                                    </CardTitle>
                                                    <CardDescription>{reg.owner}</CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {reg.defense ? (
                                                        <Badge className="bg-sky-500"><Calendar className="h-3 w-3 mr-1" />Assigned</Badge>
                                                    ) : reg.status === "registered" ? (
                                                        <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                                                    ) : reg.status === "scheduled" ? (
                                                        <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">{reg.status || "Pending"}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Defense Info */}
                                            {reg.defense && (
                                                <div className="flex items-center gap-3 p-3 rounded-lg bg-sky-50 border border-sky-200">
                                                    <Calendar className="h-5 w-5 text-sky-600" />
                                                    <div>
                                                        <p className="text-sm font-medium">{new Date(reg.defense.start).toLocaleString()}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {reg.defense.committee.join(", ")}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Abstract Toggle */}
                                            <Button variant="ghost" size="sm" onClick={() => toggleAbstract(reg.id)} className="gap-2">
                                                {absVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                {absVisible ? "Hide Details" : "View Details"}
                                                {absVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>

                                            {absVisible && (
                                                <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
                                                    <div>
                                                        <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                                            <FileText className="h-4 w-4" />
                                                            Abstract
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                            {reg.abstract || "(No abstract provided)"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                                            <Download className="h-4 w-4" />
                                                            Attachments
                                                        </h4>
                                                        {attachmentsLoadingMap[reg.id] ? (
                                                            <p className="text-sm text-muted-foreground">Loading...</p>
                                                        ) : !attachmentsMap[reg.id] || attachmentsMap[reg.id].length === 0 ? (
                                                            <p className="text-sm text-muted-foreground">No attachments</p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {attachmentsMap[reg.id].map((a: any) => (
                                                                    <div key={a.id} className="flex items-center gap-2">
                                                                        <Button size="sm" variant="outline" onClick={() => downloadAttachment(a.id, a.filename)}>
                                                                            <Download className="h-3 w-3 mr-1" />
                                                                            {a.filename}
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 pt-2 border-t">
                                                <Button onClick={() => openAssign(reg.id)} size="sm" variant={reg.defense ? "outline" : "default"} className="gap-2">
                                                    <CalendarPlus className="h-4 w-4" />
                                                    {reg.defense ? "Reassign" : "Schedule Defense"}
                                                </Button>
                                                {reg.status === "approved" && !reg.defense && (
                                                    <Button variant="outline" onClick={() => verifyRegistration(reg.id)} size="sm" className="gap-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Verify
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Schedule Form */}
                                            {s && (
                                                <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-sm">Defense Scheduling</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                            <div>
                                                                <Label className="text-xs">Start Date & Time</Label>
                                                                <Input type="datetime-local" value={s.start} onChange={(e) => updateAssign(reg.id, { start: e.target.value })} className="mt-1" />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Duration (min)</Label>
                                                                <Input type="number" min={5} value={s.slotMinutes} onChange={(e) => updateAssign(reg.id, { slotMinutes: Number(e.target.value) })} className="mt-1" />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <Label className="text-xs">Committee Emails</Label>
                                                                <Input value={s.committeeCsv} onChange={(e) => updateAssign(reg.id, { committeeCsv: e.target.value })} placeholder="email1@example.com, email2@example.com" className="mt-1" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button onClick={() => handleAssign(reg.id)} disabled={s.loading} size="sm">
                                                                {s.loading ? "Saving..." : "Save Schedule"}
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                const copy = { ...assignState }
                                                                delete copy[reg.id]
                                                                setAssignState(copy)
                                                            }}>Cancel</Button>
                                                            {s.error && <Badge variant="destructive">{s.error}</Badge>}
                                                            {s.success && <Badge className="bg-green-500">{s.success}</Badge>}
                                                        </div>

                                                        {/* Interim Scheduling */}
                                                        <div className="pt-4 border-t">
                                                            <h4 className="text-sm font-medium mb-3">Interim Evaluation</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                                <div>
                                                                    <Label className="text-xs">Start</Label>
                                                                    <Input type="datetime-local" value={interimAssignState[reg.id]?.start || ""} onChange={(e) => updateInterimAssign(reg.id, { start: e.target.value })} className="mt-1" />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs">Duration (min)</Label>
                                                                    <Input type="number" min={5} value={interimAssignState[reg.id]?.slotMinutes || 30} onChange={(e) => updateInterimAssign(reg.id, { slotMinutes: Number(e.target.value) })} className="mt-1" />
                                                                </div>
                                                                <div className="md:col-span-2">
                                                                    <Label className="text-xs">Evaluator Emails</Label>
                                                                    <Input value={interimAssignState[reg.id]?.evaluatorsCsv || ""} onChange={(e) => updateInterimAssign(reg.id, { evaluatorsCsv: e.target.value })} placeholder="evaluator@example.com" className="mt-1" />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-3">
                                                                <Button onClick={() => handleInterimAssign(reg.id)} disabled={interimAssignState[reg.id]?.loading} size="sm" variant="outline">
                                                                    {interimAssignState[reg.id]?.loading ? "Saving..." : "Save Interim"}
                                                                </Button>
                                                                {interimAssignState[reg.id]?.error && <Badge variant="destructive">{interimAssignState[reg.id]?.error}</Badge>}
                                                                {interimAssignState[reg.id]?.success && <Badge className="bg-green-500">{interimAssignState[reg.id]?.success}</Badge>}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Evaluations Tab */}
                <TabsContent value="evaluations" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Record Evaluations</h3>
                        <Button size="sm" variant="outline" className="gap-2" onClick={async () => {
                            setEvaluations([]);
                            setEvaluationDrafts({});
                            await Promise.all([fetchEvaluations(), fetchRegistrations()]);
                            toast.success("Data refreshed");
                        }}>
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                    </div>

                    {evaluations.length === 0 ? (
                        <Card className="p-8 text-center">
                            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-muted-foreground">No evaluations to record</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {evaluations.map(ev => {
                                const reg = registrations.find(r => r.id === ev.registration_id)
                                const draft = evaluationDrafts[ev.id] || {}
                                const isEvaluated = ev.status === 'evaluated'
                                return (
                                    <Card key={ev.id} className={`overflow-hidden border-l-4 ${isEvaluated ? 'border-l-green-500' : 'border-l-orange-400'}`}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-base">{reg ? reg.title : `Registration #${ev.registration_id}`}</CardTitle>
                                                    <CardDescription className="space-y-1">
                                                        <span className="block">{ev.student_email}</span>
                                                        <span className="flex items-center gap-1 text-xs">
                                                            <Calendar className="h-3 w-3" />
                                                            {ev.scheduled_start ? new Date(ev.scheduled_start).toLocaleString() : 'Not scheduled'}
                                                        </span>
                                                    </CardDescription>
                                                </div>
                                                {isEvaluated ? (
                                                    ev.result === 'approved' ? (
                                                        <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" />Approved</Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>
                                                    )
                                                ) : (
                                                    <Badge variant="outline" className="border-orange-400 text-orange-600 gap-1">
                                                        <AlertCircle className="h-3 w-3" />Pending
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <Label className="text-xs">Result</Label>
                                                    <Select value={draft.result || ev.result || ''} onValueChange={(value) => updateDraft(ev.id, { result: value })}>
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue placeholder="Select result..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="approved">
                                                                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />Accepted</span>
                                                            </SelectItem>
                                                            <SelectItem value="rejected">
                                                                <span className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" />Rejected</span>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label className="text-xs">Remarks</Label>
                                                    <Textarea placeholder="Enter feedback..." value={draft.remarks ?? (ev.remarks ?? '')} onChange={(e) => updateDraft(ev.id, { remarks: e.target.value })} className="mt-1 min-h-[80px]" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-2 border-t">
                                                <Button onClick={() => submitEvaluation(ev.id)} disabled={draft.loading} size="sm">
                                                    {draft.loading ? 'Saving...' : (isEvaluated ? 'Update' : 'Submit')}
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(ev.id)} className="gap-1">
                                                    <Trash2 className="h-3 w-3" />Delete
                                                </Button>
                                                {draft.error && <Badge variant="destructive">{draft.error}</Badge>}
                                                {draft.success && <Badge className="bg-green-500">{draft.success}</Badge>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete Evaluation
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this evaluation? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteEvaluation} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}