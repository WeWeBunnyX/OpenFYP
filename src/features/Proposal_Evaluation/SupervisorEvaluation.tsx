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

export default function SupervisorEvaluation() {
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
        <h2 className="text-xl font-semibold">Proposal Evaluation (Supervisor view)</h2>
        <div>
          <Button size="sm" onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Defense Presentation's Results (supervised proposals)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading…</div>
            ) : results.length === 0 ? (
              <div className="text-sm text-muted-foreground">No evaluated proposals yet</div>
            ) : (
              <div className="grid gap-3">
                {results.map((p) => {
                  const reg = p.registration_id ? regById[p.registration_id] : undefined
                  const approved = p.result === "approved"
                  return (
                    <div key={p.id} className="p-4 border rounded-md relative">
                      <div className="absolute right-3 top-3">{approved ? ribbon('Accepted', 'text-green-800 bg-green-100') : ribbon('Rejected', 'text-red-800 bg-red-100')}</div>
                      <div className="font-medium">{reg ? reg.title : `Registration #${p.registration_id}`}</div>
                      <div className="text-sm text-muted-foreground">Student: {p.student_email}</div>
                      <div className="text-sm text-muted-foreground">Evaluated: {fmt(p.updated_at)}</div>
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
