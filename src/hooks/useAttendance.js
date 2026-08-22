/**
 * Dayflow — Attendance Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { getAllAttendance, getAttendanceSummary } from '../services/attendanceService.js';

export function useAttendance(filters = {}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await getAllAttendance(filters);
    setRecords(data || []);
    setError(err);
    setLoading(false);
  }, [filters.startDate, filters.endDate, filters.userId, filters.status]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refresh: fetchRecords };
}

export function useAttendanceSummary(userId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const { data } = await getAttendanceSummary(userId);
      setSummary(data);
      setLoading(false);
    })();
  }, [userId]);

  return { summary, loading };
}
