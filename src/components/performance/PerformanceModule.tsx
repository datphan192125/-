import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  TrendingUp,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  ClipboardCheck,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Calendar,
  Layers,
  History,
  Save,
  Check,
  X,
  User as UserIcon,
  Shield,
  FileText,
  Sliders,
  Sparkles,
  Info,
  Plus,
  ShieldCheck,
  HeartHandshake,
  Star,
  Trophy,
  Globe,
  Lock,
  Minus,
  FileCheck,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Users,
  CheckSquare,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  KpiRecord,
  User,
  Team,
  MendanRecord,
  MemberEvaluationRecord,
  EvaluationCriterion,
  AwardProposal,
  RANK_STYLE_CONFIG,
  EmployeeRank,
  ALL_RANKS,
} from '../../types';
import { KpiImportModal } from '../kpi/KpiImportModal';
import { UserKpiDetailModal } from '../kpi/UserKpiDetailModal';
import { MendanDetailModal } from './MendanDetailModal';

// Clean staff name helper
const cleanName = (name: string | undefined): string => {
  if (!name) return '—';
  return name.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, '').trim();
};

export const PerformanceModule: React.FC = () => {
  const {
    users,
    teams,
    currentUser,
    kpiRecords,
    mendanRecords,
    memberEvaluations,
    evaluationCriteria,
    createOrUpdateMendan,
    saveMemberEvaluation,
    updateEvaluationCriteria,
    criteriaProposals,
    exportCurrentKpis,
    isLeaderOrAdmin,
    awardCategories,
    awardProposals,
    submitAwardProposal,
    selectedQuarter,
    setSelectedQuarter,
    selectedMonth,
    setSelectedMonth,
    selectedTeamId,
    setSelectedTeamId,
    kpiThresholds,
    canViewTeam,
    visibleUsers,
    bulkUpdateEvaluationAndMendanVisibility,
    toggleSingleEvaluationVisibility,
    toggleSingleMendanVisibility,
  } = useApp();

  // Local UI States
  const [activeTableTab, setActiveTableTab] = useState<'kpi' | 'evaluation'>('kpi');
  const [evalTeamFilter, setEvalTeamFilter] = useState<string>('all');
  const [evalVisibilityFilter, setEvalVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedEvalUserIds, setSelectedEvalUserIds] = useState<string[]>([]);
  const [selectedKpiUserIds, setSelectedKpiUserIds] = useState<string[]>([]);

  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'achieved' | 'under' | 'has_miss' | 'has_late'>('all');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>('div-2');

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedKpiRecord, setSelectedKpiRecord] = useState<KpiRecord | null>(null);
  const [selectedKpiUser, setSelectedKpiUser] = useState<User | null>(null);

  // Scoring Modal
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [scoringUser, setScoringUser] = useState<User | null>(null);
  const [scoringQuarter, setScoringQuarter] = useState<string>('Q1');
  const [scoringYear, setScoringYear] = useState<number>(2026);
  const [isScoringReadOnly, setIsScoringReadOnly] = useState<boolean>(false);
  const [scoringForm, setScoringForm] = useState<{
    scores: Record<string, number>;
    note: string;
  }>({
    scores: {},
    note: '',
  });

  // Trạng thái mở rộng chi tiết các mức độ tiêu chuẩn (đáp ứng "phần này có thể mở chi tiết ra được không")
  const [isExpandedDescriptions, setIsExpandedDescriptions] = useState<boolean>(true);
  const [expandedCriteriaIds, setExpandedCriteriaIds] = useState<string[]>([]);
  const [expandedSummaryCritId, setExpandedSummaryCritId] = useState<string | null>(null);
  const [isExpandedAllSummary, setIsExpandedAllSummary] = useState<boolean>(false);

  // Mendan Detail Modal
  const [isMendanModalOpen, setIsMendanModalOpen] = useState(false);
  const [mendanUser, setMendanUser] = useState<User | null>(null);
  const [mendanFormData, setMendanFormData] = useState<Partial<MendanRecord>>({});
  const [showMendanHistory, setShowMendanHistory] = useState(false);
  const [selectedHistoryQuarter, setSelectedHistoryQuarter] = useState<string>('Q4');

  // Rubric Modal
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [rubricDraft, setRubricDraft] = useState<EvaluationCriterion[]>([]);
  const [adminProposalNote, setAdminProposalNote] = useState('');

  // Quick Award Modal
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [awardTargetUser, setAwardTargetUser] = useState<User | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [awardReason, setAwardReason] = useState<string>('');

  // Modal xem chi tiết toàn bộ giải thưởng khen thưởng của nhân sự (+ Chi tiết)
  const [viewingAwardsModal, setViewingAwardsModal] = useState<{ user: User; awards: AwardProposal[] } | null>(null);

  const isMaster = currentUser.role === 'master';
  const isAdmin = currentUser.role === 'admin' || isMaster;
  const isLeader = currentUser.role === 'leader' || currentUser.role === 'subleader';

  // Bảo đảm thành viên thường không thể ở tab Bảng Đánh Giá
  useEffect(() => {
    if (!isLeaderOrAdmin && activeTableTab === 'evaluation') {
      setActiveTableTab('kpi');
    }
  }, [isLeaderOrAdmin, activeTableTab]);

  // Responsive state for dual-pane popup
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close 3-dots action menu when clicking outside
  useEffect(() => {
    const handleDocClick = () => setOpenActionMenuId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // Format large numbers
  const formatNumber = (num: number) => {
    return num.toLocaleString('de-DE');
  };

  // Active target quarter string
  const currentQuarter = selectedQuarter === 'all' ? 'Q1' : selectedQuarter;

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
        return 'Toàn Bộ Phận';
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

  // Active period records for top hero metric calculation (filtered by selectedTeamId if selected)
  const activePeriodRecords = useMemo(() => {
    let recs = comparisonPeriodRecords;
    if (selectedTeamId !== 'all') {
      if (selectedTeamId === 'team-2') {
        const team2Ids = ['team-2', 'team-2a', 'team-2b', 'team-2s'];
        recs = recs.filter((r) => team2Ids.includes(r.team_id));
      } else {
        recs = recs.filter((r) => r.team_id === selectedTeamId);
      }
    }
    return recs;
  }, [comparisonPeriodRecords, selectedTeamId]);

  // Top Hero KPI summary stats
  const totalTarget = useMemo(() => activePeriodRecords.reduce((sum, r) => sum + r.target, 0), [activePeriodRecords]);
  const totalAchieved = useMemo(() => activePeriodRecords.reduce((sum, r) => sum + r.achieved, 0), [activePeriodRecords]);
  const totalMiss = useMemo(() => activePeriodRecords.reduce((sum, r) => sum + r.miss_count, 0), [activePeriodRecords]);
  const totalLate = useMemo(() => activePeriodRecords.reduce((sum, r) => sum + r.late_count, 0), [activePeriodRecords]);
  const overallCompletionRate = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
  const difference = totalAchieved - totalTarget;
  const missRate = totalAchieved > 0 ? (totalMiss / totalAchieved) * 100 : 0;

  // Group by 4 main divisions: 1課, 2課, 3課, GS for Team Comparison Table
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

  // Gradient xanh theo tỉ lệ: tỉ lệ càng cao màu gradient càng đậm
  const getProgressGradientStyle = (rate: number) => {
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

  // Filter list of users visible in "Thành Tích" table (Tất cả các member đều thấy được bảng này)
  const evaluatableUsers = useMemo(() => {
    return users.filter((u) => {
      // Filter by selectedTeamId
      if (selectedTeamId !== 'all') {
        if (selectedTeamId === 'team-2') {
          const team2Ids = ['team-2', 'team-2a', 'team-2b', 'team-2s'];
          if (!team2Ids.includes(u.team_id)) return false;
        } else {
          if (u.team_id !== selectedTeamId) return false;
        }
      }

      // Filter by Search Keyword
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const rawName = cleanName(u.full_name).toLowerCase();
        const matchName = rawName.includes(kw);
        const matchCode = u.employee_code.toLowerCase().includes(kw);
        if (!matchName && !matchCode) return false;
      }

      return true;
    });
  }, [users, selectedTeamId, searchKeyword]);

  // Unified single dataset: 1 record per visible staff member
  const unifiedStaffRecords = useMemo(() => {
    return evaluatableUsers.map((user) => {
      const team = teams.find((t) => t.id === user.team_id) || null;

      // Find user KPI record for current period
      let kpiRec = kpiRecords.find((r) => {
        if (r.user_id !== user.id) return false;
        if (selectedQuarter !== 'all' && r.quarter_id !== selectedQuarter) return false;
        if (selectedMonth !== 'all' && r.month !== selectedMonth) return false;
        return true;
      });

      if (!kpiRec) {
        kpiRec = kpiRecords.find((r) => r.user_id === user.id && r.quarter_id === currentQuarter);
      }

      // Find Mendan record for currentQuarter
      const mendanRec = mendanRecords.find(
        (m) => m.user_id === user.id && (m.quarter_id === currentQuarter || (!m.quarter_id && m.evaluation_type === 'quarterly'))
      ) || null;

      // Find Member Evaluation (7 criteria) for currentQuarter
      const evalRec = memberEvaluations.find(
        (e) => e.user_id === user.id && e.quarter_id === currentQuarter
      ) || null;

      // User awards (filtered according to visibility rules for regular members)
      const userAwards = (awardProposals || []).filter((p) => {
        if (p.user_id !== user.id || p.status !== 'approved') return false;
        if (isMaster || isAdmin) return true;
        const vis = p.visibility_type || (p.is_published ? 'public' : 'private');
        if (vis === 'public') return true;
        if (vis === 'custom') return p.allowed_viewer_ids?.includes(currentUser.id) ?? false;
        return false;
      });

      // KPI Progress & rate
      const target = kpiRec?.target || 0;
      const achieved = kpiRec?.achieved || 0;
      const rate = target > 0 ? (achieved / target) * 100 : 0;
      const missCount = kpiRec?.miss_count || 0;
      const lateCount = kpiRec?.late_count || 0;
      const projectCount = kpiRec?.projects?.length || 0;

      return {
        user,
        team,
        kpiRecord: kpiRec || null,
        target,
        achieved,
        rate,
        missCount,
        lateCount,
        projectCount,
        mendanRecord: mendanRec,
        evalRecord: evalRec,
        userAwards,
      };
    });
  }, [evaluatableUsers, teams, kpiRecords, mendanRecords, memberEvaluations, awardProposals, selectedQuarter, selectedMonth, currentQuarter]);

  // Filter records by status filter
  const filteredRecords = useMemo(() => {
    return unifiedStaffRecords.filter((item) => {
      if (statusFilter === 'achieved') {
        return item.target > 0 && item.rate >= 100;
      }
      if (statusFilter === 'under') {
        return item.target > 0 && item.rate < 100;
      }
      if (statusFilter === 'has_miss') {
        return item.missCount > 0;
      }
      if (statusFilter === 'has_late') {
        return item.lateCount > 0;
      }
      return true;
    });
  }, [unifiedStaffRecords, statusFilter]);

  // Evaluation table rows comparing previous quarter (Q4) vs current quarter
  // (Riêng bảng đánh giá không công khai cho tất cả - chỉ Master/Admin/Leader mới truy cập)
  const evaluationRows = useMemo(() => {
    if (!isLeaderOrAdmin) return [];

    return users
      .filter((u) => {
        // Leader scope check
        if (isLeader && !isAdmin) {
          if (!canViewTeam(u.team_id)) return false;
        }

        // Team filter for evaluation tab
        if (evalTeamFilter !== 'all') {
          if (evalTeamFilter === 'team-2') {
            const team2Ids = ['team-2', 'team-2a', 'team-2b', 'team-2s'];
            if (!team2Ids.includes(u.team_id)) return false;
          } else if (u.team_id !== evalTeamFilter) {
            return false;
          }
        }

        // Visibility filter
        const currEval = memberEvaluations.find((e) => e.user_id === u.id && e.quarter_id === currentQuarter);
        const isPublic = currEval?.is_public !== undefined ? currEval.is_public : true;
        if (evalVisibilityFilter === 'public' && !isPublic) return false;
        if (evalVisibilityFilter === 'private' && isPublic) return false;

        // Search keyword
        if (searchKeyword.trim()) {
          const kw = searchKeyword.toLowerCase();
          const rawName = cleanName(u.full_name).toLowerCase();
          const matchName = rawName.includes(kw);
          const matchCode = u.employee_code.toLowerCase().includes(kw);
          if (!matchName && !matchCode) return false;
        }

        return true;
      })
      .map((u) => {
        const team = teams.find((t) => t.id === u.team_id);
        const prevQuarterId = currentQuarter === 'Q1' ? 'Q4' : currentQuarter === 'Q2' ? 'Q1' : currentQuarter === 'Q3' ? 'Q2' : 'Q3';
        const prevEval = memberEvaluations.find((e) => e.user_id === u.id && e.quarter_id === prevQuarterId);
        const currEval = memberEvaluations.find((e) => e.user_id === u.id && e.quarter_id === currentQuarter);
        const prevScore = prevEval && typeof prevEval.total_score === 'number' ? prevEval.total_score : null;
        const currScore = currEval && typeof currEval.total_score === 'number' ? currEval.total_score : null;
        const scoreDiff = prevScore !== null && currScore !== null ? currScore - prevScore : null;
        const isPublic = currEval?.is_public !== undefined ? currEval.is_public : true;
        const prevIsPublic = prevEval?.is_public !== undefined ? prevEval.is_public : true;

        // Can current user edit visibility of this user?
        // Master can edit anyone in any team
        // Admin can edit only their team members
        const canEditVisibility = isMaster || (isAdmin && (u.team_id === currentUser.team_id || canViewTeam(u.team_id)));

        return {
          user: u,
          team,
          prevQuarterId,
          prevEval,
          currEval,
          prevScore,
          currScore,
          scoreDiff,
          isPublic,
          prevIsPublic,
          canEditVisibility,
        };
      });
  }, [
    users,
    isLeaderOrAdmin,
    isLeader,
    isAdmin,
    isMaster,
    currentUser,
    canViewTeam,
    teams,
    memberEvaluations,
    currentQuarter,
    evalTeamFilter,
    evalVisibilityFilter,
    searchKeyword,
  ]);

  // Bộ lọc phòng ban/team bên trong modal đánh giá
  const [modalTeamFilter, setModalTeamFilter] = useState<string>('all');

  // Danh sách nhân sự ứng viên để Admin & Master chuyển đổi
  const navigableScoringUsers = useMemo(() => {
    let list: User[] = [];
    if (activeTableTab === 'evaluation' && evaluationRows.length > 0) {
      list = evaluationRows.map((r) => r.user);
    } else if (filteredRecords.length > 0) {
      list = filteredRecords.map((r) => r.user);
    }
    if (list.length === 0) list = evaluatableUsers;
    return list;
  }, [activeTableTab, evaluationRows, filteredRecords, evaluatableUsers]);

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
    if (!scoringUser) return -1;
    return modalFilteredUsers.findIndex((u) => u.id === scoringUser.id);
  }, [modalFilteredUsers, scoringUser]);

  const prevScoringUser = currentScoringUserIndex > 0 ? modalFilteredUsers[currentScoringUserIndex - 1] : null;
  const nextScoringUser =
    currentScoringUserIndex >= 0 && currentScoringUserIndex < modalFilteredUsers.length - 1
      ? modalFilteredUsers[currentScoringUserIndex + 1]
      : null;

  const handleNavigateToUser = (targetUser: User, autoSaveCurrent = false) => {
    if (autoSaveCurrent && !isScoringReadOnly) {
      handleSaveEvaluation('draft', false);
    }
    handleOpenScoring(targetUser, scoringQuarter, scoringYear, isScoringReadOnly);
  };

  // Handlers for Scoring Modal (Hỗ trợ xem chi tiết cả những quý trước và quý hiện tại)
  const handleOpenScoring = (
    user: User,
    targetQuarter: string = currentQuarter,
    targetYear?: number,
    readOnly?: boolean
  ) => {
    setScoringUser(user);
    const year = targetYear || (targetQuarter === 'Q4' ? 2025 : 2026);
    setScoringQuarter(targetQuarter);
    setScoringYear(year);

    const existingEval = memberEvaluations.find(
      (e) => e.user_id === user.id && e.quarter_id === targetQuarter
    );

    const isPastQuarter = targetQuarter !== currentQuarter || year !== 2026;
    const canEdit =
      isMaster ||
      (isAdmin && (user.team_id === currentUser.team_id || canViewTeam(user.team_id))) ||
      (isLeader && canViewTeam(user.team_id));

    setIsScoringReadOnly(readOnly !== undefined ? readOnly : (isPastQuarter && !isMaster));

    if (existingEval) {
      setScoringForm({
        scores: { ...existingEval.scores },
        note: existingEval.note || '',
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
    setIsScoringModalOpen(true);
  };

  const handleSwitchScoringQuarter = (qId: string, qYear: number) => {
    if (!scoringUser) return;
    setScoringQuarter(qId);
    setScoringYear(qYear);

    const existingEval = memberEvaluations.find(
      (e) => e.user_id === scoringUser.id && e.quarter_id === qId
    );
    const isPastQuarter = qId !== currentQuarter || qYear !== 2026;
    const canEdit =
      isMaster ||
      (isAdmin && (scoringUser.team_id === currentUser.team_id || canViewTeam(scoringUser.team_id))) ||
      (isLeader && canViewTeam(scoringUser.team_id));
    setIsScoringReadOnly(isPastQuarter && !isMaster);

    if (existingEval) {
      setScoringForm({
        scores: { ...existingEval.scores },
        note: existingEval.note || '',
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
    if (!scoringUser) return;
    const newRecord: MemberEvaluationRecord = {
      id: `eval-${scoringUser.id}-${scoringQuarter}-${scoringYear}`,
      user_id: scoringUser.id,
      evaluator_id: currentUser.id,
      team_id: scoringUser.team_id,
      quarter_id: scoringQuarter,
      year: scoringYear,
      scores: scoringForm.scores,
      total_score: computedLiveScore,
      note: scoringForm.note,
      status,
      updated_at: new Date().toISOString(),
    };
    saveMemberEvaluation(newRecord);
    if (closeModal) {
      setIsScoringModalOpen(false);
    }
  };

  // Handlers for Mendan Modal
  const handleOpenMendan = (user: User, existingMendan: MendanRecord | null) => {
    setMendanUser(user);
    if (existingMendan) {
      setMendanFormData({ ...existingMendan });
    } else {
      setMendanFormData({
        user_id: user.id,
        team_id: user.team_id,
        evaluator_id: currentUser.id,
        quarter_id: currentQuarter,
        evaluation_type: 'quarterly',
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'not_started',
        visibility_scope: 'member_and_leader',
        visibility_type: 'public',
        good_points: '',
        improvements: '',
        next_goals: '',
        leader_good_points: '',
        leader_improvements: '',
        leader_risks: '',
        leader_other: '',
      });
    }
    setShowMendanHistory(false);
    setIsMendanModalOpen(true);
  };

  const handleSaveMendan = (statusOverride?: 'completed' | 'pre_mendan') => {
    if (!mendanUser) return;
    const targetStatus = statusOverride || mendanFormData.status || 'pre_mendan';
    const recordToSave: MendanRecord = {
      id: mendanFormData.id || `mendan-${mendanUser.id}-${currentQuarter}-2026`,
      user_id: mendanUser.id,
      evaluator_id: mendanFormData.evaluator_id || currentUser.id,
      team_id: mendanUser.team_id,
      quarter_id: currentQuarter,
      evaluation_type: 'quarterly',
      scheduled_date: mendanFormData.scheduled_date || new Date().toISOString().split('T')[0],
      actual_date: targetStatus === 'completed' ? (mendanFormData.actual_date || new Date().toISOString().split('T')[0]) : mendanFormData.actual_date,
      status: targetStatus,
      visibility_scope: mendanFormData.visibility_scope || 'member_and_leader',
      visibility_type: mendanFormData.visibility_type || 'public',
      allowed_viewer_ids: mendanFormData.allowed_viewer_ids || [],
      good_points: mendanFormData.good_points || '',
      improvements: mendanFormData.improvements || '',
      next_goals: mendanFormData.next_goals || '',
      leader_evaluator_id: currentUser.id,
      leader_evaluated_at: new Date().toISOString(),
      leader_good_points: mendanFormData.leader_good_points || '',
      leader_improvements: mendanFormData.leader_improvements || '',
      leader_risks: mendanFormData.leader_risks || '',
      leader_other: mendanFormData.leader_other || '',
      pre_notes: mendanFormData.pre_notes || '',
      memo: mendanFormData.memo || '',
      created_at: mendanFormData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    createOrUpdateMendan(recordToSave);
    setIsMendanModalOpen(false);
  };

  // History record for Mendan comparison
  const selectedHistoryRecord = useMemo(() => {
    if (!mendanUser) return null;
    return mendanRecords.find(
      (m) => m.user_id === mendanUser.id && (m.quarter_id === selectedHistoryQuarter || m.quarter_id === 'Q4')
    );
  }, [mendanUser, mendanRecords, selectedHistoryQuarter]);

  // Open KPI Detail Modal
  const handleOpenKpiDetail = (user: User, kpiRec: KpiRecord | null, team: Team | null) => {
    if (!kpiRec) {
      const syntheticRec: KpiRecord = {
        id: `kpi-${user.id}-${currentQuarter}`,
        user_id: user.id,
        team_id: user.team_id,
        year: 2026,
        quarter_id: currentQuarter,
        month: selectedMonth === 'all' ? 3 : selectedMonth,
        period_label: `${selectedMonth === 'all' ? currentQuarter : `Tháng 0${selectedMonth}`}/2026`,
        target: 150,
        achieved: 150,
        unit: 'task',
        miss_count: 0,
        late_count: 0,
        projects: [],
        updated_at: new Date().toISOString(),
      };
      setSelectedKpiRecord(syntheticRec);
    } else {
      setSelectedKpiRecord(kpiRec);
    }
    setSelectedKpiUser(user);
  };

  // Open Quick Award Modal
  const handleOpenAward = (user: User) => {
    setAwardTargetUser(user);
    setSelectedCategoryId(awardCategories[0]?.id || '');
    setAwardReason('');
    setIsAwardModalOpen(true);
  };

  const handleSaveAwardProposal = () => {
    if (!awardTargetUser || !selectedCategoryId) return;
    submitAwardProposal({
      user_id: awardTargetUser.id,
      category_id: selectedCategoryId,
      quarter_id: currentQuarter,
      year: 2026,
      proposed_by: currentUser.id,
      reason: awardReason || 'Đóng góp xuất sắc trong kỳ hoạt động',
      is_published: isAdmin,
    });
    setIsAwardModalOpen(false);
  };

  // Open Rubric Modal
  const handleOpenRubric = () => {
    setRubricDraft(JSON.parse(JSON.stringify(evaluationCriteria)));
    setAdminProposalNote('');
    setIsRubricModalOpen(true);
  };

  const handleSaveRubric = () => {
    updateEvaluationCriteria(rubricDraft, adminProposalNote || undefined);
    setIsRubricModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7c9cd0]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">Thành Tích</h1>
          </div>
          <p className="text-xs text-[#8A8A85] mt-1">
            Tổng quan hiệu suất toàn bộ phận 内部事務代行 & chi tiết từng cá nhân
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Month selector */}
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

          {/* Quarter selector */}
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

          {/* Import KPI Button */}
          {isLeaderOrAdmin && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#7c9cd0] text-white rounded-md text-xs font-semibold hover:bg-[#6788be] shadow-2xs transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Nhập KPI</span>
            </button>
          )}

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={exportCurrentKpis}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#E7E7E4] text-[#1C1C1A] hover:bg-[#F6F6F4] rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download size={14} className="text-[#15803D]" />
            <span>Xuất Excel</span>
          </button>

          {/* Rubric Criteria Button */}
          {isLeaderOrAdmin && (
            <button
              type="button"
              onClick={handleOpenRubric}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#24487c] hover:bg-[#1E3A5F] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Sliders size={14} />
              <span>Thang Điểm & Tiêu Chuẩn</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          PHẦN 1: 5 THẺ CHỈ SỐ TIẾN ĐỘ TOÀN BỘ PHẬN (HERO METRIC)
         ======================================================== */}
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
            <div className="text-[11px] font-bold text-[#24487c] uppercase tracking-wide">
              Mục Tiêu
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#24487c] mt-2">
              {formatNumber(totalTarget)} <span className="text-sm font-normal text-[#24487c]/70">task</span>
            </div>
            <div className="text-xs text-[#8A8A85] mt-1.5">
              Kỳ: Quý {currentQuarter}/2026
            </div>
          </div>

          {/* Cột 3: Đã Đạt Được */}
          <div className="p-5 flex flex-col justify-between min-h-[135px]">
            <div className="text-[11px] font-bold text-[#24487c] uppercase tracking-wide">
              Đã Đạt Được
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#24487c] mt-2">
              {formatNumber(totalAchieved)} <span className="text-sm font-normal text-[#24487c]/70">task</span>
            </div>
            <div className="text-xs text-[#15803D] font-medium mt-1.5">
              Đạt {overallCompletionRate.toFixed(1)}% kế hoạch
            </div>
          </div>

          {/* Cột 4: Số Lỗi */}
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

          {/* Cột 5: Đi Trễ */}
          <div className="p-5 flex flex-col justify-between min-h-[135px]">
            <div className="text-[11px] font-bold text-[#dc2626] uppercase tracking-wide">
              Đi Trễ
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#dc2626] mt-2">
              {totalLate} <span className="text-sm font-normal text-[#dc2626]/70">lần</span>
            </div>
            <div className="text-xs text-[#dc2626] font-medium mt-1.5 truncate">
              {selectedTeamId !== 'all' ? selectedTeamName : 'Toàn bộ các khối'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          PHẦN 2: BẢNG SO SÁNH TIẾN ĐỘ CÁC KHỐI / TỪNG TEAM
         ======================================================== */}
      <div className="bg-white border border-[#E7E7E4] rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-3 border-b border-[#F0F0EE] flex items-center justify-between bg-white min-h-[52px]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7c9cd0]" />
            <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">
              Bảng So Sánh Các Khối / Team
            </h2>
            {selectedTeamId !== 'all' && (
              <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-[#7c9cd0] text-white flex items-center space-x-1.5 shadow-2xs">
                <span>Đang chọn: {selectedTeamName}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTeamId('all')}
                  className="ml-1 hover:bg-white/25 rounded px-1 font-bold leading-none cursor-pointer"
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
                className="text-xs text-[#24487c] font-semibold bg-[#7c9cd0]/15 px-2.5 py-1 rounded border border-[#7c9cd0]/30 hover:bg-[#7c9cd0]/25 transition-colors cursor-pointer"
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

      {/* ========================================================
          PHẦN 3: BỘ LỌC CHUYÊN NGHIỆP & TÌM KIẾM NHÂN SỰ (HÌNH 2)
         ======================================================== */}
      <div className="bg-white border border-[#E7E7E4] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
        {/* Top Filter Row: Segmented Status Tabs + Live Count */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Segmented status filter tabs */}
          <div className="flex items-center flex-wrap gap-1 p-1 bg-[#F6F6F4] rounded-xl border border-[#E7E7E4]">
            {[
              { id: 'all', label: 'Tất cả', count: unifiedStaffRecords.length, icon: Filter },
              { id: 'achieved', label: 'Đạt KPI (≥100%)', count: unifiedStaffRecords.filter(r => r.target > 0 && r.rate >= 100).length, icon: CheckCircle2, color: 'text-[#15803D]' },
              { id: 'under', label: 'Chưa đạt KPI', count: unifiedStaffRecords.filter(r => r.target > 0 && r.rate < 100).length, icon: AlertTriangle, color: 'text-[#D97706]' },
              { id: 'has_miss', label: 'Có lỗi Miss', count: unifiedStaffRecords.filter(r => r.missCount > 0).length, icon: AlertCircle, color: 'text-[#DC2626]' },
              { id: 'has_late', label: 'Đi trễ', count: unifiedStaffRecords.filter(r => r.lateCount > 0).length, icon: Clock, color: 'text-[#DC2626]' },
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
                  <Icon size={13} className={isActive ? (tab.color || 'text-[#24487c]') : 'text-[#8A8A85]'} />
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                      isActive
                        ? 'bg-[#7c9cd0]/20 text-[#24487c]'
                        : 'bg-[#E7E7E4] text-[#64748B]'
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

      {/* ========================================================
          PHẦN 4: BẢNG DỮ LIỆU ĐA NĂNG
          Tab 1: Bảng Thành Tích & Mendan
          Tab 2: Bảng Đánh Giá Năng Lực (So sánh Q4 vs Q1, Tăng/Giảm, Công Khai)
         ======================================================== */}
      <div className="bg-white border border-[#E7E7E4] rounded-xl shadow-2xs overflow-visible">
        {/* Table View Tab Header Bar */}
        <div className="px-5 py-3.5 border-b border-[#F0F0EE] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white rounded-t-xl">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setActiveTableTab('kpi');
                setIsSelectMode(false);
                setSelectedEvalUserIds([]);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTableTab === 'kpi'
                  ? 'bg-[#7c9cd0] text-white shadow-xs'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              <TrendingUp size={14} />
              <span>Thành Tích ({filteredRecords.length})</span>
            </button>
            {isLeaderOrAdmin && (
              <button
                type="button"
                onClick={() => setActiveTableTab('evaluation')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTableTab === 'evaluation'
                    ? 'bg-[#7c9cd0] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                <FileCheck size={14} />
                <span>Bảng Đánh Giá ({evaluationRows.length})</span>
              </button>
            )}
          </div>

          {/* Sub-filters when in Evaluation Tab */}
          {activeTableTab === 'evaluation' && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter by Team */}
              <div className="flex items-center space-x-1.5 text-xs text-[#64748B]">
                <Filter size={13} />
                <span className="font-semibold text-[#1C1C1A]">Team:</span>
                <select
                  value={evalTeamFilter}
                  onChange={(e) => setEvalTeamFilter(e.target.value)}
                  className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1E293B] cursor-pointer"
                >
                  <option value="all">Tất cả các team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Visibility */}
              <div className="flex items-center space-x-1.5 text-xs text-[#64748B]">
                <span className="font-semibold text-[#1C1C1A]">Hiển thị:</span>
                <select
                  value={evalVisibilityFilter}
                  onChange={(e) => setEvalVisibilityFilter(e.target.value as any)}
                  className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1E293B] cursor-pointer"
                >
                  <option value="all">Tất cả</option>
                  <option value="public">Công Khai (🌐)</option>
                  <option value="private">Không Công Khai (🔒)</option>
                </select>
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
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                    isSelectMode
                      ? 'bg-[#24487c] text-white border-[#24487c] shadow-xs'
                      : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  }`}
                  title="Bật/Tắt chế độ tích chọn nhiều nhân sự cùng lúc"
                >
                  <CheckSquare size={13} className="shrink-0" />
                  <span>{isSelectMode ? 'Đóng Chọn Nhiều' : 'Chọn Nhiều'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bulk Action Toolbar for Evaluation Tab */}
        {activeTableTab === 'evaluation' && selectedEvalUserIds.length > 0 && (
          <div className="mx-5 my-3 p-3 bg-[#1C1C1A] text-white rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
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
                  bulkUpdateEvaluationAndMendanVisibility(selectedEvalUserIds, true, currentQuarter);
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
                  bulkUpdateEvaluationAndMendanVisibility(selectedEvalUserIds, false, currentQuarter);
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

        {/* TAB 1: BẢNG THÀNH TÍCH KPI & MENDAN */}
        {activeTableTab === 'kpi' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1160px] table-fixed">
              <colgroup>
                <col style={{ width: '230px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '70px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '110px' }} />
              </colgroup>
              <thead>
                <tr className="text-[#24487c] text-[11px] tracking-wider uppercase bg-[#7c9cd0]/10 border-b border-[#c2d4ee] font-bold h-11">
                  <th className="w-[230px] min-w-[230px] py-3.5 px-4 text-left whitespace-nowrap">Nhân Sự</th>
                  <th className="w-[100px] min-w-[100px] py-3.5 px-2 text-center whitespace-nowrap">Cấp Bậc</th>
                  <th className="w-[110px] min-w-[110px] py-3.5 px-2 text-center whitespace-nowrap">Team</th>
                  <th className="w-[85px] min-w-[85px] py-3.5 px-2 text-center whitespace-nowrap">Mục Tiêu</th>
                  <th className="w-[85px] min-w-[85px] py-3.5 px-2 text-center whitespace-nowrap">Đã Đạt</th>
                  <th className="w-[140px] min-w-[140px] py-3.5 px-3 text-left whitespace-nowrap">Tiến Độ</th>
                  <th className="w-[90px] min-w-[90px] py-3.5 px-2 text-center whitespace-nowrap">Lỗi / Trễ</th>
                  <th className="w-[70px] min-w-[70px] py-3.5 px-2 text-center whitespace-nowrap">Đề Án</th>
                  <th className="w-[140px] min-w-[140px] py-3.5 px-2 text-center whitespace-nowrap">Khen Thưởng</th>
                  <th className="w-[110px] min-w-[110px] py-3.5 px-3 text-center whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EE]">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs text-[#8A8A85]">
                      Không tìm thấy nhân sự nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(({ user, team, kpiRecord, target, achieved, rate, missCount, lateCount, projectCount, mendanRecord, evalRecord, userAwards }) => {
                    const rankConfig = user?.rank ? RANK_STYLE_CONFIG[user.rank] : null;
                    const memberDisplayName = cleanName(user.full_name);
                    const isMenuOpen = openActionMenuId === user.id;

                    // Rights to access Evaluation and Mendan
                    const canEditScore =
                      isMaster ||
                      (isAdmin && (user.team_id === currentUser.team_id || canViewTeam(user.team_id))) ||
                      (isLeader && canViewTeam(user.team_id));

                    // Riêng bảng đánh giá không công khai cho tất cả
                    const canAccessUserEvaluation =
                      canEditScore ||
                      (user.id === currentUser.id && evalRecord?.is_public);

                    // Riêng nội dung mendan không công khai cho tất cả
                    const canAccessUserMendan =
                      isMaster ||
                      (isAdmin && (user.team_id === currentUser.team_id || canViewTeam(user.team_id))) ||
                      (isLeader && canViewTeam(user.team_id)) ||
                      (user.id === currentUser.id && mendanRecord?.visibility_type === 'public');

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-[#F8FAFC] transition-colors group"
                      >
                        {/* 1. Nhân Sự */}
                        <td className="w-[230px] min-w-[230px] py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <img
                              src={
                                user.avatar_url ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                              }
                              alt={user.full_name}
                              className="w-9 h-9 rounded-full object-cover border border-[#E7E7E4] shrink-0 shadow-2xs"
                            />
                            <div className="truncate">
                              <div className="font-bold text-xs text-[#1C1C1A] truncate group-hover:text-[#24487c] transition-colors">
                                {memberDisplayName}
                              </div>
                              <div className="text-[10px] text-[#8A8A85] font-mono mt-0.5">
                                {user.employee_code}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Cấp Bậc */}
                        <td className="w-[100px] min-w-[100px] py-3.5 px-2 text-center whitespace-nowrap">
                          {user.rank && rankConfig ? (
                            <span
                              style={{
                                backgroundColor: rankConfig.bg,
                                color: rankConfig.text,
                                borderColor: rankConfig.border || 'transparent',
                              }}
                              className="inline-block px-2.5 py-0.5 rounded font-mono text-[11px] font-bold border shadow-2xs whitespace-nowrap"
                            >
                              {user.rank}
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] text-[#8A8A85] whitespace-nowrap">—</span>
                          )}
                        </td>

                        {/* 3. Team */}
                        <td className="w-[110px] min-w-[110px] py-3.5 px-2 text-center whitespace-nowrap">
                          <span className="font-semibold text-xs text-[#24487c] bg-[#7c9cd0]/10 px-2.5 py-0.5 rounded border border-[#7c9cd0]/20 inline-block whitespace-nowrap">
                            {team?.name || '—'}
                          </span>
                        </td>

                        {/* 4. Mục Tiêu */}
                        <td className="w-[85px] min-w-[85px] py-3.5 px-2 text-center whitespace-nowrap">
                          <span className="font-bold font-mono text-sm text-[#1C1C1A]">
                            {formatNumber(target)}
                          </span>
                          <div className="text-[10px] text-[#8A8A85]">task</div>
                        </td>

                        {/* 5. Đã Đạt */}
                        <td className="w-[85px] min-w-[85px] py-3.5 px-2 text-center whitespace-nowrap">
                          <span className="font-extrabold font-mono text-sm text-[#24487c]">
                            {formatNumber(achieved)}
                          </span>
                          <div className="text-[10px] text-[#8A8A85]">task</div>
                        </td>

                        {/* 6. Tiến Độ KPI */}
                        <td className="w-[140px] min-w-[140px] py-3.5 px-3 text-left whitespace-nowrap">
                          <div className="space-y-1.5 max-w-[130px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-mono font-bold text-xs ${
                                rate >= 100 ? 'text-[#15803D]' : 'text-[#24487c]'
                              }`}>
                                {rate.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-[#64748B]">
                                {rate >= 100 ? '✓ Đạt' : `${Math.round(rate)}%`}
                              </span>
                            </div>
                            <div className="w-full bg-[#E7E7E4] h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all duration-500 rounded-full"
                                style={{
                                  width: `${Math.min(rate, 100)}%`,
                                  ...getProgressGradientStyle(rate),
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 7. Lỗi / Trễ */}
                        <td className="w-[90px] min-w-[90px] py-3.5 px-2 text-center whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1.5 font-mono text-xs">
                            <span
                              title="Số lỗi Miss"
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                missCount > 0 ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]' : 'bg-[#F1F5F9] text-[#64748B]'
                              }`}
                            >
                              {missCount}L
                            </span>
                            <span
                              title="Số lần Đi trễ"
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                lateCount > 0 ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]' : 'bg-[#F1F5F9] text-[#64748B]'
                              }`}
                            >
                              {lateCount}T
                            </span>
                          </div>
                        </td>

                        {/* 8. Đề Án */}
                        <td className="w-[70px] min-w-[70px] py-3.5 px-2 text-center whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-[#1C1C1A] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                            {projectCount}
                          </span>
                        </td>

                        {/* 9. Khen Thưởng (Nhỏ gọn, đúng 1 hàng, tối đa 5 icon, >5 có nút + Chi tiết) */}
                        <td className="w-[140px] min-w-[140px] py-3.5 px-2 text-center whitespace-nowrap">
                          {userAwards.length > 0 ? (
                            <div className="flex items-center justify-center gap-1 flex-nowrap mx-auto">
                              {userAwards.slice(0, 5).map((prop) => {
                                const cat = awardCategories.find((c) => c.id === prop.category_id);
                                const rawName = cat?.name?.replace(/\s*\([^)]*\)/g, '').trim() || 'Khen thưởng';
                                const tooltip = `[${rawName}] ${prop.quarter_id ? `${prop.quarter_id}/` : ''}${prop.year}: ${prop.reason || 'Khen thưởng thành tích xuất sắc'}`;

                                let IconComponent = Award;
                                let badgeColor = 'bg-[#FFF9E6] border-[#FDE047] text-[#CA8A04] hover:bg-[#FEF08A] hover:scale-110';
                                if (prop.category_id === 'cat-mvp') {
                                  IconComponent = Trophy;
                                  badgeColor = 'bg-[#FEF9C3] border-[#FDE047] text-[#B45309] hover:bg-[#FEF08A] hover:scale-110';
                                } else if (prop.category_id === 'cat-quality') {
                                  IconComponent = ShieldCheck;
                                  badgeColor = 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D] hover:bg-[#BBF7D0] hover:scale-110';
                                } else if (prop.category_id === 'cat-kaizen') {
                                  IconComponent = Sparkles;
                                  badgeColor = 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1] hover:bg-[#BAE6FD] hover:scale-110';
                                } else if (prop.category_id === 'cat-dedication') {
                                  IconComponent = HeartHandshake;
                                  badgeColor = 'bg-[#FFE4E6] border-[#FDA4AF] text-[#BE123C] hover:bg-[#FECDD3] hover:scale-110';
                                } else if (prop.category_id === 'cat-customer') {
                                  IconComponent = Star;
                                  badgeColor = 'bg-[#FFEDD5] border-[#FDBA74] text-[#C2410C] hover:bg-[#FED7AA] hover:scale-110';
                                }

                                return (
                                  <div
                                    key={prop.id}
                                    title={tooltip}
                                    onClick={() => setViewingAwardsModal({ user, awards: userAwards })}
                                    className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shadow-2xs transition-all cursor-pointer shrink-0 ${badgeColor}`}
                                  >
                                    <IconComponent size={9.5} className="shrink-0" />
                                  </div>
                                );
                              })}
                              {userAwards.length > 5 && (
                                <button
                                  type="button"
                                  onClick={() => setViewingAwardsModal({ user, awards: userAwards })}
                                  title={`Xem toàn bộ ${userAwards.length} giải thưởng của ${cleanName(user.full_name)}`}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[#24487c] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-colors cursor-pointer shrink-0 whitespace-nowrap leading-none flex items-center space-x-0.5"
                                >
                                  <span>+{userAwards.length - 5}</span>
                                  <span>Chi tiết</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#A0A09C] text-xs font-mono">—</span>
                          )}
                        </td>

                        {/* 10. Thao Tác (Dấu 3 Chấm •••) */}
                        <td className="w-[110px] min-w-[110px] py-3.5 px-3 text-center relative whitespace-nowrap">
                          <div className="inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(isMenuOpen ? null : user.id);
                              }}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isMenuOpen
                                  ? 'bg-[#7c9cd0] text-white border-[#7c9cd0] shadow-xs'
                                  : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#1C1C1A] hover:bg-[#F1F5F9] hover:border-[#CBD5E1]'
                              }`}
                              title="Thao tác"
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            {/* Dropdown Menu Popup */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#CBD5E1] rounded-xl shadow-xl z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150 divide-y divide-[#F1F5F9]"
                              >
                                {/* Group 1: KPI Details */}
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleOpenKpiDetail(user, kpiRecord, team);
                                    }}
                                    className="w-full px-3.5 py-2 text-left flex items-center space-x-2.5 text-[#1E293B] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] transition-colors cursor-pointer"
                                  >
                                    <TrendingUp size={14} className="text-[#3B82F6]" />
                                    <span className="font-semibold">Chi Tiết KPI & Đề Án</span>
                                  </button>
                                </div>

                                {/* Group 2: Bảng Đánh Giá (Không công khai cho tất cả) */}
                                {canAccessUserEvaluation && (
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        handleOpenScoring(user, currentQuarter, 2026, !canEditScore);
                                      }}
                                      className="w-full px-3.5 py-2 text-left flex items-center space-x-2.5 text-[#1E293B] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] transition-colors cursor-pointer"
                                    >
                                      <Edit3 size={14} className="text-[#7c9cd0]" />
                                      <div className="flex flex-col">
                                        <span className="font-semibold">Bảng Đánh Giá</span>
                                        <span className="text-[10px] text-[#64748B]">
                                          {evalRecord?.total_score ? `Điểm hiện tại: ${evalRecord.total_score}đ` : 'Chưa chấm điểm'}
                                        </span>
                                      </div>
                                    </button>
                                  </div>
                                )}

                                {/* Group 3: Mendan Record (Nội dung Mendan không công khai cho tất cả) */}
                                {canAccessUserMendan && (
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        handleOpenMendan(user, mendanRecord);
                                      }}
                                      className="w-full px-3.5 py-2 text-left flex items-center space-x-2.5 text-[#1E293B] hover:bg-[#F0FDF4] hover:text-[#15803D] transition-colors cursor-pointer"
                                    >
                                      <ClipboardCheck size={14} className="text-[#15803D]" />
                                      <div className="flex flex-col">
                                        <span className="font-semibold">
                                          {isLeader || isAdmin || isMaster ? 'Lập / Xem Biên Bản Mendan' : 'Xem Biên Bản Mendan'}
                                        </span>
                                        <span className="text-[10px] text-[#64748B]">
                                          {mendanRecord?.status === 'completed' ? '✓ Đã phỏng vấn' : 'Chưa phỏng vấn'}
                                        </span>
                                      </div>
                                    </button>
                                    {/* Quick Mendan Visibility Toggle */}
                                    {(isMaster || (isAdmin && (user.team_id === currentUser.team_id || canViewTeam(user.team_id)))) && (
                                      <div className="px-3.5 py-1.5 flex items-center justify-between bg-[#F8FAFC] text-[11px]">
                                        <span className="text-[#64748B] flex items-center space-x-1">
                                          {mendanRecord?.visibility_type === 'public' ? (
                                            <Globe size={11} className="text-[#15803D]" />
                                          ) : (
                                            <Lock size={11} className="text-[#D97706]" />
                                          )}
                                          <span>Hiển thị Mendan:</span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => toggleSingleMendanVisibility(user.id, currentQuarter)}
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                            mendanRecord?.visibility_type === 'public'
                                              ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                                              : 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]'
                                          }`}
                                        >
                                          {mendanRecord?.visibility_type === 'public' ? 'Công Khai' : 'Không Công Khai'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Group 4: Awards */}
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setViewingAwardsModal({ user, awards: userAwards });
                                    }}
                                    className="w-full px-3.5 py-2 text-left flex items-center space-x-2.5 text-[#1E293B] hover:bg-[#FEF9C3] hover:text-[#B45309] transition-colors cursor-pointer"
                                  >
                                    <Award size={14} className="text-[#CA8A04]" />
                                    <span className="font-semibold">Xem Danh Sách Khen Thưởng ({userAwards.length})</span>
                                  </button>
                                  {(isAdmin || isLeader) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        handleOpenAward(user);
                                      }}
                                      className="w-full px-3.5 py-2 text-left flex items-center space-x-2.5 text-[#1E293B] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] transition-colors cursor-pointer"
                                    >
                                      <Trophy size={14} className="text-[#3B82F6]" />
                                      <span className="font-semibold">Ghi Nhận Khen Thưởng Mới</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: BẢNG ĐÁNH GIÁ NĂNG LỰC (Riêng tư - Chỉ Quản lý/Leader truy cập) */}
        {isLeaderOrAdmin && activeTableTab === 'evaluation' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1160px] table-fixed">
              <colgroup>
                {isSelectMode && <col style={{ width: '44px' }} />}
                <col style={{ width: '230px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '170px' }} />
                <col style={{ width: '110px' }} />
              </colgroup>
              <thead>
                <tr className="text-[#24487c] text-[11px] tracking-wider uppercase bg-[#7c9cd0]/10 border-b border-[#c2d4ee] font-bold h-11">
                  {isSelectMode && (
                    <th className="w-[44px] min-w-[44px] py-3.5 px-2 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={
                          evaluationRows.filter((r) => r.canEditVisibility).length > 0 &&
                          evaluationRows
                            .filter((r) => r.canEditVisibility)
                            .every((r) => selectedEvalUserIds.includes(r.user.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const selectableIds = evaluationRows
                              .filter((r) => r.canEditVisibility)
                              .map((r) => r.user.id);
                            setSelectedEvalUserIds(selectableIds);
                          } else {
                            setSelectedEvalUserIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#7c9cd0] focus:ring-[#7c9cd0] cursor-pointer"
                        title={
                          isMaster
                            ? 'Chọn tất cả nhân sự hiển thị'
                            : 'Chọn tất cả nhân sự thuộc bộ phận/team quản lý'
                        }
                      />
                    </th>
                  )}
                  <th className="w-[230px] min-w-[230px] py-3.5 px-4 text-left whitespace-nowrap">Nhân Sự</th>
                  <th className="w-[100px] min-w-[100px] py-3.5 px-2 text-center whitespace-nowrap">Cấp Bậc</th>
                  <th className="w-[110px] min-w-[110px] py-3.5 px-2 text-center whitespace-nowrap">Team</th>
                  <th className="w-[160px] min-w-[160px] py-3.5 px-3 text-center whitespace-nowrap">
                    Điểm Quý Trước ({currentQuarter === 'Q1' ? 'Q4/2025' : `${currentQuarter === 'Q2' ? 'Q1' : currentQuarter === 'Q3' ? 'Q2' : 'Q3'}/2026`})
                  </th>
                  <th className="w-[160px] min-w-[160px] py-3.5 px-3 text-center whitespace-nowrap">Điểm Quý Này ({currentQuarter}/2026)</th>
                  <th className="w-[120px] min-w-[120px] py-3.5 px-3 text-center whitespace-nowrap">Tăng / Giảm</th>
                  <th className="w-[170px] min-w-[170px] py-3.5 px-3 text-center whitespace-nowrap">Chế Độ Hiển Thị</th>
                  <th className="w-[110px] min-w-[110px] py-3.5 px-3 text-center whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EE]">
                {evaluationRows.length === 0 ? (
                  <tr>
                    <td colSpan={isSelectMode ? 9 : 8} className="py-12 text-center text-xs text-[#8A8A85]">
                      Không có dữ liệu đánh giá phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  evaluationRows.map(({ user, team, prevQuarterId, prevScore, currScore, scoreDiff, isPublic, prevIsPublic, canEditVisibility, currEval }) => {
                    const rankConfig = user?.rank ? RANK_STYLE_CONFIG[user.rank] : null;
                    const memberDisplayName = cleanName(user.full_name);
                    const isChecked = selectedEvalUserIds.includes(user.id);

                    // Check rights to view score and edit score
                    const isLeaderOrAdminUser = isMaster || isAdmin || currentUser.role === 'leader' || currentUser.role === 'subleader';

                    // Quý trước vẫn luôn công khai độc lập (không bị ảnh hưởng khi quý này đặt Không Công Khai)
                    const canViewPrevScore = isMaster || isAdmin || (isLeaderOrAdminUser && canViewTeam(user.team_id)) || prevIsPublic;

                    // Quý này: Chỉ công khai khi isPublic = true
                    const canViewCurrScore = isMaster || isAdmin || (isLeaderOrAdminUser && canViewTeam(user.team_id)) || isPublic;

                    const canEditScore = isMaster || (isAdmin && (user.team_id === currentUser.team_id || canViewTeam(user.team_id))) || (isLeaderOrAdminUser && canViewTeam(user.team_id));

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-[#F8FAFC] transition-colors group ${
                          isChecked ? 'bg-[#7c9cd0]/5' : ''
                        }`}
                      >
                        {/* 1. Checkbox - only when isSelectMode is active (Hình 4 requirement) */}
                        {isSelectMode && (
                          <td className="w-[44px] min-w-[44px] py-3.5 px-2 text-center whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!canEditVisibility}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEvalUserIds((prev) => [...prev, user.id]);
                                } else {
                                  setSelectedEvalUserIds((prev) => prev.filter((id) => id !== user.id));
                                }
                              }}
                              className={`w-4 h-4 rounded border-gray-300 text-[#7c9cd0] focus:ring-[#7c9cd0] ${
                                canEditVisibility ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                              }`}
                              title={
                                canEditVisibility
                                  ? `Tích chọn để đổi chế độ hiển thị cho ${memberDisplayName}`
                                  : 'Chỉ Master hoặc Admin của team này mới có thể chọn để đổi chế độ hiển thị'
                              }
                            />
                          </td>
                        )}

                        {/* 2. Nhân Sự */}
                        <td className="w-[230px] min-w-[230px] py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <img
                              src={
                                user.avatar_url ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                              }
                              alt={user.full_name}
                              className="w-9 h-9 rounded-full object-cover border border-[#E7E7E4] shrink-0 shadow-2xs"
                            />
                            <div className="truncate">
                              <div className="font-bold text-xs text-[#1C1C1A] truncate group-hover:text-[#24487c] transition-colors">
                                {memberDisplayName}
                              </div>
                              <div className="text-[10px] text-[#8A8A85] font-mono mt-0.5">
                                {user.employee_code}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Cấp Bậc */}
                        <td className="w-[100px] min-w-[100px] py-3.5 px-2 text-center whitespace-nowrap">
                          {user.rank && rankConfig ? (
                            <span
                              style={{
                                backgroundColor: rankConfig.bg,
                                color: rankConfig.text,
                                borderColor: rankConfig.border || 'transparent',
                              }}
                              className="inline-block px-2.5 py-0.5 rounded font-mono text-[11px] font-bold border shadow-2xs whitespace-nowrap"
                            >
                              {user.rank}
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] text-[#8A8A85] whitespace-nowrap">—</span>
                          )}
                        </td>

                        {/* 4. Team */}
                        <td className="w-[110px] min-w-[110px] py-3.5 px-2 text-center whitespace-nowrap">
                          <span className="font-semibold text-xs text-[#24487c] bg-[#7c9cd0]/10 px-2.5 py-0.5 rounded border border-[#7c9cd0]/20 inline-block whitespace-nowrap">
                            {team?.name || '—'}
                          </span>
                        </td>

                        {/* 5. Điểm Quý Trước - Quý trước vẫn luôn công khai độc lập */}
                        <td className="w-[160px] min-w-[160px] py-3.5 px-3 text-center whitespace-nowrap">
                          {canViewPrevScore ? (
                            prevScore !== null ? (
                              <button
                                type="button"
                                onClick={() => handleOpenScoring(user, prevQuarterId, prevQuarterId === 'Q4' ? 2025 : 2026, !canEditScore)}
                                className="whitespace-nowrap inline-flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-[#EFF6FF] transition-colors group cursor-pointer border border-transparent hover:border-[#93C5FD]"
                                title={`Bấm để xem chi tiết bảng điểm năng lực ${prevQuarterId} (${prevScore}đ)`}
                              >
                                <span className="font-bold text-xs text-[#24487c] group-hover:underline tabular-nums">{prevScore}</span>
                                <span className="text-[10px] text-[#64748B]"> / 100đ</span>
                                <Eye size={12} className="text-[#7c9cd0] group-hover:text-[#24487c]" />
                              </button>
                            ) : (
                              <span className="text-[#8A8A85] text-xs whitespace-nowrap">—</span>
                            )
                          ) : (
                            <span className="text-[#8A8A85] whitespace-nowrap" title="Bảo mật"><Lock size={12} className="inline text-[#8A8A85]" /></span>
                          )}
                        </td>

                        {/* 6. Điểm Quý Hiện Tại ({currentQuarter}/2026) - icon ổ khóa bảo mật khi Không Công Khai quý này */}
                        <td className="w-[160px] min-w-[160px] py-3.5 px-3 text-center whitespace-nowrap">
                          {canViewCurrScore ? (
                            currScore !== null ? (
                              <button
                                type="button"
                                onClick={() => handleOpenScoring(user, currentQuarter, 2026, !canEditScore)}
                                className="whitespace-nowrap inline-flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-[#EFF6FF] transition-colors group cursor-pointer border border-transparent hover:border-[#93C5FD]"
                                title={`Bấm để xem chi tiết bảng điểm năng lực Quý ${currentQuarter}/2026 (${currScore}đ)`}
                              >
                                <span className="font-bold text-xs text-[#24487c] group-hover:underline tabular-nums">{currScore}</span>
                                <span className="text-[10px] text-[#64748B]"> / 100đ</span>
                                <Eye size={12} className="text-[#7c9cd0] group-hover:text-[#24487c]" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenScoring(user, currentQuarter, 2026, !canEditScore)}
                                className="text-xs text-[#D97706] font-semibold bg-[#FEF3C7] hover:bg-[#FDE68A] px-2 py-0.5 rounded border border-[#FCD34D] whitespace-nowrap cursor-pointer transition-colors"
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

                        {/* 7. Tăng / Giảm Điểm */}
                        <td className="w-[120px] min-w-[120px] py-3.5 px-3 text-center whitespace-nowrap">
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

                        {/* 8. Chế Độ Hiển Thị */}
                        <td className="w-[170px] min-w-[170px] py-3.5 px-3 text-center whitespace-nowrap">
                          {isPublic ? (
                            <button
                              type="button"
                              disabled={!canEditVisibility}
                              onClick={() => toggleSingleEvaluationVisibility(user.id, currentQuarter)}
                              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-transform whitespace-nowrap ${
                                canEditVisibility ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-80'
                              } bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]`}
                              title={
                                canEditVisibility
                                  ? 'Công Khai (Cá nhân, Admin & Master thấy) - Nhấp để chuyển Không Công Khai'
                                  : 'Công Khai (Không có quyền chỉnh sửa nhân sự khác team)'
                              }
                            >
                              <Globe size={11} className="shrink-0" />
                              <span className="whitespace-nowrap">Công Khai</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!canEditVisibility}
                              onClick={() => toggleSingleEvaluationVisibility(user.id, currentQuarter)}
                              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-transform whitespace-nowrap ${
                                canEditVisibility ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-80'
                              } bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]`}
                              title={
                                canEditVisibility
                                  ? 'Không Công Khai (Chỉ Admin & Master thấy) - Nhấp để chuyển sang Công Khai'
                                  : 'Không Công Khai (Không có quyền chỉnh sửa nhân sự khác team)'
                              }
                            >
                              <Lock size={11} className="shrink-0" />
                              <span className="whitespace-nowrap">Không Công Khai</span>
                            </button>
                          )}
                        </td>

                        {/* 9. Thao Tác (Hình 2: Phân quyền chính xác, thành viên không có quyền sửa điểm) */}
                        <td className="w-[110px] min-w-[110px] py-3.5 px-3 text-center whitespace-nowrap">
                          {canEditScore ? (
                            <button
                              type="button"
                              onClick={() => handleOpenScoring(user, currentQuarter, 2026, false)}
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-[#24487c] hover:bg-[#1b365d] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                              title="Mở Bảng Đánh Giá Năng Lực"
                            >
                              <Edit3 size={12} className="shrink-0" />
                              <span className="whitespace-nowrap">Đánh Giá</span>
                            </button>
                          ) : canViewCurrScore ? (
                            <button
                              type="button"
                              onClick={() => handleOpenScoring(user, currentQuarter, 2026, true)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
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
        )}
      </div>

      {/* ========================================================
          MODAL 1: CHI TIẾT KPI CÁ NHÂN (UserKpiDetailModal)
         ======================================================== */}
      {selectedKpiRecord && selectedKpiUser && (
        <UserKpiDetailModal
          record={selectedKpiRecord}
          user={selectedKpiUser}
          team={teams.find((t) => t.id === selectedKpiUser.team_id) || null}
          allRecords={filteredRecords.map((r) => r.kpiRecord).filter(Boolean) as KpiRecord[]}
          allUsers={filteredRecords.map((r) => r.user)}
          onSelectUser={(u, r) => {
            setSelectedKpiUser(u);
            setSelectedKpiRecord(r);
          }}
          onClose={() => {
            setSelectedKpiRecord(null);
            setSelectedKpiUser(null);
          }}
        />
      )}

      {/* ========================================================
          MODAL 2: NHẬP KPI TỪ EXCEL (KpiImportModal)
         ======================================================== */}
      <KpiImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* ========================================================
          MODAL 3: CHẤM ĐIỂM & XEM CHI TIẾT ĐÁNH GIÁ NĂNG LỰC 7 TIÊU CHUẨN
          (Hỗ trợ xem chi tiết cả những quý trước và quý hiện tại)
          (Click ra ngoài backdrop tự đóng)
         ======================================================== */}
      {isScoringModalOpen && scoringUser && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
          onClick={() => setIsScoringModalOpen(false)}
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
                    scoringUser.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={scoringUser.full_name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/40"
                />
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {isScoringReadOnly ? 'Chi Tiết Đánh Giá Năng Lực: ' : 'Đánh Giá Năng Lực: '}{cleanName(scoringUser.full_name)}
                  </h2>
                  <p className="text-xs text-white/85">
                    Mã NV: {scoringUser.employee_code} • Cấp bậc: {scoringUser.rank || '—'} • Đang xem: Quý {scoringQuarter}/{scoringYear}
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
                  onClick={() => setIsScoringModalOpen(false)}
                  className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors ml-2 cursor-pointer"
                >
                  <X size={20} />
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
                        if (usersInTeam.length > 0 && !usersInTeam.some((u) => u.id === scoringUser.id)) {
                          handleNavigateToUser(usersInTeam[0], !isScoringReadOnly);
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
                    value={scoringUser.id}
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
                  const isSelected = scoringQuarter === q.id && scoringYear === q.year;
                  const qEval = memberEvaluations.find(
                    (e) => e.user_id === scoringUser.id && e.quarter_id === q.id && (e.year === q.year || !e.year)
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
                const q1Rec = memberEvaluations.find((e) => e.user_id === scoringUser.id && e.quarter_id === 'Q1');
                const q4Rec = memberEvaluations.find((e) => e.user_id === scoringUser.id && e.quarter_id === 'Q4');
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

              {/* BẢNG TỔNG HỢP NĂNG LỰC TOÀN DIỆN 7 TIÊU CHUẨN (NHÌN BAO QUÁT TOÀN BỘ CÁC MỤC) */}
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
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-[#1C1C1A]">
                  Nhận xét và góp ý của Người đánh giá (Quý {scoringQuarter}):
                </label>
                <textarea
                  rows={3}
                  readOnly={!scoringUser || isScoringReadOnly ? true : !(isMaster || (isAdmin && (scoringUser.team_id === currentUser.team_id || canViewTeam(scoringUser.team_id))) || (isLeader && canViewTeam(scoringUser.team_id)))}
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
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#F6F6F4] border-t border-[#E7E7E4] flex items-center justify-between shrink-0">
              <div className="text-xs text-[#8A8A85]">
                Đánh giá cho: <strong>{cleanName(scoringUser.full_name)}</strong> • Kỳ: <strong>Quý {scoringQuarter}/{scoringYear}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsScoringModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E7E7E4] text-xs font-semibold text-[#4A4A46] hover:bg-white transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                {isScoringReadOnly && (isMaster || (isAdmin && (scoringUser.team_id === currentUser.team_id || canViewTeam(scoringUser.team_id)))) && (
                  <button
                    type="button"
                    onClick={() => setIsScoringReadOnly(false)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white border border-[#7c9cd0] text-xs font-semibold text-[#24487c] hover:bg-[#7c9cd0]/10 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Edit3 size={13} />
                    <span>Đánh Giá Quý Này</span>
                  </button>
                )}
                {!isScoringReadOnly && scoringUser && (isMaster || (isAdmin && (scoringUser.team_id === currentUser.team_id || canViewTeam(scoringUser.team_id))) || (isLeader && canViewTeam(scoringUser.team_id))) && (
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

                    {nextScoringUser && (
                      <button
                        type="button"
                        onClick={() => {
                          handleSaveEvaluation('finalized', false);
                          handleNavigateToUser(nextScoringUser, false);
                        }}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-xs font-bold text-white transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                        title={`Lưu kết quả đánh giá cho ${cleanName(scoringUser.full_name)} và chuyển sang nhân sự kế tiếp: ${cleanName(nextScoringUser.full_name)}`}
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
      )}

      {/* ========================================================
          MODAL 4: BIÊN BẢN PHỎNG VẤN MENDAN (面談) - LOGIC NHƯ CŨ (HÌNH 3)
         ======================================================== */}
      {isMendanModalOpen && mendanUser && (
        <MendanDetailModal
          isOpen={isMendanModalOpen}
          onClose={() => setIsMendanModalOpen(false)}
          user={mendanUser}
          team={teams.find((t) => t.id === mendanUser.team_id) || null}
          currentUser={currentUser}
          currentQuarter={currentQuarter}
          existingRecord={
            mendanRecords.find(
              (m) =>
                m.user_id === mendanUser.id &&
                (m.quarter_id === currentQuarter ||
                  (!m.quarter_id && m.evaluation_type === 'quarterly'))
            ) || null
          }
          allMendanRecords={mendanRecords}
          awardCategories={awardCategories}
          awardProposals={awardProposals}
          onSaveMendan={(updatedRecord) => {
            createOrUpdateMendan({
              id: updatedRecord.id || `mendan-${mendanUser.id}-${currentQuarter}-2026`,
              user_id: mendanUser.id,
              team_id: mendanUser.team_id,
              quarter_id: currentQuarter,
              evaluation_type: 'quarterly',
              evaluator_id: currentUser.id,
              ...updatedRecord,
            } as MendanRecord);
          }}
        />
      )}

      {/* ========================================================
          MODAL 5: GHI NHẬN KHEN THƯỞNG NHANH
          (Click ra ngoài backdrop tự đóng)
         ======================================================== */}
      {isAwardModalOpen && awardTargetUser && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setIsAwardModalOpen(false)}
        >
          <div
            className="bg-white border border-[#E7E7E4] rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-[#24487c] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award size={18} className="text-[#FCD34D]" />
                <h3 className="font-bold text-sm">Ghi Nhận Khen Thưởng Nhân Sự</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAwardModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center space-x-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <img
                  src={
                    awardTargetUser.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={awardTargetUser.full_name}
                  className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0]"
                />
                <div>
                  <div className="font-bold text-sm text-[#1C1C1A]">
                    {cleanName(awardTargetUser.full_name)}
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Mã NV: {awardTargetUser.employee_code} • Cấp bậc: {awardTargetUser.rank || '—'}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1C1C1A]">Hạng mục danh hiệu:</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                >
                  {awardCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1C1C1A]">Lý do đề cử / Tuyên dương:</label>
                <textarea
                  rows={3}
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  placeholder="Ghi rõ thành tích, đóng góp vượt trội trong kỳ..."
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg text-xs focus:outline-hidden"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#F6F6F4] border-t border-[#E7E7E4] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAwardModalOpen(false)}
                className="px-4 py-2 border border-[#E7E7E4] rounded-lg text-xs font-semibold text-[#4A4A46] hover:bg-white cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveAwardProposal}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <Award size={14} />
                <span>{isAdmin ? 'Trao Thưởng Ngay' : 'Gửi Đề Cử'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: QUẢN TRỊ BẢNG TIÊU CHUẨN RUBRIC
          (Click ra ngoài backdrop tự đóng)
         ======================================================== */}
      {isRubricModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
          onClick={() => setIsRubricModalOpen(false)}
        >
          <div
            className="bg-white border border-[#E7E7E4] rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
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
                type="button"
                onClick={() => setIsRubricModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!isMaster && (
                <div className="p-3 bg-[#FEF9C3] border border-[#FDE047] rounded-lg text-xs text-[#854D0E] flex items-center space-x-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>
                    <strong>Quy định phê duyệt:</strong> Tài khoản đang đăng nhập với vai trò Admin. Các sửa đổi về tiêu chuẩn và hệ số thang điểm sẽ được tạo thành đề xuất gửi cho Master phê duyệt.
                  </span>
                </div>
              )}

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
                        <span className="text-xs text-[#64748B]">Hệ số:</span>
                        <input
                          type="number"
                          value={crit.weight}
                          onChange={(e) => {
                            const newW = Number(e.target.value);
                            setRubricDraft(prev => prev.map(c => c.id === crit.id ? { ...c, weight: newW } : c));
                          }}
                          className="w-16 p-1 bg-white border border-[#CBD5E1] rounded text-center text-xs font-bold"
                          min={0}
                          max={10}
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      value={crit.vietnamese_name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setRubricDraft(prev => prev.map(c => c.id === crit.id ? { ...c, vietnamese_name: newName } : c));
                      }}
                      className="w-full p-2 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                      placeholder="Tên tiếng Việt của tiêu chuẩn..."
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F6F6F4] border-t border-[#E7E7E4] flex items-center justify-end space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsRubricModalOpen(false)}
                className="px-4 py-2 border border-[#E7E7E4] rounded-lg text-xs font-semibold text-[#4A4A46] hover:bg-white cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveRubric}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#24487c] hover:bg-[#1E3A5F] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <Save size={14} />
                <span>{isMaster ? 'Lưu & Cập Nhật Hệ Thống' : 'Gửi Đề Xuất Phê Duyệt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: CHI TIẾT KHEN THƯỞNG & VINH DANH (+ Chi Tiết)
          (Click ra ngoài backdrop tự đóng)
         ======================================================== */}
      {viewingAwardsModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setViewingAwardsModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#E7E7E4] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#F0F0EE] bg-gradient-to-r from-[#EFF6FF] to-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#FEF9C3] border border-[#FDE047] flex items-center justify-center text-[#B45309] shadow-2xs">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1C1C1A]">Danh Sách Khen Thưởng & Vinh Danh</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {cleanName(viewingAwardsModal.user.full_name)} • Mã NV: {viewingAwardsModal.user.employee_code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAwardsModal(null)}
                className="p-1.5 rounded-lg text-[#8A8A85] hover:text-[#1C1C1A] hover:bg-[#F6F6F4] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Tổng cộng: {viewingAwardsModal.awards.length} giải thưởng đạt được
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#24487c] border border-[#BFDBFE]">
                  Thành Tích & Vinh Danh
                </span>
              </div>

              {viewingAwardsModal.awards.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8A8A85]">
                  Chưa có giải thưởng hoặc vinh danh nào được ghi nhận cho nhân sự này.
                </div>
              ) : (
                viewingAwardsModal.awards.map((award) => {
                  const cat = awardCategories.find((c) => c.id === award.category_id);
                  const rawCatName = cat?.name?.replace(/\s*\([^)]*\)/g, '').trim() || 'Giải Thưởng Quý';

                  let IconComp = Award;
                  let bgClass = 'bg-[#FFF9E6] border-[#FDE047] text-[#CA8A04]';
                  if (award.category_id === 'cat-mvp') {
                    IconComp = Trophy;
                    bgClass = 'bg-[#FEF9C3] border-[#FDE047] text-[#B45309]';
                  } else if (award.category_id === 'cat-quality') {
                    IconComp = ShieldCheck;
                    bgClass = 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]';
                  } else if (award.category_id === 'cat-kaizen') {
                    IconComp = Sparkles;
                    bgClass = 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1]';
                  } else if (award.category_id === 'cat-dedication') {
                    IconComp = HeartHandshake;
                    bgClass = 'bg-[#FFE4E6] border-[#FDA4AF] text-[#BE123C]';
                  } else if (award.category_id === 'cat-customer') {
                    IconComp = Star;
                    bgClass = 'bg-[#FFEDD5] border-[#FDBA74] text-[#C2410C]';
                  }

                  return (
                    <div
                      key={award.id}
                      className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${bgClass}`}>
                            <IconComp size={13} />
                          </div>
                          <span className="font-bold text-xs text-[#1E293B]">{rawCatName}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                          {award.quarter_id ? `${award.quarter_id}/` : ''}{award.year}
                        </span>
                      </div>

                      <p className="text-xs text-[#475569] leading-relaxed italic pl-8">
                        "{award.reason}"
                      </p>

                      {award.feedback && (
                        <div className="text-[10px] text-[#15803D] font-medium pl-8 flex items-center space-x-1">
                          <Check size={11} />
                          <span>Master phê duyệt: {award.feedback}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-[#F0F0EE] bg-[#FAFAF9] flex justify-end">
              <button
                type="button"
                onClick={() => setViewingAwardsModal(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#24487c] hover:bg-[#153C77] text-white shadow-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
