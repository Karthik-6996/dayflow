// src/mocks/attendance.js
// Matches TABLES.attendance & TABLES.attendance_regularizations schema

export const mockAttendance = [
  // Today's attendance (2026-08-22, Saturday - or working day active)
  {
    id: "att-today-001",
    user_id: "usr-001-emp",
    date: "2026-08-22",
    check_in_time: "2026-08-22T09:24:14+05:30",
    check_out_time: null,
    status: "present",
    work_mode: "office",
    break_minutes: 15,
    is_late: false,
    location: "Bangalore HQ - Floor 4"
  },
  {
    id: "att-today-002",
    user_id: "usr-002-adm",
    date: "2026-08-22",
    check_in_time: "2026-08-22T09:15:00+05:30",
    check_out_time: null,
    status: "present",
    work_mode: "office",
    break_minutes: 0,
    is_late: false,
    location: "Bangalore HQ - Executive Suite"
  },
  {
    id: "att-today-003",
    user_id: "usr-003-emp",
    date: "2026-08-22",
    check_in_time: "2026-08-22T09:52:30+05:30",
    check_out_time: null,
    status: "present",
    work_mode: "wfh",
    break_minutes: 0,
    is_late: true, // checked in after 09:45 grace time
    location: "Remote - Hyderabad"
  },
  {
    id: "att-today-004",
    user_id: "usr-004-emp",
    date: "2026-08-22",
    check_in_time: null,
    check_out_time: null,
    status: "leave",
    work_mode: "office",
    break_minutes: 0,
    is_late: false,
    location: "Bangalore HQ"
  },
  {
    id: "att-today-005",
    user_id: "usr-005-emp",
    date: "2026-08-22",
    check_in_time: "2026-08-22T09:10:00+05:30",
    check_out_time: null,
    status: "present",
    work_mode: "on_duty",
    break_minutes: 30,
    is_late: false,
    location: "Client Site - Infosys Tech Park"
  },
  {
    id: "att-today-006",
    user_id: "usr-006-adm",
    date: "2026-08-22",
    check_in_time: "2026-08-22T09:20:00+05:30",
    check_out_time: null,
    status: "present",
    work_mode: "office",
    break_minutes: 0,
    is_late: false,
    location: "Bangalore HQ - HR Desk"
  },

  // Past logs for Sarah Jenkins (usr-001-emp) - August 2026
  {
    id: "att-hist-001",
    user_id: "usr-001-emp",
    date: "2026-08-21", // Friday
    check_in_time: "2026-08-21T09:28:10+05:30",
    check_out_time: "2026-08-21T18:35:40+05:30",
    status: "present",
    work_mode: "office",
    break_minutes: 45,
    is_late: false,
    location: "Bangalore HQ"
  },
  {
    id: "att-hist-002",
    user_id: "usr-001-emp",
    date: "2026-08-20", // Thursday
    check_in_time: "2026-08-20T09:15:00+05:30",
    check_out_time: "2026-08-20T18:45:00+05:30",
    status: "present",
    work_mode: "wfh",
    break_minutes: 50,
    is_late: false,
    location: "Remote - Bangalore"
  },
  {
    id: "att-hist-003",
    user_id: "usr-001-emp",
    date: "2026-08-19", // Wednesday
    check_in_time: "2026-08-19T09:30:00+05:30",
    check_out_time: "2026-08-19T14:00:00+05:30",
    status: "half-day",
    work_mode: "office",
    break_minutes: 20,
    is_late: false,
    location: "Bangalore HQ"
  },
  {
    id: "att-hist-004",
    user_id: "usr-001-emp",
    date: "2026-08-18", // Tuesday
    check_in_time: "2026-08-18T10:05:00+05:30",
    check_out_time: "2026-08-18T19:10:00+05:30",
    status: "present",
    work_mode: "office",
    break_minutes: 60,
    is_late: true, // late check-in
    location: "Bangalore HQ"
  },
  {
    id: "att-hist-005",
    user_id: "usr-001-emp",
    date: "2026-08-17", // Monday
    check_in_time: "2026-08-17T09:20:00+05:30",
    check_out_time: "2026-08-17T18:30:00+05:30",
    status: "present",
    work_mode: "office",
    break_minutes: 45,
    is_late: false,
    location: "Bangalore HQ"
  },
  // Indian Independence Day (Aug 15) Holiday
  {
    id: "att-hist-006",
    user_id: "usr-001-emp",
    date: "2026-08-15", // Saturday - Gazetted National Holiday
    check_in_time: null,
    check_out_time: null,
    status: "holiday",
    work_mode: "office",
    break_minutes: 0,
    is_late: false,
    location: "National Holiday - Independence Day"
  },
  {
    id: "att-hist-007",
    user_id: "usr-001-emp",
    date: "2026-08-14", // Friday
    check_in_time: null,
    check_out_time: null,
    status: "leave",
    work_mode: "office",
    break_minutes: 0,
    is_late: false,
    location: "Approved Casual Leave"
  },
  {
    id: "att-hist-008",
    user_id: "usr-001-emp",
    date: "2026-08-13", // Thursday
    check_in_time: "2026-08-13T09:30:00+05:30",
    check_out_time: "2026-08-13T18:30:00+05:30",
    status: "present",
    work_mode: "on_duty",
    break_minutes: 40,
    is_late: false,
    location: "Client Site - Electronic City"
  },
  {
    id: "att-hist-009",
    user_id: "usr-001-emp",
    date: "2026-08-12", // Wednesday
    check_in_time: "2026-08-12T09:18:00+05:30",
    check_out_time: "2026-08-12T18:25:00+05:30",
    status: "present",
    work_mode: "office",
    break_minutes: 45,
    is_late: false,
    location: "Bangalore HQ"
  },
  {
    id: "att-hist-010",
    user_id: "usr-001-emp",
    date: "2026-08-11", // Tuesday
    check_in_time: "2026-08-11T09:25:00+05:30",
    check_out_time: "2026-08-11T18:30:00+05:30",
    status: "present",
    work_mode: "office",
    break_minutes: 50,
    is_late: false,
    location: "Bangalore HQ"
  },
  {
    id: "att-hist-011",
    user_id: "usr-001-emp",
    date: "2026-08-10", // Monday
    check_in_time: "2026-08-10T09:30:00+05:30",
    check_out_time: "2026-08-10T18:30:00+05:30",
    status: "present",
    work_mode: "wfh",
    break_minutes: 45,
    is_late: false,
    location: "Remote"
  },
  {
    id: "att-hist-012",
    user_id: "usr-001-emp",
    date: "2026-08-07", // Friday
    check_in_time: "2026-08-07T09:20:00+05:30",
    check_out_time: "2026-08-07T18:40:00+05:30",
    status: "present",
    work_mode: "office",
    break_minutes: 40,
    is_late: false,
    location: "Bangalore HQ"
  },
  {
    id: "att-hist-013",
    user_id: "usr-001-emp",
    date: "2026-08-06", // Thursday - Regularized Missed Punch
    check_in_time: "2026-08-06T09:30:00+05:30",
    check_out_time: "2026-08-06T18:30:00+05:30",
    status: "present",
    work_mode: "office",
    break_minutes: 45,
    is_late: false,
    regularization_id: "reg-001",
    location: "Bangalore HQ (Regularized)"
  },
  {
    id: "att-hist-014",
    user_id: "usr-001-emp",
    date: "2026-08-05", // Wednesday
    check_in_time: "2026-08-05T09:15:00+05:30",
    check_out_time: "2026-08-05T18:15:00+05:30",
    status: "present",
    work_mode: "office",
    break_minutes: 45,
    is_late: false,
    location: "Bangalore HQ"
  },

  // Past logs for Marcus Chen (usr-003-emp)
  {
    id: "att-hist-015",
    user_id: "usr-003-emp",
    date: "2026-08-21",
    check_in_time: "2026-08-21T09:55:00+05:30",
    check_out_time: "2026-08-21T19:00:00+05:30",
    status: "present",
    work_mode: "wfh",
    break_minutes: 60,
    is_late: true,
    location: "Remote - Hyderabad"
  },
  {
    id: "att-hist-016",
    user_id: "usr-003-emp",
    date: "2026-08-20",
    check_in_time: "2026-08-20T09:20:00+05:30",
    check_out_time: "2026-08-20T18:30:00+05:30",
    status: "present",
    work_mode: "wfh",
    break_minutes: 45,
    is_late: false,
    location: "Remote - Hyderabad"
  },
  {
    id: "att-hist-017",
    user_id: "usr-003-emp",
    date: "2026-08-19",
    check_in_time: null,
    check_out_time: null,
    status: "absent",
    work_mode: "office",
    break_minutes: 0,
    is_late: false,
    location: "Bangalore HQ"
  },

  // Past logs for Priya Sharma (usr-004-emp)
  {
    id: "att-hist-018",
    user_id: "usr-004-emp",
    date: "2026-08-21",
    check_in_time: "2026-08-21T09:10:00+05:30",
    check_out_time: "2026-08-21T18:20:00+05:30",
    status: "present",
    work_mode: "office",
    break_minutes: 45,
    is_late: false,
    location: "Bangalore HQ"
  },
  {
    id: "att-hist-019",
    user_id: "usr-004-emp",
    date: "2026-08-20",
    check_in_time: "2026-08-20T09:12:00+05:30",
    check_out_time: "2026-08-20T18:15:00+05:30",
    status: "present",
    work_mode: "office",
    break_minutes: 40,
    is_late: false,
    location: "Bangalore HQ"
  }
];

// Attendance Regularization Requests (Indian Standard HR workflow for missed punches / corrections)
export const mockAttendanceRegularizations = [
  {
    id: "reg-001",
    attendance_id: "att-hist-013",
    user_id: "usr-001-emp",
    date: "2026-08-06",
    requested_check_in: "09:30",
    requested_check_out: "18:30",
    reason: "biometric_glitch",
    remarks: "Biometric reader failed to capture fingerprint scan at reception during morning rush.",
    status: "approved",
    admin_comments: "Approved based on turnstile CCTV confirmation.",
    created_at: "2026-08-06T19:00:00+05:30"
  },
  {
    id: "reg-002",
    attendance_id: "att-hist-017",
    user_id: "usr-003-emp",
    date: "2026-08-19",
    requested_check_in: "09:40",
    requested_check_out: "18:45",
    reason: "power_network_issue",
    remarks: "Broadband fiber cut in residential area; worked offline on local dev branch and committed code after 6 PM.",
    status: "pending",
    admin_comments: null,
    created_at: "2026-08-20T10:15:00+05:30"
  },
  {
    id: "reg-003",
    attendance_id: null,
    user_id: "usr-005-emp",
    date: "2026-08-18",
    requested_check_in: "09:15",
    requested_check_out: "18:30",
    reason: "client_visit",
    remarks: "Direct site travel to client headquarters in Whitefield for roadmap discussion.",
    status: "approved",
    admin_comments: "Verified with client meeting invitation.",
    created_at: "2026-08-18T19:30:00+05:30"
  }
];
