import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Target,
  Users,
  Save,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Team, User, KpiRecord } from '../../types';
import { cleanName } from '../../utils/format';

interface SetTeamKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  users: User[];
  kpiRecords: KpiRecord[];
  currentQuarter: string;
  initialTeamId?: string | null;
  onSaveKpiTargets: (
    quarter: string,
    year: number,
    updates: { userId: string; teamId: string; target: number }[]
  ) => void;
}

export const SetTeamKpiModal: React.FC<SetTeamKpiModalProps> = ({
  isOpen,
  onClose,
  teams,
  users,
  kpiRecords,
  currentQuarter,
  initialTeamId,
  onSaveKpiTargets,
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<string>(currentQuarter || 'Q1');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [userTargets, setUserTargets] = useState<Record<string, number>>({});
  const [teamInputTotals, setTeamInputTotals] = useState<Record<string, number>>({});
  const [expandedTeamIds, setExpandedTeamIds] = useState<Record<string, boolean>>({});

  // Master chia theo các khối/team chính cấp 1 (root teams) từ cấu hình
  const displayTeams = useMemo(() => {
    return teams
      .filter((t) => !t.parent_team_id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [teams]);

  // Lấy toàn bộ nhân sự trực thuộc team chính và các team con theo cấu hình
  const getTeamMembers = (teamId: string) => {
    const childTeamIds = teams.filter((t) => t.parent_team_id === teamId).map((t) => t.id);
    const allIds = [teamId, ...childTeamIds];
    return users.filter((u) => allIds.includes(u.team_id));
  };

  // Load KPI records khi mở modal hoặc đổi quý
  useEffect(() => {
    if (!isOpen) return;

    const targetMap: Record<string, number> = {};
    users.forEach((u) => {
      const rec = kpiRecords.find(
        (r) =>
          r.user_id === u.id &&
          r.quarter_id === selectedQuarter &&
          (r.year === selectedYear || !r.year)
      );
      targetMap[u.id] = rec ? rec.target : 100;
    });

    setUserTargets(targetMap);

    // Tính tổng ban đầu cho 4 team chính
    const teamTotals: Record<string, number> = {};
    displayTeams.forEach((t) => {
      const teamUsers = getTeamMembers(t.id);
      const total = teamUsers.reduce((sum, u) => sum + (targetMap[u.id] || 0), 0);
      teamTotals[t.id] = total;
    });
    setTeamInputTotals(teamTotals);

    // Mặc định đóng gọn, không xổ sẵn các team nhỏ
    setExpandedTeamIds({});
  }, [isOpen, selectedQuarter, selectedYear, users, kpiRecords, teams, displayTeams]);

  if (!isOpen) return null;

  // Cập nhật target cho từng user
  const handleUserTargetChange = (userId: string, mainTeamId: string, val: number) => {
    const safeVal = Math.max(0, val);
    const newTargets = { ...userTargets, [userId]: safeVal };
    setUserTargets(newTargets);

    // Tính lại tổng team
    const teamUsers = getTeamMembers(mainTeamId);
    const newTotal = teamUsers.reduce((sum, u) => sum + (newTargets[u.id] || 0), 0);
    setTeamInputTotals((prev) => ({ ...prev, [mainTeamId]: newTotal }));
  };

  // Chia đều tổng KPI của team cho các nhân sự trong team
  const handleDistributeEvenly = (teamId: string, total: number) => {
    const teamUsers = getTeamMembers(teamId);
    if (teamUsers.length === 0) return;

    const count = teamUsers.length;
    const basePerUser = Math.floor(total / count);
    const remainder = total % count;

    const newTargets = { ...userTargets };
    teamUsers.forEach((u, idx) => {
      newTargets[u.id] = basePerUser + (idx < remainder ? 1 : 0);
    });

    setUserTargets(newTargets);
    setTeamInputTotals((prev) => ({ ...prev, [teamId]: total }));
  };

  // Tính tổng KPI toàn công ty
  const grandTotal = Object.values(userTargets).reduce((s, v) => s + (v || 0), 0);

  // Lưu toàn bộ chỉ tiêu
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates = users.map((u) => ({
      userId: u.id,
      teamId: u.team_id,
      target: userTargets[u.id] !== undefined ? userTargets[u.id] : 100,
    }));

    onSaveKpiTargets(selectedQuarter, selectedYear, updates);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E7E7E4] rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#15803D] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white/15">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Thiết Lập Chỉ Tiêu KPI Theo Team (Master Control)
              </h2>
              <p className="text-xs text-white/80">
                Giao chỉ tiêu task/hồ sơ cho từng khối phòng ban và từng nhân sự trong kỳ đánh giá
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Control Bar: Chọn kỳ & Tổng quan */}
        <div className="px-6 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-[#475569]">Kỳ đánh giá:</span>
            <div className="inline-flex rounded-lg border border-[#CBD5E1] bg-white p-0.5 text-xs font-semibold">
              {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    selectedQuarter === q
                      ? 'bg-[#15803D] text-white shadow-2xs font-bold'
                      : 'text-[#475569] hover:text-[#1E293B]'
                  }`}
                >
                  Quý {q}/2026
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
              <Layers size={14} className="text-[#15803D]" />
              <span className="text-[#64748B]">Tổng KPI toàn bộ phận:</span>
              <strong className="text-[#15803D] font-mono text-sm">{grandTotal.toLocaleString()}</strong>
              <span className="text-[10px] text-[#64748B]">task</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
              <Users size={14} className="text-[#3B82F6]" />
              <span className="text-[#64748B]">Nhân sự:</span>
              <strong className="text-[#1E293B] font-mono">{users.length}</strong>
            </div>
          </div>
        </div>

        {/* Danh Sách Các Team Để Set KPI */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-3">
            {displayTeams.map((team) => {
              const teamUsers = getTeamMembers(team.id);
              const isExpanded = !!expandedTeamIds[team.id];
              const teamTotal = teamUsers.reduce((s, u) => s + (userTargets[u.id] || 0), 0);
              const inputTotal = teamInputTotals[team.id] ?? teamTotal;

              return (
                <div
                  key={team.id}
                  className="border border-[#E2E8F0] rounded-xl bg-white overflow-hidden shadow-2xs transition-all hover:border-[#CBD5E1]"
                >
                  {/* Header Hàng Team */}
                  <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-[220px]">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTeamIds((prev) => ({
                            ...prev,
                            [team.id]: !prev[team.id],
                          }))
                        }
                        className="p-1 hover:bg-[#F1F5F9] rounded text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
                        title={isExpanded ? 'Thu gọn danh sách nhân sự' : 'Mở rộng chi tiết nhân sự'}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-[#1E293B]">{team.name}</span>
                          <span className="text-[11px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                            {teamUsers.length} nhân sự
                          </span>
                        </div>
                        {team.description && (
                          <div className="text-[11px] text-[#8A8A85] mt-0.5">{team.description}</div>
                        )}
                      </div>
                    </div>

                    {/* Bộ điều khiển Tổng KPI Team */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-[#475569]">Chỉ tiêu Team:</span>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={inputTotal}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setTeamInputTotals((prev) => ({ ...prev, [team.id]: val }));
                            }}
                            className="w-24 px-2.5 py-1 text-right text-xs font-bold font-mono border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#15803D]"
                          />
                          <span className="absolute right-7 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] pointer-events-none">
                            task
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDistributeEvenly(team.id, inputTotal)}
                        className="px-2.5 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1"
                        title="Chia đều chỉ tiêu trên cho các thành viên trong team"
                      >
                        <Sparkles size={12} />
                        <span>Chia đều</span>
                      </button>

                      <div className="text-right min-w-[90px]">
                        <span className="text-[11px] text-[#64748B] block">Hiện tại:</span>
                        <strong className="text-xs font-mono text-[#1E293B]">{teamTotal} task</strong>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách từng nhân sự trong Team khi mở rộng */}
                  {isExpanded && (
                    <div className="border-t border-[#F1F5F9] bg-[#FAFAFA] p-3 space-y-2">
                      <div className="text-[11px] font-bold text-[#64748B] px-3 pb-1 uppercase tracking-wider flex items-center justify-between">
                        <span>Nhân sự trong team</span>
                        <span>Mục tiêu task cá nhân</span>
                      </div>
                      {teamUsers.length === 0 ? (
                        <div className="py-4 text-center text-xs text-[#94A3B8]">
                          Chưa có nhân sự nào được phân vào team này.
                        </div>
                      ) : (
                        teamUsers.map((u) => {
                          const userTarget = userTargets[u.id] !== undefined ? userTargets[u.id] : 100;
                          const userSubTeam = teams.find((t) => t.id === u.team_id);
                          return (
                            <div
                              key={u.id}
                              className="bg-white border border-[#E2E8F0] rounded-lg px-3.5 py-2 flex items-center justify-between hover:border-[#CBD5E1] transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src={
                                    u.avatar_url ||
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                                  }
                                  alt={u.full_name}
                                  className="w-7 h-7 rounded-full object-cover border border-[#E2E8F0]"
                                />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-xs text-[#1E293B]">{cleanName(u.full_name)}</span>
                                    {team.id === 'team-2' && userSubTeam && userSubTeam.id !== 'team-2' && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                                        {userSubTeam.name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#64748B] font-mono">
                                    {u.employee_code} • {u.rank || '—'} • {u.position || 'Nhân viên'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="5"
                                  value={userTarget}
                                  onChange={(e) =>
                                    handleUserTargetChange(
                                      u.id,
                                      team.id,
                                      parseInt(e.target.value, 10) || 0
                                    )
                                  }
                                  className="w-20 px-2 py-1 text-right text-xs font-bold font-mono border border-[#CBD5E1] rounded-md focus:outline-hidden focus:border-[#15803D]"
                                />
                                <span className="text-[11px] text-[#64748B] w-8">task</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer nút hành động */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <div className="text-xs text-[#64748B]">
              Chỉ tiêu KPI sau khi lưu sẽ được áp dụng trực tiếp cho Quý <strong>{selectedQuarter}/{selectedYear}</strong>.
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#475569] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-5 py-2 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Save size={14} />
                <span>Lưu Chỉ Tiêu KPI Cho Các Team</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
