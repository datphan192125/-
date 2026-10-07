import React, { useState, useMemo } from 'react';
import {
  Star,
  Award,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Users,
  UserCheck,
  Calendar,
  Edit3,
  ShieldCheck,
  AlertCircle,
  FileText,
  Sliders,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  Send,
  Eye,
  RotateCcw,
  Globe,
  Lock,
  CheckSquare,
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
    bulkUpdateEvaluationAndMendanVisibility,
    toggleSingleEvaluationVisibility,
    isMaster,
    isAdmin,
    isLeaderOrAdmin,
    canViewTeam,
    triggerToast,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'scoring' | 'rubric' | 'proposals'>('scoring');
  const [activeQuarterFilter, setActiveQuarterFilter] = useState<string>('Q1');
  const [activeTeamFilter, setActiveTeamFilter] = useState<string>('all');
  const [activeMemberFilter, setActiveMemberFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Danh sách nhân sự khả dụng cho bộ lọc theo team đang chọn
  const availableMembersForFilter = useMemo(() => {
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
      return true;
    });
  }, [users, isAdmin, isMaster, canViewTeam, activeTeamFilter]);

  // Bulk selection of users
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedEvalUserIds, setSelectedEvalUserIds] = useState<string[]>([]);

  // Scoring Modal
  const [isScoringModalOpen, setIsScoringModalOpen] = useState<boolean>(false);
  const [isScoringReadOnly, setIsScoringReadOnly] = useState<boolean>(false);
  const [modalQuarter, setModalQuarter] = useState<string>('Q1');
  const [modalYear, setModalYear] = useState<number>(2026);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const isLeader = currentUser.role === 'leader' || currentUser.role === 'subleader';
  const [scoringForm, setScoringForm] = useState<{
    scores: Record<string, number>;
    note: string;
    status: 'draft' | 'finalized';
  }>({
    scores: {},
    note: '',
    status: 'draft',
  });

  // Expandable summary criteria & descriptions (Mở chi tiết ra)
  const [expandedSummaryCritId, setExpandedSummaryCritId] = useState<string | null>(null);
  const [isExpandedAllSummary, setIsExpandedAllSummary] = useState<boolean>(false);
  const [isExpandedDescriptions, setIsExpandedDescriptions] = useState<boolean>(false);
  const [expandedCriteriaIds, setExpandedCriteriaIds] = useState<string[]>([]);

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
      if (activeMemberFilter !== 'all' && u.id !== activeMemberFilter) {
        return false;
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
  }, [users, isAdmin, isMaster, canViewTeam, activeTeamFilter, activeMemberFilter, searchKeyword]);

  // Map users to comparison rows (Previous Quarter vs Current Quarter)
  const evaluationComparisonRows = useMemo(() => {
    const prevQuarterId =
      activeQuarterFilter === 'Q1'
        ? 'Q4'
        : activeQuarterFilter === 'Q2'
        ? 'Q1'
        : activeQuarterFilter === 'Q3'
        ? 'Q2'
        : 'Q3';

    return evaluatableUsers
      .map((u) => {
        const currRecord = memberEvaluations.find(
          (e) => e.user_id === u.id && e.quarter_id === activeQuarterFilter
        );
        const prevRecord = memberEvaluations.find(
          (e) => e.user_id === u.id && e.quarter_id === prevQuarterId
        );

        const currScore = currRecord && currRecord.total_score > 0 ? currRecord.total_score : null;
        const prevScore = prevRecord && prevRecord.total_score > 0 ? prevRecord.total_score : 82; // Fallback previous baseline

        const isPublic = currRecord?.is_public ?? true;
        const prevIsPublic = prevRecord?.is_public ?? true;
        const isLeaderOrAdminUser =
          isMaster ||
          (isAdmin && (u.team_id === currentUser.team_id || canViewTeam(u.team_id))) ||
          (isLeader && canViewTeam(u.team_id));

        // Quý trước vẫn luôn công khai độc lập (không bị ảnh hưởng khi quý này đặt Không Công Khai)
        const canViewPrevScore =
          isMaster ||
          (isAdmin && (u.team_id === currentUser.team_id || canViewTeam(u.team_id))) ||
          (isLeaderOrAdminUser && canViewTeam(u.team_id)) ||
          prevIsPublic;

        // Quý này: Chỉ công khai khi isPublic = true
        const canViewCurrScore =
          isMaster ||
          (isAdmin && (u.team_id === currentUser.team_id || canViewTeam(u.team_id))) ||
          (isLeaderOrAdminUser && canViewTeam(u.team_id)) ||
          isPublic;

        const canEditScore =
          isMaster ||
          (isAdmin && (u.team_id === currentUser.team_id || canViewTeam(u.team_id))) ||
          (isLeader && canViewTeam(u.team_id));
        const canEditVisibility =
          isMaster ||
          (isAdmin && (u.team_id === currentUser.team_id || canViewTeam(u.team_id)));

        // Score diff only visible if user can view current score and previous score
        const scoreDiff =
          canViewCurrScore && canViewPrevScore && currScore !== null && prevScore !== null
            ? currScore - prevScore
            : null;

        return {
          user: u,
          team: teams.find((t) => t.id === u.team_id) || null,
          currRecord,
          prevRecord,
          currScore,
          prevScore,
          scoreDiff,
          isPublic,
          prevIsPublic,
          canViewPrevScore,
          canViewCurrScore,
          canEditScore,
          canEditVisibility,
        };
      })
      .filter((row) => {
        if (visibilityFilter === 'all') return true;
        if (visibilityFilter === 'public') return row.isPublic;
        if (visibilityFilter === 'private') return !row.isPublic;
        return true;
      });
  }, [
    evaluatableUsers,
    memberEvaluations,
    activeQuarterFilter,
    teams,
    isMaster,
    isAdmin,
    isLeader,
    currentUser,
    canViewTeam,
    visibilityFilter,
  ]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = evaluationComparisonRows.length;
    const evaluated = evaluationComparisonRows.filter((r) => r.currScore !== null).length;
    const finalized = evaluationComparisonRows.filter((r) => r.currRecord?.status === 'finalized').length;
    const scores = evaluationComparisonRows
      .filter((r) => r.currScore !== null)
      .map((r) => r.currScore!);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
    const above80 = evaluationComparisonRows.filter((r) => r.currScore !== null && r.currScore >= 80).length;

    return { total, evaluated, finalized, avgScore, above80 };
  }, [evaluationComparisonRows]);

  // Pending criteria proposals count
  const pendingProposals = useMemo(() => {
    return criteriaProposals.filter((p) => p.status === 'pending');
  }, [criteriaProposals]);

  // Bộ lọc phòng ban/team bên trong modal đánh giá
  const [modalTeamFilter, setModalTeamFilter] = useState<string>('all');

  // Danh sách nhân sự để Admin & Master chuyển đổi và đánh giá
  const navigableScoringUsers = useMemo(() => {
    let list = evaluationComparisonRows.map((r) => r.user);
    if (list.length === 0) list = evaluatableUsers;
    return list;
  }, [evaluationComparisonRows, evaluatableUsers]);

  const modalFilteredUsers = useMemo(() => {
    let list = navigableScoringUsers;
    if (modalTeamFilter !== 'all') {
      if (modalTeamFilter === 'team-2') {
        const team2Ids = ['team-2', 'team-2a', 'team-2b', 'team-2s'];
        list = list.filter((u) => team2Ids.includes(u.team_id));
      } else {
        list = list.filter((u) => u.team_id === modalTeamFilter);
      }
    }
    return list;
  }, [navigableScoringUsers, modalTeamFilter]);

  const currentScoringUserIndex = useMemo(() => {
    if (!selectedUser) return -1;
    return modalFilteredUsers.findIndex((u) => u.id === selectedUser.id);
  }, [modalFilteredUsers, selectedUser]);

  const prevScoringUser = currentScoringUserIndex > 0 ? modalFilteredUsers[currentScoringUserIndex - 1] : null;
  const nextScoringUser =
    currentScoringUserIndex >= 0 && currentScoringUserIndex < modalFilteredUsers.length - 1
      ? modalFilteredUsers[currentScoringUserIndex + 1]
      : null;

  const handleNavigateToUser = (targetUser: User, autoSaveCurrent = false) => {
    if (autoSaveCurrent && !isScoringReadOnly) {
      handleSaveEvaluation('draft', false);
    }
    const targetRecord = memberEvaluations.find(
      (e) => e.user_id === targetUser.id && e.quarter_id === modalQuarter && (e.year === modalYear || !e.year)
    );
    handleOpenScoring(targetUser, targetRecord || null, isScoringReadOnly, modalQuarter, modalYear);
  };

  // Open scoring modal for an employee (Hỗ trợ xem chi tiết cả những quý trước và quý hiện tại)
  const handleOpenScoring = (
    user: User,
    existingEval: MemberEvaluationRecord | null,
    readOnly = false,
    targetQuarter: string = activeQuarterFilter,
    targetYear?: number
  ) => {
    setSelectedUser(user);
    const year = targetYear || (targetQuarter === 'Q4' ? 2025 : 2026);
    setModalQuarter(targetQuarter);
    setModalYear(year);

    const isPastQuarter = targetQuarter !== activeQuarterFilter || year !== 2026;
    const canEdit =
      isMaster ||
      (isAdmin && (user.team_id === currentUser.team_id || canViewTeam(user.team_id))) ||
      (isLeader && canViewTeam(user.team_id));
    setIsScoringReadOnly(readOnly || (isPastQuarter && !isMaster));

    const evalRec =
      existingEval ||
      memberEvaluations.find(
        (e) => e.user_id === user.id && e.quarter_id === targetQuarter && (e.year === year || !e.year)
      );

    if (evalRec) {
      setScoringForm({
        scores: { ...evalRec.scores },
        note: evalRec.note || '',
        status: evalRec.status || 'draft',
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

  const handleSwitchModalQuarter = (qId: string, qYear: number) => {
    if (!selectedUser) return;
    setModalQuarter(qId);
    setModalYear(qYear);

    const isPastQuarter = qId !== activeQuarterFilter || qYear !== 2026;
    const canEdit =
      isMaster ||
      (isAdmin && (selectedUser.team_id === currentUser.team_id || canViewTeam(selectedUser.team_id))) ||
      (isLeader && canViewTeam(selectedUser.team_id));
    setIsScoringReadOnly(isPastQuarter && !isMaster);

    const evalRec = memberEvaluations.find(
      (e) => e.user_id === selectedUser.id && e.quarter_id === qId && (e.year === qYear || !e.year)
    );

    if (evalRec) {
      setScoringForm({
        scores: { ...evalRec.scores },
        note: evalRec.note || '',
        status: evalRec.status || 'draft',
      });
    } else {
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
  };

  // Calculate live score in modal
  const computedScore = useMemo(() => {
    let total = 0;
    evaluationCriteria.forEach((crit) => {
      const level = scoringForm.scores[crit.id] ?? (crit.id === 'crit-late' ? 0 : 3);
      if (crit.id === 'crit-late') {
        // Penalty or 0
        if (level > 1) {
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
  const handleSaveEvaluation = (status: 'draft' | 'finalized', closeModal = true) => {
    if (!selectedUser) return;
    const newRecord: MemberEvaluationRecord = {
      id: `eval-${selectedUser.id}-${modalQuarter}-${modalYear}`,
      user_id: selectedUser.id,
      evaluator_id: currentUser.id,
      team_id: selectedUser.team_id,
      quarter_id: modalQuarter,
      year: modalYear,
      scores: scoringForm.scores,
      total_score: computedScore.total,
      rank_grade: computedScore.grade,
      note: scoringForm.note,
      status,
      updated_at: new Date().toISOString(),
    };
    saveMemberEvaluation(newRecord);
    if (closeModal) {
      setIsScoringModalOpen(false);
    }
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
              Bảng Đánh Giá & Tiêu Chuẩn Năng Lực
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#7c9cd0]/20 text-[#24487c] border border-[#7c9cd0]/40">
              Quý {activeQuarterFilter}
            </span>
          </div>
          <p className="text-xs text-[#8A8A85] mt-1">
            Bảng đánh giá nhân sự so sánh điểm quý trước và quý này, mức tăng/giảm, cấp bậc hiện tại và quản lý chế độ hiển thị công khai.
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
              <TrendingUp size={13} />
              <span>Bảng Đánh Giá</span>
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

      {/* SUB-TAB 1: BẢNG ĐÁNH GIÁ (So sánh quý trước vs quý hiện tại, Tăng/Giảm, Cấp bậc, Hiển thị) */}
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
              <div className="text-[11px] text-[#8A8A85] font-medium uppercase tracking-wider">Hồ Sơ Đạt Điểm Cao (≥ 80đ)</div>
              <div className="text-xl font-bold text-[#15803D] mt-1 font-mono">
                {stats.above80} <span className="text-xs text-[#8A8A85] font-normal">/ {stats.total} nhân sự</span>
              </div>
              <div className="text-[11px] text-[#8A8A85] mt-0.5 font-medium">
                Tỉ lệ nhân sự đạt năng lực xuất sắc trong quý {activeQuarterFilter}
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
                  onChange={(e) => {
                    setActiveTeamFilter(e.target.value);
                    setActiveMemberFilter('all');
                  }}
                  className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 pr-7 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả Team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8A8A85]">
                  <Users size={12} />
                </div>
              </div>

              {/* Member Filter (Lọc thành viên) */}
              <div className="relative w-[185px]">
                <select
                  value={activeMemberFilter}
                  onChange={(e) => setActiveMemberFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 pr-7 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden cursor-pointer truncate"
                  title="Lọc bảng theo từng nhân sự cụ thể"
                >
                  <option value="all">Tất cả nhân sự ({availableMembersForFilter.length})</option>
                  {availableMembersForFilter.map((u) => (
                    <option key={u.id} value={u.id}>
                      {cleanName(u.full_name)} ({u.employee_code})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8A8A85]">
                  <UserCheck size={12} />
                </div>
              </div>

              {/* Visibility Filter */}
              <div className="relative w-[160px]">
                <select
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value as any)}
                  className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 pr-7 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả hiển thị</option>
                  <option value="public">🌐 Công Khai</option>
                  <option value="private">🔒 Không Công Khai</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8A8A85]">
                  <Globe size={12} />
                </div>
              </div>

              {/* Chức năng Chọn Nhiều - Hình 4 requirement */}
              {(isMaster || isAdmin) && (
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !isSelectMode;
                    setIsSelectMode(nextMode);
                    if (!nextMode) setSelectedEvalUserIds([]);
                  }}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                    isSelectMode
                      ? 'bg-[#24487c] text-white border-[#24487c] shadow-xs'
                      : 'bg-white text-[#334155] border-[#E7E7E4] hover:bg-[#F8FAFC]'
                  }`}
                  title="Bật/Tắt chế độ tích chọn nhiều nhân sự cùng lúc"
                >
                  <CheckSquare size={13} className="shrink-0" />
                  <span>{isSelectMode ? 'Đóng Chọn Nhiều' : 'Chọn Nhiều'}</span>
                </button>
              )}

              {(activeTeamFilter !== 'all' || activeMemberFilter !== 'all' || visibilityFilter !== 'all' || searchKeyword) && (
                <button
                  onClick={() => {
                    setActiveTeamFilter('all');
                    setActiveMemberFilter('all');
                    setVisibilityFilter('all');
                    setSearchKeyword('');
                  }}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-[#24487c] bg-[#7c9cd0]/10 rounded border border-[#7c9cd0]/30 hover:bg-[#7c9cd0]/20 font-medium cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Xóa bộ lọc</span>
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

          {/* Bulk Action Toolbar for Evaluation Visibility */}
          {selectedEvalUserIds.length > 0 && (
            <div className="p-3 bg-[#1C1C1A] text-white rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#7c9cd0] animate-pulse" />
                <span>Đã chọn <strong className="text-[#7c9cd0]">{selectedEvalUserIds.length}</strong> nhân sự</span>
                {!isMaster && isAdmin && (
                  <span className="text-[10px] text-[#A0A09C] bg-white/10 px-2 py-0.5 rounded">
                    (Chỉ áp dụng cho nhân sự thuộc bộ phận/team quản lý)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    bulkUpdateEvaluationAndMendanVisibility(selectedEvalUserIds, true, activeQuarterFilter);
                    setSelectedEvalUserIds([]);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Globe size={13} />
                  <span>Đặt Công Khai (Cá nhân, Admin & Master)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    bulkUpdateEvaluationAndMendanVisibility(selectedEvalUserIds, false, activeQuarterFilter);
                    setSelectedEvalUserIds([]);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Lock size={13} />
                  <span>Đặt Không Công Khai (Chỉ Admin & Master)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEvalUserIds([])}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-[#E7E7E4] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {/* Members Table */}
          <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-[#F0F0EE] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#7c9cd0]" />
                <span className="font-bold text-[#1C1C1A] uppercase tracking-wider text-[11px]">
                  BẢNG ĐÁNH GIÁ NĂNG LỰC NHÂN SỰ ({evaluationComparisonRows.length})
                </span>
              </div>
              <span className="text-[11px] text-[#8A8A85]">
                So sánh điểm quý trước và quý hiện tại • Cột tăng / giảm điểm • Quản lý chế độ hiển thị
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
                <colgroup>
                  {isSelectMode && <col className="w-[4%]" />}
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead>
                  <tr className="text-[#24487c] text-[11px] tracking-wider uppercase bg-[#7c9cd0]/10 border-b border-[#c2d4ee] font-bold">
                    {isSelectMode && (
                      <th className="py-3 px-2 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={
                            evaluationComparisonRows.filter((r) => r.canEditVisibility).length > 0 &&
                            evaluationComparisonRows
                              .filter((r) => r.canEditVisibility)
                              .every((r) => selectedEvalUserIds.includes(r.user.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              const selectable = evaluationComparisonRows
                                .filter((r) => r.canEditVisibility)
                                .map((r) => r.user.id);
                              setSelectedEvalUserIds(selectable);
                            } else {
                              setSelectedEvalUserIds([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-[#7c9cd0] focus:ring-[#7c9cd0] cursor-pointer"
                          title={isMaster ? 'Chọn tất cả nhân sự hiển thị' : 'Chọn tất cả nhân sự thuộc bộ phận/team quản lý'}
                        />
                      </th>
                    )}
                    <th className="py-3 px-4 whitespace-nowrap">Nhân Sự</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">Cấp Bậc</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">Team</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">
                      Điểm Quý Trước ({activeQuarterFilter === 'Q1' ? 'Q4/2025' : `${activeQuarterFilter === 'Q2' ? 'Q1' : activeQuarterFilter === 'Q3' ? 'Q2' : 'Q3'}/2026`})
                    </th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">Điểm Quý Này ({activeQuarterFilter}/2026)</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">Tăng / Giảm</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">Chế Độ Hiển Thị</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0EE]">
                  {evaluationComparisonRows.length === 0 ? (
                    <tr>
                      <td colSpan={isSelectMode ? 9 : 8} className="py-12 text-center text-xs text-[#8A8A85]">
                        Không tìm thấy nhân sự nào theo tiêu chí tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    evaluationComparisonRows.map(({ user: member, team, currRecord, prevRecord, currScore, prevScore, scoreDiff, isPublic, canViewPrevScore, canViewCurrScore, canEditScore, canEditVisibility }) => {
                      const rankConfig = member?.rank ? RANK_STYLE_CONFIG[member.rank] : null;
                      const memberDisplayName = cleanName(member?.full_name);
                      const isChecked = selectedEvalUserIds.includes(member.id);
                      const prevQuarterId = activeQuarterFilter === 'Q1' ? 'Q4' : activeQuarterFilter === 'Q2' ? 'Q1' : activeQuarterFilter === 'Q3' ? 'Q2' : 'Q3';

                      return (
                        <tr
                          key={member.id}
                          className={`hover:bg-[#FAFAF9] transition-colors ${isChecked ? 'bg-[#7c9cd0]/5' : ''}`}
                        >
                          {/* Checkbox - Only shown when isSelectMode is active (Hình 4) */}
                          {isSelectMode && (
                            <td className="py-3.5 px-2 text-center whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={!canEditVisibility}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEvalUserIds((prev) => [...prev, member.id]);
                                  } else {
                                    setSelectedEvalUserIds((prev) => prev.filter((id) => id !== member.id));
                                  }
                                }}
                                className={`w-4 h-4 rounded border-gray-300 text-[#7c9cd0] focus:ring-[#7c9cd0] ${
                                  canEditVisibility ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                                }`}
                                title={
                                  canEditVisibility
                                    ? `Tích chọn để đổi chế độ hiển thị cho ${memberDisplayName}`
                                    : 'Chỉ Master hoặc Admin của team này mới có thể chọn đổi chế độ hiển thị'
                                }
                              />
                            </td>
                          )}

                          {/* Member */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div
                              onClick={() => {
                                if (member) {
                                  handleOpenScoring(member, currRecord || null, !canEditScore, activeQuarterFilter, 2026);
                                }
                              }}
                              className="flex items-center space-x-3 cursor-pointer group/mem"
                              title={`Bấm để mở xem chi tiết đánh giá năng lực của ${memberDisplayName}`}
                            >
                              <img
                                src={
                                  member?.avatar_url ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={memberDisplayName}
                                className="w-8 h-8 rounded-full object-cover border border-[#E7E7E4] group-hover/mem:border-[#7c9cd0] shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-[#1C1C1A] group-hover/mem:text-[#24487c] group-hover/mem:underline truncate flex items-center space-x-1">
                                  <span>{memberDisplayName}</span>
                                  <Eye size={11} className="opacity-0 group-hover/mem:opacity-100 text-[#24487c] shrink-0 transition-opacity" />
                                </div>
                                <div className="text-[10px] text-[#8A8A85] font-mono">{member?.employee_code}</div>
                              </div>
                            </div>
                          </td>

                          {/* Cấp Bậc Hiện Tại */}
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            {member?.rank && rankConfig ? (
                              <span
                                style={{
                                  backgroundColor: rankConfig.bg,
                                  color: rankConfig.text,
                                  borderColor: rankConfig.border || 'transparent',
                                }}
                                className="inline-block px-2.5 py-0.5 rounded font-mono text-[11px] font-bold border shadow-2xs whitespace-nowrap"
                              >
                                {member.rank}
                              </span>
                            ) : (
                              <span className="text-[#8A8A85] font-mono whitespace-nowrap">—</span>
                            )}
                          </td>

                          {/* Team */}
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span className="font-semibold text-xs text-[#24487c] bg-[#7c9cd0]/10 px-2 py-0.5 rounded border border-[#7c9cd0]/20 inline-block whitespace-nowrap">
                              {team?.name || '—'}
                            </span>
                          </td>

                          {/* Điểm Quý Trước - Quý trước luôn công khai độc lập */}
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            {canViewPrevScore ? (
                              prevScore !== null ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenScoring(member, prevRecord || null, !canEditScore, prevQuarterId, prevQuarterId === 'Q4' ? 2025 : 2026)}
                                  className="whitespace-nowrap inline-flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-[#EFF6FF] transition-colors group cursor-pointer border border-transparent hover:border-[#93C5FD]"
                                  title={`Bấm để xem chi tiết bảng đánh giá Quý ${prevQuarterId} (${prevScore}đ)`}
                                >
                                  <span className="font-bold text-xs text-[#24487c] group-hover:underline tabular-nums">{prevScore}</span>
                                  <span className="text-[10px] text-[#64748B]"> / 100đ</span>
                                  <Eye size={12} className="text-[#7c9cd0] group-hover:text-[#24487c]" />
                                </button>
                              ) : (
                                <span className="text-[#8A8A85] text-xs whitespace-nowrap">—</span>
                              )
                            ) : (
                              <span className="text-[#8A8A85] whitespace-nowrap" title="Bảo mật">
                                <Lock size={12} className="inline text-[#8A8A85]" />
                              </span>
                            )}
                          </td>

                          {/* Điểm Quý Này ({activeQuarterFilter}/2026) - Ổ khóa bảo mật khi Không Công Khai quý này */}
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            {canViewCurrScore ? (
                              currScore !== null ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenScoring(member, currRecord || null, !canEditScore, activeQuarterFilter, 2026)}
                                  className="whitespace-nowrap inline-flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-[#EFF6FF] transition-colors group cursor-pointer border border-transparent hover:border-[#93C5FD]"
                                  title={`Bấm để xem chi tiết bảng đánh giá Quý ${activeQuarterFilter}/2026 (${currScore}đ)`}
                                >
                                  <span className="font-bold text-xs text-[#24487c] group-hover:underline tabular-nums">{currScore}</span>
                                  <span className="text-[10px] text-[#64748B]"> / 100đ</span>
                                  <Eye size={12} className="text-[#7c9cd0] group-hover:text-[#24487c]" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenScoring(member, currRecord || null, !canEditScore, activeQuarterFilter, 2026)}
                                  className="text-xs font-semibold text-[#D97706] bg-[#FEF3C7] hover:bg-[#FDE68A] px-2 py-0.5 rounded border border-[#FCD34D] whitespace-nowrap cursor-pointer transition-colors"
                                  title="Chưa chấm điểm - Bấm để chấm điểm quý này"
                                >
                                  Chưa chấm
                                </button>
                              )
                            ) : (
                              <div className="flex items-center justify-center space-x-1" title="Không công khai quý này (Chỉ Admin & Master được xem)">
                                <div className="px-2 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FCD34D] text-[#B45309] inline-flex items-center space-x-1 whitespace-nowrap">
                                  <Lock size={12} className="text-[#B45309]" />
                                  <span className="text-[10px] font-bold">Bảo mật</span>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Tăng / Giảm */}
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            {canViewCurrScore && canViewPrevScore && scoreDiff !== null ? (
                              <div className="flex items-center justify-center font-bold text-xs whitespace-nowrap tabular-nums">
                                {scoreDiff > 0 ? (
                                  <span className="inline-flex items-center space-x-0.5 text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#86EFAC] whitespace-nowrap">
                                    <TrendingUp size={12} className="shrink-0" />
                                    <span>+{scoreDiff}đ</span>
                                  </span>
                                ) : scoreDiff < 0 ? (
                                  <span className="inline-flex items-center space-x-0.5 text-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 rounded-full border border-[#FCA5A5] whitespace-nowrap">
                                    <TrendingDown size={12} className="shrink-0" />
                                    <span>{scoreDiff}đ</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-0.5 text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full border border-[#CBD5E1] whitespace-nowrap">
                                    <Minus size={12} className="shrink-0" />
                                    <span>= 0đ</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#8A8A85] whitespace-nowrap">—</span>
                            )}
                          </td>

                          {/* Chế Độ Hiển Thị */}
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            {isPublic ? (
                              <button
                                type="button"
                                disabled={!canEditVisibility}
                                onClick={() => toggleSingleEvaluationVisibility(member.id, activeQuarterFilter)}
                                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-transform whitespace-nowrap ${
                                  canEditVisibility ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-80'
                                } bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]`}
                                title={
                                  canEditVisibility
                                    ? 'Công Khai (Cá nhân, Admin & Master thấy) - Nhấp để chuyển Không Công Khai'
                                    : 'Công Khai (Không có quyền chỉnh sửa nhân sự khác team)'
                                }
                              >
                                <Globe size={10} className="shrink-0" />
                                <span className="whitespace-nowrap">Công Khai</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!canEditVisibility}
                                onClick={() => toggleSingleEvaluationVisibility(member.id, activeQuarterFilter)}
                                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-transform whitespace-nowrap ${
                                  canEditVisibility ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-80'
                                } bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]`}
                                title={
                                  canEditVisibility
                                    ? 'Không Công Khai (Chỉ Admin & Master thấy) - Nhấp để chuyển sang Công Khai'
                                    : 'Không Công Khai (Không có quyền chỉnh sửa nhân sự khác team)'
                                }
                              >
                                <Lock size={10} className="shrink-0" />
                                <span className="whitespace-nowrap">Không Công Khai</span>
                              </button>
                            )}
                          </td>

                          {/* Actions - Hình 2: Phân quyền xem và sửa điểm */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {canEditScore ? (
                              <button
                                type="button"
                                onClick={() => handleOpenScoring(member, currRecord || null, false)}
                                className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-bold rounded bg-[#24487c] hover:bg-[#1b365d] text-white transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                                title="Mở bảng đánh giá năng lực"
                              >
                                <Edit3 size={12} className="shrink-0" />
                                <span className="whitespace-nowrap">Đánh Giá</span>
                              </button>
                            ) : canViewCurrScore ? (
                              <button
                                type="button"
                                onClick={() => handleOpenScoring(member, currRecord || null, true)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                                title="Xem chi tiết bảng điểm năng lực"
                              >
                                <Eye size={12} className="shrink-0" />
                                <span className="whitespace-nowrap">Xem điểm</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[#8A8A85] text-xs whitespace-nowrap" title="Bảo mật quý này (Chỉ Admin & Master)">
                                <Lock size={12} className="text-[#8A8A85] shrink-0" />
                                <span className="text-[11px]">Bảo mật</span>
                              </span>
                            )}
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
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="text-[#24487c] text-[11px] tracking-wider uppercase bg-[#7c9cd0]/10 border-b border-[#c2d4ee] font-bold">
                    <th className="py-3 px-3 w-12 text-center whitespace-nowrap">STT</th>
                    <th className="py-3 px-4 w-44 whitespace-nowrap">Tiêu Chí Đánh Giá</th>
                    <th className="py-3 px-3 w-28 text-center whitespace-nowrap">Thang Điểm / Hệ Số</th>
                    <th className="py-3 px-3 w-40 whitespace-nowrap">Mức 1</th>
                    <th className="py-3 px-3 w-40 whitespace-nowrap">Mức 2</th>
                    <th className="py-3 px-3 w-44 whitespace-nowrap">Mức 3 (Chuẩn)</th>
                    <th className="py-3 px-3 w-44 whitespace-nowrap">Mức 4</th>
                    <th className="py-3 px-3 w-48 whitespace-nowrap">Mức 5 (Tối đa)</th>
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
      {isScoringModalOpen && selectedUser && (() => {
        const canEditModalUser = selectedUser && !isScoringReadOnly ? (
          isMaster || (isAdmin && (selectedUser.team_id === currentUser.team_id || canViewTeam(selectedUser.team_id))) || (isLeader && canViewTeam(selectedUser.team_id))
        ) : false;

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white border border-[#E7E7E4] rounded-xl shadow-2xl w-full max-w-[96vw] xl:max-w-7xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#24487c] text-white flex items-center justify-between shrink-0">
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
                      {!canEditModalUser ? 'Xem Chi Tiết Bảng Điểm: ' : 'Đánh Giá Năng Lực: '}{cleanName(selectedUser.full_name)}
                    </h2>
                    <p className="text-xs text-white/85">
                      Mã NV: {selectedUser.employee_code} • Cấp bậc: {selectedUser.rank || '—'} • Đang xem: Quý {modalQuarter}/{modalYear} {!canEditModalUser && '(Chế độ xem chi tiết)'}
                    </p>
                  </div>
                </div>

                {/* Total points live badge */}
                <div className="flex items-center space-x-3">
                  <div className="text-right bg-white/20 backdrop-blur-xs px-3.5 py-1.5 rounded-lg border border-white/30">
                    <div className="text-[11px] text-white/80 font-medium">Tổng Điểm Quý {modalQuarter}</div>
                    <div className="text-xl font-bold font-mono text-white flex items-baseline justify-end space-x-1">
                      <span>{computedScore.total}</span>
                      <span className="text-xs text-white/80 font-normal">/ 100đ</span>
                      <span className="ml-1 text-xs px-1.5 py-0.2 rounded font-bold bg-white text-[#24487c]">
                        Hạng {computedScore.grade}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsScoringModalOpen(false)}
                    className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors ml-2 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Quick Switcher: Bộ lọc phòng ban và chọn nhân sự (Chuyên nghiệp, chuẩn quy chuẩn doanh nghiệp) */}
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
                          const usersInTeam = navigableScoringUsers.filter((u) =>
                            newTeam === 'team-2' ? team2Ids.includes(u.team_id) : u.team_id === newTeam
                          );
                          if (usersInTeam.length > 0 && !usersInTeam.some((u) => u.id === selectedUser.id)) {
                            handleNavigateToUser(usersInTeam[0], canEditModalUser);
                          }
                        }
                      }}
                      className="bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1E293B] cursor-pointer hover:border-[#7c9cd0] focus:outline-hidden"
                      title="Lọc danh sách nhân sự đánh giá theo phòng ban"
                    >
                      <option value="all">Tất cả phòng ban ({navigableScoringUsers.length})</option>
                      {teams.map((t) => {
                        const count = navigableScoringUsers.filter((u) =>
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
                      value={selectedUser.id}
                      onChange={(e) => {
                        const found = modalFilteredUsers.find((u) => u.id === e.target.value);
                        if (found) handleNavigateToUser(found, true);
                      }}
                      className="bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1E293B] cursor-pointer hover:border-[#7c9cd0] focus:outline-hidden max-w-[240px] sm:max-w-[320px] truncate"
                      title="Chọn trực tiếp nhân sự cần đánh giá trong danh sách"
                    >
                      {modalFilteredUsers.map((u, idx) => {
                        const uTeam = teams.find((t) => t.id === u.team_id);
                        const uEval = memberEvaluations.find(
                          (e) => e.user_id === u.id && e.quarter_id === modalQuarter && (e.year === modalYear || !e.year)
                        );
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

              {/* Quarter Selector Tabs Bar (Xem chi tiết cả những quý trước nữa) */}
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
                    const isSelected = modalQuarter === q.id && modalYear === q.year;
                    const qEval = memberEvaluations.find(
                      (e) => e.user_id === selectedUser.id && e.quarter_id === q.id && (e.year === q.year || !e.year)
                    );
                    const hasRecord = !!qEval && typeof qEval.total_score === 'number';

                    return (
                      <button
                        key={`${q.id}-${q.year}`}
                        type="button"
                        onClick={() => handleSwitchModalQuarter(q.id, q.year)}
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

                <div className="flex items-center space-x-2">
                  {modalQuarter === 'Q4' && modalYear === 2025 && (
                    <span className="px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D] text-[11px] font-semibold flex items-center space-x-1">
                      <RotateCcw size={12} />
                      <span>Dữ Liệu Quý Trước (Q4/2025)</span>
                    </span>
                  )}
                  {modalQuarter === activeQuarterFilter && modalYear === 2026 && (
                    <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] text-[11px] font-semibold flex items-center space-x-1">
                      <CheckCircle2 size={12} />
                      <span>Kỳ Đang Chọn ({activeQuarterFilter}/2026)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Modal Body - 7 Criteria detailed levels */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Quarter comparison callout */}
                {(() => {
                  const q1Rec = memberEvaluations.find((e) => e.user_id === selectedUser.id && e.quarter_id === 'Q1');
                  const q4Rec = memberEvaluations.find((e) => e.user_id === selectedUser.id && e.quarter_id === 'Q4');
                  const q1Score = q1Rec?.total_score ?? null;
                  const q4Score = q4Rec?.total_score ?? null;
                  const diff = q1Score !== null && q4Score !== null ? q1Score - q4Score : null;

                  return (
                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3 text-xs text-[#1D4ED8] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>
                          Leader bấm chọn mức độ (Mức 1 đến Mức 5) phù hợp nhất với năng lực thực tế của nhân sự. Tổng điểm tối đa 100đ.
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

                {!canEditModalUser && (
                  <div className="p-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg text-xs text-[#92400E] flex items-center space-x-2">
                    <Lock size={15} className="shrink-0 text-[#D97706]" />
                    <span>
                      Đang xem chi tiết bảng điểm Quý {modalQuarter}/{modalYear}. Dưới đây là các mức độ và nhận xét được ghi nhận.
                    </span>
                  </div>
                )}

                {/* BẢNG TỔNG HỢP NĂNG LỰC TOÀN DIỆN 7 TIÊU CHUẨN (NHÌN BAO QUÁT TOÀN BỘ CÁC MỤC) */}
                <div className="bg-white border-2 border-[#7c9cd0]/30 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-gradient-to-r from-[#24487c]/10 via-[#7c9cd0]/10 to-transparent px-4 py-2.5 border-b border-[#CBD5E1] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Sliders size={15} className="text-[#24487c]" />
                      <span className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider whitespace-nowrap">
                        Bảng Tổng Hợp 7 Tiêu Chuẩn Năng Lực (Nhìn Bao Quát Toàn Bộ)
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
                      <strong className="text-[#24487c] font-mono text-sm">{computedScore.total} / 100đ</strong>
                      <span className="ml-1 text-xs px-2 py-0.5 rounded font-bold bg-[#24487c] text-white">
                        Hạng {computedScore.grade}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F8FAFC] text-[#64748B] text-[10px] uppercase font-bold tracking-wider border-b border-[#E2E8F0]">
                        <tr>
                          <th className="py-2.5 px-3 text-center whitespace-nowrap">#</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Tiêu chuẩn năng lực</th>
                          <th className="py-2.5 px-3 text-center whitespace-nowrap">Hệ số</th>
                          <th className="py-2.5 px-3 text-center whitespace-nowrap">Mức đã chọn</th>
                          <th className="py-2.5 px-3 text-center whitespace-nowrap">Điểm quy đổi</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Tóm tắt tiêu chí đạt được</th>
                          <th className="py-2.5 px-3 text-center whitespace-nowrap">Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {evaluationCriteria.map((crit, idx) => {
                          const isLate = crit.id === 'crit-late';
                          const currentLevel = scoringForm.scores[crit.id] ?? (isLate ? 0 : 3);
                          const points = isLate
                            ? currentLevel > 1 ? -((currentLevel - 1) * 2) : 0
                            : currentLevel * crit.weight;
                          const levelKey = `level${currentLevel || 1}` as keyof typeof crit.levels;
                          const desc = isLate
                            ? (currentLevel === 0 ? 'Không vi phạm đi trễ' : `Đi trễ mức ${currentLevel}`)
                            : crit.levels[levelKey] || '';
                          const isRowExpanded = isExpandedAllSummary || expandedSummaryCritId === crit.id;

                          return (
                            <React.Fragment key={crit.id}>
                              <tr className="hover:bg-[#F8FAFC] transition-colors">
                                <td className="py-2 px-3 text-center font-bold text-[#64748B] whitespace-nowrap">{idx + 1}</td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className="font-bold text-[#1C1C1A]">{crit.name}</span>
                                  <span className="text-[10px] text-[#8A8A85] block">{crit.vietnamese_name}</span>
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                  {isLate ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">Điểm trừ</span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F1F5F9] text-[#475569]">x{crit.weight}</span>
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
                                      setExpandedSummaryCritId(expandedSummaryCritId === crit.id ? null : crit.id);
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
                                            Chi Tiết 5 Mức Độ: {crit.name}
                                          </span>
                                          <span className="text-xs text-[#64748B]">({crit.vietnamese_name})</span>
                                          {!isLate && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                                              Hệ số: x{crit.weight}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[11px] text-[#64748B]">
                                          {canEditModalUser ? 'Nhấp chọn trực tiếp mức độ phù hợp bên dưới:' : 'Đang xem mức tiêu chuẩn được áp dụng:'}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-1">
                                        {[1, 2, 3, 4, 5].map((lvl) => {
                                          const lvlKey = `level${lvl}` as keyof typeof crit.levels;
                                          const lvlDesc = crit.levels[lvlKey] || '';
                                          const isLvlSelected = currentLevel === lvl;
                                          const lvlPoints = isLate ? (lvl > 1 ? -((lvl - 1) * 2) : 0) : lvl * crit.weight;

                                          return (
                                            <div
                                              key={lvl}
                                              onClick={() => {
                                                if (canEditModalUser) {
                                                  setScoringForm((prev) => ({
                                                    ...prev,
                                                    scores: { ...prev.scores, [crit.id]: lvl },
                                                  }));
                                                }
                                              }}
                                              className={`p-2.5 rounded-lg border text-left transition-all ${
                                                isLvlSelected
                                                  ? 'bg-[#EFF6FF] border-[#24487c] ring-2 ring-[#24487c]/30 shadow-xs'
                                                  : 'bg-white border-[#E2E8F0] hover:border-[#93C5FD]'
                                              } ${canEditModalUser ? 'cursor-pointer hover:shadow-2xs' : 'cursor-default'}`}
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

                {/* Nhận xét & Đánh giá tổng kết của Quản lý / Người đánh giá */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-[#1C1C1A]">
                    Nhận xét & Đánh giá tổng kết của Quản lý / Người đánh giá:
                  </label>
                  <textarea
                    value={scoringForm.note}
                    readOnly={!canEditModalUser}
                    onChange={(e) => setScoringForm({ ...scoringForm, note: e.target.value })}
                    placeholder={canEditModalUser ? "Ghi nhận điểm nổi bật, điểm cần phát triển và định hướng năng lực trong quý tiếp theo..." : "Chưa có nhận xét."}
                    rows={3}
                    className={`w-full text-xs p-3 border rounded-lg transition-colors ${
                      !canEditModalUser ? 'bg-[#F9FAFB] border-[#E5E7EB] text-[#475569] cursor-default' : 'border-[#E7E7E4] focus:outline-hidden hover:border-[#8A8A85]'
                    }`}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-[#F6F6F4] border-t border-[#E7E7E4] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-[#8A8A85] flex items-center space-x-2">
                  <span>
                    Đánh giá cho: <strong>{cleanName(selectedUser.full_name)}</strong> • Kỳ: <strong>Quý {modalQuarter}/{modalYear}</strong>
                  </span>
                  {nextScoringUser && (
                    <button
                      type="button"
                      onClick={() => handleNavigateToUser(nextScoringUser, canEditModalUser)}
                      className="text-[#24487c] font-bold hover:underline inline-flex items-center space-x-1 cursor-pointer ml-2"
                      title={`Chuyển sang nhân sự kế tiếp: ${cleanName(nextScoringUser.full_name)}`}
                    >
                      <span>Nhân sự kế tiếp: {cleanName(nextScoringUser.full_name)}</span>
                      <ChevronRight size={13} />
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsScoringModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#E7E7E4] text-xs font-semibold text-[#4A4A46] hover:bg-white transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                  {!canEditModalUser && (isMaster || (isAdmin && (selectedUser.team_id === currentUser.team_id || canViewTeam(selectedUser.team_id)))) && (
                    <button
                      type="button"
                      onClick={() => setIsScoringReadOnly(false)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white border border-[#24487c] text-xs font-semibold text-[#24487c] hover:bg-[#24487c]/10 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit3 size={13} />
                      <span>Đánh Giá Quý Này</span>
                    </button>
                  )}
                  {canEditModalUser && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveEvaluation('draft')}
                        className="px-4 py-2 rounded-lg bg-white border border-[#CBD5E1] text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] transition-colors cursor-pointer shadow-2xs"
                      >
                        Lưu Bản Nháp
                      </button>
                      {nextScoringUser && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveEvaluation('draft', false);
                            handleNavigateToUser(nextScoringUser, false);
                          }}
                          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#24487c] hover:bg-[#1b365d] text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
                          title={`Lưu kết quả đánh giá cho ${cleanName(selectedUser.full_name)} và chuyển sang nhân sự kế tiếp: ${cleanName(nextScoringUser.full_name)}`}
                        >
                          <span>Lưu & Sang Nhân Sự Kế Tiếp</span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSaveEvaluation('finalized')}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
                      >
                        <Check size={14} />
                        <span>Hoàn Tất Đánh Giá Quý {modalQuarter}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                    <strong>Quy định phê duyệt:</strong> Tài khoản đang đăng nhập với vai trò Admin. Các sửa đổi về tiêu chuẩn và hệ số thang điểm sẽ được tạo thành đề xuất gửi cho Master phê duyệt.
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
