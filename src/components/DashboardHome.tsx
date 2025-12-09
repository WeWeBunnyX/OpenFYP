import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/AuthContext"
import {
    Users,
    FileText,
    Calendar,
    CheckCircle2,
    Clock,
    TrendingUp,
    GraduationCap,
    ClipboardList,
    AlertCircle,
    Activity
} from "lucide-react"

type DashboardHomeProps = {
    role: "Coordinator" | "Student" | "Supervisor"
    onNavigate?: (view: string) => void
}

export default function DashboardHome({ role, onNavigate }: DashboardHomeProps) {
    const { user } = useAuth()
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const getInitials = (email: string) => {
        return email?.substring(0, 2).toUpperCase() || "U"
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good Morning"
        if (hour < 18) return "Good Afternoon"
        return "Good Evening"
    }

    // Role-specific content
    const roleContent = {
        Coordinator: {
            title: "Coordinator Dashboard",
            subtitle: "Manage FYP registrations, evaluations, and schedules",
            stats: [
                { label: "Pending Registrations", value: "12", icon: FileText, color: "text-orange-500", bg: "bg-orange-50" },
                { label: "Scheduled Defenses", value: "8", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Active Students", value: "45", icon: Users, color: "text-green-500", bg: "bg-green-50" },
                { label: "Completed Evaluations", value: "32", icon: CheckCircle2, color: "text-purple-500", bg: "bg-purple-50" },
            ],
            quickActions: [
                { label: "Review Registrations", key: "registration", icon: ClipboardList },
                { label: "Schedule Defenses", key: "proposal", icon: Calendar },
                { label: "View Schedules", key: "schedule", icon: Clock },
                { label: "Track Progress", key: "progress", icon: TrendingUp },
            ],
            recentActivity: [
                { text: "New registration submitted by student@example.com", time: "2 hours ago", type: "info" },
                { text: "Defense scheduled for Project Alpha", time: "4 hours ago", type: "success" },
                { text: "Evaluation completed for Project Beta", time: "Yesterday", type: "success" },
                { text: "3 registrations pending approval", time: "Yesterday", type: "warning" },
            ]
        },
        Student: {
            title: "Student Dashboard",
            subtitle: "Track your FYP progress and submissions",
            stats: [
                { label: "Registration Status", value: "Approved", icon: FileText, color: "text-green-500", bg: "bg-green-50" },
                { label: "Progress Logs", value: "12/24", icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Next Defense", value: "Dec 15", icon: Calendar, color: "text-orange-500", bg: "bg-orange-50" },
                { label: "Overall Progress", value: "50%", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
            ],
            quickActions: [
                { label: "Submit Registration", key: "registration", icon: FileText },
                { label: "Upload Progress Log", key: "progress", icon: ClipboardList },
                { label: "View Schedule", key: "schedule", icon: Calendar },
                { label: "Check Grades", key: "grading", icon: GraduationCap },
            ],
            recentActivity: [
                { text: "Progress log #12 submitted successfully", time: "1 day ago", type: "success" },
                { text: "Defense scheduled for December 15", time: "3 days ago", type: "info" },
                { text: "Registration approved by coordinator", time: "1 week ago", type: "success" },
                { text: "Supervisor feedback received", time: "1 week ago", type: "info" },
            ]
        },
        Supervisor: {
            title: "Supervisor Dashboard",
            subtitle: "Monitor and evaluate your assigned students",
            stats: [
                { label: "Assigned Students", value: "8", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Pending Reviews", value: "3", icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
                { label: "Evaluations Done", value: "15", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
                { label: "Upcoming Defenses", value: "2", icon: Calendar, color: "text-purple-500", bg: "bg-purple-50" },
            ],
            quickActions: [
                { label: "Review Registrations", key: "registration", icon: FileText },
                { label: "Evaluate Progress", key: "progress", icon: ClipboardList },
                { label: "View Schedules", key: "schedule", icon: Calendar },
                { label: "Submit Grades", key: "grading", icon: GraduationCap },
            ],
            recentActivity: [
                { text: "Student John submitted progress log #15", time: "3 hours ago", type: "info" },
                { text: "Evaluation submitted for Sarah's project", time: "1 day ago", type: "success" },
                { text: "New student assigned: Mike Wilson", time: "2 days ago", type: "info" },
                { text: "Defense scheduled for Dec 20", time: "3 days ago", type: "warning" },
            ]
        }
    }

    const content = roleContent[role]

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                            {getInitials(user?.email || "")}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}!</h1>
                        <p className="text-muted-foreground">{user?.email}</p>
                        <p className="text-sm text-muted-foreground">{currentDate}</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-sm px-3 py-1">
                    <GraduationCap className="h-4 w-4 mr-1" />
                    {role}
                </Badge>
            </div>

            <Separator />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {content.stats.map((stat, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>Common tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            {content.quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => onNavigate?.(action.key)}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                                >
                                    <div className="p-2 rounded-md bg-primary/10">
                                        <action.icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Latest updates and notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {content.recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className={`mt-1 p-1 rounded-full ${
                                        activity.type === 'success' ? 'bg-green-100' :
                                        activity.type === 'warning' ? 'bg-orange-100' :
                                        'bg-blue-100'
                                    }`}>
                                        {activity.type === 'success' ? (
                                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                                        ) : activity.type === 'warning' ? (
                                            <AlertCircle className="h-3 w-3 text-orange-600" />
                                        ) : (
                                            <Clock className="h-3 w-3 text-blue-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm leading-tight">{activity.text}</p>
                                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Overview (for Student) */}
            {role === "Student" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            FYP Progress Overview
                        </CardTitle>
                        <CardDescription>Your project completion status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Registration</span>
                                <span className="text-green-600 font-medium">Complete</span>
                            </div>
                            <Progress value={100} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progress Logs (12/24)</span>
                                <span className="text-blue-600 font-medium">50%</span>
                            </div>
                            <Progress value={50} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Proposal Defense</span>
                                <span className="text-orange-600 font-medium">Scheduled</span>
                            </div>
                            <Progress value={75} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Interim Evaluation</span>
                                <span className="text-muted-foreground font-medium">Pending</span>
                            </div>
                            <Progress value={0} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Supervisor Student Overview */}
            {role === "Supervisor" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Student Overview
                        </CardTitle>
                        <CardDescription>Progress of your assigned students</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { name: "John Doe", email: "john@example.com", progress: 75, status: "On Track" },
                                { name: "Sarah Smith", email: "sarah@example.com", progress: 60, status: "On Track" },
                                { name: "Mike Wilson", email: "mike@example.com", progress: 40, status: "Needs Attention" },
                            ].map((student, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                            {student.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{student.name}</p>
                                            <Badge variant={student.status === "On Track" ? "default" : "destructive"} className="text-xs">
                                                {student.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{student.email}</p>
                                        <div className="flex items-center gap-2">
                                            <Progress value={student.progress} className="h-1.5 flex-1" />
                                            <span className="text-xs text-muted-foreground">{student.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Coordinator Overview */}
            {role === "Coordinator" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            System Overview
                        </CardTitle>
                        <CardDescription>FYP program statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2 p-4 rounded-lg bg-green-50 border border-green-200">
                                <p className="text-sm font-medium text-green-800">Approved Projects</p>
                                <p className="text-3xl font-bold text-green-600">28</p>
                                <p className="text-xs text-green-600">+5 this week</p>
                            </div>
                            <div className="space-y-2 p-4 rounded-lg bg-orange-50 border border-orange-200">
                                <p className="text-sm font-medium text-orange-800">Pending Review</p>
                                <p className="text-3xl font-bold text-orange-600">12</p>
                                <p className="text-xs text-orange-600">3 urgent</p>
                            </div>
                            <div className="space-y-2 p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <p className="text-sm font-medium text-blue-800">Scheduled Defenses</p>
                                <p className="text-3xl font-bold text-blue-600">8</p>
                                <p className="text-xs text-blue-600">Next: Dec 15</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

