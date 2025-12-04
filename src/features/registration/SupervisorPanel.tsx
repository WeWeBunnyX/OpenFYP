import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SupervisorPanel() {
  const { user } = useAuth()
  const [regs, setRegs] = React.useState<any[]>([])
  const [message, setMessage] = React.useState<string | null>(null)

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

  const action = async (id: number, verb: "approve" | "reject") => {
    const res = await fetch(`http://localhost:8000/registrations/${id}/${verb}`, {
      method: "PATCH",
      headers: { "X-User-Email": user?.email || "" },
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(data.message)
      load()
    } else {
      setMessage(data.message || "Action failed")
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {message && <div className="mb-2">{message}</div>}
          <div className="space-y-4">
            {regs.length === 0 && <div>No pending registrations</div>}
            {regs.map((r) => (
              <div key={r.id} className="p-3 border rounded-md">
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-muted-foreground">By: {r.owner}</div>
                <div className="mt-2">{r.abstract}</div>
                {r.history && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {r.history.map((h: any, i: number) => (
                      <div key={i}>{`${h.actor} — ${h.action} — ${h.note}`}</div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => action(r.id, "approve")}>Approve</Button>
                  <Button variant="ghost" onClick={() => action(r.id, "reject")}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
