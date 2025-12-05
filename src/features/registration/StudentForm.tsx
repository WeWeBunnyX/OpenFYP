import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

export default function StudentForm() {
  const { user } = useAuth()
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const editFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [title, setTitle] = React.useState("")
  const [supervisor, setSupervisor] = React.useState("")
  const [abstract, setAbstract] = React.useState("")
  const [message, setMessage] = React.useState<string | null>(null)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [fileData, setFileData] = React.useState<string | null>(null) // base64 data
  const [fileError, setFileError] = React.useState<string | null>(null)
  const [submittedRegistration, setSubmittedRegistration] = React.useState<any | null>(null)
  const [registrations, setRegistrations] = React.useState<any[]>([])
  const [selectedRegistrationId, setSelectedRegistrationId] = React.useState<number | null>(null)
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
    // load existing registration for student on mount
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
        setRegistrations(json.registrations)
        if (json.registrations.length > 0) {
          // default to first
          setSelectedRegistrationId(json.registrations[0].id)
          setSubmittedRegistration(json.registrations[0])
        } else {
          setSelectedRegistrationId(null)
          setSubmittedRegistration(null)
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
        setMessage("Submitted successfully")
        // refresh list and select new registration
        await fetchRegistrations()
        if (data.registration) {
          setSubmittedRegistration(data.registration)
          setSelectedRegistrationId(data.registration.id)
        }
      } else {
        setMessage(data.message || "Submission failed")
      }
    } catch (err) {
      setMessage("Error connecting to server")
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
    const allowed = [
      ".pdf",
      ".doc",
      ".docx",
      ".odt",
      ".xls",
      ".xlsx",
      ".zip",
    ]
    const lower = f.name.toLowerCase()
    if (!allowed.some((ext) => lower.endsWith(ext))) {
      setFileError('Unsupported file type')
      setFileName(null)
      setFileData(null)
      return
    }
    // limit file size to something reasonable (e.g., 10MB)
    if (f.size > 10 * 1024 * 1024) {
      setFileError('File too large (max 10MB)')
      setFileName(null)
      setFileData(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip prefix data:*/*;base64,
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
    const allowed = [
      ".pdf",
      ".doc",
      ".docx",
      ".odt",
      ".xls",
      ".xlsx",
      ".zip",
    ]
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
        setMessage("Registration deleted")
        setSubmittedRegistration(null)
        setDeleteOpen(false)
        await fetchRegistrations()
      } else {
        const data = await res.json()
        setMessage(data.message || "Delete failed")
      }
    } catch (err) {
      setMessage("Error connecting to server")
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
        setMessage("Registration updated")
        setSubmittedRegistration(data.registration)
        setEditOpen(false)
        await fetchRegistrations()
      } else {
        setMessage(data.message || "Update failed")
      }
    } catch (err) {
      setMessage("Error connecting to server")
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
        setMessage('Failed to download')
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
      setMessage('Error downloading file')
    } finally {
      setDownloadLoadingId(null)
    }
  }

  return (
    <div className="p-6 w-full flex">
      <Card className="w-full max-w-full">
        <CardHeader>
          <CardTitle>FYP Registration</CardTitle>
        </CardHeader>
        <div className="flex flex-col md:flex-row md:gap-6 items-start">
          <div className="md:w-1/4">
            <div className="border rounded-md p-4 h-full">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium">Your Registrations</div>
                <div className="ml-2">
                  <Button size="sm" className="shrink-0" variant="outline" onClick={() => { setSelectedRegistrationId(null); setSubmittedRegistration(null); }}>New</Button>
                </div>
              </div>
              {loading ? (
                <div className="text-sm">Loading...</div>
              ) : registrations.length === 0 ? (
                <div className="text-sm">No registrations</div>
              ) : (
                <ul className="space-y-2">
                  {registrations.map((r) => (
                    <li key={r.id}>
                      <button
                        className={`w-full text-left p-2 rounded ${selectedRegistrationId === r.id ? 'bg-accent' : 'hover:bg-muted'}`}
                        onClick={() => { setSelectedRegistrationId(r.id); setSubmittedRegistration(r); }}
                      >
                        <div className="font-medium">{r.title}</div>
                        <div className="text-xs text-muted-foreground">{r.supervisor}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="md:w-3/4">
            <div className="border rounded-md p-6 min-h-[220px]">
              {!submittedRegistration ? (
                <>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Project Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                      </div>
                      <div>
                        <Label>Supervisor Email</Label>
                        <Input value={supervisor} onChange={(e) => setSupervisor(e.target.value)} />
                      </div>
                      <div>
                        <Label>Abstract</Label>
                        <textarea className="w-full rounded-md p-2 border" value={abstract} onChange={(e) => setAbstract(e.target.value)} />
                      </div>
                      <div>
                        <Label>Attach file (optional)</Label>
                        <div className="mt-2 flex items-center gap-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.odt,.xls,.xlsx,.zip"
                            onChange={onFileChange}
                            className="hidden"
                          />
                          <Button size="sm" type="button" onClick={() => fileInputRef.current?.click()}>
                            Browse file
                          </Button>
                          <div className="text-sm">{fileName ? `Selected: ${fileName}` : 'No file chosen'}</div>
                        </div>
                        {fileError && <div className="text-sm text-red-600 mt-1">{fileError}</div>}
                      </div>
                      {message && <div className="text-sm text-muted-foreground">{message}</div>}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={submit}>Submit Registration</Button>
                  </CardFooter>
                </>
              ) : (
                <>
                  <CardContent>
                    <div className="p-4">
                      <div className="font-medium">Submitted: {submittedRegistration.title}</div>
                      <div className="text-sm text-muted-foreground">Supervisor: {submittedRegistration.supervisor}</div>
                      {submittedRegistration.abstract && <div className="mt-2">{submittedRegistration.abstract}</div>}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full flex items-center justify-between gap-2">
                      <div>
                        {attachmentsLoading ? (
                          <div className="text-sm">Loading attachments...</div>
                        ) : attachments.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No attachments</div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {attachments.map((a) => (
                              <div key={a.id} className="flex items-center gap-2">
                                <div className="text-sm">{a.filename}</div>
                                <Button size="sm" onClick={() => downloadAttachment(a.id, a.filename)} disabled={downloadLoadingId === a.id}>
                                  {downloadLoadingId === a.id ? 'Downloading...' : 'View'}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={openEditDialog}>Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete your registration.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex items-center justify-end gap-2 mt-4">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardFooter>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Registration</DialogTitle>
              <DialogDescription>Update title, abstract or attach a new file.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Project Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div>
                <Label>Abstract</Label>
                <textarea className="w-full rounded-md p-2 border" value={editAbstract} onChange={(e) => setEditAbstract(e.target.value)} />
              </div>
              <div>
                <Label>Attach new file (optional)</Label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.odt,.xls,.xlsx,.zip"
                    onChange={onEditFileChange}
                    className="hidden"
                  />
                  <Button size="sm" type="button" onClick={() => editFileInputRef.current?.click()}>
                    Browse file
                  </Button>
                  <div className="text-sm">{editFileName ? `Selected: ${editFileName}` : 'No file chosen'}</div>
                </div>
                {fileError && <div className="text-sm text-red-600 mt-1">{fileError}</div>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}
