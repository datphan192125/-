import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  TrendingUp,
  FileSpreadsheet,
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  ClipboardCheck,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Calendar,
  Layers,
  History,
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
  CheckSquare,
  Target,
  Search,
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
import { ScoringModal } from './ScoringModal';
import { AwardQuickModal } from './AwardQuickModal';
import { RubricModal } from './RubricModal';
import { AwardDetailModal } from './AwardDetailModal';
import { KpiHeroCards } from './KpiHeroCards';
import { DivisionProgressTable, getProgressGradientStyle } from './DivisionProgressTable';
import { StaffFilterBar } from './StaffFilterBar';
import { SetTeamKpiModal } from './SetTeamKpiModal';
import { cleanName, formatNumber, getRankBadgeColor } from '../../utils/format';

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
    bulkUpdateKpiTargets,
  } = useApp();

  // Local UI States
  const [activeTableTab, setActiveTableTab] = useState<'kpi' | 'evaluation'>('kpi');
  const [evalQuarter, setEvalQuarter] = useState<string>('Q1');
  const [evalStatusFilter, setEvalStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [evalVisibilityFilter, setEvalVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedEvalUserIds, setSelectedEvalUserIds] = useState<string[]>([]);
  const [selectedKpiUserIds, setSelectedKpiUserIds] = useState<string[]>([]);

  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'achieved' | 'under' | 'has_miss' | 'has_late'>('all');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Modals
  const [isSetTeamKpiModalOpen, setIsSetTeamKpiModalOpen] = useState(false);
  const [selectedSetTeamKpiTeamId, setSelectedSetTeamKpiTeamId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importDefaultMode, setImportDefaultMode] = useState<'standard' | 'task'>('task');
  const [isKpiDropdownOpen, setIsKpiDropdownOpen] = useState(false);
  const [selectedKpiRecord, setSelectedKpiRecord] = useState<KpiRecord | null>(null);
  const [selectedKpiUser, setSelectedKpiUser] = useState<User | null>(null);

  // Scoring Modal
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [scoringUser, setScoringUser] = useState<User | null>(null);
  const [scoringConfig, setScoringConfig] = useState<{
    quarter?: string;
    year?: number;
    readOnly?: boolean;
  }>({});

  // Mendan Detail Modal
  const [isMendanModalOpen, setIsMendanModalOpen] = useState(false);
  const [mendanUser, setMendanUser] = useState<User | null>(null);
  const [mendanFormData, setMendanFormData] = useState<Partial<MendanRecord>>({});
  const [showMendanHistory, setShowMendanHistory] = useState(false);
  const [selectedHistoryQuarter, setSelectedHistoryQuarter] = useState<string>('Q4');

  // Rubric Modal
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);

  // Quick Award Modal
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [awardTargetUser, setAwardTargetUser] = useState<User | null>(null);

  // Modal xem chi tiết toàn bộ giải thưởng khen thưởng của nhân sự (+ Chi tiết)
  const [viewingAwardsModal, setViewingAwardsModal] = useState<{ user: User; awards: AwardProposal[] } | null>(null);

  const isMaster = currentUser.role === 'master';
  const isAdmin = currentUser.role === 'admin' || isMaster;
  const isLeader = currentUser.role === 'leader' || currentUser.role === 'subleader';
  const isMember = currentUser.role === 'member';

  // Responsive state for dual-pane popup
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close 3-dots action menu and KPI pulldown when clicking outside
  useEffect(() => {
    const handleDocClick = () => {
      setOpenActionMenuId(null);
      setIsKpiDropdownOpen(false);
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // Active target quarter string
  const currentQuarter = selectedQuarter === 'all' ? 'Q1' : selectedQuarter;

  // Selected team display name
  const selectedTeamName = useMemo(() => {
    if (selectedTeamId === 'all') return 'Toàn Bộ Phận';
    const foundTeam = teams.find((t) => t.id === selectedTeamId || t.code === selectedTeamId);
    if (foundTeam) {
      // Nếu là team cha có các team con
      const children = teams.filter((t) => t.parent_team_id === foundTeam.id);
      if (children.length > 0) {
        return `${foundTeam.name} (Toàn bộ ${children.map((c) => c.name.replace(/.*-/, '')).join('/')})`;
      }
      return foundTeam.name;
    }
    return 'Toàn Bộ Phận';
  }, [selectedTeamId, teams]);

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

  // Lấy toàn bộ team IDs trực thuộc team được chọn (gồm chính nó và các sub-teams nếu có)
  const selectedEffectiveTeamIds = useMemo(() => {
    if (selectedTeamId === 'all') return [];
    const directTeam = teams.find((t) => t.id === selectedTeamId || t.code === selectedTeamId);
    if (!directTeam) return [selectedTeamId];
    const childIds = teams.filter((t) => t.parent_team_id === directTeam.id).map((t) => t.id);
    return [directTeam.id, ...childIds];
  }, [selectedTeamId, teams]);

  // Active period records for top hero metric calculation (filtered by selectedTeamId if selected)
  const activePeriodRecords = useMemo(() => {
    let recs = comparisonPeriodRecords;
    if (selectedTeamId !== 'all') {
      recs = recs.filter((r) => selectedEffectiveTeamIds.includes(r.team_id));
    }
    return recs;
  }, [comparisonPeriodRecords, selectedTeamId, selectedEffectiveTeamIds]);

  // Top Hero KPI summary stats
  const totalTarget = useMemo(() => activePeriodRecords.reduce((sum, r) => sum + r.target, 0), [activePeriodRecords]);
  const totalAchieved = useMemo(() => activePeriodRecords.reduce((sum, r) => sum + r.achieved, 0), [activePeriodRecords]);
  const totalMiss = useMemo(() => activePeriodRecords.reduce((sum, r) => sum + r.miss_count, 0), [activePeriodRecords]);
  const totalLate = useMemo(() => activePeriodRecords.reduce((sum, r) => sum + r.late_count, 0), [activePeriodRecords]);
  const overallCompletionRate = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
  const difference = totalAchieved - totalTarget;
  const missRate = totalAchieved > 0 ? (totalMiss / totalAchieved) * 100 : 0;

  // Filter list of users visible in "Thành Tích" table (Tất cả các member đều thấy được bảng này)
  const evaluatableUsers = useMemo(() => {
    return users.filter((u) => {
      // Filter by selectedTeamId (hỗ trợ động theo cây cơ cấu team)
      if (selectedTeamId !== 'all') {
        if (!selectedEffectiveTeamIds.includes(u.team_id)) return false;
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

  // Counts for KPI filter dropdown
  const kpiCounts = useMemo(() => {
    return {
      all: unifiedStaffRecords.length,
      achieved: unifiedStaffRecords.filter((r) => r.target > 0 && r.rate >= 100).length,
      under: unifiedStaffRecords.filter((r) => r.target > 0 && r.rate < 100).length,
      hasMiss: unifiedStaffRecords.filter((r) => r.missCount > 0).length,
      hasLate: unifiedStaffRecords.filter((r) => r.lateCount > 0).length,
    };
  }, [unifiedStaffRecords]);

  // Evaluation table rows comparing previous quarter vs selected evaluation quarter
  const evaluationRows = useMemo(() => {
    const prevQuarterId = evalQuarter === 'Q1' ? 'Q4' : evalQuarter === 'Q2' ? 'Q1' : evalQuarter === 'Q3' ? 'Q2' : 'Q3';
    const prevYear = evalQuarter === 'Q1' ? 2025 : 2026;
    const currYear = 2026;

    return users
      .filter((u) => {
        // Thành viên thường chỉ hiển thị bảng đánh giá của chính người đó
        if (isMember || !isLeaderOrAdmin) {
          return u.id === currentUser.id;
        }

        // Leader scope check
        if (isLeader && !isAdmin) {
          if (!canViewTeam(u.team_id)) return false;
        }

        // Lọc theo team đã chọn ở trên (selectedTeamId)
        if (selectedTeamId !== 'all') {
          if (selectedTeamId === 'team-2') {
            const team2Ids = ['team-2', 'team-2a', 'team-2b', 'team-2s'];
            if (!team2Ids.includes(u.team_id)) return false;
          } else if (u.team_id !== selectedTeamId) {
            return false;
          }
        }

        // Check if evaluated for selected quarter
        const currEval = memberEvaluations.find((e) => e.user_id === u.id && e.quarter_id === evalQuarter);
        const currScore = currEval && typeof currEval.total_score === 'number' ? currEval.total_score : null;
        const isEvaluated = currScore !== null;

        // Filter by evaluated status (Đã đánh giá / Chưa đánh giá)
        if (evalStatusFilter === 'completed' && !isEvaluated) return false;
        if (evalStatusFilter === 'pending' && isEvaluated) return false;

        // Visibility filter
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
        const prevEval = memberEvaluations.find((e) => e.user_id === u.id && e.quarter_id === prevQuarterId);
        const currEval = memberEvaluations.find((e) => e.user_id === u.id && e.quarter_id === evalQuarter);
        const prevScore = prevEval && typeof prevEval.total_score === 'number' ? prevEval.total_score : null;
        const currScore = currEval && typeof currEval.total_score === 'number' ? currEval.total_score : null;
        const scoreDiff = prevScore !== null && currScore !== null ? currScore - prevScore : null;
        const isPublic = currEval?.is_public !== undefined ? currEval.is_public : true;
        const prevIsPublic = prevEval?.is_public !== undefined ? prevEval.is_public : true;
        const isEvaluated = currScore !== null;

        // Can current user edit visibility of this user?
        const canEditVisibility = isMaster || (isAdmin && (u.team_id === currentUser.team_id || canViewTeam(u.team_id)));

        return {
          user: u,
          team,
          prevQuarterId,
          prevYear,
          currQuarterId: evalQuarter,
          currYear,
          prevEval,
          currEval,
          prevScore,
          currScore,
          scoreDiff,
          isPublic,
          prevIsPublic,
          isEvaluated,
          canEditVisibility,
        };
      });
  }, [
    users,
    isMember,
    isLeaderOrAdmin,
    isLeader,
    isAdmin,
    isMaster,
    currentUser,
    canViewTeam,
    teams,
    memberEvaluations,
    evalQuarter,
    evalStatusFilter,
    selectedTeamId,
    evalVisibilityFilter,
    searchKeyword,
  ]);

  // Overall counts for evaluation tab by quarter
  const evalCounts = useMemo(() => {
    const list = users.filter((u) => {
      if (isMember || !isLeaderOrAdmin) return u.id === currentUser.id;
      if (isLeader && !isAdmin) return canViewTeam(u.team_id);
      if (selectedTeamId !== 'all') {
        if (selectedTeamId === 'team-2') {
          return ['team-2', 'team-2a', 'team-2b', 'team-2s'].includes(u.team_id);
        }
        return u.team_id === selectedTeamId;
      }
      return true;
    });
    const completed = list.filter((u) => {
      const e = memberEvaluations.find((ev) => ev.user_id === u.id && ev.quarter_id === evalQuarter);
      return e && typeof e.total_score === 'number';
    }).length;
    return {
      total: list.length,
      completed,
      pending: list.length - completed,
    };
  }, [users, isMember, isLeaderOrAdmin, isLeader, isAdmin, currentUser, canViewTeam, selectedTeamId, memberEvaluations, evalQuarter]);

  // Danh sách nhân sự ứng viên để Admin & Master chuyển đổi trong Scoring Modal
  const navigableScoringUsers = useMemo(() => {
    if (isMember || !isLeaderOrAdmin) {
      return users.filter((u) => u.id === currentUser.id);
    }
    let list: User[] = [];
    if (activeTableTab === 'evaluation' && evaluationRows.length > 0) {
      list = evaluationRows.map((r) => r.user);
    } else if (filteredRecords.length > 0) {
      list = filteredRecords.map((r) => r.user);
    }
    if (list.length === 0) list = evaluatableUsers;
    if (isLeader && !isAdmin) {
      list = list.filter((u) => canViewTeam(u.team_id));
    }
    return list;
  }, [isMember, isLeaderOrAdmin, isLeader, isAdmin, canViewTeam, currentUser.id, users, activeTableTab, evaluationRows, filteredRecords, evaluatableUsers]);

  // Handlers for Scoring Modal
  const handleOpenScoring = (
    user: User,
    targetQuarter: string = currentQuarter,
    targetYear?: number,
    readOnly?: boolean
  ) => {
    // Thành viên chỉ được xem bảng đánh giá của chính mình
    if (isMember && user.id !== currentUser.id) return;

    setScoringUser(user);
    setScoringConfig({
      quarter: targetQuarter,
      year: targetYear || (targetQuarter === 'Q4' ? 2025 : 2026),
      readOnly: isMember ? true : readOnly,
    });
    setIsScoringModalOpen(true);
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
    setIsAwardModalOpen(true);
  };

  // Open Rubric Modal
  const handleOpenRubric = () => {
    setIsRubricModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7c9cd0]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">Thành Tích</h1>
          </div>
          <p className="text-xs text-[#8A8A85] mt-1">
            Tổng quan hiệu suất toàn bộ phận 内部事務代行 & chi tiết từng cá nhân
          </p>
        </div>

        {/* Khung chức năng hợp nhất */}
        <div className="bg-[#FAF9F6] border border-[#E7E7E4] rounded-xl p-1.5 flex flex-wrap items-center gap-2 shadow-2xs">
          {/* Cụm lọc thời gian: Gom lại thành 1 pulldown duy nhất */}
          <div className="flex items-center gap-1.5">
            <div className="relative w-[185px]">
              <select
                value={
                  selectedMonth !== 'all'
                    ? `M-${selectedMonth}`
                    : selectedQuarter !== 'all'
                    ? `Q-${selectedQuarter}`
                    : 'all'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    setSelectedMonth('all');
                    setSelectedQuarter('all');
                  } else if (val.startsWith('Q-')) {
                    setSelectedMonth('all');
                    setSelectedQuarter(val.replace('Q-', ''));
                  } else if (val.startsWith('M-')) {
                    const m = Number(val.replace('M-', ''));
                    setSelectedMonth(m);
                    // Đồng bộ quý tương ứng với tháng
                    if ([1, 2, 3].includes(m)) setSelectedQuarter('Q1');
                    else if ([4, 5, 6].includes(m)) setSelectedQuarter('Q2');
                    else if ([7, 8, 9].includes(m)) setSelectedQuarter('Q3');
                    else setSelectedQuarter('Q4');
                  }
                }}
                className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-2.5 py-1.5 pr-7 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden transition-colors cursor-pointer"
              >
                <option value="all">Tất cả thời gian</option>
                <optgroup label="Theo Quý">
                  <option value="Q-Q1">Quý 1/2026</option>
                  <option value="Q-Q2">Quý 2/2026</option>
                  <option value="Q-Q3">Quý 3/2026</option>
                  <option value="Q-Q4">Quý 4/2026</option>
                </optgroup>
                <optgroup label="Theo Tháng (Q1 & Q2)">
                  <option value="M-1">Tháng 01/2026</option>
                  <option value="M-2">Tháng 02/2026</option>
                  <option value="M-3">Tháng 03/2026</option>
                  <option value="M-4">Tháng 04/2026</option>
                  <option value="M-5">Tháng 05/2026</option>
                  <option value="M-6">Tháng 06/2026</option>
                  <option value="M-10">Tháng 10/2026</option>
                </optgroup>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A8A85] pointer-events-none"
              />
            </div>
          </div>

          <div className="hidden md:block h-4 w-px bg-[#DCDCD8]" />

          {/* Cụm thao tác & chức năng */}
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Cụm chức năng gộp KPI (Pulldown: Đặt KPI & Cập Nhật Task Đã Đạt) */}
            {(isMaster || isLeaderOrAdmin) && (
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsKpiDropdownOpen((prev) => !prev);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#24487c] hover:bg-[#1a355d] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  title="Quản lý KPI: Đặt chỉ tiêu KPI hoặc Cập nhật task đạt được"
                >
                  <Target size={13} className="text-[#93C5FD]" />
                  <span>KPI</span>
                  <ChevronDown
                    size={13}
                    className={`text-white/80 transition-transform duration-150 ${
                      isKpiDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isKpiDropdownOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 mt-1.5 w-60 rounded-lg bg-white border border-[#E7E7E4] shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                  >
                    {/* Item 1: Đặt KPI (chỉ tiêu) */}
                    {isMaster ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsKpiDropdownOpen(false);
                          setSelectedSetTeamKpiTeamId(null);
                          setIsSetTeamKpiModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#F6F6F4] flex items-start space-x-2.5 text-[#1C1C1A] cursor-pointer group"
                      >
                        <div className="p-1 rounded bg-emerald-50 text-emerald-700 mt-0.5 group-hover:bg-emerald-100">
                          <Target size={14} />
                        </div>
                        <div>
                          <div className="font-semibold text-[#1C1C1A]">Đặt KPI</div>
                          <div className="text-[11px] text-[#8A8A85]">
                            Thiết lập chỉ tiêu số lượng cho từng team / khối
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div className="px-3.5 py-2 text-xs text-[#8A8A85] flex items-center space-x-2 opacity-60">
                        <Target size={14} />
                        <span>Đặt KPI (Dành riêng cho Master)</span>
                      </div>
                    )}

                    <div className="border-t border-[#F0F0EE] my-1" />

                    {/* Item 2: Cập Nhật Task Đã Đạt (nhập từ file task / excel) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsKpiDropdownOpen(false);
                        setImportDefaultMode('task');
                        setIsImportModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#F6F6F4] flex items-start space-x-2.5 text-[#1C1C1A] cursor-pointer group"
                    >
                      <div className="p-1 rounded bg-blue-50 text-[#24487c] mt-0.5 group-hover:bg-blue-100">
                        <Sparkles size={14} />
                      </div>
                      <div>
                        <div className="font-semibold text-[#1C1C1A]">Cập Nhật Task Đã Đạt</div>
                        <div className="text-[11px] text-[#8A8A85]">
                          Tự động tính Đạt được (Achieved) từ file dữ liệu task
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={exportCurrentKpis}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white border border-[#E7E7E4] text-[#1C1C1A] hover:bg-[#F6F6F4] rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Download size={13} className="text-[#15803D]" />
              <span>Xuất Excel</span>
            </button>

            {/* Rubric Criteria Button */}
            {isLeaderOrAdmin && (
              <button
                type="button"
                onClick={handleOpenRubric}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#24487c] hover:bg-[#1E3A5F] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Sliders size={13} />
                <span>Thang Điểm & Tiêu Chuẩn</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          PHẦN 1: 5 THẺ CHỈ SỐ TIẾN ĐỘ TOÀN BỘ PHẬN (KpiHeroCards)
         ======================================================== */}
      <KpiHeroCards
        selectedTeamId={selectedTeamId}
        selectedTeamName={selectedTeamName}
        overallCompletionRate={overallCompletionRate}
        kpiThresholds={kpiThresholds}
        difference={difference}
        totalTarget={totalTarget}
        totalAchieved={totalAchieved}
        totalMiss={totalMiss}
        totalLate={totalLate}
        missRate={missRate}
        currentQuarter={currentQuarter}
        getProgressGradientStyle={getProgressGradientStyle}
      />

      {/* ========================================================
          PHẦN 2: BẢNG SO SÁNH TIẾN ĐỘ CÁC KHỐI / TỪNG TEAM (DivisionProgressTable)
         ======================================================== */}
      <DivisionProgressTable
        selectedTeamId={selectedTeamId}
        setSelectedTeamId={setSelectedTeamId}
        selectedTeamName={selectedTeamName}
        comparisonPeriodRecords={comparisonPeriodRecords}
        kpiThresholds={kpiThresholds}
        expandedTeamId={expandedTeamId}
        setExpandedTeamId={setExpandedTeamId}
        isMaster={isMaster}
        onOpenSetTeamKpi={(teamId) => {
          setSelectedSetTeamKpiTeamId(teamId || null);
          setIsSetTeamKpiModalOpen(true);
        }}
      />

      {/* ========================================================
          PHẦN 4: BẢNG DỮ LIỆU ĐA NĂNG
          Tab 1: Bảng Thành Tích & Mendan
          Tab 2: Bảng Đánh Giá Năng Lực (So sánh Q4 vs Q1, Tăng/Giảm, Công Khai)
         ======================================================== */}
      <div className="bg-white border border-[#E7E7E4] rounded-xl shadow-2xs overflow-visible">
        {/* Table View Tab Header Bar */}
        <div className="px-5 py-3.5 border-b border-[#F0F0EE] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white rounded-t-xl">
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
              <span>Đánh Giá ({evaluationRows.length})</span>
            </button>
          </div>

          {/* Bộ lọc cho Tab Thành Tích (đồng bộ phong cách tinh gọn giống Đánh Giá) */}
          {activeTableTab === 'kpi' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-44 sm:w-52">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm họ tên, mã NV..."
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg pl-7 pr-6 py-1 text-xs text-[#1E293B] focus:outline-hidden focus:border-[#7c9cd0] transition-colors"
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85] pointer-events-none" />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A8A85] hover:text-[#1C1C1A]"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-[#64748B]">
                <span className="font-semibold text-[#1C1C1A]">Trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1E293B] cursor-pointer"
                >
                  <option value="all">Tất cả ({kpiCounts.all})</option>
                  <option value="achieved">Đạt KPI (≥100%) ({kpiCounts.achieved})</option>
                  <option value="under">Chưa đạt KPI ({kpiCounts.under})</option>
                  <option value="has_miss">Có lỗi Miss ({kpiCounts.hasMiss})</option>
                  <option value="has_late">Đi trễ ({kpiCounts.hasLate})</option>
                </select>
              </div>
            </div>
          )}

          {/* Bộ lọc cho Tab Đánh Giá (Lọc theo Quý & Trạng thái Đã đánh giá / Chưa đánh giá) */}
          {activeTableTab === 'evaluation' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-40 sm:w-48">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm nhân sự..."
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg pl-7 pr-6 py-1 text-xs text-[#1E293B] focus:outline-hidden focus:border-[#7c9cd0] transition-colors"
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85] pointer-events-none" />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A8A85] hover:text-[#1C1C1A]"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Lọc theo Quý */}
              <div className="flex items-center space-x-1.5 text-xs text-[#64748B]">
                <span className="font-semibold text-[#1C1C1A]">Quý:</span>
                <select
                  value={evalQuarter}
                  onChange={(e) => setEvalQuarter(e.target.value)}
                  className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1E293B] cursor-pointer"
                >
                  <option value="Q1">Quý 1/2026</option>
                  <option value="Q2">Quý 2/2026</option>
                  <option value="Q3">Quý 3/2026</option>
                  <option value="Q4">Quý 4/2026</option>
                </select>
              </div>

              {/* Lọc theo tiến độ Đã/Chưa đánh giá */}
              <div className="flex items-center space-x-1.5 text-xs text-[#64748B]">
                <span className="font-semibold text-[#1C1C1A]">Trạng thái:</span>
                <select
                  value={evalStatusFilter}
                  onChange={(e) => setEvalStatusFilter(e.target.value as any)}
                  className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1E293B] cursor-pointer"
                >
                  <option value="all">Tất cả ({evalCounts.total})</option>
                  <option value="completed">✓ Đã đánh giá ({evalCounts.completed})</option>
                  <option value="pending">Chưa đánh giá ({evalCounts.pending})</option>
                </select>
              </div>

              {/* Filter by Visibility (Leader/Admin only) */}
              {isLeaderOrAdmin && (
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
              )}

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
                  bulkUpdateEvaluationAndMendanVisibility(selectedEvalUserIds, true, evalQuarter);
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
                  bulkUpdateEvaluationAndMendanVisibility(selectedEvalUserIds, false, evalQuarter);
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
                      user.id === currentUser.id;

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

        {/* TAB 2: BẢNG ĐÁNH GIÁ NĂNG LỰC */}
        {activeTableTab === 'evaluation' && (
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
                    Điểm Quý Trước ({evalQuarter === 'Q1' ? 'Q4/2025' : `${evalQuarter === 'Q2' ? 'Q1' : evalQuarter === 'Q3' ? 'Q2' : 'Q3'}/2026`})
                  </th>
                  <th className="w-[160px] min-w-[160px] py-3.5 px-3 text-center whitespace-nowrap">Điểm Quý Này ({evalQuarter}/2026)</th>
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
                  evaluationRows.map(({ user, team, prevQuarterId, prevYear, currQuarterId, currYear, prevScore, currScore, scoreDiff, isPublic, prevIsPublic, isEvaluated, canEditVisibility, currEval }) => {
                    const rankConfig = user?.rank ? RANK_STYLE_CONFIG[user.rank] : null;
                    const memberDisplayName = cleanName(user.full_name);
                    const isChecked = selectedEvalUserIds.includes(user.id);

                    // Check rights to view score and edit score
                    const isLeaderOrAdminUser = isMaster || isAdmin || currentUser.role === 'leader' || currentUser.role === 'subleader';

                    // Quý trước vẫn luôn công khai độc lập (không bị ảnh hưởng khi quý này đặt Không Công Khai)
                    const canViewPrevScore = isMaster || isAdmin || (isLeaderOrAdminUser && canViewTeam(user.team_id)) || prevIsPublic || user.id === currentUser.id;

                    // Quý này: Chỉ công khai khi isPublic = true
                    const canViewCurrScore = isMaster || isAdmin || (isLeaderOrAdminUser && canViewTeam(user.team_id)) || isPublic || user.id === currentUser.id;

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
                              <div className="font-bold text-xs text-[#1C1C1A] truncate group-hover:text-[#24487c] transition-colors flex items-center space-x-1.5">
                                <span className="truncate">{memberDisplayName}</span>
                                {isEvaluated && (
                                  <span className="inline-flex items-center text-[#16A34A] shrink-0" title={`Đã đánh giá ${currQuarterId}/${currYear}`}>
                                    <CheckCircle2 size={14} className="shrink-0" />
                                  </span>
                                )}
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
                                onClick={() => handleOpenScoring(user, prevQuarterId, prevYear, !canEditScore)}
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

                        {/* 6. Điểm Quý Hiện Tại ({currQuarterId}/{currYear}) - icon ổ khóa bảo mật khi Không Công Khai quý này */}
                        <td className="w-[160px] min-w-[160px] py-3.5 px-3 text-center whitespace-nowrap">
                          {canViewCurrScore ? (
                            currScore !== null ? (
                              <button
                                type="button"
                                onClick={() => handleOpenScoring(user, currQuarterId, currYear, !canEditScore)}
                                className="whitespace-nowrap inline-flex items-center space-x-1.5 px-2 py-1 rounded-md hover:bg-[#EFF6FF] transition-colors group cursor-pointer border border-transparent hover:border-[#93C5FD]"
                                title={`Bấm để xem chi tiết bảng điểm năng lực Quý ${currQuarterId}/${currYear} (${currScore}đ)`}
                              >
                                <span className="font-bold text-xs text-[#24487c] group-hover:underline tabular-nums">{currScore}</span>
                                <span className="text-[10px] text-[#64748B]"> / 100đ</span>
                                <span className="inline-flex items-center text-[#16A34A] shrink-0" title="Đã đánh giá xong">
                                  <CheckCircle2 size={13} className="shrink-0" />
                                </span>
                                <Eye size={12} className="text-[#7c9cd0] group-hover:text-[#24487c]" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenScoring(user, currQuarterId, currYear, !canEditScore)}
                                className="text-xs text-[#D97706] font-semibold bg-[#FEF3C7] hover:bg-[#FDE68A] px-2 py-0.5 rounded border border-[#FCD34D] whitespace-nowrap cursor-pointer transition-colors"
                                title={`Chưa chấm điểm - Bấm để chấm điểm Quý ${currQuarterId}`}
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
                              onClick={() => toggleSingleEvaluationVisibility(user.id, currQuarterId)}
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
                              onClick={() => toggleSingleEvaluationVisibility(user.id, currQuarterId)}
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
        defaultMode={importDefaultMode}
      />

      {/* ========================================================
          MODAL 3: CHẤM ĐIỂM & XEM CHI TIẾT ĐÁNH GIÁ NĂNG LỰC 7 TIÊU CHUẨN (ScoringModal)
         ======================================================== */}
      {isScoringModalOpen && scoringUser && (
        <ScoringModal
          isOpen={isScoringModalOpen}
          onClose={() => setIsScoringModalOpen(false)}
          user={scoringUser}
          onSelectUser={setScoringUser}
          initialQuarter={scoringConfig.quarter}
          initialYear={scoringConfig.year}
          initialReadOnly={scoringConfig.readOnly}
          currentUser={currentUser}
          currentQuarter={currentQuarter}
          teams={teams}
          navigableUsers={navigableScoringUsers}
          evaluationCriteria={evaluationCriteria}
          memberEvaluations={memberEvaluations}
          onSaveEvaluation={saveMemberEvaluation}
          canViewTeam={canViewTeam}
        />
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
          MODAL 5: GHI NHẬN KHEN THƯỞNG NHANH (AwardQuickModal)
         ======================================================== */}
      {isAwardModalOpen && awardTargetUser && (
        <AwardQuickModal
          isOpen={isAwardModalOpen}
          onClose={() => setIsAwardModalOpen(false)}
          user={awardTargetUser}
          awardCategories={awardCategories}
          currentUser={currentUser}
          currentQuarter={currentQuarter}
          isAdmin={isAdmin}
          onSubmitAwardProposal={submitAwardProposal}
        />
      )}

      {/* ========================================================
          MODAL 6: QUẢN TRỊ BẢNG TIÊU CHUẨN RUBRIC (RubricModal)
         ======================================================== */}
      {isRubricModalOpen && (
        <RubricModal
          isOpen={isRubricModalOpen}
          onClose={() => setIsRubricModalOpen(false)}
          evaluationCriteria={evaluationCriteria}
          isMaster={isMaster}
          onSaveRubric={updateEvaluationCriteria}
        />
      )}

      {/* ========================================================
          MODAL 6: CHI TIẾT KHEN THƯỞNG & VINH DANH (AwardDetailModal)
         ======================================================== */}
      {viewingAwardsModal && (
        <AwardDetailModal
          isOpen={!!viewingAwardsModal}
          onClose={() => setViewingAwardsModal(null)}
          user={viewingAwardsModal.user}
          awards={viewingAwardsModal.awards}
          awardCategories={awardCategories}
        />
      )}

      {/* ========================================================
          MODAL 7: THIẾT LẬP CHỈ TIÊU KPI THEO TEAM (Master Only)
         ======================================================== */}
      {isSetTeamKpiModalOpen && (
        <SetTeamKpiModal
          isOpen={isSetTeamKpiModalOpen}
          onClose={() => {
            setIsSetTeamKpiModalOpen(false);
            setSelectedSetTeamKpiTeamId(null);
          }}
          teams={teams}
          users={users}
          kpiRecords={kpiRecords}
          currentQuarter={currentQuarter}
          initialTeamId={selectedSetTeamKpiTeamId}
          onSaveKpiTargets={(quarter, year, updates) => {
            bulkUpdateKpiTargets(quarter, year, updates);
          }}
        />
      )}
    </div>
  );
};
