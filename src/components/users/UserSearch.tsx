import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, RotateCcw, ArrowUpDown } from 'lucide-react';
import { UserRole } from '@/hooks/useUserRole';

interface UserSearchProps {
  filters: {
    query: string;
    role: UserRole | 'all';
    status: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  onFilterChange: (key: string, value: any) => void;
  onResetFilters: () => void;
  totalResults: number;
}

export const UserSearch = ({ 
  filters, 
  onFilterChange, 
  onResetFilters, 
  totalResults 
}: UserSearchProps) => {
  const hasActiveFilters = filters.query || filters.role !== 'all' || filters.status !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={filters.query}
            onChange={(e) => onFilterChange('query', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        <Select value={filters.role} onValueChange={(value) => onFilterChange('role', value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Options */}
        <Select value={filters.sortBy} onValueChange={(value) => onFilterChange('sortBy', value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="role">Role</SelectItem>
            <SelectItem value="joined">Joined Date</SelectItem>
            <SelectItem value="last_seen">Last Seen</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {totalResults} {totalResults === 1 ? 'member' : 'members'} found
          </span>
          
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Filter className="w-3 h-3 mr-1" />
                Filtered
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
          )}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1">
            {filters.query && (
              <Badge variant="outline" className="text-xs">
                Query: "{filters.query}"
              </Badge>
            )}
            {filters.role !== 'all' && (
              <Badge variant="outline" className="text-xs">
                Role: {filters.role}
              </Badge>
            )}
            {filters.status !== 'all' && (
              <Badge variant="outline" className="text-xs">
                Status: {filters.status}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};