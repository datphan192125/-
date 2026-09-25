import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AwardCategory, AwardProposal, ProposalStatus } from '../../types';

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
    togglePublishAwards,
    isAdmin,
    isLeaderOrAdmin,
  } = useApp();

  const [activeQuarter, setActiveQuarter] = useState<string>('Q1');
  const [activeView, setActiveView] = useState<'hall_of_fame' | 'proposals'>('hall_of_fame');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [selectedProposalToReview, setSelectedProposalToReview] = useState<AwardProposal | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');

  // Proposal form state
  const [newProposalUser, setNewProposalUser] = useState<string>('');
  const [newProposalCategory, setNewProposalCategory] = useState<string>('');
  const [newProposalReason, setNewProposalReason] = useState<string>('');

  const currentQuarterConfig = quarterConfigs.find((q) => q.id === activeQuarter);
  const isQuarterPublished = currentQuarterConfig?.is_published_awards ?? false;

  // Filter approved proposals for the Hall of Fame
  const publishedProposals = awardProposals.filter(
    (p) => p.quarter_id === activeQuarter && p.status === 'approved' && (isQuarterPublished || isPreviewMode || isAdmin)
  );

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

  const handleReviewAction = (status: ProposalStatus) => {
    if (!selectedProposalToReview) return;
    reviewAwardProposal(selectedProposalToReview.id, status, feedbackText);
    setSelectedProposalToReview(null);
    setFeedbackText('');
  };

  return (
    <div className="space-y-6">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">
            Khen Thưởng & Bảng Vàng Vinh Danh (表彰台)
          </h1>
          <p className="text-xs text-[#8A8A85] mt-1">
            Ghi nhận và tôn vinh những đóng góp xuất sắc của các thành viên bộ phận theo từng quý
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Quarter selector */}
          <select
            value={activeQuarter}
            onChange={(e) => setActiveQuarter(e.target.value)}
            className="bg-white border border-[#E7E7E4] rounded-md px-3 py-1.5 text-xs font-semibold text-[#1C1C1A]"
          >
            <option value="Q1">Quý 1/2026</option>
            <option value="Q2">Quý 2/2026</option>
            <option value="Q3">Quý 3/2026</option>
            <option value="Q4">Quý 4/2026</option>
          </select>

          {/* Toggle between Hall of Fame and Admin Proposals Queue */}
          <div className="flex p-0.5 rounded-md bg-[#F0F0EE] border border-[#E7E7E4]">
            <button
              onClick={() => setActiveView('hall_of_fame')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                activeView === 'hall_of_fame'
                  ? 'bg-[#7c9cd0] text-white shadow-xs'
                  : 'text-[#4A4A46] hover:text-[#1C1C1A]'
              }`}
            >
              Bảng Vàng
            </button>
            <button
              onClick={() => setActiveView('proposals')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                activeView === 'proposals'
                  ? 'bg-[#7c9cd0] text-white shadow-xs'
                  : 'text-[#4A4A46] hover:text-[#1C1C1A]'
              }`}
            >
              Hàng Chờ Đề Xuất
            </button>
          </div>

          {/* Propose Award Button (Leader / Admin) */}
          {isLeaderOrAdmin && (
            <button
              onClick={() => {
                setNewProposalCategory(awardCategories[0]?.id || '');
                setNewProposalUser(users[0]?.id || '');
                setIsSubmitModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#7c9cd0] text-white rounded-md text-xs font-semibold hover:bg-[#6788be] shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Đề Xuất Khen Thưởng</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Publish & Preview Banner for Hall of Fame */}
      {activeView === 'hall_of_fame' && isAdmin && (
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
              className="text-xs text-[#4A4A46] hover:text-[#1C1C1A] underline flex items-center space-x-1"
            >
              <Eye size={13} />
              <span>{isPreviewMode ? 'Tắt Chế Độ Xem Trước' : 'Xem Trước Như Thành Viên'}</span>
            </button>
          </div>

          <button
            onClick={() => togglePublishAwards(activeQuarter, !isQuarterPublished)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
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
      {activeView === 'hall_of_fame' ? (
        !isQuarterPublished && !isPreviewMode && !isAdmin ? (
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

              return (
                <div
                  key={prop.id}
                  className="bg-white border border-[#E7E7E4] rounded-lg p-6 hover:border-[#7c9cd0] transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#7c9cd0]/10 to-transparent pointer-events-none" />

                  <div>
                    {/* Category pill */}
                    <div className="flex items-center space-x-2 mb-4">
                      {category && getCategoryIcon(category.icon)}
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1C1C1A]">
                        {category?.name}
                      </span>
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
                    <span>Đề cử bởi: {proposer?.full_name || 'Leader'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Proposals Approval Queue View */
        <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F0F0EE] flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">
              Danh Sách Đề Xuất Khen Thưởng ({awardProposals.length})
            </h2>
            <span className="text-xs text-[#8A8A85]">
              Admin duyệt để đưa vào Bảng Vàng vinh danh
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF9] text-[#8A8A85] uppercase text-[10px] tracking-wider border-b border-[#E7E7E4]">
                <tr>
                  <th className="py-3 px-5">Nhân Sự Được Đề Cử</th>
                  <th className="py-3 px-4">Giải Thưởng</th>
                  <th className="py-3 px-4">Kỳ</th>
                  <th className="py-3 px-4">Người Đề Xuất</th>
                  <th className="py-3 px-4">Lý Do Đề Xuất</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EE]">
                {awardProposals.map((prop) => {
                  const honoree = users.find((u) => u.id === prop.user_id);
                  const category = awardCategories.find((c) => c.id === prop.category_id);
                  const proposer = users.find((u) => u.id === prop.proposed_by);

                  return (
                    <tr key={prop.id} className="hover:bg-[#FAFAF9]">
                      <td className="py-3 px-5 font-semibold text-[#1C1C1A]">
                        {honoree?.full_name}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#4A4A46]">
                        {category?.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#8A8A85]">{prop.quarter_id}</td>
                      <td className="py-3 px-4 text-[#4A4A46]">{proposer?.full_name}</td>
                      <td className="py-3 px-4 text-[#4A4A46] max-w-sm truncate" title={prop.reason}>
                        {prop.reason}
                      </td>
                      <td className="py-3 px-4">
                        {prop.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F0F4F0] text-[#6B8F71]">
                            Đã duyệt
                          </span>
                        )}
                        {prop.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FDF2F2] text-[#B85D5D]">
                            Từ chối
                          </span>
                        )}
                        {prop.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FBF7EE] text-[#B08A3E]">
                            Chờ duyệt
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right">
                        {isAdmin && prop.status === 'pending' ? (
                          <button
                            onClick={() => setSelectedProposalToReview(prop)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1C1C1A] text-white hover:bg-[#2B2B28]"
                          >
                            Phê duyệt
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#8A8A85] italic">
                            {prop.feedback || 'Đã xử lý'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Proposal Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E7E7E4] rounded-lg shadow-2xl max-w-lg w-full p-6">
            <h3 className="font-bold text-base text-[#1C1C1A] mb-1">
              Đề Xuất Khen Thưởng Mới
            </h3>
            <p className="text-xs text-[#8A8A85] mb-4">
              Gửi đề xuất tới Ban Quản Trị để vinh danh cá nhân xuất sắc
            </p>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#1C1C1A] block mb-1">
                  Nhân sự được đề xuất
                </label>
                <select
                  value={newProposalUser}
                  onChange={(e) => setNewProposalUser(e.target.value)}
                  className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A]"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#1C1C1A] block mb-1">
                  Danh mục giải thưởng
                </label>
                <select
                  value={newProposalCategory}
                  onChange={(e) => setNewProposalCategory(e.target.value)}
                  className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A]"
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
                  className="px-4 py-1.5 rounded border border-[#E7E7E4] text-[#4A4A46]"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#7c9cd0] hover:bg-[#6788be] text-white font-semibold shadow-xs transition-colors"
                >
                  Gửi Đề Xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Proposal Modal (Admin) */}
      {selectedProposalToReview && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E7E7E4] rounded-lg shadow-2xl max-w-lg w-full p-6">
            <h3 className="font-bold text-base text-[#1C1C1A] mb-1">
              Phê Duyệt Đề Xuất Vinh Danh
            </h3>
            <p className="text-xs text-[#8A8A85] mb-4">
              Xem xét nội dung đề cử từ Leader
            </p>

            <div className="p-3 bg-[#F6F6F4] rounded border border-[#E7E7E4] mb-4 text-xs space-y-1.5">
              <div>
                <strong>Nhân sự: </strong>
                {users.find((u) => u.id === selectedProposalToReview.user_id)?.full_name}
              </div>
              <div>
                <strong>Lý do đề cử: </strong>
                <p className="mt-1 text-[#4A4A46] italic">"{selectedProposalToReview.reason}"</p>
              </div>
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
                className="px-3 py-1.5 rounded border border-[#E7E7E4] text-xs text-[#4A4A46]"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction('rejected')}
                className="px-3.5 py-1.5 rounded bg-[#FDF2F2] text-[#B85D5D] border border-[#E7E7E4] text-xs font-semibold hover:bg-[#FCEAEB]"
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction('approved')}
                className="px-4 py-1.5 rounded bg-[#7c9cd0] hover:bg-[#6788be] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Chấp thuận vinh danh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
