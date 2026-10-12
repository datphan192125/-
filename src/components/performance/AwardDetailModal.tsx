import React from 'react';
import {
  Trophy,
  X,
  Award,
  ShieldCheck,
  Sparkles,
  HeartHandshake,
  Star,
  Check,
} from 'lucide-react';
import { User, AwardProposal, AwardCategory } from '../../types';
import { cleanName } from '../../utils/format';

export interface AwardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  awards: AwardProposal[];
  awardCategories: AwardCategory[];
}

export const AwardDetailModal: React.FC<AwardDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  awards,
  awardCategories,
}) => {
  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
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
                {cleanName(user.full_name)} • Mã NV: {user.employee_code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A8A85] hover:text-[#1C1C1A] hover:bg-[#F6F6F4] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Tổng cộng: {awards.length} giải thưởng đạt được
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#24487c] border border-[#BFDBFE]">
              Thành Tích & Vinh Danh
            </span>
          </div>

          {awards.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8A8A85]">
              Chưa có giải thưởng hoặc vinh danh nào được ghi nhận cho nhân sự này.
            </div>
          ) : (
            awards.map((award) => {
              const cat = awardCategories.find((c) => c.id === award.category_id);
              const rawCatName =
                cat?.name?.replace(/\s*\([^)]*\)/g, '').trim() || 'Giải Thưởng Quý';

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
                      <div
                        className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${bgClass}`}
                      >
                        <IconComp size={13} />
                      </div>
                      <span className="font-bold text-xs text-[#1E293B]">{rawCatName}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                      {award.quarter_id ? `${award.quarter_id}/` : ''}
                      {award.year}
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
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#24487c] hover:bg-[#153C77] text-white shadow-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
