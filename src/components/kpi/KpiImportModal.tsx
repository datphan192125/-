import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
  ArrowRight,
  Info,
  CheckSquare,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { excelService } from '../../services/storage';
import { KpiImportRow } from '../../types';
import {
  parseTaskFile,
  getSheetNamesFromTaskFile,
  TaskKpiPreviewRow,
  UnmatchedAssignee,
} from '../../services/kpiFromTasks';

interface KpiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'standard' | 'task';
}

export const KpiImportModal: React.FC<KpiImportModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'task',
}) => {
  const {
    users,
    teams,
    kpiRecords,
    bulkApplyImportedKpis,
    applyTaskKpi,
    downloadSampleTemplate,
    triggerToast,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab: 'standard' (nhập Excel cũ) | 'task' (cập nhật từ file task)
  const [importMode, setImportMode] = useState<'standard' | 'task'>(defaultMode);

  useEffect(() => {
    if (isOpen) {
      setImportMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [periodLabel, setPeriodLabel] = useState<string>('Tháng 03/2026');
  const [parsedRows, setParsedRows] = useState<KpiImportRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

  // Task-based state
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [targetMonth, setTargetMonth] = useState<number>(10);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  const [taskPreviewRows, setTaskPreviewRows] = useState<TaskKpiPreviewRow[]>([]);
  const [unmatchedAssignees, setUnmatchedAssignees] = useState<UnmatchedAssignee[]>([]);
  const [totalTasksProcessed, setTotalTasksProcessed] = useState<number>(0);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setParsedRows([]);
    setTaskPreviewRows([]);
    setUnmatchedAssignees([]);
    setAvailableSheets([]);
    setSelectedSheet('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);

    try {
      if (importMode === 'standard') {
        const rows = await excelService.parseKpiImportFile(file, users, teams, kpiRecords);
        setParsedRows(rows);
        setStep('preview');
      } else {
        // Mode 'task': Đọc danh sách sheet trước
        const sheets = await getSheetNamesFromTaskFile(file);
        setAvailableSheets(sheets);

        const initialResult = await parseTaskFile(file, users, kpiRecords);
        setSelectedSheet(initialResult.sheetName);
        setTargetMonth(initialResult.detectedMonth);
        setTargetYear(initialResult.detectedYear);
        setTaskPreviewRows(initialResult.rows);
        setUnmatchedAssignees(initialResult.unmatchedAssignees);
        setTotalTasksProcessed(initialResult.totalTasksProcessed);
        setStep('preview');
      }
    } catch (err: any) {
      console.error('Lỗi khi đọc file:', err);
      triggerToast('Lỗi Đọc File', err.message || 'Không thể đọc file. Vui lòng kiểm tra định dạng.');
    } finally {
      setIsLoading(false);
    }
  };

  // Khi người dùng thay đổi sheet hoặc tháng/năm ở màn hình xem trước
  const handleRecomputeTaskFile = async (newSheet?: string, newMonth?: number, newYear?: number) => {
    if (!selectedFile) return;
    setIsLoading(true);
    try {
      const res = await parseTaskFile(selectedFile, users, kpiRecords, {
        sheetName: newSheet || selectedSheet,
        month: newMonth || targetMonth,
        year: newYear || targetYear,
      });
      if (newSheet) setSelectedSheet(res.sheetName);
      if (newMonth) setTargetMonth(res.detectedMonth);
      if (newYear) setTargetYear(res.detectedYear);
      setTaskPreviewRows(res.rows);
      setUnmatchedAssignees(res.unmatchedAssignees);
      setTotalTasksProcessed(res.totalTasksProcessed);
    } catch (err: any) {
      console.error(err);
      triggerToast('Lỗi Tính Toán', err.message || 'Không thể tính toán dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedFile) return;
    setIsApplying(true);

    try {
      if (importMode === 'standard') {
        if (parsedRows.length === 0) return;
        await bulkApplyImportedKpis(parsedRows, selectedFile.name, periodLabel);
      } else {
        if (taskPreviewRows.length === 0) return;
        await applyTaskKpi(
          taskPreviewRows.map((r) => ({
            userId: r.userId,
            newAchieved: r.newAchieved,
            achievedFixed: r.achievedFixed,
            taskSingle: r.taskSingle,
            checkCount: r.checkCount,
          })),
          {
            year: targetYear,
            month: targetMonth,
            filename: selectedFile.name,
          }
        );
      }
      onClose();
      handleReset();
    } catch (err: any) {
      console.error(err);
      triggerToast('Lỗi Khi Áp Dụng', err.message || 'Đã xảy ra lỗi khi ghi dữ liệu.');
    } finally {
      setIsApplying(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const invalidCount = parsedRows.filter((r) => r.status === 'invalid').length;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E7E7E4] rounded-lg shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EE]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-[#7c9cd0]/15 text-[#24487c]">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1C1A]">
                {importMode === 'task'
                  ? 'Cập Nhật KPI Tự Động Từ File Task'
                  : 'Nhập KPI Hàng Loạt Từ File Excel (.xlsx)'}
              </h2>
              <p className="text-xs text-[#8A8A85]">
                {step === 'upload'
                  ? 'Tải lên file dữ liệu task hoặc bảng KPI để tự động xử lý'
                  : 'Kiểm tra đối chiếu số liệu và chênh lệch trước khi áp dụng vào hệ thống'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A8A85] hover:text-[#1C1C1A] p-1.5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        {step === 'upload' && (
          <div className="flex border-b border-[#F0F0EE] px-6 bg-[#FAFAF9]">
            <button
              type="button"
              onClick={() => {
                setImportMode('task');
                handleReset();
              }}
              className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
                importMode === 'task'
                  ? 'border-[#24487c] text-[#24487c]'
                  : 'border-transparent text-[#8A8A85] hover:text-[#1C1C1A]'
              }`}
            >
              <Sparkles size={14} className="text-[#24487c]" />
              <span>Cập nhật tự động từ file task (Khuyên dùng)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setImportMode('standard');
                handleReset();
              }}
              className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
                importMode === 'standard'
                  ? 'border-[#24487c] text-[#24487c]'
                  : 'border-transparent text-[#8A8A85] hover:text-[#1C1C1A]'
              }`}
            >
              <FileSpreadsheet size={14} />
              <span>Nhập bảng KPI mẫu Excel cũ</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' ? (
            <div className="space-y-6">
              {importMode === 'standard' ? (
                <>
                  {/* Period selection */}
                  <div className="bg-[#F6F6F4] p-4 rounded-lg border border-[#E7E7E4] flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-[#1C1C1A] block">
                        Kỳ Áp Dụng Dữ Liệu
                      </label>
                      <p className="text-[11px] text-[#8A8A85]">
                        Chọn tháng hoặc quý áp dụng cho các bản ghi được nhập
                      </p>
                    </div>
                    <select
                      value={periodLabel}
                      onChange={(e) => setPeriodLabel(e.target.value)}
                      className="bg-white border border-[#E7E7E4] text-xs rounded-md px-3 py-1.5 text-[#1C1C1A] font-medium outline-hidden"
                    >
                      <option value="Tháng 03/2026">Tháng 03/2026</option>
                      <option value="Tháng 02/2026">Tháng 02/2026</option>
                      <option value="Tháng 01/2026">Tháng 01/2026</option>
                      <option value="Quý 1/2026">Quý 1/2026</option>
                      <option value="Quý 2/2026">Quý 2/2026</option>
                    </select>
                  </div>

                  {/* Upload Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E7E7E4] hover:border-[#7c9cd0] hover:bg-[#7c9cd0]/5 rounded-xl p-10 text-center cursor-pointer transition-colors bg-[#FAFAF9] group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white border border-[#E7E7E4] group-hover:border-[#7c9cd0] group-hover:text-[#7c9cd0] flex items-center justify-center text-[#4A4A46] transition-colors shadow-xs">
                      <Upload size={22} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#1C1C1A] group-hover:text-[#24487c] transition-colors">
                      Nhấp để tải file Excel lên (.xlsx)
                    </h3>
                    <p className="text-xs text-[#8A8A85] mt-1">
                      Hỗ trợ định dạng Microsoft Excel chuẩn (.xlsx)
                    </p>
                  </div>

                  {/* Instructions & Template Download */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#E7E7E4]">
                    <div className="flex items-start space-x-3">
                      <Info size={18} className="text-[#7c9cd0] mt-0.5" />
                      <div className="text-xs text-[#4A4A46]">
                        <span className="font-semibold text-[#1C1C1A]">Cần file mẫu chuẩn?</span>
                        <p className="text-[11px] text-[#8A8A85] mt-0.5">
                          Cột bắt buộc: Mã NV | Họ Tên | Team | Kỳ | Target | Achieved | Miss | Late
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={downloadSampleTemplate}
                      className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded bg-[#7c9cd0]/12 hover:bg-[#7c9cd0]/20 border border-[#7c9cd0]/30 text-[#24487c] transition-colors cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Tải File Mẫu (.xlsx)</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Task File Upload Mode */
                <div className="space-y-4">
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-4 rounded-xl text-xs text-[#1E3A8A] space-y-1.5">
                    <div className="font-bold flex items-center space-x-2 text-[#1E40AF]">
                      <Sparkles size={16} />
                      <span>Tính năng tự động tính Achieved theo file xuất dữ liệu Task</span>
                    </div>
                    <p className="leading-relaxed">
                      Hệ thống tự động tìm các cột: <strong>PROJECT, TAG, TEAM, STATUS, SUBTASK CONTENT, ASSIGNEE, ACTUAL TIME, SUBSTATUS, DEADLINE DAY</strong>.
                      Tự nhận diện tháng, lọc bỏ task skipped, tự động quy đổi dòng Check (chia 20 cho 1課, chia 60 cho các team khác) và áp dụng đúng bộ lọc đề án riêng cho từng nhân sự.
                    </p>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] hover:bg-[#EFF6FF]/40 rounded-xl p-10 text-center cursor-pointer transition-colors bg-[#FAFAF9] group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white border border-[#CBD5E1] group-hover:border-[#2563EB] group-hover:text-[#2563EB] flex items-center justify-center text-[#4A4A46] transition-colors shadow-xs">
                      <Upload size={22} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#1C1C1A] group-hover:text-[#1E40AF] transition-colors">
                      Nhấp để tải file xuất dữ liệu task (.xlsx hoặc .csv)
                    </h3>
                    <p className="text-xs text-[#8A8A85] mt-1">
                      Hỗ trợ file nặng lên đến 15MB, tự động tối ưu hóa đọc sheet mà không treo trình duyệt
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : importMode === 'task' ? (
            /* Task Preview */
            <div className="space-y-4">
              {/* Task Config bar */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] block mb-1">
                      Sheet đang đọc:
                    </label>
                    {availableSheets.length > 1 ? (
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleRecomputeTaskFile(e.target.value)}
                        className="bg-white border border-[#CBD5E1] rounded px-2.5 py-1 text-xs font-semibold text-[#1E293B]"
                      >
                        {availableSheets.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-semibold text-[#1E293B] bg-white px-2.5 py-1 rounded border border-[#CBD5E1]">
                        {selectedSheet}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] block mb-1">
                      Tháng áp dụng:
                    </label>
                    <select
                      value={targetMonth}
                      onChange={(e) =>
                        handleRecomputeTaskFile(undefined, parseInt(e.target.value, 10))
                      }
                      className="bg-white border border-[#CBD5E1] rounded px-2.5 py-1 text-xs font-semibold text-[#1E293B]"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          Tháng {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] block mb-1">Năm:</label>
                    <input
                      type="number"
                      value={targetYear}
                      onChange={(e) =>
                        handleRecomputeTaskFile(undefined, undefined, parseInt(e.target.value, 10))
                      }
                      className="bg-white border border-[#CBD5E1] rounded px-2 py-1 text-xs font-semibold text-[#1E293B] w-20"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-[#64748B]">
                    Tổng task xử lý: <strong className="text-[#0F172A]">{totalTasksProcessed}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-[#2563EB] hover:underline"
                  >
                    Chọn file khác
                  </button>
                </div>
              </div>

              {/* Warning about unmatched assignees */}
              {unmatchedAssignees.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1 text-amber-800">
                    <AlertTriangle size={14} />
                    <span>
                      Không tìm thấy trong hệ thống ({unmatchedAssignees.length} nhân sự - vẫn tiếp tục bình thường):
                    </span>
                  </div>
                  <div className="max-h-24 overflow-y-auto text-[11px] space-y-0.5 text-amber-800/90 pl-5">
                    {unmatchedAssignees.map((u, idx) => (
                      <div key={idx}>
                        • <strong>{u.rawName}</strong> ({u.taskCount} task)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diff Preview Table for Task Mode */}
              <div className="border border-[#E7E7E4] rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-[#64748B] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Mã NV</th>
                        <th className="py-2.5 px-3">Họ Tên Nhân Sự</th>
                        <th className="py-2.5 px-2 text-right">Task Đơn</th>
                        <th className="py-2.5 px-2 text-right">Check (Quy đổi)</th>
                        {taskPreviewRows.some((r) => r.achievedFixed > 0) && (
                          <th className="py-2.5 px-2 text-right">Cố định/Giờ</th>
                        )}
                        <th className="py-2.5 px-3 text-right">Achieved Cũ → Mới</th>
                        <th className="py-2.5 px-3 text-right">Chênh Lệch</th>
                        <th className="py-2.5 px-3">Ghi Chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {taskPreviewRows.map((row) => (
                        <tr key={row.userId} className="hover:bg-[#F8FAFC]">
                          <td className="py-2 px-3 font-mono font-medium text-[#1E293B]">
                            {row.employeeCode}
                          </td>
                          <td className="py-2 px-3 font-medium text-[#0F172A]">{row.userName}</td>
                          <td className="py-2 px-2 text-right font-mono text-[#475569]">
                            {row.taskSingle}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-[#475569]">
                            {row.checkCount}
                          </td>
                          {taskPreviewRows.some((r) => r.achievedFixed > 0) && (
                            <td className="py-2 px-2 text-right font-mono text-purple-700">
                              {row.achievedFixed > 0 ? row.achievedFixed : '—'}
                            </td>
                          )}
                          <td className="py-2 px-3 text-right font-mono">
                            <span className="text-[#94A3B8]">{row.oldAchieved}</span>
                            <span className="mx-1 text-[#94A3B8]">→</span>
                            <span className="font-bold text-[#0F172A]">{row.newAchieved}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {row.difference > 0 ? (
                              <span className="text-emerald-600 font-semibold">
                                +{row.difference}
                              </span>
                            ) : row.difference < 0 ? (
                              <span className="text-rose-600 font-semibold">{row.difference}</span>
                            ) : (
                              <span className="text-[#94A3B8]">0</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            {row.warning ? (
                              <span className="text-amber-600">{row.warning}</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">Hợp lệ</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Excel Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#F0F0EE]">
                <div className="flex items-center space-x-4">
                  <span className="text-[#8A8A85]">
                    File: <strong className="text-[#1C1C1A]">{selectedFile?.name}</strong>
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#F0F4F0] text-[#6B8F71] font-medium">
                    <CheckCircle2 size={13} />
                    <span>{validCount} dòng hợp lệ</span>
                  </span>
                  {invalidCount > 0 && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#FDF2F2] text-[#B85D5D] font-medium">
                      <AlertTriangle size={13} />
                      <span>{invalidCount} dòng lỗi (bị bỏ qua)</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-[#8A8A85] hover:text-[#1C1C1A] underline cursor-pointer"
                >
                  Chọn file khác
                </button>
              </div>

              <div className="border border-[#E7E7E4] rounded-md overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F6F6F4] text-[#8A8A85] uppercase text-[10px] tracking-wider border-b border-[#E7E7E4] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Dòng</th>
                        <th className="py-2.5 px-3">Mã NV</th>
                        <th className="py-2.5 px-3">Họ Tên</th>
                        <th className="py-2.5 px-3 text-right">Target Cũ → Mới</th>
                        <th className="py-2.5 px-3 text-right">Đạt Cũ → Mới</th>
                        <th className="py-2.5 px-3 text-center">Miss</th>
                        <th className="py-2.5 px-3 text-center">Late</th>
                        <th className="py-2.5 px-3">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0EE]">
                      {parsedRows.map((row) => {
                        const oldTarget = row.existing_record?.target ?? '—';
                        const oldAchieved = row.existing_record?.achieved ?? '—';
                        const isChanged = oldTarget !== row.target || oldAchieved !== row.achieved;

                        return (
                          <tr
                            key={row.row_number}
                            className={`hover:bg-[#FAFAF9] ${
                              row.status === 'invalid' ? 'bg-[#FFF8F8]' : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-[#8A8A85]">{row.row_number}</td>
                            <td className="py-2 px-3 font-mono font-medium text-[#1C1C1A]">
                              {row.employee_code}
                            </td>
                            <td className="py-2 px-3 text-[#4A4A46]">{row.full_name}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className="text-[#8A8A85]">{oldTarget}</span>
                              <span className="mx-1.5 text-[#8A8A85]">→</span>
                              <span className="font-semibold text-[#1C1C1A]">{row.target}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className="text-[#8A8A85]">{oldAchieved}</span>
                              <span className="mx-1.5 text-[#8A8A85]">→</span>
                              <span className="font-semibold text-[#1C1C1A]">{row.achieved}</span>
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[#4A4A46]">
                              {row.miss_count}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[#4A4A46]">
                              {row.late_count}
                            </td>
                            <td className="py-2 px-3">
                              {row.status === 'valid' ? (
                                <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-[#F0F4F0] text-[#6B8F71] font-medium">
                                  Hợp lệ {isChanged && '(Cập nhật)'}
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-[#FDF2F2] text-[#B85D5D] font-medium"
                                  title={row.error_message}
                                >
                                  {row.error_message}
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
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-[#F0F0EE] bg-[#FAFAF9]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded border border-[#E7E7E4] bg-white text-[#4A4A46] hover:bg-[#F6F6F4] transition-colors cursor-pointer"
          >
            Huỷ bỏ
          </button>
          {step === 'preview' && (
            <button
              type="button"
              disabled={
                (importMode === 'standard' && validCount === 0) ||
                (importMode === 'task' && taskPreviewRows.length === 0) ||
                isApplying
              }
              onClick={handleApply}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-semibold rounded bg-[#24487c] hover:bg-[#1a355d] text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>
                {isApplying
                  ? 'Đang áp dụng...'
                  : importMode === 'task'
                  ? `Áp dụng KPI cho ${taskPreviewRows.length} nhân sự`
                  : `Áp dụng ${validCount} bản ghi`}
              </span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
