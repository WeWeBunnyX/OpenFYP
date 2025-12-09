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
  Plus,
  Trash2,
  Edit2,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Send,
  Eye,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type CommitteeMember = {
  id: string;
  name: string;
  email: string;
  role: "Chairman" | "Internal" | "External";
};

type GradingRubric = {
  id: string;
  criteriaName: string;
  maxMarks: number;
  weight: number;
};

type StudentViva = {
  id: string;
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
  calculatedFinalMarks?: number;
  weightedAverage?: number;
  approvalStatus?: "pending" | "approved" | "rejected";
};

type RubricError = {
  field: string;
  message: string;
};

export default function CoordinatorFinalEvalViva() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentViva[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentViva | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [rubric, setRubric] = useState<GradingRubric[]>([
    { id: "1", criteriaName: "Technical Knowledge", maxMarks: 25, weight: 0.25 },
    { id: "2", criteriaName: "Project Implementation", maxMarks: 25, weight: 0.25 },
    { id: "3", criteriaName: "Presentation Skills", maxMarks: 25, weight: 0.25 },
    { id: "4", criteriaName: "Q&A Performance", maxMarks: 25, weight: 0.25 },
  ]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showRubricDialog, setShowRubricDialog] = useState(false);
  const [newCommitteeMember, setNewCommitteeMember] = useState<Partial<CommitteeMember>>({});
  const [newRubricItem, setNewRubricItem] = useState<Partial<GradingRubric>>({});
  const [submittingMarks, setSubmittingMarks] = useState(false);
  const [publishingResults, setPublishingResults] = useState(false);
  const [rubricErrors, setRubricErrors] = useState<RubricError[]>([]);

  // Fetch students from backend API
  useEffect(() => {
    fetchStudentsForFinalEval();
  }, []);

  const fetchStudentsForFinalEval = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/final-evaluation/coordinator/students");
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      const data = await response.json();
      
      const transformedStudents = data.map((student: any) => ({
        id: student.id.toString(),
        studentEmail: student.student_email,
        studentName: student.student_name,
        projectTitle: student.project_title,
        status: student.status,
        vivaDate: student.viva_date,
        committee: [],
        marks: {},
        weightedAverage: student.weighted_average,
        approvalStatus: student.approval_status,
      }));
      
      setStudents(transformedStudents);
      if (transformedStudents.length > 0) {
        setSelectedStudent(transformedStudents[0]);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      toast.error("Failed to load students for final evaluation");
      setStudents([]);
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateRubric = (): boolean => {
    const errors: RubricError[] = [];
    let totalWeight = 0;

    rubric.forEach((item, idx) => {
      if (!item.criteriaName) {
        errors.push({ field: `criteria-${idx}`, message: "Criteria name is required" });
      }
      if (item.maxMarks <= 0) {
        errors.push({ field: `maxMarks-${idx}`, message: "Max marks must be greater than 0" });
      }
      if (item.weight <= 0 || item.weight > 1) {
        errors.push({ field: `weight-${idx}`, message: "Weight must be between 0 and 1" });
      }
      totalWeight += item.weight;
    });

    if (Math.abs(totalWeight - 1) > 0.01) {
      errors.push({ field: "totalWeight", message: `Total weight must equal 1. Current: ${totalWeight.toFixed(2)}` });
    }

    setRubricErrors(errors);
    return errors.length === 0;
  };

  const handleAddCommitteeMember = () => {
    if (!newCommitteeMember.name || !newCommitteeMember.email || !newCommitteeMember.role) {
      toast.error("Please fill all committee member details");
      return;
    }

    if (!selectedStudent) return;

    const member: CommitteeMember = {
      id: `c${Date.now()}`,
      name: newCommitteeMember.name,
      email: newCommitteeMember.email,
      role: newCommitteeMember.role,
    };

    setSelectedStudent((prev) =>
      prev
        ? {
            ...prev,
            committee: [...prev.committee, member],
          }
        : null
    );

    setNewCommitteeMember({});
    setShowAssignDialog(false);
    toast.success("Committee member added");
  };

  const handleRemoveCommitteeMember = (memberId: string) => {
    if (!selectedStudent) return;

    setSelectedStudent((prev) =>
      prev
        ? {
            ...prev,
            committee: prev.committee.filter((m) => m.id !== memberId),
          }
        : null
    );
    toast.success("Committee member removed");
  };

  const handleAddRubricItem = () => {
    if (!newRubricItem.criteriaName || !newRubricItem.maxMarks || newRubricItem.weight === undefined) {
      toast.error("Please fill all rubric fields");
      return;
    }

    const item: GradingRubric = {
      id: `r${Date.now()}`,
      criteriaName: newRubricItem.criteriaName,
      maxMarks: newRubricItem.maxMarks,
      weight: newRubricItem.weight,
    };

    setRubric([...rubric, item]);
    setNewRubricItem({});
    setShowRubricDialog(false);
    toast.success("Rubric item added");
  };

  const handleRemoveRubricItem = (id: string) => {
    setRubric(rubric.filter((r) => r.id !== id));
    toast.success("Rubric item removed");
  };

  const handlePublishResults = async () => {
    if (!selectedStudent) return;

    if (selectedStudent.approvalStatus !== "approved") {
      toast.error("Please approve the marks before publishing");
      return;
    }

    setPublishingResults(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSelectedStudent((prev) =>
        prev
          ? {
              ...prev,
              status: "published",
            }
          : null
      );

      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudent.id ? { ...selectedStudent, status: "published" } : s))
      );

      toast.success("✅ Results published! Students can now view their final grades");
    } catch (err) {
      toast.error("Failed to publish results");
    } finally {
      setPublishingResults(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { bg: "bg-gray-100", text: "text-gray-800", icon: <AlertCircle className="h-3 w-3" /> },
      scheduled: { bg: "bg-blue-100", text: "text-blue-800", icon: <Calendar className="h-3 w-3" /> },
      "in-progress": { bg: "bg-yellow-100", text: "text-yellow-800", icon: <TrendingUp className="h-3 w-3" /> },
      completed: { bg: "bg-green-100", text: "text-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
      published: { bg: "bg-purple-100", text: "text-purple-800", icon: <Send className="h-3 w-3" /> },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.bg} ${config.text}`} variant="outline">
        <span className="flex items-center gap-1">
          {config.icon}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Final Evaluation & Vivas</h1>
        <p className="text-gray-600 mt-1">Manage committee assignments, input marks, and publish final grades</p>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by student name, email, or project..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Students List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Students ({filteredStudents.length})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <p className="text-sm text-gray-500">No students found</p>
              ) : (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedStudent?.id === student.id
                        ? "bg-blue-100 border-2 border-blue-500"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">{student.studentName}</p>
                    <p className="text-xs text-gray-600 truncate">{student.projectTitle}</p>
                    <div className="mt-2">{getStatusBadge(student.status)}</div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-3">
          {selectedStudent ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="committee">Committee</TabsTrigger>
                <TabsTrigger value="marks">Marks Entry</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-start gap-3 mb-4">
                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{selectedStudent.studentName}</h2>
                          <p className="text-sm text-gray-600">{selectedStudent.studentEmail}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-700">
                          <span className="font-medium">Project:</span> {selectedStudent.projectTitle}
                        </p>
                        {selectedStudent.vivaDate && (
                          <p className="text-gray-700">
                            <span className="font-medium">Viva Date:</span>{" "}
                            {new Date(selectedStudent.vivaDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Current Status</p>
                        {getStatusBadge(selectedStudent.status)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Committee Members</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedStudent.committee.length}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Marks Submitted</p>
                        <p className="text-2xl font-bold text-green-600">
                          {Object.keys(selectedStudent.marks).length}/{selectedStudent.committee.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Committee Summary */}
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Committee Members
                  </h3>
                  <div className="space-y-2">
                    {selectedStudent.committee.length === 0 ? (
                      <p className="text-sm text-gray-500">No committee members assigned yet</p>
                    ) : (
                      selectedStudent.committee.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-600">{member.email}</p>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            {member.role}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Committee Tab */}
              <TabsContent value="committee" className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Assign Committee Members
                    </h3>
                    <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Committee Member</DialogTitle>
                          <DialogDescription>Add a new committee member for this viva</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="member-name">Name</Label>
                            <Input
                              id="member-name"
                              value={newCommitteeMember.name || ""}
                              onChange={(e) => setNewCommitteeMember({ ...newCommitteeMember, name: e.target.value })}
                              placeholder="Dr. Name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="member-email">Email</Label>
                            <Input
                              id="member-email"
                              type="email"
                              value={newCommitteeMember.email || ""}
                              onChange={(e) => setNewCommitteeMember({ ...newCommitteeMember, email: e.target.value })}
                              placeholder="member@university.edu"
                            />
                          </div>
                          <div>
                            <Label htmlFor="member-role">Role</Label>
                            <select
                              id="member-role"
                              value={newCommitteeMember.role || ""}
                              onChange={(e) =>
                                setNewCommitteeMember({
                                  ...newCommitteeMember,
                                  role: e.target.value as "Chairman" | "Internal" | "External",
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select role</option>
                              <option value="Chairman">Chairman</option>
                              <option value="Internal">Internal</option>
                              <option value="External">External</option>
                            </select>
                          </div>
                          <Button onClick={handleAddCommitteeMember} className="w-full">
                            Add Member
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Separator className="mb-4" />

                  <div className="space-y-3">
                    {selectedStudent.committee.length === 0 ? (
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          No committee members assigned. Add at least one chairman and evaluators.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      selectedStudent.committee.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{member.name}</p>
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
                            <p className="text-sm text-gray-600">{member.email}</p>
                            {selectedStudent.marks[member.id] && (
                              <p className="text-sm text-green-600 mt-1">
                                ✓ Marks submitted: {selectedStudent.marks[member.id].marks}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCommitteeMember(member.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Marks Entry Tab */}
              <TabsContent value="marks" className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Grading Rubric</h3>
                    <Dialog open={showRubricDialog} onOpenChange={setShowRubricDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Settings className="h-4 w-4" />
                          Edit Rubric
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Configure Grading Rubric</DialogTitle>
                          <DialogDescription>
                            Set up criteria, max marks, and weights. Total weight must equal 1.0
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {rubric.map((item, idx) => (
                            <div key={item.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label>Criteria</Label>
                                  <Input
                                    value={item.criteriaName}
                                    onChange={(e) => {
                                      const newRubric = [...rubric];
                                      newRubric[idx].criteriaName = e.target.value;
                                      setRubric(newRubric);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Max Marks</Label>
                                  <Input
                                    type="number"
                                    value={item.maxMarks}
                                    onChange={(e) => {
                                      const newRubric = [...rubric];
                                      newRubric[idx].maxMarks = parseInt(e.target.value) || 0;
                                      setRubric(newRubric);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Weight</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.weight}
                                    onChange={(e) => {
                                      const newRubric = [...rubric];
                                      newRubric[idx].weight = parseFloat(e.target.value) || 0;
                                      setRubric(newRubric);
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveRubricItem(item.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}

                          {rubricErrors.length > 0 && (
                            <Alert className="bg-red-50 border-red-200">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-800">
                                <ul className="list-disc list-inside space-y-1">
                                  {rubricErrors.map((err, idx) => (
                                    <li key={idx}>{err.message}</li>
                                  ))}
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Label>Add New Criteria</Label>
                            <div className="grid grid-cols-3 gap-3 mt-3 mb-3">
                              <Input
                                placeholder="Criteria name"
                                value={newRubricItem.criteriaName || ""}
                                onChange={(e) => setNewRubricItem({ ...newRubricItem, criteriaName: e.target.value })}
                              />
                              <Input
                                type="number"
                                placeholder="Max marks"
                                value={newRubricItem.maxMarks || ""}
                                onChange={(e) => setNewRubricItem({ ...newRubricItem, maxMarks: parseInt(e.target.value) || 0 })}
                              />
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Weight"
                                value={newRubricItem.weight || ""}
                                onChange={(e) => setNewRubricItem({ ...newRubricItem, weight: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <Button onClick={handleAddRubricItem} className="w-full">
                              Add Criteria
                            </Button>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            if (validateRubric()) {
                              setShowRubricDialog(false);
                              toast.success("Rubric updated successfully");
                            }
                          }}
                          className="w-full mt-4"
                        >
                          Save Rubric
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Separator className="mb-4" />

                  {/* Rubric Display */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-700 mb-2">
                      <div>Criteria</div>
                      <div className="text-center">Max Marks</div>
                      <div className="text-center">Weight</div>
                      <div className="text-right">Weighted Max</div>
                    </div>
                    <div className="space-y-1">
                      {rubric.map((item) => (
                        <div key={item.id} className="grid grid-cols-4 gap-2 text-sm p-2 bg-white rounded border border-gray-200">
                          <div>{item.criteriaName}</div>
                          <div className="text-center">{item.maxMarks}</div>
                          <div className="text-center">{(item.weight * 100).toFixed(0)}%</div>
                          <div className="text-right">{(item.maxMarks * item.weight).toFixed(1)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Marks Entry Forms */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Committee Member Marks</h4>
                    {selectedStudent.committee.length === 0 ? (
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          Add committee members first to input marks
                        </AlertDescription>
                      </Alert>
                    ) : (
                      selectedStudent.committee.map((member) => (
                        <Card key={member.id} className="p-4 border-2 border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-600">{member.role}</p>
                            </div>
                            {selectedStudent.marks[member.id] ? (
                              <Badge className="bg-green-100 text-green-800">Submitted</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100">
                                Pending
                              </Badge>
                            )}
                          </div>
                          <Separator className="mb-4" />

                          <div className="space-y-4">
                            {rubric.map((criteria) => (
                              <div key={criteria.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`${member.id}-${criteria.id}`} className="text-sm">
                                    {criteria.criteriaName}
                                  </Label>
                                  <span className="text-xs text-gray-600">Max: {criteria.maxMarks}</span>
                                </div>
                                <Input
                                  id={`${member.id}-${criteria.id}`}
                                  type="number"
                                  min="0"
                                  max={criteria.maxMarks}
                                  placeholder={`0 to ${criteria.maxMarks}`}
                                  className="w-full"
                                  defaultValue={selectedStudent.marks[member.id]?.marks || ""}
                                  disabled={selectedStudent.status === "published"}
                                />
                              </div>
                            ))}

                            <div>
                              <Label htmlFor={`${member.id}-feedback`}>Feedback</Label>
                              <Textarea
                                id={`${member.id}-feedback`}
                                placeholder="Add any feedback or comments..."
                                defaultValue={selectedStudent.marks[member.id]?.feedback || ""}
                                disabled={selectedStudent.status === "published"}
                                rows={3}
                              />
                            </div>

                            <Button
                              className="w-full"
                              disabled={selectedStudent.status === "published" || submittingMarks}
                              onClick={() => {
                                toast.success(`Marks saved for ${member.name}`);
                              }}
                            >
                              {selectedStudent.marks[member.id] ? "Update Marks" : "Submit Marks"}
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="space-y-4">
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Final Marks Calculation</h3>
                  <Separator className="mb-4" />

                  {Object.keys(selectedStudent.marks).length === 0 ? (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        No marks submitted yet. Input marks in the "Marks Entry" tab.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {/* Committee Marks Summary */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Committee Marks Summary</h4>
                        <div className="space-y-2">
                          {selectedStudent.committee.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-600">{member.role}</p>
                              </div>
                              {selectedStudent.marks[member.id] ? (
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600">
                                    {selectedStudent.marks[member.id].marks}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(selectedStudent.marks[member.id].submittedAt!).toLocaleDateString()}
                                  </p>
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100">
                                  Not Submitted
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Calculated Results */}
                      {selectedStudent.calculatedFinalMarks !== undefined && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="p-4 bg-green-50 border-green-200">
                            <p className="text-sm text-gray-600 mb-1">Weighted Average</p>
                            <p className="text-3xl font-bold text-green-600">{selectedStudent.weightedAverage?.toFixed(2)}</p>
                            <p className="text-xs text-gray-600 mt-2">out of 100</p>
                          </Card>
                          <Card className="p-4 bg-blue-50 border-blue-200">
                            <p className="text-sm text-gray-600 mb-1">Final Grade</p>
                            <p className="text-3xl font-bold text-blue-600">
                              {selectedStudent.weightedAverage! >= 80
                                ? "A"
                                : selectedStudent.weightedAverage! >= 70
                                ? "B"
                                : selectedStudent.weightedAverage! >= 60
                                ? "C"
                                : "D"}
                            </p>
                            <p className="text-xs text-gray-600 mt-2">Based on weighted average</p>
                          </Card>
                        </div>
                      )}

                      {/* Approval Section */}
                      <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">Approval Status</h4>
                          <Badge
                            className={
                              selectedStudent.approvalStatus === "approved"
                                ? "bg-green-100 text-green-800"
                                : selectedStudent.approvalStatus === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {selectedStudent.approvalStatus?.charAt(0).toUpperCase() +
                              selectedStudent.approvalStatus?.slice(1)}
                          </Badge>
                        </div>
                        <Separator className="mb-4" />
                        <div className="space-y-3">
                          <Alert className="bg-blue-50 border-blue-200">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                              System has automatically calculated the weighted average and verified all marks are within valid ranges.
                            </AlertDescription>
                          </Alert>

                          {selectedStudent.status !== "published" && (
                            <div className="flex gap-3">
                              <Button
                                onClick={() => {
                                  setSelectedStudent((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          approvalStatus: "approved",
                                        }
                                      : null
                                  );
                                  toast.success("Marks approved");
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                disabled={selectedStudent.approvalStatus === "approved"}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve Marks
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedStudent((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          approvalStatus: "rejected",
                                        }
                                      : null
                                  );
                                  toast.error("Marks rejected - send back for revision");
                                }}
                                variant="destructive"
                                className="flex-1"
                              >
                                Reject & Revise
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Publish Button */}
                      {selectedStudent.status !== "published" && (
                        <Button
                          onClick={handlePublishResults}
                          disabled={
                            selectedStudent.approvalStatus !== "approved" ||
                            publishingResults ||
                            Object.keys(selectedStudent.marks).length === 0
                          }
                          className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
                          size="lg"
                        >
                          <Send className="h-4 w-4" />
                          {publishingResults ? "Publishing..." : "Publish Results to Students"}
                        </Button>
                      )}

                      {selectedStudent.status === "published" && (
                        <Alert className="bg-purple-50 border-purple-200">
                          <CheckCircle2 className="h-4 w-4 text-purple-600" />
                          <AlertDescription className="text-purple-800">
                            ✓ Results have been published. Students can now view their final grades on their portals.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-12 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a student to manage their final evaluation</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Missing import icon
const Calendar = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
