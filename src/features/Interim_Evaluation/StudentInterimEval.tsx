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
  FileText,
  GraduationCap,
  Users,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type ScheduleRecord = {
  id: number;
  start: string;
  end: string;
  slotMinutes: number;
  evaluators: string[];
  status: "scheduled" | "completed";
};

type StudentData = {
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

export default function StudentInterimEval() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // Initialize default student data
      let studentInfo: any = {
        email: user?.email || "",
        name: user?.name || "Student",
        projectTitle: "FYP Project",
        logsSubmitted: 0,
        supervisorEvaluationsComplete: false,
        eligibleForStage1: false,
        eligibleForStage2: false,
        interimStage1Status: "pending",
        interimStage2Status: "pending",
      };

      // Fetch schedules
      try {
        const response = await fetch(
          `http://localhost:8000/api/interim-scheduling/${encodeURIComponent(user?.email || "")}`
        );

        if (response.ok) {
          const schedulesData = await response.json();
          if (Array.isArray(schedulesData) && schedulesData.length > 0) {
            studentInfo.interimStage1Schedule = schedulesData[0];
            studentInfo.interimStage1Status = schedulesData[0]?.status || "pending";
            if (schedulesData.length > 1) {
              studentInfo.interimStage2Schedule = schedulesData[1];
              studentInfo.interimStage2Status = schedulesData[1]?.status || "pending";
            }
          }
        }
      } catch (err) {
        console.log("Could not fetch schedules:", err);
      }

      // Fetch student basic info and eligibility
      try {
        const studentResponse = await fetch(
          `http://localhost:8000/api/progress/logs/count/${encodeURIComponent(user?.email || "")}`
        );
        
        if (studentResponse.ok) {
          const countData = await studentResponse.json();
          studentInfo.logsSubmitted = countData.count || 0;
          studentInfo.eligibleForStage1 = studentInfo.logsSubmitted >= 12;
          studentInfo.eligibleForStage2 = studentInfo.logsSubmitted >= 24;
        }
      } catch (err) {
        console.log("Could not fetch progress logs count:", err);
      }

      // Fetch marks
      try {
        const marksResponse = await fetch(
          `http://localhost:8000/api/interim-marks/student/${encodeURIComponent(user?.email || "")}`
        );
        if (marksResponse.ok) {
          const marksData = await marksResponse.json();
          if (marksData.marks && Array.isArray(marksData.marks)) {
            const stage1Marks = marksData.marks.find((m: any) => m.stage === 1);
            const stage2Marks = marksData.marks.find((m: any) => m.stage === 2);
            
            if (stage1Marks) {
              studentInfo.interimStage1Marks = stage1Marks.marks;
              studentInfo.interimStage1Feedback = stage1Marks.feedback;
            }
            if (stage2Marks) {
              studentInfo.interimStage2Marks = stage2Marks.marks;
              studentInfo.interimStage2Feedback = stage2Marks.feedback;
            }
          }
        }
      } catch (err) {
        console.log("Could not fetch marks:", err);
      }

      setStudentData(studentInfo);
      if (studentInfo.logsSubmitted === 0) {
        toast.info("No evaluation data found. Complete your progress logs first.");
      }
    } catch (err) {
      console.error("Error fetching student data:", err);
      toast.error("Unable to load evaluation data. Please try again.");
      setStudentData({
        email: user?.email || "",
        name: user?.name || "Student",
        projectTitle: "FYP Project",
        logsSubmitted: 0,
        supervisorEvaluationsComplete: false,
        eligibleForStage1: false,
        eligibleForStage2: false,
        interimStage1Status: "pending",
        interimStage2Status: "pending",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchStudentData();
      toast.success("Data refreshed successfully");
    } catch (err) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <RefreshCw className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-600">Loading your evaluation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Interim Evaluations</h1>
          <p className="text-gray-600 mt-1">View your interim evaluation schedule and results</p>
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

      {studentData ? (
        <div className="space-y-6">
          {/* Student Info Card */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">{studentData.name}</h2>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Email:</span> {studentData.email}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Project:</span> {studentData.projectTitle}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Progress Status</p>
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="text-lg font-bold text-blue-600">{studentData.logsSubmitted}/24</p>
                  <p className="text-xs text-gray-600">Progress logs submitted</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Eligibility Status */}
          <Card className="p-4 border-2 border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Eligibility Status</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                studentData.eligibleForStage1 
                  ? "bg-green-50 border-green-200" 
                  : "bg-gray-50 border-gray-200"
              }`}>
                <CheckCircle2 
                  className={`h-5 w-5 flex-shrink-0 ${
                    studentData.eligibleForStage1 ? "text-green-600" : "text-gray-400"
                  }`}
                />
                <div>
                  <p className="font-medium text-sm text-gray-900">Stage 1</p>
                  <p className="text-xs text-gray-600">12+ logs required</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                studentData.eligibleForStage2 
                  ? "bg-green-50 border-green-200" 
                  : "bg-gray-50 border-gray-200"
              }`}>
                <CheckCircle2 
                  className={`h-5 w-5 flex-shrink-0 ${
                    studentData.eligibleForStage2 ? "text-green-600" : "text-gray-400"
                  }`}
                />
                <div>
                  <p className="font-medium text-sm text-gray-900">Stage 2</p>
                  <p className="text-xs text-gray-600">24 logs required</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Evaluations */}
          <Tabs defaultValue="stage1" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stage1">Stage 1 Evaluation</TabsTrigger>
              <TabsTrigger value="stage2">Stage 2 Evaluation</TabsTrigger>
            </TabsList>

            {/* Stage 1 */}
            <TabsContent value="stage1" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Interim Evaluation - Stage 1</h3>
                  {getStatusBadge(studentData.interimStage1Status)}
                </div>
                <Separator className="mb-4" />

                {!studentData.eligibleForStage1 ? (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      You need to submit at least 12 progress logs to be eligible for Stage 1 evaluation.
                      You have currently submitted {studentData.logsSubmitted} logs.
                    </AlertDescription>
                  </Alert>
                ) : studentData.interimStage1Status === "pending" ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                    <p className="text-gray-600">Evaluation not yet scheduled</p>
                    <p className="text-sm text-gray-500">Your coordinator will schedule this evaluation soon</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Schedule Info */}
                    {studentData.interimStage1Schedule && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Schedule Information
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-gray-600 uppercase">Date & Time</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {formatDate(studentData.interimStage1Schedule.start)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Clock className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-gray-600 uppercase">Duration</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {studentData.interimStage1Schedule.slotMinutes} minutes
                              </p>
                            </div>
                          </div>
                        </div>

                        {studentData.interimStage1Schedule.evaluators && 
                         studentData.interimStage1Schedule.evaluators.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <p className="text-xs font-medium text-gray-600 uppercase mb-2 flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              Evaluators
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {studentData.interimStage1Schedule.evaluators.map((evaluator) => (
                                <Badge key={evaluator} variant="outline" className="bg-white text-xs">
                                  {evaluator}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Results */}
                    {studentData.interimStage1Status === "completed" && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Evaluation Results
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded border border-green-100 text-center">
                            <p className="text-xs font-medium text-gray-600 uppercase mb-2">Your Score</p>
                            <p className="text-3xl font-bold text-green-600">
                              {studentData.interimStage1Marks || "-"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">out of 100</p>
                          </div>
                        </div>

                        {studentData.interimStage1Feedback && (
                          <div className="mt-4 p-4 bg-white rounded border border-gray-200">
                            <p className="text-xs font-medium text-gray-600 uppercase mb-2">Evaluator Feedback</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                              {studentData.interimStage1Feedback}
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
                  {getStatusBadge(studentData.interimStage2Status)}
                </div>
                <Separator className="mb-4" />

                {!studentData.eligibleForStage2 ? (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      You need to submit all 24 progress logs to be eligible for Stage 2 evaluation.
                      You have currently submitted {studentData.logsSubmitted} logs.
                    </AlertDescription>
                  </Alert>
                ) : studentData.interimStage2Status === "pending" ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                    <p className="text-gray-600">Evaluation not yet scheduled</p>
                    <p className="text-sm text-gray-500">Your coordinator will schedule this evaluation soon</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Schedule Info */}
                    {studentData.interimStage2Schedule && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Schedule Information
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-gray-600 uppercase">Date & Time</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {formatDate(studentData.interimStage2Schedule.start)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Clock className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-gray-600 uppercase">Duration</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                {studentData.interimStage2Schedule.slotMinutes} minutes
                              </p>
                            </div>
                          </div>
                        </div>

                        {studentData.interimStage2Schedule.evaluators && 
                         studentData.interimStage2Schedule.evaluators.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <p className="text-xs font-medium text-gray-600 uppercase mb-2 flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              Evaluators
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {studentData.interimStage2Schedule.evaluators.map((evaluator) => (
                                <Badge key={evaluator} variant="outline" className="bg-white text-xs">
                                  {evaluator}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Results */}
                    {studentData.interimStage2Status === "completed" && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Evaluation Results
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded border border-green-100 text-center">
                            <p className="text-xs font-medium text-gray-600 uppercase mb-2">Your Score</p>
                            <p className="text-3xl font-bold text-green-600">
                              {studentData.interimStage2Marks || "-"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">out of 100</p>
                          </div>
                        </div>

                        {studentData.interimStage2Feedback && (
                          <div className="mt-4 p-4 bg-white rounded border border-gray-200">
                            <p className="text-xs font-medium text-gray-600 uppercase mb-2">Evaluator Feedback</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                              {studentData.interimStage2Feedback}
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
        </div>
      ) : (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Unable to load your evaluation data</p>
          </div>
        </Card>
      )}
    </div>
  );
}
