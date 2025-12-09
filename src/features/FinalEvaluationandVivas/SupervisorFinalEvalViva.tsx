import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  RefreshCw,
  Search,
  FileText,
  Users,
  TrendingUp,
  Award,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type CommitteeMember = {
  id: string;
  name: string;
  email: string;
  role: "Chairman" | "Internal" | "External";
};

type StudentFinalEval = {
  studentEmail: string;
  studentName: string;
  projectTitle: string;
  status: "pending" | "scheduled" | "in-progress" | "completed" | "published";
  vivaDate?: string;
  committee: CommitteeMember[];
  weightedAverage?: number;
  finalGrade?: string;
  publishedAt?: string;
  completedAt?: string;
};

export default function SupervisorFinalEvalViva() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentFinalEval[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentFinalEval | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSupervisedStudents();
  }, []);

  const fetchSupervisedStudents = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockStudents: StudentFinalEval[] = [
        {
          studentEmail: "student1@uni.edu",
          studentName: "Ali Ahmed",
          projectTitle: "AI-Based Project Management System",
          status: "published",
          vivaDate: "2025-12-15T10:00:00",
          committee: [
            { id: "c1", name: "Dr. Ahmed Khan", email: "dr.ahmed@uni.edu", role: "Chairman" },
            { id: "c2", name: "Dr. Fatima Ali", email: "dr.fatima@uni.edu", role: "Internal" },
            { id: "c3", name: "Prof. James Wilson", email: "prof.james@uni.edu", role: "External" },
          ],
          weightedAverage: 84.33,
          finalGrade: "A",
          publishedAt: "2025-12-15T13:00:00",
          completedAt: "2025-12-15T12:00:00",
        },
        {
          studentEmail: "student2@uni.edu",
          studentName: "Fatima Khan",
          projectTitle: "Machine Learning for Healthcare",
          status: "published",
          vivaDate: "2025-12-16T14:00:00",
          committee: [
            { id: "c4", name: "Prof. Sarah Smith", email: "prof.sarah@uni.edu", role: "Chairman" },
            { id: "c5", name: "Dr. Hassan Ali", email: "dr.hassan@uni.edu", role: "Internal" },
            { id: "c6", name: "Dr. Emily Brown", email: "dr.emily@uni.edu", role: "External" },
          ],
          weightedAverage: 76.5,
          finalGrade: "B",
          publishedAt: "2025-12-16T15:00:00",
          completedAt: "2025-12-16T14:30:00",
        },
        {
          studentEmail: "student3@uni.edu",
          studentName: "Muhammad Hassan",
          projectTitle: "Cloud Computing Infrastructure",
          status: "in-progress",
          vivaDate: "2025-12-17T11:00:00",
          committee: [
            { id: "c7", name: "Dr. John Smith", email: "dr.john@uni.edu", role: "Chairman" },
            { id: "c8", name: "Prof. Lisa Anderson", email: "prof.lisa@uni.edu", role: "Internal" },
          ],
          completedAt: undefined,
        },
        {
          studentEmail: "student4@uni.edu",
          studentName: "Asha Patel",
          projectTitle: "Blockchain-Based Supply Chain",
          status: "scheduled",
          vivaDate: "2025-12-20T10:00:00",
          committee: [
            { id: "c9", name: "Prof. Michael Chen", email: "prof.michael@uni.edu", role: "Chairman" },
          ],
        },
      ];

      setStudents(mockStudents);
      if (mockStudents.length > 0) {
        setSelectedStudent(mockStudents[0]);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      toast.error("Failed to fetch supervised students");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSupervisedStudents();
      toast.success("Data refreshed successfully");
    } catch (err) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-gray-100">Pending</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "in-progress":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case "published":
        return <Badge className="bg-purple-600">Published</Badge>;
      default:
        return null;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-600";
      case "B":
        return "bg-blue-600";
      case "C":
        return "bg-yellow-600";
      case "D":
        return "bg-orange-600";
      default:
        return "bg-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <RefreshCw className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-600">Loading your students' final evaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supervised Students - Final Evaluations</h1>
          <p className="text-gray-600 mt-1">View final evaluation results for all your supervised students</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Published</p>
          <p className="text-2xl font-bold text-purple-600">
            {students.filter((s) => s.status === "published").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">
            {students.filter((s) => s.status === "in-progress").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Scheduled</p>
          <p className="text-2xl font-bold text-blue-600">
            {students.filter((s) => s.status === "scheduled").length}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-1">
          <Card className="p-4 h-full flex flex-col">
            <h2 className="font-semibold text-gray-900 mb-4">Students ({filteredStudents.length})</h2>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Students List */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              {filteredStudents.map((student) => (
                <button
                  key={student.studentEmail}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedStudent?.studentEmail === student.studentEmail
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{student.studentName}</p>
                      <p className="text-xs text-gray-600 truncate">{student.studentEmail}</p>
                      {student.finalGrade && (
                        <p className="text-xs text-gray-500 mt-1">{student.projectTitle}</p>
                      )}
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {student.finalGrade && (
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold ${getGradeColor(
                            student.finalGrade
                          )}`}
                        >
                          {student.finalGrade}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    {getStatusBadge(student.status)}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="space-y-4">
              {/* Project Card */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{selectedStudent.projectTitle}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedStudent.studentName}</p>
                    <p className="text-sm text-gray-600">{selectedStudent.studentEmail}</p>
                  </div>
                  {getStatusBadge(selectedStudent.status)}
                </div>
              </Card>

              {/* Status Alert */}
              {selectedStudent.status === "published" && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✓ Final grades published and visible to student
                  </AlertDescription>
                </Alert>
              )}

              {selectedStudent.status === "in-progress" && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Viva evaluation in progress. Results will be published once completed.
                  </AlertDescription>
                </Alert>
              )}

              {selectedStudent.status === "scheduled" && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Viva scheduled for{" "}
                    {selectedStudent.vivaDate &&
                      new Date(selectedStudent.vivaDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                  </AlertDescription>
                </Alert>
              )}

              {/* Grade Display */}
              {selectedStudent.finalGrade && selectedStudent.weightedAverage !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-700">Weighted Average</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedStudent.weightedAverage.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg ${getGradeColor(
                          selectedStudent.finalGrade
                        )}`}
                      >
                        {selectedStudent.finalGrade}
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">Final Grade</p>
                        <p className="text-sm text-gray-900 font-semibold">
                          {selectedStudent.finalGrade === "A"
                            ? "Excellent"
                            : selectedStudent.finalGrade === "B"
                            ? "Very Good"
                            : selectedStudent.finalGrade === "C"
                            ? "Good"
                            : "Satisfactory"}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Committee Members */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Evaluation Committee ({selectedStudent.committee.length})
                </h3>
                <Separator className="mb-4" />

                <div className="space-y-2">
                  {selectedStudent.committee.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          member.role === "Chairman"
                            ? "bg-purple-100 text-purple-800"
                            : member.role === "Internal"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Viva Info */}
              {selectedStudent.vivaDate && (
                <Card className="p-4 bg-gray-50 border-gray-200">
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Viva Date & Time:</span>
                  </p>
                  <p className="text-gray-900">
                    {new Date(selectedStudent.vivaDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Card>
              )}

              {/* Timeline */}
              {selectedStudent.completedAt && (
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Completed:</span>
                  </p>
                  <p className="text-gray-900">
                    {new Date(selectedStudent.completedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Card>
              )}

              {selectedStudent.publishedAt && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Published:</span>
                  </p>
                  <p className="text-gray-900">
                    {new Date(selectedStudent.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Card>
              )}
            </div>
          ) : (
            <Card className="p-12 flex items-center justify-center">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a student to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
