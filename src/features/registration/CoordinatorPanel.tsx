import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

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

  const load = async () => {
    const res = await fetch("http://localhost:8000/registrations", {
      headers: { "X-User-Email": user?.email || "" },
    })
    const data = await res.json()
    setRegs((data.registrations || []) as Registration[])
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case "pending_approval":
        return "Pending Approval"
      case "approved":
        return "Approved (awaiting verification)"
      case "scheduled":
        return "Scheduled"
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
    try {
      setLoadingIds((s) => [...s, id])
      const res = await fetch(`http://localhost:8000/registrations/${id}/verify`, {
        method: "PATCH",
        headers: { "X-User-Email": user?.email || "" },
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        setStatusDialogOpenId(null)
        await load()
      } else {
        setMessage(data.message || "Verify failed")
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
        setMessage(data.message)
        await load()
      } else {
        setMessage(data.message || "Unverify failed")
      }
    } finally {
      setLoadingIds((s) => s.filter((x) => x !== id))
    }
  }

  const handleMark = (r: Registration) => {
    // Only allow verification if registration is approved
    if (r.status === "approved") {
      verify(r.id)
      return
    }

    // otherwise show dialog warning
    setStatusDialogText("Only proposal registrations approved by the supervisor can be verified")
    setStatusDialogOpenId(r.id)
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
                <div className="mt-3 flex items-center gap-3">
                  {r.status === "approved" && (
                    <Button onClick={() => handleMark(r)} disabled={loadingIds.includes(r.id)}>
                      {loadingIds.includes(r.id) ? "Verifying..." : "Mark as Verified"}
                    </Button>
                  )}

                  {r.status === "registered" && (
                    <>
                      <Button variant="outline" disabled>
                        Mark as Verified
                      </Button>
                      <Button variant="destructive" onClick={() => unverify(r.id)} disabled={loadingIds.includes(r.id)}>
                        {loadingIds.includes(r.id) ? "Working..." : "Mark as Unverified"}
                      </Button>
                    </>
                  )}

                  {r.status === "scheduled" && (
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 border border-teal-200 text-teal-800">Scheduled</div>
                  )}

                  {r.status !== "approved" && r.status !== "registered" && r.status !== "scheduled" && (
                    <Button onClick={() => handleMark(r)}>Mark as Verified</Button>
                  )}
                </div>
                {statusDialogOpenId === r.id && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md flex justify-between items-center">
                    <div className="text-sm">{statusDialogText}</div>
                    <Button variant="outline" onClick={() => setStatusDialogOpenId(null)}>OK</Button>
                  </div>
                )}

                {r.status === "registered" && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md flex justify-between items-center">
                    <div className="text-sm">This registration is verified (registered).</div>
                    <div />
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
