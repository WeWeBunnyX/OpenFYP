import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CoordinatorPanel() {
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

  const statusLabel = (s: string) => {
    switch (s) {
      case "pending_approval":
        return "Pending Approval"
      case "approved":
        return "Approved (awaiting verification)"
      case "registered":
        return "Registered"
      case "rejected":
        return "Rejected"
      default:
        return s
    }
  }

  React.useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const verify = async (id: number) => {
    const res = await fetch(`http://localhost:8000/registrations/${id}/verify`, {
      method: "PATCH",
      headers: { "X-User-Email": user?.email || "" },
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(data.message)
      load()
    } else {
      setMessage(data.message || "Verify failed")
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>All Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {message && <div className="mb-2">{message}</div>}
          <div className="space-y-4">
            {regs.length === 0 && <div>No registrations</div>}
            {regs.map((r) => (
              <div key={r.id} className="p-3 border rounded-md">
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-muted-foreground">By: {r.owner} — Supervisor: {r.supervisor} — Status: {statusLabel(r.status)}</div>
                <div className="mt-2">{r.abstract}</div>
                {r.status !== "registered" && (
                  <div className="mt-3">
                    <Button onClick={() => verify(r.id)}>Mark as Verified</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
