/* eslint-disable import/no-unused-modules */
import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ChevronDown, Search } from "lucide-react";

type CriterionResult = {
  name: string;
  weight: number;
  score: number;
  feedback: string;
};

type EvaluationRecord = {
  id: number;
  supervisorName: string;
  supervisorEmail: string;
  evaluationMonth: number;
  evaluationWeek: number;
  submittedDate: string;
  criteria: CriterionResult[];
  overallFeedback: string;
  finalScore: number;
};

type StudentEvaluations = {
  studentEmail: string;
  studentName: string;
  projectTitle: string;
  evaluations: EvaluationRecord[];
};

export default function CoordinatorEvalGrading() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentEvaluations | null>(null);
  const [expandedEvaluation, setExpandedEvaluation] = useState<number | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentEvaluations[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all student evaluations from backend
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:8000/api/evaluations/coordinator/all-students"
        );
        
        if (!response.ok) throw new Error("Failed to load evaluations");
        
        const data = await response.json();
        
        // Transform API response to component format
        const transformedData = data.map((student: any) => ({
          studentEmail: student.studentEmail,
          studentName: student.studentName,
          projectTitle: student.projectTitle,
          evaluations: student.evaluations.map((evaluation: any) => ({
            id: evaluation.id,
            supervisorName: evaluation.supervisorName,
            supervisorEmail: evaluation.supervisorEmail,
            evaluationMonth: evaluation.evaluationMonth,
            evaluationWeek: evaluation.evaluationWeek,
            submittedDate: new Date(evaluation.submittedAt).toLocaleDateString(),
            criteria: evaluation.criteria,
            overallFeedback: evaluation.overallFeedback,
            finalScore: evaluation.finalScore,
          })),
        }));
        
        setStudents(transformedData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load evaluations";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) =>
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentEmail.includes(searchTerm) ||
      student.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, students]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 65) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "outline" => {
    if (score >= 85) return "default";
    if (score >= 75) return "secondary";
    return "outline";
  };

  const calculateAverageScore = (evaluations: EvaluationRecord[]) => {
    if (evaluations.length === 0) return 0;
    const total = evaluations.reduce((sum, e) => sum + e.finalScore, 0);
    return Math.round(total / evaluations.length);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading evaluations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Student Evaluations Review</h2>
        <p className="text-sm text-muted-foreground">
          Search and view supervisor evaluations for your assigned students.
        </p>
      </div>

      {/* Search Section */}
      <Card className="p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, email, or project title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {!selectedStudent ? (
        <div className="space-y-3">
          {filteredStudents.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No students found matching your search.</p>
            </Card>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid gap-3">
                {filteredStudents.map((student) => (
                  <Card key={student.studentEmail} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{student.studentName}</p>
                          <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                          <p className="text-sm text-blue-600 mt-1">{student.projectTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Evaluations</p>
                          <p className="text-2xl font-bold">{student.evaluations.length}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Avg: <span className={getScoreColor(calculateAverageScore(student.evaluations))}>
                              {calculateAverageScore(student.evaluations)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </button>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Student Header */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Student</p>
                <p className="text-2xl font-semibold">{selectedStudent.studentName}</p>
                <p className="text-sm text-muted-foreground">{selectedStudent.studentEmail}</p>
                <p className="text-sm text-blue-600 mt-2">📌 {selectedStudent.projectTitle}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStudent(null);
                  setSearchTerm("");
                }}
              >
                Back
              </Button>
            </div>

            <Separator className="mb-4" />

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Evaluations</p>
                <p className="text-2xl font-bold">{selectedStudent.evaluations.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(calculateAverageScore(selectedStudent.evaluations))}`}>
                  {calculateAverageScore(selectedStudent.evaluations)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Latest Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(selectedStudent.evaluations[selectedStudent.evaluations.length - 1]?.finalScore || 0)}`}>
                  {selectedStudent.evaluations[selectedStudent.evaluations.length - 1]?.finalScore || "-"}
                </p>
              </div>
            </div>
          </Card>

          {/* Evaluations List */}
          <div className="space-y-3">
            <h3 className="font-semibold">Evaluation History</h3>
            {selectedStudent.evaluations.map((evaluation) => (
              <Collapsible
                key={evaluation.id}
                open={expandedEvaluation === evaluation.id}
                onOpenChange={(open) => setExpandedEvaluation(open ? evaluation.id : null)}
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full p-4 bg-white border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">
                            Month {evaluation.evaluationMonth}, Period {evaluation.evaluationWeek}
                          </p>
                          <Badge variant={getScoreBadgeVariant(evaluation.finalScore)}>
                            {evaluation.finalScore}/100
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          by {evaluation.supervisorName} • {new Date(evaluation.submittedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronDown
                        className="h-4 w-4 text-muted-foreground transition-transform"
                        style={{ transform: expandedEvaluation === evaluation.id ? "rotate(180deg)" : "none" }}
                      />
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="p-4 space-y-4 bg-muted/30 border-t">
                  {/* Supervisor Info */}
                  <div>
                    <p className="text-sm font-medium mb-2">Submitted by</p>
                    <div className="text-sm">
                      <p className="font-medium">{evaluation.supervisorName}</p>
                      <p className="text-muted-foreground">{evaluation.supervisorEmail}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Criteria Details */}
                  <div>
                    <p className="text-sm font-medium mb-3">Criterion Scores</p>
                    <div className="space-y-2">
                      {evaluation.criteria.map((criterion, idx) => (
                        <Collapsible
                          key={idx}
                          open={expandedCriteria === `${evaluation.id}-${idx}`}
                          onOpenChange={(open) =>
                            setExpandedCriteria(open ? `${evaluation.id}-${idx}` : null)
                          }
                        >
                          <CollapsibleTrigger asChild>
                            <button className="w-full text-left p-2 hover:bg-white/50 rounded transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{criterion.name}</p>
                                  <p className="text-xs text-muted-foreground">Weight: {criterion.weight}%</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getScoreBadgeVariant(criterion.score)}>
                                    {criterion.score}/100
                                  </Badge>
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                </div>
                              </div>
                            </button>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="p-3 ml-2 border-l-2 border-muted bg-white/50 rounded-r text-sm space-y-2">
                            <div>
                              <p className="text-xs font-medium mb-1">Score Progress</p>
                              <div className="flex items-center gap-2">
                                <Progress value={criterion.score} className="flex-1" />
                                <p className="text-xs font-semibold w-8 text-right">{criterion.score}%</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium mb-1">Feedback</p>
                              <p className="text-xs text-muted-foreground">{criterion.feedback}</p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Overall Feedback */}
                  <div>
                    <p className="text-sm font-medium mb-2">Overall Feedback</p>
                    <p className="text-sm text-muted-foreground bg-white p-3 rounded border">
                      {evaluation.overallFeedback}
                    </p>
                  </div>

                  <Separator />

                  {/* Score Calculation */}
                  <div>
                    <p className="text-sm font-medium mb-2">Weighted Score Calculation</p>
                    <div className="text-xs space-y-1">
                      {evaluation.criteria.map((c, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-muted-foreground">{c.name}:</span>
                          <span className="font-medium">
                            {c.score} × {c.weight}% = {Math.round((c.score * c.weight) / 100)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t font-semibold">
                      <span>Final Score:</span>
                      <span className={getScoreColor(evaluation.finalScore)}>
                        {evaluation.finalScore}/100
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
