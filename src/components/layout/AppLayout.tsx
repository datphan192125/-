import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Award,
  Calendar,
  Users,
  Settings,
  User as UserIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ClipboardCheck,
} from 'lucide-react';
import { useApp, NavTab } from '../../context/AppContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const {
    currentUser,
    switchUser,
    users,
    activeTab,
    setActiveTab,
    toastAlert,
    clearToast,
  } = useApp();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSsoModal, setShowSsoModal] = useState(false);

  const navItems = [
    {
      group: 'HIỆU SUẤT & ĐÁNH GIÁ',
      items: [
        { id: 'home' as NavTab, label: 'Trang Chủ', icon: LayoutDashboard },
        { id: 'kpi' as NavTab, label: 'Thành Tích', icon: TrendingUp },
        { id: 'awards' as NavTab, label: 'Khen Thưởng & Bảng Vàng', icon: Award },
      ],
    },
    {
      group: 'QUẢN TRỊ HỆ THỐNG',
      items: [
        { id: 'admin-team' as NavTab, label: 'Quản Lý Team & Nhân Sự', icon: Users },
        { id: 'admin-config' as NavTab, label: 'Cấu Hình Quý & Tiêu Chí', icon: Settings },
      ],
    },
    {
      group: 'CÁ NHÂN',
      items: [
        { id: 'profile' as NavTab, label: 'Hồ Sơ Cá Nhân', icon: UserIcon },
      ],
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F6F6F4] text-[#1C1C1A] relative">
      {/* Signature #7c9cd0 Top Accent Stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#7c9cd0] z-50" />

      {/* Toast Alert Banner */}
      {toastAlert && (
        <div className="fixed top-4 right-4 z-50 flex items-start space-x-3 bg-white border border-[#E7E7E4] shadow-sm rounded-lg p-3 max-w-md transition-all duration-200">
          <div className="mt-0.5 text-[#6B8F71]">
            <CheckCircle2 size={16} />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-semibold text-[#1C1C1A]">{toastAlert.title}</p>
            <p className="text-[#4A4A46] mt-0.5">{toastAlert.message}</p>
          </div>
          <button
            onClick={clearToast}
            className="text-[#8A8A85] hover:text-[#1C1C1A] p-0.5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Sidebar - Apple Notes minimalist style with #7c9cd0 theme and collapse functionality */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-[68px]' : 'w-64'
        } flex-shrink-0 bg-white border-r border-[#E7E7E4] flex flex-col h-full select-none shadow-xs transition-all duration-300 ease-in-out`}
      >
        {/* Brand Header with #7c9cd0 & Collapse toggle */}
        {isSidebarCollapsed ? (
          <div className="p-3 bg-[#7c9cd0] text-white border-b border-[#6788be] flex flex-col items-center justify-center space-y-1.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold text-xs tracking-wider border border-white/30 shadow-xs shrink-0">
              DYM
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Mở rộng menu"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="p-3.5 bg-[#7c9cd0] text-white border-b border-[#6788be] flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold text-xs tracking-wider border border-white/30 shadow-xs shrink-0">
                DYM
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-[14px] tracking-tight text-white leading-tight truncate">
                  内部事務代行
                </h1>
                <p className="text-[10px] text-white/85 truncate">Hệ thống quản lý nội bộ</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0 ml-1"
              title="Thu gọn menu vào phía trong"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        )}

        {/* Navigation Groups */}
        <div className={`flex-1 overflow-y-auto ${isSidebarCollapsed ? 'px-2 py-3 space-y-4' : 'px-3 py-4 space-y-6'}`}>
          {navItems.map((group, gIdx) => (
            <div key={group.group}>
              {!isSidebarCollapsed ? (
                <div className="px-3 mb-2 text-[11px] font-bold text-[#24487c] tracking-wider uppercase flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7c9cd0]" />
                  <span className="truncate">{group.group}</span>
                </div>
              ) : (
                gIdx > 0 && <div className="border-t border-[#F0F0EE] my-2 mx-1" />
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center ${
                        isSidebarCollapsed
                          ? 'justify-center p-2.5'
                          : 'space-x-3 px-3 py-2.5 text-left'
                      } rounded-lg text-[13px] transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-[#7c9cd0] text-white font-semibold shadow-xs'
                          : 'text-[#4A4A46] hover:bg-[#7c9cd0]/10 hover:text-[#24487c]'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={isActive ? 'text-white' : 'text-[#8A8A85]'}
                      />
                      {!isSidebarCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-2xs" />
                          )}
                        </>
                      )}
                      {isSidebarCollapsed && isActive && (
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-2xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Monthly KPI Badge Widget */}
        {!isSidebarCollapsed ? (
          <div className="p-4 mx-3 mb-3 bg-[#7c9cd0]/10 rounded-lg border border-[#7c9cd0]/30 shadow-2xs shrink-0">
            <div className="flex items-center justify-between text-xs text-[#24487c] mb-1">
              <span className="font-bold text-[#24487c]">KPI Tháng 03</span>
              <span className="text-[11px] text-[#5072a7] font-medium">Hạn 31/03</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-[#1C1C1A] tracking-tight">
                103.6%
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#7c9cd0] text-white shadow-2xs">
                Đạt Target
              </span>
            </div>
            <div className="w-full bg-[#c2d4ee] h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-[#7c9cd0] h-full rounded-full transition-all duration-300"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        ) : (
          <div
            title="KPI Tháng 03: 103.6% (Đạt Target) - Hạn 31/03"
            className="p-2 mx-2 mb-3 bg-[#7c9cd0]/10 rounded-lg border border-[#7c9cd0]/30 shadow-2xs flex flex-col items-center justify-center cursor-help shrink-0"
          >
            <span className="text-[10px] font-bold text-[#24487c] font-mono leading-none">
              103.6%
            </span>
            <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-[#7c9cd0] text-white mt-1 leading-none shadow-2xs">
              ✓ Đạt
            </span>
          </div>
        )}

        {/* User Account / Role switcher footer */}
        <div className="p-2.5 border-t border-[#F0F0EE] bg-white relative shrink-0">
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={isSidebarCollapsed ? `${currentUser?.full_name} (${currentUser?.role})` : undefined}
            className={`flex items-center ${
              isSidebarCollapsed ? 'justify-center p-1.5' : 'space-x-3 p-2'
            } rounded-md hover:bg-[#F6F6F4] cursor-pointer transition-colors`}
          >
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.full_name}
              className="w-8 h-8 rounded-full object-cover border border-[#E7E7E4] shrink-0"
            />
            {!isSidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1C1C1A] truncate">
                    {currentUser?.full_name}
                  </p>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-[#8A8A85] truncate">
                      {currentUser?.email}
                    </span>
                    <span className="text-[9px] uppercase font-semibold px-1 py-0.2 rounded bg-[#E7E7E4] text-[#4A4A46]">
                      {currentUser?.role}
                    </span>
                  </div>
                </div>
                <ChevronDown size={14} className="text-[#8A8A85] shrink-0" />
              </>
            )}
          </div>

          {/* Quick User Switcher Menu */}
          {showUserMenu && (
            <div
              className={`absolute bottom-16 ${
                isSidebarCollapsed ? 'left-14 w-60' : 'left-3 right-3'
              } bg-white border border-[#E7E7E4] rounded-lg shadow-lg p-2 z-50`}
            >
              <div className="px-2 py-1 text-[11px] font-semibold text-[#8A8A85] border-b border-[#F0F0EE] mb-1">
                CHUYỂN VAI TRÒ TEST (GOOGLE SSO)
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between ${
                      currentUser.id === u.id
                        ? 'bg-[#F0F0EE] font-semibold text-[#1C1C1A]'
                        : 'hover:bg-[#F6F6F4] text-[#4A4A46]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-[#1C1C1A] truncate">{u.full_name}</div>
                      <div className="text-[10px] text-[#8A8A85]">{u.email}</div>
                    </div>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-[#F0F0EE] uppercase font-mono text-[#4A4A46]">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-[#F0F0EE] pt-1 mt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowSsoModal(true);
                  }}
                  className="w-full text-left px-2 py-1 rounded text-[11px] text-[#4A4A46] hover:bg-[#F6F6F4] flex items-center justify-between"
                >
                  <span>Cấu hình Google SSO Domain</span>
                  <ExternalLink size={12} className="text-[#8A8A85]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Minimalist Header */}
        <header className="h-14 bg-white border-b border-[#E7E7E4] flex items-center justify-between px-6 select-none z-20 flex-shrink-0">
          <div className="flex items-center space-x-3 text-xs text-[#8A8A85]">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 -ml-2 mr-1 rounded-lg text-[#64748B] hover:text-[#1C1C1A] hover:bg-[#F0F0EE] transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Mở rộng menu điều hướng' : 'Thu gọn menu vào phía trong'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <span className="text-[#1C1C1A] font-semibold text-sm">
              {navItems.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label || 'DYM 内部事務代行'}
            </span>
            <span>/</span>
            <span>Nội bộ DYM Vietnam (@dymvietnam.net)</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Current Role Badge */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#8A8A85]">Phạm vi:</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#7c9cd0]/12 text-[#24487c] border border-[#7c9cd0]/30">
                {currentUser?.view_scope === 'all'
                  ? 'Toàn Bộ Phận (Admin)'
                  : currentUser?.view_scope === '2ka_all'
                  ? 'Toàn bộ 2課 (A / B / S)'
                  : currentUser?.view_scope === 'own_team'
                  ? 'Team Trực Thuộc'
                  : 'Chỉ định (Custom)'}
              </span>
            </div>
          </div>
        </header>

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Google SSO Information Modal */}
      {showSsoModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowSsoModal(false)}
        >
          <div
            className="bg-white border border-[#E7E7E4] rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EE]">
              <div className="flex items-center space-x-2">
                <Shield size={18} className="text-[#1C1C1A]" />
                <h3 className="font-bold text-sm text-[#1C1C1A]">Xác thực Google SSO (@dymvietnam.net)</h3>
              </div>
              <button
                onClick={() => setShowSsoModal(false)}
                className="text-[#8A8A85] hover:text-[#1C1C1A]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-[#4A4A46] leading-relaxed">
              <p>
                Hệ thống DYM 内部事務代行 v2 đã được thiết lập ràng buộc xác thực qua Google SSO với domain công ty:
              </p>
              <div className="p-3 bg-[#F6F6F4] rounded border border-[#E7E7E4] font-mono text-[11px] text-[#1C1C1A]">
                Domain hợp lệ: @dymvietnam.net
                <br />
                Tài khoản đang kết nối: {currentUser.email}
              </div>
              <p>
                Nhân sự đăng nhập lần đầu bằng Google email công ty sẽ tự động khớp theo bảng danh sách mã nhân viên. Quản trị viên và người dùng có thể sử dụng công cụ chuyển đổi tài khoản nhanh ở góc trái dưới thanh sidebar để kiểm thử vai trò Admin, Leader, Subleader hoặc Member.
              </p>
            </div>
            <div className="flex justify-end pt-3 border-t border-[#F0F0EE]">
              <button
                onClick={() => setShowSsoModal(false)}
                className="px-4 py-1.5 text-xs font-medium rounded bg-[#1C1C1A] text-white hover:bg-[#2B2B28] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
