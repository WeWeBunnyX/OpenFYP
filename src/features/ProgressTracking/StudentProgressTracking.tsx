import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle2,
  Clock,
  RefreshCw,
  Upload,
  Lock,
  Unlock,
  Send,
  GraduationCap,
  TrendingUp,
  ClipboardList,
  Award,
} from "lucide-react";

// Contract
// - Renders 24 log slots in order (1..24)
// - Each slot requires: title (optional), description (required), file (required)
// - Only the next slot is enabled after the previous one is successfully saved
// - Persist & load using simple REST endpoints (assumed):
//   GET  /api/progress/logs?owner=<email>
//   POST /api/progress/logs  (multipart/form-data: owner, slot, title, description, file)
// - After all 24 are completed, show a prompt/toast that the student is ready for interim evaluation

type ProgressLog = {
  id?: string;
  owner: string;
  slot: number; // 1..24
  title?: string | null;
  description: string;
  fileUrl?: string | null;
  signStatus?: string; // "pending" or "signed"
  submittedAt?: string; // ISO
};

const TOTAL_SLOTS = 24;
const lsKey = (owner: string) => `progressLogs:${owner}`;

function lsLoad(owner: string): ProgressLog[] {
  try {
    const raw = localStorage.getItem(lsKey(owner));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function lsSave(owner: string, logs: ProgressLog[]) {
  try {
    localStorage.setItem(lsKey(owner), JSON.stringify(logs));
  } catch {
    // ignore
  }
}

function SlotForm({
  index,
  disabled,
  existing,
  owner,
  onSaved,
}: {
  index: number;
  disabled: boolean;
  existing?: ProgressLog | null;
  owner: string;
  onSaved: (log: ProgressLog) => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(existing?.title ?? "");
    setDescription(existing?.description ?? "");
    // Don't auto set file
  }, [existing?.title, existing?.description]);

  const isCompleted = !!existing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompleted) return;
    if (!description.trim()) {
      toast.error("Please add a brief description of your progress.");
      return;
    }
    if (!file) {
      toast.error("Please attach a log file (PDF, DOCX, or ZIP).");
      return;
    }

    try {
      setSaving(true);
      const form = new FormData();
      form.append("owner", owner);
      form.append("slot", String(index));
      if (title.trim()) form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("file", file as File);

      let saved: ProgressLog | null = null;
      try {
        const res = await fetch("http://localhost:8000/api/progress/logs", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error("POST /api/progress/logs failed:", res.status, errText);
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        saved = await res.json();
      } catch (err) {
        console.error("Failed to POST to /api/progress/logs:", err);
        // Fallback: store minimal record in localStorage
        saved = {
          id: `${owner}-${index}`,
          owner,
          slot: index,
          title: title.trim() || null,
          description: description.trim(),
          fileUrl: null,
          signStatus: "pending",
          submittedAt: new Date().toISOString(),
        };
      }

      toast.success(`Log ${index} saved successfully`);
      onSaved(saved);
      setFile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save log";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      className={`overflow-hidden ${
        isCompleted
          ? "border-l-4 border-l-green-500"
          : disabled
          ? "opacity-60"
          : "border-l-4 border-l-blue-500"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Log {index}
          </CardTitle>
          {isCompleted ? (
            <Badge className="bg-green-500 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Submitted
            </Badge>
          ) : disabled ? (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
          ) : (
            <Badge className="bg-blue-500 gap-1">
              <Unlock className="h-3 w-3" />
              Unlocked
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Title (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={disabled || isCompleted}
                placeholder="e.g., Week 1 Progress"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Attachment</Label>
              {isCompleted && existing?.fileUrl ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const fileUrl = existing.fileUrl!.startsWith("http")
                        ? existing.fileUrl!
                        : `http://localhost:8000${existing.fileUrl}`;
                      const response = await fetch(fileUrl);
                      if (!response.ok) {
                        toast.error("Failed to download file");
                        return;
                      }
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `log-${existing.slot}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error("Download error:", error);
                      toast.error("Failed to download file");
                    }
                  }}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 border rounded-md hover:bg-blue-50 transition-colors w-full"
                >
                  <FileText className="h-4 w-4" />
                  Download uploaded file
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip,.rar"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    disabled={disabled || isCompleted}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={disabled || isCompleted}
              placeholder="Summarize what you accomplished in this period."
              className="min-h-[80px]"
            />
          </div>

          {isCompleted && existing?.signStatus && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <span className="text-sm font-medium">Supervisor Status:</span>
              {existing.signStatus === "signed" ? (
                <Badge className="bg-green-500 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Signed
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-yellow-400 text-yellow-600 gap-1"
                >
                  <Clock className="h-3 w-3" />
                  Pending
                </Badge>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={disabled || isCompleted || saving}
              className="gap-2"
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submitted
                </>
              ) : saving ? (
                "Saving..."
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Log
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function StudentProgressTracking() {
  const { user } = useAuth();
  const owner = user?.email ?? "";
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEvalDialog, setShowEvalDialog] = useState(false);
  const [evalMessage, setEvalMessage] = useState("");
  const [evalLoading, setEvalLoading] = useState(false);

  // Determine which next slot should be unlocked: first incomplete slot
  const completedSlots = useMemo(() => new Set(logs.map((l) => l.slot)), [logs]);
  const nextUnlocked = useMemo(() => {
    for (let i = 1; i <= TOTAL_SLOTS; i++) {
      if (!completedSlots.has(i)) return i;
    }
    return null; // all done
  }, [completedSlots]);

  const fetchLogs = async () => {
    if (!owner) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let data: ProgressLog[] | null = null;
      try {
        const res = await fetch(
          `http://localhost:8000/api/progress/logs?owner=${encodeURIComponent(
            owner
          )}`
        );
        if (!res.ok) throw new Error("Load failed");
        data = await res.json();
      } catch {
        data = lsLoad(owner);
      }
      const valid = (data ?? [])
        .filter((x) => x.slot >= 1 && x.slot <= TOTAL_SLOTS)
        .sort((a, b) => a.slot - b.slot);
      setLogs(valid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to load progress logs";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [owner]);

  useEffect(() => {
    if (nextUnlocked === null && !loading) {
      toast.success("All 24 logs submitted. You are ready for interim evaluation!");
    }
  }, [nextUnlocked, loading]);

  const handleSaved = (saved: ProgressLog) => {
    setLogs((prev) => {
      const next = [...prev.filter((p) => p.slot !== saved.slot), saved].sort((a, b) => a.slot - b.slot);
      if (owner) lsSave(owner, next);
      return next;
    });
  };

  const handleLearnMore = async () => {
    setEvalLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/progress/interim-eligibility?owner=${encodeURIComponent(
          owner
        )}`
      );
      if (!res.ok) {
        throw new Error("Failed to check eligibility");
      }
      const data = await res.json();
      setEvalMessage(data.message || "You have successfully uploaded all 24 logs and will be notified for interim evaluation!");
      setShowEvalDialog(true);
    } catch (err) {
      setEvalMessage("Congratulations! You have successfully uploaded all 24 logs and are now eligible to register for interim evaluation. Your coordinator will schedule your evaluation soon.");
      setShowEvalDialog(true);
    } finally {
      setEvalLoading(false);
    }
  };

  const grid = useMemo(() => {
    const items: { slot: number; existing?: ProgressLog | null }[] = [];
    for (let i = 1; i <= TOTAL_SLOTS; i++) {
      const existing = logs.find((l) => l.slot === i) ?? null;
      items.push({ slot: i, existing });
    }
    return items;
  }, [logs]);

  const progressPercent = (logs.length / TOTAL_SLOTS) * 100;
  const signedCount = logs.filter((l) => l.signStatus === "signed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progress Tracking</h1>
          <p className="text-muted-foreground">
            Upload 24 sequential logs to track your FYP progress
          </p>
        </div>
        <Button
          onClick={fetchLogs}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription>Total Slots</CardDescription>
            <CardTitle className="text-2xl">{TOTAL_SLOTS}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription>Submitted</CardDescription>
            <CardTitle className="text-2xl">{logs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription>Signed</CardDescription>
            <CardTitle className="text-2xl">{signedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
            <CardTitle className="text-2xl">{TOTAL_SLOTS - logs.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Progress
              </CardTitle>
              <CardDescription>
                Complete all 24 logs to become eligible for interim evaluation
              </CardDescription>
            </div>
            {nextUnlocked === null && (
              <Badge className="bg-green-500 gap-1">
                <Award className="h-3 w-3" />
                Complete!
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {logs.length} of {TOTAL_SLOTS} logs submitted
              </span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
          {nextUnlocked !== null && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Unlock className="h-4 w-4 text-blue-500" />
              Next unlocked: Log {nextUnlocked}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Log Forms */}
      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">
          Loading your logs...
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {grid.map(({ slot, existing }) => (
            <SlotForm
              key={slot}
              index={slot}
              existing={existing}
              owner={owner}
              disabled={nextUnlocked !== slot}
              onSaved={handleSaved}
            />
          ))}
        </div>
      )}

      {/* Ready for Evaluation */}
      {nextUnlocked === null && !loading && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-500 text-white">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-green-800">
                    Ready for Interim Evaluation
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    All 24 logs have been submitted successfully
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleLearnMore}
                disabled={evalLoading}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <Award className="h-4 w-4" />
                {evalLoading ? "Checking..." : "Learn More"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">
              Congratulations! You have completed all progress logs. Your coordinator will schedule your interim evaluation soon. Keep an eye on the Scheduling section for your assigned time.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Interim Evaluation Dialog */}
      <Dialog open={showEvalDialog} onOpenChange={setShowEvalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-500" />
              Interim Evaluation Eligibility
            </DialogTitle>
            <DialogDescription className="pt-4">
              {evalMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowEvalDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
