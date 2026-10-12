import React from 'react';
import { formatNumber } from '../../utils/format';
import { KpiThresholds } from '../../types';

export interface KpiHeroCardsProps {
  selectedTeamId: string;
  selectedTeamName: string;
  overallCompletionRate: number;
  kpiThresholds: KpiThresholds;
  difference: number;
  totalTarget: number;
  totalAchieved: number;
  totalMiss: number;
  totalLate: number;
  missRate: number;
  currentQuarter: string;
  getProgressGradientStyle: (rate: number) => React.CSSProperties;
}

export const KpiHeroCards: React.FC<KpiHeroCardsProps> = ({
  selectedTeamId,
  selectedTeamName,
  overallCompletionRate,
  kpiThresholds,
  difference,
  totalTarget,
  totalAchieved,
  totalMiss,
  totalLate,
  missRate,
  currentQuarter,
  getProgressGradientStyle,
}) => {
  return (
    <div className="bg-white border border-[#E7E7E4] rounded-xl overflow-hidden shadow-2xs">
      <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#E7E7E4]">
        {/* Cột 1: Tỷ Lệ Đạt Toàn Bộ Phận */}
        <div className="p-5 bg-[#7c9cd0]/5 relative overflow-hidden flex flex-col justify-between min-h-[135px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#7c9cd0]" />
          <div>
            <div className="text-[11px] font-bold text-[#24487c] uppercase tracking-wide truncate">
              Tỷ Lệ Đạt {selectedTeamId !== 'all' ? selectedTeamName : 'Toàn Bộ Phận'}
            </div>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#24487c]">
                {overallCompletionRate.toFixed(1)}%
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#7c9cd0] text-white shadow-2xs">
                {overallCompletionRate >= kpiThresholds.achieved_rate ? 'Đạt' : 'Chưa Đạt'}
              </span>
            </div>
          </div>
          <div>
            <div className="w-full bg-[#c2d4ee] h-2 mt-2.5 overflow-hidden rounded-full">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${Math.min(overallCompletionRate, 100)}%`,
                  ...getProgressGradientStyle(overallCompletionRate),
                }}
              />
            </div>
            <div className="text-xs text-[#24487c] font-medium mt-1.5 truncate">
              {difference >= 0
                ? `Vượt ${formatNumber(difference)} Task so với chỉ tiêu`
                : `Thấp hơn ${formatNumber(Math.abs(difference))} Task`}
            </div>
          </div>
        </div>

        {/* Cột 2: Mục Tiêu */}
        <div className="p-5 flex flex-col justify-between min-h-[135px]">
          <div>
            <div className="text-[11px] font-bold text-[#24487c] uppercase tracking-wide">
              Mục Tiêu
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#24487c] mt-2">
              {formatNumber(totalTarget)} <span className="text-sm font-normal text-[#24487c]/70">task</span>
            </div>
          </div>
          <div className="text-xs text-[#8A8A85] mt-1.5">
            Kỳ: Quý {currentQuarter}/2026
          </div>
        </div>

        {/* Cột 3: Đã Đạt Được */}
        <div className="p-5 flex flex-col justify-between min-h-[135px]">
          <div>
            <div className="text-[11px] font-bold text-[#24487c] uppercase tracking-wide">
              Đã Đạt Được
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#24487c] mt-2">
              {formatNumber(totalAchieved)} <span className="text-sm font-normal text-[#24487c]/70">task</span>
            </div>
          </div>
          <div className="text-xs text-[#15803D] font-medium mt-1.5">
            Đạt {overallCompletionRate.toFixed(1)}% kế hoạch
          </div>
        </div>

        {/* Cột 4: Số Lỗi */}
        <div className="p-5 flex flex-col justify-between min-h-[135px]">
          <div>
            <div className="text-[11px] font-bold text-[#dc2626] uppercase tracking-wide">
              Số Lỗi
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#dc2626] mt-2">
              {totalMiss} <span className="text-sm font-normal text-[#dc2626]/70">lỗi</span>
            </div>
          </div>
        </div>

        {/* Cột 5: Đi Trễ */}
        <div className="p-5 flex flex-col justify-between min-h-[135px]">
          <div>
            <div className="text-[11px] font-bold text-[#dc2626] uppercase tracking-wide">
              Đi Trễ
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#dc2626] mt-2">
              {totalLate} <span className="text-sm font-normal text-[#dc2626]/70">lần</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
