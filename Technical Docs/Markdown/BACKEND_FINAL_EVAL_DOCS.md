# Final Evaluation & Viva Backend Documentation

## Database Model: FinalEvaluationViva

### Table Structure
```sql
CREATE TABLE finalevaluationviva (
    id INTEGER PRIMARY KEY,
    registration_id INTEGER,
    student_email VARCHAR NOT NULL,
    student_name VARCHAR NOT NULL,
    project_title VARCHAR NOT NULL,
    supervisor_email VARCHAR,
    supervisor_name VARCHAR,
    viva_date DATETIME,
    viva_location VARCHAR,
    committee_members JSON,           -- List of committee members
    grading_rubric JSON,              -- Grading criteria with weights
    committee_marks JSON,             -- Committee member marks and feedback
    weighted_average FLOAT,           -- Auto-calculated
    final_grade VARCHAR,              -- A, B, C, D
    approval_status VARCHAR,          -- pending, approved, rejected
    approval_feedback VARCHAR,
    approved_by VARCHAR,
    approved_at DATETIME,
    status VARCHAR,                   -- pending, scheduled, in-progress, completed, published
    published_at DATETIME,
    published_by VARCHAR,
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);
```

### Fields Description

#### Student Information
- `registration_id`: Foreign key to Registration table
- `student_email`: Student's email (indexed for queries)
- `student_name`: Student's full name
- `project_title`: Project title
- `supervisor_email`: Supervisor's email
- `supervisor_name`: Supervisor's name

#### Viva Scheduling
- `viva_date`: Date and time of viva
- `viva_location`: Location of viva

#### Committee (JSON Array)
```json
[
  {
    "id": "c1",
    "name": "Dr. Ahmed Khan",
    "email": "dr.ahmed@uni.edu",
    "role": "Chairman"
  },
  {
    "id": "c2",
    "name": "Dr. Fatima Ali",
    "email": "dr.fatima@uni.edu",
    "role": "Internal"
  },
  {
    "id": "c3",
    "name": "Prof. James Wilson",
    "email": "prof.james@uni.edu",
    "role": "External"
  }
]
```

#### Grading Rubric (JSON Array)
```json
[
  {
    "id": "r1",
    "criteriaName": "Technical Knowledge",
    "maxMarks": 25,
    "weight": 0.25
  },
  {
    "id": "r2",
    "criteriaName": "Project Implementation",
    "maxMarks": 25,
    "weight": 0.25
  },
  {
    "id": "r3",
    "criteriaName": "Presentation Skills",
    "maxMarks": 25,
    "weight": 0.25
  },
  {
    "id": "r4",
    "criteriaName": "Q&A Performance",
    "maxMarks": 25,
    "weight": 0.25
  }
]
```

#### Committee Marks (JSON Object)
```json
{
  "c1": {
    "marks": 85,
    "feedback": "Excellent technical knowledge and implementation",
    "submittedAt": "2025-12-15T11:30:00"
  },
  "c2": {
    "marks": 80,
    "feedback": "Good project design and execution",
    "submittedAt": "2025-12-15T11:45:00"
  },
  "c3": {
    "marks": 88,
    "feedback": "Outstanding presentation and Q&A performance",
    "submittedAt": "2025-12-15T12:00:00"
  }
}
```

#### Calculated Results
- `weighted_average`: Auto-calculated from committee marks and rubric weights
- `final_grade`: A (≥80), B (≥70), C (≥60), D (<60)

#### Approval Workflow
- `approval_status`: pending → approved → rejected
- `approval_feedback`: Coordinator's feedback on approval
- `approved_by`: Email of approving coordinator
- `approved_at`: Timestamp of approval

#### Publication
- `status`: pending → scheduled → in-progress → completed → published
- `published_at`: Timestamp when results are published
- `published_by`: Email of coordinator who published

---

## API Endpoints

### Coordinator Endpoints

#### 1. Get All Students for Final Evaluation
```
GET /api/final-evaluation/coordinator/students
Response:
[
  {
    "id": 1,
    "student_email": "student1@uni.edu",
    "student_name": "Ali Ahmed",
    "project_title": "AI-Based Project Management System",
    "status": "pending",
    "committee_count": 0,
    "approval_status": "pending",
    "weighted_average": null,
    "final_grade": null,
    "viva_date": null,
    "created_at": "2025-12-10T10:00:00"
  }
]
```

#### 2. Get Final Evaluation Details
```
GET /api/final-evaluation/{final_eval_id}
Response:
{
  "id": 1,
  "student_email": "student1@uni.edu",
  "student_name": "Ali Ahmed",
  "project_title": "AI-Based Project Management System",
  "supervisor_email": "prof.supervisor@uni.edu",
  "viva_date": "2025-12-15T10:00:00",
  "viva_location": "Room 101",
  "committee_members": [...],
  "grading_rubric": [...],
  "committee_marks": {...},
  "weighted_average": 84.33,
  "final_grade": "A",
  "status": "completed",
  "approval_status": "pending",
  "approval_feedback": null,
  "approved_by": null,
  "approved_at": null,
  "published_at": null,
  "published_by": null,
  "created_at": "2025-12-10T10:00:00",
  "updated_at": "2025-12-15T12:00:00"
}
```

#### 3. Add Committee Member
```
POST /api/final-evaluation/{final_eval_id}/committee/add
Request:
{
  "name": "Dr. Ahmed Khan",
  "email": "dr.ahmed@uni.edu",
  "role": "Chairman"
}
Response:
{
  "success": true,
  "message": "Committee member added successfully",
  "committee_members": [...]
}
```

#### 4. Remove Committee Member
```
DELETE /api/final-evaluation/{final_eval_id}/committee/{member_id}
Response:
{
  "success": true,
  "message": "Committee member removed successfully",
  "committee_members": [...]
}
```

#### 5. Add Rubric Item
```
POST /api/final-evaluation/{final_eval_id}/rubric/add
Request:
{
  "criteriaName": "Technical Knowledge",
  "maxMarks": 25,
  "weight": 0.25
}
Response:
{
  "success": true,
  "message": "Rubric item added successfully",
  "grading_rubric": [...]
}
```
**Note:** Total weights must sum to 1.0

#### 6. Remove Rubric Item
```
DELETE /api/final-evaluation/{final_eval_id}/rubric/{rubric_id}
Response:
{
  "success": true,
  "message": "Rubric item removed successfully",
  "grading_rubric": [...]
}
```

#### 7. Submit Committee Member Marks
```
POST /api/final-evaluation/{final_eval_id}/committee/{member_id}/marks
Request:
{
  "marks": 85,
  "feedback": "Excellent technical knowledge and implementation"
}
Response:
{
  "success": true,
  "message": "Marks submitted successfully",
  "committee_marks": {...},
  "weighted_average": 84.33,
  "final_grade": "A",
  "status": "completed"
}
```
**Auto-calculates** weighted_average and final_grade when all members submit

#### 8. Approve Final Evaluation
```
POST /api/final-evaluation/{final_eval_id}/approve?coordinator_email=coord@uni.edu
Request:
{
  "approval_feedback": "Marks approved and ready for publication"
}
Response:
{
  "success": true,
  "message": "Final evaluation approved successfully",
  "approval_status": "approved",
  "approved_at": "2025-12-15T13:00:00"
}
```

#### 9. Publish Final Results
```
POST /api/final-evaluation/{final_eval_id}/publish?coordinator_email=coord@uni.edu
Response:
{
  "success": true,
  "message": "Final results published successfully",
  "status": "published",
  "published_at": "2025-12-15T13:00:00"
}
```

#### 10. Update Viva Schedule
```
POST /api/final-evaluation/{final_eval_id}/update-viva-schedule
Request:
{
  "viva_date": "2025-12-15T10:00:00",
  "viva_location": "Room 101"
}
Response:
{
  "success": true,
  "message": "Viva schedule updated successfully",
  "viva_date": "2025-12-15T10:00:00",
  "viva_location": "Room 101",
  "status": "scheduled"
}
```

---

### Supervisor Endpoints

#### 1. Get All Supervised Students' Final Evaluations
```
GET /api/final-evaluation/supervisor/{supervisor_email}
Response:
[
  {
    "id": 1,
    "student_email": "student1@uni.edu",
    "student_name": "Ali Ahmed",
    "project_title": "AI-Based Project Management System",
    "status": "published",
    "viva_date": "2025-12-15T10:00:00",
    "committee_count": 3,
    "weighted_average": 84.33,
    "final_grade": "A",
    "approval_status": "approved",
    "published_at": "2025-12-15T13:00:00",
    "created_at": "2025-12-10T10:00:00"
  }
]
```

**Read-only endpoint** - Shows only published evaluations or status updates

---

### Student Endpoints

#### 1. Get Own Final Evaluation Results
```
GET /api/final-evaluation/student/{student_email}
Response (if published):
{
  "id": 1,
  "student_email": "student1@uni.edu",
  "student_name": "Ali Ahmed",
  "project_title": "AI-Based Project Management System",
  "status": "published",
  "viva_date": "2025-12-15T10:00:00",
  "viva_location": "Room 101",
  "committee_members": [...],
  "committee_marks": {...},
  "weighted_average": 84.33,
  "final_grade": "A",
  "published_at": "2025-12-15T13:00:00",
  "created_at": "2025-12-10T10:00:00"
}

Response (if not published):
{
  "id": 1,
  "student_email": "student1@uni.edu",
  "student_name": "Ali Ahmed",
  "project_title": "AI-Based Project Management System",
  "status": "in-progress",
  "viva_date": "2025-12-15T10:00:00",
  "message": "Final evaluation results are not yet available"
}
```

**Read-only endpoint** - Returns detailed marks only after publication

---

## Status Flow

```
Status Progression:
pending → scheduled → in-progress → completed → published

Approval Progression:
pending → approved/rejected

Key Points:
- Records start as "pending"
- Move to "scheduled" after viva_date is set
- Move to "in-progress" during viva
- Move to "completed" when all marks are submitted
- Move to "published" after coordinator approval and publication
- Can only publish if approval_status == "approved"
```

---

## Data Validation

### Marks Validation
- Marks must be 0-100
- All committee members must submit before auto-calculation

### Rubric Validation
- Weights must sum to exactly 1.0
- Max marks must be > 0
- Weight must be between 0 and 1
- Cannot add duplicate criteria

### Committee Validation
- Cannot add duplicate committee members (same email)
- Valid roles: "Chairman", "Internal", "External"
- Cannot delete if marks already submitted

---

## Integration with Frontend

### Coordinator UI (CoordinatorFinalEvalViva.tsx)
- Fetches from `/api/final-evaluation/coordinator/students`
- Uses all CRUD endpoints for committee and rubric management
- Submits marks via `/api/final-evaluation/{id}/committee/{member_id}/marks`
- Approves via `/api/final-evaluation/{id}/approve`
- Publishes via `/api/final-evaluation/{id}/publish`

### Supervisor UI (SupervisorFinalEvalViva.tsx)
- Fetches from `/api/final-evaluation/supervisor/{supervisor_email}`
- Read-only view of all supervised students

### Student UI (StudentFinalEvalViva.tsx)
- Fetches from `/api/final-evaluation/student/{student_email}`
- Read-only view of own results (only after publication)

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK`: Successful operation
- `400 Bad Request`: Invalid input (marks, weights, etc.)
- `404 Not Found`: Record not found
- `500 Internal Server Error`: Server error

---

## Database Migration

To create the table in PostgreSQL:
```python
# In your database initialization:
from sqlmodel import SQLModel
from .models import engine

SQLModel.metadata.create_all(engine)
```

The table will be automatically created on application startup.
