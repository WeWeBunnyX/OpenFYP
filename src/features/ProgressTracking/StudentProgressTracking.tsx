/* eslint-disable import/no-unused-modules */
import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
        const res = await fetch("http://localhost:8000/api/progress/logs", { method: "POST", body: form });
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

      toast.success(`Log ${index} saved`);
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
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Log {index}</div>
        {isCompleted ? (
          <span className="text-xs text-green-600">Submitted</span>
        ) : disabled ? (
          <span className="text-xs text-muted-foreground">Locked</span>
        ) : (
          <span className="text-xs text-blue-600">Unlocked</span>
        )}
      </div>
      <Separator />

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Title (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={disabled || isCompleted}
              placeholder="e.g., Week 1 Progress"
            />
          </div>
          <div>
            <label className="text-sm">Attachment</label>
            {isCompleted && existing?.fileUrl ? (
              <a
                href={existing.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View uploaded file
              </a>
            ) : (
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.zip,.rar"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={disabled || isCompleted}
              />
            )}
          </div>
        </div>
        <div>
          <label className="text-sm">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled || isCompleted}
            placeholder="Summarize what you accomplished in this period."
            className="min-h-[96px]"
          />
        </div>

        {isCompleted && existing?.signStatus && (
          <div className="text-sm">
            <label className="text-sm font-medium">Supervisor Sign Status:</label>
            <span
              className={`ml-2 inline-block px-2 py-1 rounded text-xs font-semibold ${
                existing.signStatus === "signed"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {existing.signStatus === "signed" ? "✓ Signed" : "⏳ Pending"}
            </span>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={disabled || isCompleted || saving}>
            {isCompleted ? "Submitted" : saving ? "Saving..." : "Submit Log"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function StudentProgressTracking() {
  const { user } = useAuth();
  const owner = user?.email ?? "";
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine which next slot should be unlocked: first incomplete slot
  const completedSlots = useMemo(() => new Set(logs.map((l) => l.slot)), [logs]);
  const nextUnlocked = useMemo(() => {
    for (let i = 1; i <= TOTAL_SLOTS; i++) {
      if (!completedSlots.has(i)) return i;
    }
    return null; // all done
  }, [completedSlots]);

  useEffect(() => {
    const run = async () => {
      if (!owner) { setLoading(false); return; }
      try {
        setLoading(true);
        let data: ProgressLog[] | null = null;
        try {
          const res = await fetch(`http://localhost:8000/api/progress/logs?owner=${encodeURIComponent(owner)}`);
          if (!res.ok) throw new Error("Load failed");
          data = await res.json();
        } catch {
          data = lsLoad(owner);
        }
        const valid = (data ?? []).filter((x) => x.slot >= 1 && x.slot <= TOTAL_SLOTS).sort((a, b) => a.slot - b.slot);
        setLogs(valid);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unable to load progress logs";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [owner]);

  useEffect(() => {
    if (nextUnlocked === null && !loading) {
      toast.success("All 24 logs submitted. You are ready for interim evaluation.");
    }
  }, [nextUnlocked, loading]);

  const handleSaved = (saved: ProgressLog) => {
    setLogs((prev) => {
      const next = [...prev.filter((p) => p.slot !== saved.slot), saved].sort((a, b) => a.slot - b.slot);
      if (owner) lsSave(owner, next);
      return next;
    });
  };

  const grid = useMemo(() => {
    const items: { slot: number; existing?: ProgressLog | null }[] = [];
    for (let i = 1; i <= TOTAL_SLOTS; i++) {
      const existing = logs.find((l) => l.slot === i) ?? null;
      items.push({ slot: i, existing });
    }
    return items;
  }, [logs]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Progress Tracking</h2>
        <p className="text-sm text-muted-foreground">
          Upload 24 sequential logs. Each submitted log unlocks the next slot.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading your logs...</div>
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

      {nextUnlocked === null && !loading && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Ready for Interim Evaluation</div>
            <Button
              onClick={() => toast.info("Your coordinator will schedule the interim evaluation.")}
            >
              Learn more
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            All 24 logs have been submitted. You are now eligible for interim evaluation. Keep an eye on the Scheduling section for your assigned time.
          </p>
        </Card>
      )}
    </div>
  );
}
