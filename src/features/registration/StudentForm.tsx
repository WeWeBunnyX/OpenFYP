import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Users,
  RefreshCw,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Send,
  File,
} from "lucide-react"

export default function StudentForm() {
  const { user } = useAuth()
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const editFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [title, setTitle] = React.useState("")
  const [supervisor, setSupervisor] = React.useState("")
  const [abstract, setAbstract] = React.useState("")
  const [message, setMessage] = React.useState<string | null>(null)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [fileData, setFileData] = React.useState<string | null>(null)
  const [fileError, setFileError] = React.useState<string | null>(null)
  const [submittedRegistration, setSubmittedRegistration] = React.useState<any | null>(null)
  const [registrations, setRegistrations] = React.useState<any[]>([])
  const [selectedRegistrationId, setSelectedRegistrationId] = React.useState<number | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [attachments, setAttachments] = React.useState<any[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = React.useState(false)
  const [downloadLoadingId, setDownloadLoadingId] = React.useState<number | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState("")
  const [editAbstract, setEditAbstract] = React.useState("")
  const [editFileName, setEditFileName] = React.useState<string | null>(null)
  const [editFileData, setEditFileData] = React.useState<string | null>(null)

  React.useEffect(() => {
    const load = async () => {
      if (!user?.email) return
      await fetchRegistrations()
    }
    load()
  }, [user])

  const fetchRegistrations = async () => {
    if (!user?.email) return
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8000/registrations", {
        headers: { "X-User-Email": user.email },
      })
      const json = await res.json()
      if (res.ok && Array.isArray(json.registrations)) {
        const regs = json.registrations
        setRegistrations(regs)
        if (selectedRegistrationId) {
          const sel = regs.find((r: any) => r.id === selectedRegistrationId)
          if (sel) {
            setSubmittedRegistration(sel)
          } else if (regs.length > 0) {
            setSelectedRegistrationId(regs[0].id)
            setSubmittedRegistration(regs[0])
          } else {
            setSelectedRegistrationId(null)
            setSubmittedRegistration(null)
          }
        } else {
          if (isCreating) return
          if (regs.length > 0) {
            setSelectedRegistrationId(regs[0].id)
            setSubmittedRegistration(regs[0])
          } else {
            setSelectedRegistrationId(null)
            setSubmittedRegistration(null)
          }
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const fetchAttachments = async (regId: number | null) => {
    if (!regId || !user?.email) {
      setAttachments([])
      return
    }
    setAttachmentsLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/registrations/${regId}/attachments`, {
        headers: { "X-User-Email": user.email },
      })
      const json = await res.json()
      if (res.ok && Array.isArray(json.attachments)) {
        setAttachments(json.attachments)
      } else {
        setAttachments([])
      }
    } catch (e) {
      setAttachments([])
    } finally {
      setAttachmentsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchAttachments(selectedRegistrationId)
  }, [selectedRegistrationId, user])

  React.useEffect(() => {
    if (!user?.email) return
    const iv = setInterval(() => {
      fetchRegistrations()
    }, 8000)
    return () => clearInterval(iv)
  }, [user?.email, selectedRegistrationId, isCreating])

  const submit = async () => {
    setLoading(true)
    try {
      const payload: any = { title, supervisor, abstract }
      if (fileName && fileData) {
        payload.attachment = { name: fileName, data: fileData }
      }

      const res = await fetch("http://localhost:8000/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": user?.email || "",
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Registration submitted successfully")
        await fetchRegistrations()
        if (data.registration) {
          setSubmittedRegistration(data.registration)
          setSelectedRegistrationId(data.registration.id)
          setIsCreating(false)
        }
      } else {
        toast.error(data.message || "Submission failed")
      }
    } catch (err) {
      toast.error("Error connecting to server")
    }
    setLoading(false)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const f = e.target.files?.[0]
    if (!f) {
      setFileName(null)
      setFileData(null)
      return
    }
    const allowed = [".pdf", ".doc", ".docx", ".odt", ".xls", ".xlsx", ".zip"]
    const lower = f.name.toLowerCase()
    if (!allowed.some((ext) => lower.endsWith(ext))) {
      setFileError('Unsupported file type')
      setFileName(null)
      setFileData(null)
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setFileError('File too large (max 10MB)')
      setFileName(null)
      setFileData(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const idx = result.indexOf('base64,')
      const b64 = idx >= 0 ? result.substring(idx + 7) : result
      setFileName(f.name)
      setFileData(b64)
    }
    reader.onerror = () => {
      setFileError('Failed to read file')
      setFileName(null)
      setFileData(null)
    }
    reader.readAsDataURL(f)
  }

  const onEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const f = e.target.files?.[0]
    if (!f) {
      setEditFileName(null)
      setEditFileData(null)
      return
    }
    const allowed = [".pdf", ".doc", ".docx", ".odt", ".xls", ".xlsx", ".zip"]
    const lower = f.name.toLowerCase()
    if (!allowed.some((ext) => lower.endsWith(ext))) {
      setFileError('Unsupported file type')
      setEditFileName(null)
      setEditFileData(null)
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setFileError('File too large (max 10MB)')
      setEditFileName(null)
      setEditFileData(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const idx = result.indexOf('base64,')
      const b64 = idx >= 0 ? result.substring(idx + 7) : result
      setEditFileName(f.name)
      setEditFileData(b64)
    }
    reader.onerror = () => {
      setFileError('Failed to read file')
      setEditFileName(null)
      setEditFileData(null)
    }
    reader.readAsDataURL(f)
  }

  const handleDelete = async () => {
    if (!submittedRegistration) return
    try {
      const res = await fetch(`http://localhost:8000/registrations/${submittedRegistration.id}`, {
        method: "DELETE",
        headers: { "X-User-Email": user?.email || "" },
      })
      if (res.ok) {
        toast.success("Registration deleted")
        setSubmittedRegistration(null)
        setDeleteOpen(false)
        await fetchRegistrations()
      } else {
        const data = await res.json()
        toast.error(data.message || "Delete failed")
      }
    } catch (err) {
      toast.error("Error connecting to server")
    }
  }

  const openEditDialog = () => {
    if (!submittedRegistration) return
    setEditTitle(submittedRegistration.title || "")
    setEditAbstract(submittedRegistration.abstract || "")
    setEditFileName(null)
    setEditFileData(null)
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!submittedRegistration) return
    setLoading(true)
    try {
      const payload: any = { title: editTitle, abstract: editAbstract }
      if (editFileName && editFileData) {
        payload.attachment = { name: editFileName, data: editFileData }
      }
      const res = await fetch(`http://localhost:8000/registrations/${submittedRegistration.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-User-Email": user?.email || "" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Registration updated")
        setSubmittedRegistration(data.registration)
        setEditOpen(false)
        await fetchRegistrations()
      } else {
        toast.error(data.message || "Update failed")
      }
    } catch (err) {
      toast.error("Error connecting to server")
    }
    setLoading(false)
  }

  const downloadAttachment = async (attId: number, filename?: string) => {
    if (!user?.email) return
    setDownloadLoadingId(attId)
    try {
      const res = await fetch(`http://localhost:8000/attachments/${attId}/download`, {
        headers: { "X-User-Email": user.email },
      })
      if (!res.ok) {
        toast.error('Failed to download')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'attachment'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      toast.error('Error downloading file')
    } finally {
      setDownloadLoadingId(null)
    }
  }

  const getStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase()
    switch (s) {
      case "pending_approval":
        return <Badge variant="outline" className="border-yellow-400 text-yellow-600 gap-1"><Clock className="h-3 w-3" />Pending Approval</Badge>
      case "approved":
        return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" />Approved</Badge>
      case "registered":
        return <Badge className="bg-emerald-500 gap-1"><CheckCircle2 className="h-3 w-3" />Verified</Badge>
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FYP Registration</h1>
          <p className="text-muted-foreground">Submit and manage your project registrations</p>
        </div>
        <Button onClick={fetchRegistrations} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription>Total Registrations</CardDescription>
            <CardTitle className="text-2xl">{registrations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl">{registrations.filter(r => r.status === "approved" || r.status === "registered").length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">{registrations.filter(r => r.status === "pending_approval").length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar - Registration List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Registrations</CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                setIsCreating(true)
                setSelectedRegistrationId(null)
                setSubmittedRegistration(null)
                setTitle("")
                setSupervisor("")
                setAbstract("")
                setFileName(null)
                setFileData(null)
              }} className="gap-1">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : registrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registrations yet</p>
            ) : (
              <div className="space-y-2">
                {registrations.map((r) => (
                  <button
                    key={r.id}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedRegistrationId === r.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted border-transparent'}`}
                    onClick={() => { setSelectedRegistrationId(r.id); setSubmittedRegistration(r); setIsCreating(false); }}
                  >
                    <div className="font-medium text-sm truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      {r.supervisor}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Panel */}
        <Card className="md:col-span-3">
          {!submittedRegistration ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  New Registration
                </CardTitle>
                <CardDescription>Submit a new FYP project registration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Title</Label>
                  <Input data-testid="project-title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter your project title" />
                </div>
                <div className="space-y-2">
                  <Label>Supervisor Email</Label>
                  <Input data-testid="supervisor-email-input" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} placeholder="supervisor@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Abstract</Label>
                  <Textarea data-testid="project-abstract-input" value={abstract} onChange={(e) => setAbstract(e.target.value)} placeholder="Describe your project..." rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Attachment (optional)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.odt,.xls,.xlsx,.zip"
                      onChange={onFileChange}
                      className="hidden"
                    />
                    <Button size="sm" variant="outline" type="button" onClick={() => fileInputRef.current?.click()} className="gap-2">
                      <Upload className="h-4 w-4" />
                      Browse
                    </Button>
                    <span className="text-sm text-muted-foreground">{fileName ? fileName : 'No file chosen'}</span>
                  </div>
                  {fileError && <p className="text-sm text-red-600">{fileError}</p>}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" onClick={() => {
                  setIsCreating(false)
                  setTitle("")
                  setSupervisor("")
                  setAbstract("")
                  setFileName(null)
                  setFileData(null)
                }}>Cancel</Button>
                <Button data-testid="submit-registration-btn" onClick={submit} disabled={loading} className="gap-2">
                  <Send className="h-4 w-4" />
                  {loading ? "Submitting..." : "Submit Registration"}
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{submittedRegistration.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      {submittedRegistration.supervisor}
                    </CardDescription>
                  </div>
                  {getStatusBadge(submittedRegistration.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Remarks */}
                {submittedRegistration.remarks && (
                  <div className="p-3 bg-muted/50 border rounded-lg">
                    <p className="text-sm"><span className="font-medium">Supervisor Remarks:</span> {submittedRegistration.remarks}</p>
                  </div>
                )}

                {/* Abstract */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Abstract
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted/50 rounded-lg border">
                    {submittedRegistration.abstract || "(No abstract provided)"}
                  </p>
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <File className="h-4 w-4" />
                    Attachments
                  </h4>
                  {attachmentsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attachments</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((a) => (
                        <Button key={a.id} size="sm" variant="outline" onClick={() => downloadAttachment(a.id, a.filename)} disabled={downloadLoadingId === a.id} className="gap-2">
                          <Download className="h-3 w-3" />
                          {downloadLoadingId === a.id ? 'Downloading...' : a.filename}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button size="sm" variant="outline" onClick={openEditDialog} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Registration
            </DialogTitle>
            <DialogDescription>Update your registration details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Abstract</Label>
              <Textarea value={editAbstract} onChange={(e) => setEditAbstract(e.target.value)} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Attach new file (optional)</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.odt,.xls,.xlsx,.zip"
                  onChange={onEditFileChange}
                  className="hidden"
                />
                <Button size="sm" variant="outline" type="button" onClick={() => editFileInputRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Browse
                </Button>
                <span className="text-sm text-muted-foreground">{editFileName || 'No file chosen'}</span>
              </div>
              {fileError && <p className="text-sm text-red-600">{fileError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Registration
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this registration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
