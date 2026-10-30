import React from 'react';
import { AlertCircle, Clock, Bell, CreditCard, ChevronRight } from 'lucide-react';
import { LoanNotification } from '../types';
import { formatCurrency, formatThaiDate } from '../lib/loanUtils';

interface NotificationBannerProps {
  notifications: LoanNotification[];
  onOpenNotifications: () => void;
  onPayInstallment: (contractId: string, installmentIndex: number) => void;
}

export default function NotificationBanner({
  notifications,
  onOpenNotifications,
  onPayInstallment
}: NotificationBannerProps) {
  if (!notifications || notifications.length === 0) return null;

  // The most urgent notification is the first one (sorted: overdue first with largest days, then tomorrow)
  const urgent = notifications[0];
  const totalCount = notifications.length;
  const overdueCount = notifications.filter(n => n.type === 'overdue').length;

  const isOverdue = urgent.type === 'overdue';

  return (
    <div
      className={`w-full p-3 sm:p-3.5 rounded-2xl border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
        isOverdue
          ? 'bg-rose-50/95 border-rose-300 text-rose-950'
          : 'bg-amber-50/95 border-amber-300 text-amber-950'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Icon & Alert Message */}
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              isOverdue ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
            }`}
          >
            {isOverdue ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </div>

          <div className="min-w-0 text-xs sm:text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isOverdue
                    ? 'bg-rose-200 text-rose-900 border border-rose-300'
                    : 'bg-amber-200 text-amber-900 border border-amber-300'
                }`}
              >
                {isOverdue
                  ? (urgent.daysDiff === 0 ? 'ครบกำหนดวันนี้ (ยังไม่ชำระ)' : `ค้างชำระ ${urgent.daysDiff} วัน`)
                  : 'เตือนล่วงหน้า 1 วัน / ครบกำหนดพรุ่งนี้'}
              </span>

              {totalCount > 1 && (
                <span className="text-[11px] font-semibold text-[#70644e] bg-white/70 px-2 py-0.5 rounded-md border border-[#c0b298]/40">
                  มีทั้งหมด {totalCount} รายการ{overdueCount > 0 ? ` (ค้าง ${overdueCount})` : ''}
                </span>
              )}
            </div>

            <div className="mt-1 font-medium text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[#4a3e26]">
                {urgent.contractNickname} ({urgent.bankName})
              </span>
              <span className="text-[#70644e]">·</span>
              <span>งวดที่ {urgent.installmentIndex}</span>
              <span className="text-[#70644e]">·</span>
              <span>ครบกำหนด {formatThaiDate(urgent.dueDate)}</span>
              <span className="text-[#70644e]">·</span>
              <span className="font-bold text-rose-900">
                {formatCurrency(urgent.amount)} บาท
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto">
          {/* Quick Pay Button */}
          <button
            onClick={() => onPayInstallment(urgent.contractId, urgent.installmentIndex)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer ${
              isOverdue
                ? 'bg-rose-700 hover:bg-rose-800 text-white'
                : 'bg-amber-700 hover:bg-amber-800 text-white'
            }`}
            title={`เปิดแบบฟอร์มชำระงวดที่ ${urgent.installmentIndex}`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>ชำระงวดที่ {urgent.installmentIndex}</span>
          </button>

          {/* View All Notifications Modal Button */}
          <button
            onClick={onOpenNotifications}
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#f4f3ea] text-[#7d6840] border border-[#c0b298] transition-colors cursor-pointer shadow-2xs shrink-0"
            title="ดูรายการแจ้งเตือนทั้งหมด"
          >
            <Bell className="w-3.5 h-3.5 text-[#7d6840]" />
            <span>ดูทั้งหมด ({totalCount})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
