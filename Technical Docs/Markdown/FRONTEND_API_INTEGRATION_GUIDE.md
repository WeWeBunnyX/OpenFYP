# Frontend Integration Guide - API Endpoints

## Quick Reference for Frontend Components

### CoordinatorFinalEvalViva.tsx

#### 1. Load Students List (on mount)
```typescript
const response = await fetch('/api/final-evaluation/coordinator/students');
const students = await response.json();
```

#### 2. Get Full Evaluation Details (when selecting student)
```typescript
const response = await fetch(`/api/final-evaluation/${studentId}`);
const evaluation = await response.json();
```

#### 3. Add Committee Member
```typescript
const response = await fetch(
  `/api/final-evaluation/${studentId}/committee/add`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Dr. Ahmed Khan",
      email: "dr.ahmed@uni.edu",
      role: "Chairman"
    })
  }
);
```

#### 4. Remove Committee Member
```typescript
const response = await fetch(
  `/api/final-evaluation/${studentId}/committee/${memberId}`,
  { method: 'DELETE' }
);
```

#### 5. Add Rubric Item
```typescript
const response = await fetch(
  `/api/final-evaluation/${studentId}/rubric/add`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      criteriaName: "Technical Knowledge",
      maxMarks: 25,
      weight: 0.25
    })
  }
);
```

#### 6. Remove Rubric Item
```typescript
const response = await fetch(
  `/api/final-evaluation/${studentId}/rubric/${rubricId}`,
  { method: 'DELETE' }
);
```

#### 7. Submit Marks for Committee Member
```typescript
const response = await fetch(
  `/api/final-evaluation/${studentId}/committee/${memberId}/marks`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      marks: 85,
      feedback: "Excellent technical knowledge"
    })
  }
);
// Response includes auto-calculated:
// - weighted_average
// - final_grade
// - status (will be "completed" when all members submit)
```

#### 8. Approve Evaluation
```typescript
const userEmail = "coordinator@uni.edu"; // Get from auth context
const response = await fetch(
  `/api/final-evaluation/${studentId}/approve?coordinator_email=${userEmail}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      approval_feedback: "Marks approved and ready for publication"
    })
  }
);
// approval_status will be "approved"
```

#### 9. Publish Results
```typescript
const userEmail = "coordinator@uni.edu"; // Get from auth context
const response = await fetch(
  `/api/final-evaluation/${studentId}/publish?coordinator_email=${userEmail}`,
  { method: 'POST' }
);
// status will be "published"
// students can now see results
```

#### 10. Update Viva Schedule
```typescript
const response = await fetch(
  `/api/final-evaluation/${studentId}/update-viva-schedule`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      viva_date: "2025-12-15T10:00:00",
      viva_location: "Room 101"
    })
  }
);
```

---

### SupervisorFinalEvalViva.tsx

#### 1. Get Supervised Students' Evaluations (on mount)
```typescript
const supervisorEmail = "supervisor@uni.edu"; // Get from auth context
const response = await fetch(
  `/api/final-evaluation/supervisor/${supervisorEmail}`
);
const students = await response.json();
// Returns array with:
// - id, student_email, student_name, project_title
// - status, viva_date, committee_count
// - weighted_average, final_grade
// - approval_status, published_at
```

#### 2. Get Details of Selected Student
```typescript
const response = await fetch(`/api/final-evaluation/${studentId}`);
const evaluation = await response.json();
// Use full evaluation object for details panel
```

---

### StudentFinalEvalViva.tsx

#### 1. Get Own Final Evaluation (on mount)
```typescript
const studentEmail = "student@uni.edu"; // Get from auth context
const response = await fetch(
  `/api/final-evaluation/student/${studentEmail}`
);
const evaluation = await response.json();

// If status !== "published":
// {
//   id, student_email, student_name, project_title, status, viva_date,
//   message: "Final evaluation results are not yet available"
// }

// If status === "published":
// {
//   id, student_email, student_name, project_title, status, viva_date,
//   viva_location, committee_members, committee_marks,
//   weighted_average, final_grade, published_at, created_at
// }
```

---

## Implementation Example (React Hooks)

### Coordinator Component Template
```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function CoordinatorFinalEvalViva() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/final-evaluation/coordinator/students');
      const data = await response.json();
      setStudents(data);
      if (data.length > 0) {
        const fullData = await fetchEvaluation(data[0].id);
        setSelectedStudent(fullData);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluation = async (id) => {
    const response = await fetch(`/api/final-evaluation/${id}`);
    return response.json();
  };

  const addCommitteeMember = async (finalEvalId, member) => {
    try {
      const response = await fetch(
        `/api/final-evaluation/${finalEvalId}/committee/add`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(member)
        }
      );
      const data = await response.json();
      if (data.success) {
        // Update selectedStudent with new committee_members
        setSelectedStudent({
          ...selectedStudent,
          committee_members: data.committee_members
        });
        toast.success('Committee member added');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add committee member');
    }
  };

  const submitMarks = async (finalEvalId, memberId, marks) => {
    try {
      const response = await fetch(
        `/api/final-evaluation/${finalEvalId}/committee/${memberId}/marks`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(marks)
        }
      );
      const data = await response.json();
      if (data.success) {
        // Update selectedStudent with calculated results
        setSelectedStudent({
          ...selectedStudent,
          committee_marks: data.committee_marks,
          weighted_average: data.weighted_average,
          final_grade: data.final_grade,
          status: data.status
        });
        toast.success('Marks submitted successfully');
      }
    } catch (error) {
      console.error('Error submitting marks:', error);
      toast.error('Failed to submit marks');
    }
  };

  const approveEvaluation = async (finalEvalId) => {
    try {
      const response = await fetch(
        `/api/final-evaluation/${finalEvalId}/approve?coordinator_email=${user.email}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approval_feedback: '' })
        }
      );
      const data = await response.json();
      if (data.success) {
        setSelectedStudent({
          ...selectedStudent,
          approval_status: 'approved',
          approved_at: data.approved_at
        });
        toast.success('Evaluation approved');
      }
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve evaluation');
    }
  };

  const publishResults = async (finalEvalId) => {
    try {
      const response = await fetch(
        `/api/final-evaluation/${finalEvalId}/publish?coordinator_email=${user.email}`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (data.success) {
        setSelectedStudent({
          ...selectedStudent,
          status: 'published',
          published_at: data.published_at
        });
        toast.success('Results published successfully');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Failed to publish results');
    }
  };

  // ... rest of component with UI rendering
}
```

### Supervisor Component Template
```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function SupervisorFinalEvalViva() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(
        `/api/final-evaluation/supervisor/${user.email}`
      );
      const data = await response.json();
      setStudents(data);
      if (data.length > 0) {
        // Get full details for first student
        const details = await fetchEvaluation(data[0].id);
        setSelectedStudent(details);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluation = async (id) => {
    const response = await fetch(`/api/final-evaluation/${id}`);
    return response.json();
  };

  const handleSelectStudent = async (student) => {
    const details = await fetchEvaluation(student.id);
    setSelectedStudent(details);
  };

  // ... rest of component with UI rendering
}
```

### Student Component Template
```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentFinalEvalViva() {
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvaluation();
  }, []);

  const fetchEvaluation = async () => {
    try {
      const response = await fetch(
        `/api/final-evaluation/student/${user.email}`
      );
      const data = await response.json();
      setEvaluation(data);
    } catch (error) {
      console.error('Error fetching evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchEvaluation();
  };

  // ... rest of component with UI rendering
}
```

---

## Error Handling

All endpoints return standard HTTP responses:

```typescript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Request failed');
  }
  
  return await response.json();
} catch (error) {
  console.error('API Error:', error);
  toast.error(error.message);
}
```

### Common Status Codes:
- `200 OK` - Success
- `400 Bad Request` - Invalid input (marks, weights, etc.)
- `404 Not Found` - Record not found
- `500 Internal Server Error` - Server error

---

## Response Formats

### Successful Response:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

### Error Response:
```json
{
  "detail": "Error message explaining what went wrong"
}
```

---

## Important Notes

1. **Coordinator Email**: Pass via query parameter in approve/publish endpoints
2. **Supervisor Email**: Use from auth context to fetch supervised students
3. **Student Email**: Use from auth context to fetch own evaluation
4. **Auto-Calculation**: Triggered automatically when all committee members submit marks
5. **Publication Gate**: Can only publish if `approval_status == "approved"`
6. **Student Access**: Students see detailed marks only if `status == "published"`

---

## Testing Checklist

- [ ] Coordinator can fetch all students
- [ ] Can add/remove committee members
- [ ] Can add/remove rubric items
- [ ] Weight validation works (must sum to 1.0)
- [ ] Can submit marks per committee member
- [ ] Weighted average auto-calculates correctly
- [ ] Can approve evaluation
- [ ] Can publish results
- [ ] Supervisor sees only supervised students
- [ ] Student sees results only if published
- [ ] All timestamps are recorded correctly
