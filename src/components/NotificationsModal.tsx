import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  AlertCircle,
  Clock,
  CreditCard,
  CheckCircle2,
  BellRing,
  Volume2,
  Calendar,
  Building2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { LoanNotification } from '../types';
import { formatCurrency, formatThaiDate } from '../lib/loanUtils';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: LoanNotification[];
  onPayInstallment: (contractId: string, installmentIndex: number) => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onPayInstallment
}: NotificationsModalProps) {
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_tomorrow'>('all');
  const [browserPerm, setBrowserPerm] = useState<string>('default');

  // Check browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPerm(Notification.permission);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPerm(perm);
        if (perm === 'granted') {
          new Notification('ระบบแจ้งเตือนผ่อนบ้าน Best & Koy', {
            body: 'เปิดการแจ้งเตือนบนอุปกรณ์นี้เรียบร้อยแล้ว!',
            icon: '/favicon.ico'
          });
        }
      } catch (err) {
        console.error('Notification permission error', err);
      }
    }
  };

  const overdueItems = notifications.filter(n => n.type === 'overdue');
  const dueTomorrowItems = notifications.filter(n => n.type === 'due_tomorrow');

  const filteredItems = notifications.filter(n => {
    if (filter === 'overdue') return n.type === 'overdue';
    if (filter === 'due_tomorrow') return n.type === 'due_tomorrow';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#fbfbfa] border border-[#c0b298] shadow-2xl rounded-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#c0b298]/80 bg-[#f5f4ed] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#7d6840] text-white">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#4a3e26] font-serif">
                ศูนย์การแจ้งเตือนค่างวดบ้าน
              </h3>
              <p className="text-[11px] text-[#70644e]">
                ตรวจสอบงวดค้างชำระและงวดที่ครบกำหนดผ่อนชำระ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#70644e] hover:text-[#4a3e26] hover:bg-[#e8ebe0] rounded-xl transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Browser Notification Status Bar */}
          <div className="bg-[#f2f4ec] border border-[#d6dcbe] p-3 sm:p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-700 text-white shrink-0 mt-0.5 sm:mt-0">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[#4a3e26] flex items-center gap-1.5 flex-wrap">
                  <span>การแจ้งเตือนบนเบราว์เซอร์:</span>
                  {browserPerm === 'granted' ? (
                    <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      เปิดใช้งานแล้ว
                    </span>
                  ) : browserPerm === 'denied' ? (
                    <span className="text-rose-700 font-semibold">ถูกปิดกั้นในเบราว์เซอร์</span>
                  ) : (
                    <span className="text-[#70644e]">ยังไม่ได้เปิดใช้งาน</span>
                  )}
                </div>
                <p className="text-[11px] text-[#70644e] mt-0.5">
                  รับการเตือนเมื่อใกล้ถึงวันครบกำหนดเพื่อไม่พลาดการชำระ
                </p>
              </div>
            </div>

            {browserPerm !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#7d6840] hover:bg-[#685533] text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>เปิดแจ้งเตือนบนเครื่อง</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 border-b border-[#e6e4d5] pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-[#7d6840] text-white shadow-2xs'
                  : 'bg-[#f4f3ea] text-[#70644e] hover:bg-[#e8ebe0]'
              }`}
            >
              ทั้งหมด ({notifications.length})
            </button>

            <button
              onClick={() => setFilter('overdue')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filter === 'overdue'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>⚠️ งวดค้างชำระ ({overdueItems.length})</span>
            </button>

            <button
              onClick={() => setFilter('due_tomorrow')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filter === 'due_tomorrow'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>🕒 เตือนล่วงหน้า 1 วัน ({dueTomorrowItems.length})</span>
            </button>
          </div>

          {/* Notification List */}
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-[#f5f4ed] rounded-xl border border-dashed border-[#c0b298] space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#4a3e26]">
                {filter === 'overdue'
                  ? 'ไม่มีงวดค้างชำระ'
                  : filter === 'due_tomorrow'
                  ? 'ไม่มีงวดที่ครบกำหนดพรุ่งนี้'
                  : 'ยอดเยี่ยม! ไม่มีงวดค้างชำระหรือครบกำหนดในเร็วๆ นี้'}
              </h4>
              <p className="text-xs text-[#70644e] max-w-sm mx-auto">
                {filter === 'all'
                  ? 'คุณชำระค่างวดบ้านครบถ้วนตามกำหนดเรียบร้อยทุกสัญญา'
                  : 'รายการผ่อนชำระในตัวกรองนี้เป็นปัจจุบันทั้งหมด'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const isOverdue = item.type === 'overdue';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs ${
                      isOverdue
                        ? 'bg-rose-50/80 border-rose-200 hover:border-rose-400'
                        : 'bg-amber-50/80 border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{item.daysDiff === 0 ? 'ครบกำหนดวันนี้ (ยังไม่ชำระ)' : `ค้างชำระ ${item.daysDiff} วัน`}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-600 text-white shadow-2xs">
                            <Clock className="w-3 h-3" />
                            <span>เตือนล่วงหน้า 1 วัน / ครบกำหนดพรุ่งนี้</span>
                          </span>
                        )}

                        <span className="text-xs font-bold text-[#4a3e26] flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#7d6840]" />
                          {item.contractNickname} ({item.bankName})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#70644e] flex-wrap pt-0.5">
                        <span className="font-semibold text-[#4a3e26]">
                          งวดที่ {item.installmentIndex}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#7d6840]" />
                          กำหนดชำระ: {formatThaiDate(item.dueDate)}
                        </span>
                        <span>·</span>
                        <span className="font-bold text-rose-900 text-sm">
                          ยอด {formatCurrency(item.amount)} บาท
                        </span>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <div className="self-end sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          onClose();
                          onPayInstallment(item.contractId, item.installmentIndex);
                        }}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer ${
                          isOverdue
                            ? 'bg-rose-700 hover:bg-rose-800 text-white'
                            : 'bg-amber-700 hover:bg-amber-800 text-white'
                        }`}
                        title="เปิดแบบฟอร์มเพื่อบันทึกการชำระเงิน"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>บันทึกชำระงวดนี้</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tips footer */}
          <div className="p-3 bg-[#f5f4ed] rounded-xl border border-[#c0b298]/60 text-[11px] text-[#70644e] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#7d6840] shrink-0 mt-0.5" />
            <p>
              ระบบคำนวณวันครบกำหนดตามรอบดิวของแต่ละสัญญาอัตโนมัติ เมื่อคุณกด <strong>"บันทึกชำระงวดนี้"</strong> ระบบจะเลือกสัญญาและลำดับงวดที่ต้องจ่ายให้อัตโนมัติทันที
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#f5f4ed] border-t border-[#c0b298]/80 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#7d6840] hover:bg-[#685533] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
