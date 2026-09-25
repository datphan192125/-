import React, { useState } from 'react';
import {
  Settings,
  Calendar,
  Award,
  Sliders,
  History,
  RotateCcw,
  CheckCircle2,
  Save,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QuarterConfig, KpiThresholds, AwardCategory } from '../../types';

export const AdminConfigModule: React.FC = () => {
  const {
    quarterConfigs,
    updateQuarterConfig,
    kpiThresholds,
    updateKpiThresholds,
    awardCategories,
    auditLogs,
    resetAllSystemData,
    isAdmin,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'quarters' | 'awards' | 'thresholds' | 'audit'>('quarters');
  const [thresholdsForm, setThresholdsForm] = useState<KpiThresholds>({ ...kpiThresholds });

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    updateKpiThresholds(thresholdsForm);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">
            Cấu Hình Hệ Thống & Tiêu Chí Đánh Giá (Master Config)
          </h1>
          <p className="text-xs text-[#8A8A85] mt-1">
            Quản trị chu kỳ Quý, danh mục khen thưởng, ngưỡng % KPI và nhật ký kiểm toán (Audit Log)
          </p>
        </div>

        <div className="flex p-0.5 rounded-md bg-[#F0F0EE] border border-[#E7E7E4] text-xs">
          <button
            onClick={() => setActiveTab('quarters')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'quarters'
                ? 'bg-[#7c9cd0] text-white shadow-xs'
                : 'text-[#4A4A46] hover:text-[#1C1C1A]'
            }`}
          >
            Chu Kỳ Quý (Quarters)
          </button>
          <button
            onClick={() => setActiveTab('awards')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'awards'
                ? 'bg-[#7c9cd0] text-white shadow-xs'
                : 'text-[#4A4A46] hover:text-[#1C1C1A]'
            }`}
          >
            Danh Mục Khen Thưởng
          </button>
          <button
            onClick={() => setActiveTab('thresholds')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'thresholds'
                ? 'bg-[#7c9cd0] text-white shadow-xs'
                : 'text-[#4A4A46] hover:text-[#1C1C1A]'
            }`}
          >
            Ngưỡng Đánh Giá %
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'audit'
                ? 'bg-[#7c9cd0] text-white shadow-xs'
                : 'text-[#4A4A46] hover:text-[#1C1C1A]'
            }`}
          >
            Nhật Ký Thao Tác ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'quarters' && (
        <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#F0F0EE]">
            <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">
              Cấu Hình Các Quý Trong Năm 2026
            </h2>
            <p className="text-xs text-[#8A8A85] mt-0.5">
              Linh hoạt điều chỉnh phân bổ tháng vào từng quý theo năm tài chính công ty
            </p>
          </div>

          <div className="divide-y divide-[#F0F0EE]">
            {quarterConfigs.map((q) => (
              <div
                key={q.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAFAF9]"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-[#1C1C1A]">{q.name}</span>
                    <span className="text-xs text-[#4A4A46]">({q.label})</span>
                    {q.is_active && (
                      <span className="px-2 py-0.5 rounded bg-[#F0F4F0] text-[#6B8F71] text-[10px] font-bold uppercase">
                        Quý hiện tại
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#8A8A85] mt-1">
                    Thời gian: {q.start_date} đến {q.end_date} • Các tháng: Tháng{' '}
                    {q.months.join(', Tháng ')}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-[#8A8A85]">
                    Bảng Vàng: {q.is_published_awards ? 'Đã công bố' : 'Đang đóng'}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() =>
                        updateQuarterConfig({ ...q, is_active: !q.is_active })
                      }
                      className="px-3 py-1.5 rounded border border-[#E7E7E4] text-xs font-medium hover:bg-[#F0F0EE]"
                    >
                      {q.is_active ? 'Khóa kỳ' : 'Kích hoạt kỳ này'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'awards' && (
        <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#F0F0EE]">
            <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">
              Danh Mục Giải Thưởng Đang Áp Dụng
            </h2>
          </div>

          <div className="divide-y divide-[#F0F0EE]">
            {awardCategories.map((c) => (
              <div key={c.id} className="p-5 flex items-start space-x-4 hover:bg-[#FAFAF9]">
                <div className="p-2.5 rounded bg-[#F6F6F4] text-[#1C1C1A] border border-[#E7E7E4]">
                  <Award size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-[#1C1C1A]">{c.name}</h3>
                  <p className="text-xs text-[#4A4A46] mt-1 leading-relaxed">
                    {c.criteria_description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'thresholds' && (
        <div className="bg-white border border-[#E7E7E4] rounded-lg p-6 max-w-xl">
          <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider mb-1">
            Ngưỡng % Phân Loại Trạng Thái KPI
          </h2>
          <p className="text-xs text-[#8A8A85] mb-6">
            Hệ thống tự động gán nhãn Đạt / Vượt / Cần cải thiện dựa trên các ngưỡng này
          </p>

          <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#1C1C1A] block mb-1">
                Ngưỡng Vượt Chỉ Tiêu (% Exceeded)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={thresholdsForm.exceeded_rate}
                  onChange={(e) =>
                    setThresholdsForm({
                      ...thresholdsForm,
                      exceeded_rate: parseFloat(e.target.value) || 102,
                    })
                  }
                  className="bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A] w-32 font-bold"
                />
                <span className="text-xs text-[#8A8A85]">% trở lên tính là Vượt chỉ tiêu</span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#1C1C1A] block mb-1">
                Ngưỡng Đạt Target (% Achieved)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={thresholdsForm.achieved_rate}
                  onChange={(e) =>
                    setThresholdsForm({
                      ...thresholdsForm,
                      achieved_rate: parseFloat(e.target.value) || 100,
                    })
                  }
                  className="bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A] w-32 font-bold"
                />
                <span className="text-xs text-[#8A8A85]">% trở lên tính là Đạt Target</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0F0EE] flex items-center justify-between">
              <span className="text-[11px] text-[#8A8A85]">
                Dưới {thresholdsForm.achieved_rate}% sẽ tự động đánh dấu Cần Cải Thiện.
              </span>
              {isAdmin && (
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-4 py-2 bg-[#7c9cd0] hover:bg-[#6788be] text-white rounded font-semibold text-xs shadow-xs transition-colors"
                >
                  <Save size={13} />
                  <span>Lưu Ngưỡng Đánh Giá</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#F0F0EE]">
            <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">
              Nhật Ký Thao Tác Hệ Thống (Audit Trail)
            </h2>
            <p className="text-xs text-[#8A8A85] mt-0.5">
              Ghi lại mọi lần Import KPI Excel, xuất báo cáo, duyệt khen thưởng và thay đổi cấu hình
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF9] text-[#8A8A85] uppercase text-[10px] tracking-wider border-b border-[#E7E7E4]">
                <tr>
                  <th className="py-2.5 px-5">Thời Gian</th>
                  <th className="py-2.5 px-4">Người Thực Hiện</th>
                  <th className="py-2.5 px-4">Hành Động</th>
                  <th className="py-2.5 px-5">Chi Tiết Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EE]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAFAF9]">
                    <td className="py-3 px-5 text-[#8A8A85] font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1C1C1A]">{log.user_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#F0F0EE] font-mono text-[10px] text-[#4A4A46] uppercase font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-[#4A4A46]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Factory Reset Section (Admin Only) */}
      {isAdmin && (
        <div className="p-5 bg-white border border-[#E7E7E4] rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <RotateCcw size={16} className="text-[#8A8A85]" />
            <div>
              <span className="font-bold text-[#1C1C1A]">Khôi phục dữ liệu ban đầu</span>
              <p className="text-[#8A8A85] text-[11px]">
                Xoá các thay đổi tuỳ chỉnh và nạp lại toàn bộ dữ liệu mẫu chuẩn DYM 内部事務代行
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn nạp lại dữ liệu ban đầu không?')) {
                resetAllSystemData();
              }
            }}
            className="px-3 py-1.5 rounded border border-[#E7E7E4] text-xs text-[#B85D5D] hover:bg-[#FDF2F2] font-medium"
          >
            Reset Dữ Liệu
          </button>
        </div>
      )}
    </div>
  );
};
