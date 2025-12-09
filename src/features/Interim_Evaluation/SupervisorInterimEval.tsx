import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock,
  User,
  FileText,
  GraduationCap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type ScheduleRecord = {
  id: number;
  start: string;
  end: string;
  slotMinutes: number;
  evaluators: string[];
  status: "scheduled" | "completed";
};

type StudentEvaluation = {
  email: string;
  name: string;
  projectTitle: string;
  registrationId?: number;
  logsSubmitted: number;
  supervisorEvaluationsComplete: boolean;
  eligibleForStage1: boolean;
  eligibleForStage2: boolean;
  interimStage1Status: "pending" | "scheduled" | "completed";
  interimStage1Marks?: number;
  interimStage1Schedule?: ScheduleRecord;
  interimStage1Feedback?: string;
  interimStage2Status: "pending" | "scheduled" | "completed";
  interimStage2Marks?: number;
  interimStage2Schedule?: ScheduleRecord;
  interimStage2Feedback?: string;
};

export default function SupervisorInterimEval() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentEvaluation[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentEvaluation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/interim-scheduling/supervisor/${encodeURIComponent(user?.email || "")}`
      );
      if (response.ok) {
        const data = await response.json();
        
        // Fetch marks for each student
        const studentsWithMarks = await Promise.all(
          data.map(async (student: any) => {
            try {
              const marksResponse = await fetch(
                `http://localhost:8000/api/interim-marks/student/${encodeURIComponent(student.email)}`
              );
              if (marksResponse.ok) {
                const marksData = await marksResponse.json();
                const stage1Marks = marksData.marks.find((m: any) => m.stage === 1);
                const stage2Marks = marksData.marks.find((m: any) => m.stage === 2);
                
                return {
                  ...student,
                  interimStage1Marks: stage1Marks?.marks,
                  interimStage1Feedback: stage1Marks?.feedback,
                  interimStage2Marks: stage2Marks?.marks,
                  interimStage2Feedback: stage2Marks?.feedback,
                };
              }
              return student;
            } catch (err) {
              console.log("No marks found for student:", student.email);
              return student;
            }
          })
        );
        
        setStudents(studentsWithMarks);
      } else {
        toast.error("Failed to fetch students");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      toast.error("Error fetching students");
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-gray-100">Pending</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      default:
        return null;
    }
  };

  const getEligibilityAlert = (student: StudentEvaluation) => {
    if (!student.supervisorEvaluationsComplete) {
      return (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Supervisor evaluations not yet complete for this student
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Interim Evaluations</h1>
        <p className="text-gray-600 mt-1">View interim evaluation status for your students</p>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or project title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Students List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Students ({filteredStudents.length})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingStudents ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : filteredStudents.length === 0 ? (
                <p className="text-sm text-gray-500">No students found</p>
              ) : (
                filteredStudents.map((student) => (
                  <button
                    key={student.email}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedStudent?.email === student.email
                        ? "bg-blue-100 border-2 border-blue-500"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-600 truncate">{student.email}</p>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {student.interimStage1Status === "completed" && (
                        <Badge className="bg-green-600 text-white text-xs">Stage 1 ✓</Badge>
                      )}
                      {student.interimStage2Status === "completed" && (
                        <Badge className="bg-green-600 text-white text-xs">Stage 2 ✓</Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-3">
          {selectedStudent ? (
            <Tabs defaultValue="stage1" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stage1">Stage 1</TabsTrigger>
                <TabsTrigger value="stage2">Stage 2</TabsTrigger>
              </TabsList>

              {/* Student Info */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h2>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">Email:</span> {selectedStudent.email}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Project:</span> {selectedStudent.projectTitle}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Progress Logs:</span> {selectedStudent.logsSubmitted}/24 submitted
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Eligibility Status</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-white rounded border">
                        <CheckCircle2 
                          className={`h-4 w-4 ${selectedStudent.eligibleForStage1 ? "text-green-600" : "text-gray-300"}`}
                        />
                        <span className="text-sm text-gray-700">Stage 1 (12+ logs)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded border">
                        <CheckCircle2 
                          className={`h-4 w-4 ${selectedStudent.eligibleForStage2 ? "text-green-600" : "text-gray-300"}`}
                        />
                        <span className="text-sm text-gray-700">Stage 2 (24 logs)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {getEligibilityAlert(selectedStudent)}

              {/* Stage 1 */}
              <TabsContent value="stage1" className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Interim Evaluation - Stage 1</h3>
                    {getStatusBadge(selectedStudent.interimStage1Status)}
                  </div>
                  <Separator className="mb-4" />

                  {selectedStudent.interimStage1Status === "pending" ? (
                    <div className="flex items-center gap-2 text-gray-600 py-8 justify-center">
                      <AlertCircle className="h-5 w-5" />
                      <span>No evaluation scheduled yet</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Schedule Info */}
                      {selectedStudent.interimStage1Schedule && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="font-medium text-gray-900 mb-3">Schedule Details</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-2">
                              <Calendar className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-600">Date & Time</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDate(selectedStudent.interimStage1Schedule.start)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Clock className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-600">Duration</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {selectedStudent.interimStage1Schedule.slotMinutes} minutes
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {selectedStudent.interimStage1Schedule.evaluators && (
                            <div className="mt-4">
                              <p className="text-xs text-gray-600 mb-2">Evaluators</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedStudent.interimStage1Schedule.evaluators.map((evaluator) => (
                                  <Badge key={evaluator} variant="outline" className="bg-white">
                                    {evaluator}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Marks & Feedback */}
                      {selectedStudent.interimStage1Status === "completed" && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="font-medium text-gray-900 mb-3">Evaluation Results</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-600">Marks Awarded</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {selectedStudent.interimStage1Marks || "-"}/100
                                </p>
                              </div>
                            </div>
                          </div>

                          {selectedStudent.interimStage1Feedback && (
                            <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                              <p className="text-xs text-gray-600 mb-2">Evaluator Feedback</p>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                {selectedStudent.interimStage1Feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Stage 2 */}
              <TabsContent value="stage2" className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Interim Evaluation - Stage 2</h3>
                    {getStatusBadge(selectedStudent.interimStage2Status)}
                  </div>
                  <Separator className="mb-4" />

                  {!selectedStudent.eligibleForStage2 ? (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Student needs to submit all 24 progress logs to be eligible for Stage 2 evaluation
                      </AlertDescription>
                    </Alert>
                  ) : selectedStudent.interimStage2Status === "pending" ? (
                    <div className="flex items-center gap-2 text-gray-600 py-8 justify-center">
                      <AlertCircle className="h-5 w-5" />
                      <span>No evaluation scheduled yet</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Schedule Info */}
                      {selectedStudent.interimStage2Schedule && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="font-medium text-gray-900 mb-3">Schedule Details</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-2">
                              <Calendar className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-600">Date & Time</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDate(selectedStudent.interimStage2Schedule.start)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Clock className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-600">Duration</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {selectedStudent.interimStage2Schedule.slotMinutes} minutes
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {selectedStudent.interimStage2Schedule.evaluators && (
                            <div className="mt-4">
                              <p className="text-xs text-gray-600 mb-2">Evaluators</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedStudent.interimStage2Schedule.evaluators.map((evaluator) => (
                                  <Badge key={evaluator} variant="outline" className="bg-white">
                                    {evaluator}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Marks & Feedback */}
                      {selectedStudent.interimStage2Status === "completed" && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="font-medium text-gray-900 mb-3">Evaluation Results</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-600">Marks Awarded</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {selectedStudent.interimStage2Marks || "-"}/100
                                </p>
                              </div>
                            </div>
                          </div>

                          {selectedStudent.interimStage2Feedback && (
                            <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                              <p className="text-xs text-gray-600 mb-2">Evaluator Feedback</p>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                {selectedStudent.interimStage2Feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-12 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a student to view their interim evaluation details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
