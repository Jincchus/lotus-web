/** UTF-8 BOM + CSV 생성 후 브라우저 다운로드 */
export function downloadCsv(filename: string, rows: string[][]): void {
  const BOM = '﻿';
  const csv =
    BOM +
    rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
