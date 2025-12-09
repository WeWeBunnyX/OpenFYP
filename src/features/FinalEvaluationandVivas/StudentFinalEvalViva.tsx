import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Users,
  FileText,
  TrendingUp,
  Award,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type CommitteeMember = {
  id: string;
  name: string;
  email: string;
  role: "Chairman" | "Internal" | "External";
};

type FinalEvaluation = {
  studentEmail: string;
  studentName: string;
  projectTitle: string;
  status: "pending" | "scheduled" | "in-progress" | "completed" | "published";
  vivaDate?: string;
  committee: CommitteeMember[];
  marks: {
    [memberId: string]: {
      marks: number;
      feedback: string;
      submittedAt?: string;
    };
  };
  weightedAverage?: number;
  finalGrade?: string;
  publishedAt?: string;
};

export default function StudentFinalEvalViva() {
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState<FinalEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFinalEvaluation();
  }, []);

  const fetchFinalEvaluation = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: FinalEvaluation = {
        studentEmail: user?.email || "",
        studentName: user?.name || "Student",
        projectTitle: "AI-Based Project Management System",
        status: "published",
        vivaDate: "2025-12-15T10:00:00",
        committee: [
          { id: "c1", name: "Dr. Ahmed Khan", email: "dr.ahmed@uni.edu", role: "Chairman" },
          { id: "c2", name: "Dr. Fatima Ali", email: "dr.fatima@uni.edu", role: "Internal" },
          { id: "c3", name: "Prof. James Wilson", email: "prof.james@uni.edu", role: "External" },
        ],
        marks: {
          c1: {
            marks: 85,
            feedback: "Excellent technical knowledge and implementation",
            submittedAt: "2025-12-15T11:30:00",
          },
          c2: {
            marks: 80,
            feedback: "Good project design and execution",
            submittedAt: "2025-12-15T11:45:00",
          },
          c3: {
            marks: 88,
            feedback: "Outstanding presentation and Q&A performance",
            submittedAt: "2025-12-15T12:00:00",
          },
        },
        weightedAverage: 84.33,
        finalGrade: "A",
        publishedAt: "2025-12-15T13:00:00",
      };

      setEvaluation(mockData);
    } catch (err) {
      console.error("Error fetching final evaluation:", err);
      toast.error("Failed to fetch final evaluation data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchFinalEvaluation();
      toast.success("Data refreshed successfully");
    } catch (err) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800";
      case "B":
        return "bg-blue-100 text-blue-800";
      case "C":
        return "bg-yellow-100 text-yellow-800";
      case "D":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <RefreshCw className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-600">Loading your final evaluation results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Final Evaluation & Viva Results</h1>
          <p className="text-gray-600 mt-1">Your final grade and detailed feedback from the evaluation committee</p>
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

      {evaluation ? (
        <div className="space-y-6">
          {/* Project Info Card */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{evaluation.projectTitle}</h2>
                    <p className="text-sm text-gray-600 mt-1">{evaluation.studentEmail}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                  {getStatusBadge(evaluation.status)}
                </div>
                {evaluation.vivaDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Viva Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(evaluation.vivaDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Status Alert */}
          {evaluation.status === "published" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✓ Your final grades have been published. The results below are official.
              </AlertDescription>
            </Alert>
          )}

          {evaluation.status !== "published" && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Your final evaluation is in progress. Results will be published once the coordinator completes the approval process.
              </AlertDescription>
            </Alert>
          )}

          {/* Final Grade Display */}
          {evaluation.weightedAverage !== undefined && evaluation.finalGrade && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-600 rounded-lg">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Weighted Average</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {evaluation.weightedAverage.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">out of 100</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${getGradeColor(evaluation.finalGrade).split(" ")[0]}`}>
                    <span className="text-2xl font-bold text-white">{evaluation.finalGrade}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Final Grade</p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {evaluation.finalGrade === "A"
                        ? "Excellent"
                        : evaluation.finalGrade === "B"
                        ? "Very Good"
                        : evaluation.finalGrade === "C"
                        ? "Good"
                        : "Satisfactory"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Committee Size</p>
                    <p className="text-3xl font-bold text-blue-600">{evaluation.committee.length}</p>
                    <p className="text-xs text-gray-600 mt-1">evaluators</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Committee Members Feedback */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Committee Feedback
            </h3>
            <Separator className="mb-4" />

            <div className="space-y-4">
              {evaluation.committee.map((member) => {
                const memberMarks = evaluation.marks[member.id];
                return (
                  <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
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

                    {memberMarks ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-sm font-medium text-gray-700">Marks Awarded</span>
                          <span className="text-2xl font-bold text-green-600">{memberMarks.marks}/100</span>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Feedback</p>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap">
                            {memberMarks.feedback}
                          </p>
                        </div>

                        {memberMarks.submittedAt && (
                          <p className="text-xs text-gray-500">
                            Submitted on {new Date(memberMarks.submittedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          Marks not yet submitted by this evaluator
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Summary */}
          {evaluation.status === "published" && evaluation.publishedAt && (
            <Card className="p-4 bg-purple-50 border-purple-200">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Published on:</span> {new Date(evaluation.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </Card>
          )}

          {/* Download Button */}
          <div className="flex gap-3">
            <Button className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Download Certificate
            </Button>
            <Button variant="outline" className="flex-1">
              Download Result Sheet
            </Button>
          </div>
        </div>
      ) : (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No final evaluation data available</p>
          </div>
        </Card>
      )}
    </div>
  );
}
