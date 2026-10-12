import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Plus,
  Send,
  Lock,
  Globe,
  Users,
  Search,
  Check,
  X,
  Sliders,
  AlertCircle,
  CheckSquare,
  MoreHorizontal,
  RotateCcw,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AwardCategory, AwardProposal, AwardVisibilityType, ProposalStatus } from '../../types';

export const AwardsModule: React.FC = () => {
  const {
    currentUser,
    users,
    teams,
    awardCategories,
    awardProposals,
    quarterConfigs,
    submitAwardProposal,
    reviewAwardProposal,
    updateAwardVisibility,
    bulkUpdateAwardVisibility,
    togglePublishAwards,
    isAdmin,
    isMaster,
    isLeaderOrAdmin,
  } = useApp();

  const [activeQuarter, setActiveQuarter] = useState<string>('Q1');
  const [activeView, setActiveView] = useState<'hall_of_fame' | 'proposals'>('hall_of_fame');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [selectedProposalToReview, setSelectedProposalToReview] = useState<AwardProposal | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');

  // 3-dots action menu & specialized action modals (Từ Chối, Yêu Cầu Xem Xét Lại)
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [rejectModalProposal, setRejectModalProposal] = useState<AwardProposal | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [revisionModalProposal, setRevisionModalProposal] = useState<AwardProposal | null>(null);
  const [revisionNotes, setRevisionNotes] = useState<string>('');

  // Bulk selection of awards (Hình 3 & Hình 4)
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedAwardIds, setSelectedAwardIds] = useState<string[]>([]);

  // Filter & Detail preview for proposals queue
  const [proposalStatusFilter, setProposalStatusFilter] = useState<'all' | 'pending' | 'approved' | 'revision_requested' | 'rejected'>('all');
  const [previewProposalDetail, setPreviewProposalDetail] = useState<AwardProposal | null>(null);

  // Visibility states for Review Modal
  const [reviewVisibilityType, setReviewVisibilityType] = useState<AwardVisibilityType>('public');
  const [reviewAllowedViewerIds, setReviewAllowedViewerIds] = useState<string[]>([]);
  const [reviewViewerSearch, setReviewViewerSearch] = useState<string>('');

  // Visibility states for Edit Visibility Modal (for already approved awards)
  const [editingVisibilityProposal, setEditingVisibilityProposal] = useState<AwardProposal | null>(null);
  const [editVisibilityType, setEditVisibilityType] = useState<AwardVisibilityType>('public');
  const [editAllowedViewerIds, setEditAllowedViewerIds] = useState<string[]>([]);
  const [editViewerSearch, setEditViewerSearch] = useState<string>('');

  // Proposal form state
  const [newProposalUser, setNewProposalUser] = useState<string>('');
  const [newProposalCategory, setNewProposalCategory] = useState<string>('');
  const [newProposalReason, setNewProposalReason] = useState<string>('');

  const currentQuarterConfig = quarterConfigs.find((q) => q.id === activeQuarter);
  const isQuarterPublished = currentQuarterConfig?.is_published_awards ?? false;

  // Quyền truy cập Hàng Chờ Đề Xuất: Chỉ Master, Admin hoặc Leader/Subleader mới có quyền vào hàng chờ đề xuất
  const canAccessProposals = isMaster || isAdmin || isLeaderOrAdmin;
  const currentView = canAccessProposals ? activeView : 'hall_of_fame';

  // Lọc danh sách đề xuất hiển thị trong Hàng Chờ Đề Xuất theo quyền hạn
  const viewableProposals = awardProposals.filter((p) => {
    if (!canAccessProposals) return false;
    // Master và Admin xem được tất cả các đề xuất của mọi phòng ban
    if (isMaster || isAdmin) return true;
    // Leader/Subleader chỉ xem được đề xuất do mình gửi hoặc nhân sự thuộc team mình
    const honoree = users.find((u) => u.id === p.user_id);
    return p.proposed_by === currentUser.id || (honoree && honoree.team_id === currentUser.team_id);
  });

  // Filtered proposals based on proposalStatusFilter for the overview approval queue
  const filteredProposals = useMemo(() => {
    return viewableProposals.filter((p) => {
      if (proposalStatusFilter === 'all') return true;
      return p.status === proposalStatusFilter;
    });
  }, [viewableProposals, proposalStatusFilter]);

  // Filter approved proposals for the Hall of Fame based on role and visibility
  const publishedProposals = awardProposals.filter((p) => {
    if (p.quarter_id !== activeQuarter || p.status !== 'approved') return false;

    // Master and Admin can always see everything in the Hall of Fame
    if (isMaster || isAdmin) {
      if (isPreviewMode) {
        // In preview mode, pretend to be a regular member
        const mode = p.visibility_type || (p.is_published ? 'public' : 'private');
        if (mode === 'public') return true;
        if (mode === 'custom') return p.allowed_viewer_ids?.includes(currentUser.id) ?? false;
        return false;
      }
      return true;
    }

    // Regular users: must be published overall, and respect per-award visibility
    if (!isQuarterPublished) return false;

    const mode = p.visibility_type || (p.is_published ? 'public' : 'private');
    if (mode === 'public') return true;
    if (mode === 'custom') {
      return p.allowed_viewer_ids?.includes(currentUser.id) ?? false;
    }
    // 'private' is completely hidden from normal users
    return false;
  });

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy':
        return <Trophy size={18} className="text-[#B08A3E]" />;
      case 'ShieldCheck':
        return <ShieldCheck size={18} className="text-[#6B8F71]" />;
      case 'Sparkles':
        return <Sparkles size={18} className="text-[#8A8A85]" />;
      case 'HeartHandshake':
        return <HeartHandshake size={18} className="text-[#B85D5D]" />;
      case 'Star':
      default:
        return <Star size={18} className="text-[#B08A3E]" />;
    }
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposalUser || !newProposalCategory || !newProposalReason) {
      alert('Vui lòng điền đầy đủ thông tin đề xuất.');
      return;
    }

    submitAwardProposal({
      user_id: newProposalUser,
      category_id: newProposalCategory,
      quarter_id: activeQuarter,
      year: 2026,
      proposed_by: currentUser.id,
      reason: newProposalReason,
      is_published: false,
    });

    setIsSubmitModalOpen(false);
    setNewProposalUser('');
    setNewProposalReason('');
  };

  const handleOpenReviewModal = (prop: AwardProposal) => {
    setSelectedProposalToReview(prop);
    setFeedbackText(prop.feedback || '');
    setReviewVisibilityType(prop.visibility_type || 'public');
    setReviewAllowedViewerIds(prop.allowed_viewer_ids || (prop.user_id ? [prop.user_id] : []));
    setReviewViewerSearch('');
  };

  const handleReviewAction = (status: ProposalStatus) => {
    if (!selectedProposalToReview) return;
    reviewAwardProposal(
      selectedProposalToReview.id,
      status,
      feedbackText,
      reviewVisibilityType,
      reviewAllowedViewerIds
    );
    setSelectedProposalToReview(null);
    setFeedbackText('');
  };

  const handleOpenEditVisibility = (prop: AwardProposal) => {
    setEditingVisibilityProposal(prop);
    setEditVisibilityType(prop.visibility_type || 'public');
    setEditAllowedViewerIds(prop.allowed_viewer_ids || (prop.user_id ? [prop.user_id] : []));
    setEditViewerSearch('');
  };

  const handleSaveVisibilityChange = () => {
    if (!editingVisibilityProposal) return;
    updateAwardVisibility(
      editingVisibilityProposal.id,
      editVisibilityType,
      editAllowedViewerIds
    );
    setEditingVisibilityProposal(null);
  };

  const handleConfirmReject = () => {
    if (!rejectModalProposal) return;
    reviewAwardProposal(
      rejectModalProposal.id,
      'rejected',
      feedbackText || 'Đề xuất chưa đạt tiêu chuẩn kỳ này.',
      'private',
      [],
      { rejection_reason: rejectionReason.trim() || undefined }
    );
    setRejectModalProposal(null);
    setRejectionReason('');
  };

  const handleConfirmRevision = () => {
    if (!revisionModalProposal) return;
    reviewAwardProposal(
      revisionModalProposal.id,
      'revision_requested',
      feedbackText || 'Cần bổ sung và xem xét lại thông tin đề xuất.',
      'private',
      [],
      { revision_notes: revisionNotes.trim() || undefined }
    );
    setRevisionModalProposal(null);
    setRevisionNotes('');
  };

  // Filter users for custom audience selection
  const filteredUsersForReview = users.filter((u) => {
    if (!reviewViewerSearch.trim()) return true;
    const kw = reviewViewerSearch.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(kw) ||
      u.employee_code.toLowerCase().includes(kw)
    );
  });

  const filteredUsersForEdit = users.filter((u) => {
    if (!editViewerSearch.trim()) return true;
    const kw = editViewerSearch.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(kw) ||
      u.employee_code.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">
            Khen Thưởng & Bảng Vàng Vinh Danh (表彰台)
          </h1>
          <p className="text-xs text-[#8A8A85] mt-1">
            Ghi nhận và tôn vinh những đóng góp xuất sắc. Admin đề xuất thành viên ở bất kỳ team nào, Master xét duyệt và chỉ định chế độ hiển thị.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          {/* Quarter selector */}
          <select
            value={activeQuarter}
            onChange={(e) => setActiveQuarter(e.target.value)}
            className="bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 text-xs font-semibold text-[#1C1C1A] cursor-pointer whitespace-nowrap shrink-0"
          >
            <option value="Q1">Quý 1/2026</option>
            <option value="Q2">Quý 2/2026</option>
            <option value="Q3">Quý 3/2026</option>
            <option value="Q4">Quý 4/2026</option>
          </select>

          {/* Toggle between Hall of Fame and Admin Proposals Queue (Chỉ hiển thị cho Quản lý / Leader / Admin / Master) */}
          {canAccessProposals && (
            <div className="flex p-0.5 rounded-md bg-[#F0F0EE] border border-[#E7E7E4] shrink-0">
              <button
                type="button"
                onClick={() => setActiveView('hall_of_fame')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  currentView === 'hall_of_fame'
                    ? 'bg-[#7c9cd0] text-white shadow-xs'
                    : 'text-[#4A4A46] hover:text-[#1C1C1A]'
                }`}
              >
                Bảng Vàng
              </button>
              <button
                type="button"
                onClick={() => setActiveView('proposals')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  currentView === 'proposals'
                    ? 'bg-[#7c9cd0] text-white shadow-xs'
                    : 'text-[#4A4A46] hover:text-[#1C1C1A]'
                }`}
              >
                Hàng Chờ Đề Xuất
              </button>
            </div>
          )}

          {/* Propose Award Button (Leader / Admin) */}
          {(isLeaderOrAdmin || isAdmin) && (
            <button
              type="button"
              onClick={() => {
                setNewProposalCategory(awardCategories[0]?.id || '');
                setNewProposalUser(users[0]?.id || '');
                setIsSubmitModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#7c9cd0] text-white rounded-md text-xs font-semibold hover:bg-[#6788be] shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus size={14} className="shrink-0" />
              <span className="whitespace-nowrap">Đề Xuất Khen Thưởng</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Publish & Preview Banner for Hall of Fame */}
      {activeView === 'hall_of_fame' && (isAdmin || isMaster) && (
        <div className="flex items-center justify-between p-3.5 bg-white border border-[#E7E7E4] rounded-lg text-xs">
          <div className="flex items-center space-x-3">
            {isQuarterPublished ? (
              <span className="flex items-center space-x-1.5 text-[#6B8F71] font-semibold">
                <Globe size={16} />
                <span>Bảng Vàng {activeQuarter} Đang Công Khai Toàn Bộ Phận</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-[#B08A3E] font-semibold">
                <Lock size={16} />
                <span>Bảng Vàng {activeQuarter} Đang Ở Chế Độ Nội Bộ (Chưa Công Khai)</span>
              </span>
            )}
            <span className="text-[#8A8A85]">|</span>
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="text-xs text-[#4A4A46] hover:text-[#1C1C1A] underline flex items-center space-x-1 cursor-pointer"
            >
              <Eye size={13} />
              <span>{isPreviewMode ? 'Tắt Chế Độ Xem Trước' : 'Xem Trước Như Thành Viên'}</span>
            </button>
          </div>

          <button
            onClick={() => togglePublishAwards(activeQuarter, !isQuarterPublished)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              isQuarterPublished
                ? 'bg-[#F0F0EE] hover:bg-[#E4E4E0] text-[#4A4A46] border border-[#E7E7E4]'
                : 'bg-[#7c9cd0] hover:bg-[#6788be] text-white shadow-xs'
            }`}
          >
            {isQuarterPublished ? 'Đóng Công Khai' : 'Xuất Bản Bảng Vàng Ngay'}
          </button>
        </div>
      )}

      {/* Hall of Fame View */}
      {currentView === 'hall_of_fame' ? (
        !isQuarterPublished && !isPreviewMode && !isAdmin && !isMaster ? (
          <div className="bg-white border border-[#E7E7E4] rounded-lg p-16 text-center">
            <Lock size={32} className="mx-auto text-[#8A8A85] mb-3" />
            <h3 className="font-bold text-sm text-[#1C1C1A]">
              Bảng Vàng {activeQuarter} Chưa Công Bố
            </h3>
            <p className="text-xs text-[#8A8A85] mt-1 max-w-md mx-auto">
              Hội đồng đánh giá đang trong quá trình xét duyệt các đề cử vinh danh. Kết quả sẽ được xuất bản công khai ngay khi hoàn tất.
            </p>
          </div>
        ) : publishedProposals.length === 0 ? (
          <div className="bg-white border border-[#E7E7E4] rounded-lg p-12 text-center text-xs text-[#8A8A85]">
            Chưa có cá nhân nào được vinh danh trong {activeQuarter}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {publishedProposals.map((prop) => {
              const honoree = users.find((u) => u.id === prop.user_id);
              const category = awardCategories.find((c) => c.id === prop.category_id);
              const team = teams.find((t) => t.id === honoree?.team_id);
              const proposer = users.find((u) => u.id === prop.proposed_by);

              const visType = prop.visibility_type || 'public';

              return (
                <div
                  key={prop.id}
                  className="bg-white border border-[#E7E7E4] rounded-lg p-6 hover:border-[#7c9cd0] transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#7c9cd0]/10 to-transparent pointer-events-none" />

                  <div>
                    {/* Category pill & Visibility badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {category && getCategoryIcon(category.icon)}
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1C1C1A]">
                          {category?.name}
                        </span>
                      </div>

                      {/* Visibility indicator (visible to Admin & Master) */}
                      {(isMaster || isAdmin) && (
                        <div>
                          {visType === 'public' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                              <Globe size={11} />
                              <span>Công Khai</span>
                            </span>
                          )}
                          {visType === 'private' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]">
                              <Lock size={11} />
                              <span>Không Công Khai</span>
                            </span>
                          )}
                          {visType === 'custom' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]">
                              <Users size={11} />
                              <span>Khác ({prop.allowed_viewer_ids?.length || 0} người)</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Member info */}
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src={
                          honoree?.avatar_url ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={honoree?.full_name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#7c9cd0]/30"
                      />
                      <div>
                        <h3 className="font-bold text-base text-[#1C1C1A]">
                          {honoree?.full_name}
                        </h3>
                        <p className="text-xs text-[#4A4A46] mt-0.5">
                          {team?.name} • Mã NV: <span className="font-mono">{honoree?.employee_code}</span>
                        </p>
                        <p className="text-[11px] text-[#8A8A85]">
                          {honoree?.position || 'Chuyên viên nghiệp vụ'}
                        </p>
                      </div>
                    </div>

                    {/* Reason statement */}
                    <div className="p-3.5 bg-[#F6F6F4] rounded border border-[#E7E7E4] text-xs text-[#4A4A46] leading-relaxed italic">
                      "{prop.reason}"
                    </div>

                    {/* Admin feedback note */}
                    {prop.feedback && (
                      <div className="mt-3 text-[11px] text-[#6B8F71] font-medium flex items-center space-x-1.5">
                        <CheckCircle size={13} />
                        <span>Lời khen từ Ban Quản Trị: {prop.feedback}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#F0F0EE] flex items-center justify-between text-[11px] text-[#8A8A85]">
                    <span>Kỳ vinh danh: {prop.quarter_id}/2026</span>
                    <div className="flex items-center space-x-2">
                      <span>Đề cử bởi: {proposer?.full_name || 'Leader'}</span>
                      {(isMaster || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditVisibility(prop)}
                          className="text-[#24487c] hover:underline font-semibold cursor-pointer ml-2"
                        >
                          Đổi hiển thị
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Proposals Approval Queue View */
        <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden shadow-2xs space-y-0">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#F0F0EE] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">
                Danh Sách Đề Xuất Khen Thưởng ({viewableProposals.length})
              </h2>
              <span className="text-xs text-[#8A8A85]">
                Admin đề xuất bất kỳ ai ở mọi team • Master phê duyệt và chỉ định chế độ hiển thị
              </span>
            </div>

            {/* Chức năng Chọn Nhiều - Hình 3 & 4 */}
            {(isMaster || isAdmin) && (
              <button
                type="button"
                onClick={() => {
                  const nextMode = !isSelectMode;
                  setIsSelectMode(nextMode);
                  if (!nextMode) setSelectedAwardIds([]);
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  isSelectMode
                    ? 'bg-[#24487c] text-white border-[#24487c] shadow-xs'
                    : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
                title="Bật/Tắt chế độ tích chọn nhiều khen thưởng để đổi chế độ hiển thị cùng lúc"
              >
                <CheckSquare size={13} className="shrink-0" />
                <span>{isSelectMode ? 'Đóng Chọn Nhiều' : 'Chọn Nhiều'}</span>
              </button>
            )}
          </div>

          {/* Overview Summary Statistics Bar - Giúp nhìn bao quát toàn bộ các mục */}
          {(() => {
            const totalCount = viewableProposals.length;
            const pendingCount = viewableProposals.filter((p) => p.status === 'pending').length;
            const approvedCount = viewableProposals.filter((p) => p.status === 'approved').length;
            const revisionCount = viewableProposals.filter((p) => p.status === 'revision_requested').length;
            const rejectedCount = viewableProposals.filter((p) => p.status === 'rejected').length;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 bg-[#F8FAFC] border-b border-[#E7E7E4]">
                <button
                  type="button"
                  onClick={() => setProposalStatusFilter('all')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    proposalStatusFilter === 'all'
                      ? 'bg-white border-[#24487c] shadow-xs ring-2 ring-[#24487c]/20'
                      : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="text-[10px] text-[#64748B] font-semibold uppercase">Tất cả đề cử</div>
                  <div className="text-lg font-bold font-mono text-[#1E293B] mt-0.5">{totalCount}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProposalStatusFilter('pending')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    proposalStatusFilter === 'pending'
                      ? 'bg-[#EFF6FF] border-[#3B82F6] shadow-xs ring-2 ring-[#3B82F6]/20'
                      : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="text-[10px] text-[#3B82F6] font-semibold uppercase flex items-center space-x-1">
                    <Clock size={11} />
                    <span>Chờ xét duyệt</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-[#1D4ED8] mt-0.5">{pendingCount}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProposalStatusFilter('approved')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    proposalStatusFilter === 'approved'
                      ? 'bg-[#F0FDF4] border-[#22C55E] shadow-xs ring-2 ring-[#22C55E]/20'
                      : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="text-[10px] text-[#16A34A] font-semibold uppercase flex items-center space-x-1">
                    <CheckCircle size={11} />
                    <span>Đã phê duyệt</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-[#15803D] mt-0.5">{approvedCount}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProposalStatusFilter('revision_requested')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    proposalStatusFilter === 'revision_requested'
                      ? 'bg-[#FFFBEB] border-[#F59E0B] shadow-xs ring-2 ring-[#F59E0B]/20'
                      : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="text-[10px] text-[#D97706] font-semibold uppercase flex items-center space-x-1">
                    <RotateCcw size={11} />
                    <span>Cần xem xét</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-[#B45309] mt-0.5">{revisionCount}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProposalStatusFilter('rejected')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    proposalStatusFilter === 'rejected'
                      ? 'bg-[#FEF2F2] border-[#EF4444] shadow-xs ring-2 ring-[#EF4444]/20'
                      : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="text-[10px] text-[#DC2626] font-semibold uppercase flex items-center space-x-1">
                    <XCircle size={11} />
                    <span>Đã từ chối</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-[#B91C1C] mt-0.5">{rejectedCount}</div>
                </button>
              </div>
            );
          })()}

          {/* Bulk Action Toolbar for Awards Visibility (Hình 3) */}
          {isSelectMode && selectedAwardIds.length > 0 && (
            <div className="mx-5 my-3 p-3 bg-[#1C1C1A] text-white rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 text-xs font-semibold whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#7c9cd0] animate-pulse" />
                <span>Đã chọn <strong className="text-[#7c9cd0]">{selectedAwardIds.length}</strong> đề xuất khen thưởng</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    bulkUpdateAwardVisibility(selectedAwardIds, 'public');
                    setSelectedAwardIds([]);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Globe size={13} />
                  <span>Đặt Công Khai (Tất cả mọi người)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    bulkUpdateAwardVisibility(selectedAwardIds, 'private');
                    setSelectedAwardIds([]);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Lock size={13} />
                  <span>Đặt Không Công Khai (Chỉ Admin & Master)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAwardIds([])}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-[#E7E7E4] text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[950px]">
              <thead className="bg-[#FAFAF9] text-[#8A8A85] uppercase text-[10px] tracking-wider border-b border-[#E7E7E4]">
                <tr>
                  {/* Ô vuông chỉ hiển thị khi chọn chức năng Chọn Nhiều (Hình 4) */}
                  {isSelectMode && (
                    <th className="py-3 px-3 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={
                          viewableProposals.length > 0 &&
                          viewableProposals.every((p) => selectedAwardIds.includes(p.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAwardIds(viewableProposals.map((p) => p.id));
                          } else {
                            setSelectedAwardIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#7c9cd0] focus:ring-[#7c9cd0] cursor-pointer"
                        title="Chọn tất cả đề xuất"
                      />
                    </th>
                  )}
                  <th className="py-3 px-5 whitespace-nowrap">Nhân Sự Được Đề Cử</th>
                  <th className="py-3 px-4 whitespace-nowrap">Giải Thưởng</th>
                  <th className="py-3 px-4 whitespace-nowrap">Kỳ</th>
                  <th className="py-3 px-4 whitespace-nowrap">Người Đề Xuất</th>
                  <th className="py-3 px-4 whitespace-nowrap">Lý Do Đề Xuất</th>
                  <th className="py-3 px-4 whitespace-nowrap">Trạng Thái</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EE]">
                {filteredProposals.length === 0 ? (
                  <tr>
                    <td colSpan={isSelectMode ? 8 : 7} className="py-12 text-center text-xs text-[#8A8A85]">
                      {proposalStatusFilter === 'all'
                        ? 'Không có đề xuất khen thưởng nào.'
                        : `Không có đề xuất nào ở trạng thái đã chọn.`}
                    </td>
                  </tr>
                ) : (
                  filteredProposals.map((prop) => {
                    const honoree = users.find((u) => u.id === prop.user_id);
                    const honoreeTeam = teams.find((t) => t.id === honoree?.team_id);
                    const category = awardCategories.find((c) => c.id === prop.category_id);
                    const proposer = users.find((u) => u.id === prop.proposed_by);
                    const visType = prop.visibility_type || 'public';
                    const isChecked = selectedAwardIds.includes(prop.id);
                    const isActionMenuOpen = openActionMenuId === prop.id;

                    return (
                      <tr
                        key={prop.id}
                        className={`hover:bg-[#FAFAF9] transition-colors ${isChecked ? 'bg-[#7c9cd0]/5' : ''}`}
                      >
                        {/* Checkbox - Chỉ hiển thị khi Chọn Nhiều (Hình 4) */}
                        {isSelectMode && (
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAwardIds((prev) => [...prev, prop.id]);
                                } else {
                                  setSelectedAwardIds((prev) => prev.filter((id) => id !== prop.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-[#7c9cd0] focus:ring-[#7c9cd0] cursor-pointer"
                            />
                          </td>
                        )}

                        <td className="py-3 px-5 font-semibold text-[#1C1C1A] whitespace-nowrap">
                          <div>{honoree?.full_name}</div>
                          <div className="text-[10px] text-[#8A8A85] font-normal">
                            {honoree?.employee_code} • {honoreeTeam?.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#4A4A46] whitespace-nowrap">
                          {category?.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#8A8A85] whitespace-nowrap">{prop.quarter_id}</td>
                        <td className="py-3 px-4 text-[#4A4A46] whitespace-nowrap">{proposer?.full_name}</td>
                        <td className="py-3 px-4 text-[#4A4A46] max-w-xs truncate whitespace-nowrap" title={prop.reason}>
                          {prop.reason}
                        </td>

                        {/* Trạng Thái & Chế Độ Hiển Thị */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {prop.status === 'approved' && (
                            <div className="flex flex-col space-y-1">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] whitespace-nowrap inline-flex items-center w-fit">
                                <CheckCircle size={11} className="mr-1 shrink-0" />
                                <span>Đã duyệt</span>
                              </span>
                              <div className="inline-flex items-center">
                                {visType === 'public' && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] inline-flex items-center space-x-1 whitespace-nowrap">
                                    <Globe size={10} className="shrink-0" />
                                    <span>Công Khai</span>
                                  </span>
                                )}
                                {visType === 'private' && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D] inline-flex items-center space-x-1 whitespace-nowrap">
                                    <Lock size={10} className="shrink-0" />
                                    <span>Không Công Khai</span>
                                  </span>
                                )}
                                {visType === 'custom' && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD] inline-flex items-center space-x-1 whitespace-nowrap">
                                    <Users size={10} className="shrink-0" />
                                    <span>Khác ({prop.allowed_viewer_ids?.length || 0})</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {prop.status === 'rejected' && (
                            <div className="flex flex-col space-y-0.5">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] whitespace-nowrap inline-flex items-center w-fit">
                                <XCircle size={11} className="mr-1 shrink-0" />
                                <span>Từ chối</span>
                              </span>
                              {prop.rejection_reason && (
                                <span className="text-[10px] text-[#DC2626] font-normal italic max-w-[190px] truncate block" title={prop.rejection_reason}>
                                  Lý do: {prop.rejection_reason}
                                </span>
                              )}
                            </div>
                          )}
                          {prop.status === 'revision_requested' && (
                            <div className="flex flex-col space-y-0.5">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D] whitespace-nowrap inline-flex items-center w-fit">
                                <RotateCcw size={11} className="mr-1 shrink-0" />
                                <span>Yêu cầu xem xét lại</span>
                              </span>
                              {prop.revision_notes && (
                                <span className="text-[10px] text-[#B45309] font-normal italic max-w-[190px] truncate block" title={prop.revision_notes}>
                                  Cần sửa: {prop.revision_notes}
                                </span>
                              )}
                            </div>
                          )}
                          {prop.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] whitespace-nowrap inline-flex items-center w-fit">
                              <Clock size={11} className="mr-1 shrink-0" />
                              <span>Chờ duyệt</span>
                            </span>
                          )}
                        </td>

                        {/* Thao Tác (Xem chi tiết & Dấu 3 chấm) */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => setPreviewProposalDetail(prop)}
                              className="p-1.5 rounded-lg text-[#24487c] hover:bg-[#EFF6FF] border border-transparent hover:border-[#93C5FD] transition-colors cursor-pointer"
                              title="Xem chi tiết toàn bộ hồ sơ đề cử này"
                            >
                              <Eye size={15} />
                            </button>

                            {isMaster || isAdmin ? (
                              <div className="relative inline-block text-left">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(isActionMenuOpen ? null : prop.id);
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                                    isActionMenuOpen
                                      ? 'bg-[#7c9cd0]/15 text-[#24487c] border-[#7c9cd0]/30 shadow-2xs'
                                      : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] border-transparent hover:border-[#CBD5E1]'
                                  }`}
                                  title="Thao tác đề xuất khen thưởng"
                                >
                                  <MoreHorizontal size={16} />
                                </button>

                              {isActionMenuOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setOpenActionMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-[#CBD5E1] py-1.5 z-40 animate-in fade-in duration-100 text-xs text-left">
                                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] border-b border-[#F1F5F9]">
                                      Thao tác đề xuất
                                    </div>

                                    {/* 1. Duyệt */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        handleOpenReviewModal(prop);
                                      }}
                                      className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-[#F0FDF4] text-[#15803D] font-medium transition-colors cursor-pointer"
                                    >
                                      <CheckCircle size={14} className="text-[#15803D] shrink-0" />
                                      <span>Duyệt đề xuất & Chế độ</span>
                                    </button>

                                    {/* 2. Thay đổi hiển thị */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        handleOpenEditVisibility(prop);
                                      }}
                                      className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-[#F0F9FF] text-[#24487c] font-medium transition-colors cursor-pointer"
                                    >
                                      <Globe size={14} className="text-[#24487c] shrink-0" />
                                      <span>Thay đổi hiển thị</span>
                                    </button>

                                    {/* 3. Yêu cầu xem xét lại */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        setRevisionModalProposal(prop);
                                        setRevisionNotes(prop.revision_notes || '');
                                      }}
                                      className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-[#FFFBEB] text-[#D97706] font-medium transition-colors cursor-pointer"
                                    >
                                      <RotateCcw size={14} className="text-[#D97706] shrink-0" />
                                      <span>Yêu cầu xem xét lại</span>
                                    </button>

                                    <div className="border-t border-[#F1F5F9] my-1" />

                                    {/* 4. Từ chối */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        setRejectModalProposal(prop);
                                        setRejectionReason(prop.rejection_reason || '');
                                      }}
                                      className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-[#FEF2F2] text-[#DC2626] font-medium transition-colors cursor-pointer"
                                    >
                                      <XCircle size={14} className="text-[#DC2626] shrink-0" />
                                      <span>Từ chối đề xuất</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8A8A85] italic whitespace-nowrap">
                              {prop.status === 'approved' ? 'Đã duyệt' : 'Chờ xem xét'}
                            </span>
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
        </div>
      )}

      {/* Submit Proposal Modal (Admin can propose anyone in any team) */}
      {isSubmitModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setIsSubmitModalOpen(false)}
        >
          <div
            className="bg-white border border-[#E7E7E4] rounded-lg shadow-2xl max-w-lg w-full p-6 animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[#1C1C1A] mb-1">
              Đề Xuất Khen Thưởng Mới
            </h3>
            <p className="text-xs text-[#8A8A85] mb-4">
              Admin & Leader có thể đề xuất bất kì ai ở bất kì team nào. Master sẽ xem xét phê duyệt và thiết lập chế độ hiển thị.
            </p>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#1C1C1A] block mb-1">
                  Nhân sự được đề xuất (Toàn bộ các team)
                </label>
                <select
                  value={newProposalUser}
                  onChange={(e) => setNewProposalUser(e.target.value)}
                  className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A] cursor-pointer"
                >
                  {users.map((u) => {
                    const t = teams.find((team) => team.id === u.team_id);
                    return (
                      <option key={u.id} value={u.id}>
                        [{t?.name || 'Chưa rõ team'}] {u.full_name} ({u.employee_code})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#1C1C1A] block mb-1">
                  Danh mục giải thưởng
                </label>
                <select
                  value={newProposalCategory}
                  onChange={(e) => setNewProposalCategory(e.target.value)}
                  className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A] cursor-pointer"
                >
                  {awardCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#1C1C1A] block mb-1">
                  Lý do đề xuất và thành tích cụ thể
                </label>
                <textarea
                  required
                  rows={4}
                  value={newProposalReason}
                  onChange={(e) => setNewProposalReason(e.target.value)}
                  placeholder="Mô tả chi tiết những nỗ lực, kết quả KPI vượt trội hoặc sáng kiến đóng góp..."
                  className="w-full bg-white border border-[#E7E7E4] rounded p-2.5 text-xs text-[#1C1C1A]"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#F0F0EE]">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-[#E7E7E4] text-[#4A4A46] cursor-pointer hover:bg-[#F6F6F4]"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#7c9cd0] hover:bg-[#6788be] text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Gửi Đề Xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Proposal Modal (Master approves and sets visibility mode) */}
      {selectedProposalToReview && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setSelectedProposalToReview(null)}
        >
          <div
            className="bg-white border border-[#E7E7E4] rounded-xl shadow-2xl max-w-xl w-full p-6 my-8 animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[#1C1C1A] mb-1">
              Phê Duyệt Đề Xuất Vinh Danh & Chọn Chế Độ Hiển Thị
            </h3>
            <p className="text-xs text-[#8A8A85] mb-4">
              Master xem xét nội dung đề xuất và lựa chọn quyền hiển thị giải thưởng
            </p>

            <div className="p-3 bg-[#F6F6F4] rounded-lg border border-[#E7E7E4] mb-4 text-xs space-y-1.5">
              <div>
                <strong>Nhân sự: </strong>
                {users.find((u) => u.id === selectedProposalToReview.user_id)?.full_name} (
                {users.find((u) => u.id === selectedProposalToReview.user_id)?.employee_code})
              </div>
              <div>
                <strong>Giải thưởng: </strong>
                {awardCategories.find((c) => c.id === selectedProposalToReview.category_id)?.name}
              </div>
              <div>
                <strong>Lý do đề cử: </strong>
                <p className="mt-1 text-[#4A4A46] italic">"{selectedProposalToReview.reason}"</p>
              </div>
            </div>

            {/* CHẾ ĐỘ HIỂN THỊ: 3 TÙY CHỌN BẮT BUỘC */}
            <div className="mb-4 p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-2.5">
              <label className="font-bold text-xs text-[#1E293B] block">
                Chế Độ Hiển Thị Giải Thưởng:
              </label>

              <div className="space-y-2 text-xs">
                {/* 1. Công Khai */}
                <label className="flex items-start space-x-2.5 p-2 rounded-md hover:bg-white border border-transparent hover:border-[#CBD5E1] transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="review_visibility"
                    value="public"
                    checked={reviewVisibilityType === 'public'}
                    onChange={() => setReviewVisibilityType('public')}
                    className="mt-0.5 text-[#15803D] focus:ring-[#15803D]"
                  />
                  <div>
                    <div className="font-bold text-[#15803D] flex items-center space-x-1">
                      <Globe size={13} />
                      <span>Công Khai</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Cho tất cả mọi người cùng thấy giải thưởng của người đó trên Bảng Vàng và bảng thành tích.
                    </p>
                  </div>
                </label>

                {/* 2. Không Công Khai */}
                <label className="flex items-start space-x-2.5 p-2 rounded-md hover:bg-white border border-transparent hover:border-[#CBD5E1] transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="review_visibility"
                    value="private"
                    checked={reviewVisibilityType === 'private'}
                    onChange={() => setReviewVisibilityType('private')}
                    className="mt-0.5 text-[#D97706] focus:ring-[#D97706]"
                  />
                  <div>
                    <div className="font-bold text-[#B45309] flex items-center space-x-1">
                      <Lock size={13} />
                      <span>Không Công Khai</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Chỉ Master và Admin mới biết ai được duyệt; các nhân sự khác không nhìn thấy.
                    </p>
                  </div>
                </label>

                {/* 3. Khác */}
                <label className="flex items-start space-x-2.5 p-2 rounded-md hover:bg-white border border-transparent hover:border-[#CBD5E1] transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="review_visibility"
                    value="custom"
                    checked={reviewVisibilityType === 'custom'}
                    onChange={() => setReviewVisibilityType('custom')}
                    className="mt-0.5 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <div className="font-bold text-[#1D4ED8] flex items-center space-x-1">
                      <Users size={13} />
                      <span>Khác (Tùy chọn đối tượng người xem)</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Ngoài Master và Admin ra, có thể select hoặc loại bỏ bất cứ ai được xem kết quả.
                    </p>
                  </div>
                </label>
              </div>

              {/* Custom Audience Multi-select */}
              {reviewVisibilityType === 'custom' && (
                <div className="mt-3 pt-3 border-t border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1E293B]">
                      Chọn nhân sự được xem ({reviewAllowedViewerIds.length} người đã chọn):
                    </span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setReviewAllowedViewerIds(users.map((u) => u.id))}
                        className="text-[11px] text-[#2563EB] hover:underline font-semibold cursor-pointer"
                      >
                        Chọn tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAllowedViewerIds([])}
                        className="text-[11px] text-[#64748B] hover:underline cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên hoặc mã NV..."
                      value={reviewViewerSearch}
                      onChange={(e) => setReviewViewerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-white border border-[#CBD5E1] rounded text-xs"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-[#E2E8F0] rounded-md bg-white p-2 divide-y divide-[#F1F5F9]">
                    {filteredUsersForReview.map((u) => {
                      const isChecked = reviewAllowedViewerIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center space-x-2 py-1.5 px-1 hover:bg-[#F8FAFC] cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setReviewAllowedViewerIds((prev) => [...prev, u.id]);
                              } else {
                                setReviewAllowedViewerIds((prev) => prev.filter((id) => id !== u.id));
                              }
                            }}
                            className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          <span className="font-medium text-[#1E293B]">{u.full_name}</span>
                          <span className="text-[10px] text-[#64748B] font-mono">({u.employee_code})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4 text-xs">
              <label className="font-semibold text-[#1C1C1A] block">
                Phản hồi / Lời khen của Ban Quản Trị (Feedback):
              </label>
              <textarea
                rows={2}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Ví dụ: Rất xứng đáng! Đồng ý vinh danh MVP Quý..."
                className="w-full bg-white border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A]"
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-2 border-t border-[#F0F0EE]">
              <button
                type="button"
                onClick={() => setSelectedProposalToReview(null)}
                className="px-3 py-1.5 rounded border border-[#E7E7E4] text-xs text-[#4A4A46] cursor-pointer hover:bg-[#F6F6F4]"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction('rejected')}
                className="px-3.5 py-1.5 rounded bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] text-xs font-semibold hover:bg-[#FCEAEB] cursor-pointer"
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction('approved')}
                className="px-4 py-1.5 rounded bg-[#7c9cd0] hover:bg-[#6788be] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Chấp thuận vinh danh & Lưu chế độ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Visibility Modal (For already approved awards) */}
      {editingVisibilityProposal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setEditingVisibilityProposal(null)}
        >
          <div
            className="bg-white border border-[#E7E7E4] rounded-xl shadow-2xl max-w-xl w-full p-6 my-8 animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-[#1C1C1A] mb-1">
              Thay Đổi Chế Độ Hiển Thị Giải Thưởng
            </h3>
            <p className="text-xs text-[#8A8A85] mb-4">
              Cập nhật quyền ai được xem danh hiệu này trên Bảng Vàng và bảng KPI
            </p>

            <div className="p-3 bg-[#F6F6F4] rounded-lg border border-[#E7E7E4] mb-4 text-xs space-y-1">
              <div>
                <strong>Nhân sự: </strong>
                {users.find((u) => u.id === editingVisibilityProposal.user_id)?.full_name}
              </div>
              <div>
                <strong>Giải thưởng: </strong>
                {awardCategories.find((c) => c.id === editingVisibilityProposal.category_id)?.name}
              </div>
            </div>

            <div className="mb-4 p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-2.5">
              <label className="font-bold text-xs text-[#1E293B] block">
                Chế Độ Hiển Thị:
              </label>

              <div className="space-y-2 text-xs">
                {/* 1. Công Khai */}
                <label className="flex items-start space-x-2.5 p-2 rounded-md hover:bg-white border border-transparent hover:border-[#CBD5E1] transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="edit_visibility"
                    value="public"
                    checked={editVisibilityType === 'public'}
                    onChange={() => setEditVisibilityType('public')}
                    className="mt-0.5 text-[#15803D] focus:ring-[#15803D]"
                  />
                  <div>
                    <div className="font-bold text-[#15803D] flex items-center space-x-1">
                      <Globe size={13} />
                      <span>Công Khai</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Cho tất cả mọi người cùng thấy giải thưởng của người đó.
                    </p>
                  </div>
                </label>

                {/* 2. Không Công Khai */}
                <label className="flex items-start space-x-2.5 p-2 rounded-md hover:bg-white border border-transparent hover:border-[#CBD5E1] transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="edit_visibility"
                    value="private"
                    checked={editVisibilityType === 'private'}
                    onChange={() => setEditVisibilityType('private')}
                    className="mt-0.5 text-[#D97706] focus:ring-[#D97706]"
                  />
                  <div>
                    <div className="font-bold text-[#B45309] flex items-center space-x-1">
                      <Lock size={13} />
                      <span>Không Công Khai</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Chỉ Master và Admin mới biết ai được duyệt.
                    </p>
                  </div>
                </label>

                {/* 3. Khác */}
                <label className="flex items-start space-x-2.5 p-2 rounded-md hover:bg-white border border-transparent hover:border-[#CBD5E1] transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="edit_visibility"
                    value="custom"
                    checked={editVisibilityType === 'custom'}
                    onChange={() => setEditVisibilityType('custom')}
                    className="mt-0.5 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <div className="font-bold text-[#1D4ED8] flex items-center space-x-1">
                      <Users size={13} />
                      <span>Khác (Tùy chọn đối tượng người xem)</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Ngoài Master và Admin ra, có thể select hoặc loại bỏ bất cứ ai được xem kết quả.
                    </p>
                  </div>
                </label>
              </div>

              {/* Custom Audience Multi-select */}
              {editVisibilityType === 'custom' && (
                <div className="mt-3 pt-3 border-t border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1E293B]">
                      Chọn nhân sự được xem ({editAllowedViewerIds.length} người đã chọn):
                    </span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditAllowedViewerIds(users.map((u) => u.id))}
                        className="text-[11px] text-[#2563EB] hover:underline font-semibold cursor-pointer"
                      >
                        Chọn tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditAllowedViewerIds([])}
                        className="text-[11px] text-[#64748B] hover:underline cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên hoặc mã NV..."
                      value={editViewerSearch}
                      onChange={(e) => setEditViewerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-white border border-[#CBD5E1] rounded text-xs"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-[#E2E8F0] rounded-md bg-white p-2 divide-y divide-[#F1F5F9]">
                    {filteredUsersForEdit.map((u) => {
                      const isChecked = editAllowedViewerIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center space-x-2 py-1.5 px-1 hover:bg-[#F8FAFC] cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditAllowedViewerIds((prev) => [...prev, u.id]);
                              } else {
                                setEditAllowedViewerIds((prev) => prev.filter((id) => id !== u.id));
                              }
                            }}
                            className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          <span className="font-medium text-[#1E293B]">{u.full_name}</span>
                          <span className="text-[10px] text-[#64748B] font-mono">({u.employee_code})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2.5 pt-2 border-t border-[#F0F0EE]">
              <button
                type="button"
                onClick={() => setEditingVisibilityProposal(null)}
                className="px-3.5 py-1.5 rounded border border-[#E7E7E4] text-xs text-[#4A4A46] cursor-pointer hover:bg-[#F6F6F4]"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleSaveVisibilityChange}
                className="px-4 py-1.5 rounded bg-[#7c9cd0] hover:bg-[#6788be] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Cập nhật chế độ hiển thị
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Proposal Modal (Khi Từ Chối sẽ có thêm mục lí do, nhưng không bắt buộc nhập) */}
      {rejectModalProposal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={() => {
            setRejectModalProposal(null);
            setRejectionReason('');
          }}
        >
          <div
            className="bg-white border border-[#E7E7E4] rounded-xl shadow-2xl max-w-md w-full p-6 my-8 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-2 text-[#DC2626] mb-1">
              <XCircle size={20} />
              <h3 className="font-bold text-base text-[#1C1C1A]">
                Từ Chối Đề Xuất Khen Thưởng
              </h3>
            </div>
            <p className="text-xs text-[#8A8A85] mb-4">
              Xác nhận từ chối đề xuất vinh danh khen thưởng này.
            </p>

            <div className="p-3 bg-[#F6F6F4] rounded-lg border border-[#E7E7E4] mb-4 text-xs space-y-1">
              <div>
                <strong>Nhân sự: </strong>
                {users.find((u) => u.id === rejectModalProposal.user_id)?.full_name} (
                {users.find((u) => u.id === rejectModalProposal.user_id)?.employee_code})
              </div>
              <div>
                <strong>Giải thưởng: </strong>
                {awardCategories.find((c) => c.id === rejectModalProposal.category_id)?.name}
              </div>
              <div>
                <strong>Người đề xuất: </strong>
                {users.find((u) => u.id === rejectModalProposal.proposed_by)?.full_name}
              </div>
            </div>

            <div className="space-y-1.5 mb-5 text-xs">
              <label className="font-semibold text-[#1C1C1A] block">
                Lý do từ chối <span className="text-[#8A8A85] font-normal">(Không bắt buộc nhập):</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Nhập lý do từ chối để phản hồi cho người đề xuất nắm được thông tin..."
                className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#1C1C1A] focus:ring-1 focus:ring-[#DC2626] focus:border-[#DC2626] outline-hidden"
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#F0F0EE]">
              <button
                type="button"
                onClick={() => {
                  setRejectModalProposal(null);
                  setRejectionReason('');
                }}
                className="px-4 py-1.5 rounded border border-[#E7E7E4] text-xs text-[#4A4A46] cursor-pointer hover:bg-[#F6F6F4]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Request Modal (Yêu cầu xem xét lại: Thêm ô để điền những thông tin cần chỉnh sửa hoặc Master cần thêm thông tin từ người đề xuất) */}
      {revisionModalProposal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={() => {
            setRevisionModalProposal(null);
            setRevisionNotes('');
          }}
        >
          <div
            className="bg-white border border-[#E7E7E4] rounded-xl shadow-2xl max-w-lg w-full p-6 my-8 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-2 text-[#D97706] mb-1">
              <RotateCcw size={20} />
              <h3 className="font-bold text-base text-[#1C1C1A]">
                Yêu Cầu Xem Xét Lại Đề Xuất
              </h3>
            </div>
            <p className="text-xs text-[#8A8A85] mb-4">
              Gửi yêu cầu người đề xuất bổ sung thêm thông tin hoặc điều chỉnh nội dung đề cử.
            </p>

            <div className="p-3 bg-[#F6F6F4] rounded-lg border border-[#E7E7E4] mb-4 text-xs space-y-1">
              <div>
                <strong>Nhân sự: </strong>
                {users.find((u) => u.id === revisionModalProposal.user_id)?.full_name} (
                {users.find((u) => u.id === revisionModalProposal.user_id)?.employee_code})
              </div>
              <div>
                <strong>Giải thưởng: </strong>
                {awardCategories.find((c) => c.id === revisionModalProposal.category_id)?.name}
              </div>
              <div>
                <strong>Người đề xuất: </strong>
                {users.find((u) => u.id === revisionModalProposal.proposed_by)?.full_name}
              </div>
            </div>

            <div className="space-y-1.5 mb-5 text-xs">
              <label className="font-semibold text-[#1C1C1A] block">
                Thông tin cần chỉnh sửa hoặc làm rõ thêm:
              </label>
              <p className="text-[11px] text-[#64748B] mb-1">
                Điền những thông tin cần người đề xuất bổ sung (số liệu chứng minh, lý do cụ thể hoặc điều chỉnh hạng mục đề xuất):
              </p>
              <textarea
                rows={4}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Ví dụ: Cần bổ sung số liệu minh chứng về kết quả KPI tháng 2 và 3, hoặc làm rõ vai trò trưởng nhóm trong dự án..."
                className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#1C1C1A] focus:ring-1 focus:ring-[#D97706] focus:border-[#D97706] outline-hidden"
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#F0F0EE]">
              <button
                type="button"
                onClick={() => {
                  setRevisionModalProposal(null);
                  setRevisionNotes('');
                }}
                className="px-4 py-1.5 rounded border border-[#E7E7E4] text-xs text-[#4A4A46] cursor-pointer hover:bg-[#F6F6F4]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                className="px-4 py-1.5 rounded bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Send size={13} />
                <span>Gửi Yêu Cầu Xem Xét Lại</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Proposal Detail Modal (Nhìn bao quát toàn bộ thông tin đề cử) */}
      {previewProposalDetail && (() => {
        const honoree = users.find((u) => u.id === previewProposalDetail.user_id);
        const honoreeTeam = teams.find((t) => t.id === honoree?.team_id);
        const category = awardCategories.find((c) => c.id === previewProposalDetail.category_id);
        const proposer = users.find((u) => u.id === previewProposalDetail.proposed_by);
        const visType = previewProposalDetail.visibility_type || 'public';

        return (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
            onClick={() => setPreviewProposalDetail(null)}
          >
            <div
              className="bg-white border border-[#E7E7E4] rounded-xl shadow-2xl max-w-xl w-full p-6 my-8 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EE]">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-[#7c9cd0]/10 text-[#24487c]">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1C1C1A]">Hồ Sơ Đề Cử Khen Thưởng</h3>
                    <p className="text-xs text-[#8A8A85]">Kỳ vinh danh: Quý {previewProposalDetail.quarter_id}/2026</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewProposalDetail(null)}
                  className="p-1 rounded-lg text-[#8A8A85] hover:text-[#1C1C1A] hover:bg-[#F1F5F9] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                {/* 1. Thông tin nhân sự */}
                <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={honoree?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={honoree?.full_name}
                      className="w-11 h-11 rounded-full object-cover border border-[#CBD5E1]"
                    />
                    <div>
                      <div className="font-bold text-sm text-[#1E293B]">{honoree?.full_name}</div>
                      <div className="text-[#64748B] text-[11px] mt-0.5">
                        Mã: <span className="font-mono font-semibold">{honoree?.employee_code}</span> • Team: <strong className="text-[#24487c]">{honoreeTeam?.name}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#8A8A85] block">Người đề cử</span>
                    <strong className="text-[#334155]">{proposer?.full_name || 'Leader'}</strong>
                  </div>
                </div>

                {/* 2. Danh hiệu & Giải thưởng */}
                <div className="p-3.5 bg-gradient-to-r from-[#FBF7EE] to-white border border-[#E5D7A9] rounded-lg">
                  <div className="flex items-center space-x-2">
                    {category && getCategoryIcon(category.icon)}
                    <span className="font-bold text-sm text-[#B08A3E]">{category?.name}</span>
                  </div>
                  <p className="text-[#78612A] text-xs mt-1.5 leading-relaxed">
                    {category?.criteria_description || 'Giải thưởng tôn vinh đóng góp xuất sắc trong kỳ.'}
                  </p>
                </div>

                {/* 3. Lý do & Thành tích đề cử */}
                <div>
                  <h4 className="font-bold text-[#1C1C1A] uppercase text-[11px] tracking-wider mb-1.5">
                    Lý Do & Thành Tích Đề Xuất:
                  </h4>
                  <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg text-[#334155] text-xs leading-relaxed whitespace-pre-wrap">
                    {previewProposalDetail.reason}
                  </div>
                </div>

                {/* 4. Trạng thái & Chế độ hiển thị */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Trạng thái phê duyệt</span>
                    {previewProposalDetail.status === 'approved' && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] inline-flex items-center">
                        <CheckCircle size={12} className="mr-1 shrink-0" />
                        <span>Đã phê duyệt</span>
                      </span>
                    )}
                    {previewProposalDetail.status === 'pending' && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D] inline-flex items-center">
                        <Clock size={12} className="mr-1 shrink-0" />
                        <span>Đang chờ duyệt</span>
                      </span>
                    )}
                    {previewProposalDetail.status === 'revision_requested' && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#F59E0B] inline-flex items-center">
                        <RotateCcw size={12} className="mr-1 shrink-0" />
                        <span>Yêu cầu xem xét lại</span>
                      </span>
                    )}
                    {previewProposalDetail.status === 'rejected' && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] inline-flex items-center">
                        <XCircle size={12} className="mr-1 shrink-0" />
                        <span>Đã từ chối</span>
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Chế độ hiển thị</span>
                    {visType === 'public' && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] inline-flex items-center space-x-1">
                        <Globe size={11} className="mr-1 shrink-0" />
                        <span>Công Khai (Tất cả)</span>
                      </span>
                    )}
                    {visType === 'private' && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D] inline-flex items-center space-x-1">
                        <Lock size={11} className="mr-1 shrink-0" />
                        <span>Không Công Khai</span>
                      </span>
                    )}
                    {visType === 'custom' && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD] inline-flex items-center space-x-1">
                        <Users size={11} className="mr-1 shrink-0" />
                        <span>Chỉ định ({previewProposalDetail.allowed_viewer_ids?.length || 0} người)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. Ghi chú phản hồi / lý do nếu có */}
                {previewProposalDetail.feedback && (
                  <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-xs text-[#15803D]">
                    <strong>Lời khen từ Ban Quản Trị:</strong> {previewProposalDetail.feedback}
                  </div>
                )}
                {previewProposalDetail.revision_notes && (
                  <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#B45309]">
                    <strong>Ghi chú cần bổ sung:</strong> {previewProposalDetail.revision_notes}
                  </div>
                )}
                {previewProposalDetail.rejection_reason && (
                  <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626]">
                    <strong>Lý do từ chối:</strong> {previewProposalDetail.rejection_reason}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#F0F0EE]">
                {(isMaster || isAdmin) ? (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prop = previewProposalDetail;
                        setPreviewProposalDetail(null);
                        handleOpenReviewModal(prop);
                      }}
                      className="px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Duyệt & Đổi Hiển Thị
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const prop = previewProposalDetail;
                        setPreviewProposalDetail(null);
                        setRevisionModalProposal(prop);
                        setRevisionNotes(prop.revision_notes || '');
                      }}
                      className="px-3 py-1.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B] font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Yêu Cầu Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const prop = previewProposalDetail;
                        setPreviewProposalDetail(null);
                        setRejectModalProposal(prop);
                        setRejectionReason(prop.rejection_reason || '');
                      }}
                      className="px-3 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Từ Chối
                    </button>
                  </div>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => setPreviewProposalDetail(null)}
                  className="px-4 py-1.5 rounded-lg border border-[#CBD5E1] hover:bg-[#F1F5F9] text-xs font-semibold text-[#475569] transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

