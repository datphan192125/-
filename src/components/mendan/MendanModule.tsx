import React, { useState, useMemo } from 'react';
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
  CheckCircle2,
  History,
  Copy,
  ArrowRight,
  AlertCircle,
  X,
  Briefcase,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MendanRecord, MendanStatus, RANK_STYLE_CONFIG, User } from '../../types';

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
    createOrUpdateMendan,
    isLeaderOrAdmin,
    canViewTeam,
  } = useApp();

  const [activeTeamFilter, setActiveTeamFilter] = useState<string>('all');
  const [activeQuarterFilter, setActiveQuarterFilter] = useState<string>('Q1');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeRecord, setActiveRecord] = useState<MendanRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<MendanRecord>>({});
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [selectedHistoryQuarter, setSelectedHistoryQuarter] = useState<string>('Q4');

  const isAdmin = currentUser.role === 'admin';
  const isLeader = currentUser.role === 'leader' || currentUser.role === 'subleader';

  // Privacy protection: Regular members cannot view the internal Mendan assessment records
  if (!isLeaderOrAdmin) {
    return (
      <div className="bg-white border border-[#E7E7E4] rounded-lg p-12 text-center max-w-xl mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#FBF7EE] text-[#B08A3E] flex items-center justify-center mx-auto mb-4 border border-[#B08A3E]/30">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-lg font-bold text-[#1C1C1A] mb-2">
          Khu Vực Quản Lý & Biên Bản Đánh Giá Mendan (面談)
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

  const getStatusBadge = (status: MendanStatus) => {
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
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold bg-[#EDF5EE] text-[#166534] border border-[#BBF7D0] whitespace-nowrap shadow-2xs">
            Hoàn thành mendan
          </span>
        );
    }
  };

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
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">
            Đánh Giá Định Kỳ & Trao Đổi Mendan (面談)
          </h1>
          <p className="text-xs text-[#8A8A85] mt-1">
            Quy trình chuẩn 2 cấp: Leader/Subleader chuẩn bị thông tin đánh giá trước → Manager trực tiếp Mendan & ghi nhận kết quả lưu trữ
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#24487c] bg-[#7c9cd0]/10 border border-[#7c9cd0]/30 px-3 py-1.5 rounded-md font-medium">
          <FileText size={14} className="text-[#24487c]" />
          <span>Hệ thống hiển thị đầy đủ toàn bộ nhân sự theo từng quý</span>
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
              DANH SÁCH HỒ SƠ ĐÁNH GIÁ MENDAN ({fullStaffRecords.length})
            </span>
          </div>
          <span className="text-xs text-[#24487c] font-medium bg-[#7c9cd0]/15 px-2.5 py-1 rounded border border-[#7c9cd0]/30">
            Luồng: Chưa đánh giá → Đã đánh giá (Leader nộp) → Hoàn thành mendan (Manager chốt)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse table-fixed">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[10%]" />
              <col className="w-[11%]" />
              <col className="w-[19%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[11%]" />
            </colgroup>
            <thead>
              <tr className="text-[#24487c] text-[11px] tracking-wider uppercase bg-[#7c9cd0]/10 border-b border-[#c2d4ee] font-bold">
                <th className="py-3 px-4">Nhân Sự</th>
                <th className="py-3 px-3 text-center">Cấp Bậc</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Giải Thưởng Đã Đạt</th>
                <th className="py-3 px-4">Ngày Trao Đổi</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
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

                  return (
                    <tr key={`${member.id}-${rec.id}`} className="hover:bg-[#FAFAF9] transition-colors">
                      {/* 1. Nhân Sự */}
                      <td className="py-3.5 px-4">
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

                      {/* 2. Cấp Bậc (ở giữa Nhân sự và Team) */}
                      <td className="py-3.5 px-3 text-center">
                        {member?.rank && rankConfig ? (
                          <span
                            style={{
                              backgroundColor: rankConfig.bg,
                              color: rankConfig.text,
                              borderColor: rankConfig.border || 'transparent',
                            }}
                            className="inline-block px-2.5 py-0.5 rounded font-mono text-[11px] font-bold border shadow-2xs"
                          >
                            {member.rank}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-[#8A8A85]">—</span>
                        )}
                      </td>

                      {/* 3. Team */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-xs text-[#24487c] bg-[#7c9cd0]/10 px-2 py-0.5 rounded border border-[#7c9cd0]/20 inline-block">
                          {team?.name || '—'}
                        </span>
                      </td>

                      {/* 4. Giải Thưởng Đã Đạt (Icon) */}
                      <td className="py-3.5 px-4">
                        {renderUserAwards(member.id, rec.quarter_id)}
                      </td>

                      {/* 5. Ngày Trao Đổi */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-[#1C1C1A] font-medium">
                          {rec.scheduled_date || 'Chưa xếp lịch'}
                        </div>
                        {rec.actual_date && rec.actual_date !== rec.scheduled_date && (
                          <div className="text-[10px] text-[#8A8A85]">Thực tế: {rec.actual_date}</div>
                        )}
                      </td>

                      {/* 6. Trạng Thái: 3 Trạng thái chính xác */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(rec.status)}
                      </td>

                      {/* 7. Thao Tác */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(member, rec)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#7c9cd0]/15 hover:bg-[#7c9cd0]/25 text-[#24487c] border border-[#7c9cd0]/30 transition-colors shadow-2xs cursor-pointer"
                          title="Bấm để đánh giá, xem hoặc cập nhật biên bản Mendan"
                        >
                          {rec.status === 'completed' ? (
                            <>
                              <Eye size={12} />
                              <span>Xem kết quả</span>
                            </>
                          ) : rec.status === 'pre_mendan' ? (
                            <>
                              <Edit3 size={12} />
                              <span>{isAdmin ? 'Mendan' : 'Sửa chuẩn bị'}</span>
                            </>
                          ) : (
                            <>
                              <Edit3 size={12} />
                              <span>Đánh giá</span>
                            </>
                          )}
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

      {/* Detail / Assessment Modal Container */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div
            className={`flex flex-col lg:flex-row items-stretch justify-center gap-4 w-full ${
              showHistory ? 'max-w-[1440px]' : 'max-w-3xl'
            } max-h-[94vh] transition-all duration-200`}
          >
            {/* ========================================================
                POP-UP BÊN TRÁI: HIỂN THỊ CỦA QUÝ TRƯỚC (LỊCH SỬ MENDAN)
               ======================================================== */}
            {showHistory && (
              <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 bg-white border-2 border-[#7c9cd0]/60 rounded-lg shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in slide-in-from-left-4 duration-200">
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
                      className="text-[#64748B] hover:text-[#1E293B] p-1.5 rounded-md hover:bg-[#E2E8F0] transition-colors cursor-pointer"
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
            )}

            {/* ========================================================
                POP-UP BÊN PHẢI: KỲ ĐÁNH GIÁ HIỆN TẠI
               ======================================================== */}
            <div
              className={`w-full ${
                showHistory ? 'lg:w-[700px] xl:w-[760px]' : 'w-full'
              } flex flex-col bg-white border border-[#E7E7E4] rounded-lg shadow-2xl max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
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
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
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
                    {getStatusBadge((formData.status as MendanStatus) || 'not_started')}
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
                      <span>Hoàn Thành Mendan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
