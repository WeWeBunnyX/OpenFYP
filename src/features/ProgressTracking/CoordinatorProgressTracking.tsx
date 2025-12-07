/* eslint-disable import/no-unused-modules */
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type ProgressLog = {
  id: number;
  owner: string;
  slot: number;
  title?: string | null;
  description: string;
  fileUrl?: string | null;
  signStatus: string; // "pending" or "signed"
  submittedAt?: string;
};

export default function CoordinatorProgressTracking() {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchLogs();
  }, []);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading progress logs...</div>;
  }

  if (logs.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">No progress logs submitted yet.</p>
      </Card>
    );
  }

  // Group logs by student email
  const logsByStudent: Record<string, ProgressLog[]> = {};
  logs.forEach((log) => {
    if (!logsByStudent[log.owner]) {
      logsByStudent[log.owner] = [];
    }
    logsByStudent[log.owner].push(log);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Student Progress Logs</h2>
        <p className="text-sm text-muted-foreground">
          View all student progress logs and their approval status.
        </p>
      </div>

      {Object.entries(logsByStudent).map(([studentEmail, studentLogs]) => (
        <Card key={studentEmail} className="p-4">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">{studentEmail}</h3>
            <p className="text-sm text-muted-foreground">
              {studentLogs.length} logs submitted •{" "}
              {studentLogs.filter((l) => l.signStatus === "signed").length} signed
            </p>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            {studentLogs.map((log) => (
              <Card key={log.id} className="p-3 bg-muted/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Log {log.slot}</span>
                      {log.title && <span className="text-sm text-muted-foreground">({log.title})</span>}
                      <Badge variant={log.signStatus === "signed" ? "default" : "secondary"}>
                        {log.signStatus === "signed" ? "Signed" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm">{log.description}</p>
                    {log.fileUrl && (
                      <a
                        href={`http://localhost:8000${log.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        📎 View file
                      </a>
                    )}
                    {log.submittedAt && (
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(log.submittedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
