import React, { useState } from 'react';
import {
  User as UserIcon,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle,
  Bell,
  Briefcase,
  FileText,
  Mail,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RANK_STYLE_CONFIG, ALL_RANKS, EmployeeRank } from '../../types';

export const UserProfileModule: React.FC = () => {
  const {
    currentUser,
    teams,
    kpiRecords,
    mendanRecords,
    awardProposals,
    awardCategories,
    triggerToast,
    updateUser,
  } = useApp();

  const [notificationPrefs, setNotificationPrefs] = useState({
    kpi_updates: true,
    award_results: true,
    mendan_alerts: true,
  });

  const myTeam = teams.find((t) => t.id === currentUser.team_id);
  const myKpis = kpiRecords.filter((r) => r.user_id === currentUser.id);
  const myMendans = mendanRecords.filter((m) => {
    if (m.user_id !== currentUser.id || m.status !== 'completed') return false;
    // Privacy check:
    // If visibility_type is 'private': only evaluator or admin/master can view
    if (m.visibility_type === 'private') {
      return (
        currentUser.role === 'admin' ||
        currentUser.role === 'master' ||
        m.evaluator_id === currentUser.id
      );
    }
    // If visibility_type is 'public':
    // currentUser can view if they are the evaluated employee, or the evaluator, or in allowed_viewer_ids, or admin/master
    if (m.visibility_type === 'public') {
      return (
        m.user_id === currentUser.id ||
        m.evaluator_id === currentUser.id ||
        (m.allowed_viewer_ids && m.allowed_viewer_ids.includes(currentUser.id)) ||
        currentUser.role === 'admin' ||
        currentUser.role === 'master'
      );
    }
    // Legacy fallback
    if (currentUser.role !== 'admin' && currentUser.role !== 'master') {
      if (m.visibility_scope === 'manager_only' || m.visibility_scope === 'leader_only') {
        return false;
      }
    }
    return true;
  });
  const myAwards = awardProposals.filter(
    (p) => p.user_id === currentUser.id && p.status === 'approved' && p.is_published
  );

  const latestKpi = myKpis[0];
  const completionRate =
    latestKpi && latestKpi.target > 0
      ? ((latestKpi.achieved / latestKpi.target) * 100).toFixed(1)
      : '0.0';

  const handleTogglePref = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      triggerToast('Đã Lưu Tuỳ Chọn', 'Tuỳ chọn thông báo của bạn đã được cập nhật.');
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Summary */}
      <div className="bg-white border border-[#E7E7E4] rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-5">
            <img
              src={
                currentUser.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser.full_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#7c9cd0]/40"
            />
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-bold text-[#1C1C1A]">{currentUser.full_name}</h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F0F0EE] text-[#4A4A46] font-medium">
                  {currentUser.employee_code}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#7c9cd0] text-white font-mono shadow-xs">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-[#4A4A46] mt-1">
                {currentUser.position || 'Chuyên viên nghiệp vụ'} • {myTeam?.name || 'Khối sự vụ'}
              </p>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-[#8A8A85]">
                <span className="flex items-center space-x-1">
                  <Mail size={13} />
                  <span>{currentUser.email}</span>
                </span>
                <span>•</span>
                <div className="flex items-center space-x-2">
                  <span>Cấp bậc:</span>
                  <span
                    style={{
                      backgroundColor:
                        RANK_STYLE_CONFIG[currentUser.rank || 'C2']?.bg || '#DCE8F5',
                      color:
                        RANK_STYLE_CONFIG[currentUser.rank || 'C2']?.text || '#1E3A5F',
                      borderColor:
                        RANK_STYLE_CONFIG[currentUser.rank || 'C2']?.border || 'transparent',
                    }}
                    className="inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono border"
                  >
                    {currentUser.rank || 'C2'}
                  </span>
                  <select
                    value={currentUser.rank || 'C2'}
                    onChange={(e) => {
                      updateUser({ ...currentUser, rank: e.target.value as EmployeeRank });
                    }}
                    className="text-[11px] font-medium bg-[#F6F6F4] border border-[#E7E7E4] rounded px-1.5 py-0.5 text-[#1C1C1A] cursor-pointer hover:border-[#8A8A85]"
                    title="Chỉnh sửa cấp bậc hồ sơ cá nhân"
                  >
                    {ALL_RANKS.map((rk) => (
                      <option key={rk} value={rk}>
                        {rk}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#F6F6F4] rounded-lg border border-[#E7E7E4] min-w-[200px]">
            <div className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wider">
              HIỆU SUẤT GẦN NHẤT
            </div>
            <div className="text-2xl font-bold text-[#1C1C1A] mt-1">{completionRate}%</div>
            <div className="text-xs text-[#8A8A85] mt-0.5">
              {latestKpi
                ? `${latestKpi.achieved} / ${latestKpi.target} ${latestKpi.unit}`
                : 'Chưa có bản ghi'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal KPI History */}
        <div className="bg-white border border-[#E7E7E4] rounded-lg p-5">
          <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider mb-4 flex items-center space-x-2">
            <TrendingUp size={15} />
            <span>Lịch Sử Thành Tích KPI Cá Nhân</span>
          </h2>

          {myKpis.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8A8A85]">
              Chưa có dữ liệu KPI cá nhân được ghi nhận.
            </div>
          ) : (
            <div className="space-y-3">
              {myKpis.map((kpi) => {
                const rate =
                  kpi.target > 0 ? ((kpi.achieved / kpi.target) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={kpi.id}
                    className="p-3.5 bg-[#F6F6F4] rounded border border-[#E7E7E4] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1C1C1A]">{kpi.period_label}</span>
                      <span className="font-bold text-[#6B8F71]">{rate}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[#8A8A85] text-[11px]">
                      <span>
                        Chỉ tiêu: {kpi.target} | Đạt: {kpi.achieved} {kpi.unit}
                      </span>
                      <span>
                        Lỗi: {kpi.miss_count} | Trễ: {kpi.late_count}
                      </span>
                    </div>
                    {kpi.notes && (
                      <div className="text-[#4A4A46] text-[11px] italic pt-1 border-t border-[#E7E7E4]">
                        Nhận xét: {kpi.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mendan Evaluations Completed Memo */}
        <div className="bg-white border border-[#E7E7E4] rounded-lg p-5">
          <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Calendar size={15} />
            <span>Biên Bản Đánh Giá & Mendan (Post-memo)</span>
          </h2>

          {myMendans.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8A8A85]">
              Chưa có biên bản đánh giá & Mendan hoàn thành nào được chia sẻ.
            </div>
          ) : (
            <div className="space-y-3">
              {myMendans.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 bg-[#F6F6F4] rounded border border-[#E7E7E4] text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1C1C1A]">
                      {m.quarter_id ? `Đánh giá & Mendan ${m.quarter_id}` : 'Đánh giá & Mendan Ad-hoc'}
                    </span>
                    <span className="text-[11px] text-[#8A8A85]">
                      Ngày: {m.actual_date || m.scheduled_date}
                    </span>
                  </div>
                  <div className="text-[#4A4A46] leading-relaxed">
                    <div className="font-semibold text-[#1C1C1A] text-[11px] mb-0.5">
                      Tổng kết Memo:
                    </div>
                    <p className="bg-white p-2 rounded border border-[#E7E7E4]">
                      {m.memo || 'Đã hoàn thành buổi trao đổi.'}
                    </p>
                  </div>
                  <div className="text-[11px] text-[#8A8A85]">
                    Mục tiêu kỳ tới: {m.next_goals}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Honors and Notification Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Honors Badges */}
        <div className="bg-white border border-[#E7E7E4] rounded-lg p-5">
          <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Award size={15} />
            <span>Giải Thưởng Đã Đạt</span>
          </h2>

          {myAwards.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8A8A85]">
              Chưa có danh hiệu vinh danh nào trong các kỳ đã xuất bản.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {myAwards.map((a) => {
                const cat = awardCategories.find((c) => c.id === a.category_id);
                return (
                  <div
                    key={a.id}
                    title={`${cat?.name || 'Vinh danh'} - Kỳ ${a.quarter_id}/2026: ${a.reason}`}
                    className="p-2.5 bg-[#FBF7EE] border border-[#E5D7A9] rounded flex items-center space-x-2 text-xs shadow-2xs hover:border-[#B08A3E] transition-all cursor-pointer group"
                  >
                    <Award size={20} className="text-[#B08A3E] group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-[11px] text-[#B08A3E] font-mono">{a.quarter_id}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notification Preferences (Module 6.2) */}
        <div className="bg-white border border-[#E7E7E4] rounded-lg p-5">
          <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Bell size={15} />
            <span>Cài Đặt Nhận Thông Báo (Polling 30s)</span>
          </h2>

          <div className="space-y-3 text-xs divide-y divide-[#F0F0EE]">
            {[
              { key: 'kpi_updates', label: 'Cập nhật chỉ số KPI & Import Excel' },
              { key: 'award_results', label: 'Kết quả duyệt vinh danh & Bảng vàng' },
              { key: 'mendan_alerts', label: 'Lịch phỏng vấn Mendan & Biên bản mới' },
            ].map((item) => (
              <div
                key={item.key}
                className="pt-2.5 flex items-center justify-between cursor-pointer"
                onClick={() => handleTogglePref(item.key as any)}
              >
                <span className="text-[#4A4A46] font-medium">{item.label}</span>
                <input
                  type="checkbox"
                  checked={(notificationPrefs as any)[item.key]}
                  onChange={() => handleTogglePref(item.key as any)}
                  className="rounded border-[#E7E7E4] accent-[#7c9cd0] cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
