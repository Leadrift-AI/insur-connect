import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Filter, 
  CalendarIcon, 
  X, 
  RefreshCw,
  Download,
  FileText,
  Users,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

interface FilterOptions {
  timeRange: string;
  agentId?: string;
  campaignType?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onRefresh: () => void;
  isRealtime: boolean;
  onToggleRealtime: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onExportCSV,
  onExportPDF,
  onRefresh,
  isRealtime,
  onToggleRealtime,
}) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [isExpanded, setIsExpanded] = useState(false);

  const agents = [
    'Sarah Johnson', 'Mike Chen', 'Emma Davis', 'Alex Rodriguez', 'Lisa Wang'
  ];

  const campaignTypes = [
    'Auto Insurance', 'Home Insurance', 'Life Insurance', 'Health Insurance', 'Business Insurance'
  ];

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ];

  const handleFilterChange = (key: keyof FilterOptions, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    handleFilterChange('dateFrom', date ? format(date, 'yyyy-MM-dd') : undefined);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    handleFilterChange('dateTo', date ? format(date, 'yyyy-MM-dd') : undefined);
  };

  const clearFilters = () => {
    onFiltersChange({
      timeRange: '30d',
    });
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.agentId) count++;
    if (filters.campaignType) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters & Export
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">{getActiveFiltersCount()} active</Badge>
            )}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant={isRealtime ? "default" : "outline"} 
            size="sm" 
            onClick={onToggleRealtime}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {isRealtime ? 'Live Mode' : 'Static Mode'}
          </Button>
          <Button variant="outline" size="sm" onClick={onExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Time Range</Label>
            <Select value={filters.timeRange} onValueChange={(value) => handleFilterChange('timeRange', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agent</Label>
            <Select value={filters.agentId || ''} onValueChange={(value) => handleFilterChange('agentId', value || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All agents</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Campaign Type</Label>
            <Select value={filters.campaignType || ''} onValueChange={(value) => handleFilterChange('campaignType', value || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                {campaignTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Custom Date Range</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={handleDateFromChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={handleDateToChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Clear Filters */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};