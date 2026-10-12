import React, { useState, useEffect } from 'react';
import { Award, X } from 'lucide-react';
import { User, AwardCategory, AwardProposal } from '../../types';
import { cleanName } from '../../utils/format';

export interface AwardQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  awardCategories: AwardCategory[];
  currentUser: User;
  currentQuarter: string;
  isAdmin: boolean;
  onSubmitAwardProposal: (proposal: Omit<AwardProposal, 'id' | 'created_at' | 'status'>) => void;
}

export const AwardQuickModal: React.FC<AwardQuickModalProps> = ({
  isOpen,
  onClose,
  user,
  awardCategories,
  currentUser,
  currentQuarter,
  isAdmin,
  onSubmitAwardProposal,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    awardCategories[0]?.id || ''
  );
  const [awardReason, setAwardReason] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedCategoryId(awardCategories[0]?.id || '');
      setAwardReason('');
    }
  }, [isOpen, user?.id, awardCategories]);

  if (!isOpen || !user) return null;

  const handleSaveAwardProposal = () => {
    if (!selectedCategoryId) return;
    onSubmitAwardProposal({
      user_id: user.id,
      category_id: selectedCategoryId,
      quarter_id: currentQuarter,
      year: 2026,
      proposed_by: currentUser.id,
      reason: awardReason || 'Đóng góp xuất sắc trong kỳ hoạt động',
      is_published: isAdmin,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
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
            onClick={onClose}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center space-x-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <img
              src={
                user.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={user.full_name}
              className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0]"
            />
            <div>
              <div className="font-bold text-sm text-[#1C1C1A]">
                {cleanName(user.full_name)}
              </div>
              <div className="text-[11px] text-[#64748B]">
                Mã NV: {user.employee_code} • Cấp bậc: {user.rank || '—'}
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
            onClick={onClose}
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
  );
};
