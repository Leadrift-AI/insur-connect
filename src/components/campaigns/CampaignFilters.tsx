import React from 'react';
import { Search, Filter, Calendar, Target, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface CampaignFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  typeFilter: string;
  onTypeChange: (type: string) => void;
  budgetRange: [number, number];
  onBudgetRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export const CampaignFilters: React.FC<CampaignFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  budgetRange,
  onBudgetRangeChange,
  onClearFilters,
  activeFiltersCount
}) => {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>

      {/* Type Filter */}
      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
          <SelectItem value="google_ads">Google Ads</SelectItem>
          <SelectItem value="linkedin">LinkedIn</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="website">Website</SelectItem>
          <SelectItem value="referral">Referral</SelectItem>
        </SelectContent>
      </Select>

      {/* Budget Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Budget
            {budgetRange[0] > 0 || budgetRange[1] < 100000 ? (
              <Badge variant="secondary" className="ml-1">
                ${budgetRange[0]}-${budgetRange[1]}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Budget Range</Label>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">${budgetRange[0]}</span>
                <Slider
                  value={budgetRange}
                  onValueChange={(value) => onBudgetRangeChange(value as [number, number])}
                  max={100000}
                  min={0}
                  step={1000}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">${budgetRange[1]}</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters & Clear */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-2"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};