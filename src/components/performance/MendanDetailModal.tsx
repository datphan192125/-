import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  History,
  CheckCircle2,
  Copy,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Team, MendanRecord, AwardCategory, AwardProposal, MendanStatus } from '../../types';

interface MendanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  team: Team | null;
  currentUser: User;
  currentQuarter: string;
  existingRecord: MendanRecord | null;
  allMendanRecords: MendanRecord[];
  awardCategories: AwardCategory[];
  awardProposals: AwardProposal[];
  onSaveMendan: (record: Partial<MendanRecord>) => void;
}

import { cleanName } from '../../utils/format';

export const MendanDetailModal: React.FC<MendanDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  team,
  currentUser,
  currentQuarter,
  existingRecord,
  allMendanRecords,
  awardCategories,
  awardProposals,
  onSaveMendan,
}) => {
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'master';
  const isLeader = currentUser.role === 'leader' || currentUser.role === 'subleader';
  const canEditMendan = isAdmin || isLeader;

  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryQuarter, setSelectedHistoryQuarter] = useState<string>('Q4');
  const [copiedGoalFeedback, setCopiedGoalFeedback] = useState(false);

  const [isDesktop, setIsDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState<Partial<MendanRecord>>(() => {
    if (existingRecord) {
      return {
        ...existingRecord,
        content_format: existingRecord.content_format || 'standard_3',
      };
    }
    return {
      user_id: user.id,
      evaluator_id: currentUser.id,
      team_id: user.team_id,
      quarter_id: currentQuarter,
      evaluation_type: 'quarterly',
      scheduled_date: new Date().toISOString().slice(0, 10),
      actual_date: new Date().toISOString().slice(0, 10),
      status: 'not_started',
      content_format: 'standard_3',
      visibility_scope: 'member_and_leader',
      visibility_type: 'public',
      good_points: '',
      improvements: '',
      next_goals: '',
      leader_good_points: '',
      leader_improvements: '',
      leader_risks: '',
      leader_other: '',
      memo: '',
    };
  });

  useEffect(() => {
    if (existingRecord) {
      setFormData({
        ...existingRecord,
        content_format: existingRecord.content_format || 'standard_3',
      });
    }
  }, [existingRecord]);

  // Selected history record from previous quarters
  const selectedHistoryRecord = useMemo(() => {
    return allMendanRecords.find(
      (m) =>
        m.user_id === user.id &&
        (m.quarter_id === selectedHistoryQuarter ||
          (!m.quarter_id && selectedHistoryQuarter === 'Q4'))
    );
  }, [allMendanRecords, user.id, selectedHistoryQuarter]);

  // History awards
  const selectedHistoryAwards = useMemo(() => {
    return awardProposals.filter(
      (p) =>
        p.user_id === user.id &&
        p.status === 'approved' &&
        p.is_published &&
        (p.quarter_id === selectedHistoryQuarter || (!p.quarter_id && selectedHistoryQuarter === 'Q4'))
    );
  }, [awardProposals, user.id, selectedHistoryQuarter]);

  // Current user awards
  const selectedUserAwards = useMemo(() => {
    return awardProposals.filter(
      (p) =>
        p.user_id === user.id &&
        p.status === 'approved' &&
        p.is_published &&
        (!p.quarter_id || p.quarter_id === currentQuarter)
    );
  }, [awardProposals, user.id, currentQuarter]);

  // Reference goal from previous quarter
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

  // Leader: Save draft
  const handleLeaderSaveDraft = () => {
    onSaveMendan({
      ...formData,
      status: 'not_started',
      leader_evaluator_id: currentUser.id,
      leader_evaluated_at: new Date().toISOString(),
    });
    onClose();
  };

  // Leader: Submit to Manager
  const handleLeaderSubmitToManager = () => {
    onSaveMendan({
      ...formData,
      status: 'pre_mendan',
      leader_evaluator_id: currentUser.id,
      leader_evaluated_at: new Date().toISOString(),
    });
    onClose();
  };

  // Manager: Copy Leader inputs
  const handleCopyLeaderToManager = () => {
    setFormData((prev) => ({
      ...prev,
      good_points: prev.leader_good_points || prev.good_points || '',
      improvements: prev.leader_improvements || prev.improvements || '',
    }));
  };

  // Manager: Save draft
  const handleManagerSaveDraft = () => {
    onSaveMendan({
      ...formData,
      manager_evaluator_id: currentUser.id,
    });
    onClose();
  };

  // Manager: Complete Mendan
  const handleManagerComplete = () => {
    onSaveMendan({
      ...formData,
      status: 'completed',
      manager_evaluator_id: currentUser.id,
      actual_date: formData.actual_date || new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="mendan-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          layout
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col lg:flex-row items-stretch justify-center w-full max-w-[1360px] max-h-[94vh]"
        >
          {/* ========================================================
              POP-UP BÊN TRÁI: LỊCH SỬ QUÝ TRƯỚC (HÌNH 3 BÊN TRÁI)
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
                transition={{ duration: 0.25 }}
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
                        className="text-[#64748B] hover:text-[#1E293B] p-1.5 rounded-md hover:bg-[#E2E8F0] cursor-pointer"
                        title="Đóng pop-up lịch sử quý trước"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Left Popup Subheader Info */}
                  <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs shrink-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#1E293B]">{cleanName(user.full_name)}</span>
                      <span className="text-[11px] font-mono text-[#64748B]">({user.employee_code})</span>
                      {user.rank && (
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-[#7c9cd0]/20 text-[#24487c]">
                          {user.rank}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-[#64748B]">
                      Ngày trao đổi:{' '}
                      <strong className="text-[#1E293B]">
                        {selectedHistoryRecord?.actual_date || selectedHistoryRecord?.scheduled_date || '2025-12-25'}
                      </strong>
                    </div>
                  </div>

                  {/* Left Popup Body */}
                  <div className="p-5 overflow-y-auto space-y-4 text-xs">
                    {selectedHistoryAwards.length > 0 && (
                      <div className="p-2.5 bg-gradient-to-r from-[#FEF9C3]/40 to-[#E0F2FE]/40 border border-[#FDE047] rounded-md">
                        <div className="flex items-center space-x-1.5 font-bold text-[#1C1C1A] text-[11px] mb-1">
                          <Trophy size={13} className="text-[#CA8A04]" />
                          <span>Danh hiệu đạt được trong kỳ trước:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedHistoryAwards.map((prop) => {
                            const cat = awardCategories.find((c) => c.id === prop.category_id);
                            const qLabel = prop.quarter_id ? `Quý ${prop.quarter_id.replace('Q', '')}` : 'Quý 4';
                            const yearLabel = prop.year || 2025;
                            return (
                              <div
                                key={prop.id}
                                className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-white border border-[#E7E7E4] font-bold text-[10px] text-[#1C1C1A] shadow-2xs"
                              >
                                <span>🏆 {cat?.name?.replace(/\s*\([^)]*\)/g, '')}</span>
                                <span className="font-mono text-[#64748B] text-[9px] font-medium bg-[#F1F5F9] px-1 py-0.2 rounded">
                                  {qLabel}/{yearLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 1. Phiếu Chuẩn Bị Thông Tin (Kỳ Trước) */}
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
                          <span className="font-semibold text-[#DC2626] block mb-0.5">• Điểm cần cải thiện & khắc phục:</span>
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

                    {/* 2. Kết Quả Mendan Trực Tiếp (Kỳ Trước) */}
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
                      </div>
                    </div>
                  </div>

                  {/* Left Popup Footer */}
                  <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between shrink-0">
                    <span className="text-[11px] text-[#64748B] italic">Hồ sơ quý trước (Chỉ đọc)</span>

                    {selectedHistoryRecord?.next_goals && (
                      <button
                        type="button"
                        onClick={() => handleReferenceGoal(selectedHistoryRecord.next_goals)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all shadow-2xs cursor-pointer ${
                          copiedGoalFeedback
                            ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                            : 'bg-[#7c9cd0]/20 hover:bg-[#7c9cd0]/35 text-[#1E3A8A] border-[#7c9cd0]/40'
                        }`}
                      >
                        {copiedGoalFeedback ? (
                          <>
                            <CheckCircle2 size={13} className="text-[#15803D]" />
                            <span>✓ Đã đưa vào Ghi chú!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Tham chiếu mục tiêu sang kỳ này</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================
              POP-UP BÊN PHẢI: KỲ ĐÁNH GIÁ HIỆN TẠI (HÌNH 3 BÊN PHẢI)
             ======================================================== */}
          <motion.div
            layout
            className={`w-full ${
              showHistory ? 'lg:w-[740px] xl:w-[780px]' : 'max-w-3xl'
            } flex flex-col bg-white border border-[#E7E7E4] rounded-lg shadow-2xl max-h-[94vh] overflow-hidden`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EE] bg-[#FAFAF9] shrink-0">
              <div className="flex items-center space-x-3.5">
                <img
                  src={
                    user.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={user.full_name}
                  className="w-10 h-10 rounded-full object-cover border border-[#E7E7E4] shadow-2xs"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-[#1C1C1A]">
                      {cleanName(user.full_name)}
                    </h3>
                    <span className="text-xs font-mono text-[#8A8A85]">
                      ({user.employee_code})
                    </span>
                    {user.rank && (
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#7c9cd0]/20 text-[#24487c] border border-[#7c9cd0]/30">
                        {user.rank}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8A8A85] mt-0.5">
                    {team?.name || 'Chưa gán team'} • {user.position || 'Nhân viên nghiệp vụ'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold border active:scale-95 transition-all cursor-pointer ${
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
                  onClick={onClose}
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
                  <span className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                    formData.status === 'completed'
                      ? 'bg-[#EDF5EE] text-[#166534] border border-[#BBF7D0]'
                      : formData.status === 'pre_mendan'
                      ? 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]'
                      : 'bg-[#F4F4F2] text-[#6E6E6A] border border-[#E7E7E4]'
                  }`}>
                    {formData.status === 'completed' ? 'Hoàn thành mendan' : formData.status === 'pre_mendan' ? 'Đã đánh giá' : 'Chưa đánh giá'}
                  </span>
                </div>
              </div>

              {/* SECTION: Danh Hiệu & Giải Thưởng Đã Phê Duyệt */}
              {selectedUserAwards.length > 0 && (
                <div className="p-3.5 bg-gradient-to-r from-[#FEF9C3]/30 to-[#E0F2FE]/30 border border-[#FDE047]/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 font-bold text-[#1C1C1A]">
                      <Trophy size={14} className="text-[#CA8A04]" />
                      <span>Giải Thưởng & Vinh Danh Đã Đạt Được</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedUserAwards.map((prop) => {
                      const cat = awardCategories.find((c) => c.id === prop.category_id);
                      const qLabel = prop.quarter_id ? `Quý ${prop.quarter_id.replace('Q', '')}` : 'Quý 1';
                      const yearLabel = prop.year || 2026;
                      return (
                        <div
                          key={prop.id}
                          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E7E7E4] shadow-2xs"
                        >
                          <Trophy size={13} className="text-[#CA8A04] shrink-0" />
                          <span className="font-bold text-[#1C1C1A] text-[11px]">
                            {cat?.name?.replace(/\s*\([^)]*\)/g, '')}
                          </span>
                          <span className="text-[10px] font-semibold text-[#24487c] bg-[#7c9cd0]/15 px-1.5 py-0.2 rounded border border-[#7c9cd0]/30 font-mono">
                            {qLabel}/{yearLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tham chiếu mục tiêu quý trước */}
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
                          <span className="text-[10px] font-bold text-[#15803D] bg-white px-1.5 py-0.5 rounded border border-[#86EFAC]">
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
                    className="shrink-0 flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer bg-white hover:bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]"
                  >
                    <Copy size={12} />
                    <span>Chèn vào Ghi chú</span>
                  </button>
                </div>
              )}

              {/* ========================================================
                  1. PHIẾU CHUẨN BỊ THÔNG TIN (HÌNH 3)
                 ======================================================== */}
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

                  {/* Điểm cần cải thiện & khắc phục */}
                  <div>
                    <label className="font-semibold block mb-1 text-[#DC2626]">
                      • Điểm cần cải thiện & khắc phục:
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

                {/* Sub-bar Leader Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-[#E7E7E4]/60 text-[11px] gap-2">
                  <span className="text-[#8A8A85]">
                    Leader nộp đánh giá này để chuyển trạng thái sang "Đã đánh giá".
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

              {/* ========================================================
                  2. KẾT QUẢ MENDAN TRỰC TIẾP (HÌNH 3)
                 ======================================================== */}
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
                    <button
                      type="button"
                      onClick={handleCopyLeaderToManager}
                      className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-[#24487c] bg-[#7c9cd0]/15 hover:bg-[#7c9cd0]/25 rounded border border-[#7c9cd0]/30 cursor-pointer"
                      title="Sao chép nội dung chuẩn bị từ Leader vào biên bản của Manager"
                    >
                      <Copy size={12} />
                      <span>Sao chép gợi ý từ Leader</span>
                    </button>

                    <div className="w-32">
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

                {/* Format: Tiêu chuẩn 3 mục */}
                {(formData.content_format === 'standard_3' || !formData.content_format) && (
                  <div className="space-y-3">
                    <div>
                      <label className="font-semibold text-[#1C1C1A] block mb-1">
                        1. Điểm Tốt & Thành Tích Thống Nhất (Good Points)
                      </label>
                      <textarea
                        rows={2}
                        readOnly={!canEditMendan}
                        value={formData.good_points || ''}
                        onChange={(e) => setFormData({ ...formData, good_points: e.target.value })}
                        placeholder={canEditMendan ? "Quản lý ghi nhận ưu điểm và thế mạnh của nhân sự trong buổi trao đổi..." : "Chưa có nội dung ghi nhận"}
                        className={`w-full border rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden ${
                          !canEditMendan
                            ? 'bg-[#F8FAFC] border-[#E2E8F0] cursor-default'
                            : 'bg-white border-[#E7E7E4] focus:border-[#7c9cd0]'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#1C1C1A] block mb-1 text-[#DC2626]">
                        2. Điểm Cần Cải Thiện (Improvements)
                      </label>
                      <textarea
                        rows={2}
                        readOnly={!canEditMendan}
                        value={formData.improvements || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, improvements: e.target.value })
                        }
                        placeholder={canEditMendan ? "Những điểm thỏa thuận cần khắc phục trong kỳ tới..." : "Chưa có nội dung ghi nhận"}
                        className={`w-full border rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden ${
                          !canEditMendan
                            ? 'bg-[#F8FAFC] border-[#E2E8F0] cursor-default'
                            : 'bg-white border-[#E7E7E4] focus:border-[#7c9cd0]'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#1C1C1A] block mb-1 text-[#24487c]">
                        3. Mục Tiêu Giai Đoạn Tiếp Theo (Next Goals)
                      </label>
                      <textarea
                        rows={2}
                        readOnly={!canEditMendan}
                        value={formData.next_goals || ''}
                        onChange={(e) => setFormData({ ...formData, next_goals: e.target.value })}
                        placeholder={canEditMendan ? "Chỉ số KPI cam kết, định hướng chuyên môn, đào tạo mới trong quý sau..." : "Chưa có nội dung ghi nhận"}
                        className={`w-full border rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden ${
                          !canEditMendan
                            ? 'bg-[#F8FAFC] border-[#E2E8F0] cursor-default'
                            : 'bg-white border-[#E7E7E4] focus:border-[#7c9cd0]'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Format: Tự do */}
                {formData.content_format === 'single_note' && (
                  <div>
                    <label className="font-semibold text-[#1C1C1A] block mb-1">
                      Nội Dung Trao Đổi / Ghi Chú Tự Do
                    </label>
                    <textarea
                      rows={6}
                      readOnly={!canEditMendan}
                      value={formData.memo || ''}
                      onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                      placeholder={canEditMendan ? "Ghi chép tự do nội dung buổi trao đổi Mendan..." : "Chưa có nội dung ghi chép"}
                      className={`w-full border rounded p-3 text-xs text-[#1C1C1A] focus:outline-hidden ${
                        !canEditMendan
                          ? 'bg-[#F8FAFC] border-[#E2E8F0] cursor-default'
                          : 'bg-white border-[#E7E7E4] focus:border-[#7c9cd0]'
                      }`}
                    />
                  </div>
                )}

                {/* Memo: Chỉ hiển thị cho Quản lý & Leader (Bảo mật nội bộ) */}
                {canEditMendan && (
                  <div>
                    <label className="font-semibold text-[#1C1C1A] block mb-1">
                      Ghi Chú Lưu Trữ Nội Bộ (Memo Cho Leader & Quản Lý)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.memo || ''}
                      onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                      placeholder="Tổng kết thỏa thuận, lưu ý đặc biệt để Leader tiện theo dõi..."
                      className="w-full bg-white border border-[#E7E7E4] rounded p-2.5 text-xs text-[#1C1C1A] focus:outline-hidden focus:border-[#7c9cd0]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer (Hình 3) */}
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
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs font-medium rounded border border-[#E7E7E4] bg-white text-[#4A4A46] hover:bg-[#F6F6F4] transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                {canEditMendan && (
                  <button
                    type="button"
                    onClick={handleManagerSaveDraft}
                    className="px-4 py-1.5 text-xs font-medium rounded border border-[#7c9cd0]/50 bg-white text-[#24487c] hover:bg-[#7c9cd0]/10 transition-colors cursor-pointer"
                  >
                    Lưu Bản Nháp
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleManagerComplete}
                    className="flex items-center space-x-1.5 px-5 py-1.5 text-xs font-semibold rounded bg-[#24487c] hover:bg-[#153C77] text-white shadow-xs transition-colors cursor-pointer"
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
    </AnimatePresence>
  );
};
