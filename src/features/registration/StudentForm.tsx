import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function StudentForm() {
  const { user } = useAuth()
  const [title, setTitle] = React.useState("")
  const [supervisor, setSupervisor] = React.useState("")
  const [abstract, setAbstract] = React.useState("")
  const [message, setMessage] = React.useState<string | null>(null)

  const submit = async () => {
    try {
      const res = await fetch("http://localhost:8000/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": user?.email || "",
        },
        body: JSON.stringify({ title, supervisor, abstract }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("Submitted successfully")
      } else {
        setMessage(data.message || "Submission failed")
      }
    } catch (err) {
      setMessage("Error connecting to server")
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>FYP Registration</CardTitle>
        </CardHeader>
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
            {message && <div className="text-sm text-muted-foreground">{message}</div>}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={submit}>Submit Registration</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
