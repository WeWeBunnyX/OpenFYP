/* eslint-disable import/no-unused-modules */
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type CriterionScore = {
  name: string;
  weight: number; // percentage
  score: number; // 0-100
  feedback: string;
};

type EvaluationForm = {
  studentEmail: string;
  studentName: string;
  projectTitle: string;
  evaluationMonth: number; // 1-7 (months into the project)
  evaluationWeek: number; // which 15-day period
  criteria: CriterionScore[];
  overallFeedback: string;
  submittedAt?: string;
};

const DEFAULT_CRITERIA: CriterionScore[] = [
  { name: "Code Quality & Implementation", weight: 25, score: 0, feedback: "" },
  { name: "Progress & Work Completion", weight: 25, score: 0, feedback: "" },
  { name: "Problem-Solving & Innovation", weight: 20, score: 0, feedback: "" },
  { name: "Documentation & Communication", weight: 15, score: 0, feedback: "" },
  { name: "Collaboration & Professionalism", weight: 15, score: 0, feedback: "" },
];

export default function SupervisorEvalGrading() {
  const { user } = useAuth();
  
  const [form, setForm] = useState<EvaluationForm>({
    studentEmail: "",
    studentName: "",
    projectTitle: "",
    evaluationMonth: 1,
    evaluationWeek: 1,
    criteria: DEFAULT_CRITERIA,
    overallFeedback: "",
  });

  const [studentSearch, setStudentSearch] = useState("");
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [students, setStudents] = useState<Array<{ email: string; name: string; projectTitle: string }>>([]);

  // Fetch students whose proposal defense was accepted
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        // Fetch all registrations
        const response = await fetch("http://localhost:8000/registrations", {
          headers: { "X-User-Email": user?.email || "" }
        });
        if (!response.ok) throw new Error("Failed to fetch registrations");
        const data = await response.json();
        
        // Filter for students whose defense was accepted (status should be "accepted" or defense is scheduled)
        const registrations = data.registrations || data || [];
        const acceptedStudents = registrations.filter((reg: any) => {
          // Include if defense has been scheduled/completed or status is accepted
          return reg.defense && (reg.defense.start || reg.status === "accepted");
        });
        
        // Transform to student list format
        const studentsList = acceptedStudents.map((registration: any) => ({
          email: registration.owner, // owner is the student email
          name: registration.title?.split(" - ")[0] || registration.owner, // extract name from title if available
          projectTitle: registration.title || "",
        }));
        setStudents(studentsList);
      } catch (err) {
        console.error("Error fetching students:", err);
        toast.error("Failed to load students list");
      } finally {
        setLoadingStudents(false);
      }
    };

    if (user?.email) {
      fetchStudents();
    }
  }, [user?.email]);

  const filteredStudents = students.filter((s) =>
    s.email.includes(studentSearch) || s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const selectStudent = (student: typeof students[0]) => {
    setForm({
      ...form,
      studentEmail: student.email,
      studentName: student.name,
      projectTitle: student.projectTitle,
    });
    setStudentSearch("");
  };

  const updateCriterion = (index: number, updates: Partial<CriterionScore>) => {
    const newCriteria = [...form.criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    setForm({ ...form, criteria: newCriteria });
  };

  const calculateWeightedScore = () => {
    const totalWeight = form.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = form.criteria.reduce((sum, c) => sum + (c.score * c.weight) / 100, 0);
    return Math.round(weightedSum);
  };

  const handleSubmit = async () => {
    console.log("handleSubmit called");
    console.log("Form state:", form);
    console.log("User:", user);
    
    if (!form.studentEmail || !form.studentName) {
      toast.error("Please select a student");
      console.log("Validation failed: student not selected");
      return;
    }

    if (form.criteria.some((c) => c.score === 0)) {
      toast.error("Please score all criteria");
      console.log("Validation failed: criteria not scored");
      return;
    }

    if (!form.overallFeedback.trim()) {
      toast.error("Please provide overall feedback");
      console.log("Validation failed: no feedback");
      return;
    }

    console.log("All validations passed, attempting to submit...");
    setSaving(true);
    try {
      const payload = {
        student_email: form.studentEmail,
        student_name: form.studentName,
        project_title: form.projectTitle,
        supervisor_email: user?.email || "",
        supervisor_name: user?.name || "",
        evaluation_month: form.evaluationMonth,
        evaluation_week: form.evaluationWeek,
        criteria: form.criteria,
        overall_feedback: form.overallFeedback,
        final_score: calculateWeightedScore(),
      };
      
      console.log("Payload:", payload);
      
      const response = await fetch("http://localhost:8000/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(errorData.detail || "Failed to submit evaluation");
      }

      const responseData = await response.json();
      console.log("Success response:", responseData);
      toast.success("Evaluation submitted successfully");
      
      // Reset only the evaluation data, keep the student selected for submitting other month evaluations
      setForm({
        studentEmail: form.studentEmail,
        studentName: form.studentName,
        projectTitle: form.projectTitle,
        evaluationMonth: form.evaluationMonth === 7 ? 1 : form.evaluationMonth + 1, // Auto-increment month
        evaluationWeek: 1,
        criteria: DEFAULT_CRITERIA,
        overallFeedback: "",
      });
      setPreview(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit evaluation";
      console.error("Caught error:", msg, err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (preview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Evaluation Preview</h2>
          <Button variant="outline" onClick={() => setPreview(false)}>
            Back to Edit
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Student Name</label>
              <p className="text-lg font-semibold">{form.studentName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-lg">{form.studentEmail}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Project Title</label>
              <p className="text-lg">{form.projectTitle}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Evaluation Period</label>
              <p className="text-lg">Month {form.evaluationMonth}, Week {form.evaluationWeek}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">Scoring Summary</h3>
            <div className="space-y-3">
              {form.criteria.map((criterion, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div className="flex-1">
                    <p className="font-medium">{criterion.name}</p>
                    <p className="text-sm text-muted-foreground">Weight: {criterion.weight}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{criterion.score}</p>
                    <p className="text-xs text-muted-foreground">/ 100</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-muted-foreground mb-1">Final Weighted Score</p>
              <p className="text-4xl font-bold text-blue-600">{calculateWeightedScore()}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Overall Feedback</h3>
            <p className="whitespace-pre-wrap text-sm">{form.overallFeedback || "(No feedback provided)"}</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setPreview(false)}
            >
              Edit
            </Button>
            <Button 
              onClick={() => {
                console.log("Submit button clicked!");
                handleSubmit();
              }} 
              disabled={saving}
            >
              {saving ? "Submitting..." : "Submit Evaluation"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Regular Progress Evaluations (Every 15 Days)</h2>
        <p className="text-sm text-muted-foreground">
          Record and submit project progress evaluations for students whose proposal defenses were accepted (Month 1 through Month 6-7).
        </p>
        <p className="text-xs text-blue-600 mt-2">
          📋 Note: Only students with accepted proposal defenses appear below. Interim and Final evaluations are managed by the Coordinator. Your responsibility is to evaluate student progress every 15 days during the regular project period.
        </p>
      </div>

      {/* Student Selection */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Select Student (Accepted Defenses Only)</h3>
        {!form.studentEmail ? (
          <div className="space-y-3">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 bg-blue-50 rounded border border-blue-200">
                📋 No students with accepted proposal defenses yet. Once the coordinator accepts student defenses, they will appear here.
              </p>
            ) : (
              <>
                <Input
                  placeholder="Search by name or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">No students match your search</p>
                  ) : (
                    filteredStudents.map((student) => (
                      <Button
                        key={student.email}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => selectStudent(student)}
                      >
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                          <p className="text-xs text-blue-600">{student.projectTitle}</p>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
            <div>
              <p className="font-medium">{form.studentName}</p>
              <p className="text-sm text-muted-foreground">{form.studentEmail}</p>
              <p className="text-sm font-medium text-blue-600">{form.projectTitle}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setForm({
                  ...form,
                  studentEmail: "",
                  studentName: "",
                  projectTitle: "",
                })
              }
            >
              Change
            </Button>
          </div>
        )}
      </Card>

      {form.studentEmail && (
        <>
          {/* Evaluation Period & Metadata */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Evaluation Month (1-7)</Label>
                <Select value={String(form.evaluationMonth)} onValueChange={(v) => setForm({ ...form, evaluationMonth: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        Month {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>15-Day Evaluation Period</Label>
                <Select value={String(form.evaluationWeek)} onValueChange={(v) => setForm({ ...form, evaluationWeek: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Period 1 (Days 1-15)</SelectItem>
                    <SelectItem value="2">Period 2 (Days 16-30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Supervisors evaluate student progress every 15 days. Evaluations are collected up to Month 6-7, after which Interim and Final evaluations are managed by Coordinators.
            </p>
          </Card>

          {/* Scoring Criteria with Collapsible Sections */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Evaluation Criteria (Weighted Scoring)</h3>

            <div className="space-y-3 mb-6">
              {form.criteria.map((criterion, idx) => (
                <Collapsible
                  key={idx}
                  open={expandedCriteria === String(idx)}
                  onOpenChange={(open) => setExpandedCriteria(open ? String(idx) : null)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <div className="text-left flex-1">
                        <p className="font-medium">{criterion.name}</p>
                        <p className="text-xs text-muted-foreground">Weight: {criterion.weight}%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={criterion.score > 0 ? "default" : "secondary"}>
                          {criterion.score}/100
                        </Badge>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-3 ml-4 space-y-3 border-l-2 border-muted pl-4">
                    <div>
                      <Label>Score (0-100)</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={criterion.score}
                          onChange={(e) =>
                            updateCriterion(idx, { score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })
                          }
                          className="w-24"
                        />
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${criterion.score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Feedback for this criterion</Label>
                      <Textarea
                        placeholder="Describe what you observed and how the student performed..."
                        value={criterion.feedback}
                        onChange={(e) => updateCriterion(idx, { feedback: e.target.value })}
                        className="mt-1 min-h-24"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            {/* Weighted Score Summary */}
            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Final Weighted Score</p>
                  <p className="text-sm text-muted-foreground">
                    ({form.criteria.map((c) => `${c.score}×${c.weight}%`).join(" + ")})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-blue-600">{calculateWeightedScore()}</p>
                  <p className="text-xs text-muted-foreground">/ 100</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Overall Feedback */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Overall Feedback & Remarks</h3>
            <Textarea
              placeholder="Provide comprehensive feedback about the student's progress, strengths, areas for improvement, and recommendations..."
              value={form.overallFeedback}
              onChange={(e) => setForm({ ...form, overallFeedback: e.target.value })}
              className="min-h-32"
            />
          </Card>

          {/* Validation Alert */}
          {(form.criteria.some((c) => c.score === 0) || !form.overallFeedback.trim()) && (
            <Alert className="border-orange-300 bg-orange-50">
              <AlertDescription className="text-orange-800">
                <p className="font-semibold mb-2">⚠️ Missing Information</p>
                <ul className="space-y-1 text-sm">
                  {form.criteria.some((c) => c.score === 0) && (
                    <li>
                      • Score all criteria:
                      {form.criteria
                        .map((c, i) => (c.score === 0 ? c.name : null))
                        .filter(Boolean)
                        .join(", ")}
                    </li>
                  )}
                  {!form.overallFeedback.trim() && <li>• Provide overall feedback</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() =>
                setForm({
                  studentEmail: "",
                  studentName: "",
                  projectTitle: "",
                  evaluationMonth: 1,
                  evaluationWeek: 1,
                  criteria: DEFAULT_CRITERIA,
                  overallFeedback: "",
                })
              }
            >
              Clear
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreview(true)}
            >
              Preview
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Submitting..." : "Submit Evaluation"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
