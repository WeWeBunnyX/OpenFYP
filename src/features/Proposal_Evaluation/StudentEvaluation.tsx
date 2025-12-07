import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Registration = {
  id: number
  title: string
  abstract?: string
  supervisor?: string
  status?: string
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

export default function StudentEvaluation() {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = React.useState<ProposalEvaluation[]>([])
  const [registrations, setRegistrations] = React.useState<Registration[]>([])
  const [loading, setLoading] = React.useState(false)

  const load = async () => {
    if (!user?.email) return
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch("http://localhost:8000/proposal_evaluations", { headers: { "X-User-Email": user.email } }),
        fetch("http://localhost:8000/registrations", { headers: { "X-User-Email": user.email } }),
      ])

      const peJson = await r1.json().catch(() => null)
      const regJson = await r2.json().catch(() => null)
      setEvaluations((peJson && peJson.proposal_evaluations) || [])
      setRegistrations((regJson && regJson.registrations) || [])
    } catch (err) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const regById: Record<number, Registration> = {}
  registrations.forEach((r) => {
    // @ts-ignore
    regById[r.id] = r
  })

  const upcoming = evaluations
    .filter((p) => p.status === "pending")
    .sort((a, b) => (a.scheduled_start || "") < (b.scheduled_start || "") ? -1 : 1)

  const results = evaluations
    .filter((p) => p.status === "evaluated")
    .sort((a, b) => (b.updated_at || "") < (a.updated_at || "") ? -1 : 1)

  const fmt = (iso?: string) => {
    if (!iso) return ""
    try {
      return new Date(iso).toLocaleString()
    } catch (e) {
      return iso
    }
  }

  const ribbon = (text: string, color: string) => (
    <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${color}`}>{text}</div>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Proposal Evaluation</h2>
        <div>
          <Button size="sm" onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Defenses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading…</div>
            ) : upcoming.length === 0 ? (
              <div className="text-sm text-muted-foreground">No upcoming defenses</div>
            ) : (
              <div className="grid gap-3">
                {upcoming.map((p) => {
                  const reg = p.registration_id ? regById[p.registration_id] : undefined
                  return (
                    <div key={p.id} className="p-4 border rounded-md relative">
                      <div className="absolute right-3 top-3">{ribbon('Upcoming', 'text-sky-800 bg-sky-100')}</div>
                      <div className="font-medium">{reg ? reg.title : `Registration #${p.registration_id}`}</div>
                      <div className="text-sm text-muted-foreground">Scheduled: {fmt(p.scheduled_start)}</div>
                      {p.scheduled_end && <div className="text-sm text-muted-foreground">Ends: {fmt(p.scheduled_end)}</div>}
                      {reg?.supervisor && <div className="text-sm">Supervisor: {reg.supervisor}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluation Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading…</div>
            ) : results.length === 0 ? (
              <div className="text-sm text-muted-foreground">No evaluation results yet</div>
            ) : (
              <div className="grid gap-3">
                {results.map((p) => {
                  const reg = p.registration_id ? regById[p.registration_id] : undefined
                  const approved = p.result === "approved"
                  return (
                    <div key={p.id} className="p-4 border rounded-md relative">
                      <div className="absolute right-3 top-3">{approved ? ribbon('Accepted', 'text-green-800 bg-green-100') : ribbon('Rejected', 'text-red-800 bg-red-100')}</div>
                      <div className="font-medium">{reg ? reg.title : `Registration #${p.registration_id}`}</div>
                      <div className="text-sm text-muted-foreground">Evaluated: {fmt(p.updated_at)}</div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted-foreground/10 text-muted-foreground">Defense Result</div>
                        <div className="text-sm font-medium">{approved ? 'Accepted' : 'Rejected'}</div>
                      </div>
                      {p.remarks && <div className="mt-2 text-sm">Remarks: {p.remarks}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
