import React, { useState, useMemo } from 'react';
import {
  Star,
  Award,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Users,
  Calendar,
  Edit3,
  ShieldCheck,
  AlertCircle,
  FileText,
  Sliders,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  Save,
  Send,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  EvaluationCriterion,
  MemberEvaluationRecord,
  RANK_STYLE_CONFIG,
  User,
  CriteriaProposal,
} from '../../types';

const cleanName = (name?: string) => {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
};

export const EvaluationModule: React.FC = () => {
  const {
    currentUser,
    users,
    teams,
    evaluationCriteria,
    memberEvaluations,
    criteriaProposals,
    saveMemberEvaluation,
    updateEvaluationCriteria,
    reviewCriteriaProposal,
    isMaster,
    isAdmin,
    isLeaderOrAdmin,
    canViewTeam,
    triggerToast,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'scoring' | 'rubric' | 'proposals'>('scoring');
  const [activeQuarterFilter, setActiveQuarterFilter] = useState<string>('Q1');
  const [activeTeamFilter, setActiveTeamFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Scoring Modal
  const [isScoringModalOpen, setIsScoringModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [scoringForm, setScoringForm] = useState<{
    scores: Record<string, number>;
    note: string;
    status: 'draft' | 'finalized';
  }>({
    scores: {},
    note: '',
    status: 'draft',
  });

  // Edit Rubric Modal (Admin / Master)
  const [isRubricModalOpen, setIsRubricModalOpen] = useState<boolean>(false);
  const [rubricDraft, setRubricDraft] = useState<EvaluationCriterion[]>([]);
  const [adminProposalNote, setAdminProposalNote] = useState<string>('');

  // Proposal review modal
  const [selectedProposal, setSelectedProposal] = useState<CriteriaProposal | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');

  // Filter users visible for evaluation
  const evaluatableUsers = useMemo(() => {
    return users.filter((u) => {
      if (!isAdmin && !isMaster) {
        if (!canViewTeam(u.team_id)) return false;
      }
      if (activeTeamFilter !== 'all') {
        if (activeTeamFilter === 'team-2') {
          const team2Ids = ['team-2', 'team-2a', 'team-2b', 'team-2s'];
          if (!team2Ids.includes(u.team_id)) return false;
        } else if (u.team_id !== activeTeamFilter) {
          return false;
        }
      }
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const rawName = cleanName(u.full_name).toLowerCase();
        const matchName = rawName.includes(kw);
        const matchCode = u.employee_code.toLowerCase().includes(kw);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [users, isAdmin, isMaster, canViewTeam, activeTeamFilter, searchKeyword]);

  // Map users to their evaluation record in current quarter
  const memberRecords = useMemo(() => {
    return evaluatableUsers.map((u) => {
      const record = memberEvaluations.find(
        (e) => e.user_id === u.id && e.quarter_id === activeQuarterFilter
      );
      return { user: u, evaluation: record || null };
    });
  }, [evaluatableUsers, memberEvaluations, activeQuarterFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = memberRecords.length;
    const evaluated = memberRecords.filter((r) => r.evaluation !== null).length;
    const finalized = memberRecords.filter((r) => r.evaluation?.status === 'finalized').length;
    const scores = memberRecords
      .filter((r) => r.evaluation && r.evaluation.total_score > 0)
      .map((r) => r.evaluation!.total_score);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';

    const gradeCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    memberRecords.forEach((r) => {
      if (r.evaluation?.rank_grade) {
        const g = r.evaluation.rank_grade as keyof typeof gradeCounts;
        if (gradeCounts[g] !== undefined) gradeCounts[g]++;
      }
    });

    return { total, evaluated, finalized, avgScore, gradeCounts };
  }, [memberRecords]);

  // Pending criteria proposals count
  const pendingProposals = useMemo(() => {
    return criteriaProposals.filter((p) => p.status === 'pending');
  }, [criteriaProposals]);

  // Open scoring modal for an employee
  const handleOpenScoring = (user: User, existingEval: MemberEvaluationRecord | null) => {
    setSelectedUser(user);
    if (existingEval) {
      setScoringForm({
        scores: { ...existingEval.scores },
        note: existingEval.note || '',
        status: existingEval.status || 'draft',
      });
    } else {
      // Default initial score levels (e.g. level 3 for standard criteria)
      const initialScores: Record<string, number> = {};
      evaluationCriteria.forEach((crit) => {
        initialScores[crit.id] = crit.id === 'crit-late' ? 0 : 3;
      });
      setScoringForm({
        scores: initialScores,
        note: '',
        status: 'draft',
      });
    }
    setIsScoringModalOpen(true);
  };

  // Calculate live score in modal
  const computedScore = useMemo(() => {
    let total = 0;
    evaluationCriteria.forEach((crit) => {
      const level = scoringForm.scores[crit.id] || 0;
      if (crit.id === 'crit-late') {
        // Penalty or 0
        if (level > 0) {
          total -= (level - 1) * 2;
        }
      } else {
        total += level * crit.weight;
      }
    });
    total = Math.max(0, Math.min(100, total));

    let grade = 'B';
    if (total >= 90) grade = 'S';
    else if (total >= 80) grade = 'A';
    else if (total >= 70) grade = 'B';
    else if (total >= 60) grade = 'C';
    else grade = 'D';

    return { total, grade };
  }, [evaluationCriteria, scoringForm.scores]);

  // Save evaluation (Draft or Finalized)
  const handleSaveEvaluation = (status: 'draft' | 'finalized') => {
    if (!selectedUser) return;
    const newRecord: MemberEvaluationRecord = {
      id: `eval-${selectedUser.id}-${activeQuarterFilter}`,
      user_id: selectedUser.id,
      evaluator_id: currentUser.id,
      team_id: selectedUser.team_id,
      quarter_id: activeQuarterFilter,
      year: 2026,
      scores: scoringForm.scores,
      total_score: computedScore.total,
      rank_grade: computedScore.grade,
      note: scoringForm.note,
      status,
      updated_at: new Date().toISOString(),
    };
    saveMemberEvaluation(newRecord);
    setIsScoringModalOpen(false);
  };

  // Open Rubric Edit Modal
  const handleOpenRubricEdit = () => {
    setRubricDraft(JSON.parse(JSON.stringify(evaluationCriteria)));
    setAdminProposalNote('');
    setIsRubricModalOpen(true);
  };

  // Handle saving rubric changes
  const handleSaveRubric = () => {
    const res = updateEvaluationCriteria(rubricDraft, adminProposalNote);
    setIsRubricModalOpen(false);
    if (res.status === 'proposed') {
      setActiveSubTab('proposals');
    }
  };

  const getRankBadgeColor = (grade?: string) => {
    switch (grade) {
      case 'S':
        return 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]';
      case 'A':
        return 'bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]';
      case 'B':
        return 'bg-[#F0FDF4] text-[#15803D] border-[#86EFAC]';
      case 'C':
        return 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1]';
      case 'D':
        return 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]';
      default:
        return 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">
              Đánh Giá Năng Lực & Tiêu Chuẩn Nhân Sự
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#7c9cd0]/20 text-[#24487c] border border-[#7c9cd0]/40">
              Quý {activeQuarterFilter}
            </span>
          </div>
          <p className="text-xs text-[#8A8A85] mt-1">
            Bảng tiêu chuẩn năng lực & thang điểm theo quý. Các Leader chấm điểm thành viên; Admin & Master quản trị cấu hình tiêu chí.
          </p>
        </div>

        {/* Sub-tabs & Action */}
        <div className="flex items-center space-x-2">
          <div className="flex p-0.5 rounded-lg bg-[#EAEAE7] border border-[#E7E7E4] text-xs">
            <button
              onClick={() => setActiveSubTab('scoring')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'scoring'
                  ? 'bg-white text-[#24487c] shadow-xs'
                  : 'text-[#4A4A46] hover:text-[#1C1C1A]'
              }`}
            >
              <Users size={13} />
              <span>Chấm Điểm Nhân Sự</span>
            </button>
            <button
              onClick={() => setActiveSubTab('rubric')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'rubric'
                  ? 'bg-white text-[#24487c] shadow-xs'
                  : 'text-[#4A4A46] hover:text-[#1C1C1A]'
              }`}
            >
              <Sliders size={13} />
              <span>Bảng Tiêu Chuẩn & Thang Điểm</span>
            </button>
            <button
              onClick={() => setActiveSubTab('proposals')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer relative ${
                activeSubTab === 'proposals'
                  ? 'bg-white text-[#24487c] shadow-xs'
                  : 'text-[#4A4A46] hover:text-[#1C1C1A]'
              }`}
            >
              <FileText size={13} />
              <span>Đề Xuất Duyệt</span>
              {pendingProposals.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#B85D5D] ml-0.5" />
              )}
            </button>
          </div>

          {(isAdmin || isMaster) && (
            <button
              onClick={handleOpenRubricEdit}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#7c9cd0] hover:bg-[#6788be] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Chỉnh Sửa Tiêu Chuẩn</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice if Admin proposal pending */}
      {pendingProposals.length > 0 && (
        <div className="p-3 bg-[#FEF9C3]/50 border border-[#FDE047] rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#854D0E]">
            <AlertCircle size={16} className="text-[#CA8A04] shrink-0" />
            <span>
              <strong>Thông báo phê duyệt:</strong> Có {pendingProposals.length} đề xuất điều chỉnh bảng tiêu chuẩn & thang điểm từ Admin đang chờ Master xem xét duyệt.
            </span>
          </div>
          <button
            onClick={() => setActiveSubTab('proposals')}
            className="text-xs font-bold text-[#854D0E] underline hover:text-[#713F12] cursor-pointer"
          >
            Xem & Phê Duyệt Ngay →
          </button>
        </div>
      )}

      {/* SUB-TAB 1: CHẤM ĐIỂM NHÂN SỰ */}
      {activeSubTab === 'scoring' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[#E7E7E4] rounded-lg p-3 shadow-2xs">
              <div className="text-[11px] text-[#8A8A85] font-medium uppercase tracking-wider">Tiến Độ Đánh Giá</div>
              <div className="text-xl font-bold text-[#1C1C1A] mt-1">
                {stats.evaluated} <span className="text-xs text-[#8A8A85] font-normal">/ {stats.total} nhân sự</span>
              </div>
              <div className="text-[11px] text-[#15803D] mt-0.5 font-medium">
                {stats.finalized} đã chốt kết quả
              </div>
            </div>

            <div className="bg-white border border-[#E7E7E4] rounded-lg p-3 shadow-2xs">
              <div className="text-[11px] text-[#8A8A85] font-medium uppercase tracking-wider">Điểm Trung Bình Bộ Phận</div>
              <div className="text-xl font-bold text-[#24487c] mt-1">
                {stats.avgScore} <span className="text-xs text-[#8A8A85] font-normal">/ 100đ</span>
              </div>
              <div className="text-[11px] text-[#8A8A85] mt-0.5">
                Thang điểm tối đa 100
              </div>
            </div>

            <div className="bg-white border border-[#E7E7E4] rounded-lg p-3 shadow-2xs col-span-2">
              <div className="text-[11px] text-[#8A8A85] font-medium uppercase tracking-wider">Phân Bố Hạng Quý {activeQuarterFilter}</div>
              <div className="flex items-center space-x-3 mt-1.5">
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]">
                  Hạng S: {stats.gradeCounts.S}
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-[#EFF6FF] text-[#1E40AF] border border-[#93C5FD]">
                  Hạng A: {stats.gradeCounts.A}
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]">
                  Hạng B: {stats.gradeCounts.B}
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1]">
                  Hạng C: {stats.gradeCounts.C}
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]">
                  Hạng D: {stats.gradeCounts.D}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 bg-white border border-[#E7E7E4] rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="flex items-center space-x-1.5 text-[#8A8A85]">
                <Filter size={14} />
                <span className="font-semibold text-[#1C1C1A]">Bộ lọc:</span>
              </div>

              {/* Quarter Filter */}
              <div className="relative w-[130px]">
                <select
                  value={activeQuarterFilter}
                  onChange={(e) => setActiveQuarterFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 pr-7 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden cursor-pointer"
                >
                  <option value="Q1">Quý 1/2026</option>
                  <option value="Q2">Quý 2/2026</option>
                  <option value="Q3">Quý 3/2026</option>
                  <option value="Q4">Quý 4/2026</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8A8A85]">
                  <Calendar size={12} />
                </div>
              </div>

              {/* Team Filter */}
              <div className="relative w-[150px]">
                <select
                  value={activeTeamFilter}
                  onChange={(e) => setActiveTeamFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 pr-7 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả Team</option>
                  <option value="team-1">1課</option>
                  <option value="team-2">2課</option>
                  <option value="team-2a">　└ 2課-A</option>
                  <option value="team-2b">　└ 2課-B</option>
                  <option value="team-2s">　└ 2課-S</option>
                  <option value="team-3">3課</option>
                  <option value="team-gs">GS</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8A8A85]">
                  <Users size={12} />
                </div>
              </div>

              {activeTeamFilter !== 'all' && (
                <button
                  onClick={() => setActiveTeamFilter('all')}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-[#24487c] bg-[#7c9cd0]/10 rounded border border-[#7c9cd0]/30 hover:bg-[#7c9cd0]/20 font-medium cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Xóa lọc team</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo tên hoặc mã NV..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="bg-[#F6F6F4] border border-[#E7E7E4] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#1C1C1A] w-56 focus:outline-hidden hover:border-[#8A8A85] transition-colors"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85]" />
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-[#F0F0EE] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#7c9cd0]" />
                <span className="font-bold text-[#1C1C1A] uppercase tracking-wider text-[11px]">
                  DANH SÁCH NHÂN SỰ CHẤM ĐIỂM QUÝ {activeQuarterFilter} ({memberRecords.length})
                </span>
              </div>
              <span className="text-[11px] text-[#8A8A85]">
                Nhấp vào "Chấm điểm" để xem bảng tiêu chuẩn 7 mục và cho điểm từng cá nhân
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[#24487c] text-[11px] tracking-wider uppercase bg-[#7c9cd0]/10 border-b border-[#c2d4ee] font-bold">
                    <th className="py-3 px-4">Nhân Sự</th>
                    <th className="py-3 px-3 text-center">Cấp Bậc</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Điểm Từng Mục (7 Tiêu chí)</th>
                    <th className="py-3 px-4 text-center">Tổng Điểm</th>
                    <th className="py-3 px-3 text-center">Xếp Hạng</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0EE]">
                  {memberRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-[#8A8A85]">
                        Không tìm thấy nhân sự nào theo tiêu chí tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    memberRecords.map(({ user: member, evaluation: evalRec }) => {
                      const team = teams.find((t) => t.id === member.team_id);
                      const rankConfig = member?.rank ? RANK_STYLE_CONFIG[member.rank] : null;
                      const memberDisplayName = cleanName(member?.full_name);

                      return (
                        <tr key={member.id} className="hover:bg-[#FAFAF9] transition-colors">
                          {/* Member */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={
                                  member?.avatar_url ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={memberDisplayName}
                                className="w-8 h-8 rounded-full object-cover border border-[#E7E7E4] shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-[#1C1C1A] truncate">{memberDisplayName}</div>
                                <div className="text-[10px] text-[#8A8A85] font-mono">{member?.employee_code}</div>
                              </div>
                            </div>
                          </td>

                          {/* Rank */}
                          <td className="py-3 px-3 text-center">
                            {member?.rank && rankConfig ? (
                              <span
                                style={{
                                  backgroundColor: rankConfig.bg,
                                  color: rankConfig.text,
                                  borderColor: rankConfig.border || 'transparent',
                                }}
                                className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-bold border"
                              >
                                {member.rank}
                              </span>
                            ) : (
                              <span className="text-[#8A8A85] font-mono">—</span>
                            )}
                          </td>

                          {/* Team */}
                          <td className="py-3 px-4">
                            <span className="font-medium text-xs text-[#24487c] bg-[#7c9cd0]/10 px-2 py-0.5 rounded border border-[#7c9cd0]/20">
                              {team?.name || '—'}
                            </span>
                          </td>

                          {/* Scores breakdown mini pills */}
                          <td className="py-3 px-4">
                            {evalRec?.scores ? (
                              <div className="flex items-center space-x-1 text-[10px]">
                                <span title="Tác vụ (x5)" className="px-1.5 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0] font-mono">
                                  T:{evalRec.scores['crit-task'] ? evalRec.scores['crit-task'] * 5 : '—'}
                                </span>
                                <span title="Linh hoạt (x4)" className="px-1.5 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0] font-mono">
                                  LH:{evalRec.scores['crit-flexibility'] ? evalRec.scores['crit-flexibility'] * 4 : '—'}
                                </span>
                                <span title="Horenso (x4)" className="px-1.5 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0] font-mono">
                                  HR:{evalRec.scores['crit-horenso'] ? evalRec.scores['crit-horenso'] * 4 : '—'}
                                </span>
                                <span title="Chất lượng (x3)" className="px-1.5 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0] font-mono">
                                  CL:{evalRec.scores['crit-quality'] ? evalRec.scores['crit-quality'] * 3 : '—'}
                                </span>
                                <span title="Tiếng Nhật (x2)" className="px-1.5 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0] font-mono">
                                  JP:{evalRec.scores['crit-japanese'] ? evalRec.scores['crit-japanese'] * 2 : '—'}
                                </span>
                                <span title="KPI (x2)" className="px-1.5 py-0.5 bg-[#F1F5F9] rounded border border-[#E2E8F0] font-mono">
                                  KPI:{evalRec.scores['crit-kpi'] ? evalRec.scores['crit-kpi'] * 2 : '—'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#8A8A85] text-[11px] italic">Chưa nhập điểm</span>
                            )}
                          </td>

                          {/* Total Score */}
                          <td className="py-3 px-4 text-center">
                            {evalRec ? (
                              <span className="font-bold text-sm text-[#1C1C1A] font-mono">
                                {evalRec.total_score}
                                <span className="text-[10px] text-[#8A8A85] font-normal">/100</span>
                              </span>
                            ) : (
                              <span className="text-[#8A8A85] font-mono">—</span>
                            )}
                          </td>

                          {/* Rank Grade */}
                          <td className="py-3 px-3 text-center">
                            {evalRec?.rank_grade ? (
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs border ${getRankBadgeColor(
                                  evalRec.rank_grade
                                )}`}
                              >
                                {evalRec.rank_grade}
                              </span>
                            ) : (
                              <span className="text-[#8A8A85]">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {evalRec?.status === 'finalized' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]">
                                <CheckCircle2 size={11} />
                                <span>Đã chốt điểm</span>
                              </span>
                            ) : evalRec?.status === 'draft' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]">
                                <Clock size={11} />
                                <span>Bản nháp</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                                <span>Chưa đánh giá</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleOpenScoring(member, evalRec)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#7c9cd0]/15 hover:bg-[#7c9cd0]/25 text-[#24487c] border border-[#7c9cd0]/30 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Edit3 size={12} />
                              <span>{evalRec ? 'Xem / Sửa điểm' : 'Chấm điểm'}</span>
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
        </div>
      )}

      {/* SUB-TAB 2: BẢNG TIÊU CHUẨN & THANG ĐIỂM (RUBRIC) */}
      {activeSubTab === 'rubric' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-[#E7E7E4] rounded-lg shadow-2xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1A]">
                Bảng Thang Điểm Năng Lực & Tiêu Chuẩn Đánh Giá
              </h2>
              <p className="text-xs text-[#8A8A85] mt-0.5">
                Mỗi mục có hệ số / thang điểm riêng. Tổng điểm tối đa: 100 điểm. Quyền chỉnh sửa thuộc Admin và Master (Admin sửa phải được Master duyệt).
              </p>
            </div>
            {(isAdmin || isMaster) && (
              <button
                onClick={handleOpenRubricEdit}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#7c9cd0] hover:bg-[#6788be] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 size={13} />
                <span>{isMaster ? 'Chỉnh Sửa (Quyền Master)' : 'Đề Xuất Chỉnh Sửa (Admin)'}</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[#24487c] text-[11px] tracking-wider uppercase bg-[#7c9cd0]/10 border-b border-[#c2d4ee] font-bold">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-4 w-44">Hạng Mục (Tiêu Chí)</th>
                    <th className="py-3 px-3 w-28 text-center">Thang Điểm / Hệ Số</th>
                    <th className="py-3 px-3 w-40">Mức 1</th>
                    <th className="py-3 px-3 w-40">Mức 2</th>
                    <th className="py-3 px-3 w-44">Mức 3 (Chuẩn)</th>
                    <th className="py-3 px-3 w-44">Mức 4</th>
                    <th className="py-3 px-3 w-48">Mức 5 (Tối đa)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0EE]">
                  {evaluationCriteria.map((crit, idx) => (
                    <tr key={crit.id} className="hover:bg-[#FAFAF9] transition-colors align-top">
                      <td className="py-3.5 px-3 text-center font-bold text-[#8A8A85]">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-xs text-[#1C1C1A]">{crit.name}</div>
                        <div className="text-[11px] text-[#24487c] mt-0.5">{crit.vietnamese_name}</div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="font-bold text-sm text-[#24487c] font-mono">
                          x{crit.weight}
                        </div>
                        <div className="text-[10px] text-[#8A8A85]">
                          {crit.weight > 0 ? `Max: ${crit.weight * 5}đ` : 'Trừ điểm'}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-[#4A4A46] leading-relaxed whitespace-pre-line bg-[#F9FAFB]/50">
                        {crit.levels.level1}
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-[#4A4A46] leading-relaxed whitespace-pre-line">
                        {crit.levels.level2}
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-[#1E3A8A] font-medium leading-relaxed whitespace-pre-line bg-[#EFF6FF]/30 border-x border-[#E2E8F0]/40">
                        {crit.levels.level3}
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-[#4A4A46] leading-relaxed whitespace-pre-line">
                        {crit.levels.level4}
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-[#14532D] leading-relaxed whitespace-pre-line bg-[#F0FDF4]/30">
                        {crit.levels.level5}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ĐỀ XUẤT DUYỆT (ADMIN & MASTER WORKFLOW) */}
      {activeSubTab === 'proposals' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-[#E7E7E4] rounded-lg shadow-2xs">
            <h2 className="text-sm font-bold text-[#1C1C1A]">
              Quy Trình Phê Duyệt Tiêu Chuẩn (Admin → Master Duyệt)
            </h2>
            <p className="text-xs text-[#8A8A85] mt-0.5">
              Khi Admin chỉnh sửa tiêu chí hoặc thang điểm, thay đổi sẽ được tạo thành đề xuất. Chỉ tài khoản Master mới có quyền bấm phê duyệt áp dụng chính thức vào hệ thống.
            </p>
          </div>

          <div className="space-y-3">
            {criteriaProposals.length === 0 ? (
              <div className="bg-white border border-[#E7E7E4] rounded-lg p-10 text-center text-xs text-[#8A8A85]">
                Hiện tại không có đề xuất thay đổi tiêu chuẩn nào.
              </div>
            ) : (
              criteriaProposals.map((prop) => (
                <div
                  key={prop.id}
                  className={`bg-white border rounded-lg p-4 transition-all shadow-2xs ${
                    prop.status === 'pending'
                      ? 'border-[#FDE047] ring-1 ring-[#FDE047]'
                      : 'border-[#E7E7E4]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#F0F0EE]">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[#1C1C1A]">
                          Đề xuất từ: {prop.proposed_by_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            prop.status === 'approved'
                              ? 'bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]'
                              : prop.status === 'rejected'
                              ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]'
                              : 'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]'
                          }`}
                        >
                          {prop.status === 'approved'
                            ? 'Đã Phê Duyệt'
                            : prop.status === 'rejected'
                            ? 'Đã Từ Chối'
                            : 'Đang Chờ Master Duyệt'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8A8A85] mt-0.5">
                        Thời gian gửi: {new Date(prop.created_at).toLocaleString('vi-VN')}
                      </div>
                      {prop.review_note && (
                        <div className="text-xs text-[#4A4A46] mt-1 bg-[#F9FAFB] p-2 rounded border border-[#E5E7EB]">
                          <strong>Ghi chú đề xuất:</strong> {prop.review_note}
                        </div>
                      )}
                    </div>

                    {isMaster && prop.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => reviewCriteriaProposal(prop.id, 'approved', 'Master đã xem và chấp thuận.')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                          <Check size={13} />
                          <span>Phê Duyệt Áp Dụng</span>
                        </button>
                        <button
                          onClick={() => reviewCriteriaProposal(prop.id, 'rejected', 'Chưa phù hợp với định hướng quý này.')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-[#B85D5D] hover:bg-[#991B1B] text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                          <X size={13} />
                          <span>Từ Chối</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Summary of proposed criteria */}
                  <div className="mt-3">
                    <div className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wider mb-2">
                      Chi tiết {prop.criteria.length} tiêu chuẩn trong đề xuất:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {prop.criteria.map((c) => (
                        <div key={c.id} className="p-2.5 bg-[#F9FAFB] rounded border border-[#E5E7EB] text-xs">
                          <div className="flex items-center justify-between font-bold text-[#1C1C1A]">
                            <span>{c.name}</span>
                            <span className="font-mono text-[#24487c]">x{c.weight} ({c.weight * 5}đ)</span>
                          </div>
                          <div className="text-[11px] text-[#4A4A46]">{c.vietnamese_name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: CHẤM ĐIỂM CHI TIẾT NHÂN SỰ
         ======================================================== */}
      {isScoringModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-[#E7E7E4] rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#7c9cd0] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    selectedUser.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={selectedUser.full_name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/40"
                />
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    Chấm Điểm Đánh Giá: {cleanName(selectedUser.full_name)}
                  </h2>
                  <p className="text-xs text-white/85">
                    Mã NV: {selectedUser.employee_code} • Cấp bậc: {selectedUser.rank || '—'} • Quý {activeQuarterFilter}/2026
                  </p>
                </div>
              </div>

              {/* Total points live badge */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-[11px] text-white/80">Tổng Điểm</div>
                  <div className="text-xl font-bold font-mono">
                    {computedScore.total} <span className="text-xs text-white/80">/ 100đ</span>
                  </div>
                </div>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shadow-xs ${getRankBadgeColor(computedScore.grade)}`}>
                  {computedScore.grade}
                </div>
                <button
                  onClick={() => setIsScoringModalOpen(false)}
                  className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body - 7 Criteria detailed levels */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-xs text-[#1E40AF] flex items-center space-x-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  Leader bấm chọn mức độ (Mức 1 đến Mức 5) phù hợp nhất với năng lực thực tế của nhân sự trong quý. Điểm sẽ tự động được nhân với hệ số của từng tiêu chuẩn.
                </span>
              </div>

              <div className="space-y-6">
                {evaluationCriteria.map((crit, idx) => {
                  const currentLevel = scoringForm.scores[crit.id] || (crit.id === 'crit-late' ? 0 : 3);
                  const isLate = crit.id === 'crit-late';

                  return (
                    <div key={crit.id} className="border border-[#E2E8F0] rounded-xl p-4 bg-[#FAFAFA]">
                      {/* Criterion Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3 gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-[#7c9cd0] text-white text-[11px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-sm text-[#1C1C1A]">{crit.name}</span>
                            <span className="text-xs text-[#24487c] font-medium">({crit.vietnamese_name})</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-xs">
                          <span className="font-mono bg-[#E2E8F0] text-[#334155] px-2 py-0.5 rounded font-semibold">
                            Hệ số: x{crit.weight}
                          </span>
                          <span className="font-bold font-mono text-[#24487c]">
                            Điểm đạt: {isLate ? (currentLevel === 0 ? '0đ (Không vi phạm)' : `-${(currentLevel - 1) * 2}đ`) : `${currentLevel * crit.weight} / ${crit.weight * 5}đ`}
                          </span>
                        </div>
                      </div>

                      {/* 5 Levels clickable buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                        {[1, 2, 3, 4, 5].map((levelNum) => {
                          const levelKey = `level${levelNum}` as keyof typeof crit.levels;
                          const desc = crit.levels[levelKey];
                          const isSelected = currentLevel === levelNum;
                          const points = isLate ? 0 : levelNum * crit.weight;

                          return (
                            <button
                              key={levelNum}
                              type="button"
                              onClick={() => {
                                setScoringForm((prev) => ({
                                  ...prev,
                                  scores: {
                                    ...prev.scores,
                                    [crit.id]: levelNum,
                                  },
                                }));
                              }}
                              className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#EFF6FF] border-[#3B82F6] ring-2 ring-[#3B82F6]/30 shadow-xs'
                                  : 'bg-white border-[#E2E8F0] hover:border-[#94A3B8]'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className={`text-xs font-bold ${isSelected ? 'text-[#1D4ED8]' : 'text-[#334155]'}`}>
                                    Mức {levelNum}
                                  </span>
                                  <span className="text-[11px] font-mono font-semibold text-[#64748B]">
                                    {points}đ
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#475569] leading-relaxed whitespace-pre-line line-clamp-6">
                                  {desc}
                                </p>
                              </div>

                              <div className="mt-2 pt-1 border-t border-[#F1F5F9] flex items-center justify-end">
                                {isSelected ? (
                                  <span className="text-[10px] text-[#1D4ED8] font-bold flex items-center space-x-0.5">
                                    <Check size={12} />
                                    <span>Đã chọn</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#94A3B8]">Chọn mức</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leader Note */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-[#1C1C1A]">
                  Nhận xét & Đánh giá tổng kết của Leader:
                </label>
                <textarea
                  value={scoringForm.note}
                  onChange={(e) => setScoringForm({ ...scoringForm, note: e.target.value })}
                  placeholder="Ghi nhận điểm nổi bật, điểm cần phát triển và định hướng năng lực trong quý tiếp theo..."
                  rows={3}
                  className="w-full text-xs p-3 border border-[#E7E7E4] rounded-lg focus:outline-hidden hover:border-[#8A8A85] transition-colors"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#F6F6F4] border-t border-[#E7E7E4] flex items-center justify-between shrink-0">
              <div className="text-xs text-[#8A8A85]">
                Đánh giá bởi: <strong>{cleanName(currentUser.full_name)}</strong> ({currentUser.role.toUpperCase()})
              </div>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsScoringModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E7E7E4] text-xs font-semibold text-[#4A4A46] hover:bg-white transition-colors cursor-pointer"
                >
                  Đóng
                </button>
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
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#7c9cd0] hover:bg-[#6788be] text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Check size={14} />
                  <span>Chốt Kết Quả Đánh Giá</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: CHỈNH SỬA BẢNG TIÊU CHUẨN & THANG ĐIỂM
         ======================================================== */}
      {isRubricModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-[#E7E7E4] rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-[#24487c] text-white flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-bold">
                  {isMaster ? 'Quản Trị Bảng Tiêu Chuẩn & Thang Điểm (Master)' : 'Đề Xuất Chỉnh Sửa Tiêu Chuẩn & Thang Điểm (Admin)'}
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  {isMaster
                    ? 'Master có quyền chỉnh sửa trực tiếp và áp dụng ngay vào hệ thống.'
                    : 'Admin có quyền đề xuất chỉnh sửa; đề xuất phải được Master duyệt trước khi áp dụng.'}
                </p>
              </div>
              <button
                onClick={() => setIsRubricModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!isMaster && (
                <div className="p-3 bg-[#FEF9C3] border border-[#FDE047] rounded-lg text-xs text-[#854D0E] flex items-center space-x-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>
                    <strong>Quy định phê duyệt:</strong> Bạn đang đăng nhập với quyền Admin. Các sửa đổi về tiêu chuẩn và hệ số thang điểm sẽ được tạo thành đề xuất gửi cho Master phê duyệt.
                  </span>
                </div>
              )}

              {/* Note input for Admin */}
              {!isMaster && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1C1A]">Lý do / Ghi chú đề xuất gửi Master:</label>
                  <input
                    type="text"
                    value={adminProposalNote}
                    onChange={(e) => setAdminProposalNote(e.target.value)}
                    placeholder="Ví dụ: Điều chỉnh tăng hệ số tính chủ động và bổ sung tiêu chí chi tiết cho quý mới..."
                    className="w-full text-xs p-2.5 border border-[#E7E7E4] rounded-lg focus:outline-hidden"
                  />
                </div>
              )}

              {/* Criteria List editable */}
              <div className="space-y-4">
                {rubricDraft.map((crit, idx) => (
                  <div key={crit.id} className="p-4 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-[#24487c] text-white text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-xs text-[#1C1C1A]">{crit.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-bold text-[#24487c]">Hệ số thang điểm:</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={crit.weight}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setRubricDraft((prev) =>
                              prev.map((c) => (c.id === crit.id ? { ...c, weight: val } : c))
                            );
                          }}
                          className="w-16 text-center text-xs font-bold p-1 bg-white border border-[#CBD5E1] rounded"
                        />
                        <span className="text-xs text-[#64748B]">Max: {crit.weight * 5}đ</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-[#64748B]">Tên tiêu chí (Tiếng Nhật):</label>
                        <input
                          type="text"
                          value={crit.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRubricDraft((prev) =>
                              prev.map((c) => (c.id === crit.id ? { ...c, name: val } : c))
                            );
                          }}
                          className="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#64748B]">Tên tiêu chí (Tiếng Việt):</label>
                        <input
                          type="text"
                          value={crit.vietnamese_name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRubricDraft((prev) =>
                              prev.map((c) => (c.id === crit.id ? { ...c, vietnamese_name: val } : c))
                            );
                          }}
                          className="w-full p-2 bg-white border border-[#CBD5E1] rounded text-xs mt-0.5"
                        />
                      </div>
                    </div>

                    {/* Levels Descriptions */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[11px]">
                      {[1, 2, 3, 4, 5].map((lvl) => {
                        const lvlKey = `level${lvl}` as keyof typeof crit.levels;
                        return (
                          <div key={lvl}>
                            <span className="font-bold text-[#475569]">Mức {lvl}:</span>
                            <textarea
                              rows={4}
                              value={crit.levels[lvlKey]}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRubricDraft((prev) =>
                                  prev.map((c) =>
                                    c.id === crit.id
                                      ? { ...c, levels: { ...c.levels, [lvlKey]: val } }
                                      : c
                                  )
                                );
                              }}
                              className="w-full p-1.5 bg-white border border-[#CBD5E1] rounded mt-0.5 text-[10px] leading-tight"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-[#F6F6F4] border-t border-[#E7E7E4] flex items-center justify-between shrink-0">
              <span className="text-xs text-[#8A8A85]">
                {isMaster ? 'Đang thực hiện bởi Master' : 'Đang thực hiện bởi Admin (Cần Master duyệt)'}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRubricModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E7E7E4] text-xs font-semibold text-[#4A4A46] hover:bg-white"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveRubric}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#24487c] hover:bg-[#1E3A5F] text-xs font-bold text-white shadow-xs"
                >
                  <Save size={14} />
                  <span>{isMaster ? 'Lưu & Áp Dụng Ngay' : 'Gửi Đề Xuất Chờ Master Duyệt'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
