import { useState, useMemo } from 'react';
import { UserRole } from '@/hooks/useUserRole';

interface TeamMember {
  user_id: string;
  role: UserRole;
  created_at: string;
  email?: string;
  full_name?: string;
  status?: string;
  last_seen_at?: string;
}

interface SearchFilters {
  query: string;
  role: UserRole | 'all';
  status: string;
  sortBy: 'name' | 'email' | 'role' | 'joined' | 'last_seen';
  sortOrder: 'asc' | 'desc';
}

export const useUserSearch = (teamMembers: TeamMember[]) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    role: 'all',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = teamMembers;

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(member =>
        member.full_name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(member => member.role === filters.role);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(member => member.status === filters.status);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.full_name || '';
          bValue = b.full_name || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'joined':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'last_seen':
          aValue = a.last_seen_at ? new Date(a.last_seen_at) : new Date(0);
          bValue = b.last_seen_at ? new Date(b.last_seen_at) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [teamMembers, filters]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      role: 'all',
      status: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  return {
    filters,
    filteredAndSortedMembers,
    updateFilter,
    resetFilters
  };
};