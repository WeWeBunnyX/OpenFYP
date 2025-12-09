import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  User,
  Mail,
  Shield,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

type UserRecord = {
  id: string
  name: string
  email: string
  role: "Student" | "Supervisor" | "Coordinator" | "Committee"
  status: "active" | "inactive"
  joinedAt: string
  department?: string
}

export default function UsersAndRoles() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = React.useState<UserRecord[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedRole, setSelectedRole] = React.useState<"all" | "Student" | "Supervisor" | "Coordinator" | "Committee">("all")

  // Mock data - replace with API call
  const mockUsers: UserRecord[] = [
    { id: "1", name: "Ahmed Khan", email: "test@example.com", role: "Student", status: "active", joinedAt: "2024-09-15", department: "CS" },
    { id: "2", name: "Dr. Fatima Ali", email: "supervisor@example.com", role: "Supervisor", status: "active", joinedAt: "2023-01-10", department: "CS" },
    { id: "3", name: "Dr. Sara Smith", email: "coordinator@example.com", role: "Coordinator", status: "active", joinedAt: "2023-06-20", department: "Admin" },
    { id: "4", name: "Prof. James Wilson", email: "committee1@example.com", role: "Committee", status: "active", joinedAt: "2024-01-05", department: "CS" },
    { id: "5", name: "Maria Garcia", email: "student2@example.com", role: "Student", status: "active", joinedAt: "2024-09-15", department: "CS" },
    { id: "6", name: "John Smith", email: "supervisor2@example.com", role: "Supervisor", status: "active", joinedAt: "2023-02-12", department: "SE" },
    { id: "7", name: "Lisa Chen", email: "committee2@example.com", role: "Committee", status: "inactive", joinedAt: "2024-03-01", department: "CS" },
    { id: "8", name: "David Brown", email: "student3@example.com", role: "Student", status: "active", joinedAt: "2024-10-01", department: "AI" },
  ]

  React.useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const res = await fetch("http://localhost:8000/users", {
      //   headers: { "X-User-Email": currentUser?.email || "" }
      // })
      // const data = await res.json()
      // setUsers(data.users || [])

      // Using mock data for now
      setUsers(mockUsers)
      toast.success("Users loaded successfully")
    } catch (err) {
      toast.error("Failed to load users")
      setUsers(mockUsers)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || u.role === selectedRole
    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Student":
        return "bg-blue-500"
      case "Supervisor":
        return "bg-green-500"
      case "Coordinator":
        return "bg-purple-500"
      case "Committee":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Student":
        return "👨‍🎓"
      case "Supervisor":
        return "👨‍🏫"
      case "Coordinator":
        return "📋"
      case "Committee":
        return "👥"
      default:
        return "👤"
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-500 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="border-gray-300 text-gray-600 gap-1">
        <Clock className="h-3 w-3" />
        Inactive
      </Badge>
    )
  }

  const roleStats = [
    { role: "Student", count: users.filter(u => u.role === "Student").length, color: "bg-blue-500", icon: "👨‍🎓" },
    { role: "Supervisor", count: users.filter(u => u.role === "Supervisor").length, color: "bg-green-500", icon: "👨‍🏫" },
    { role: "Coordinator", count: users.filter(u => u.role === "Coordinator").length, color: "bg-purple-500", icon: "📋" },
    { role: "Committee", count: users.filter(u => u.role === "Committee").length, color: "bg-orange-500", icon: "👥" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Users & Roles
          </h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" className="gap-2" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Role Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {roleStats.map((stat) => (
          <Card key={stat.role} className={`border-l-4 ${stat.color}`}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <span className="text-2xl">{stat.icon}</span>
                {stat.role}
              </CardDescription>
              <CardTitle className="text-3xl">{stat.count}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Current User Info */}
      {currentUser && (
        <Card className="border-2 border-blue-500 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Current User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`} />
                <AvatarFallback>{currentUser.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">{currentUser.name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {currentUser.email}
                </div>
              </div>
              <Badge className={`${getRoleColor(currentUser.role)} gap-2`}>
                <span>{getRoleIcon(currentUser.role)}</span>
                {currentUser.role}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List with Tabs and Search */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Browse and manage system users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Role Tabs */}
          <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">All</span>
              </TabsTrigger>
              <TabsTrigger value="Student" className="gap-1">
                <span>👨‍🎓</span>
                <span className="hidden sm:inline">Student</span>
              </TabsTrigger>
              <TabsTrigger value="Supervisor" className="gap-1">
                <span>👨‍🏫</span>
                <span className="hidden sm:inline">Supervisor</span>
              </TabsTrigger>
              <TabsTrigger value="Coordinator" className="gap-1">
                <span>📋</span>
                <span className="hidden sm:inline">Coordinator</span>
              </TabsTrigger>
              <TabsTrigger value="Committee" className="gap-1">
                <span>👥</span>
                <span className="hidden sm:inline">Committee</span>
              </TabsTrigger>
            </TabsList>

            {/* Users Grid */}
            <TabsContent value={selectedRole} className="space-y-4">
              {loading ? (
                <Card className="p-8 text-center text-muted-foreground">Loading users...</Card>
              ) : filteredUsers.length === 0 ? (
                <Card className="p-8 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No users found</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((u) => (
                    <Card key={u.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-4 flex items-center gap-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} />
                          <AvatarFallback>{u.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </span>
                            {u.department && (
                              <span className="text-xs bg-muted px-2 py-1 rounded">{u.department}</span>
                            )}
                          </div>
                        </div>

                        {/* Role Badge */}
                        <Badge className={`${getRoleColor(u.role)} gap-2 flex-shrink-0`}>
                          <span>{getRoleIcon(u.role)}</span>
                          {u.role}
                        </Badge>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          {getStatusBadge(u.status)}
                        </div>
                      </div>
                      {u.joinedAt && (
                        <div className="px-4 pb-3 text-xs text-muted-foreground border-t pt-2">
                          Joined: {new Date(u.joinedAt).toLocaleDateString()}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-muted/50 border text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

