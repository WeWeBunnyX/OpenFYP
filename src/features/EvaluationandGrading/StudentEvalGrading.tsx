/* eslint-disable import/no-unused-modules */
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ChevronDown, TrendingUp, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type CriterionResult = {
  name: string;
  weight: number;
  score: number;
  feedback: string;
};

type EvaluationResult = {
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

export default function StudentEvalGrading() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<EvaluationResult | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);

  // Mock data - in real app, fetch from API
  const mockEvaluations: EvaluationResult[] = [
    {
      id: 1,
      supervisorName: "Dr. Ahmed Khan",
      supervisorEmail: "supervisor@example.com",
      evaluationMonth: 1,
      evaluationWeek: 2,
      submittedDate: "2025-01-15",
      criteria: [
        {
          name: "Code Quality & Implementation",
          weight: 25,
          score: 82,
          feedback: "Good initial implementation. Code is well-structured but needs better error handling in edge cases.",
        },
        {
          name: "Progress & Work Completion",
          weight: 25,
          score: 85,
          feedback: "Excellent progress in the first two weeks. You've completed the core requirements on schedule.",
        },
        {
          name: "Problem-Solving & Innovation",
          weight: 20,
          score: 78,
          feedback: "Shows good understanding of the problem domain. Consider exploring more innovative solutions for the data layer.",
        },
        {
          name: "Documentation & Communication",
          weight: 15,
          score: 88,
          feedback: "Very clear documentation and code comments. Great technical writing skills demonstrated.",
        },
        {
          name: "Collaboration & Professionalism",
          weight: 15,
          score: 90,
          feedback: "Excellent communication in meetings. Always prepared and asks clarifying questions.",
        },
      ],
      overallFeedback:
        "Excellent start to the project! You're demonstrating strong technical skills and excellent communication. Keep maintaining the momentum and focus on edge case handling. Great progress!",
      finalScore: 84,
    },
    {
      id: 2,
      supervisorName: "Dr. Ahmed Khan",
      supervisorEmail: "supervisor@example.com",
      evaluationMonth: 2,
      evaluationWeek: 1,
      submittedDate: "2025-02-15",
      criteria: [
        {
          name: "Code Quality & Implementation",
          weight: 25,
          score: 86,
          feedback: "Significant improvement in code quality. Error handling is now robust. Consider adding unit tests for better coverage.",
        },
        {
          name: "Progress & Work Completion",
          weight: 25,
          score: 84,
          feedback: "On track with the timeline. Completed API endpoints and database schema as planned.",
        },
        {
          name: "Problem-Solving & Innovation",
          weight: 20,
          score: 81,
          feedback: "Good problem-solving approach. Database optimization is efficient.",
        },
        {
          name: "Documentation & Communication",
          weight: 15,
          score: 89,
          feedback: "API documentation is comprehensive. Good use of inline comments.",
        },
        {
          name: "Collaboration & Professionalism",
          weight: 15,
          score: 92,
          feedback: "Outstanding collaboration during code reviews. Very receptive to feedback.",
        },
      ],
      overallFeedback:
        "Continued excellent performance. You're showing consistent growth in technical skills. Focus on implementing unit tests to improve code reliability. Keep up the great work!",
      finalScore: 86,
    },
  ];

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        // TODO: Fetch from backend
        // const res = await fetch(`http://localhost:8000/api/evaluations?student=${user?.email}`);
        // if (!res.ok) throw new Error("Failed to load evaluations");
        // const data = await res.json();
        // setEvaluations(data);

        // Use mock data for now
        setEvaluations(mockEvaluations);
        if (mockEvaluations.length > 0) {
          setSelectedEval(mockEvaluations[0]);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load evaluations";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.email]);

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

  const calculateAverageScore = () => {
    if (evaluations.length === 0) return 0;
    const total = evaluations.reduce((sum, e) => sum + e.finalScore, 0);
    return Math.round(total / evaluations.length);
  };

  const calculateTrend = () => {
    if (evaluations.length < 2) return null;
    const latest = evaluations[evaluations.length - 1].finalScore;
    const previous = evaluations[evaluations.length - 2].finalScore;
    return latest - previous;
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading your evaluation results...</div>;
  }

  if (evaluations.length === 0) {
    return (
      <Card className="p-6">
        <AlertCircle className="h-5 w-5 text-muted-foreground inline mr-2" />
        <p className="text-sm text-muted-foreground">No evaluations submitted yet by your supervisor.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Your Evaluation Results</h2>
        <p className="text-sm text-muted-foreground">
          View feedback and scores from your supervisor's regular progress evaluations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Evaluations Submitted</p>
          <p className="text-3xl font-bold">{evaluations.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Every 15 days</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Average Score</p>
          <p className={`text-3xl font-bold ${getScoreColor(calculateAverageScore())}`}>
            {calculateAverageScore()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">/ 100</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Latest Trend</p>
          {calculateTrend() !== null ? (
            <>
              <div className="flex items-center gap-2">
                <TrendingUp
                  className={`h-5 w-5 ${calculateTrend()! >= 0 ? "text-green-600" : "text-red-600"}`}
                  style={{ transform: calculateTrend()! < 0 ? "scaleY(-1)" : "none" }}
                />
                <p className={`text-2xl font-bold ${calculateTrend()! >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {calculateTrend()! >= 0 ? "+" : ""}
                  {calculateTrend()}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs previous evaluation</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Only 1 evaluation</p>
          )}
        </Card>
      </div>

      {/* Evaluations Timeline */}
      <Tabs defaultValue={String(evaluations[0]?.id)} className="space-y-4">
        <TabsList className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(evaluations.length, 4)}, 1fr)` }}>
          {evaluations.map((evaluation) => (
            <TabsTrigger
              key={evaluation.id}
              value={String(evaluation.id)}
              onClick={() => setSelectedEval(evaluation)}
              className="text-xs"
            >
              <div className="text-center">
                <p className="font-semibold">M{evaluation.evaluationMonth}W{evaluation.evaluationWeek}</p>
                <Badge variant={getScoreBadgeVariant(evaluation.finalScore)} className="mt-1">
                  {evaluation.finalScore}
                </Badge>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {evaluations.map((evaluation) => (
          <TabsContent key={evaluation.id} value={String(evaluation.id)} className="space-y-4">
            {selectedEval?.id === evaluation.id && (
              <>
                {/* Evaluation Header */}
                <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Submitted by</p>
                      <p className="font-semibold">{evaluation.supervisorName}</p>
                      <p className="text-xs text-muted-foreground">{evaluation.supervisorEmail}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        📅 Month {evaluation.evaluationMonth}, Period {evaluation.evaluationWeek} • Submitted{" "}
                        {new Date(evaluation.submittedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Final Score</p>
                      <p className={`text-4xl font-bold ${getScoreColor(evaluation.finalScore)}`}>{evaluation.finalScore}</p>
                      <p className="text-xs text-muted-foreground">/ 100</p>
                    </div>
                  </div>
                </Card>

                {/* Criteria Scores */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Detailed Scoring</h3>
                  <div className="space-y-3">
                    {evaluation.criteria.map((criterion, idx) => (
                      <Collapsible
                        key={idx}
                        open={expandedCriteria === `${evaluation.id}-${idx}`}
                        onOpenChange={(open) =>
                          setExpandedCriteria(open ? `${evaluation.id}-${idx}` : null)
                        }
                      >
                        <CollapsibleTrigger asChild>
                          <button className="w-full text-left p-3 hover:bg-muted/50 rounded transition-colors border border-transparent hover:border-muted">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{criterion.name}</p>
                                <p className="text-xs text-muted-foreground">Weight: {criterion.weight}%</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant={getScoreBadgeVariant(criterion.score)}>
                                  {criterion.score}/100
                                </Badge>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="p-4 ml-4 border-l-2 border-muted bg-muted/30 rounded-r space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-2">Score Progress</p>
                            <div className="flex items-center gap-3">
                              <Progress value={criterion.score} className="flex-1" />
                              <p className="text-sm font-semibold w-12 text-right">{criterion.score}%</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">Supervisor Feedback</p>
                            <p className="text-sm text-muted-foreground bg-white p-3 rounded border border-muted">
                              {criterion.feedback}
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </Card>

                {/* Overall Feedback */}
                <Card className="p-4 bg-amber-50 border border-amber-200">
                  <h3 className="font-semibold mb-3">💬 Overall Feedback</h3>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{evaluation.overallFeedback}</p>
                </Card>

                {/* Weighted Score Breakdown */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Score Calculation (Weighted)</h3>
                  <div className="space-y-2 text-sm">
                    {evaluation.criteria.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {c.name}: {c.score} × {c.weight}%
                        </span>
                        <span className="font-medium">
                          {Math.round((c.score * c.weight) / 100)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Final Weighted Score</span>
                    <span className={`text-lg font-bold ${getScoreColor(evaluation.finalScore)}`}>
                      {evaluation.finalScore}
                    </span>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Performance Insights */}
      {evaluations.length > 1 && (
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <h3 className="font-semibold mb-3">📊 Your Progress</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Score Trend:</span>{" "}
              <span className={calculateTrend()! >= 0 ? "text-green-600" : "text-red-600"}>
                {calculateTrend()! >= 0 ? "📈 Improving" : "📉 Declining"} by {Math.abs(calculateTrend()!)} points
              </span>
            </p>
            <p>
              <span className="font-medium">Best Criterion:</span>{" "}
              {selectedEval?.criteria.reduce((a, b) => (a.score > b.score ? a : b)).name}
            </p>
            <p>
              <span className="font-medium">Focus Area:</span>{" "}
              {selectedEval?.criteria.reduce((a, b) => (a.score < b.score ? a : b)).name}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
