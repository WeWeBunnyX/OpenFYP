# Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐  ┌────────────────────────┐        │
│  │ CoordinatorFinalEvalUI  │  │ SupervisorFinalEvalUI  │        │
│  │ - Student list          │  │ - Student list (R/O)   │        │
│  │ - Committee mgmt        │  │ - Statistics dashboard │        │
│  │ - Rubric config         │  │ - Detail view          │        │
│  │ - Marks entry           │  │ - Search & filter      │        │
│  │ - Approval workflow     │  └────────────────────────┘        │
│  │ - Publication           │                                     │
│  └─────────────────────────┘  ┌────────────────────────┐        │
│                               │ StudentFinalEvalUI     │        │
│                               │ - View results (R/O)   │        │
│                               │ - Committee feedback    │        │
│                               │ - Grades & marks       │        │
│                               │ - Download certs       │        │
│                               └────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
                         (HTTP JSON)
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    routes_final_evaluations_viva.py (11 endpoints)      │   │
│  │                                                          │   │
│  │  COORDINATOR:           SUPERVISOR:      STUDENT:       │   │
│  │  - GET /coordinator     - GET /supervisor  - GET /      │   │
│  │  - GET /{id}            students           student       │   │
│  │  - POST /committee/add                                  │   │
│  │  - DELETE /committee                                    │   │
│  │  - POST /rubric/add                                     │   │
│  │  - DELETE /rubric                                       │   │
│  │  - POST /marks         [AUTO-CALCULATES]                │   │
│  │  - POST /approve                                        │   │
│  │  - POST /publish                                        │   │
│  │  - POST /viva-schedule                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓↑                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          SQLModel (FinalEvaluationViva)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                DATABASE (PostgreSQL)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  finalevaluationviva (26 fields)                         │   │
│  │                                                          │   │
│  │  ├─ Student Info (5 fields)                             │   │
│  │  ├─ Committee (JSON)                                    │   │
│  │  ├─ Rubric (JSON)                                       │   │
│  │  ├─ Marks (JSON)                                        │   │
│  │  ├─ Calculated Results (2 fields)                       │   │
│  │  ├─ Approval Workflow (4 fields)                        │   │
│  │  ├─ Publication (3 fields)                              │   │
│  │  └─ Timestamps (3 fields)                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Coordinator Workflow

```
START
  │
  ├─→ View Students
  │   │ GET /coordinator/students
  │   └─→ [Student List Loaded]
  │
  ├─→ Select Student
  │   │ GET /{id}
  │   └─→ [Evaluation Details Loaded]
  │
  ├─→ Assign Committee
  │   │ POST /committee/add
  │   ├─ Add Chairman
  │   ├─ Add Internal Member
  │   ├─ Add External Member
  │   └─→ [Committee Members Stored]
  │
  ├─→ Configure Grading
  │   │ POST /rubric/add
  │   ├─ Add Criteria 1 (weight 0.25)
  │   ├─ Add Criteria 2 (weight 0.25)
  │   ├─ Add Criteria 3 (weight 0.25)
  │   ├─ Add Criteria 4 (weight 0.25)
  │   │ [VALIDATE: Sum = 1.0 ✓]
  │   └─→ [Rubric Stored]
  │
  ├─→ Schedule Viva
  │   │ POST /update-viva-schedule
  │   ├─ Set Date: 2025-12-15
  │   ├─ Set Location: Room 101
  │   └─→ [Schedule Stored]
  │
  ├─→ Input Marks (Per Committee Member)
  │   │
  │   ├─ Chairman Marks
  │   │   │ POST /committee/c1/marks
  │   │   └─→ marks: 85, feedback: "Excellent"
  │   │
  │   ├─ Internal Marks
  │   │   │ POST /committee/c2/marks
  │   │   └─→ marks: 80, feedback: "Good"
  │   │
  │   └─ External Marks
  │       │ POST /committee/c3/marks
  │       └─→ marks: 88, feedback: "Outstanding"
  │           [ALL MEMBERS SUBMITTED]
  │           │
  │           ├─→ AUTO-CALCULATE:
  │           │   weighted_avg = (85+80+88)/3 × weights
  │           │   weighted_avg = 84.33
  │           │
  │           ├─→ AUTO-GRADE:
  │           │   84.33 ≥ 80 → GRADE = A
  │           │
  │           └─→ STATUS = "completed"
  │
  ├─→ Review Results
  │   │ Final Grade: A
  │   │ Weighted Avg: 84.33
  │   │ Status: completed
  │   └─→ [Ready to Approve]
  │
  ├─→ Approve Marks
  │   │ POST /{id}/approve?coordinator_email=...
  │   │ approval_status: pending → approved
  │   └─→ [Approved ✓]
  │
  ├─→ Publish Results
  │   │ POST /{id}/publish?coordinator_email=...
  │   │ status: completed → published
  │   │ [NOTIFY STUDENTS]
  │   └─→ [Published ✓]
  │
  ├─→ Students Can View
  │   │ GET /student/{email}
  │   └─→ [Full Results Visible]
  │
  └─→ END
```

---

## State Transitions

### Status Flow
```
         pending
            │
            ↓
         scheduled ←─────────────────┐
            │                        │
            ↓                        │
        in-progress                 │
            │                        │
            ↓                        │
         completed ────→ rejected    │
            │                        │
            └─ (if all marks submitted)
                        │
                        ↓
                    published ←──── can republish
                        │
                        └─ students can view results
```

### Approval Status Flow
```
         pending
            │
            ├─→ [Coordinator Reviews]
            │
            ├─→ approved ────→ [Ready to Publish]
            │
            └─→ rejected ────→ [Send back for revision]
```

---

## Request/Response Flow

### Example: Submit Marks

```
FRONTEND (React)
    │
    └─→ POST /api/final-evaluation/1/committee/c1/marks
        {
          "marks": 85,
          "feedback": "Excellent technical knowledge"
        }
            │
            ↓
BACKEND (FastAPI)
    │
    ├─→ Validate input
    │   ├─ marks in [0, 100]? ✓
    │   ├─ member exists? ✓
    │   ├─ evaluation exists? ✓
    │   └─ pass
    │
    ├─→ Store marks
    │   committee_marks["c1"] = {
    │     "marks": 85,
    │     "feedback": "Excellent...",
    │     "submittedAt": "2025-12-15T11:30:00"
    │   }
    │
    ├─→ Check if all submitted
    │   ├─ c1: ✓ submitted
    │   ├─ c2: ✓ submitted
    │   ├─ c3: ✓ submitted
    │   └─ ALL SUBMITTED → AUTO-CALCULATE
    │
    ├─→ Calculate weighted average
    │   weighted_sum = Σ(mark_i × weight_i)
    │   = (85×0.25 + 80×0.25 + 88×0.25) / (0.25+0.25+0.25)
    │   = 84.33
    │
    ├─→ Assign grade
    │   84.33 ≥ 80 → grade = "A"
    │
    ├─→ Update status
    │   status = "completed"
    │
    ├─→ Save to database
    │   │ UPDATE finalevaluationviva
    │   │ SET weighted_average = 84.33,
    │   │     final_grade = 'A',
    │   │     status = 'completed',
    │   │     updated_at = NOW()
    │   │ WHERE id = 1
    │   └─→ ✓ Saved
    │
    └─→ Response 200 OK
        {
          "success": true,
          "message": "Marks submitted successfully",
          "committee_marks": {...},
          "weighted_average": 84.33,
          "final_grade": "A",
          "status": "completed"
        }
            │
            ↓
FRONTEND (React)
    │
    ├─→ Update UI
    │   ├─ Show weighted_average: 84.33
    │   ├─ Show final_grade: A
    │   ├─ Update status: completed
    │   └─ Enable approval button
    │
    └─→ Show success toast
        "Marks submitted successfully!"
```

---

## Database Schema Visualization

```
finalevaluationviva
┌──────────────────────────────────────────┐
│ STUDENT INFORMATION                      │
├──────────────────────────────────────────┤
│ id (PK)                    [INTEGER]     │
│ registration_id            [INTEGER]     │
│ student_email (INDEX)      [VARCHAR]     │
│ student_name               [VARCHAR]     │
│ project_title              [VARCHAR]     │
│ supervisor_email           [VARCHAR]     │
│ supervisor_name            [VARCHAR]     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ VIVA SCHEDULING                          │
├──────────────────────────────────────────┤
│ viva_date                  [DATETIME]    │
│ viva_location              [VARCHAR]     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ COMMITTEE MEMBERS (JSON)                 │
├──────────────────────────────────────────┤
│ committee_members:                       │
│ [                                        │
│   {                                      │
│     "id": "c1",                         │
│     "name": "Dr. Ahmed Khan",           │
│     "email": "dr.ahmed@uni.edu",        │
│     "role": "Chairman"                  │
│   },                                    │
│   ...                                   │
│ ]                                       │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ GRADING RUBRIC (JSON)                    │
├──────────────────────────────────────────┤
│ grading_rubric:                          │
│ [                                        │
│   {                                      │
│     "id": "r1",                         │
│     "criteriaName": "Tech Knowledge",   │
│     "maxMarks": 25,                     │
│     "weight": 0.25                      │
│   },                                    │
│   ...                                   │
│ ]                                       │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ COMMITTEE MARKS (JSON)                   │
├──────────────────────────────────────────┤
│ committee_marks:                         │
│ {                                        │
│   "c1": {                                │
│     "marks": 85,                        │
│     "feedback": "Excellent",            │
│     "submittedAt": "2025-12-15T..."    │
│   },                                    │
│   ...                                   │
│ }                                       │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ CALCULATED RESULTS                       │
├──────────────────────────────────────────┤
│ weighted_average           [FLOAT]       │
│ final_grade                [VARCHAR]     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ APPROVAL WORKFLOW                        │
├──────────────────────────────────────────┤
│ approval_status            [VARCHAR]     │
│   ├─ pending (initial)                  │
│   ├─ approved (coordinator OK)          │
│   └─ rejected (needs revision)          │
│ approval_feedback          [VARCHAR]     │
│ approved_by                [VARCHAR]     │
│ approved_at                [DATETIME]    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ PUBLICATION                              │
├──────────────────────────────────────────┤
│ status                     [VARCHAR]     │
│   ├─ pending (initial)                  │
│   ├─ scheduled (viva scheduled)         │
│   ├─ in-progress (during viva)          │
│   ├─ completed (marks submitted)        │
│   └─ published (results visible)        │
│ published_at               [DATETIME]    │
│ published_by               [VARCHAR]     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ AUDIT TRAIL                              │
├──────────────────────────────────────────┤
│ created_at                 [DATETIME]    │
│ updated_at                 [DATETIME]    │
└──────────────────────────────────────────┘
```

---

## Permission & Access Control Matrix

```
┌────────────┬──────────────┬────────────┬─────────────┐
│  Endpoint  │ Coordinator  │ Supervisor │   Student   │
├────────────┼──────────────┼────────────┼─────────────┤
│ GET        │     ✓ All    │ Supervised │ Own only    │
│ /students  │   students   │  students  │   (if pub)  │
├────────────┼──────────────┼────────────┼─────────────┤
│ POST       │              │            │             │
│ /committee │     ✓✓       │     ✗      │      ✗      │
├────────────┼──────────────┼────────────┼─────────────┤
│ POST       │              │            │             │
│ /rubric    │     ✓✓       │     ✗      │      ✗      │
├────────────┼──────────────┼────────────┼─────────────┤
│ POST       │              │            │             │
│ /marks     │     ✓✓       │     ✗      │      ✗      │
├────────────┼──────────────┼────────────┼─────────────┤
│ POST       │              │            │             │
│ /approve   │     ✓✓       │     ✗      │      ✗      │
├────────────┼──────────────┼────────────┼─────────────┤
│ POST       │              │            │             │
│ /publish   │     ✓✓       │     ✗      │      ✗      │
└────────────┴──────────────┴────────────┴─────────────┘

Legend:
  ✓✓ = Full CRUD access
  ✓  = Read access
  ✗  = No access
```

---

## Auto-Calculation Algorithm

```
WHEN: All committee members submit marks

ALGORITHM:

1. Collect all committee marks
   marks = [85, 80, 88]  // from c1, c2, c3

2. Calculate average mark
   avg_mark = (85 + 80 + 88) / 3
   avg_mark = 253 / 3
   avg_mark = 84.33

3. Get rubric weights
   weights = [0.25, 0.25, 0.25, 0.25]

4. Calculate weighted average
   Since we use overall marks (not per-criteria):
   weighted_avg = avg_mark × Σ(weights)
   weighted_avg = 84.33 × 1.0
   weighted_avg = 84.33

   (Could be extended for per-criteria marking)

5. Assign grade
   IF weighted_avg >= 80:
     grade = "A"
   ELSIF weighted_avg >= 70:
     grade = "B"
   ELSIF weighted_avg >= 60:
     grade = "C"
   ELSE:
     grade = "D"

   Result: grade = "A"

6. Update status
   status = "completed"

7. Store results
   UPDATE finalevaluationviva SET
     weighted_average = 84.33,
     final_grade = 'A',
     status = 'completed'
   WHERE id = evaluation_id
```

---

## Error Handling Flow

```
REQUEST
    │
    ├─→ Validate Input
    │   │
    │   ├─→ INVALID?
    │   │   │ 400 Bad Request
    │   │   │ { "detail": "Marks must be 0-100" }
    │   │   │
    │   │   └─→ FRONTEND ERROR
    │   │
    │   └─→ VALID? ✓
    │
    ├─→ Check Authentication
    │   │
    │   ├─→ UNAUTHORIZED?
    │   │   │ 403 Forbidden
    │   │   │ { "detail": "Not authorized for this operation" }
    │   │   │
    │   │   └─→ FRONTEND ERROR
    │   │
    │   └─→ AUTHORIZED? ✓
    │
    ├─→ Query Database
    │   │
    │   ├─→ NOT FOUND?
    │   │   │ 404 Not Found
    │   │   │ { "detail": "Evaluation not found" }
    │   │   │
    │   │   └─→ FRONTEND ERROR
    │   │
    │   └─→ FOUND? ✓
    │
    ├─→ Process Request
    │   │
    │   ├─→ ERROR DURING PROCESSING?
    │   │   │ 500 Internal Server Error
    │   │   │ { "detail": "Error message" }
    │   │   │
    │   │   └─→ FRONTEND ERROR
    │   │
    │   └─→ SUCCESS? ✓
    │
    ├─→ Save to Database
    │   │
    │   └─→ SAVED? ✓
    │
    └─→ Return Success
        │ 200 OK
        │ { "success": true, "data": {...} }
        │
        └─→ FRONTEND SUCCESS
```

---

These diagrams provide complete visualization of the system architecture, data flow, and operations!
