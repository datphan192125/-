import React from 'react';
import { X, CheckCircle, Clock, AlertTriangle, Briefcase, Award } from 'lucide-react';
import { KpiRecord, User, Team, EmployeeRank, ALL_RANKS, RANK_STYLE_CONFIG } from '../../types';
import { useApp } from '../../context/AppContext';

interface UserKpiDetailModalProps {
  record: KpiRecord | null;
  user: User | null;
  team: Team | null;
  onClose: () => void;
}

export const UserKpiDetailModal: React.FC<UserKpiDetailModalProps> = ({
  record,
  user,
  team,
  onClose,
}) => {
  const { isLeaderOrAdmin, updateUser, awardProposals, awardCategories } = useApp();

  if (!record || !user) return null;

  const completionRate =
    record.target > 0 ? ((record.achieved / record.target) * 100).toFixed(1) : '0';
  const isExceeded = Number(completionRate) >= 102;
  const isAchieved = Number(completionRate) >= 100 && !isExceeded;
  const currentRank = user.rank || 'C2';
  const rankConfig = RANK_STYLE_CONFIG[currentRank] || RANK_STYLE_CONFIG['C2'];

  const userAwards = (awardProposals || []).filter(
    (p) => p.user_id === user.id && p.status === 'approved' && p.is_published
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#E7E7E4] rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EE]">
          <div className="flex items-center space-x-3">
            <img
              src={
                user.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={user.full_name}
              className="w-10 h-10 rounded-full object-cover border border-[#E7E7E4]"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-[#1C1C1A]">{user.full_name}</h3>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#F0F0EE] text-[#4A4A46]">
                  {user.employee_code}
                </span>
                {userAwards.length > 0 && (
                  <div className="flex items-center space-x-1 pl-1">
                    {userAwards.map((a) => {
                      const cat = awardCategories.find((c) => c.id === a.category_id);
                      return (
                        <span
                          key={a.id}
                          title={`${cat?.name || 'Vinh danh'} (${a.quarter_id}/2026): ${a.reason}`}
                          className="inline-flex items-center justify-center p-1 rounded bg-[#FBF7EE] border border-[#E5D7A9] text-[#B08A3E] cursor-pointer hover:scale-110 transition-transform shadow-2xs"
                        >
                          <Award size={13} />
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-[#8A8A85]">{team?.name || 'Chưa phân team'}</span>
                <span className="text-xs text-[#8A8A85]">•</span>
                <span className="text-xs text-[#8A8A85]">Cấp bậc:</span>
                <span
                  style={{
                    backgroundColor: rankConfig.bg,
                    color: rankConfig.text,
                    borderColor: rankConfig.border || 'transparent',
                  }}
                  className="inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono border"
                >
                  {currentRank}
                </span>
                {isLeaderOrAdmin && (
                  <select
                    value={currentRank}
                    onChange={(e) => {
                      updateUser({ ...user, rank: e.target.value as EmployeeRank });
                    }}
                    className="text-[11px] font-medium bg-[#F6F6F4] border border-[#E7E7E4] rounded px-1.5 py-0.5 text-[#1C1C1A] cursor-pointer hover:border-[#8A8A85]"
                    title="Điều chỉnh cấp bậc hồ sơ nhân sự"
                  >
                    {ALL_RANKS.map((rk) => (
                      <option key={rk} value={rk}>
                        {rk}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A8A85] hover:text-[#1C1C1A] p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key metrics grid */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-[#F6F6F4] rounded-lg border border-[#E7E7E4]">
            <div>
              <div className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wider">
                TIẾN ĐỘ
              </div>
              <div className="text-2xl font-bold text-[#1C1C1A] mt-1">{completionRate}%</div>
              <span
                className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 ${
                  isExceeded || isAchieved
                    ? 'bg-[#F0F4F0] text-[#6B8F71]'
                    : 'bg-[#FDF2F2] text-[#B85D5D]'
                }`}
              >
                {isExceeded ? 'Vượt Chỉ Tiêu' : isAchieved ? 'Đạt Target' : 'Cần Cải Thiện'}
              </span>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wider">
                MỤC TIÊU
              </div>
              <div className="text-2xl font-bold text-[#1C1C1A] mt-1">{record.target}</div>
              <div className="text-[11px] text-[#8A8A85] mt-1">Đơn vị: {record.unit}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wider">
                ĐÃ ĐẠT ĐƯỢC
              </div>
              <div className="text-2xl font-bold text-[#1C1C1A] mt-1">{record.achieved}</div>
              <div className="text-[11px] text-[#8A8A85] mt-1">
                {record.achieved >= record.target
                  ? `+${record.achieved - record.target} vượt`
                  : `-${record.target - record.achieved} thiếu`}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wider">
                CHẤT LƯỢNG
              </div>
              <div className="flex items-center space-x-3 mt-1 text-sm font-semibold">
                <span className={record.miss_count > 0 ? 'text-[#dc2626]' : 'text-[#4A4A46]'}>
                  {record.miss_count} Miss
                </span>
                <span className="text-[#8A8A85]">•</span>
                <span className={record.late_count > 0 ? 'text-[#dc2626]' : 'text-[#4A4A46]'}>
                  {record.late_count} Đi trễ
                </span>
              </div>
              <div className="text-[10px] text-[#8A8A85] mt-1">
                Tỷ lệ lỗi: {((record.miss_count / (record.achieved || 1)) * 100).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Projects and Contributions */}
          <div>
            <h4 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Briefcase size={14} />
              <span>Đề Án & Nhiệm Vụ Tham Gia ({record.projects?.length || 0})</span>
            </h4>
            {record.projects && record.projects.length > 0 ? (
              <div className="space-y-2">
                {record.projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-white border border-[#E7E7E4] rounded-md hover:border-[#8A8A85] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#1C1C1A]">{p.name}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F0F0EE] text-[#4A4A46]">
                        {p.role}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A4A46] mt-1 leading-relaxed">{p.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8A8A85] italic">Chưa ghi nhận đề án độc lập</p>
            )}
          </div>

          {/* Evaluator Notes */}
          <div>
            <h4 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider mb-2">
              Nhận Xét Của Người Đánh Giá
            </h4>
            <div className="p-3.5 bg-[#FAFAF9] border border-[#E7E7E4] rounded-md text-xs text-[#4A4A46] leading-relaxed">
              {record.notes || 'Chưa có ghi chú bổ sung.'}
            </div>
          </div>

          <div className="text-[11px] text-[#8A8A85] pt-2 border-t border-[#F0F0EE] flex items-center justify-between">
            <span>Kỳ: {record.period_label}</span>
            <span>Cập nhật lần cuối: {new Date(record.updated_at).toLocaleString('vi-VN')}</span>
          </div>
        </div>

        <div className="px-6 py-3 bg-[#FAFAF9] border-t border-[#F0F0EE] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-[#1C1C1A] text-white hover:bg-[#2B2B28] transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
