import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"

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

    const [abstractVisible, setAbstractVisible] = React.useState<Record<number, boolean>>({})
    const [attachmentsMap, setAttachmentsMap] = React.useState<Record<number, any[]>>({})
    const [attachmentsLoadingMap, setAttachmentsLoadingMap] = React.useState<Record<number, boolean>>({})

    React.useEffect(() => {
        fetchRegistrations()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.email])

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

    const toIso = (localValue: string) => {
        if (!localValue) return ""
        const d = new Date(localValue)
        return d.toISOString()
    }

    const handleAssign = async (id: number) => {
        const state = assignState[id]
        if (!state) return
        updateAssign(id, { loading: true, error: null, success: null })
        if (!state.start || !state.committeeCsv) {
            updateAssign(id, { loading: false, error: "Provide start time and committee emails" })
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
                updateAssign(id, { loading: false, error: data?.message || resp.statusText })
            } else {
                updateAssign(id, { loading: false, success: "Scheduled" })
                // refresh list so defense info appears
                await fetchRegistrations()
            }
        } catch (err) {
            console.error(err)
            updateAssign(id, { loading: false, error: "Scheduling failed" })
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

    return (
        <div>
            <h2 className="text-xl font-semibold mb-3">Proposal Evaluation (Assign defense)</h2>

            {loading && <div className="mb-2">Loading proposals…</div>}

            <div className="overflow-auto border rounded w-full min-w-0">
                <table className="w-full table-auto">
                    <thead className="text-left bg-gray-50">
                        <tr>
                            <th className="p-2">#</th>
                            <th className="p-2">Title</th>
                            <th className="p-2">Proposal</th>
                            <th className="p-2">Student</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Defense</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.length === 0 && (
                            <tr><td colSpan={7} className="p-4 text-center text-sm text-muted-foreground">No proposals found</td></tr>
                        )}
                        {registrations.map(reg => {
                            const s = assignState[reg.id]
                            const absVisible = !!abstractVisible[reg.id]
                            return (
                                <React.Fragment key={reg.id}>
                                    <tr className="border-t">
                                        <td className="p-2 align-top">{reg.id}</td>
                                        <td className="p-2 align-top">{reg.title}</td>
                                        <td className="p-2 align-top text-sm">{truncate(reg.abstract)}</td>
                                        <td className="p-2 align-top">{reg.owner}</td>
                                        <td className="p-2 align-top">
                                            {reg.defense ? (
                                                <div className="text-sm text-green-600">Assigned</div>
                                            ) : reg.status === "registered" || reg.status === "scheduled" ? (
                                                <div className="text-sm text-green-600">{reg.status === "registered" ? "Verified" : "Scheduled"}</div>
                                            ) : (
                                                reg.status || "-"
                                            )}
                                        </td>
                                        <td className="p-2 align-top text-sm">
                                            {reg.defense ? (
                                                <div>
                                                    <div>{new Date(reg.defense.start).toLocaleString()}</div>
                                                    <div className="text-xs text-muted-foreground">Committee: {reg.defense.committee.join(", ")}</div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Not scheduled</span>
                                            )}
                                        </td>
                                        <td className="p-2 align-top">
                                            <div className="flex gap-2">
                                                <Button onClick={() => openAssign(reg.id)} size="sm" variant={reg.defense ? "secondary" : "default"}>
                                                    {reg.defense ? "Reassign" : "Assign"}
                                                </Button>
                                                {reg.status !== "registered" ? (
                                                    <Button variant="outline" onClick={() => verifyRegistration(reg.id)} size="sm">Verify</Button>
                                                ) : (
                                                    <div className="text-sm text-green-600 self-center">Verified</div>
                                                )}
                                                <Button variant="ghost" onClick={() => toggleAbstract(reg.id)} size="sm">
                                                    {absVisible ? "Hide" : "View"}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>

                                    {absVisible && (
                                        <tr>
                                            <td colSpan={7} className="p-3 bg-gray-50 text-sm whitespace-pre-wrap">
                                                <strong>Proposal abstract:</strong>
                                                <div className="mt-1">{reg.abstract || "(no abstract provided)"}</div>
                                                <div className="mt-3">
                                                    <strong className="text-sm">Attachments:</strong>
                                                    <div className="mt-1">
                                                        {attachmentsLoadingMap[reg.id] ? (
                                                            <div className="text-sm">Loading attachments...</div>
                                                        ) : !attachmentsMap[reg.id] || attachmentsMap[reg.id].length === 0 ? (
                                                            <div className="text-sm text-muted-foreground">No attachments</div>
                                                        ) : (
                                                            <div className="flex flex-col gap-2">
                                                                {attachmentsMap[reg.id].map((a: any) => (
                                                                    <div key={a.id} className="flex items-center gap-2">
                                                                        <div className="text-sm">{a.filename}</div>
                                                                        <Button size="sm" onClick={() => downloadAttachment(a.id, a.filename)}>View / Download</Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {s && (
                                        <tr>
                                            <td colSpan={7} className="p-3 bg-gray-50">
                                                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                                                    <div>
                                                        <Label className="text-sm">Start</Label>
                                                        <Input type="datetime-local" value={s.start} onChange={(e) => updateAssign(reg.id, { start: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm">Slot minutes</Label>
                                                        <Input type="number" min={5} value={s.slotMinutes} onChange={(e) => updateAssign(reg.id, { slotMinutes: Number(e.target.value) })} />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <Label className="text-sm">Committee emails (comma separated)</Label>
                                                        <Input value={s.committeeCsv} onChange={(e) => updateAssign(reg.id, { committeeCsv: e.target.value })} placeholder="member1@example.com, member2@example.com" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => handleAssign(reg.id)} disabled={s.loading}>
                                                            {s.loading ? "Scheduling..." : "Save"}
                                                        </Button>
                                                        <Button variant="ghost" onClick={() => {
                                                            const copy = { ...assignState }
                                                            delete copy[reg.id]
                                                            setAssignState(copy)
                                                        }}>Cancel</Button>
                                                    </div>
                                                </div>

                                                {s.error && <div className="text-red-600 mt-2">{s.error}</div>}
                                                {s.success && <div className="text-green-600 mt-2">{s.success}</div>}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}