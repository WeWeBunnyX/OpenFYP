import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  FileText,
  Users,
} from "lucide-react"

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposal Evaluation</h1>
          <p className="text-muted-foreground">View your defense schedules and evaluation results</p>
        </div>
        <Button onClick={load} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Defenses</CardDescription>
            <CardTitle className="text-2xl">{upcoming.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl">{results.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardDescription>Total Evaluations</CardDescription>
            <CardTitle className="text-2xl">{evaluations.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-4 w-4" />
            Upcoming Defenses
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Defenses Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {loading ? (
            <Card className="p-8 text-center text-muted-foreground">Loading...</Card>
          ) : upcoming.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No upcoming defenses scheduled</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcoming.map((p) => {
                const reg = p.registration_id ? regById[p.registration_id] : undefined
                return (
                  <Card key={p.id} className="overflow-hidden border-l-4 border-l-sky-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{reg ? reg.title : `Registration #${p.registration_id}`}</CardTitle>
                          <CardDescription>{p.student_email}</CardDescription>
                        </div>
                        <Badge className="bg-sky-500 gap-1">
                          <Clock className="h-3 w-3" />
                          Upcoming
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-sky-50 border border-sky-200">
                        <Calendar className="h-5 w-5 text-sky-600" />
                        <div>
                          <p className="text-sm font-medium">Scheduled: {fmt(p.scheduled_start)}</p>
                          {p.scheduled_end && (
                            <p className="text-xs text-muted-foreground">Ends: {fmt(p.scheduled_end)}</p>
                          )}
                        </div>
                      </div>
                      {reg?.supervisor && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          Supervisor: {reg.supervisor}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {loading ? (
            <Card className="p-8 text-center text-muted-foreground">Loading...</Card>
          ) : results.length === 0 ? (
            <Card className="p-8 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No evaluation results yet</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((p) => {
                const reg = p.registration_id ? regById[p.registration_id] : undefined
                const approved = p.result === "approved"
                return (
                  <Card key={p.id} className={`overflow-hidden border-l-4 ${approved ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{reg ? reg.title : `Registration #${p.registration_id}`}</CardTitle>
                          <CardDescription className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            Evaluated: {fmt(p.updated_at)}
                          </CardDescription>
                        </div>
                        {approved ? (
                          <Badge className="bg-green-500 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Accepted
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${approved ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        {approved ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium">Defense Result: {approved ? 'Proposal Accepted' : 'Proposal Rejected'}</p>
                        </div>
                      </div>
                      {p.remarks && (
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4" />
                            Committee Remarks
                          </h4>
                          <p className="text-sm text-muted-foreground">{p.remarks}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
