import React from "react"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import CoordinatorDashboard from "@/dashboards/CoordinatorDashboard"
import StudentDashboard from "@/dashboards/StudentDashboard"
import SupervisorDashboard from "@/dashboards/SupervisorDashboard"
import CommitteeDashboard from "@/dashboards/CommitteeDashboard"

function LoginForm() {
    const { login } = useAuth()
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [message, setMessage] = React.useState<string | null>(null)

    const submit = async () => {
        try {
            await login(email, password)
        } catch (err: any) {
            setMessage(err?.message || "Login failed")
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-center">Welcome to OpenFYP</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" placeholder="test@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input type="password" id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    {message && <p className="text-center mt-2 text-red-600">{message}</p>}
                </CardContent>

                <CardFooter>
                    <Button className="w-full" onClick={submit}>
                        Submit
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

function AppInner() {
    const { user, logout } = useAuth()

    if (!user) return <LoginForm />

    switch (user.role) {
        case "Coordinator":
            return <CoordinatorDashboard onLogout={logout} />
        case "Supervisor":
            return <SupervisorDashboard onLogout={logout} />
        case "Student":
            return <StudentDashboard onLogout={logout} />
        case "Committee":
            return <CommitteeDashboard onLogout={logout} />
        default:
            return <div>Unknown role</div>
    }
}

export default function App() {
    return (
        <AuthProvider>
            <AppInner />
        </AuthProvider>
    )
}
