// src/mocks/attendance.js
// Matches TABLES.attendance schema: id, user_id, date, check_in_time, check_out_time, status

export const mockAttendance = [
  // Today's attendance (2026-08-22)
  {
    id: "att-today-001",
    user_id: "usr-001-emp",
    date: "2026-08-22",
    check_in_time: "2026-08-22T08:58:14+05:30",
    check_out_time: null,
    status: "present"
  },
  {
    id: "att-today-002",
    user_id: "usr-002-adm",
    date: "2026-08-22",
    check_in_time: "2026-08-22T08:45:00+05:30",
    check_out_time: null,
    status: "present"
  },
  {
    id: "att-today-003",
    user_id: "usr-003-emp",
    date: "2026-08-22",
    check_in_time: "2026-08-22T09:12:30+05:30",
    check_out_time: null,
    status: "present"
  },
  {
    id: "att-today-004",
    user_id: "usr-004-emp",
    date: "2026-08-22",
    check_in_time: null,
    check_out_time: null,
    status: "leave"
  },
  {
    id: "att-today-005",
    user_id: "usr-005-emp",
    date: "2026-08-22",
    check_in_time: "2026-08-22T09:30:10+05:30",
    check_out_time: null,
    status: "present"
  },

  // Past logs for Sarah Jenkins (usr-001-emp)
  {
    id: "att-hist-001",
    user_id: "usr-001-emp",
    date: "2026-08-21",
    check_in_time: "2026-08-21T09:02:10+05:30",
    check_out_time: "2026-08-21T18:15:40+05:30",
    status: "present"
  },
  {
    id: "att-hist-002",
    user_id: "usr-001-emp",
    date: "2026-08-20",
    check_in_time: "2026-08-20T08:55:00+05:30",
    check_out_time: "2026-08-20T17:45:00+05:30",
    status: "present"
  },
  {
    id: "att-hist-003",
    user_id: "usr-001-emp",
    date: "2026-08-19",
    check_in_time: "2026-08-19T09:15:00+05:30",
    check_out_time: "2026-08-19T13:30:00+05:30",
    status: "half-day"
  },
  {
    id: "att-hist-004",
    user_id: "usr-001-emp",
    date: "2026-08-18",
    check_in_time: "2026-08-18T08:50:00+05:30",
    check_out_time: "2026-08-18T18:05:00+05:30",
    status: "present"
  },
  {
    id: "att-hist-005",
    user_id: "usr-001-emp",
    date: "2026-08-17",
    check_in_time: "2026-08-17T09:00:00+05:30",
    check_out_time: "2026-08-17T18:00:00+05:30",
    status: "present"
  },
  {
    id: "att-hist-006",
    user_id: "usr-001-emp",
    date: "2026-08-14",
    check_in_time: null,
    check_out_time: null,
    status: "leave"
  },
  {
    id: "att-hist-007",
    user_id: "usr-001-emp",
    date: "2026-08-13",
    check_in_time: "2026-08-13T09:05:00+05:30",
    check_out_time: "2026-08-13T18:10:00+05:30",
    status: "present"
  },
  {
    id: "att-hist-008",
    user_id: "usr-001-emp",
    date: "2026-08-12",
    check_in_time: "2026-08-12T08:48:00+05:30",
    check_out_time: "2026-08-12T17:55:00+05:30",
    status: "present"
  },

  // Past logs for Marcus Chen (usr-003-emp)
  {
    id: "att-hist-009",
    user_id: "usr-003-emp",
    date: "2026-08-21",
    check_in_time: "2026-08-21T09:10:00+05:30",
    check_out_time: "2026-08-21T18:30:00+05:30",
    status: "present"
  },
  {
    id: "att-hist-010",
    user_id: "usr-003-emp",
    date: "2026-08-20",
    check_in_time: "2026-08-20T09:00:00+05:30",
    check_out_time: "2026-08-20T18:00:00+05:30",
    status: "present"
  },
  {
    id: "att-hist-011",
    user_id: "usr-003-emp",
    date: "2026-08-19",
    check_in_time: null,
    check_out_time: null,
    status: "absent"
  },

  // Past logs for Priya Sharma (usr-004-emp)
  {
    id: "att-hist-012",
    user_id: "usr-004-emp",
    date: "2026-08-21",
    check_in_time: "2026-08-21T08:40:00+05:30",
    check_out_time: "2026-08-21T17:30:00+05:30",
    status: "present"
  },
  {
    id: "att-hist-013",
    user_id: "usr-004-emp",
    date: "2026-08-20",
    check_in_time: "2026-08-20T08:50:00+05:30",
    check_out_time: "2026-08-20T17:40:00+05:30",
    status: "present"
  }
];
