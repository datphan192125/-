import React from 'react';
import {
  TrendingUp,
  Award,
  Calendar,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HomeDashboard: React.FC = () => {
  const {
    currentUser,
    teams,
    users,
    kpiRecords,
    awardProposals,
    awardCategories,
    mendanRecords,
    setActiveTab,
  } = useApp();

  // Aggregate high level metrics
  const totalTarget = kpiRecords.reduce((s, r) => s + r.target, 0);
  const totalAchieved = kpiRecords.reduce((s, r) => s + r.achieved, 0);
  const totalMiss = kpiRecords.reduce((s, r) => s + r.miss_count, 0);
  const completionRate = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

  const upcomingMendans = mendanRecords.filter((m) => m.status !== 'completed').slice(0, 3);
  const latestAwards = awardProposals
    .filter((p) => p.status === 'approved' && p.is_published)
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white border border-[#E7E7E4] border-l-[4px] border-l-[#7c9cd0] rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#24487c] bg-[#7c9cd0]/15 px-2.5 py-0.5 rounded border border-[#7c9cd0]/30 inline-block mb-1">
            DYM 内部事務代行 • Hệ Thống Quản Lý Nội Bộ v2.0
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A] mt-1">
            Xin chào, {currentUser.full_name}
          </h1>
          <p className="text-xs text-[#4A4A46] mt-1">
            Bạn đang đăng nhập với vai trò{' '}
            <strong className="font-mono uppercase text-[#24487c] bg-[#7c9cd0]/10 px-1.5 py-0.2 rounded border border-[#7c9cd0]/20">
              [{currentUser.role}]
            </strong>{' '}
            thuộc {teams.find((t) => t.id === currentUser.team_id)?.name || 'Khối Sự Vụ'}.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('kpi')}
            className="flex items-center space-x-2 px-4 py-2 rounded-md bg-[#7c9cd0] text-white text-xs font-semibold hover:bg-[#6788be] shadow-xs transition-colors"
          >
            <span>Vào Bảng Thành Tích</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 4 Overview Quick Stats Cards (Apple Notes Style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('kpi')}
          className="bg-white border border-[#E7E7E4] rounded-lg p-5 hover:border-[#7c9cd0] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#8A8A85]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              TIẾN ĐỘ TOÀN BỘ PHẬN
            </span>
            <TrendingUp size={16} className="text-[#6B8F71]" />
          </div>
          <div className="text-2xl font-bold text-[#1C1C1A] mt-2">
            {completionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-[#6B8F71] font-medium mt-1">
            Vượt 180 Task chỉ tiêu
          </div>
        </div>

        <div
          onClick={() => setActiveTab('kpi')}
          className="bg-white border border-[#E7E7E4] rounded-lg p-5 hover:border-[#7c9cd0] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#8A8A85]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              SẢN LƯỢNG ĐÃ ĐẠT
            </span>
            <FileSpreadsheet size={16} className="text-[#7c9cd0]" />
          </div>
          <div className="text-2xl font-bold text-[#1C1C1A] mt-2">
            {totalAchieved.toLocaleString('de-DE')}{' '}
            <span className="text-xs text-[#8A8A85] font-normal">task</span>
          </div>
          <div className="text-xs text-[#8A8A85] mt-1">
            Mục tiêu: {totalTarget.toLocaleString('de-DE')} task
          </div>
        </div>

        <div
          onClick={() => setActiveTab('mendan')}
          className="bg-white border border-[#E7E7E4] rounded-lg p-5 hover:border-[#8A8A85] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#8A8A85]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              PHỎNG VẤN MENDAN
            </span>
            <Calendar size={16} className="text-[#B08A3E]" />
          </div>
          <div className="text-2xl font-bold text-[#1C1C1A] mt-2">
            {mendanRecords.filter((m) => m.status === 'completed').length} /{' '}
            {mendanRecords.length}
          </div>
          <div className="text-xs text-[#8A8A85] mt-1">Hồ sơ đã hoàn tất memo</div>
        </div>

        <div
          onClick={() => setActiveTab('awards')}
          className="bg-white border border-[#E7E7E4] rounded-lg p-5 hover:border-[#8A8A85] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#8A8A85]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              BẢNG VÀNG VINH DANH
            </span>
            <Award size={16} className="text-[#B08A3E]" />
          </div>
          <div className="text-2xl font-bold text-[#1C1C1A] mt-2">
            {latestAwards.length} Cá Nhân
          </div>
          <div className="text-xs text-[#6B8F71] font-medium mt-1">Đã xuất bản Quý 1</div>
        </div>
      </div>

      {/* Two columns: Hall of fame spotlights & Upcoming Mendan / Quick Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hall of Fame Spotlight */}
        <div className="bg-white border border-[#E7E7E4] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EE]">
              <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider flex items-center space-x-1.5">
                <Award size={14} className="text-[#B08A3E]" />
                <span>Tiêu Điểm Vinh Danh Quý 1/2026</span>
              </h2>
              <button
                onClick={() => setActiveTab('awards')}
                className="text-xs text-[#8A8A85] hover:text-[#1C1C1A] underline"
              >
                Xem Bảng Vàng
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {latestAwards.map((prop) => {
                const honoree = users.find((u) => u.id === prop.user_id);
                const cat = awardCategories.find((c) => c.id === prop.category_id);
                return (
                  <div
                    key={prop.id}
                    className="p-3.5 bg-[#FAFAF9] border border-[#E7E7E4] rounded-md flex items-start space-x-3.5"
                  >
                    <img
                      src={
                        honoree?.avatar_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={honoree?.full_name}
                      className="w-11 h-11 rounded-full object-cover border border-[#E7E7E4]"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1C1C1A]">{honoree?.full_name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FBF7EE] text-[#B08A3E]">
                          {cat?.name}
                        </span>
                      </div>
                      <p className="text-[#4A4A46] mt-1 italic text-[11px] line-clamp-2">
                        "{prop.reason}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Linear Mendan Timeline */}
        <div className="bg-white border border-[#E7E7E4] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EE]">
              <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider flex items-center space-x-1.5">
                <Clock size={14} className="text-[#4A4A46]" />
                <span>Lịch Phỏng Vấn Mendan Sắp Tới</span>
              </h2>
              <button
                onClick={() => setActiveTab('mendan')}
                className="text-xs text-[#8A8A85] hover:text-[#1C1C1A] underline"
              >
                Xem Tất Cả
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {upcomingMendans.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8A8A85]">
                  Tất cả các cuộc phỏng vấn Mendan đã hoàn thành.
                </div>
              ) : (
                upcomingMendans.map((m) => {
                  const member = users.find((u) => u.id === m.user_id);
                  const team = teams.find((t) => t.id === m.team_id);
                  return (
                    <div
                      key={m.id}
                      className="p-3 bg-[#FAFAF9] border border-[#E7E7E4] rounded-md flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#1C1C1A]">{member?.full_name}</div>
                        <div className="text-[11px] text-[#8A8A85]">
                          {team?.name} • Lịch: {m.scheduled_date}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FBF7EE] text-[#B08A3E] border border-[#E7E7E4]">
                        {m.status === 'pre_mendan' ? 'Chuẩn bị Pre-notes' : 'Chưa bắt đầu'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation Grid */}
      <div className="bg-white border border-[#E7E7E4] rounded-lg p-5">
        <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider mb-4">
          Truy Cập Nhanh Các Phân Hệ Nghiệp Vụ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <button
            onClick={() => setActiveTab('kpi')}
            className="p-3.5 rounded-lg border border-[#E7E7E4] hover:border-[#7c9cd0] hover:bg-[#7c9cd0]/5 transition-all text-left bg-[#FAFAF9] group"
          >
            <TrendingUp size={16} className="text-[#1C1C1A] group-hover:text-[#7c9cd0] mb-2 transition-colors" />
            <div className="font-bold text-[#1C1C1A] group-hover:text-[#24487c] transition-colors">1. Bảng Thành Tích KPI</div>
            <div className="text-[11px] text-[#8A8A85] mt-0.5">Tiến độ 1課, 2課, 3課, GS & Import Excel</div>
          </button>

          <button
            onClick={() => setActiveTab('mendan')}
            className="p-3.5 rounded-lg border border-[#E7E7E4] hover:border-[#7c9cd0] hover:bg-[#7c9cd0]/5 transition-all text-left bg-[#FAFAF9] group"
          >
            <Calendar size={16} className="text-[#1C1C1A] group-hover:text-[#7c9cd0] mb-2 transition-colors" />
            <div className="font-bold text-[#1C1C1A] group-hover:text-[#24487c] transition-colors">2. Phỏng Vấn Mendan (面談)</div>
            <div className="text-[11px] text-[#8A8A85] mt-0.5">Điểm tốt, cải thiện & Memo định kỳ</div>
          </button>

          <button
            onClick={() => setActiveTab('awards')}
            className="p-3.5 rounded-lg border border-[#E7E7E4] hover:border-[#7c9cd0] hover:bg-[#7c9cd0]/5 transition-all text-left bg-[#FAFAF9] group"
          >
            <Award size={16} className="text-[#1C1C1A] group-hover:text-[#7c9cd0] mb-2 transition-colors" />
            <div className="font-bold text-[#1C1C1A] group-hover:text-[#24487c] transition-colors">3. Khen Thưởng & Bảng Vàng</div>
            <div className="text-[11px] text-[#8A8A85] mt-0.5">Đề cử MVP, Kaizen & Vinh danh toàn bộ phận</div>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className="p-3.5 rounded-lg border border-[#E7E7E4] hover:border-[#7c9cd0] hover:bg-[#7c9cd0]/5 transition-all text-left bg-[#FAFAF9] group"
          >
            <Users size={16} className="text-[#1C1C1A] group-hover:text-[#7c9cd0] mb-2 transition-colors" />
            <div className="font-bold text-[#1C1C1A] group-hover:text-[#24487c] transition-colors">4. Hồ Sơ Cá Nhân</div>
            <div className="text-[11px] text-[#8A8A85] mt-0.5">Xem chỉ số cá nhân & tuỳ chọn polling</div>
          </button>

          <button
            onClick={() => setActiveTab('admin-team')}
            className="p-3.5 rounded-lg border border-[#E7E7E4] hover:border-[#7c9cd0] hover:bg-[#7c9cd0]/5 transition-all text-left bg-[#FAFAF9] group"
          >
            <Users size={16} className="text-[#1C1C1A] group-hover:text-[#7c9cd0] mb-2 transition-colors" />
            <div className="font-bold text-[#1C1C1A] group-hover:text-[#24487c] transition-colors">5. Quản Trị Nhân Sự (RBAC)</div>
            <div className="text-[11px] text-[#8A8A85] mt-0.5">Phân quyền vai trò & Sơ đồ tổ chức</div>
          </button>

          <button
            onClick={() => setActiveTab('admin-config')}
            className="p-3.5 rounded-lg border border-[#E7E7E4] hover:border-[#7c9cd0] hover:bg-[#7c9cd0]/5 transition-all text-left bg-[#FAFAF9] group"
          >
            <CheckCircle2 size={16} className="text-[#1C1C1A] group-hover:text-[#7c9cd0] mb-2 transition-colors" />
            <div className="font-bold text-[#1C1C1A] group-hover:text-[#24487c] transition-colors">6. Cấu Hình Quý & Tiêu Chí</div>
            <div className="text-[11px] text-[#8A8A85] mt-0.5">Quản lý Quarters, ngưỡng % & Audit Logs</div>
          </button>
        </div>
      </div>
    </div>
  );
};
