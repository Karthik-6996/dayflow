// src/mocks/leaveRequests.js
// Matches TABLES.leave_requests schema: id, user_id, type, start_date, end_date, days, remarks, status, comments, created_at

export const mockLeaveRequests = [
  // User 1 (usr-001-emp - Karthik Girish)
  {
    id: "leave-req-001",
    user_id: "usr-001-emp",
    type: "paid",
    start_date: "2026-08-28",
    end_date: "2026-08-29",
    days: 2,
    remarks: "Family trip and festival celebrations",
    status: "pending",
    comments: null,
    created_at: "2026-08-22T08:30:00.000Z"
  },
  {
    id: "leave-req-002",
    user_id: "usr-001-emp",
    type: "sick",
    start_date: "2026-08-14",
    end_date: "2026-08-14",
    days: 1,
    remarks: "Viral fever and doctor consultation",
    status: "approved",
    comments: "Approved by HR. Get well soon!",
    created_at: "2026-08-13T10:15:00.000Z"
  },
  {
    id: "leave-req-003",
    user_id: "usr-001-emp",
    type: "paid",
    start_date: "2026-07-15",
    end_date: "2026-07-16",
    days: 2,
    remarks: "Personal commitments and bank paperwork",
    status: "approved",
    comments: "Approved by HR Operations.",
    created_at: "2026-07-12T09:00:00.000Z"
  },
  {
    id: "leave-req-004",
    user_id: "usr-001-emp",
    type: "unpaid",
    start_date: "2026-06-01",
    end_date: "2026-06-05",
    days: 5,
    remarks: "Extended sabbatical for personal travel",
    status: "rejected",
    comments: "Overlaps with Q2 client sprint deadlines. Please reschedule.",
    created_at: "2026-05-25T11:00:00.000Z"
  },

  // User 2 (usr-002-adm - System Administrator)
  {
    id: "leave-req-021",
    user_id: "usr-002-adm",
    type: "paid",
    start_date: "2026-09-05",
    end_date: "2026-09-06",
    days: 2,
    remarks: "Attending annual leadership conference",
    status: "pending",
    comments: null,
    created_at: "2026-08-21T10:00:00.000Z"
  },
  {
    id: "leave-req-022",
    user_id: "usr-002-adm",
    type: "sick",
    start_date: "2026-08-08",
    end_date: "2026-08-08",
    days: 1,
    remarks: "Dental appointment and rest",
    status: "approved",
    comments: "Approved by Management",
    created_at: "2026-08-07T08:00:00.000Z"
  },
  {
    id: "leave-req-023",
    user_id: "usr-002-adm",
    type: "unpaid",
    start_date: "2026-05-10",
    end_date: "2026-05-12",
    days: 3,
    remarks: "Personal urgent matter",
    status: "rejected",
    comments: "Quarterly audit review week; cannot approve time off.",
    created_at: "2026-05-02T09:00:00.000Z"
  },

  // User 3 (usr-003-emp - Sarah Jenkins)
  {
    id: "leave-req-005",
    user_id: "usr-003-emp",
    type: "paid",
    start_date: "2026-09-02",
    end_date: "2026-09-04",
    days: 3,
    remarks: "Attending UX Design Summit",
    status: "pending",
    comments: null,
    created_at: "2026-08-20T16:45:00.000Z"
  },
  {
    id: "leave-req-006",
    user_id: "usr-003-emp",
    type: "sick",
    start_date: "2026-08-11",
    end_date: "2026-08-11",
    days: 1,
    remarks: "Severe migraine",
    status: "approved",
    comments: "Approved. Rest well.",
    created_at: "2026-08-10T18:00:00.000Z"
  },
  {
    id: "leave-req-007",
    user_id: "usr-003-emp",
    type: "paid",
    start_date: "2026-07-20",
    end_date: "2026-07-22",
    days: 3,
    remarks: "Family vacation to Goa",
    status: "approved",
    comments: "Approved by HR Team.",
    created_at: "2026-07-15T12:00:00.000Z"
  },
  {
    id: "leave-req-008",
    user_id: "usr-003-emp",
    type: "unpaid",
    start_date: "2026-06-15",
    end_date: "2026-06-16",
    days: 2,
    remarks: "Extended weekend trip",
    status: "rejected",
    comments: "Sprint release deployment scheduled for this date.",
    created_at: "2026-06-10T14:00:00.000Z"
  },

  // User 5 (usr-005-emp - Marcus Chen)
  {
    id: "leave-req-009",
    user_id: "usr-005-emp",
    type: "paid",
    start_date: "2026-08-31",
    end_date: "2026-09-01",
    days: 2,
    remarks: "House relocation & moving",
    status: "pending",
    comments: null,
    created_at: "2026-08-21T12:10:00.000Z"
  },
  {
    id: "leave-req-010",
    user_id: "usr-005-emp",
    type: "sick",
    start_date: "2026-08-05",
    end_date: "2026-08-05",
    days: 1,
    remarks: "Cold and fever",
    status: "approved",
    comments: "Approved",
    created_at: "2026-08-04T09:00:00.000Z"
  }
];
