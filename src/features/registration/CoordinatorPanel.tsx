import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
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
  ShieldX,
  AlertCircle,
} from "lucide-react"

type Registration = {
  id: number
  owner: string
  title: string
  supervisor: string
  abstract?: string
  status: string
}

export default function CoordinatorPanel() {
  const { user } = useAuth()
  const [regs, setRegs] = React.useState<Registration[]>([])
  const [message, setMessage] = React.useState<string | null>(null)
  const [statusDialogOpenId, setStatusDialogOpenId] = React.useState<number | null>(null)
  const [statusDialogText, setStatusDialogText] = React.useState("")
  const [loadingIds, setLoadingIds] = React.useState<number[]>([])
  const [abstractVisible, setAbstractVisible] = React.useState<Record<number, boolean>>({})
  const [attachmentsMap, setAttachmentsMap] = React.useState<Record<number, any[]>>({})
  const [attachmentsLoadingMap, setAttachmentsLoadingMap] = React.useState<Record<number, boolean>>({})

  const load = async () => {
    const res = await fetch("http://localhost:8000/registrations", {
      headers: { "X-User-Email": user?.email || "" },
    })
    const data = await res.json()
    setRegs((data.registrations || []) as Registration[])
  }

  React.useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleAbstract = (id: number) => {
    const next = !abstractVisible[id]
    setAbstractVisible(s => ({ ...s, [id]: next }))
    if (next) fetchAttachments(id)
  }

  const fetchAttachments = async (regId: number) => {
    setAttachmentsLoadingMap(m => ({ ...m, [regId]: true }))
    try {
      const resp = await fetch(`http://localhost:8000/registrations/${regId}/attachments`, {
        headers: { "X-User-Email": user?.email || "" },
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
    } catch (err) {
      // ignore
    }
  }

  const verify = async (id: number) => {
    try {
      setLoadingIds((s) => [...s, id])
      const res = await fetch(`http://localhost:8000/registrations/${id}/verify`, {
        method: "PATCH",
        headers: { "X-User-Email": user?.email || "" },
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || "Registration verified")
        setStatusDialogOpenId(null)
        await load()
      } else {
        toast.error(data.message || "Verify failed")
      }
    } finally {
      setLoadingIds((s) => s.filter((x) => x !== id))
    }
  }

  const unverify = async (id: number) => {
    try {
      setLoadingIds((s) => [...s, id])
      const res = await fetch(`http://localhost:8000/registrations/${id}/unverify`, {
        method: "PATCH",
        headers: { "X-User-Email": user?.email || "" },
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || "Registration unverified")
        await load()
      } else {
        toast.error(data.message || "Unverify failed")
      }
    } finally {
      setLoadingIds((s) => s.filter((x) => x !== id))
    }
  }

  const handleMark = (r: Registration) => {
    if (r.status === "approved") {
      verify(r.id)
      return
    }
    setStatusDialogText("Only proposal registrations approved by the supervisor can be verified")
    setStatusDialogOpenId(r.id)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
        return <Badge variant="outline" className="border-yellow-400 text-yellow-600 gap-1"><Clock className="h-3 w-3" />Pending</Badge>
      case "approved":
        return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" />Approved</Badge>
      case "scheduled":
        return <Badge className="bg-sky-500 gap-1"><Clock className="h-3 w-3" />Scheduled</Badge>
      case "registered":
        return <Badge className="bg-emerald-500 gap-1"><ShieldCheck className="h-3 w-3" />Verified</Badge>
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Stats
  const pending = regs.filter(r => r.status === "pending_approval").length
  const approved = regs.filter(r => r.status === "approved").length
  const verified = regs.filter(r => r.status === "registered").length
  const rejected = regs.filter(r => r.status === "rejected").length

  // Filter registrations by tab
  const pendingRegs = regs.filter(r => r.status === "pending_approval")
  const approvedRegs = regs.filter(r => r.status === "approved")
  const verifiedRegs = regs.filter(r => r.status === "registered" || r.status === "scheduled")
  const rejectedRegs = regs.filter(r => r.status === "rejected")

  const renderRegistrationCard = (r: Registration) => {
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
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.owner}</span>
                <span>Supervisor: {r.supervisor}</span>
              </CardDescription>
            </div>
            {getStatusBadge(r.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {/* Warning Dialog */}
          {statusDialogOpenId === r.id && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {statusDialogText}
              </div>
              <Button variant="outline" size="sm" onClick={() => setStatusDialogOpenId(null)}>OK</Button>
            </div>
          )}

          {/* Verified Banner */}
          {r.status === "registered" && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-sm">This registration is verified and ready for defense scheduling.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {r.status === "approved" && (
              <Button onClick={() => handleMark(r)} disabled={loadingIds.includes(r.id)} size="sm" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                {loadingIds.includes(r.id) ? "Verifying..." : "Mark as Verified"}
              </Button>
            )}
            {r.status === "registered" && (
              <Button variant="destructive" onClick={() => unverify(r.id)} disabled={loadingIds.includes(r.id)} size="sm" className="gap-2">
                <ShieldX className="h-4 w-4" />
                {loadingIds.includes(r.id) ? "Working..." : "Unverify"}
              </Button>
            )}
            {r.status !== "approved" && r.status !== "registered" && r.status !== "scheduled" && (
              <Button onClick={() => handleMark(r)} size="sm" variant="outline" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Mark as Verified
              </Button>
            )}
          </div>
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
          <p className="text-muted-foreground">Review and verify student registrations</p>
        </div>
        <Button onClick={load} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription>Pending Approval</CardDescription>
            <CardTitle className="text-2xl">{pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl">{approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-2xl">{verified}</CardTitle>
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
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <FileText className="h-4 w-4" />
            All ({regs.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approved ({approved})
          </TabsTrigger>
          <TabsTrigger value="verified" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Verified ({verified})
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="pending" className="space-y-4">
          {pendingRegs.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No pending registrations</p>
            </Card>
          ) : (
            <div className="space-y-4">{pendingRegs.map(renderRegistrationCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRegs.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No approved registrations awaiting verification</p>
            </Card>
          ) : (
            <div className="space-y-4">{approvedRegs.map(renderRegistrationCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {verifiedRegs.length === 0 ? (
            <Card className="p-8 text-center">
              <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No verified registrations</p>
            </Card>
          ) : (
            <div className="space-y-4">{verifiedRegs.map(renderRegistrationCard)}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
