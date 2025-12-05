import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

export default function SupervisorPanel() {
  const { user } = useAuth()
  const [regs, setRegs] = React.useState<any[]>([])
  const [message, setMessage] = React.useState<string | null>(null)
  const [actionOpen, setActionOpen] = React.useState(false)
  const [actionRegId, setActionRegId] = React.useState<number | null>(null)
  const [actionType, setActionType] = React.useState<"approve" | "reject" | null>(null)
  const [actionRemarks, setActionRemarks] = React.useState<string>("")

  const load = async () => {
    const res = await fetch("http://localhost:8000/registrations", {
      headers: { "X-User-Email": user?.email || "" },
    })
    const data = await res.json()
    setRegs(data.registrations || [])
  }

  const loadNotifications = async () => {
    const res = await fetch("http://localhost:8000/notifications", {
      headers: { "X-User-Email": user?.email || "" },
    })
    const data = await res.json()
    // show latest notification as message for demo
    if (data.notifications && data.notifications.length) {
      setMessage(data.notifications[data.notifications.length - 1].message)
    }
  }

  React.useEffect(() => {
    load()
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openAction = (id: number, verb: "approve" | "reject") => {
    setActionRegId(id)
    setActionType(verb)
    setActionRemarks("")
    setActionOpen(true)
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
        setMessage(data.message)
        setActionOpen(false)
        await load()
      } else {
        setMessage(data.message || "Action failed")
      }
    } catch (e) {
      setMessage("Error connecting to server")
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {message && <div className="mb-2">{message}</div>}
          <div className="space-y-4">
            {regs.length === 0 && <div>No registrations</div>}
            {regs.map((r) => (
              <div key={r.id} className="p-3 border rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-sm text-muted-foreground">By: {r.owner}</div>
                    <div className="mt-2">{r.abstract}</div>
                    <div className="mt-2 text-sm">Status: <strong>{r.status}</strong></div>
                    {r.remarks && <div className="mt-1 text-sm text-muted-foreground">Remarks: {r.remarks}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-muted-foreground">Submitted: {new Date(r.created_at).toLocaleString()}</div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => openAction(r.id, "approve")}>Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => openAction(r.id, "reject")}>Reject</Button>
                    </div>
                  </div>
                </div>
                {r.history && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {r.history.map((h: any, i: number) => (
                      <div key={i}>{`${h.actor} — ${h.action} — ${h.note}`}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? 'Approve Registration' : 'Reject Registration'}</DialogTitle>
            <DialogDescription>Optionally add remarks for the student (visible to student).</DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <label className="block text-sm mb-1">Remarks</label>
            <textarea className="w-full border rounded p-2" rows={4} value={actionRemarks} onChange={(e) => setActionRemarks(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button>
            <Button onClick={confirmAction}>{actionType === 'approve' ? 'Approve' : 'Reject'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
