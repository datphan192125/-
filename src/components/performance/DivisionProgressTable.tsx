import React, { useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatNumber } from '../../utils/format';
import { KpiRecord, KpiThresholds, Team } from '../../types';
import { useApp } from '../../context/AppContext';

// Gradient xanh theo tỉ lệ: tỉ lệ càng cao màu gradient càng đậm
export const getProgressGradientStyle = (rate: number): React.CSSProperties => {
  if (rate >= 100) {
    return { background: 'linear-gradient(90deg, #3267B2 0%, #153C77 100%)' };
  }
  if (rate >= 80) {
    return { background: 'linear-gradient(90deg, #5A8ECC 0%, #295DA3 100%)' };
  }
  if (rate >= 60) {
    return { background: 'linear-gradient(90deg, #7EA9DF 0%, #4477BB 100%)' };
  }
  return { background: 'linear-gradient(90deg, #C5DCF8 0%, #8FBDF3 100%)' };
};

export interface DivisionProgressTableProps {
  selectedTeamId: string;
  setSelectedTeamId: (teamId: string) => void;
  selectedTeamName: string;
  comparisonPeriodRecords: KpiRecord[];
  kpiThresholds: KpiThresholds;
  expandedTeamId: string | null;
  setExpandedTeamId: React.Dispatch<React.SetStateAction<string | null>>;
  isMaster?: boolean;
  onOpenSetTeamKpi?: (teamId?: string) => void;
}

export const DivisionProgressTable: React.FC<DivisionProgressTableProps> = ({
  selectedTeamId,
  setSelectedTeamId,
  selectedTeamName,
  comparisonPeriodRecords,
  kpiThresholds,
  expandedTeamId,
  setExpandedTeamId,
  isMaster,
  onOpenSetTeamKpi,
}) => {
  const { teams } = useApp();

  // Đọc danh sách cấu hình team động từ AppContext/Cấu hình hệ thống (parent_team_id === null là khối chính)
  const divisionData = useMemo(() => {
    // Lấy các team cấp 1 (root teams) sắp xếp theo order
    const rootTeams = teams
      .filter((t) => !t.parent_team_id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return rootTeams.map((parentTeam) => {
      // Các team con trực thuộc parentTeam theo cấu hình
      const childTeams = teams
        .filter((t) => t.parent_team_id === parentTeam.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const allTeamIds = [parentTeam.id, ...childTeams.map((c) => c.id)];

      const records = comparisonPeriodRecords.filter((r) => allTeamIds.includes(r.team_id));
      const target = records.reduce((s, r) => s + r.target, 0);
      const achieved = records.reduce((s, r) => s + r.achieved, 0);
      const miss = records.reduce((s, r) => s + r.miss_count, 0);
      const late = records.reduce((s, r) => s + r.late_count, 0);
      const rate = target > 0 ? (achieved / target) * 100 : 0;

      // Tính số liệu cho từng nhóm con nếu có cấu hình
      const subTeams = childTeams.map((sub) => {
        const subRecs = comparisonPeriodRecords.filter((r) => r.team_id === sub.id);
        const sTarget = subRecs.reduce((s, r) => s + r.target, 0);
        const sAchieved = subRecs.reduce((s, r) => s + r.achieved, 0);
        const sMiss = subRecs.reduce((s, r) => s + r.miss_count, 0);
        const sLate = subRecs.reduce((s, r) => s + r.late_count, 0);
        const sRate = sTarget > 0 ? (sAchieved / sTarget) * 100 : 0;
        return {
          id: sub.id,
          name: sub.name,
          code: sub.code,
          target: sTarget,
          achieved: sAchieved,
          miss: sMiss,
          late: sLate,
          rate: sRate,
        };
      });

      return {
        id: parentTeam.id,
        code: parentTeam.id, // dùng id làm key chuẩn khi chọn lọc
        name: parentTeam.name,
        childIds: childTeams.map((c) => c.id),
        target,
        achieved,
        miss,
        late,
        rate,
        subTeams,
      };
    });
  }, [teams, comparisonPeriodRecords]);

  return (
    <div className="bg-white border border-[#E7E7E4] rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[750px]">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead className="text-[#24487c] uppercase text-[11px] tracking-wider border-b border-[#c2d4ee] bg-[#7c9cd0]/10 font-bold">
            <tr>
              <th className="py-3 px-5 font-bold text-left whitespace-nowrap">TEAM</th>
              <th className="py-3 px-4 font-bold text-left whitespace-nowrap">TIẾN ĐỘ</th>
              <th className="py-3 px-4 font-bold text-center whitespace-nowrap">MỤC TIÊU</th>
              <th className="py-3 px-4 font-bold text-center whitespace-nowrap">ĐẠT</th>
              <th className="py-3 px-4 font-bold text-center whitespace-nowrap">MISS</th>
              <th className="py-3 px-4 font-bold text-center whitespace-nowrap">TRỄ</th>
              <th className="py-3 px-4 font-bold text-center whitespace-nowrap">TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0EE]">
            {divisionData.map((div) => {
              const isExpanded = expandedTeamId === div.id;
              const hasSubs = div.subTeams.length > 0;

              const isAnyTeamSelected = selectedTeamId !== 'all';
              const isDirectlySelected = selectedTeamId === div.code;
              const isParentOfSelectedSub = div.childIds?.includes(selectedTeamId);
              const isDivSelected = isDirectlySelected || isParentOfSelectedSub;
              const isDivDimmed = isAnyTeamSelected && !isDivSelected;

              return (
                <React.Fragment key={div.id}>
                  <tr
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.expand-chevron-btn')) {
                        return;
                      }
                      if (selectedTeamId === div.code) {
                        setSelectedTeamId('all');
                      } else {
                        setSelectedTeamId(div.code);
                        // Không tự động xổ danh sách team nhỏ ra khi chọn team chính
                      }
                    }}
                    className={`border-l-4 transition-all duration-200 cursor-pointer select-none ${
                      isDirectlySelected
                        ? 'bg-[#7c9cd0]/20 border-l-[#7c9cd0] shadow-2xs font-semibold'
                        : isParentOfSelectedSub
                        ? 'bg-[#7c9cd0]/10 border-l-[#7c9cd0]/60'
                        : isDivDimmed
                        ? 'opacity-35 grayscale-[20%] hover:opacity-85 hover:grayscale-0 transition-all duration-200 bg-white hover:bg-[#FAFAF9] border-l-transparent'
                        : 'hover:bg-[#F6F6F4] transition-colors bg-white border-l-transparent'
                    }`}
                    title={
                      isDirectlySelected
                        ? 'Đang chọn team này. Nhấp lại để hủy chọn.'
                        : `Nhấp để chọn ${div.name}`
                    }
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        {hasSubs && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTeamId(isExpanded ? null : div.id);
                            }}
                            className="expand-chevron-btn p-1 -ml-1 text-[#8A8A85] hover:text-[#1C1C1A] hover:bg-black/5 rounded transition-colors shrink-0 cursor-pointer"
                            title={isExpanded ? 'Thu gọn nhóm con' : 'Xem nhóm con'}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        )}
                        <span
                          className={`truncate ${
                            isDivSelected && isAnyTeamSelected
                              ? 'text-[#24487c] font-extrabold'
                              : 'text-[#1C1C1A] font-bold text-sm'
                          }`}
                        >
                          {div.name}
                        </span>
                        {isDirectlySelected && (
                          <span className="shrink-0 ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#7c9cd0] text-white shadow-2xs uppercase tracking-wide">
                            Đang lọc
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tiến độ */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-[#24487c]">
                          {div.rate.toFixed(1)}%
                        </div>
                        <div className="w-full bg-[#E7E7E4] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500 rounded-full"
                            style={{
                              width: `${Math.min(div.rate, 100)}%`,
                              ...getProgressGradientStyle(div.rate),
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Mục tiêu */}
                    <td className="py-3.5 px-4 text-center font-medium text-[#1C1C1A]">
                      {formatNumber(div.target)}
                    </td>

                    {/* Đạt */}
                    <td className="py-3.5 px-4 text-center font-bold text-[#24487c]">
                      {formatNumber(div.achieved)}
                    </td>

                    {/* Miss */}
                    <td
                      className={`py-3.5 px-4 text-center font-medium ${
                        div.miss > 0 ? 'text-[#dc2626] font-bold' : 'text-[#8A8A85]'
                      }`}
                    >
                      {div.miss}
                    </td>

                    {/* Trễ */}
                    <td
                      className={`py-3.5 px-4 text-center font-medium ${
                        div.late > 0 ? 'text-[#dc2626] font-bold' : 'text-[#8A8A85]'
                      }`}
                    >
                      {div.late}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-4 text-center">
                      {div.rate >= kpiThresholds.achieved_rate ? (
                        <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded bg-[#7c9cd0]/15 text-[#24487c] border border-[#7c9cd0]/30 shadow-2xs">
                          Đạt Target
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded bg-[#FDF2F2] text-[#B85D5D] border border-[#f5c6c6]">
                          Cần Cải Thiện
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Sub-teams for 2課 (2課-A, 2課-B, 2課-S) */}
                  {hasSubs &&
                    isExpanded &&
                    div.subTeams.map((sub: any) => {
                      const isSubSelected = selectedTeamId === sub.id;
                      const isSubDimmed = isAnyTeamSelected && !isSubSelected;

                      return (
                        <tr
                          key={sub.id}
                          onClick={() => {
                            if (selectedTeamId === sub.id) {
                              setSelectedTeamId('all');
                            } else {
                              setSelectedTeamId(sub.id);
                            }
                          }}
                          className={`border-l-4 transition-all duration-200 cursor-pointer select-none ${
                            isSubSelected
                              ? 'bg-[#7c9cd0]/20 border-l-[#7c9cd0] shadow-2xs font-semibold'
                              : isSubDimmed
                              ? 'opacity-35 grayscale-[20%] hover:opacity-85 hover:grayscale-0 transition-all duration-200 bg-[#FAFAF9] hover:bg-[#F0F0EE] border-l-transparent'
                              : 'hover:bg-[#F0F0EE] transition-colors bg-[#FAFAF9] border-l-transparent'
                          }`}
                          title={
                            isSubSelected
                              ? 'Đang chọn team này. Nhấp lại để hủy chọn.'
                              : `Nhấp để chọn ${sub.name}`
                          }
                        >
                          <td className="py-3 px-5 pl-12">
                            <div className="flex items-center space-x-2">
                              <span className="text-[#8A8A85]">└</span>
                              <span
                                className={`truncate ${
                                  isSubSelected
                                    ? 'text-[#24487c] font-bold'
                                    : 'text-[#4A4A46] font-medium text-xs'
                                }`}
                              >
                                {sub.name}
                              </span>
                              {isSubSelected && (
                                <span className="shrink-0 ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#7c9cd0] text-white">
                                  Đang lọc
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Tiến độ sub-team */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-semibold text-xs text-[#24487c]">
                                {sub.rate.toFixed(1)}%
                              </div>
                              <div className="w-full bg-[#E7E7E4] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full transition-all duration-500 rounded-full"
                                  style={{
                                    width: `${Math.min(sub.rate, 100)}%`,
                                    ...getProgressGradientStyle(sub.rate),
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center text-[#4A4A46]">
                            {formatNumber(sub.target)}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-[#24487c]">
                            {formatNumber(sub.achieved)}
                          </td>
                          <td
                            className={`py-3 px-4 text-center ${
                              sub.miss > 0 ? 'text-[#dc2626] font-bold' : 'text-[#8A8A85]'
                            }`}
                          >
                            {sub.miss}
                          </td>
                          <td
                            className={`py-3 px-4 text-center ${
                              sub.late > 0 ? 'text-[#dc2626] font-bold' : 'text-[#8A8A85]'
                            }`}
                          >
                            {sub.late}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {sub.rate >= kpiThresholds.achieved_rate ? (
                              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-[#7c9cd0]/15 text-[#24487c] border border-[#7c9cd0]/30 shadow-2xs">
                                Đạt Target
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-[#FDF2F2] text-[#B85D5D] border border-[#f5c6c6]">
                                Cần Cải Thiện
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
