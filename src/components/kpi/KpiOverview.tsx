import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Plus,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Layers,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KpiImportModal } from './KpiImportModal';
import { UserKpiDetailModal } from './UserKpiDetailModal';
import { KpiRecord, Team, RANK_STYLE_CONFIG, EmployeeRank } from '../../types';

export const KpiOverview: React.FC = () => {
  const {
    teams,
    users,
    currentUser,
    kpiRecords,
    visibleKpiRecords,
    selectedMonth,
    setSelectedMonth,
    selectedQuarter,
    setSelectedQuarter,
    selectedTeamId,
    setSelectedTeamId,
    exportCurrentKpis,
    isLeaderOrAdmin,
    kpiThresholds,
  } = useApp();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<KpiRecord | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>('div-2'); // 2課 expanded by default to show A, B, S

  // Calculate high-level aggregated metrics across visible records
  const totalTarget = useMemo(() => {
    return visibleKpiRecords.reduce((sum, r) => sum + r.target, 0);
  }, [visibleKpiRecords]);

  const totalAchieved = useMemo(() => {
    return visibleKpiRecords.reduce((sum, r) => sum + r.achieved, 0);
  }, [visibleKpiRecords]);

  const totalMiss = useMemo(() => {
    return visibleKpiRecords.reduce((sum, r) => sum + r.miss_count, 0);
  }, [visibleKpiRecords]);

  const totalLate = useMemo(() => {
    return visibleKpiRecords.reduce((sum, r) => sum + r.late_count, 0);
  }, [visibleKpiRecords]);

  const overallCompletionRate = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
  const difference = totalAchieved - totalTarget;
  const missRate = totalAchieved > 0 ? (totalMiss / totalAchieved) * 100 : 0;

  // Selected team display name
  const selectedTeamName = useMemo(() => {
    switch (selectedTeamId) {
      case 'team-1':
        return '1課';
      case 'team-2':
        return '2課 (Toàn bộ A/B/S)';
      case 'team-2a':
        return '2課-A';
      case 'team-2b':
        return '2課-B';
      case 'team-2s':
        return '2課-S';
      case 'team-3':
        return '3課';
      case 'team-gs':
        return 'GS';
      default:
        return 'Tất cả các khối';
    }
  }, [selectedTeamId]);

  // Comparison records across all permitted teams for the selected period
  const comparisonPeriodRecords = useMemo(() => {
    let recs = kpiRecords;
    if (currentUser?.view_scope === '2ka_all') {
      const team2Ids = ['team-2', 'team-2a', 'team-2b', 'team-2s'];
      recs = recs.filter((r) => team2Ids.includes(r.team_id));
    } else if (currentUser?.view_scope === 'own_team') {
      recs = recs.filter((r) => r.team_id === currentUser.team_id);
    } else if (currentUser?.view_scope === 'custom') {
      recs = recs.filter((r) => currentUser.allowed_team_ids.includes(r.team_id));
    }
    if (selectedQuarter !== 'all') {
      recs = recs.filter((r) => r.quarter_id === selectedQuarter);
    }
    if (selectedMonth !== 'all') {
      recs = recs.filter((r) => r.month === selectedMonth);
    }
    return recs;
  }, [kpiRecords, selectedQuarter, selectedMonth, currentUser]);

  // Group by 4 main divisions: 1課, 2課, 3課, GS
  const divisionData = useMemo(() => {
    const mainCodes = [
      { id: 'div-1', code: 'team-1', name: '1課', teamIds: ['team-1'] },
      { id: 'div-2', code: 'team-2', name: '2課', teamIds: ['team-2', 'team-2a', 'team-2b', 'team-2s'] },
      { id: 'div-3', code: 'team-3', name: '3課', teamIds: ['team-3'] },
      { id: 'div-gs', code: 'team-gs', name: 'GS', teamIds: ['team-gs'] },
    ];

    return mainCodes.map((division) => {
      const records = comparisonPeriodRecords.filter((r) => division.teamIds.includes(r.team_id));
      const target = records.reduce((s, r) => s + r.target, 0);
      const achieved = records.reduce((s, r) => s + r.achieved, 0);
      const miss = records.reduce((s, r) => s + r.miss_count, 0);
      const late = records.reduce((s, r) => s + r.late_count, 0);
      const rate = target > 0 ? (achieved / target) * 100 : 0;

      // Sub-teams if division 2
      let subTeams: any[] = [];
      if (division.id === 'div-2') {
        const subs = [
          { id: 'team-2a', name: '2課-A' },
          { id: 'team-2b', name: '2課-B' },
          { id: 'team-2s', name: '2課-S' },
        ];
        subTeams = subs.map((sub) => {
          const subRecs = comparisonPeriodRecords.filter((r) => r.team_id === sub.id);
          const sTarget = subRecs.reduce((s, r) => s + r.target, 0);
          const sAchieved = subRecs.reduce((s, r) => s + r.achieved, 0);
          const sMiss = subRecs.reduce((s, r) => s + r.miss_count, 0);
          const sLate = subRecs.reduce((s, r) => s + r.late_count, 0);
          const sRate = sTarget > 0 ? (sAchieved / sTarget) * 100 : 0;
          return {
            ...sub,
            target: sTarget,
            achieved: sAchieved,
            miss: sMiss,
            late: sLate,
            rate: sRate,
          };
        });
      }

      return {
        ...division,
        target,
        achieved,
        miss,
        late,
        rate,
        subTeams,
      };
    });
  }, [comparisonPeriodRecords]);

  // Format large numbers with dot thousand separator like in Vietnam / Japan mockup (4.332, 4.512)
  const formatNumber = (num: number) => {
    return num.toLocaleString('de-DE'); // Formats 4332 as 4.332
  };

  // Gradient xanh theo tỉ lệ: tỉ lệ càng cao màu gradient càng đậm
  const getProgressGradientStyle = (rate: number) => {
    if (rate >= 100) {
      // >= 100%: Xanh navy hoàng gia đậm nhất (Deep Royal Navy)
      return {
        background: 'linear-gradient(90deg, #3267B2 0%, #153C77 100%)',
      };
    }
    if (rate >= 80) {
      // 80% - 99%: Xanh đậm vừa (Medium Deep Blue)
      return {
        background: 'linear-gradient(90deg, #5A8ECC 0%, #295DA3 100%)',
      };
    }
    if (rate >= 60) {
      // 60% - 79%: Xanh cân bằng (Balanced Steel Blue)
      return {
        background: 'linear-gradient(90deg, #7EA9DF 0%, #4477BB 100%)',
      };
    }
    // <= 59% (ví dụ 50%): Xanh nhạt rõ rệt (Soft Sky Blue)
    return {
      background: 'linear-gradient(90deg, #C5DCF8 0%, #8FBDF3 100%)',
    };
  };

  const getStatusBadge = (rate: number) => {
    if (rate >= kpiThresholds.achieved_rate) {
      return (
        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded bg-[#7c9cd0]/15 text-[#24487c] border border-[#7c9cd0]/30 shadow-2xs">
          Đạt Target
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-[#FDF2F2] text-[#B85D5D] border border-[#f5c6c6]">
        Cần Cải Thiện
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">Thành Tích</h1>
          <p className="text-xs text-[#8A8A85] mt-1">
            Tổng quan hiệu suất toàn bộ phận 内部事務代行
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Month selector - fixed width */}
          <div className="relative w-[135px]">
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 pr-8 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden transition-colors cursor-pointer"
            >
              <option value="all">Tất cả các tháng</option>
              <option value={1}>Tháng 01</option>
              <option value={2}>Tháng 02</option>
              <option value={3}>Tháng 03</option>
              <option value={4}>Tháng 04</option>
              <option value={5}>Tháng 05</option>
              <option value={6}>Tháng 06</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85] pointer-events-none"
            />
          </div>

          {/* Quarter selector - fixed width */}
          <div className="relative w-[125px]">
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 pr-8 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden transition-colors cursor-pointer"
            >
              <option value="all">Tất cả các Quý</option>
              <option value="Q1">Quý 1</option>
              <option value="Q2">Quý 2</option>
              <option value="Q3">Quý 3</option>
              <option value="Q4">Quý 4</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85] pointer-events-none"
            />
          </div>

          {/* Team filter - fixed width */}
          <div className="relative w-[175px]">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 pr-8 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden transition-colors cursor-pointer"
            >
              <option value="all">Tất cả các khối</option>
              <option value="team-1">1課</option>
              <option value="team-2">2課</option>
              <option value="team-2a">2課-A</option>
              <option value="team-2b">2課-B</option>
              <option value="team-2s">2課-S</option>
              <option value="team-3">3課</option>
              <option value="team-gs">GS</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85] pointer-events-none"
            />
          </div>

          {/* Export Excel Button */}
          <button
            onClick={exportCurrentKpis}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#E7E7E4] rounded-md text-xs font-medium text-[#1C1C1A] hover:bg-[#F6F6F4] transition-colors"
          >
            <Download size={13} className="text-[#8A8A85]" />
            <span>Xuất Excel</span>
          </button>

          {/* Import KPI Button */}
          {isLeaderOrAdmin && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#7c9cd0] text-white rounded-md text-xs font-semibold hover:bg-[#6788be] shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Nhập KPI</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Neutral Metric Columns (Exact layout matching the PDF) */}
      <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#E7E7E4]">
          {/* Column 1: Tỷ Lệ Đạt Toàn Bộ Phận (Hero Metric) */}
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
              <div className="w-full bg-[#c2d4ee] h-2 mt-2.5 overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
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

          {/* Column 2: Mục Tiêu */}
          <div className="p-5 flex flex-col justify-between min-h-[135px]">
            <div className="text-[11px] font-bold text-[#24487c] uppercase tracking-wide">
              Mục Tiêu
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#24487c] mt-2">
              {formatNumber(totalTarget)} <span className="text-sm font-normal text-[#24487c]/70">task</span>
            </div>
            <div className="text-xs text-transparent select-none mt-1.5">—</div>
          </div>

          {/* Column 3: Đã Đạt Được */}
          <div className="p-5 flex flex-col justify-between min-h-[135px]">
            <div className="text-[11px] font-bold text-[#24487c] uppercase tracking-wide">
              Đã Đạt Được
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#24487c] mt-2">
              {formatNumber(totalAchieved)} <span className="text-sm font-normal text-[#24487c]/70">task</span>
            </div>
            <div className="text-xs text-transparent select-none mt-1.5">—</div>
          </div>

          {/* Column 4: Số Lỗi */}
          <div className="p-5 flex flex-col justify-between min-h-[135px]">
            <div className="text-[11px] font-bold text-[#dc2626] uppercase tracking-wide">
              Số Lỗi
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#dc2626] mt-2">
              {totalMiss} <span className="text-sm font-normal text-[#dc2626]/70">lỗi</span>
            </div>
            <div className="text-xs text-[#dc2626] font-medium mt-1.5">
              Tỷ lệ {missRate.toFixed(2)}%
            </div>
          </div>

          {/* Column 5: Đi Trễ */}
          <div className="p-5 flex flex-col justify-between min-h-[135px]">
            <div className="text-[11px] font-bold text-[#dc2626] uppercase tracking-wide">
              Đi Trễ
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#dc2626] mt-2">
              {totalLate} <span className="text-sm font-normal text-[#dc2626]/70">lần</span>
            </div>
            <div className="text-xs text-[#dc2626] font-medium mt-1.5 truncate">
              {selectedTeamId !== 'all' ? selectedTeamName : 'Toàn bộ 4 team'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Team Comparison Table (Exact match from PDF screenshot) */}
      <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-[#F0F0EE] flex items-center justify-between bg-white min-h-[52px]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#7c9cd0]" />
            <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">
              Bảng So Sánh Các Khối / Team
            </h2>
            {selectedTeamId !== 'all' && (
              <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-[#7c9cd0] text-white flex items-center space-x-1.5 shadow-2xs">
                <span>Đang chọn: {selectedTeamName}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTeamId('all')}
                  className="ml-1 hover:bg-white/25 rounded-xs px-1 font-bold leading-none"
                  title="Hủy chọn (hiển thị rõ tất cả team)"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {selectedTeamId !== 'all' ? (
              <button
                type="button"
                onClick={() => setSelectedTeamId('all')}
                className="text-xs text-[#24487c] font-semibold bg-[#7c9cd0]/15 px-2.5 py-1 rounded border border-[#7c9cd0]/30 hover:bg-[#7c9cd0]/25 transition-colors"
              >
                Bỏ chọn & hiện rõ tất cả team
              </button>
            ) : (
              <span className="text-xs text-[#24487c] font-medium bg-[#7c9cd0]/15 px-2.5 py-1 rounded border border-[#7c9cd0]/30">
                Nhấp dòng 2課 để xem chi tiết A, B, S • Nhấp team để chọn
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="text-[#24487c] uppercase text-[11px] tracking-wider border-b border-[#c2d4ee] bg-[#7c9cd0]/10 font-bold">
              <tr>
                <th className="py-3 px-5 font-bold text-left">TEAM</th>
                <th className="py-3 px-4 font-bold text-left">TIẾN ĐỘ</th>
                <th className="py-3 px-4 font-bold text-center">MỤC TIÊU</th>
                <th className="py-3 px-4 font-bold text-center">ĐẠT</th>
                <th className="py-3 px-4 font-bold text-center">MISS</th>
                <th className="py-3 px-4 font-bold text-center">TRỄ</th>
                <th className="py-3 px-4 font-bold text-center">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EE]">
              {divisionData.map((div) => {
                const isExpanded = expandedTeamId === div.id;
                const hasSubs = div.subTeams.length > 0;

                const isAnyTeamSelected = selectedTeamId !== 'all';
                const isDirectlySelected = selectedTeamId === div.code;
                const isParentOfSelectedSub =
                  div.id === 'div-2' && ['team-2a', 'team-2b', 'team-2s'].includes(selectedTeamId);
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
                          if (hasSubs && expandedTeamId !== div.id) {
                            setExpandedTeamId(div.id);
                          }
                        }
                      }}
                      className={`border-l-4 transition-all duration-200 cursor-pointer select-none ${
                        isDirectlySelected
                          ? 'bg-[#7c9cd0]/20 border-l-[#7c9cd0] shadow-2xs font-semibold'
                          : isParentOfSelectedSub
                          ? 'bg-[#7c9cd0]/10 border-l-[#7c9cd0]/60'
                          : isDivDimmed
                          ? 'opacity-30 grayscale-[25%] hover:opacity-75 hover:grayscale-0 transition-all duration-200 bg-white hover:bg-[#FAFAF9] border-l-transparent'
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
                              className="expand-chevron-btn p-1 -ml-1 text-[#8A8A85] hover:text-[#1C1C1A] hover:bg-black/5 rounded transition-colors shrink-0"
                              title={isExpanded ? 'Thu gọn nhóm con' : 'Xem nhóm con A, B, S'}
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
                              Đang chọn
                            </span>
                          )}
                          {isParentOfSelectedSub && (
                            <span className="shrink-0 ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#7c9cd0]/20 text-[#24487c]">
                              Khối trực thuộc
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <div
                          className={`font-bold text-sm ${
                            isDirectlySelected ? 'text-[#153C77]' : 'text-[#1C1C1A]'
                          }`}
                        >
                          {div.rate.toFixed(1)}%
                        </div>
                        <div className="w-full bg-[#E7E7E4] h-2 mt-1.5 overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${Math.min(div.rate, 100)}%`,
                              ...getProgressGradientStyle(div.rate),
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-[#4A4A46]">
                        {formatNumber(div.target)}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-center text-xs font-mono font-medium ${
                          isDirectlySelected ? 'text-[#24487c] font-bold' : 'text-[#1C1C1A]'
                        }`}
                      >
                        {formatNumber(div.achieved)}
                      </td>
                      <td className={`py-3.5 px-4 text-center text-xs font-mono ${div.miss > 0 ? 'text-[#dc2626] font-bold' : 'text-[#4A4A46]'}`}>
                        {div.miss}
                      </td>
                      <td className={`py-3.5 px-4 text-center text-xs font-mono ${div.late > 0 ? 'text-[#dc2626] font-bold' : 'text-[#4A4A46]'}`}>
                        {div.late}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(div.rate)}
                      </td>
                    </tr>

                    {/* Sub-teams (2課-A, 2課-B, 2課-S) if expanded */}
                    {hasSubs && isExpanded && (
                      div.subTeams.map((sub) => {
                        const isSubDirectlySelected = selectedTeamId === sub.id;
                        const isSubPartOfSelectedParent = selectedTeamId === 'team-2';
                        const isSubSelected = isSubDirectlySelected || isSubPartOfSelectedParent;
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
                            className={`border-l-4 transition-all duration-200 text-xs cursor-pointer select-none ${
                              isSubDirectlySelected
                                ? 'bg-[#7c9cd0]/25 border-l-[#7c9cd0] shadow-2xs font-semibold'
                                : isSubPartOfSelectedParent
                                ? 'bg-[#7c9cd0]/10 border-l-[#7c9cd0]/50 font-medium'
                                : isSubDimmed
                                ? 'opacity-30 grayscale-[25%] hover:opacity-75 hover:grayscale-0 transition-all duration-200 bg-[#FAFAF9] border-l-transparent'
                                : 'bg-[#FAFAF9] hover:bg-[#F4F4F2] transition-colors border-l-transparent'
                            }`}
                            title={
                              isSubDirectlySelected
                                ? 'Đang chọn nhóm này. Nhấp để hủy chọn.'
                                : `Nhấp để chọn ${sub.name}`
                            }
                          >
                            <td className="py-2.5 px-5 pl-12">
                              <div className="flex items-center space-x-2 overflow-hidden">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isSubDirectlySelected
                                      ? 'bg-[#7c9cd0] ring-2 ring-[#7c9cd0]/50'
                                      : 'bg-[#7c9cd0]'
                                  }`}
                                />
                                <span
                                  className={`truncate ${
                                    isSubDirectlySelected
                                      ? 'text-[#24487c] font-bold'
                                      : 'text-[#4A4A46]'
                                  }`}
                                >
                                  {sub.name}
                                </span>
                                {isSubDirectlySelected && (
                                  <span className="shrink-0 ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#7c9cd0] text-white shadow-2xs">
                                    Đang chọn
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-left">
                              <div
                                className={`font-medium ${
                                  isSubDirectlySelected ? 'text-[#153C77] font-bold' : 'text-[#1C1C1A]'
                                }`}
                              >
                                {sub.rate.toFixed(1)}%
                              </div>
                              <div className="w-full bg-[#E7E7E4] h-1.5 mt-1 overflow-hidden">
                                <div
                                  className="h-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(sub.rate, 100)}%`,
                                    ...getProgressGradientStyle(sub.rate),
                                  }}
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-[#8A8A85]">
                              {formatNumber(sub.target)}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-[#4A4A46]">
                              {formatNumber(sub.achieved)}
                            </td>
                            <td className={`py-2.5 px-4 text-center font-mono ${sub.miss > 0 ? 'text-[#dc2626] font-bold' : 'text-[#8A8A85]'}`}>
                              {sub.miss}
                            </td>
                            <td className={`py-2.5 px-4 text-center font-mono ${sub.late > 0 ? 'text-[#dc2626] font-bold' : 'text-[#8A8A85]'}`}>
                              {sub.late}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {getStatusBadge(sub.rate)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drilldown Level 2: Member Performance Breakdown */}
      <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-[#F0F0EE] flex items-center justify-between bg-white min-h-[52px]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#7c9cd0]" />
            <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">
              Chi Tiết KPI Nhân Sự ({visibleKpiRecords.length} thành viên)
            </h2>
          </div>
          <span className="text-xs text-[#24487c] font-medium bg-[#7c9cd0]/15 px-2.5 py-1 rounded border border-[#7c9cd0]/30">
            Nhấp vào từng nhân sự để xem danh sách đề án và lịch sử
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead className="text-[#24487c] uppercase text-[11px] tracking-wider border-b border-[#c2d4ee] bg-[#7c9cd0]/10 font-bold">
              <tr>
                <th className="py-3 px-5 font-bold">Nhân Sự</th>
                <th className="py-3 px-4 font-bold">Team</th>
                <th className="py-3 px-3 font-bold text-center">Cấp Bậc</th>
                <th className="py-3 px-4 font-bold text-right">Tiến Độ</th>
                <th className="py-3 px-4 font-bold text-right">Mục Tiêu</th>
                <th className="py-3 px-4 font-bold text-right">Đã Đạt</th>
                <th className="py-3 px-3 font-bold text-center">Lỗi / Trễ</th>
                <th className="py-3 px-4 font-bold text-center">Đề Án</th>
                <th className="py-3 px-4 font-bold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EE]">
              {visibleKpiRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-[#8A8A85]">
                    Không có dữ liệu nhân sự phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                visibleKpiRecords.map((rec) => {
                  const user = users.find((u) => u.id === rec.user_id);
                  const team = teams.find((t) => t.id === rec.team_id);
                  const rate = rec.target > 0 ? (rec.achieved / rec.target) * 100 : 0;
                  const rankConfig = user?.rank ? RANK_STYLE_CONFIG[user.rank] : null;

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedDetailRecord(rec)}
                      className="hover:bg-[#F6F6F4] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <img
                            src={
                              user?.avatar_url ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={user?.full_name}
                            className="w-7 h-7 rounded-full object-cover border border-[#E7E7E4] shrink-0"
                          />
                          <div className="truncate">
                            <div className="font-semibold text-xs text-[#1C1C1A] truncate">
                              {user?.full_name}
                            </div>
                            <div className="text-[10px] text-[#8A8A85] font-mono">
                              {user?.employee_code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#4A4A46] truncate">
                        {team?.name || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {user?.rank && rankConfig ? (
                          <span
                            style={{
                              backgroundColor: rankConfig.bg,
                              color: rankConfig.text,
                              borderColor: rankConfig.border || 'transparent',
                            }}
                            className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold font-mono border shadow-2xs"
                          >
                            {user.rank}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#8A8A85] font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-xs text-[#1C1C1A]">
                        {rate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#8A8A85]">
                        {rec.target}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-[#1C1C1A]">
                        {rec.achieved}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-[#4A4A46]">
                        <span className={rec.miss_count > 0 ? 'text-[#dc2626] font-bold' : ''}>
                          {rec.miss_count}
                        </span>
                        <span className="text-[#8A8A85] mx-1">/</span>
                        <span className={rec.late_count > 0 ? 'text-[#dc2626] font-bold' : ''}>
                          {rec.late_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded bg-[#F0F0EE] text-[#1C1C1A] text-xs font-semibold font-mono"
                          title={
                            rec.projects && rec.projects.length > 0
                              ? rec.projects.map((p) => `${p.name} (${p.role})`).join(', ')
                              : 'Chưa tham gia đề án nào'
                          }
                        >
                          {rec.projects?.length || 0} đề án
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDetailRecord(rec);
                          }}
                          className="text-xs text-[#24487c] hover:underline font-semibold"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel Import Modal */}
      <KpiImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Member Drilldown Modal */}
      {selectedDetailRecord && (
        <UserKpiDetailModal
          record={selectedDetailRecord}
          user={users.find((u) => u.id === selectedDetailRecord.user_id) || null}
          team={teams.find((t) => t.id === selectedDetailRecord.team_id) || null}
          onClose={() => setSelectedDetailRecord(null)}
        />
      )}
    </div>
  );
};
