import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Users,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Download,
  ShieldCheck,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Calendar,
} from "lucide-react"

export default function SupervisorPanel() {
  const { user } = useAuth()
  const [regs, setRegs] = React.useState<any[]>([])
  const [message, setMessage] = React.useState<string | null>(null)
  const [actionOpen, setActionOpen] = React.useState(false)
  const [actionRegId, setActionRegId] = React.useState<number | null>(null)
  const [actionType, setActionType] = React.useState<"approve" | "reject" | null>(null)
  const [actionRemarks, setActionRemarks] = React.useState<string>("")
  const [warnOpenId, setWarnOpenId] = React.useState<number | null>(null)
  const [warnText, setWarnText] = React.useState<string>("")
  const [abstractVisible, setAbstractVisible] = React.useState<Record<number, boolean>>({})
  const [attachmentsMap, setAttachmentsMap] = React.useState<Record<number, any[]>>({})
  const [attachmentsLoadingMap, setAttachmentsLoadingMap] = React.useState<Record<number, boolean>>({})

  const load = async () => {
    const res = await fetch("http://localhost:8000/registrations", {
      headers: { "X-User-Email": user?.email || "" },
    })
    const data = await res.json()
    setRegs(data.registrations || [])
  }

  React.useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openAction = (id: number, verb: "approve" | "reject") => {
    setActionRegId(id)
    setActionType(verb)
    setActionRemarks("")
    setActionOpen(true)
  }

  const toggleAbstract = (id: number) => {
    const next = !abstractVisible[id]
    setAbstractVisible(s => ({ ...s, [id]: next }))
    if (next) fetchAttachments(id)
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
      if (!resp.ok) return
      const blob = await resp.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'attachment'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      // ignore
    }
  }

  const tryAction = (r: any, verb: "approve" | "reject") => {
    if (r.status === "registered" || r.status === "scheduled") {
      setWarnText("This registration has been verified or scheduled by a coordinator and cannot be changed.")
      setWarnOpenId(r.id)
      return
    }
    if (verb === "reject" && r.status === "approved") {
      setWarnText("This registration has already been approved — rejection is not allowed.")
      setWarnOpenId(r.id)
      return
    }
    if (verb === "approve" && r.status === "approved") return
    if (verb === "reject" && r.status === "rejected") return
    openAction(r.id, verb)
  }

  const confirmAction = async () => {
    if (!actionRegId || !actionType) return
    try {
      const res = await fetch(`http://localhost:8000/registrations/${actionRegId}/${actionType}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-User-Email": user?.email || "" },
        body: JSON.stringify({ remarks: actionRemarks }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || `Registration ${actionType}d`)
        setActionOpen(false)
        await load()
      } else {
        toast.error(data.message || "Action failed")
      }
    } catch (e) {
      toast.error("Error connecting to server")
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" />Approved</Badge>
      case "registered":
        return <Badge className="bg-emerald-500 gap-1"><ShieldCheck className="h-3 w-3" />Verified</Badge>
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>
      case "scheduled":
        return <Badge className="bg-sky-500 gap-1"><Calendar className="h-3 w-3" />Scheduled</Badge>
      case "pending_approval":
      default:
        return <Badge variant="outline" className="border-yellow-400 text-yellow-600 gap-1"><Clock className="h-3 w-3" />Pending</Badge>
    }
  }

  // Stats
  const pending = regs.filter(r => r.status === "pending_approval").length
  const approved = regs.filter(r => r.status === "approved" || r.status === "registered" || r.status === "scheduled").length
  const rejected = regs.filter(r => r.status === "rejected").length

  // Filtered lists
  const pendingRegs = regs.filter(r => r.status === "pending_approval")
  const approvedRegs = regs.filter(r => r.status === "approved" || r.status === "registered" || r.status === "scheduled")
  const rejectedRegs = regs.filter(r => r.status === "rejected")

  const renderRegistrationCard = (r: any) => {
    const absVisible = abstractVisible[r.id]
    return (
      <Card key={r.id} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {r.title}
                <Badge variant="outline" className="text-xs">#{r.id}</Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                {r.owner}
              </CardDescription>
            </div>
            {getStatusBadge(r.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Submitted date */}
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Submitted: {new Date(r.created_at).toLocaleString()}
          </div>

          {/* Remarks */}
          {r.remarks && (
            <div className="p-3 bg-muted/50 border rounded-lg">
              <p className="text-sm"><span className="font-medium">Remarks:</span> {r.remarks}</p>
            </div>
          )}

          {/* Abstract Toggle */}
          <Button variant="ghost" size="sm" onClick={() => toggleAbstract(r.id)} className="gap-2">
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
                  {r.abstract || "(No abstract provided)"}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Download className="h-4 w-4" />
                  Attachments
                </h4>
                {attachmentsLoadingMap[r.id] ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !attachmentsMap[r.id] || attachmentsMap[r.id].length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attachments</p>
                ) : (
                  <div className="space-y-2">
                    {attachmentsMap[r.id].map((a: any) => (
                      <Button key={a.id} size="sm" variant="outline" onClick={() => downloadAttachment(a.id, a.filename)}>
                        <Download className="h-3 w-3 mr-1" />
                        {a.filename}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning */}
          {warnOpenId === r.id && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {warnText}
              </div>
              <Button variant="outline" size="sm" onClick={() => setWarnOpenId(null)}>OK</Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              size="sm"
              data-testid={`approve-btn-${r.id}`}
              onClick={() => tryAction(r, "approve")}
              disabled={r.status === "approved" || r.status === "registered" || r.status === "scheduled"}
              variant={r.status === "approved" || r.status === "registered" || r.status === "scheduled" ? "outline" : "default"}
              className="gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              data-testid={`reject-btn-${r.id}`}
              onClick={() => tryAction(r, "reject")}
              disabled={r.status === "rejected" || r.status === "registered" || r.status === "scheduled"}
              variant={r.status === "rejected" ? "outline" : (r.status === "registered" || r.status === "scheduled" ? "outline" : "destructive")}
              className="gap-2"
            >
              <ThumbsDown className="h-4 w-4" />
              Reject
            </Button>
          </div>

          {/* History */}
          {r.history && r.history.length > 0 && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              <span className="font-medium">History:</span>
              {r.history.map((h: any, i: number) => (
                <div key={i} className="ml-2">{`${h.actor} — ${h.action} — ${h.note}`}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FYP Registration</h1>
          <p className="text-muted-foreground">Review and approve student registrations</p>
        </div>
        <Button onClick={load} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl">{pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl">{approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-2xl">{rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approved ({approved})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejected})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <FileText className="h-4 w-4" />
            All ({regs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRegs.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No pending registrations to review</p>
            </Card>
          ) : (
            <div className="space-y-4">{pendingRegs.map(renderRegistrationCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRegs.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No approved registrations</p>
            </Card>
          ) : (
            <div className="space-y-4">{approvedRegs.map(renderRegistrationCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedRegs.length === 0 ? (
            <Card className="p-8 text-center">
              <XCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No rejected registrations</p>
            </Card>
          ) : (
            <div className="space-y-4">{rejectedRegs.map(renderRegistrationCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {regs.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No registrations found</p>
            </Card>
          ) : (
            <div className="space-y-4">{regs.map(renderRegistrationCard)}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? <ThumbsUp className="h-5 w-5 text-green-500" /> : <ThumbsDown className="h-5 w-5 text-red-500" />}
              {actionType === 'approve' ? 'Approve Registration' : 'Reject Registration'}
            </DialogTitle>
            <DialogDescription>Add optional remarks for the student.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Remarks (optional)</Label>
              <Textarea
                className="mt-1"
                data-testid="action-remarks-input"
                rows={4}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="Enter feedback for the student..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button>
            <Button
              data-testid="confirm-action-btn"
              onClick={confirmAction}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              className="gap-2"
            >
              {actionType === 'approve' ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
