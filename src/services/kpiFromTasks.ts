import * as XLSX from 'xlsx';
import { User, KpiRecord } from '../types';
import { SPECIAL_GROUPS, COUNT_FIXED_LINES_IN_ACHIEVED, USER_RULE_ASSIGNMENTS } from '../config/kpiRules';

// Chuẩn hóa tên: bỏ dấu tiếng Việt (NFD, đ->d), in hoa, gộp khoảng trắng, trim
export const normalizeName = (name: string): string => {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
};

export interface TaskRow {
  project: string;
  tag: string;
  team: string;
  status: string;
  subtaskContent: string;
  assignee: string;
  actualTime: number;
  substatus: string;
  deadlineDay: any;
}

export interface TaskKpiPreviewRow {
  userId: string;
  userName: string;
  employeeCode: string;
  teamName: string;
  oldAchieved: number;
  newAchieved: number;
  difference: number;
  taskSingle: number;
  checkCount: number;
  achievedFixed: number;
  warning?: string;
  hasExistingKpi: boolean;
}

export interface UnmatchedAssignee {
  rawName: string;
  normalizedName: string;
  taskCount: number;
}

export interface ParseTaskResult {
  sheetName: string;
  availableSheets: string[];
  detectedMonth: number;
  detectedYear: number;
  rows: TaskKpiPreviewRow[];
  unmatchedAssignees: UnmatchedAssignee[];
  totalTasksProcessed: number;
}

// Chuyển đổi giá trị DEADLINE DAY sang tháng (1-12)
const extractMonthFromDeadline = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;

  // Nếu là số serial Excel (ví dụ 45566 cho tháng 10/2024)
  if (typeof val === 'number') {
    const parsedDate = XLSX.SSF.parse_date_code(val);
    if (parsedDate && parsedDate.m >= 1 && parsedDate.m <= 12) {
      return parsedDate.m;
    }
  }

  const str = String(val).trim();
  // Nếu là date string dạng YYYY-MM-DD hoặc YYYY/MM/DD hoặc DD/MM/YYYY
  const matchIso = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (matchIso) {
    const m = parseInt(matchIso[2], 10);
    if (m >= 1 && m <= 12) return m;
  }
  const matchSlash = str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (matchSlash) {
    const m = parseInt(matchSlash[2], 10);
    if (m >= 1 && m <= 12) return m;
  }

  // Parse Date thường
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.getMonth() + 1;
  }

  return null;
};

// Trích xuất tháng từ tên sheet (ví dụ: "10月" -> 10, "Tháng 10" -> 10)
const extractMonthFromSheetName = (sheetName: string): number | null => {
  const match = sheetName.match(/(\d{1,2})\s*月/) || sheetName.match(/(?:tháng|t)\s*(\d{1,2})/i);
  if (match) {
    const m = parseInt(match[1], 10);
    if (m >= 1 && m <= 12) return m;
  }
  return null;
};

export const getSheetNamesFromTaskFile = async (file: File): Promise<string[]> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { bookSheets: true });
  return wb.SheetNames || [];
};

export const parseTaskFile = async (
  file: File,
  users: User[],
  existingRecords: KpiRecord[],
  options?: { sheetName?: string; year?: number; month?: number }
): Promise<ParseTaskResult> => {
  const buf = await file.arrayBuffer();

  // 1. Đọc nhanh danh sách sheets
  const metaWb = XLSX.read(buf, { bookSheets: true });
  const allSheetNames = metaWb.SheetNames || [];
  if (allSheetNames.length === 0) {
    throw new Error('File không chứa sheet nào.');
  }

  // Ưu tiên sheet đã chọn, hoặc sheet dạng "<số>月", hoặc sheet đầu tiên
  let targetSheet = options?.sheetName;
  if (!targetSheet) {
    const monthPatternSheet = allSheetNames.find((s) => /^\s*\d{1,2}\s*月\s*$/.test(s));
    targetSheet = monthPatternSheet || allSheetNames[0];
  }

  // 2. Chỉ đọc sheet được chọn để tiết kiệm bộ nhớ và tránh treo trình duyệt
  const wb = XLSX.read(buf, { sheets: [targetSheet], cellDates: false });
  const sheet = wb.Sheets[targetSheet];
  if (!sheet) {
    throw new Error(`Không tìm thấy sheet: ${targetSheet}`);
  }

  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rawData.length < 2) {
    throw new Error('Sheet không có dữ liệu.');
  }

  // 3. Tìm cột theo tiêu đề (dòng 0)
  const headerRow = (rawData[0] || []).map((h) => String(h || '').trim().toUpperCase());
  const colIndex = {
    project: headerRow.findIndex((h) => h === 'PROJECT'),
    tag: headerRow.findIndex((h) => h === 'TAG'),
    team: headerRow.findIndex((h) => h === 'TEAM'),
    status: headerRow.findIndex((h) => h === 'STATUS'),
    subtaskContent: headerRow.findIndex((h) => h === 'SUBTASK CONTENT'),
    assignee: headerRow.findIndex((h) => h === 'ASSIGNEE'),
    actualTime: headerRow.findIndex((h) => h === 'ACTUAL TIME'),
    substatus: headerRow.findIndex((h) => h === 'SUBSTATUS'),
    deadlineDay: headerRow.findIndex((h) => h === 'DEADLINE DAY'),
  };

  const missingCols = Object.entries(colIndex)
    .filter(([_, idx]) => idx === -1)
    .map(([key]) => key);

  if (missingCols.length > 0) {
    throw new Error(`Sheet "${targetSheet}" thiếu các cột bắt buộc: ${missingCols.join(', ')}`);
  }

  // Map người dùng theo tên đã chuẩn hóa
  const userMap = new Map<string, User>();
  users.forEach((u) => {
    userMap.set(normalizeName(u.full_name), u);
  });

  const monthCountMap: Record<number, number> = {};
  const tasksByNormalizedAssignee: Record<string, TaskRow[]> = {};
  const rawAssigneeNameMap: Record<string, string> = {};

  let totalTasksProcessed = 0;

  for (let r = 1; r < rawData.length; r++) {
    const row = rawData[r];
    if (!row || row.length === 0) continue;

    const status = String(row[colIndex.status] || '').trim();
    const substatus = String(row[colIndex.substatus] || '').trim();
    const rawAssignee = String(row[colIndex.assignee] || '').trim();

    if (!rawAssignee) continue;

    // Đếm tháng xuất hiện trong DEADLINE DAY
    const deadlineVal = row[colIndex.deadlineDay];
    const m = extractMonthFromDeadline(deadlineVal);
    if (m) {
      monthCountMap[m] = (monthCountMap[m] || 0) + 1;
    }

    // Kiểm tra điều kiện hoàn thành: STATUS = "done" và SUBSTATUS != "skipped"
    if (status.toLowerCase() !== 'done' || substatus.toLowerCase() === 'skipped') {
      continue;
    }

    const normAssignee = normalizeName(rawAssignee);
    if (!tasksByNormalizedAssignee[normAssignee]) {
      tasksByNormalizedAssignee[normAssignee] = [];
      rawAssigneeNameMap[normAssignee] = rawAssignee;
    }

    const rawActualTime = parseFloat(String(row[colIndex.actualTime] || '0').replace(/,/g, ''));

    tasksByNormalizedAssignee[normAssignee].push({
      project: String(row[colIndex.project] || '').trim(),
      tag: String(row[colIndex.tag] || '').trim(),
      team: String(row[colIndex.team] || '').trim(),
      status,
      subtaskContent: String(row[colIndex.subtaskContent] || '').trim(),
      assignee: rawAssignee,
      actualTime: isNaN(rawActualTime) ? 0 : rawActualTime,
      substatus,
      deadlineDay: deadlineVal,
    });

    totalTasksProcessed++;
  }

  // Xác định tháng/năm
  let detectedMonth = options?.month || 0;
  if (!detectedMonth) {
    let maxCount = 0;
    for (const [mStr, count] of Object.entries(monthCountMap)) {
      if (count > maxCount) {
        maxCount = count;
        detectedMonth = parseInt(mStr, 10);
      }
    }
  }
  if (!detectedMonth) {
    detectedMonth = extractMonthFromSheetName(targetSheet) || 10;
  }
  const detectedYear = options?.year || new Date().getFullYear();

  // 4. Tính toán cho từng nhân sự
  const previewRows: TaskKpiPreviewRow[] = [];
  const unmatchedAssignees: UnmatchedAssignee[] = [];

  for (const [normName, tasks] of Object.entries(tasksByNormalizedAssignee)) {
    const matchedUser = userMap.get(normName);
    if (!matchedUser) {
      unmatchedAssignees.push({
        rawName: rawAssigneeNameMap[normName],
        normalizedName: normName,
        taskCount: tasks.length,
      });
      continue;
    }

    // Lấy quy tắc cho nhân sự này (mặc định ['std'])
    const rules = USER_RULE_ASSIGNMENTS[normName] || ['std'];

    let totalSingle = 0;
    let totalCheck = 0;
    let totalFixed = 0;
    let totalAchieved = 0;

    // Tính riêng từng dòng KPI theo rules
    for (const rule of rules) {
      const isFixedLine = rule.startsWith('only:');

      // Lọc task đơn và check cho rule này
      const singleTasks = tasks.filter((t) => {
        if (t.subtaskContent === 'Check') return false;
        return matchesProjectFilter(t.project, t.tag, rule);
      });

      const checkTasks = tasks.filter((t) => {
        if (t.subtaskContent !== 'Check') return false;
        return matchesProjectFilter(t.project, t.tag, rule);
      });

      const singleCount = singleTasks.length;

      // Tính Check = Math.floor(tổng ACTUAL TIME / unit)
      let checkVal = 0;
      if (checkTasks.length > 0) {
        const firstTeam = checkTasks[0].team;
        const unit = firstTeam === '1課' ? 20 : 60;
        const totalActualTime = checkTasks.reduce((acc, cur) => acc + cur.actualTime, 0);
        checkVal = Math.floor(totalActualTime / unit);
      }

      const lineTotal = singleCount + checkVal;

      totalSingle += singleCount;
      totalCheck += checkVal;

      if (isFixedLine) {
        totalFixed += lineTotal;
        if (COUNT_FIXED_LINES_IN_ACHIEVED) {
          totalAchieved += lineTotal;
        }
      } else {
        totalAchieved += lineTotal;
      }
    }

    // Tìm KPI cũ trong existingRecords
    const existingKpi = existingRecords.find(
      (r) =>
        r.user_id === matchedUser.id &&
        (r.year === detectedYear || !r.year) &&
        r.month === detectedMonth
    );

    const oldAchieved = existingKpi?.achieved ?? 0;
    const hasExistingKpi = !!existingKpi;
    const warning = !hasExistingKpi
      ? 'Chưa có bản ghi KPI tháng này (sẽ tạo mới với Target = 0)'
      : existingKpi.target === 0
      ? 'Bản ghi hiện tại chưa có Target (= 0)'
      : undefined;

    previewRows.push({
      userId: matchedUser.id,
      userName: matchedUser.full_name,
      employeeCode: matchedUser.employee_code,
      teamName: matchedUser.team_id,
      oldAchieved,
      newAchieved: totalAchieved,
      difference: totalAchieved - oldAchieved,
      taskSingle: totalSingle,
      checkCount: totalCheck,
      achievedFixed: totalFixed,
      warning,
      hasExistingKpi,
    });
  }

  // Sắp xếp theo tên nhân sự
  previewRows.sort((a, b) => a.userName.localeCompare(b.userName));
  unmatchedAssignees.sort((a, b) => b.taskCount - a.taskCount);

  return {
    sheetName: targetSheet,
    availableSheets: allSheetNames,
    detectedMonth,
    detectedYear,
    rows: previewRows,
    unmatchedAssignees,
    totalTasksProcessed,
  };
};

// Bộ lọc project theo quy tắc
function matchesProjectFilter(project: string, tag: string, rule: string): boolean {
  if (rule === 'std') {
    // task đơn: TAG ≠ "その他" HOẶC PROJECT = "【ラボ型】スポーツ庁" HOẶC (PROJECT = "【事務代行】HRTECH" VÀ TAG = "その他")
    // check: TAG ≠ "その他" HOẶC PROJECT = "【ラボ型】スポーツ庁"
    // Gộp chung: pass nếu tag !== 'その他' || project === '【ラボ型】スポーツ庁' || project === '【事務代行】HRTECH'
    return tag !== 'その他' || project === '【ラボ型】スポーツ庁' || project === '【事務代行】HRTECH';
  }

  if (rule.startsWith('excl:')) {
    const groupName = rule.replace('excl:', '');
    const groupProjects = SPECIAL_GROUPS[groupName] || [];
    if (groupProjects.includes(project)) {
      return false;
    }
    return tag !== 'その他' || project === '【ラボ型】スポーツ庁' || project === '【事務代行】HRTECH';
  }

  if (rule.startsWith('only:')) {
    const groupName = rule.replace('only:', '');
    const groupProjects = SPECIAL_GROUPS[groupName] || [];
    return groupProjects.includes(project);
  }

  return true;
}
