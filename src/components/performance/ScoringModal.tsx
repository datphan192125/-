import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar,
  History,
  Sparkles,
  Info,
  Lock,
  Sliders,
  Minimize2,
  Maximize2,
  Eye,
  CheckCircle2,
  Edit3,
  Check,
  ArrowRight,
} from 'lucide-react';
import { User, Team, EvaluationCriterion, MemberEvaluationRecord } from '../../types';
import { cleanName } from '../../utils/format';

export interface ScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSelectUser: (user: User) => void;
  initialQuarter?: string;
  initialYear?: number;
  initialReadOnly?: boolean;
  currentUser: User;
  currentQuarter: string;
  teams: Team[];
  navigableUsers: User[];
  evaluationCriteria: EvaluationCriterion[];
  memberEvaluations: MemberEvaluationRecord[];
  onSaveEvaluation: (record: MemberEvaluationRecord) => void;
  canViewTeam: (teamId: string) => boolean;
}

export const ScoringModal: React.FC<ScoringModalProps> = ({
  isOpen,
  onClose,
  user,
  onSelectUser,
  initialQuarter,
  initialYear,
  initialReadOnly,
  currentUser,
  currentQuarter,
  teams,
  navigableUsers,
  evaluationCriteria,
  memberEvaluations,
  onSaveEvaluation,
  canViewTeam,
}) => {
  const isMaster = currentUser.role === 'master';
  const isAdmin = currentUser.role === 'admin' || isMaster;
  const isLeader = currentUser.role === 'leader' || currentUser.role === 'subleader';
  const isMember = currentUser.role === 'member';

  const [scoringQuarter, setScoringQuarter] = useState<string>(initialQuarter || currentQuarter || 'Q1');
  const [scoringYear, setScoringYear] = useState<number>(initialYear || 2026);
  const [isScoringReadOnly, setIsScoringReadOnly] = useState<boolean>(initialReadOnly ?? false);

  const [scoringForm, setScoringForm] = useState<{
    scores: Record<string, number>;
    note: string;
  }>({
    scores: {},
    note: '',
  });

  const [modalTeamFilter, setModalTeamFilter] = useState<string>('all');
  const [expandedSummaryCritId, setExpandedSummaryCritId] = useState<string | null>(null);
  const [isExpandedAllSummary, setIsExpandedAllSummary] = useState<boolean>(false);

  const loadUserQuarterEval = (targetUser: User, qId: string, qYear: number, readOnly?: boolean) => {
    setScoringQuarter(qId);
    setScoringYear(qYear);

    const isPastQuarter = qId !== currentQuarter || qYear !== 2026;
    setIsScoringReadOnly(readOnly !== undefined ? readOnly : (isMember || (isPastQuarter && !isMaster)));

    const existingEval = memberEvaluations.find(
      (e) => e.user_id === targetUser.id && e.quarter_id === qId
    );

    if (existingEval) {
      setScoringForm({
        scores: { ...existingEval.scores },
        note: isMember ? '' : (existingEval.note || ''),
      });
    } else {
      const defaultScores: Record<string, number> = {};
      evaluationCriteria.forEach((crit) => {
        defaultScores[crit.id] = crit.id === 'crit-late' ? 0 : 3;
      });
      setScoringForm({
        scores: defaultScores,
        note: '',
      });
    }
  };

  useEffect(() => {
    if (user && isOpen) {
      const q = initialQuarter || currentQuarter || 'Q1';
      const y = initialYear || (q === 'Q4' ? 2025 : 2026);
      loadUserQuarterEval(user, q, y, isMember ? true : initialReadOnly);
    }
  }, [isOpen, initialQuarter, initialYear, initialReadOnly, isMember]);

  const modalFilteredUsers = useMemo(() => {
    if (isMember || (!isAdmin && !isLeader)) {
      return [user];
    }
    let list = navigableUsers;
    if (isLeader && !isAdmin) {
      list = list.filter((u) => canViewTeam(u.team_id));
    }
    if (modalTeamFilter !== 'all') {
      if (modalTeamFilter === 'team-2') {
        const team2Ids = ['team-2', 'team-2a', 'team-2b', 'team-2s'];
        list = list.filter((u) => team2Ids.includes(u.team_id));
      } else {
        list = list.filter((u) => u.team_id === modalTeamFilter);
      }
    }
    return list;
  }, [navigableUsers, modalTeamFilter, isAdmin, isLeader, isMember, canViewTeam, user]);

  const currentScoringUserIndex = useMemo(() => {
    if (!user || isMember) return -1;
    return modalFilteredUsers.findIndex((u) => u.id === user.id);
  }, [modalFilteredUsers, user, isMember]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const prevScoringUser = !isMember && currentScoringUserIndex > 0 ? modalFilteredUsers[currentScoringUserIndex - 1] : null;
  const nextScoringUser =
    !isMember && currentScoringUserIndex >= 0 && currentScoringUserIndex < modalFilteredUsers.length - 1
      ? modalFilteredUsers[currentScoringUserIndex + 1]
      : null;

  // Thành viên không có quyền chuyển đổi sang nhân sự khác
  const canSwitchUsers = !isMember && (isAdmin || isLeader) && modalFilteredUsers.length > 1;

  const handleSwitchScoringQuarter = (qId: string, qYear: number) => {
    if (!user) return;
    loadUserQuarterEval(user, qId, qYear);
  };

  const computedLiveScore = useMemo(() => {
    let total = 0;
    evaluationCriteria.forEach((crit) => {
      const level = scoringForm.scores[crit.id] ?? (crit.id === 'crit-late' ? 0 : 3);
      if (crit.id === 'crit-late') {
        if (level > 1) {
          total -= (level - 1) * 2;
        }
      } else {
        total += level * crit.weight;
      }
    });
    total = Math.max(0, Math.min(100, total));
    return total;
  }, [scoringForm.scores, evaluationCriteria]);

  const handleSaveEvaluation = (status: 'draft' | 'finalized', closeModal = true) => {
    if (!user || isMember) return;
    const newRecord: MemberEvaluationRecord = {
      id: `eval-${user.id}-${scoringQuarter}-${scoringYear}`,
      user_id: user.id,
      evaluator_id: currentUser.id,
      team_id: user.team_id,
      quarter_id: scoringQuarter,
      year: scoringYear,
      scores: scoringForm.scores,
      total_score: computedLiveScore,
      note: scoringForm.note,
      status,
      updated_at: new Date().toISOString(),
    };
    onSaveEvaluation(newRecord);
    if (closeModal) {
      onClose();
    }
  };

  const handleNavigateToUser = (targetUser: User, autoSaveCurrent = false) => {
    if (isMember || (!isAdmin && !isLeader)) return;
    if (isLeader && !isAdmin && !canViewTeam(targetUser.team_id)) return;
    if (autoSaveCurrent && !isScoringReadOnly) {
      handleSaveEvaluation('draft', false);
    }
    onSelectUser(targetUser);
    loadUserQuarterEval(targetUser, scoringQuarter, scoringYear, isScoringReadOnly);
  };

  if (!isOpen || !user) return null;
  // Thành viên thường chỉ được xem bảng đánh giá của chính mình
  if (isMember && user.id !== currentUser.id) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E7E7E4] rounded-xl shadow-2xl w-full max-w-[96vw] xl:max-w-7xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#24487c] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <img
              src={
                user.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={user.full_name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/40"
            />
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {isScoringReadOnly ? 'Chi Tiết Đánh Giá Năng Lực: ' : 'Đánh Giá Năng Lực: '}{cleanName(user.full_name)}
              </h2>
              <p className="text-xs text-white/85">
                Mã NV: {user.employee_code} • Cấp bậc: {user.rank || '—'} • Đang xem: Quý {scoringQuarter}/{scoringYear}
                {isScoringReadOnly && ' (Chế độ xem chi tiết)'}
              </p>
            </div>
          </div>

          {/* Live Score Badge */}
          <div className="flex items-center space-x-3">
            <div className="text-right bg-white/20 backdrop-blur-xs px-3.5 py-1.5 rounded-lg border border-white/30">
              <div className="text-[11px] text-white/80 font-medium">Tổng Điểm Quý {scoringQuarter}</div>
              <div className="text-xl font-bold font-mono text-white flex items-baseline justify-end space-x-1">
                <span>{computedLiveScore}</span>
                <span className="text-xs text-white/80 font-normal">/ 100đ</span>
                <span className="ml-1 text-xs px-1.5 py-0.2 rounded font-bold bg-white text-[#24487c]">
                  Hạng {computedLiveScore >= 90 ? 'S' : computedLiveScore >= 80 ? 'A' : computedLiveScore >= 70 ? 'B' : computedLiveScore >= 60 ? 'C' : 'D'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors ml-2 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Quick Switcher: Bộ lọc phòng ban và chọn nhân sự (Chỉ dành cho Quản lý / Leader và có nhiều hơn 1 nhân sự) */}
        {canSwitchUsers && (
          <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              {/* Lọc theo Phòng Ban / Team */}
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-[#475569] flex items-center space-x-1 whitespace-nowrap">
                  <Filter size={13} className="text-[#24487c]" />
                  <span>Phòng ban:</span>
                </span>
                <select
                  value={modalTeamFilter}
                  onChange={(e) => {
                    const newTeam = e.target.value;
                    setModalTeamFilter(newTeam);
                    if (newTeam !== 'all') {
                      const team2Ids = ['team-2', 'team-2a', 'team-2b', 'team-2s'];
                      const usersInTeam = navigableUsers.filter((u) =>
                        newTeam === 'team-2' ? team2Ids.includes(u.team_id) : u.team_id === newTeam
                      );
                      if (usersInTeam.length > 0 && !usersInTeam.some((u) => u.id === user.id)) {
                        handleNavigateToUser(usersInTeam[0], !isScoringReadOnly);
                      }
                    }
                  }}
                  className="bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1E293B] cursor-pointer hover:border-[#7c9cd0] focus:outline-hidden"
                  title="Lọc danh sách nhân sự đánh giá theo phòng ban"
                >
                  <option value="all">Tất cả phòng ban ({navigableUsers.length})</option>
                  {teams.map((t) => {
                    const count = navigableUsers.filter((u) =>
                      t.id === 'team-2'
                        ? ['team-2', 'team-2a', 'team-2b', 'team-2s'].includes(u.team_id)
                        : u.team_id === t.id
                    ).length;
                    if (count === 0) return null;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Chọn Nhân Sự Cần Đánh Giá */}
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-[#475569] flex items-center space-x-1 whitespace-nowrap">
                  <Users size={13} className="text-[#24487c]" />
                  <span>Nhân sự ({currentScoringUserIndex >= 0 ? currentScoringUserIndex + 1 : 1}/{modalFilteredUsers.length}):</span>
                </span>
                <select
                  value={user.id}
                  onChange={(e) => {
                    const found = modalFilteredUsers.find((u) => u.id === e.target.value);
                    if (found) handleNavigateToUser(found, true);
                  }}
                  className="bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1E293B] cursor-pointer hover:border-[#7c9cd0] focus:outline-hidden max-w-[240px] sm:max-w-[320px] truncate"
                  title="Chọn trực tiếp nhân sự cần đánh giá trong danh sách"
                >
                  {modalFilteredUsers.map((u, idx) => {
                    const uTeam = teams.find((t) => t.id === u.team_id);
                    const uEval = memberEvaluations.find((e) => e.user_id === u.id && e.quarter_id === scoringQuarter);
                    const uScore = uEval?.total_score;
                    return (
                      <option key={u.id} value={u.id}>
                        {idx + 1}. {cleanName(u.full_name)} ({u.employee_code}) - {uTeam?.name || 'Chưa phân team'} {uScore !== undefined ? `[${uScore}đ]` : '[Chưa đánh giá]'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={!prevScoringUser}
                onClick={() => prevScoringUser && handleNavigateToUser(prevScoringUser, true)}
                className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  prevScoringUser
                    ? 'bg-white hover:bg-[#F1F5F9] text-[#1E293B] border-[#CBD5E1] cursor-pointer shadow-2xs'
                    : 'bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed opacity-50'
                }`}
                title={prevScoringUser ? `Chuyển về đánh giá cho: ${cleanName(prevScoringUser.full_name)}` : 'Đang ở nhân sự đầu tiên trong danh sách'}
              >
                <ChevronLeft size={14} />
                <span className="whitespace-nowrap">Nhân sự trước</span>
              </button>

              <button
                type="button"
                disabled={!nextScoringUser}
                onClick={() => nextScoringUser && handleNavigateToUser(nextScoringUser, true)}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  nextScoringUser
                    ? 'bg-[#24487c] hover:bg-[#1b365d] text-white border-[#24487c] cursor-pointer shadow-xs'
                    : 'bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed opacity-50'
                }`}
                title={nextScoringUser ? `Chuyển sang đánh giá cho nhân sự tiếp theo: ${cleanName(nextScoringUser.full_name)}` : 'Đã là nhân sự cuối cùng trong danh sách'}
              >
                <span className="whitespace-nowrap">Nhân sự tiếp theo</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Quarter Selector Tabs Bar */}
        <div className="bg-[#F8FAFC] border-b border-[#E7E7E4] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#1C1C1A] flex items-center space-x-1.5 mr-1">
              <Calendar size={14} className="text-[#24487c]" />
              <span>Chọn Quý Xem Chi Tiết:</span>
            </span>
            {[
              { id: 'Q1', year: 2026, label: 'Quý 1/2026', tag: 'Quý này' },
              { id: 'Q4', year: 2025, label: 'Quý 4/2025', tag: 'Quý trước' },
              { id: 'Q3', year: 2025, label: 'Quý 3/2025', tag: 'Lưu trữ' },
              { id: 'Q2', year: 2025, label: 'Quý 2/2025', tag: 'Lưu trữ' },
            ].map((q) => {
              const isSelected = scoringQuarter === q.id && scoringYear === q.year;
              const qEval = memberEvaluations.find(
                (e) => e.user_id === user.id && e.quarter_id === q.id && (e.year === q.year || !e.year)
              );
              const hasRecord = !!qEval && typeof qEval.total_score === 'number';

              return (
                <button
                  key={`${q.id}-${q.year}`}
                  type="button"
                  onClick={() => handleSwitchScoringQuarter(q.id, q.year)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#24487c] text-white border-[#24487c] shadow-xs'
                      : 'bg-white text-[#4A4A46] border-[#CBD5E1] hover:border-[#93C5FD] hover:bg-[#EFF6FF]'
                  }`}
                >
                  <span>{q.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : hasRecord
                        ? 'bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {hasRecord ? `${qEval.total_score}đ` : 'Chưa có'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            {scoringQuarter === 'Q4' && scoringYear === 2025 && (
              <span className="px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D] text-[11px] font-semibold flex items-center space-x-1">
                <History size={12} />
                <span>Dữ Liệu Quý Trước (Q4/2025)</span>
              </span>
            )}
            {scoringQuarter === currentQuarter && scoringYear === 2026 && (
              <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] text-[11px] font-semibold flex items-center space-x-1">
                <Sparkles size={12} />
                <span>Kỳ Đánh Giá Hiện Tại ({currentQuarter}/2026)</span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Body: 7 Rubric Criteria */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quarter Comparison Context banner */}
          {(() => {
            const q1Rec = memberEvaluations.find((e) => e.user_id === user.id && e.quarter_id === 'Q1');
            const q4Rec = memberEvaluations.find((e) => e.user_id === user.id && e.quarter_id === 'Q4');
            const q1Score = q1Rec?.total_score ?? null;
            const q4Score = q4Rec?.total_score ?? null;
            const diff = q1Score !== null && q4Score !== null ? q1Score - q4Score : null;

            return (
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3 text-xs text-[#1D4ED8] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Info size={16} className="shrink-0" />
                  <span>
                    Thang điểm gồm 7 tiêu chuẩn chính. Điểm số tính trực tiếp từ hệ số của từng mức độ (tổng tối đa 100đ).
                  </span>
                </div>
                {q4Score !== null && q1Score !== null && (
                  <div className="flex items-center space-x-2 font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-[#BFDBFE]">
                    <span className="text-[#64748B]">Q4/2025: <strong>{q4Score}đ</strong></span>
                    <span className="text-[#8A8A85]">→</span>
                    <span className="text-[#24487c]">Q1/2026: <strong>{q1Score}đ</strong></span>
                    {diff !== null && (
                      <span className={`font-bold ml-1 ${diff > 0 ? 'text-[#15803D]' : diff < 0 ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
                        ({diff > 0 ? `+${diff}đ` : `${diff}đ`})
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {isScoringReadOnly && (
            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#B45309] flex items-center space-x-2">
              <Lock size={15} className="shrink-0 text-[#D97706]" />
              <span>
                Đang xem chi tiết bảng đánh giá đã chốt của Quý {scoringQuarter}/{scoringYear}. Dưới đây là các mức độ đã được ghi nhận.
              </span>
            </div>
          )}

          {/* BẢNG TỔNG HỢP NĂNG LỰC TOÀN DIỆN 7 TIÊU CHUẨN */}
          <div className="bg-white border-2 border-[#7c9cd0]/30 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-gradient-to-r from-[#24487c]/10 via-[#7c9cd0]/10 to-transparent px-4 py-2.5 border-b border-[#CBD5E1] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Sliders size={15} className="text-[#24487c]" />
                <span className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider whitespace-nowrap">
                  Bảng Tổng Hợp 7 Tiêu Chuẩn Năng Lực (Nhìn Bao Quát)
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    const next = !isExpandedAllSummary;
                    setIsExpandedAllSummary(next);
                    if (!next) setExpandedSummaryCritId(null);
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-[#CBD5E1] text-[#24487c] hover:bg-[#EFF6FF] transition-colors cursor-pointer shadow-2xs mr-1"
                  title={isExpandedAllSummary ? 'Thu gọn chi tiết tất cả các tiêu chuẩn' : 'Mở rộng hiển thị chi tiết tất cả 7 tiêu chuẩn'}
                >
                  {isExpandedAllSummary ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  <span>{isExpandedAllSummary ? 'Thu Gọn Chi Tiết' : 'Mở Rộng Toàn Bộ Chi Tiết'}</span>
                </button>
                <span className="text-[#64748B]">Tổng điểm:</span>
                <strong className="text-[#24487c] font-mono text-sm">{computedLiveScore} / 100đ</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAFC] text-[#64748B] text-[10px] uppercase font-bold tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">#</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Tiêu chuẩn</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Trọng số</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Mức đã chọn</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Điểm quy đổi</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Tóm tắt đánh giá</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {evaluationCriteria.map((criterion, idx) => {
                    const isLate = criterion.id === 'crit-late';
                    const currentLevel = scoringForm.scores[criterion.id] ?? (isLate ? 0 : 3);
                    const points = isLate
                      ? currentLevel > 1 ? -((currentLevel - 1) * 2) : 0
                      : currentLevel * criterion.weight;
                    const levelKey = `level${currentLevel || 1}` as keyof typeof criterion.levels;
                    const desc = isLate
                      ? (currentLevel === 0 ? 'Không vi phạm đi trễ' : `Đi trễ mức ${currentLevel}`)
                      : criterion.levels[levelKey] || '';
                    const isRowExpanded = isExpandedAllSummary || expandedSummaryCritId === criterion.id;

                    return (
                      <React.Fragment key={criterion.id}>
                        <tr className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-2 px-3 text-center font-bold text-[#64748B] whitespace-nowrap">{idx + 1}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-bold text-[#1C1C1A]">{criterion.name}</span>
                            {criterion.vietnamese_name && (
                              <span className="text-[10px] text-[#8A8A85] block">{criterion.vietnamese_name}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            {isLate ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">Điểm trừ</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F1F5F9] text-[#475569]">x{criterion.weight}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full font-bold text-xs bg-[#EFF6FF] text-[#24487c] border border-[#93C5FD]">
                              {isLate ? (currentLevel === 0 ? 'Mức 0' : `Mức ${currentLevel}`) : `Mức ${currentLevel}`}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-bold font-mono text-xs whitespace-nowrap text-[#24487c]">
                            {points}đ
                          </td>
                          <td className="py-2 px-3 text-[11px] text-[#4A4A46] max-w-sm truncate" title={desc}>
                            {desc || 'Chưa ghi nhận mô tả'}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedSummaryCritId(expandedSummaryCritId === criterion.id ? null : criterion.id);
                              }}
                              className={`inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                isRowExpanded
                                  ? 'bg-[#24487c] text-white border-[#24487c]'
                                  : 'bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#24487c] border-[#BFDBFE]'
                              }`}
                              title="Nhấp để mở chi tiết 5 mức độ tiêu chuẩn này"
                            >
                              <Eye size={11} />
                              <span>{isRowExpanded ? 'Thu gọn ↑' : 'Mở chi tiết ↓'}</span>
                            </button>
                          </td>
                        </tr>

                        {/* Chi tiết 5 mức độ mở rộng của tiêu chuẩn */}
                        {isRowExpanded && (
                          <tr className="bg-[#F8FAFC]">
                            <td colSpan={7} className="p-3.5 border-b border-[#CBD5E1]">
                              <div className="space-y-2 bg-white p-3 rounded-lg border border-[#CBD5E1] shadow-2xs">
                                <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#F1F5F9] gap-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="w-5 h-5 rounded-full bg-[#24487c] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-[#1E293B]">
                                      Chi Tiết 5 Mức Độ: {criterion.name}
                                    </span>
                                    <span className="text-xs text-[#64748B]">({criterion.vietnamese_name})</span>
                                    {!isLate && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                                        Hệ số: x{criterion.weight}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-[#64748B]">
                                    {!isScoringReadOnly ? 'Nhấp chọn trực tiếp mức độ phù hợp bên dưới:' : 'Đang xem mức tiêu chuẩn được áp dụng:'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-1">
                                  {[1, 2, 3, 4, 5].map((lvl) => {
                                    const lvlKey = `level${lvl}` as keyof typeof criterion.levels;
                                    const lvlDesc = criterion.levels[lvlKey] || '';
                                    const isLvlSelected = currentLevel === lvl;
                                    const lvlPoints = isLate ? (lvl > 1 ? -((lvl - 1) * 2) : 0) : lvl * criterion.weight;

                                    return (
                                      <div
                                        key={lvl}
                                        onClick={() => {
                                          if (!isScoringReadOnly) {
                                            setScoringForm((prev) => ({
                                              ...prev,
                                              scores: { ...prev.scores, [criterion.id]: lvl },
                                            }));
                                          }
                                        }}
                                        className={`p-2.5 rounded-lg border text-left transition-all ${
                                          isLvlSelected
                                            ? 'bg-[#EFF6FF] border-[#24487c] ring-2 ring-[#24487c]/30 shadow-xs'
                                            : 'bg-white border-[#E2E8F0] hover:border-[#93C5FD]'
                                        } ${!isScoringReadOnly ? 'cursor-pointer hover:shadow-2xs' : 'cursor-default'}`}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className={`text-xs font-bold ${isLvlSelected ? 'text-[#24487c]' : 'text-[#334155]'}`}>
                                            Mức {lvl}
                                          </span>
                                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                            isLvlSelected ? 'bg-[#24487c] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                                          }`}>
                                            {lvlPoints > 0 ? `+${lvlPoints}đ` : `${lvlPoints}đ`}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-[#475569] leading-relaxed">
                                          {lvlDesc || 'Mô tả tiêu chuẩn mức này.'}
                                        </p>
                                        {isLvlSelected && (
                                          <div className="mt-1.5 pt-1 border-t border-[#BFDBFE] flex items-center space-x-1 text-[10px] font-bold text-[#24487c]">
                                            <CheckCircle2 size={11} />
                                            <span>Đang chọn mức {lvl}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Note / Feedback */}
          {!isMember && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-[#1C1C1A]">
                Nhận xét và góp ý của Người đánh giá (Quý {scoringQuarter}):
              </label>
              <textarea
                rows={3}
                readOnly={!user || isScoringReadOnly ? true : !(isMaster || (isAdmin && (user.team_id === currentUser.team_id || canViewTeam(user.team_id))) || (isLeader && canViewTeam(user.team_id)))}
                value={scoringForm.note}
                onChange={(e) =>
                  setScoringForm((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder={isScoringReadOnly ? "Chưa có nhận xét cho quý này." : "Ghi nhận điểm nổi bật, định hướng khắc phục và kế hoạch phát triển..."}
                className={`w-full text-xs p-3 border rounded-lg focus:outline-hidden ${
                  isScoringReadOnly ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#475569]' : 'border-[#E7E7E4] focus:border-[#7c9cd0]'
                }`}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F6F6F4] border-t border-[#E7E7E4] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#8A8A85]">
            Đánh giá cho: <strong>{cleanName(user.full_name)}</strong> • Kỳ: <strong>Quý {scoringQuarter}/{scoringYear}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E7E7E4] text-xs font-semibold text-[#4A4A46] hover:bg-white transition-colors cursor-pointer"
            >
              Đóng
            </button>
            {isScoringReadOnly && (isMaster || (isAdmin && (user.team_id === currentUser.team_id || canViewTeam(user.team_id)))) && (
              <button
                type="button"
                onClick={() => setIsScoringReadOnly(false)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white border border-[#7c9cd0] text-xs font-semibold text-[#24487c] hover:bg-[#7c9cd0]/10 transition-colors cursor-pointer shadow-2xs"
              >
                <Edit3 size={13} />
                <span>Đánh Giá Quý Này</span>
              </button>
            )}
            {!isScoringReadOnly && user && (isMaster || (isAdmin && (user.team_id === currentUser.team_id || canViewTeam(user.team_id))) || (isLeader && canViewTeam(user.team_id))) && (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveEvaluation('draft')}
                  className="px-4 py-2 rounded-lg bg-white border border-[#7c9cd0] text-xs font-semibold text-[#24487c] hover:bg-[#7c9cd0]/10 transition-colors cursor-pointer shadow-2xs"
                >
                  Lưu Bản Nháp
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEvaluation('finalized')}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#7c9cd0] hover:bg-[#6788be] text-xs font-bold text-white transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Check size={14} />
                  <span>Chốt Kết Quả Quý {scoringQuarter}</span>
                </button>

                {!isMember && nextScoringUser && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveEvaluation('finalized', false);
                      handleNavigateToUser(nextScoringUser, false);
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-xs font-bold text-white transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    title={`Lưu kết quả đánh giá cho ${cleanName(user.full_name)} và chuyển sang nhân sự kế tiếp: ${cleanName(nextScoringUser.full_name)}`}
                  >
                    <span>Lưu & Đánh Giá Nhân Sự Kế Tiếp</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
