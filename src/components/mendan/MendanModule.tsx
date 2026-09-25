import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Search,
  ShieldAlert,
  Edit3,
  Filter,
  Users,
  RotateCcw,
  Trophy,
  ShieldCheck,
  Sparkles,
  HeartHandshake,
  Star,
  Award,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  History,
  Copy,
  ArrowRight,
  AlertCircle,
  X,
  Briefcase,
  FileText,
  MoreVertical,
  Plus,
  Check,
  UserCheck,
  Sliders,
  Save,
  Send,
  TrendingUp,
  ClipboardCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  MendanRecord,
  MendanStatus,
  MendanVisibilityScope,
  MendanVisibilityType,
  RANK_STYLE_CONFIG,
  User,
  EvaluationCriterion,
  MemberEvaluationRecord,
  CriteriaProposal,
} from '../../types';

const cleanName = (name?: string) => {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
};

export const MendanModule: React.FC = () => {
  const {
    currentUser,
    users,
    teams,
    mendanRecords,
    awardCategories,
    awardProposals,
    evaluationCriteria,
    memberEvaluations,
    criteriaProposals,
    createOrUpdateMendan,
    updateMendanVisibility,
    updateMendanStatus,
    saveMemberEvaluation,
    updateEvaluationCriteria,
    reviewCriteriaProposal,
    isLeaderOrAdmin,
    canCreateMendan,
    isAdmin,
    isMaster,
    canViewTeam,
    triggerToast,
  } = useApp();

  // Subtab navigation: 'overview' (Tổng hợp) | 'rubric' (Bảng Tiêu Chuẩn) | 'proposals' (Duyệt Đề Xuất)
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'rubric' | 'proposals'>('overview');

  const [activeTeamFilter, setActiveTeamFilter] = useState<string>('all');
  const [activeQuarterFilter, setActiveQuarterFilter] = useState<string>('Q1');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 3-dots action menu state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Scoring Modal (Chấm điểm 7 tiêu chuẩn năng lực)
  const [isScoringModalOpen, setIsScoringModalOpen] = useState<boolean>(false);
  const [scoringUser, setScoringUser] = useState<User | null>(null);
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

  // Proposal Review Modal
  const [selectedProposal, setSelectedProposal] = useState<CriteriaProposal | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');

  // Visibility Configuration Modal
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState<boolean>(false);
  const [visibilityTarget, setVisibilityTarget] = useState<{
    member: User;
    record: MendanRecord;
  } | null>(null);
  const [visibilityFormType, setVisibilityFormType] = useState<MendanVisibilityType>('public');
  const [visibilityAllowedIds, setVisibilityAllowedIds] = useState<string[]>([]);
  const [viewerSearch, setViewerSearch] = useState<string>('');

  // Create Mendan Modal (Admin & Master only)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<{
    user_id: string;
    evaluator_id: string;
    quarter_id: string;
    evaluation_type: 'quarterly' | 'adhoc';
    scheduled_date: string;
    pre_notes: string;
    visibility_type: MendanVisibilityType;
    allowed_viewer_ids: string[];
  }>({
    user_id: '',
    evaluator_id: '',
    quarter_id: 'Q1',
    evaluation_type: 'quarterly',
    scheduled_date: new Date().toISOString().slice(0, 10),
    pre_notes: '',
    visibility_type: 'public',
    allowed_viewer_ids: [],
  });

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeRecord, setActiveRecord] = useState<MendanRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<MendanRecord>>({});
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [selectedHistoryQuarter, setSelectedHistoryQuarter] = useState<string>('Q4');

  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  // Close 3-dots dropdown when clicking document
  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenActionMenuId(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLeader = currentUser.role === 'leader' || currentUser.role === 'subleader';

  // Privacy protection: Regular members cannot view the internal Mendan assessment records
  if (!isLeaderOrAdmin) {
    return (
      <div className="bg-white border border-[#E7E7E4] rounded-lg p-12 text-center max-w-xl mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#FBF7EE] text-[#B08A3E] flex items-center justify-center mx-auto mb-4 border border-[#B08A3E]/30">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-lg font-bold text-[#1C1C1A] mb-2">
          Khu Vực Quản Lý & Biên Bản Đánh Giá & Mendan (面談)
        </h2>
        <p className="text-xs text-[#8A8A85] leading-relaxed mb-6">
          Quy trình chuẩn bị đánh giá và kết quả trao đổi Mendan được lưu trữ bảo mật giữa Quản lý (Manager) và Trưởng nhóm (Leader). Nhân sự không có quyền truy cập vào danh sách và nội dung đánh giá nội bộ này.
        </p>
        <div className="text-xs text-[#4A4A46] bg-[#F6F6F4] p-3.5 rounded border border-[#E7E7E4] text-left leading-normal">
          <div className="font-semibold text-[#1C1C1A] mb-1 flex items-center space-x-1.5">
            <AlertCircle size={14} className="text-[#7c9cd0]" />
            <span>Lưu ý bảo mật theo quy chuẩn đánh giá:</span>
          </div>
          Khi buổi trao đổi Mendan định kỳ diễn ra, Manager hoặc Leader sẽ trực tiếp trao đổi và chia sẻ định hướng mục tiêu phát triển cùng bạn. Nếu có thắc mắc, vui lòng liên hệ trực tiếp cấp quản lý phụ trách.
        </div>
      </div>
    );
  }

  // Active quarter string for display and record matching
  const currentTargetQuarter =
    activeQuarterFilter === 'all' || activeQuarterFilter === 'adhoc' || activeQuarterFilter === 'quarterly'
      ? 'Q1'
      : activeQuarterFilter;

  // Filter list of users visible to current user
  const evaluatableUsers = useMemo(() => {
    return users.filter((u) => {
      // Leader/Subleader can only see users in their authorized teams
      if (isLeader && !isAdmin) {
        if (!canViewTeam(u.team_id)) return false;
      }

      // Filter by activeTeamFilter
      if (activeTeamFilter !== 'all') {
        if (activeTeamFilter === 'team-2') {
          const team2Ids = ['team-2', 'team-2a', 'team-2b', 'team-2s'];
          if (!team2Ids.includes(u.team_id)) return false;
        } else {
          if (u.team_id !== activeTeamFilter) return false;
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
  }, [users, isLeader, isAdmin, canViewTeam, activeTeamFilter, searchKeyword]);

  // Map every visible employee to their MendanRecord for the selected quarter
  // "Mọi quý đều cứ hiện full nhân sự cho tôi"
  const fullStaffRecords = useMemo(() => {
    return evaluatableUsers
      .map((u) => {
        // Find existing record in mendanRecords
        const existing = mendanRecords.find((rec) => {
          if (rec.user_id !== u.id) return false;

          if (activeQuarterFilter === 'adhoc') {
            return rec.evaluation_type === 'adhoc';
          }
          if (activeQuarterFilter === 'quarterly') {
            return rec.evaluation_type === 'quarterly';
          }
          if (activeQuarterFilter === 'all') {
            return rec.quarter_id === 'Q1' || !rec.quarter_id;
          }
          return rec.quarter_id === activeQuarterFilter;
        });

        if (existing) {
          return { user: u, record: existing };
        }

        // Synthesize virtual record with default status "Chưa đánh giá"
        const virtualRecord: MendanRecord = {
          id: `temp-${u.id}-${currentTargetQuarter}`,
          user_id: u.id,
          evaluator_id: currentUser.id,
          team_id: u.team_id,
          quarter_id: activeQuarterFilter === 'adhoc' ? null : currentTargetQuarter,
          evaluation_type: activeQuarterFilter === 'adhoc' ? 'adhoc' : 'quarterly',
          scheduled_date: '2026-03-31',
          status: 'not_started', // "Chưa đánh giá"
          content_format: 'standard_3',
          good_points: '',
          improvements: '',
          next_goals: '',
          leader_good_points: '',
          leader_improvements: '',
          leader_risks: '',
          leader_other: '',
          memo: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return { user: u, record: virtualRecord };
      })
      .filter(({ record }) => {
        // Status filter
        if (activeStatusFilter !== 'all' && record.status !== activeStatusFilter) {
          return false;
        }
        return true;
      });
  }, [
    evaluatableUsers,
    mendanRecords,
    activeQuarterFilter,
    currentTargetQuarter,
    currentUser.id,
    activeStatusFilter,
  ]);

  const getStatusBadge = (
    status: MendanStatus,
    visibility?: MendanVisibilityScope,
    visibilityType?: MendanVisibilityType,
    allowedViewerIds?: string[]
  ) => {
    switch (status) {
      case 'not_started':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold bg-[#F4F4F2] text-[#6E6E6A] border border-[#E7E7E4] whitespace-nowrap">
            Chưa đánh giá
          </span>
        );
      case 'pre_mendan':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] whitespace-nowrap">
            Đã đánh giá
          </span>
        );
      case 'completed':
        const isPrivate =
          visibilityType === 'private' || visibility === 'manager_only';
        const extraCount = allowedViewerIds?.length || 0;

        let visBadge = null;
        if (isPrivate) {
          visBadge = (
            <span
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74] mt-1 shadow-2xs"
              title="Không Công Khai (Chỉ Người Đánh Giá)"
            >
              <Lock size={10} />
              <span>Không Công Khai</span>
            </span>
          );
        } else {
          visBadge = (
            <span
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC] mt-1 shadow-2xs"
              title={`Công Khai (Nhân sự được đánh giá & Người đánh giá${
                extraCount > 0 ? `, cùng ${extraCount} thành viên khác` : ''
              })`}
            >
              <Eye size={10} />
              <span>Công Khai {extraCount > 0 ? `(+${extraCount})` : ''}</span>
            </span>
          );
        }

        return (
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold bg-[#EDF5EE] text-[#166534] border border-[#BBF7D0] whitespace-nowrap shadow-2xs">
              Hoàn thành mendan
            </span>
            {visBadge}
          </div>
        );
    }
  };

  // Open Visibility Settings Modal from 3-dots menu
  const handleOpenVisibilityModal = (member: User, record: MendanRecord) => {
    setVisibilityTarget({ member, record });
    setVisibilityFormType(
      record.visibility_type ||
        (record.visibility_scope === 'manager_only' ? 'private' : 'public')
    );
    setVisibilityAllowedIds(record.allowed_viewer_ids || []);
    setViewerSearch('');
    setIsVisibilityModalOpen(true);
  };

  const handleSaveVisibility = () => {
    if (!visibilityTarget) return;
    updateMendanVisibility(
      visibilityTarget.record.id,
      visibilityFormType,
      visibilityAllowedIds
    );
    setIsVisibilityModalOpen(false);
  };

  // Open Create Mendan Modal (Admin / Master only)
  const handleOpenCreateModal = () => {
    setCreateForm({
      user_id: users[0]?.id || '',
      evaluator_id: currentUser.id,
      quarter_id: activeQuarterFilter === 'adhoc' || activeQuarterFilter === 'all' ? 'Q1' : activeQuarterFilter,
      evaluation_type: activeQuarterFilter === 'adhoc' ? 'adhoc' : 'quarterly',
      scheduled_date: new Date().toISOString().slice(0, 10),
      pre_notes: '',
      visibility_type: 'public',
      allowed_viewer_ids: [],
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveCreateMendan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.user_id) return;
    const targetUser = users.find((u) => u.id === createForm.user_id);
    createOrUpdateMendan({
      user_id: createForm.user_id,
      evaluator_id: createForm.evaluator_id || currentUser.id,
      team_id: targetUser?.team_id || currentUser.team_id,
      quarter_id: createForm.evaluation_type === 'adhoc' ? null : createForm.quarter_id,
      evaluation_type: createForm.evaluation_type,
      scheduled_date: createForm.scheduled_date,
      status: 'not_started',
      content_format: 'standard_3',
      pre_notes: createForm.pre_notes,
      visibility_type: createForm.visibility_type,
      allowed_viewer_ids: createForm.allowed_viewer_ids,
      visibility_scope: createForm.visibility_type === 'public' ? 'member_and_leader' : 'manager_only',
    });
    setIsCreateModalOpen(false);
  };

  // Open Scoring Modal for an employee
  const handleOpenScoring = (user: User, existingEval?: MemberEvaluationRecord | null) => {
    setScoringUser(user);
    const evalRec = existingEval || memberEvaluations.find(
      (e) => e.user_id === user.id && e.quarter_id === currentTargetQuarter
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
    setIsScoringModalOpen(true);
  };

  // Live Score Calculation
  const computedScore = useMemo(() => {
    let total = 0;
    evaluationCriteria.forEach((crit) => {
      const level = scoringForm.scores[crit.id] || 0;
      if (crit.id === 'crit-late') {
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
    if (!scoringUser) return;
    const newRecord: MemberEvaluationRecord = {
      id: `eval-${scoringUser.id}-${currentTargetQuarter}`,
      user_id: scoringUser.id,
      evaluator_id: currentUser.id,
      team_id: scoringUser.team_id,
      quarter_id: currentTargetQuarter,
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

  // Save Rubric
  const handleSaveRubric = () => {
    const res = updateEvaluationCriteria(rubricDraft, adminProposalNote);
    setIsRubricModalOpen(false);
    if (res.status === 'proposed') {
      setActiveSubTab('proposals');
    }
  };

  // Pending proposals count
  const pendingProposals = useMemo(() => {
    return criteriaProposals.filter((p) => p.status === 'pending');
  }, [criteriaProposals]);

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

  // Evaluation Stats Calculation
  const evalStats = useMemo(() => {
    const records = evaluatableUsers.map((u) => {
      const e = memberEvaluations.find(
        (rec) => rec.user_id === u.id && rec.quarter_id === currentTargetQuarter
      );
      return { user: u, evaluation: e || null };
    });
    const total = records.length;
    const evaluated = records.filter((r) => r.evaluation !== null).length;
    const finalized = records.filter((r) => r.evaluation?.status === 'finalized').length;
    const scores = records
      .filter((r) => r.evaluation && r.evaluation.total_score > 0)
      .map((r) => r.evaluation!.total_score);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';

    const gradeCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    records.forEach((r) => {
      if (r.evaluation?.rank_grade) {
        const g = r.evaluation.rank_grade as keyof typeof gradeCounts;
        if (gradeCounts[g] !== undefined) gradeCounts[g]++;
      }
    });

    return { total, evaluated, finalized, avgScore, gradeCounts };
  }, [evaluatableUsers, memberEvaluations, currentTargetQuarter]);

  // Helper to render user awards (icon + styled tooltips)
  const renderUserAwards = (userId: string, targetQ?: string | null) => {
    const userAwards = awardProposals.filter(
      (p) =>
        p.user_id === userId &&
        (p.status === 'approved' || p.is_published) &&
        (!targetQ || !p.quarter_id || p.quarter_id === targetQ)
    );

    if (userAwards.length === 0) {
      return <span className="text-[#A0A09C] text-xs italic">—</span>;
    }

    return (
      <div className="flex items-center flex-wrap gap-1.5">
        {userAwards.map((prop) => {
          const cat = awardCategories.find((c) => c.id === prop.category_id);
          const rawName = cat?.name?.replace(/\s*\([^)]*\)/g, '').trim() || 'Giải thưởng';
          const qLabel = prop.quarter_id ? `${prop.quarter_id}/` : '';
          const tooltip = `[${rawName}] ${qLabel}${prop.year}: ${prop.reason || 'Khen thưởng thành tích xuất sắc'}`;

          let IconComponent = Award;
          let badgeStyle = 'bg-[#FFF9E6] border-[#FDE047] text-[#CA8A04] hover:bg-[#FEF08A]';

          if (prop.category_id === 'cat-mvp') {
            IconComponent = Trophy;
            badgeStyle = 'bg-[#FEF9C3] border-[#FDE047] text-[#B45309] hover:bg-[#FEF08A]';
          } else if (prop.category_id === 'cat-quality') {
            IconComponent = ShieldCheck;
            badgeStyle = 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D] hover:bg-[#BBF7D0]';
          } else if (prop.category_id === 'cat-kaizen') {
            IconComponent = Sparkles;
            badgeStyle = 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1] hover:bg-[#BAE6FD]';
          } else if (prop.category_id === 'cat-dedication') {
            IconComponent = HeartHandshake;
            badgeStyle = 'bg-[#FFE4E6] border-[#FDA4AF] text-[#BE123C] hover:bg-[#FECDD3]';
          } else if (prop.category_id === 'cat-customer') {
            IconComponent = Star;
            badgeStyle = 'bg-[#FFEDD5] border-[#FDBA74] text-[#C2410C] hover:bg-[#FED7AA]';
          }

          return (
            <div
              key={prop.id}
              title={tooltip}
              className={`w-7 h-7 rounded-full flex items-center justify-center border shadow-2xs cursor-help transition-transform hover:scale-115 shrink-0 ${badgeStyle}`}
            >
              <IconComponent size={14} className="shrink-0" />
            </div>
          );
        })}
      </div>
    );
  };

  // Open modal for assessing/viewing Mendan of a specific employee
  const handleOpenModal = (user: User, record: MendanRecord) => {
    setSelectedUser(user);
    setActiveRecord(record);
    setFormData({
      ...record,
      content_format: record.content_format || 'standard_3',
      single_note: record.single_note || record.memo || '',
      leader_good_points: record.leader_good_points || '',
      leader_improvements: record.leader_improvements || '',
      leader_risks: record.leader_risks || '',
      leader_other: record.leader_other || '',
      visibility_scope: record.visibility_scope || 'member_and_leader',
    });
    setShowHistory(false);
    setSelectedHistoryQuarter('Q4');
    setIsModalOpen(true);
  };

  // Leader/Subleader: Save preparation draft
  const handleLeaderSaveDraft = () => {
    if (!formData.user_id) return;
    createOrUpdateMendan({
      ...formData,
      status: 'not_started', // Keep as "Chưa đánh giá" (Draft)
      leader_evaluator_id: currentUser.id,
      leader_evaluated_at: new Date().toISOString(),
    });
    setIsModalOpen(false);
  };

  // Leader/Subleader: Submit preparation info to Manager
  const handleLeaderSubmitToManager = () => {
    if (!formData.user_id) return;
    createOrUpdateMendan({
      ...formData,
      status: 'pre_mendan', // Move to "Đã đánh giá"
      leader_evaluator_id: currentUser.id,
      leader_evaluated_at: new Date().toISOString(),
    });
    setIsModalOpen(false);
  };

  // Manager: Copy Leader's preparation recommendations into Manager form
  const handleCopyLeaderToManager = () => {
    setFormData((prev) => ({
      ...prev,
      good_points: prev.leader_good_points || prev.good_points || '',
      improvements: prev.leader_improvements || prev.improvements || '',
    }));
  };

  // Manager: Save Mendan draft
  const handleManagerSaveDraft = () => {
    if (!formData.user_id) return;
    createOrUpdateMendan({
      ...formData,
      visibility_scope: formData.visibility_scope || 'member_and_leader',
      manager_evaluator_id: currentUser.id,
    });
    setIsModalOpen(false);
  };

  // Manager: Complete Mendan
  const handleManagerComplete = () => {
    if (!formData.user_id) return;
    createOrUpdateMendan({
      ...formData,
      status: 'completed', // Move to "Hoàn thành mendan"
      visibility_scope: formData.visibility_scope || 'member_and_leader',
      manager_evaluator_id: currentUser.id,
      actual_date: formData.actual_date || new Date().toISOString().slice(0, 10),
    });
    setIsModalOpen(false);
  };

  // State & handler to reference previous quarter's goal into current assessment form
  const [copiedGoalFeedback, setCopiedGoalFeedback] = useState<boolean>(false);

  const handleReferenceGoal = (goalText?: string) => {
    if (!goalText) return;
    const refQuarter = selectedHistoryRecord?.quarter_id || selectedHistoryQuarter || 'kỳ trước';
    const tag = `[Theo dõi mục tiêu ${refQuarter}]: ${goalText}`;

    setFormData((prev) => {
      if (prev.memo && prev.memo.includes(goalText)) {
        return prev;
      }
      return {
        ...prev,
        memo: prev.memo ? `${prev.memo}\n${tag}` : tag,
      };
    });

    try {
      navigator.clipboard?.writeText(goalText);
    } catch {
      // ignore
    }

    setCopiedGoalFeedback(true);
    setTimeout(() => {
      setCopiedGoalFeedback(false);
    }, 3000);
  };

  // All historical mendan records for selected user (excluding current record being edited)
  const userPastMendanRecords = useMemo(() => {
    if (!selectedUser) return [];
    const past = mendanRecords.filter(
      (m) => m.user_id === selectedUser.id && m.id !== activeRecord?.id
    );

    if (past.length > 0) return past;

    // Fallback: Default past Q4/2025 record so left popup always displays meaningful previous quarter data
    return [
      {
        id: `mock-past-${selectedUser.id}-q4`,
        user_id: selectedUser.id,
        evaluator_id: 'user-admin',
        team_id: selectedUser.team_id,
        quarter_id: 'Q4',
        evaluation_type: 'quarterly' as const,
        scheduled_date: '2025-12-25',
        actual_date: '2025-12-25',
        status: 'completed' as const,
        content_format: 'standard_3' as const,
        leader_evaluator_id: selectedUser.team_id === 'team-1' ? 'user-yamamoto' : 'user-sato',
        leader_evaluated_at: '2025-12-21T09:00:00Z',
        leader_good_points: 'Hoàn thành tốt các chỉ tiêu quý 4/2025, tinh thần kỷ luật và trách nhiệm công việc cao.',
        leader_improvements: 'Cần nâng cao tốc độ phản hồi và chủ động báo cáo sớm khi có phát sinh khó.',
        leader_risks: 'Khối lượng hồ sơ lớn dồn vào cuối kỳ chốt tháng.',
        leader_other: 'Nguyện vọng tham gia các khóa đào tạo nghiệp vụ chuyên sâu và nâng cao trình độ tiếng Nhật.',
        good_points: 'Đạt 100% KPI chỉ tiêu quý, tuân thủ quy trình chuẩn, hòa đồng và hỗ trợ đồng đội tốt.',
        improvements: 'Hạn chế sai sót ở các khâu kiểm tra hồ sơ phức tạp.',
        next_goals: 'Duy trì kết quả công việc ổn định >100% và đảm nhận vai trò hỗ trợ kèm cặp nhân sự mới.',
        memo: 'Đã hoàn thành trao đổi tổng kết quý 4/2025. Thống nhất định hướng phát triển trong năm 2026.',
        created_at: '2025-12-18T10:00:00Z',
        updated_at: '2025-12-25T16:00:00Z',
      },
    ];
  }, [selectedUser, mendanRecords, activeRecord]);

  const selectedHistoryRecord = useMemo(() => {
    return (
      userPastMendanRecords.find((m) => m.quarter_id === selectedHistoryQuarter) ||
      userPastMendanRecords[0]
    );
  }, [userPastMendanRecords, selectedHistoryQuarter]);

  // Awards of selected user in the selected history quarter
  const selectedHistoryAwards = useMemo(() => {
    if (!selectedUser) return [];
    return awardProposals.filter(
      (p) =>
        p.user_id === selectedUser.id &&
        (p.status === 'approved' || p.is_published) &&
        (!p.quarter_id || p.quarter_id === selectedHistoryQuarter || p.year === 2025)
    );
  }, [selectedUser, awardProposals, selectedHistoryQuarter]);

  // All approved awards of selected user
  const selectedUserAwards = useMemo(() => {
    if (!selectedUser) return [];
    return awardProposals.filter(
      (p) => p.user_id === selectedUser.id && (p.status === 'approved' || p.is_published)
    );
  }, [selectedUser, awardProposals]);

  const selectedTeamName =
    activeTeamFilter === 'all'
      ? 'Tất cả Team'
      : teams.find((t) => t.id === activeTeamFilter)?.name || activeTeamFilter;

  const isAnyFilterActive =
    activeTeamFilter !== 'all' ||
    activeQuarterFilter !== 'Q1' ||
    activeStatusFilter !== 'all' ||
    searchKeyword.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">
              Đánh Giá & Mendan (面談)
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#7c9cd0]/20 text-[#24487c] border border-[#7c9cd0]/40">
              Quý {currentTargetQuarter}
            </span>
          </div>
          <p className="text-xs text-[#8A8A85] mt-1">
            Hợp nhất quy trình chấm điểm năng lực (7 tiêu chuẩn) & phỏng vấn Mendan 1-on-1 định kỳ giữa Quản lý và Nhân sự.
          </p>
        </div>

        {/* Sub-tabs & Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex p-0.5 rounded-lg bg-[#EAEAE7] border border-[#E7E7E4] text-xs">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-white text-[#24487c] shadow-xs'
                  : 'text-[#4A4A46] hover:text-[#1C1C1A]'
              }`}
            >
              <Users size={13} />
              <span>Tổng Hợp Đánh Giá & Mendan</span>
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
              <span>Duyệt Đề Xuất</span>
              {pendingProposals.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#B85D5D] ml-0.5" />
              )}
            </button>
          </div>

          {(isAdmin || isMaster) && (
            <button
              type="button"
              onClick={handleOpenRubricEdit}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-white border border-[#7c9cd0] hover:bg-[#7c9cd0]/10 text-[#24487c] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Sửa Tiêu Chuẩn</span>
            </button>
          )}

          {canCreateMendan && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-[#7c9cd0] hover:bg-[#6788be] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Tạo Mendan Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice if Admin proposal pending */}
      {pendingProposals.length > 0 && (
        <div className="p-3 bg-[#FEF9C3]/60 border border-[#FDE047] rounded-lg text-xs flex items-center justify-between">
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

      {/* ========================================================
          SUB-TAB 1: TỔNG HỢP ĐÁNH GIÁ & MENDAN
         ======================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick Metrics (Apple Notes minimalist style) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-[#E7E7E4] rounded-lg p-3 shadow-2xs">
              <div className="text-[11px] text-[#8A8A85] font-medium uppercase tracking-wider">Tiến Độ Chấm Điểm</div>
              <div className="text-xl font-bold text-[#1C1C1A] mt-1">
                {evalStats.evaluated} <span className="text-xs text-[#8A8A85] font-normal">/ {evalStats.total} nhân sự</span>
              </div>
              <div className="text-[11px] text-[#15803D] mt-0.5 font-medium">
                {evalStats.finalized} hồ sơ đã chốt điểm
              </div>
            </div>

            <div className="bg-white border border-[#E7E7E4] rounded-lg p-3 shadow-2xs">
              <div className="text-[11px] text-[#8A8A85] font-medium uppercase tracking-wider">Điểm Năng Lực Trung Bình</div>
              <div className="text-xl font-bold text-[#24487c] mt-1">
                {evalStats.avgScore} <span className="text-xs text-[#8A8A85] font-normal">/ 100đ</span>
              </div>
              <div className="text-[11px] text-[#8A8A85] mt-0.5">
                Thang điểm tối đa 100 (7 tiêu chí)
              </div>
            </div>

            <div className="bg-white border border-[#E7E7E4] rounded-lg p-3 shadow-2xs">
              <div className="text-[11px] text-[#8A8A85] font-medium uppercase tracking-wider">Phân Bổ Xếp Hạng Quý</div>
              <div className="flex items-center flex-wrap gap-1 mt-1.5">
                <span className="px-1.5 py-0.2 text-[11px] font-bold rounded bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]">
                  S: {evalStats.gradeCounts.S}
                </span>
                <span className="px-1.5 py-0.2 text-[11px] font-bold rounded bg-[#EFF6FF] text-[#1E40AF] border border-[#93C5FD]">
                  A: {evalStats.gradeCounts.A}
                </span>
                <span className="px-1.5 py-0.2 text-[11px] font-bold rounded bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]">
                  B: {evalStats.gradeCounts.B}
                </span>
                <span className="px-1.5 py-0.2 text-[11px] font-bold rounded bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1]">
                  C: {evalStats.gradeCounts.C}
                </span>
                <span className="px-1.5 py-0.2 text-[11px] font-bold rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]">
                  D: {evalStats.gradeCounts.D}
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#E7E7E4] rounded-lg p-3 shadow-2xs">
              <div className="text-[11px] text-[#8A8A85] font-medium uppercase tracking-wider">Phỏng Vấn Mendan (面談)</div>
              <div className="text-xl font-bold text-[#1C1C1A] mt-1">
                {fullStaffRecords.filter(r => r.record.status === 'completed').length} <span className="text-xs text-[#8A8A85] font-normal">/ {fullStaffRecords.length} hoàn thành</span>
              </div>
              <div className="text-[11px] text-[#24487c] mt-0.5">
                {fullStaffRecords.filter(r => r.record.status === 'pre_mendan').length} đang chờ Mendan
              </div>
            </div>
          </div>

          {/* Filters bar */}
          <div className="p-3 bg-white border border-[#E7E7E4] rounded-lg text-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center space-x-1.5 text-[#8A8A85]">
              <Filter size={14} />
              <span className="font-semibold text-[#1C1C1A]">Bộ lọc:</span>
            </div>

            {/* Team Filter Dropdown */}
            <div className="relative w-[150px]">
              <select
                value={activeTeamFilter}
                onChange={(e) => setActiveTeamFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 pr-8 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden transition-colors cursor-pointer shadow-2xs"
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

            {/* Kỳ Quý & Không định kì Filter Dropdown */}
            <div className="relative w-[160px]">
              <select
                value={activeQuarterFilter}
                onChange={(e) => setActiveQuarterFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 pr-8 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden transition-colors cursor-pointer shadow-2xs"
              >
                <option value="Q1">Định kì - Quý 1</option>
                <option value="Q2">Định kì - Quý 2</option>
                <option value="Q3">Định kì - Quý 3</option>
                <option value="Q4">Định kì - Quý 4</option>
                <option value="adhoc">Không định kì</option>
                <option value="quarterly">Tất cả Định kì</option>
                <option value="all">Tất cả các kỳ</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8A8A85]">
                <Calendar size={12} />
              </div>
            </div>

            {/* Status Filter Dropdown - 3 Trạng thái chính xác */}
            <div className="relative w-[165px]">
              <select
                value={activeStatusFilter}
                onChange={(e) => setActiveStatusFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 pr-8 text-xs font-medium text-[#1C1C1A] hover:border-[#8A8A85] focus:outline-hidden transition-colors cursor-pointer shadow-2xs"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="not_started">Chưa đánh giá</option>
                <option value="pre_mendan">Đã đánh giá</option>
                <option value="completed">Hoàn thành mendan</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8A8A85]">
                <Clock size={12} />
              </div>
            </div>

            {/* Reset Filter Button */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={() => {
                  setActiveTeamFilter('all');
                  setActiveQuarterFilter('Q1');
                  setActiveStatusFilter('all');
                  setSearchKeyword('');
                }}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs text-[#24487c] hover:bg-[#7c9cd0]/20 bg-[#7c9cd0]/10 rounded border border-[#7c9cd0]/30 font-medium transition-colors"
                title="Xóa tất cả bộ lọc và hiển thị toàn bộ"
              >
                <RotateCcw size={12} />
                <span>Đặt lại lọc</span>
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

        {/* Active team filter banner info */}
        {activeTeamFilter !== 'all' && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#7c9cd0]/10 border border-[#7c9cd0]/30 rounded text-xs text-[#24487c]">
            <span className="font-medium">
              Đang lọc theo: <strong>{selectedTeamName}</strong> ({fullStaffRecords.length} nhân sự)
            </span>
            <button
              type="button"
              onClick={() => setActiveTeamFilter('all')}
              className="text-[11px] underline hover:text-[#1C1C1A] font-medium"
            >
              Hiện tất cả các team
            </button>
          </div>
        )}
      </div>

      {/* Main Mendan Table with Fixed Equal Column Widths */}
      <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3 border-b border-[#F0F0EE] flex items-center justify-between text-xs min-h-[52px]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#7c9cd0]" />
            <span className="font-bold text-[#1C1C1A] uppercase tracking-wider text-[11px]">
              DANH SÁCH HỒ SƠ ĐÁNH GIÁ & MENDAN ({fullStaffRecords.length})
            </span>
          </div>
          <span className="text-xs text-[#24487c] font-medium bg-[#7c9cd0]/15 px-2.5 py-1 rounded border border-[#7c9cd0]/30">
            Luồng: Chưa đánh giá → Đã đánh giá (Leader nộp) → Hoàn thành mendan (Manager chọn quyền công khai)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse table-fixed">
            <colgroup>
              <col className="w-[19%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[11%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead>
              <tr className="text-[#24487c] text-[11px] tracking-wider uppercase bg-[#7c9cd0]/10 border-b border-[#c2d4ee] font-bold">
                <th className="py-3 px-3">Nhân Sự</th>
                <th className="py-3 px-2 text-center">Cấp Bậc</th>
                <th className="py-3 px-3">Team</th>
                <th className="py-3 px-3">Đánh Giá Năng Lực</th>
                <th className="py-3 px-3">Biên Bản Mendan</th>
                <th className="py-3 px-3">Khen Thưởng</th>
                <th className="py-3 px-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EE]">
              {fullStaffRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#8A8A85]">
                    Không tìm thấy nhân sự nào phù hợp với bộ lọc {activeTeamFilter !== 'all' && `của ${selectedTeamName}`}.
                  </td>
                </tr>
              ) : (
                fullStaffRecords.map(({ user: member, record: rec }) => {
                  const evaluator = users.find((u) => u.id === (rec.evaluator_id || rec.leader_evaluator_id));
                  const team = teams.find((t) => t.id === member.team_id);
                  const rankConfig = member?.rank ? RANK_STYLE_CONFIG[member.rank] : null;
                  const memberDisplayName = cleanName(member?.full_name);
                  const evaluatorDisplayName = cleanName(evaluator?.full_name).split(' ')[0] || 'Leader';

                  const evalRec = memberEvaluations.find(
                    (e) => e.user_id === member.id && e.quarter_id === currentTargetQuarter
                  );

                  return (
                    <tr key={`${member.id}-${rec.id}`} className="hover:bg-[#FAFAF9] transition-colors">
                      {/* 1. Nhân Sự */}
                      <td className="py-3.5 px-3">
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
                            <div className="text-[10px] text-[#8A8A85] font-mono mt-0.5">
                              {member?.employee_code} • Đánh giá: {evaluatorDisplayName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Cấp Bậc */}
                      <td className="py-3.5 px-2 text-center">
                        {member?.rank && rankConfig ? (
                          <span
                            style={{
                              backgroundColor: rankConfig.bg,
                              color: rankConfig.text,
                              borderColor: rankConfig.border || 'transparent',
                            }}
                            className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-bold border shadow-2xs"
                          >
                            {member.rank}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-[#8A8A85]">—</span>
                        )}
                      </td>

                      {/* 3. Team */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-xs text-[#24487c] bg-[#7c9cd0]/10 px-2 py-0.5 rounded border border-[#7c9cd0]/20 inline-block">
                          {team?.name || '—'}
                        </span>
                      </td>

                      {/* 4. Đánh Giá Năng Lực (Điểm & Hạng) */}
                      <td className="py-3.5 px-3">
                        {evalRec ? (
                          <div className="flex flex-col items-start space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-xs text-[#1D4ED8]">
                                {evalRec.total_score}/100đ
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getRankBadgeColor(
                                  evalRec.rank_grade
                                )}`}
                              >
                                Hạng {evalRec.rank_grade}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-[#64748B]">
                                {evalRec.status === 'finalized' ? '✓ Đã chốt' : '✎ Bản nháp'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenScoring(member, evalRec)}
                                className="text-[10px] font-semibold text-[#24487c] hover:underline cursor-pointer"
                              >
                                Sửa điểm
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-start space-y-1">
                            <span className="text-[11px] text-[#8A8A85] bg-[#F4F4F2] px-2 py-0.5 rounded border border-[#E7E7E4]">
                              Chưa chấm
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenScoring(member, null)}
                              className="inline-flex items-center space-x-1 text-[10px] font-semibold text-[#24487c] hover:underline cursor-pointer"
                            >
                              <Edit3 size={10} />
                              <span>+ Chấm điểm</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 5. Biên Bản Mendan (Trạng Thái & Quyền Xem) */}
                      <td className="py-3.5 px-3">
                        {getStatusBadge(rec.status, rec.visibility_scope, rec.visibility_type, rec.allowed_viewer_ids)}
                        <div className="text-[10px] text-[#8A8A85] mt-1 font-mono">
                          {rec.scheduled_date || 'Chưa xếp lịch'}
                        </div>
                      </td>

                      {/* 6. Khen Thưởng */}
                      <td className="py-3.5 px-3">
                        {renderUserAwards(member.id, rec.quarter_id)}
                      </td>

                      {/* 7. Thao Tác (Actions) */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5 relative">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(member, rec)}
                            className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded bg-[#7c9cd0]/15 hover:bg-[#7c9cd0]/25 text-[#24487c] border border-[#7c9cd0]/30 transition-colors shadow-2xs cursor-pointer"
                            title="Mở biên bản trao đổi Mendan"
                          >
                            <Calendar size={12} />
                            <span>Mendan</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenScoring(member, evalRec)}
                            className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded bg-white hover:bg-[#F6F6F4] text-[#1C1C1A] border border-[#E7E7E4] transition-colors shadow-2xs cursor-pointer"
                            title="Chấm điểm đánh giá năng lực 7 tiêu chí"
                          >
                            <Star size={12} className="text-[#CA8A04]" />
                            <span>Điểm</span>
                          </button>

                          {/* 3-dots button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rowKey = `${member.id}-${rec.id}`;
                                setOpenActionMenuId(openActionMenuId === rowKey ? null : rowKey);
                              }}
                              className={`p-1 rounded-md border transition-colors cursor-pointer ${
                                openActionMenuId === `${member.id}-${rec.id}`
                                  ? 'bg-[#7c9cd0] text-white border-[#6788be]'
                                  : 'bg-white hover:bg-[#F0F0EE] text-[#4A4A46] border-[#E7E7E4]'
                              }`}
                              title="Tùy chọn khác"
                            >
                              <MoreVertical size={13} />
                            </button>

                            {openActionMenuId === `${member.id}-${rec.id}` && (
                              <div
                                className="absolute right-0 top-full mt-1 w-56 bg-white border border-[#E7E7E4] rounded-lg shadow-xl z-30 py-1 text-left text-xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenModal(member, rec);
                                  }}
                                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-[#F6F6F4] text-[#1C1C1A] text-left cursor-pointer"
                                >
                                  <Edit3 size={13} className="text-[#7c9cd0]" />
                                  <span className="font-medium">Chỉnh sửa biên bản Mendan</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenScoring(member, evalRec);
                                  }}
                                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-[#F6F6F4] text-[#1C1C1A] text-left cursor-pointer"
                                >
                                  <Star size={13} className="text-[#CA8A04]" />
                                  <span className="font-medium">Chấm điểm / Sửa đánh giá</span>
                                </button>

                                <div className="h-px bg-[#F0F0EE] my-1" />

                                <div className="px-3 py-1 text-[10px] font-bold text-[#8A8A85] uppercase tracking-wider">
                                  Đổi Trạng Thái Mendan
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    updateMendanStatus(rec.id, 'not_started');
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#F6F6F4] text-left cursor-pointer ${
                                    rec.status === 'not_started' ? 'font-bold text-[#24487c]' : 'text-[#4A4A46]'
                                  }`}
                                >
                                  <span>Chưa đánh giá</span>
                                  {rec.status === 'not_started' && <Check size={12} className="text-[#24487c]" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    updateMendanStatus(rec.id, 'pre_mendan');
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#F6F6F4] text-left cursor-pointer ${
                                    rec.status === 'pre_mendan' ? 'font-bold text-[#24487c]' : 'text-[#4A4A46]'
                                  }`}
                                >
                                  <span>Đã đánh giá</span>
                                  {rec.status === 'pre_mendan' && <Check size={12} className="text-[#24487c]" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    updateMendanStatus(rec.id, 'completed');
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#F6F6F4] text-left cursor-pointer ${
                                    rec.status === 'completed' ? 'font-bold text-[#24487c]' : 'text-[#4A4A46]'
                                  }`}
                                >
                                  <span>Hoàn thành mendan</span>
                                  {rec.status === 'completed' && <Check size={12} className="text-[#24487c]" />}
                                </button>

                                <div className="h-px bg-[#F0F0EE] my-1" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenVisibilityModal(member, rec);
                                  }}
                                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-[#F6F6F4] text-[#1C1C1A] text-left cursor-pointer"
                                >
                                  <Lock size={13} className="text-[#B08A3E]" />
                                  <span className="font-medium">Cài đặt Quyền Xem / Công Khai</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
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

      {/* ========================================================
          SUB-TAB 2: BẢNG TIÊU CHUẨN & THANG ĐIỂM (RUBRIC)
         ======================================================== */}
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

      {/* ========================================================
          SUB-TAB 3: ĐỀ XUẤT DUYỆT (ADMIN & MASTER WORKFLOW)
         ======================================================== */}
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
                            <span className="text-[#24487c] font-mono">x{c.weight}</span>
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">{c.vietnamese_name}</div>
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

      {/* Detail / Assessment Modal Container */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <motion.div
            key="mendan-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
          >
            <motion.div
              layout
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col lg:flex-row items-stretch justify-center w-full max-w-[1360px] max-h-[94vh]"
            >
              {/* ========================================================
                  POP-UP BÊN TRÁI: HIỂN THỊ CỦA QUÝ TRƯỚC (LỊCH SỬ MENDAN)
                 ======================================================== */}
              <AnimatePresence initial={false}>
                {showHistory && (
                  <motion.div
                    key="history-popup-panel"
                    initial={
                      isDesktop
                        ? { width: 0, opacity: 0, x: -24, marginRight: 0 }
                        : { height: 0, opacity: 0, y: -20, marginBottom: 0 }
                    }
                    animate={
                      isDesktop
                        ? { width: 500, opacity: 1, x: 0, marginRight: 16 }
                        : { height: 'auto', opacity: 1, y: 0, marginBottom: 16 }
                    }
                    exit={
                      isDesktop
                        ? { width: 0, opacity: 0, x: -24, marginRight: 0 }
                        : { height: 0, opacity: 0, y: -20, marginBottom: 0 }
                    }
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="shrink-0 overflow-hidden flex flex-col"
                  >
                    <div className="w-[500px] max-w-full bg-white border-2 border-[#7c9cd0]/60 rounded-lg shadow-2xl flex flex-col h-full max-h-[94vh] overflow-hidden">
                      {/* Left Popup Header */}
                      <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F1F5F9] flex items-center justify-between shrink-0">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-md bg-[#24487c] text-white flex items-center justify-center shadow-xs">
                            <History size={15} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-xs text-[#1E3A8A] uppercase tracking-wider">
                                Lịch Sử Quý Trước
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                                Hoàn thành
                              </span>
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              Biên bản đánh giá & mục tiêu của quý trước
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Chọn kỳ lịch sử */}
                          <select
                            value={selectedHistoryQuarter}
                            onChange={(e) => setSelectedHistoryQuarter(e.target.value)}
                            className="bg-white border border-[#CBD5E1] rounded px-2.5 py-1 text-xs font-semibold text-[#1E3A8A] hover:border-[#7c9cd0] focus:outline-hidden cursor-pointer shadow-2xs"
                          >
                            <option value="Q4">Quý 4 / 2025</option>
                            <option value="Q3">Quý 3 / 2025</option>
                            <option value="Q2">Quý 2 / 2025</option>
                            <option value="Q1">Quý 1 / 2025</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => setShowHistory(false)}
                            className="text-[#64748B] hover:text-[#1E293B] p-1.5 rounded-md hover:bg-[#E2E8F0] active:scale-90 transition-all cursor-pointer"
                            title="Đóng pop-up lịch sử quý trước"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Left Popup Subheader Info */}
                      <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs shrink-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#1E293B]">{cleanName(selectedUser.full_name)}</span>
                          <span className="text-[11px] font-mono text-[#64748B]">({selectedUser.employee_code})</span>
                          {selectedUser.rank && (
                            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-[#7c9cd0]/20 text-[#24487c]">
                              {selectedUser.rank}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-[#64748B]">
                          Ngày trao đổi: <strong className="text-[#1E293B]">{selectedHistoryRecord?.actual_date || selectedHistoryRecord?.scheduled_date || '2025-12-25'}</strong>
                        </div>
                      </div>

                      {/* Left Popup Body */}
                      <div className="p-5 overflow-y-auto space-y-4 text-xs">
                        {/* Danh hiệu đạt được trong kỳ trước */}
                        {selectedHistoryAwards.length > 0 && (
                          <div className="p-2.5 bg-gradient-to-r from-[#FEF9C3]/40 to-[#E0F2FE]/40 border border-[#FDE047] rounded-md">
                            <div className="flex items-center space-x-1.5 font-bold text-[#1C1C1A] text-[11px] mb-1">
                              <Trophy size={13} className="text-[#CA8A04]" />
                              <span>Danh hiệu đạt được trong kỳ trước:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedHistoryAwards.map((prop) => {
                                const cat = awardCategories.find((c) => c.id === prop.category_id);
                                return (
                                  <span
                                    key={prop.id}
                                    className="px-2 py-0.5 rounded bg-white border border-[#E7E7E4] font-bold text-[10px] text-[#1C1C1A] shadow-2xs"
                                  >
                                    🏆 {cat?.name?.replace(/\s*\([^)]*\)/g, '')}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 1. Phiếu Chuẩn Bị Thông Tin (Của Quý Trước) */}
                        <div className="p-3.5 bg-[#FBF7EE] border border-[#E7E7E4] rounded-lg space-y-2.5">
                          <div className="flex items-center justify-between pb-1.5 border-b border-[#E7E7E4]">
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full bg-[#B08A3E]" />
                              <h4 className="font-bold text-[#1C1C1A] uppercase tracking-wider text-xs">
                                1. Phiếu Chuẩn Bị Thông Tin
                              </h4>
                            </div>
                            <span className="text-[10px] text-[#B08A3E] font-medium bg-white px-2 py-0.5 rounded border border-[#B08A3E]/30">
                              Leader chuẩn bị kỳ trước
                            </span>
                          </div>

                          <div className="space-y-2 pt-1 text-[11px]">
                            <div>
                              <span className="font-semibold text-[#1C1C1A] block mb-0.5">• Điểm tốt:</span>
                              <div className="text-[#334155] bg-white p-2.5 rounded border border-[#E7E7E4] leading-relaxed">
                                {selectedHistoryRecord?.leader_good_points || '—'}
                              </div>
                            </div>

                            <div>
                              <span className="font-semibold text-[#DC2626] block mb-0.5">• Điểm chưa tốt cần bạn khắc phục:</span>
                              <div className="text-[#334155] bg-white p-2.5 rounded border border-[#E7E7E4] leading-relaxed">
                                {selectedHistoryRecord?.leader_improvements || '—'}
                              </div>
                            </div>

                            <div>
                              <span className="font-semibold text-[#B08A3E] block mb-0.5">• Rủi ro:</span>
                              <div className="text-[#334155] bg-white p-2.5 rounded border border-[#E7E7E4] leading-relaxed">
                                {selectedHistoryRecord?.leader_risks || '—'}
                              </div>
                            </div>

                            <div>
                              <span className="font-semibold text-[#1C1C1A] block mb-0.5">• Khác (Nếu có):</span>
                              <div className="text-[#334155] bg-white p-2.5 rounded border border-[#E7E7E4] leading-relaxed">
                                {selectedHistoryRecord?.leader_other || '—'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Kết Quả Mendan Trực Tiếp (Của Quý Trước) */}
                        <div className="p-3.5 bg-white border-2 border-[#7c9cd0]/35 rounded-lg space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between pb-1.5 border-b border-[#F0F0EE]">
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full bg-[#24487c]" />
                              <h4 className="font-bold text-[#1C1C1A] uppercase tracking-wider text-xs">
                                2. Kết Quả Mendan Trực Tiếp
                              </h4>
                            </div>
                            <span className="text-[10px] text-[#24487c] font-medium bg-[#7c9cd0]/15 px-2 py-0.5 rounded border border-[#7c9cd0]/30">
                              Manager chốt kỳ trước
                            </span>
                          </div>

                          <div className="space-y-2.5 pt-1 text-[11px]">
                            <div>
                              <span className="font-semibold text-[#1C1C1A] block mb-0.5">
                                1. Điểm Tốt & Thành Tích Thống Nhất:
                              </span>
                              <div className="text-[#334155] bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0] leading-relaxed">
                                {selectedHistoryRecord?.good_points || '—'}
                              </div>
                            </div>

                            <div>
                              <span className="font-semibold text-[#DC2626] block mb-0.5">
                                2. Điểm Cần Cải Thiện:
                              </span>
                              <div className="text-[#334155] bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0] leading-relaxed">
                                {selectedHistoryRecord?.improvements || '—'}
                              </div>
                            </div>

                            <div>
                              <span className="font-semibold text-[#047857] block mb-0.5">
                                3. Mục Tiêu Giai Đoạn Tiếp Theo:
                              </span>
                              <div className="text-[#15803D] font-medium bg-[#F0FDF4] p-2.5 rounded border border-[#BBF7D0] leading-relaxed">
                                {selectedHistoryRecord?.next_goals || '—'}
                              </div>
                            </div>

                            {selectedHistoryRecord?.memo && (
                              <div>
                                <span className="font-semibold text-[#1C1C1A] block mb-0.5">
                                  Ghi Chú Lưu Trữ Nội Bộ:
                                </span>
                                <div className="text-[#475569] bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0] leading-relaxed">
                                  {selectedHistoryRecord.memo}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Left Popup Footer */}
                      <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between shrink-0">
                        <span className="text-[11px] text-[#64748B] italic">
                          Hồ sơ quý trước (Chỉ đọc)
                        </span>

                        {selectedHistoryRecord?.next_goals ? (
                          <button
                            type="button"
                            onClick={() => handleReferenceGoal(selectedHistoryRecord.next_goals)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all shadow-2xs cursor-pointer ${
                              copiedGoalFeedback
                                ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                                : 'bg-[#7c9cd0]/20 hover:bg-[#7c9cd0]/35 text-[#1E3A8A] border-[#7c9cd0]/40'
                            }`}
                            title="Đưa mục tiêu quý trước vào ô Ghi chú lưu trữ của kỳ này để theo dõi tiến độ"
                          >
                            {copiedGoalFeedback ? (
                              <>
                                <CheckCircle2 size={13} className="text-[#15803D]" />
                                <span>✓ Đã đưa vào Ghi chú nội bộ!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Tham chiếu mục tiêu sang kỳ này</span>
                              </>
                            )}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ========================================================
                  POP-UP BÊN PHẢI: KỲ ĐÁNH GIÁ HIỆN TẠI
                 ======================================================== */}
              <motion.div
                layout
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className={`w-full ${
                  showHistory ? 'lg:w-[740px] xl:w-[780px]' : 'max-w-3xl'
                } flex flex-col bg-white border border-[#E7E7E4] rounded-lg shadow-2xl max-h-[94vh] overflow-hidden`}
              >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EE] bg-[#FAFAF9] shrink-0">
                <div className="flex items-center space-x-3.5">
                  <img
                    src={
                      selectedUser.avatar_url ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={selectedUser.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E7E7E4] shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-[#1C1C1A]">
                        {cleanName(selectedUser.full_name)}
                      </h3>
                      <span className="text-xs font-mono text-[#8A8A85]">
                        ({selectedUser.employee_code})
                      </span>
                      {selectedUser.rank && (
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#7c9cd0]/20 text-[#24487c] border border-[#7c9cd0]/30">
                          {selectedUser.rank}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8A8A85] mt-0.5">
                      {teams.find((t) => t.id === selectedUser.team_id)?.name || 'Chưa gán team'} •{' '}
                      {selectedUser.position || 'Nhân viên nghiệp vụ'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Nút Xem Lịch Sử Các Quý Trước */}
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold border active:scale-95 transition-all select-none cursor-pointer ${
                      showHistory
                        ? 'bg-[#24487c] text-white border-[#24487c] shadow-xs'
                        : 'bg-white hover:bg-[#F0F0EE] text-[#24487c] border-[#7c9cd0]/40 shadow-2xs'
                    }`}
                    title="Bật/Tắt pop-up hiển thị của quý trước ở bên trái để đối chiếu"
                  >
                    <History size={13} />
                    <span>{showHistory ? 'Đóng pop-up quý trước' : 'Xem lịch sử quý trước'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-[#8A8A85] hover:text-[#1C1C1A] p-1.5 rounded-md hover:bg-[#E7E7E4] transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* Meta Status and Quarter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#F6F6F4] rounded-lg border border-[#E7E7E4]">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[#1C1C1A]">Kỳ Đánh Giá:</span>
                    <span className="px-2.5 py-0.5 rounded bg-white text-[#24487c] font-bold border border-[#E7E7E4]">
                      {formData.quarter_id ? `Định kì - Quý ${formData.quarter_id.replace('Q', '')}` : 'Không định kì'} / 2026
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[#1C1C1A]">Trạng thái:</span>
                    {getStatusBadge((formData.status as MendanStatus) || 'not_started', formData.visibility_scope)}
                  </div>
                </div>

                {/* SECTION: Danh Hiệu & Giải Thưởng Đã Phê Duyệt */}
                <div className="p-3.5 bg-gradient-to-r from-[#FEF9C3]/30 to-[#E0F2FE]/30 border border-[#FDE047]/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 font-bold text-[#1C1C1A]">
                      <Trophy size={14} className="text-[#CA8A04]" />
                      <span>Giải Thưởng & Vinh Danh Đã Đạt Được</span>
                    </div>
                    <span className="text-[10px] text-[#8A8A85]">
                      Cập nhật tự động từ kết quả phê duyệt giải thưởng
                    </span>
                  </div>

                  {selectedUserAwards.length === 0 ? (
                    <p className="text-[11px] text-[#8A8A85] italic">
                      Chưa có danh hiệu giải thưởng nào được ghi nhận trong hệ thống cho nhân sự này.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedUserAwards.map((prop) => {
                        const cat = awardCategories.find((c) => c.id === prop.category_id);
                        const qText = prop.quarter_id ? `${prop.quarter_id}/` : '';
                        return (
                          <div
                            key={prop.id}
                            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E7E7E4] shadow-2xs"
                            title={prop.reason || 'Khen thưởng thành tích'}
                          >
                            <Trophy size={13} className="text-[#CA8A04]" />
                            <span className="font-bold text-[#1C1C1A] text-[11px]">
                              {cat?.name?.replace(/\s*\([^)]*\)/g, '')}
                            </span>
                            <span className="text-[10px] font-mono text-[#24487c] bg-[#7c9cd0]/20 px-1 py-0.5 rounded font-bold">
                              {qText}{prop.year}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* THAM CHIẾU MỤC TIÊU QUÝ TRƯỚC (HIỂN THỊ TRỰC TIẾP TRÊN FORM HIỆN TẠI) */}
                {selectedHistoryRecord?.next_goals && (
                  <div
                    className={`p-3 rounded-lg border transition-all ${
                      copiedGoalFeedback
                        ? 'bg-[#DCFCE7]/70 border-[#86EFAC] ring-2 ring-[#86EFAC]'
                        : 'bg-gradient-to-r from-[#F0FDF4] to-[#EFF6FF] border-[#BBF7D0]'
                    } flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className="w-6 h-6 rounded-md bg-[#16A34A] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs text-xs font-bold">
                        🎯
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-[#15803D]">
                            Mục tiêu cam kết quý trước ({selectedHistoryQuarter ? `Quý ${selectedHistoryQuarter.replace('Q', '')}/2025` : 'kỳ trước'}):
                          </span>
                          {copiedGoalFeedback && (
                            <span className="text-[10px] font-bold text-[#15803D] bg-white px-1.5 py-0.5 rounded border border-[#86EFAC] animate-in fade-in">
                              ✓ Đã chèn vào Ghi chú nội bộ
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#166534] font-medium mt-0.5 leading-relaxed">
                          "{selectedHistoryRecord.next_goals}"
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReferenceGoal(selectedHistoryRecord.next_goals)}
                      className={`shrink-0 flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                        copiedGoalFeedback
                          ? 'bg-[#15803D] text-white border-[#15803D]'
                          : 'bg-white hover:bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                      }`}
                      title="Chèn nội dung mục tiêu này vào ô Ghi chú lưu trữ nội bộ bên dưới"
                    >
                      {copiedGoalFeedback ? (
                        <>
                          <CheckCircle2 size={13} className="text-white" />
                          <span>Đã chèn</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Chèn vào Ghi chú</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* PHẦN 1: GIAO DIỆN CHUẨN BỊ THÔNG TIN */}
                <div className="p-4 bg-[#FBF7EE] border border-[#E7E7E4] rounded-lg space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#B08A3E]" />
                      <h4 className="font-bold text-[#1C1C1A] uppercase tracking-wider text-xs">
                        1. Phiếu Chuẩn Bị Thông Tin
                      </h4>
                    </div>
                    <span className="text-[10px] text-[#B08A3E] font-medium bg-white px-2 py-0.5 rounded border border-[#B08A3E]/30">
                      Leader điền trước → Gửi Manager
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {/* Điểm tốt */}
                    <div>
                      <label className="font-semibold text-[#1C1C1A] block mb-1">
                        • Điểm tốt:
                      </label>
                      <textarea
                        rows={3}
                        value={formData.leader_good_points || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, leader_good_points: e.target.value })
                        }
                        placeholder="Thành tích nổi bật, điểm mạnh, tinh thần trách nhiệm, thái độ làm việc..."
                        className="w-full bg-white border border-[#E7E7E4] rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden focus:border-[#7c9cd0]"
                      />
                    </div>

                    {/* Điểm chưa tốt cần bạn khắc phục */}
                    <div>
                      <label className="font-semibold text-[#1C1C1A] block mb-1 text-[#DC2626]">
                        • Điểm chưa tốt cần bạn khắc phục:
                      </label>
                      <textarea
                        rows={3}
                        value={formData.leader_improvements || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, leader_improvements: e.target.value })
                        }
                        placeholder="Sai sót chứng từ, đi muộn, tốc độ xử lý, kỹ năng cần đào tạo thêm..."
                        className="w-full bg-white border border-[#E7E7E4] rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden focus:border-[#7c9cd0]"
                      />
                    </div>

                    {/* Rủi ro */}
                    <div>
                      <label className="font-semibold text-[#1C1C1A] block mb-1 text-[#B08A3E]">
                        • Rủi ro:
                      </label>
                      <textarea
                        rows={2}
                        value={formData.leader_risks || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, leader_risks: e.target.value })
                        }
                        placeholder="Nguy cơ quá tải, giảm sút động lực, rủi ro nghỉ việc, chậm trễ dự án..."
                        className="w-full bg-white border border-[#E7E7E4] rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden focus:border-[#7c9cd0]"
                      />
                    </div>

                    {/* Khác (Nếu có) */}
                    <div>
                      <label className="font-semibold text-[#1C1C1A] block mb-1">
                        • Khác (Nếu có):
                      </label>
                      <textarea
                        rows={2}
                        value={formData.leader_other || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, leader_other: e.target.value })
                        }
                        placeholder="Nguyện vọng thăng tiến, chuyển nhóm, ý kiến đóng góp, hoàn cảnh gia đình..."
                        className="w-full bg-white border border-[#E7E7E4] rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden focus:border-[#7c9cd0]"
                      />
                    </div>
                  </div>

                  {/* Leader Actions Button inside Leader Box */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E7E7E4]/60 text-[11px]">
                    <span className="text-[#8A8A85]">
                      {formData.status === 'pre_mendan'
                        ? '✓ Đã nộp thông tin cho Manager. Manager sẽ dùng thông tin này để Mendan.'
                        : formData.status === 'completed'
                        ? '✓ Mendan đã hoàn thành. Leader có thể xem lại kết quả bên dưới.'
                        : 'Leader nộp đánh giá này để chuyển trạng thái sang "Đã đánh giá".'}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleLeaderSaveDraft}
                        className="px-3 py-1 rounded bg-white hover:bg-[#F0F0EE] border border-[#E7E7E4] font-medium text-[#4A4A46] cursor-pointer"
                      >
                        Lưu Nháp Chuẩn Bị
                      </button>
                      <button
                        type="button"
                        onClick={handleLeaderSubmitToManager}
                        className="px-3 py-1 rounded bg-[#24487c] hover:bg-[#153C77] text-white font-semibold shadow-xs cursor-pointer"
                      >
                        Nộp Đánh Giá Cho Manager
                      </button>
                    </div>
                  </div>
                </div>

                {/* PHẦN 2: GIAO DIỆN KẾT QUẢ MENDAN TRỰC TIẾP */}
                <div className="p-4 bg-white border-2 border-[#7c9cd0]/30 rounded-lg space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EE]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#24487c]" />
                      <h4 className="font-bold text-[#1C1C1A] uppercase tracking-wider text-xs">
                        2. Kết Quả Mendan Trực Tiếp
                      </h4>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Nút sao chép gợi ý từ Leader */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={handleCopyLeaderToManager}
                          className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-[#24487c] bg-[#7c9cd0]/15 hover:bg-[#7c9cd0]/25 rounded border border-[#7c9cd0]/30 cursor-pointer"
                          title="Sao chép nội dung chuẩn bị từ Leader vào biên bản của Manager"
                        >
                          <Copy size={12} />
                          <span>Sao chép gợi ý từ Leader</span>
                        </button>
                      )}

                      {/* Format Selector: Tiêu Chuẩn & Tự Do */}
                      <div className="w-36">
                        <select
                          value={formData.content_format || 'standard_3'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              content_format: e.target.value as 'standard_3' | 'single_note',
                            })
                          }
                          className="w-full bg-[#7c9cd0]/10 border border-[#7c9cd0]/30 rounded px-2 py-1 text-xs font-semibold text-[#24487c] focus:outline-hidden cursor-pointer"
                        >
                          <option value="standard_3">Tiêu Chuẩn</option>
                          <option value="single_note">Tự Do</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Option A: Chuẩn 3 mục */}
                  {(formData.content_format === 'standard_3' || !formData.content_format) && (
                    <div className="space-y-3">
                      <div>
                        <label className="font-semibold text-[#1C1C1A] block mb-1">
                          1. Điểm Tốt & Thành Tích Thống Nhất (Good Points)
                        </label>
                        <textarea
                          rows={2}
                          value={formData.good_points || ''}
                          onChange={(e) => setFormData({ ...formData, good_points: e.target.value })}
                          placeholder="Manager ghi nhận ưu điểm và thế mạnh của bạn trong buổi trao đổi..."
                          className="w-full bg-white border border-[#E7E7E4] rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden focus:border-[#7c9cd0]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[#1C1C1A] block mb-1 text-[#DC2626]">
                          2. Điểm Cần Cải Thiện (Improvements)
                        </label>
                        <textarea
                          rows={2}
                          value={formData.improvements || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, improvements: e.target.value })
                          }
                          placeholder="Những điểm thỏa thuận cần khắc phục trong kỳ tới..."
                          className="w-full bg-white border border-[#E7E7E4] rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden focus:border-[#7c9cd0]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[#1C1C1A] block mb-1 text-[#24487c]">
                          3. Mục Tiêu Giai Đoạn Tiếp Theo (Next Goals)
                        </label>
                        <textarea
                          rows={2}
                          value={formData.next_goals || ''}
                          onChange={(e) => setFormData({ ...formData, next_goals: e.target.value })}
                          placeholder="Chỉ số KPI cam kết, định hướng chuyên môn, đào tạo mới trong quý sau..."
                          className="w-full bg-white border border-[#E7E7E4] rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden focus:border-[#7c9cd0]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Option B: 1 ô ghi chú tự do */}
                  {formData.content_format === 'single_note' && (
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#1C1C1A] block">
                        Nội Dung Trao Đổi / Ghi Chú Tự Do
                      </label>
                      <textarea
                        rows={6}
                        value={formData.single_note || formData.memo || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            single_note: e.target.value,
                            memo: e.target.value,
                          })
                        }
                        placeholder="Ghi chép tự do nội dung buổi trao đổi Mendan, cam kết của nhân sự..."
                        className="w-full bg-white border border-[#E7E7E4] rounded p-3 text-xs text-[#1C1C1A] focus:outline-hidden focus:border-[#7c9cd0] leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Post-mendan Memo & Internal Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-[#1C1C1A]">
                        Ghi Chú Lưu Trữ Nội Bộ (Memo Cho Leader & Quản Lý)
                      </label>
                      {copiedGoalFeedback && (
                        <span className="text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC] animate-in fade-in">
                          ✓ Đã thêm mục tiêu quý trước vào đây
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={formData.memo || ''}
                      onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                      placeholder="Tổng kết thỏa thuận, lưu ý đặc biệt để Leader tiện theo dõi..."
                      className={`w-full bg-white border rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden transition-all ${
                        copiedGoalFeedback
                          ? 'border-[#15803D] ring-2 ring-[#86EFAC] bg-[#F0FDF4]'
                          : 'border-[#E7E7E4] focus:border-[#7c9cd0]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#F0F0EE] bg-[#FAFAF9] shrink-0">
                <div className="text-[11px] text-[#8A8A85]">
                  {formData.status === 'completed' ? (
                    <span className="text-[#15803D] font-medium flex items-center space-x-1">
                      <CheckCircle2 size={13} />
                      <span>Hồ sơ này đã hoàn tất Mendan.</span>
                    </span>
                  ) : formData.status === 'pre_mendan' ? (
                    <span className="text-[#1E40AF] font-medium flex items-center space-x-1">
                      <ArrowRight size={13} />
                      <span>Leader đã nộp đánh giá. Sẵn sàng để Manager Mendan.</span>
                    </span>
                  ) : (
                    <span>Đang ở trạng thái: Chưa đánh giá.</span>
                  )}
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-medium rounded border border-[#E7E7E4] bg-white text-[#4A4A46] hover:bg-[#F6F6F4] transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>

                  <button
                    type="button"
                    onClick={handleManagerSaveDraft}
                    className="px-4 py-1.5 text-xs font-medium rounded border border-[#7c9cd0]/50 bg-white text-[#24487c] hover:bg-[#7c9cd0]/10 transition-colors cursor-pointer"
                  >
                    Lưu Bản Nháp
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleManagerComplete}
                      className="flex items-center space-x-1 px-5 py-1.5 text-xs font-semibold rounded bg-[#24487c] hover:bg-[#153C77] text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      <span>{formData.status === 'completed' ? 'Lưu & Cập Nhật' : 'Hoàn Thành Mendan'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ========================================================
        MODAL: CÀI ĐẶT QUYỀN XEM & CÔNG KHAI (3-CHẤM ACTION)
       ======================================================== */}
    {isVisibilityModalOpen && visibilityTarget && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white border border-[#E7E7E4] rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="px-5 py-4 bg-[#7c9cd0] text-white flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Cài Đặt Quyền Xem & Công Khai
              </h3>
              <p className="text-xs text-white/85 mt-0.5">
                Nhân sự: <strong>{cleanName(visibilityTarget.member.full_name)}</strong> ({visibilityTarget.member.employee_code})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsVisibilityModalOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 text-xs">
            <div className="text-[11px] text-[#4A4A46] bg-[#F6F6F4] p-3 rounded-lg border border-[#E7E7E4]">
              Thiết lập quyền truy cập cho biên bản trao đổi Mendan này. Quyền xem quyết định ai có thể đọc nội dung đánh giá và mục tiêu đã thống nhất.
            </div>

            <div className="space-y-3">
              {/* Option 1: Công Khai */}
              <label
                className={`p-3.5 rounded-lg border flex flex-col space-y-2 cursor-pointer transition-all ${
                  visibilityFormType === 'public'
                    ? 'bg-[#F0FDF4] border-[#86EFAC] ring-2 ring-[#22C55E]/20 shadow-xs'
                    : 'bg-white border-[#E2E8F0] hover:border-[#94A3B8]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="vis_type"
                      value="public"
                      checked={visibilityFormType === 'public'}
                      onChange={() => setVisibilityFormType('public')}
                      className="accent-[#15803D] mt-0.5 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-[#15803D] flex items-center space-x-1.5">
                      <Eye size={13} />
                      <span>Công Khai (Nhân sự được đánh giá và Người đánh giá, ngoài ra có thể chọn thêm các thành viên khác để xem)</span>
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#475569] pl-5 leading-relaxed">
                  Nhân sự ({cleanName(visibilityTarget.member.full_name)}) và Người đánh giá sẽ được xem kết quả biên bản này.
                </p>
              </label>

              {/* Sub-selector for extra members when Public */}
              {visibilityFormType === 'public' && (
                <div className="ml-5 p-3.5 bg-white border border-[#BBF7D0] rounded-lg space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#15803D]">
                      Chọn thêm thành viên khác để xem ({visibilityAllowedIds.length} người đã chọn):
                    </span>
                    {visibilityAllowedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setVisibilityAllowedIds([])}
                        className="text-[10px] text-[#DC2626] hover:underline font-medium cursor-pointer"
                      >
                        Bỏ chọn tất cả
                      </button>
                    )}
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm nhân sự để cấp quyền xem..."
                      value={viewerSearch}
                      onChange={(e) => setViewerSearch(e.target.value)}
                      className="w-full text-xs p-1.5 pl-7 border border-[#CBD5E1] rounded bg-[#F8FAFC] focus:outline-hidden"
                    />
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  </div>

                  {/* Member checklist */}
                  <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-[#F1F5F9] pr-1">
                    {users
                      .filter((u) => u.id !== visibilityTarget.member.id)
                      .filter((u) => {
                        if (!viewerSearch.trim()) return true;
                        const kw = viewerSearch.toLowerCase();
                        return (
                          cleanName(u.full_name).toLowerCase().includes(kw) ||
                          u.employee_code.toLowerCase().includes(kw)
                        );
                      })
                      .map((u) => {
                        const isChecked = visibilityAllowedIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className="flex items-center justify-between py-1.5 px-2 hover:bg-[#F1F5F9] rounded cursor-pointer text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setVisibilityAllowedIds([...visibilityAllowedIds, u.id]);
                                  } else {
                                    setVisibilityAllowedIds(visibilityAllowedIds.filter((id) => id !== u.id));
                                  }
                                }}
                                className="accent-[#15803D] cursor-pointer"
                              />
                              <span className="font-medium text-[#1C1C1A]">{cleanName(u.full_name)}</span>
                              <span className="text-[10px] text-[#8A8A85]">({u.role})</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#64748B]">{u.employee_code}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Option 2: Không Công Khai */}
              <label
                className={`p-3.5 rounded-lg border flex flex-col space-y-2 cursor-pointer transition-all ${
                  visibilityFormType === 'private'
                    ? 'bg-[#FFF7ED] border-[#FDBA74] ring-2 ring-[#EA580C]/20 shadow-xs'
                    : 'bg-white border-[#E2E8F0] hover:border-[#94A3B8]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="vis_type"
                      value="private"
                      checked={visibilityFormType === 'private'}
                      onChange={() => setVisibilityFormType('private')}
                      className="accent-[#C2410C] mt-0.5 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-[#C2410C] flex items-center space-x-1.5">
                      <Lock size={13} />
                      <span>Không Công Khai (Chỉ Người Đánh Giá)</span>
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#475569] pl-5 leading-relaxed">
                  Chỉ người trực tiếp thực hiện đánh giá (Quản lý) mới có quyền xem nội dung biên bản này. Nhân sự và các thành viên khác đều không được xem.
                </p>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-[#F6F6F4] border-t border-[#E7E7E4] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsVisibilityModalOpen(false)}
              className="px-3.5 py-1.5 rounded-md border border-[#E7E7E4] text-xs font-semibold text-[#4A4A46] hover:bg-white transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveVisibility}
              className="px-4 py-1.5 rounded-md bg-[#7c9cd0] hover:bg-[#6788be] text-xs font-bold text-white transition-colors shadow-xs cursor-pointer"
            >
              Lưu Cài Đặt Quyền Xem
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ========================================================
        MODAL: TẠO MENDAN MỚI (DÀNH CHO ADMIN & MASTER)
       ======================================================== */}
    {isCreateModalOpen && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white border border-[#E7E7E4] rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="px-5 py-4 bg-[#24487c] text-white flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Lập Lịch Trao Đổi Mendan Mới
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                Tạo biên bản và lên lịch Mendan định kỳ hoặc không định kỳ (Quyền Admin & Master)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveCreateMendan} className="p-5 space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-[#1C1C1A] block mb-1">
                Nhân Sự Được Đánh Giá & Trao Đổi:
              </label>
              <select
                value={createForm.user_id}
                onChange={(e) => setCreateForm({ ...createForm, user_id: e.target.value })}
                className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-hidden"
                required
              >
                <option value="" disabled>-- Chọn nhân sự --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {cleanName(u.full_name)} ({u.employee_code} - {u.rank || 'Rank'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[#1C1C1A] block mb-1">
                Người Phụ Trách Đánh Giá (Manager / Leader):
              </label>
              <select
                value={createForm.evaluator_id}
                onChange={(e) => setCreateForm({ ...createForm, evaluator_id: e.target.value })}
                className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-hidden"
              >
                {users
                  .filter((u) => u.role === 'admin' || u.role === 'master' || u.role === 'leader')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {cleanName(u.full_name)} ({u.role.toUpperCase()})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1C1C1A] block mb-1">
                  Hình thức Mendan:
                </label>
                <select
                  value={createForm.evaluation_type}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      evaluation_type: e.target.value as 'quarterly' | 'adhoc',
                    })
                  }
                  className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-hidden"
                >
                  <option value="quarterly">Định kỳ Quý</option>
                  <option value="adhoc">Không định kỳ</option>
                </select>
              </div>

              {createForm.evaluation_type === 'quarterly' && (
                <div>
                  <label className="font-bold text-[#1C1C1A] block mb-1">
                    Kỳ Quý:
                  </label>
                  <select
                    value={createForm.quarter_id}
                    onChange={(e) => setCreateForm({ ...createForm, quarter_id: e.target.value })}
                    className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-hidden"
                  >
                    <option value="Q1">Quý 1</option>
                    <option value="Q2">Quý 2</option>
                    <option value="Q3">Quý 3</option>
                    <option value="Q4">Quý 4</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-[#1C1C1A] block mb-1">
                Ngày Dự Kiến Trao Đổi:
              </label>
              <input
                type="date"
                value={createForm.scheduled_date}
                onChange={(e) => setCreateForm({ ...createForm, scheduled_date: e.target.value })}
                className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[#1C1C1A] block mb-1">
                Ghi chú mục tiêu / Định hướng ban đầu:
              </label>
              <textarea
                rows={2}
                value={createForm.pre_notes}
                onChange={(e) => setCreateForm({ ...createForm, pre_notes: e.target.value })}
                placeholder="Ghi chú nội dung trọng tâm chuẩn bị cho buổi trao đổi..."
                className="w-full p-2 border border-[#CBD5E1] rounded text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-[#1C1C1A] block mb-1">
                Quyền Xem & Công Khai:
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="create_vis"
                    value="public"
                    checked={createForm.visibility_type === 'public'}
                    onChange={() => setCreateForm({ ...createForm, visibility_type: 'public' })}
                    className="accent-[#15803D]"
                  />
                  <span className="text-xs text-[#15803D] font-medium">
                    Công Khai (Nhân sự được đánh giá và Người đánh giá, ngoài ra có thể chọn thêm các thành viên khác để xem)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="create_vis"
                    value="private"
                    checked={createForm.visibility_type === 'private'}
                    onChange={() => setCreateForm({ ...createForm, visibility_type: 'private' })}
                    className="accent-[#C2410C]"
                  />
                  <span className="text-xs text-[#C2410C] font-medium">
                    Không Công Khai (Chỉ Người Đánh Giá)
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-3 border-t border-[#F0F0EE] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3.5 py-1.5 rounded-md border border-[#E7E7E4] text-xs font-semibold text-[#4A4A46] hover:bg-white transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-md bg-[#24487c] hover:bg-[#1E3A5F] text-xs font-bold text-white transition-colors shadow-xs cursor-pointer"
              >
                Tạo & Lên Lịch Mendan
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
};
