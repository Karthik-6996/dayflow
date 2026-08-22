// src/mocks/leaveRequests.js
// Matches TABLES.leave_requests schema: id, user_id, type, start_date, end_date, remarks, status, comments

export const mockLeaveRequests = [
  {
    id: "leave-req-001",
    user_id: "usr-001-emp",
    type: "paid",
    start_date: "2026-08-28",
    end_date: "2026-08-29",
    remarks: "Annual family getaway trip",
    status: "pending",
    comments: null
  },
  {
    id: "leave-req-002",
    user_id: "usr-001-emp",
    type: "sick",
    start_date: "2026-08-14",
    end_date: "2026-08-14",
    remarks: "Severe flu and fever, medical rest prescribed",
    status: "approved",
    comments: "Approved. Take care and get well soon!"
  },
  {
    id: "leave-req-003",
    user_id: "usr-001-emp",
    type: "paid",
    start_date: "2026-07-10",
    end_date: "2026-07-12",
    remarks: "Personal commitments and travel",
    status: "approved",
    comments: "Approved by HR operations."
  },
  {
    id: "leave-req-004",
    user_id: "usr-001-emp",
    type: "unpaid",
    start_date: "2026-06-01",
    end_date: "2026-06-05",
    remarks: "Extended sabbatical for personal certification course",
    status: "rejected",
    comments: "Overlaps with Q2 design sprint delivery deadlines. Please reschedule."
  },
  {
    id: "leave-req-005",
    user_id: "usr-003-emp",
    type: "paid",
    start_date: "2026-09-02",
    end_date: "2026-09-04",
    remarks: "Attending JSConf Global conference",
    status: "pending",
    comments: null
  },
  {
    id: "leave-req-006",
    user_id: "usr-004-emp",
    type: "sick",
    start_date: "2026-08-22",
    end_date: "2026-08-22",
    remarks: "Migraine recovery",
    status: "approved",
    comments: "Approved. Rest up."
  },
  {
    id: "leave-req-007",
    user_id: "usr-005-emp",
    type: "paid",
    start_date: "2026-08-30",
    end_date: "2026-09-01",
    remarks: "Moving to a new apartment",
    status: "pending",
    comments: null
  }
];
