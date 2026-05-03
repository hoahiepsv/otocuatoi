import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | string): string {
  const val = typeof num === 'string' ? parseFloat(num.replace(/\./g, '')) : num;
  if (isNaN(val)) return '0';
  return val.toLocaleString('vi-VN').replace(/,/g, '.');
}

export function parseFormattedNumber(str: string): number {
  return parseFloat(str.replace(/\./g, '').replace(/,/g, '')) || 0;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  
  let cleanStr = dateStr;
  
  // Handle full ISO strings (from Apps Script/JSON)
  if (dateStr.includes('T') || (dateStr.includes('Z') && !dateStr.includes('-'))) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
      }
    } catch (e) {
      // Fallback if Date parsing fails
    }
  }

  // Check if it's already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Clean potential time part if any remains
  cleanStr = dateStr.split('T')[0];

  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const parts = cleanStr.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  // Handle DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanStr)) {
    const parts = cleanStr.split('/');
    return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
  }
  
  return cleanStr;
}

export function getTodayDateInput(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateForInput(displayDate: string): string {
  if (!displayDate) return '';
  
  // DD-MM-YYYY -> YYYY-MM-DD
  if (displayDate.includes('-')) {
    const parts = displayDate.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    // Already YYYY-MM-DD
    if (parts.length === 3 && parts[0].length === 4) {
      return displayDate;
    }
  }

  // DD/MM/YYYY -> YYYY-MM-DD
  if (displayDate.includes('/')) {
    const parts = displayDate.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  return displayDate;
}

export function toSortableDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // If DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    return `${parts[2]}${parts[1]}${parts[0]}`;
  }

  // If DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}${parts[1].padStart(2, '0')}${parts[0].padStart(2, '0')}`;
    }
  }
  
  // If YYYY-MM-DD
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[0]}${parts[1].padStart(2, '0')}${parts[2].padStart(2, '0')}`;
    }
  }
  
  return dateStr;
}
