/**
 * Dayflow — Employees Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { getAllEmployees, getEmployeeById, getDepartments } from '../services/userService.js';

export function useEmployees(filters = {}) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await getAllEmployees(filters);
    setEmployees(data || []);
    setError(err);
    setLoading(false);
  }, [filters.department, filters.search]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { employees, loading, error, refresh: fetchEmployees };
}

export function useEmployee(userId) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const { data } = await getEmployeeById(userId);
      setEmployee(data);
      setLoading(false);
    })();
  }, [userId]);

  return { employee, loading };
}

export function useDepartments() {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await getDepartments();
      setDepartments(data || []);
    })();
  }, []);

  return departments;
}
