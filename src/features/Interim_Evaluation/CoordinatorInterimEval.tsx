import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Users, 
  FileText, 
  GraduationCap,
  Plus,
  ArrowRight,
  Clock
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

type Student = {
  email: string;
  name: string;
  projectTitle: string;
  registrationId?: number;
  logsSubmitted: number; // Out of 24
  supervisorEvaluationsComplete: boolean;
  eligibleForStage1: boolean; // 12+ logs submitted
  eligibleForStage2: boolean; // All 24 logs submitted
  interimStage1Status: "pending" | "scheduled" | "completed";
  interimStage1Marks?: number;
  interimStage1Schedule?: ScheduleRecord;
  interimStage2Status: "pending" | "scheduled" | "completed";
  interimStage2Marks?: number;
  interimStage2Schedule?: ScheduleRecord;
};

type EvaluationStage = {
  id: string;
  studentEmail: string;
  studentName: string;
  stage: 1 | 2;
  scheduledDate?: string;
  status: "pending" | "scheduled" | "completed";
  marks?: number;
  feedback?: string;
  evaluatorName?: string;
  evaluatorEmail?: string;
};

export default function CoordinatorInterimEval() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [evaluationStages, setEvaluationStages] = useState<EvaluationStage[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showMarksDialog, setShowMarksDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState<1 | 2 | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [slotMinutes, setSlotMinutes] = useState("60");
  const [selectedEvaluators, setSelectedEvaluators] = useState<string[]>([]);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);

  // Mock evaluators list
  const mockEvaluators = [
    { id: "dr.ahmed@uni.edu", name: "Dr. Ahmed Khan" },
    { id: "dr.fatima@uni.edu", name: "Dr. Fatima Ali" },
    { id: "prof.sara@uni.edu", name: "Prof. Sara Smith" },
    { id: "dr.hasan@uni.edu", name: "Dr. Hasan Hassan" },
    { id: "prof.james@uni.edu", name: "Prof. James Wilson" },
  ];

  // Mock fetch - replace with actual API calls
  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch marks when student is selected
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentMarks(selectedStudent.email);
    }
  }, [selectedStudent?.email]);

  const fetchStudentMarks = async (studentEmail: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/interim-marks/student/${encodeURIComponent(studentEmail)}`);
      if (response.ok) {
        const data = await response.json();
        
        // Update selected student with fetched marks
        setSelectedStudent(prev => {
          if (!prev) return null;
          
          const stage1Marks = data.marks.find((m: any) => m.stage === 1);
          const stage2Marks = data.marks.find((m: any) => m.stage === 2);
          
          return {
            ...prev,
            interimStage1Marks: stage1Marks?.marks,
            interimStage2Marks: stage2Marks?.marks,
          };
        });
        
        // Also update in the students list
        setStudents(prev => prev.map(s => {
          if (s.email === studentEmail) {
            const stage1Marks = data.marks.find((m: any) => m.stage === 1);
            const stage2Marks = data.marks.find((m: any) => m.stage === 2);
            
            return {
              ...s,
              interimStage1Marks: stage1Marks?.marks,
              interimStage2Marks: stage2Marks?.marks,
            };
          }
          return s;
        }));
      }
    } catch (err) {
      console.log("No marks found for student:", studentEmail);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      // Fetch all students who have supervisor evaluations
      const evalResponse = await fetch("http://localhost:8000/api/evaluations/coordinator/all-students");
      
      if (!evalResponse.ok) {
        console.log("Evaluations endpoint not available");
        setStudents([]);
        toast.info("No evaluation data available yet. Students need to complete supervisor evaluations first.");
        return;
      }

      const data = await evalResponse.json();
      const students_list = Array.isArray(data) ? data : data.students || [];

      if (students_list.length === 0) {
        setStudents([]);
        toast.info("No students with evaluations found.");
        return;
      }

      console.log("Fetched students:", students_list);

      // Map to our Student type with eligibility logic
      const studentsData: Student[] = await Promise.all(students_list.map(async (studentData: any) => {
        // Fetch actual progress logs count for this student
        let logsSubmitted = 0;
        try {
          const logsResponse = await fetch(
            `http://localhost:8000/api/progress/logs/count/${encodeURIComponent(studentData.studentEmail)}`
          );
          if (logsResponse.ok) {
            const logsData = await logsResponse.json();
            logsSubmitted = logsData.count || 0;
          }
        } catch (e) {
          console.log("Failed to fetch log count for", studentData.studentEmail);
        }
        
        console.log(`${studentData.studentEmail}: ${logsSubmitted} actual logs submitted`);
        
        // Fetch existing interim schedules for this student
        let schedules: ScheduleRecord[] = [];
        try {
          const scheduleResponse = await fetch(
            `http://localhost:8000/api/interim-scheduling/${encodeURIComponent(studentData.studentEmail)}`
          );
          if (scheduleResponse.ok) {
            const scheduleData = await scheduleResponse.json();
            schedules = Array.isArray(scheduleData) ? scheduleData : [];
          }
        } catch (e) {
          console.log("No schedules found for", studentData.studentEmail);
        }
        
        return {
          email: studentData.studentEmail,
          name: studentData.studentName || "Unknown",
          projectTitle: studentData.projectTitle || "Unknown Project",
          registrationId: studentData.registrationId,
          logsSubmitted: logsSubmitted,
          supervisorEvaluationsComplete: logsSubmitted >= 12,
          eligibleForStage1: logsSubmitted >= 12,
          eligibleForStage2: logsSubmitted >= 24,
          interimStage1Status: schedules.length > 0 ? (schedules[0]?.status || "pending") : "pending",
          interimStage1Schedule: schedules.length > 0 ? schedules[0] : undefined,
          interimStage2Status: schedules.length > 1 ? (schedules[1]?.status || "pending") : "pending",
          interimStage2Schedule: schedules.length > 1 ? schedules[1] : undefined,
        };
      }));

      console.log("Processed students:", studentsData);
      setStudents(studentsData);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudents([]);
      toast.error("Unable to load students. Make sure students have completed evaluations.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const eligibleStudents = students.filter((s) => 
    (s.eligibleForStage1 || s.eligibleForStage2) && s.supervisorEvaluationsComplete
  );

  const filteredStudents = eligibleStudents.filter((s) =>
    s.email.includes(searchTerm) || s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScheduleStage = (stage: 1 | 2) => {
    if (!selectedStudent) return;
    
    setSelectedStage(stage);
    
    const schedule = stage === 1 ? selectedStudent.interimStage1Schedule : selectedStudent.interimStage2Schedule;
    
    if (schedule) {
      // Edit mode
      setIsEditingSchedule(true);
      setEditingScheduleId(schedule.id);
      
      const startDate = new Date(schedule.start);
      const dateStr = startDate.toISOString().split('T')[0];
      const timeStr = startDate.toTimeString().substring(0, 5);
      
      setScheduledDate(dateStr);
      setScheduledTime(timeStr);
      setSlotMinutes(schedule.slotMinutes.toString());
      setSelectedEvaluators(schedule.evaluators || []);
    } else {
      // New schedule mode
      setIsEditingSchedule(false);
      setEditingScheduleId(null);
      setScheduledDate("");
      setScheduledTime("09:00");
      setSlotMinutes("60");
      setSelectedEvaluators([]);
    }
    
    setShowScheduleDialog(true);
  };

  const confirmSchedule = async () => {
    if (!selectedStudent || !selectedStage || !scheduledDate || !scheduledTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedEvaluators.length === 0) {
      toast.error("Please select at least one evaluator");
      return;
    }

    const slotMin = parseInt(slotMinutes) || 60;
    if (slotMin <= 0 || slotMin > 480) {
      toast.error("Slot duration must be between 1 and 480 minutes");
      return;
    }

    setSavingSchedule(true);
    try {
      // Combine date and time into a datetime ISO string
      const dateTimeStr = `${scheduledDate}T${scheduledTime}:00`;
      const startDateTime = new Date(dateTimeStr);
      
      if (isNaN(startDateTime.getTime())) {
        throw new Error("Invalid date/time format");
      }

      // API call to save interim scheduling to database
      const response = await fetch("http://localhost:8000/api/interim-scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_email: selectedStudent.email,
          registration_id: selectedStudent.registrationId || null,
          title: `${selectedStudent.projectTitle} - Stage ${selectedStage} Interim Evaluation`,
          start: startDateTime.toISOString(),
          slot_minutes: slotMin,
          notes: `Stage ${selectedStage} interim evaluation scheduled on ${scheduledDate}`,
          evaluators: selectedEvaluators,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to schedule evaluation");
      }

      const newSchedule = await response.json();
      
      toast.success(`✅ Interim Evaluation Stage ${selectedStage} scheduled for ${scheduledDate} at ${scheduledTime}`);
      
      // Update local state
      setStudents(students.map(s => 
        s.email === selectedStudent.email
          ? {
              ...s,
              [`interimStage${selectedStage}Status`]: "scheduled",
              [`interimStage${selectedStage}Schedule`]: {
                id: newSchedule.id,
                start: newSchedule.start,
                end: newSchedule.end,
                slotMinutes: newSchedule.slotMinutes,
                evaluators: newSchedule.evaluators,
                status: "scheduled" as const,
              }
            }
          : s
      ));

      // Update selected student state
      setSelectedStudent({
        ...selectedStudent,
        [`interimStage${selectedStage}Status`]: "scheduled",
        [`interimStage${selectedStage}Schedule`]: {
          id: newSchedule.id,
          start: newSchedule.start,
          end: newSchedule.end,
          slotMinutes: newSchedule.slotMinutes,
          evaluators: newSchedule.evaluators,
          status: "scheduled" as const,
        }
      });

      setShowScheduleDialog(false);
      setScheduledDate("");
      setScheduledTime("09:00");
      setSlotMinutes("60");
      setSelectedEvaluators([]);
      setIsEditingSchedule(false);
      setEditingScheduleId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to schedule evaluation";
      console.error("Schedule error:", err);
      toast.error(msg);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSubmitMarks = (stage: 1 | 2) => {
    if (!selectedStudent) return;
    
    setSelectedStage(stage);
    setShowMarksDialog(true);
  };

  const confirmSubmitMarks = async () => {
    if (!selectedStudent || !selectedStage || !marks) {
      toast.error("Please enter marks");
      return;
    }

    const marksNum = parseInt(marks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      toast.error("Marks must be between 0 and 100");
      return;
    }

    console.log("Submitting marks - Stage:", selectedStage, "Student:", selectedStudent.email, "Marks:", marksNum);

    setSavingMarks(true);
    try {
      // Get the interim scheduling record ID first
      const scheduleResponse = await fetch(
        `http://localhost:8000/api/interim-scheduling/${selectedStudent.email}`
      );
      
      if (!scheduleResponse.ok) {
        throw new Error("Failed to find interim scheduling record");
      }
      
      const schedules = await scheduleResponse.json();
      console.log("Fetched schedules:", schedules);
      
      if (!Array.isArray(schedules) || schedules.length === 0) {
        throw new Error("No interim scheduling found for this student");
      }
      
      // Get the correct schedule based on stage (first for Stage 1, second for Stage 2)
      const scheduleIndex = selectedStage === 1 ? 0 : 1;
      if (!schedules[scheduleIndex]) {
        throw new Error(`No interim scheduling found for Stage ${selectedStage}`);
      }
      
      const scheduleId = schedules[scheduleIndex].id;
      console.log("Using schedule ID:", scheduleId, "for stage:", selectedStage);

      // API call to submit marks to the dedicated interim-marks endpoint
      const response = await fetch("http://localhost:8000/api/interim-marks/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interim_scheduling_id: scheduleId,
          student_email: selectedStudent.email,
          stage: selectedStage,
          marks: marksNum,
          evaluator_email: user?.email || "coordinator@system.local",
          feedback: feedback || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to submit marks");
      }

      const savedMarks = await response.json();
      
      toast.success(`✅ Interim Evaluation Stage ${selectedStage} marks submitted (${marks}/100)`);
      
      // Update local state
      setStudents(students.map(s => 
        s.email === selectedStudent.email
          ? {
              ...s,
              [`interimStage${selectedStage}Marks`]: marksNum,
              [`interimStage${selectedStage}Status`]: "completed"
            }
          : s
      ));

      // Update selected student state
      setSelectedStudent({
        ...selectedStudent,
        [`interimStage${selectedStage}Marks`]: marksNum,
        [`interimStage${selectedStage}Status`]: "completed"
      });

      setShowMarksDialog(false);
      setMarks("");
      setFeedback("");
      setSelectedStage(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit marks";
      console.error("Marks submission error:", err);
      toast.error(msg);
    } finally {
      setSavingMarks(false);
    }
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

  if (!selectedStudent) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Interim Evaluations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize and manage interim evaluations for students who have completed their progress tracking
          </p>
        </div>

        {/* Eligibility Summary */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-3xl font-bold">{students.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Eligible for Interim Eval</p>
              <p className="text-3xl font-bold text-green-600">{eligibleStudents.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-orange-600">
                {eligibleStudents.filter(s => s.interimStage1Status === "pending" && s.interimStage2Status === "pending").length}
              </p>
            </div>
          </div>
        </Card>

        {/* Eligibility Criteria Info */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <p className="font-semibold mb-2">📋 Eligibility Criteria:</p>
            <div className="space-y-2 text-sm">
              <p><strong>For Stage 1 (Month 4):</strong> Student must submit minimum 12 progress logs + Supervisor evaluations</p>
              <p><strong>For Stage 2 (Month 7):</strong> Student must submit all 24 progress logs + Supervisor evaluations complete</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Student Search & Selection */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Select Student for Interim Evaluation</h3>
          
          {eligibleStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 bg-gray-50 rounded border">
              No students are currently eligible for interim evaluations. Students must complete the required number of progress logs and have supervisor evaluations first.
            </p>
          ) : (
            <>
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">No students match your search</p>
                ) : (
                  filteredStudents.map((student) => (
                    <Button
                      key={student.email}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 hover:bg-blue-50"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                        <p className="text-xs text-blue-600">{student.projectTitle}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ))
                )}
              </div>
            </>
          )}
        </Card>

        {/* Ineligible Students Info */}
        {students.filter(s => !(s.eligibleForStage1 || s.eligibleForStage2) || !s.supervisorEvaluationsComplete).length > 0 && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-3">Students Not Yet Eligible</h3>
            <div className="space-y-2">
              {students
                .filter(s => !(s.eligibleForStage1 || s.eligibleForStage2) || !s.supervisorEvaluationsComplete)
                .map((student) => (
                  <div key={student.email} className="flex items-start justify-between p-3 bg-white rounded border border-amber-200">
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                    <div className="text-right text-xs space-y-1">
                      {student.logsSubmitted < 12 && (
                        <p className="text-amber-600">Logs: {student.logsSubmitted}/12 (need 12 for Stage 1)</p>
                      )}
                      {student.logsSubmitted >= 12 && student.logsSubmitted < 24 && (
                        <p className="text-amber-600">Logs: {student.logsSubmitted}/24 (need 24 for Stage 2)</p>
                      )}
                      {!student.supervisorEvaluationsComplete && (
                        <p className="text-amber-600">Supervisor evals pending</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Student Selected View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Interim Evaluations</h2>
          <p className="text-sm text-muted-foreground mt-1">{selectedStudent.name} - {selectedStudent.projectTitle}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setLoadingStudents(true);
              fetchStudents();
            }}
            disabled={loadingStudents}
          >
            {loadingStudents ? "Refreshing..." : "↻ Refresh"}
          </Button>
          <Button variant="outline" onClick={() => setSelectedStudent(null)}>
            ← Back to List
          </Button>
        </div>
      </div>

      {/* Student Status Overview */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold">Student Eligible for Interim Evaluations</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Progress Logs Submitted</p>
            <p className="font-semibold text-green-600">{selectedStudent.logsSubmitted}/24</p>
          </div>
          <div>
            <p className="text-muted-foreground">Supervisor Evaluations</p>
            <p className="font-semibold text-green-600">{selectedStudent.supervisorEvaluationsComplete ? "Complete" : "Pending"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Stage 1 Eligible</p>
            <p className={`font-semibold ${selectedStudent.eligibleForStage1 ? "text-green-600" : "text-orange-600"}`}>
              {selectedStudent.eligibleForStage1 ? "✓ Yes" : "✗ No"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Stage 2 Eligible</p>
            <p className={`font-semibold ${selectedStudent.eligibleForStage2 ? "text-green-600" : "text-orange-600"}`}>
              {selectedStudent.eligibleForStage2 ? "✓ Yes" : "✗ No"}
            </p>
          </div>
        </div>
      </Card>

      {/* Interim Evaluation Stages Tabs */}
      <Tabs defaultValue="stage1" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stage1">Stage 1 (Month 4)</TabsTrigger>
          <TabsTrigger value="stage2">Stage 2 (Month 7)</TabsTrigger>
        </TabsList>

        {/* Stage 1 */}
        <TabsContent value="stage1" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Interim Evaluation - Stage 1</h3>
                <p className="text-sm text-muted-foreground">Conducted at Month 4 of the project (requires 12+ logs)</p>
              </div>
              {getStatusBadge(selectedStudent.interimStage1Status)}
            </div>

            <Separator className="my-4" />

            {!selectedStudent.eligibleForStage1 && (
              <Alert className="mb-6 border-orange-300 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <p className="font-semibold">Not Eligible for Stage 1</p>
                  <p className="text-sm mt-1">Student must submit minimum 12 progress logs to be eligible. Currently: {selectedStudent.logsSubmitted}/12</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Stage 1 Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Timeline</Label>
                  <p className="mt-1 font-medium">Month 4 of Project Duration</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Evaluation Focus</Label>
                  <p className="mt-1 font-medium">Progress & Technical Foundation</p>
                </div>
              </div>

              {/* Status-specific sections */}
              {selectedStudent.interimStage1Status === "pending" && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    This evaluation stage has not been scheduled yet. Click "Schedule" below to organize Stage 1.
                  </AlertDescription>
                </Alert>
              )}

              {selectedStudent.interimStage1Status === "scheduled" && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Evaluation Scheduled</p>
                  </div>
                  <p className="text-sm text-blue-800">Ready to receive marks upon completion</p>
                </Card>
              )}

              {selectedStudent.interimStage1Status === "completed" && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Evaluation Completed</p>
                        <p className="text-xs text-green-700">Marks submitted and recorded</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{selectedStudent.interimStage1Marks}</p>
                      <p className="text-xs text-muted-foreground">/ 100</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                {(selectedStudent.interimStage1Status === "pending" || selectedStudent.interimStage1Status === "scheduled") && (
                  <Dialog open={showScheduleDialog && selectedStage === 1} onOpenChange={setShowScheduleDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleScheduleStage(1)} disabled={!selectedStudent.eligibleForStage1}>
                        <Plus className="h-4 w-4 mr-2" />
                        {selectedStudent.interimStage1Status === "scheduled" ? "Edit Schedule" : "Schedule Stage 1"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {isEditingSchedule ? "Edit" : "Schedule"} Interim Evaluation - Stage 1
                        </DialogTitle>
                        <DialogDescription>
                          Set the date, time, slot duration, and evaluators for Stage 1 interim evaluation
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        <div>
                          <Label htmlFor="stage1-date">Evaluation Date *</Label>
                          <Input
                            id="stage1-date"
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="mt-1"
                            disabled={savingSchedule}
                          />
                        </div>
                        <div>
                          <Label htmlFor="stage1-time">Start Time *</Label>
                          <Input
                            id="stage1-time"
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="mt-1"
                            disabled={savingSchedule}
                          />
                        </div>
                        <div>
                          <Label htmlFor="stage1-slot">Slot Duration (minutes) *</Label>
                          <Input
                            id="stage1-slot"
                            type="number"
                            min="1"
                            max="480"
                            value={slotMinutes}
                            onChange={(e) => setSlotMinutes(e.target.value)}
                            className="mt-1"
                            disabled={savingSchedule}
                          />
                        </div>
                        <div>
                          <Label htmlFor="stage1-evaluators">Evaluators *</Label>
                          <div className="mt-1 space-y-2 border rounded-md p-3 bg-muted/30 max-h-[180px] overflow-y-auto">
                            {mockEvaluators.map((evaluator) => (
                              <div key={evaluator.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={evaluator.id}
                                  checked={selectedEvaluators.includes(evaluator.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedEvaluators([...selectedEvaluators, evaluator.id]);
                                    } else {
                                      setSelectedEvaluators(
                                        selectedEvaluators.filter(e => e !== evaluator.id)
                                      );
                                    }
                                  }}
                                  disabled={savingSchedule}
                                  className="rounded"
                                />
                                <Label htmlFor={evaluator.id} className="text-sm cursor-pointer flex-1 mb-0">
                                  {evaluator.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {selectedEvaluators.length === 0 && (
                            <p className="text-xs text-red-600 mt-1">Select at least one evaluator</p>
                          )}
                        </div>
                        <div className="flex gap-3 justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowScheduleDialog(false)} 
                            disabled={savingSchedule}
                          >
                            Cancel
                          </Button>
                          <Button onClick={confirmSchedule} disabled={savingSchedule}>
                            {savingSchedule ? "Saving..." : isEditingSchedule ? "Update Schedule" : "Confirm Schedule"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {(selectedStudent.interimStage1Status === "scheduled" || selectedStudent.interimStage1Status === "completed") && (
                  <Dialog open={showMarksDialog && selectedStage === 1} onOpenChange={setShowMarksDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleSubmitMarks(1)} variant={selectedStudent.interimStage1Status === "completed" ? "outline" : "default"}>
                        {selectedStudent.interimStage1Status === "completed" ? "Update Marks" : "Submit Marks"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Marks - Stage 1</DialogTitle>
                        <DialogDescription>
                          Enter the evaluation marks for {selectedStudent.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="stage1-marks">Marks (0-100)</Label>
                          <Input
                            id="stage1-marks"
                            type="number"
                            min="0"
                            max="100"
                            value={marks}
                            onChange={(e) => setMarks(e.target.value)}
                            className="mt-1"
                            placeholder="Enter marks"
                            disabled={savingMarks}
                          />
                        </div>
                        <div>
                          <Label htmlFor="stage1-feedback">Feedback (Optional)</Label>
                          <Textarea
                            id="stage1-feedback"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="mt-1"
                            placeholder="Add any feedback or remarks..."
                            rows={4}
                            disabled={savingMarks}
                          />
                        </div>
                        <div className="flex gap-3 justify-end">
                          <Button variant="outline" onClick={() => {
                            setShowMarksDialog(false);
                            setSelectedStage(null);
                            setMarks("");
                            setFeedback("");
                          }} disabled={savingMarks}>
                            Cancel
                          </Button>
                          <Button onClick={confirmSubmitMarks} disabled={savingMarks}>
                            {savingMarks ? "Submitting..." : "Submit Marks"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Stage 2 */}
        <TabsContent value="stage2" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Interim Evaluation - Stage 2</h3>
                <p className="text-sm text-muted-foreground">Conducted at Month 7 of the project (requires all 24 logs)</p>
              </div>
              {getStatusBadge(selectedStudent.interimStage2Status)}
            </div>

            <Separator className="my-4" />

            {!selectedStudent.eligibleForStage2 && (
              <Alert className="mb-6 border-orange-300 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <p className="font-semibold">Not Eligible for Stage 2</p>
                  <p className="text-sm mt-1">Student must submit all 24 progress logs to be eligible. Currently: {selectedStudent.logsSubmitted}/24</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Stage 2 Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Timeline</Label>
                  <p className="mt-1 font-medium">Month 7 of Project Duration</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Evaluation Focus</Label>
                  <p className="mt-1 font-medium">Overall Progress & Completion Status</p>
                </div>
              </div>

              {/* Status-specific sections */}
              {selectedStudent.interimStage2Status === "pending" && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    This evaluation stage has not been scheduled yet. Click "Schedule" below to organize Stage 2.
                  </AlertDescription>
                </Alert>
              )}

              {selectedStudent.interimStage2Status === "scheduled" && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Evaluation Scheduled</p>
                  </div>
                  <p className="text-sm text-blue-800">Ready to receive marks upon completion</p>
                </Card>
              )}

              {selectedStudent.interimStage2Status === "completed" && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Evaluation Completed</p>
                        <p className="text-xs text-green-700">Marks submitted and recorded</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{selectedStudent.interimStage2Marks}</p>
                      <p className="text-xs text-muted-foreground">/ 100</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                {(selectedStudent.interimStage2Status === "pending" || selectedStudent.interimStage2Status === "scheduled") && (
                  <Dialog open={showScheduleDialog && selectedStage === 2} onOpenChange={setShowScheduleDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleScheduleStage(2)} disabled={!selectedStudent.eligibleForStage2}>
                        <Plus className="h-4 w-4 mr-2" />
                        {selectedStudent.interimStage2Status === "scheduled" ? "Edit Schedule" : "Schedule Stage 2"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {isEditingSchedule ? "Edit" : "Schedule"} Interim Evaluation - Stage 2
                        </DialogTitle>
                        <DialogDescription>
                          Set the date, time, slot duration, and evaluators for Stage 2 interim evaluation
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        <div>
                          <Label htmlFor="stage2-date">Evaluation Date *</Label>
                          <Input
                            id="stage2-date"
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="mt-1"
                            disabled={savingSchedule}
                          />
                        </div>
                        <div>
                          <Label htmlFor="stage2-time">Start Time *</Label>
                          <Input
                            id="stage2-time"
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="mt-1"
                            disabled={savingSchedule}
                          />
                        </div>
                        <div>
                          <Label htmlFor="stage2-slot">Slot Duration (minutes) *</Label>
                          <Input
                            id="stage2-slot"
                            type="number"
                            min="1"
                            max="480"
                            value={slotMinutes}
                            onChange={(e) => setSlotMinutes(e.target.value)}
                            className="mt-1"
                            disabled={savingSchedule}
                          />
                        </div>
                        <div>
                          <Label htmlFor="stage2-evaluators">Evaluators *</Label>
                          <div className="mt-1 space-y-2 border rounded-md p-3 bg-muted/30 max-h-[180px] overflow-y-auto">
                            {mockEvaluators.map((evaluator) => (
                              <div key={evaluator.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`s2-${evaluator.id}`}
                                  checked={selectedEvaluators.includes(evaluator.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedEvaluators([...selectedEvaluators, evaluator.id]);
                                    } else {
                                      setSelectedEvaluators(
                                        selectedEvaluators.filter(e => e !== evaluator.id)
                                      );
                                    }
                                  }}
                                  disabled={savingSchedule}
                                  className="rounded"
                                />
                                <Label htmlFor={`s2-${evaluator.id}`} className="text-sm cursor-pointer flex-1 mb-0">
                                  {evaluator.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {selectedEvaluators.length === 0 && (
                            <p className="text-xs text-red-600 mt-1">Select at least one evaluator</p>
                          )}
                        </div>
                        <div className="flex gap-3 justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowScheduleDialog(false)} 
                            disabled={savingSchedule}
                          >
                            Cancel
                          </Button>
                          <Button onClick={confirmSchedule} disabled={savingSchedule}>
                            {savingSchedule ? "Saving..." : isEditingSchedule ? "Update Schedule" : "Confirm Schedule"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {(selectedStudent.interimStage2Status === "scheduled" || selectedStudent.interimStage2Status === "completed") && (
                  <Dialog open={showMarksDialog && selectedStage === 2} onOpenChange={setShowMarksDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleSubmitMarks(2)} variant={selectedStudent.interimStage2Status === "completed" ? "outline" : "default"}>
                        {selectedStudent.interimStage2Status === "completed" ? "Update Marks" : "Submit Marks"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Marks - Stage 2</DialogTitle>
                        <DialogDescription>
                          Enter the evaluation marks for {selectedStudent.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="stage2-marks">Marks (0-100)</Label>
                          <Input
                            id="stage2-marks"
                            type="number"
                            min="0"
                            max="100"
                            value={marks}
                            onChange={(e) => setMarks(e.target.value)}
                            className="mt-1"
                            placeholder="Enter marks"
                            disabled={savingMarks}
                          />
                        </div>
                        <div>
                          <Label htmlFor="stage2-feedback">Feedback (Optional)</Label>
                          <Textarea
                            id="stage2-feedback"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="mt-1"
                            placeholder="Add any feedback or remarks..."
                            rows={4}
                            disabled={savingMarks}
                          />
                        </div>
                        <div className="flex gap-3 justify-end">
                          <Button variant="outline" onClick={() => {
                            setShowMarksDialog(false);
                            setSelectedStage(null);
                            setMarks("");
                            setFeedback("");
                          }} disabled={savingMarks}>
                            Cancel
                          </Button>
                          <Button onClick={confirmSubmitMarks} disabled={savingMarks}>
                            {savingMarks ? "Submitting..." : "Submit Marks"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Card */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold mb-4">Evaluation Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded border">
            <span className="text-sm font-medium">Stage 1 (Month 4)</span>
            <div className="flex items-center gap-3">
              {selectedStudent.interimStage1Status === "completed" ? (
                <>
                  <span className="font-bold text-lg">{selectedStudent.interimStage1Marks}</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </>
              ) : (
                getStatusBadge(selectedStudent.interimStage1Status)
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded border">
            <span className="text-sm font-medium">Stage 2 (Month 7)</span>
            <div className="flex items-center gap-3">
              {selectedStudent.interimStage2Status === "completed" ? (
                <>
                  <span className="font-bold text-lg">{selectedStudent.interimStage2Marks}</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </>
              ) : (
                getStatusBadge(selectedStudent.interimStage2Status)
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
