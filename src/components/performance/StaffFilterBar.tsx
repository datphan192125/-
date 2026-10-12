import React from 'react';
import {
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Search,
  X,
} from 'lucide-react';

export interface StaffFilterBarProps {
  unifiedStaffRecords: Array<{
    target: number;
    rate: number;
    missCount: number;
    lateCount: number;
    [key: string]: any;
  }>;
  filteredRecords: any[];
  statusFilter: 'all' | 'achieved' | 'under' | 'has_miss' | 'has_late';
  setStatusFilter: (status: 'all' | 'achieved' | 'under' | 'has_miss' | 'has_late') => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  selectedTeamId: string;
  setSelectedTeamId: (teamId: string) => void;
  selectedTeamName: string;
}

export const StaffFilterBar: React.FC<StaffFilterBarProps> = ({
  unifiedStaffRecords,
  filteredRecords,
  statusFilter,
  setStatusFilter,
  searchKeyword,
  setSearchKeyword,
  selectedTeamId,
  setSelectedTeamId,
  selectedTeamName,
}) => {
  return (
    <div className="bg-white border border-[#E7E7E4] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
      {/* Top Filter Row: Segmented Status Tabs + Live Count */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Segmented status filter tabs */}
        <div className="flex items-center flex-wrap gap-1 p-1 bg-[#F6F6F4] rounded-xl border border-[#E7E7E4]">
          {[
            { id: 'all', label: 'Tất cả', count: unifiedStaffRecords.length, icon: Filter },
            {
              id: 'achieved',
              label: 'Đạt KPI (≥100%)',
              count: unifiedStaffRecords.filter((r) => r.target > 0 && r.rate >= 100).length,
              icon: CheckCircle2,
              color: 'text-[#15803D]',
            },
            {
              id: 'under',
              label: 'Chưa đạt KPI',
              count: unifiedStaffRecords.filter((r) => r.target > 0 && r.rate < 100).length,
              icon: AlertTriangle,
              color: 'text-[#D97706]',
            },
            {
              id: 'has_miss',
              label: 'Có lỗi Miss',
              count: unifiedStaffRecords.filter((r) => r.missCount > 0).length,
              icon: AlertCircle,
              color: 'text-[#DC2626]',
            },
            {
              id: 'has_late',
              label: 'Đi trễ',
              count: unifiedStaffRecords.filter((r) => r.lateCount > 0).length,
              icon: Clock,
              color: 'text-[#DC2626]',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#1C1C1A] shadow-xs border border-[#E7E7E4]'
                    : 'text-[#64748B] hover:text-[#1C1C1A] hover:bg-white/60'
                }`}
              >
                <Icon size={13} className={isActive ? tab.color || 'text-[#24487c]' : 'text-[#8A8A85]'} />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                    isActive ? 'bg-[#7c9cd0]/20 text-[#24487c]' : 'bg-[#E7E7E4] text-[#64748B]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Result Counter */}
        <div className="flex items-center space-x-2 text-xs text-[#64748B]">
          <span>Đang hiển thị:</span>
          <span className="font-bold text-[#24487c] bg-[#7c9cd0]/15 px-2 py-0.5 rounded border border-[#7c9cd0]/30 font-mono">
            {filteredRecords.length} / {unifiedStaffRecords.length} nhân sự
          </span>
        </div>
      </div>

      {/* Bottom Filter Row: Professional Controls (Search + Filters + Reset) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 border-t border-[#F0F0EE]">
        <div className="flex items-center flex-wrap gap-2 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A85]" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo họ tên, mã nhân viên (VD: NV001, Phương...)"
              className="w-full pl-9 pr-8 py-2 bg-[#F6F6F4] border border-[#E7E7E4] rounded-lg text-xs focus:outline-hidden focus:border-[#7c9cd0] focus:bg-white transition-all shadow-2xs"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85] hover:text-[#1C1C1A] cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Selected Team Filter Indicator */}
          {selectedTeamId !== 'all' && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#7c9cd0]/15 text-[#24487c] border border-[#7c9cd0]/30 rounded-lg text-xs font-semibold">
              <span>Team: {selectedTeamName}</span>
              <button
                type="button"
                onClick={() => setSelectedTeamId('all')}
                className="hover:bg-[#7c9cd0]/20 rounded p-0.5 text-xs font-bold leading-none cursor-pointer"
                title="Bỏ lọc theo team này"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Reset Filters Button */}
        {(statusFilter !== 'all' || searchKeyword || selectedTeamId !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSearchKeyword('');
              setSelectedTeamId('all');
            }}
            className="px-3 py-1.5 text-xs font-semibold text-[#8A8A85] hover:text-[#DC2626] bg-[#F6F6F4] hover:bg-[#FEE2E2] rounded-lg border border-[#E7E7E4] hover:border-[#FCA5A5] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center space-x-1"
            title="Đặt lại toàn bộ bộ lọc"
          >
            <X size={12} />
            <span>Đặt lại bộ lọc</span>
          </button>
        )}
      </div>
    </div>
  );
};
