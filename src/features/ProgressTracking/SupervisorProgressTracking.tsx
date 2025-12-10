import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ClipboardList,
  TrendingUp,
  PenLine,
} from "lucide-react";

type ProgressLog = {
  id: number;
  owner: string;
  slot: number;
  title?: string | null;
  description: string;
  fileUrl?: string | null;
  signStatus: string;
  submittedAt?: string;
};

const TOTAL_SLOTS = 24;

export default function SupervisorProgressTracking() {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingMap, setSigningMap] = useState<Record<number, boolean>>({});
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/progress/logs/supervisor");
      if (!res.ok) throw new Error("Failed to load logs");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Error loading progress logs:", err);
      toast.error("Failed to load progress logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSign = async (logId: number) => {
    try {
      setSigningMap((prev) => ({ ...prev, [logId]: true }));
      const res = await fetch(`http://localhost:8000/api/progress/logs/${logId}/sign`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to sign log");
      const updatedLog = await res.json();

      setLogs((prev) =>
        prev.map((log) =>
          log.id === logId ? { ...log, signStatus: updatedLog.signStatus } : log
        )
      );
      toast.success("Log marked as signed");
    } catch (err) {
      console.error("Error signing log:", err);
      toast.error("Failed to sign log");
    } finally {
      setSigningMap((prev) => ({ ...prev, [logId]: false }));
    }
  };

  // Group logs by student email
  const logsByStudent: Record<string, ProgressLog[]> = {};
  logs.forEach((log) => {
    if (!logsByStudent[log.owner]) {
      logsByStudent[log.owner] = [];
    }
    logsByStudent[log.owner].push(log);
  });

  const studentEmails = Object.keys(logsByStudent);
  const totalStudents = studentEmails.length;
  const totalLogs = logs.length;
  const signedLogs = logs.filter((l) => l.signStatus === "signed").length;
  const pendingLogs = logs.filter((l) => l.signStatus !== "signed").length;

  const toggleStudent = (email: string) => {
    setExpandedStudents((prev) => ({ ...prev, [email]: !prev[email] }));
  };

  const renderStudentCard = (studentEmail: string, studentLogs: ProgressLog[]) => {
    const isExpanded = expandedStudents[studentEmail];
    const signedCount = studentLogs.filter((l) => l.signStatus === "signed").length;
    const pendingCount = studentLogs.filter((l) => l.signStatus !== "signed").length;
    const progressPercent = (studentLogs.length / TOTAL_SLOTS) * 100;

    return (
      <Card key={studentEmail} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                {studentEmail}
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {studentLogs.length}/{TOTAL_SLOTS} logs
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {signedCount} signed
                </span>
                {pendingCount > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Clock className="h-3 w-3" />
                    {pendingCount} pending
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 ? (
                <Badge variant="outline" className="border-yellow-400 text-yellow-600 gap-1">
                  <PenLine className="h-3 w-3" />
                  Needs Review
                </Badge>
              ) : studentLogs.length === TOTAL_SLOTS ? (
                <Badge className="bg-green-500 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  All Signed
                </Badge>
              ) : (
                <Badge variant="outline" className="border-blue-400 text-blue-600 gap-1">
                  <TrendingUp className="h-3 w-3" />
                  In Progress
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Expand/Collapse */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleStudent(studentEmail)}
            className="gap-2 w-full justify-center"
          >
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isExpanded ? "Hide Logs" : "View Logs"}
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {isExpanded && (
            <div className="space-y-3 pt-2 border-t">
              {studentLogs
                .sort((a, b) => a.slot - b.slot)
                .map((log) => (
                  <Card
                    key={log.id}
                    className={`p-3 ${
                      log.signStatus === "signed"
                        ? "border-l-4 border-l-green-500"
                        : "border-l-4 border-l-yellow-500"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Log {log.slot}</span>
                          {log.title && <span className="text-xs text-muted-foreground">({log.title})</span>}
                          {log.signStatus === "signed" ? (
                            <Badge className="bg-green-500 gap-1 text-xs">
                              <CheckCircle2 className="h-3 w-3" />
                              Signed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-400 text-yellow-600 gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{log.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {log.fileUrl && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const fileUrl = log.fileUrl!.startsWith("http")
                                    ? log.fileUrl!
                                    : `http://localhost:8000${log.fileUrl}`;
                                  const response = await fetch(fileUrl);
                                  if (!response.ok) {
                                    toast.error("Failed to download file");
                                    return;
                                  }
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = `log-${log.slot}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                } catch (error) {
                                  console.error("Download error:", error);
                                  toast.error("Failed to download file");
                                }
                              }}
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <Download className="h-3 w-3" />
                              Download file
                            </button>
                          )}
                          {log.submittedAt && (
                            <span>Submitted: {new Date(log.submittedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSign(log.id)}
                        disabled={log.signStatus === "signed" || signingMap[log.id]}
                        variant={log.signStatus === "signed" ? "outline" : "default"}
                        size="sm"
                        className="gap-2"
                      >
                        {signingMap[log.id] ? (
                          "Signing..."
                        ) : log.signStatus === "signed" ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Signed
                          </>
                        ) : (
                          <>
                            <PenLine className="h-4 w-4" />
                            Sign
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progress Tracking</h1>
          <p className="text-muted-foreground">Review and sign student progress logs</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-2xl">{totalStudents}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardDescription>Total Logs</CardDescription>
            <CardTitle className="text-2xl">{totalLogs}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription>Signed</CardDescription>
            <CardTitle className="text-2xl">{signedLogs}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl">{pendingLogs}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content */}
      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">Loading progress logs...</Card>
      ) : logs.length === 0 ? (
        <Card className="p-8 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">No progress logs submitted yet</p>
        </Card>
      ) : (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Needs Review ({studentEmails.filter((e) => logsByStudent[e].some((l) => l.signStatus !== "signed")).length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              All Students ({totalStudents})
            </TabsTrigger>
            <TabsTrigger value="complete" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              All Signed ({studentEmails.filter((e) => logsByStudent[e].every((l) => l.signStatus === "signed")).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {studentEmails.filter((e) => logsByStudent[e].some((l) => l.signStatus !== "signed")).length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">All logs have been signed</p>
              </Card>
            ) : (
              studentEmails
                .filter((e) => logsByStudent[e].some((l) => l.signStatus !== "signed"))
                .map((email) => renderStudentCard(email, logsByStudent[email]))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {studentEmails.map((email) => renderStudentCard(email, logsByStudent[email]))}
          </TabsContent>

          <TabsContent value="complete" className="space-y-4">
            {studentEmails.filter((e) => logsByStudent[e].every((l) => l.signStatus === "signed")).length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">No students have all logs signed yet</p>
              </Card>
            ) : (
              studentEmails
                .filter((e) => logsByStudent[e].every((l) => l.signStatus === "signed"))
                .map((email) => renderStudentCard(email, logsByStudent[email]))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
