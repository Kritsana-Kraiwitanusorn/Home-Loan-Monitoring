import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  X,
  Plus,
  Pin,
  Search,
  Copy,
  Check,
  Trash2,
  Edit3,
  Phone,
  FileText,
  Calendar,
  Sparkles,
  Tag,
  Building,
  RotateCcw
} from 'lucide-react';
import { LoanContract, PersonalNote, NoteCategory, NoteColor } from '../types';
import { formatThaiDate } from '../lib/loanUtils';

interface PersonalNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: PersonalNote[];
  contracts: LoanContract[];
  onSaveNote: (note: Omit<PersonalNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, noteId?: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onTogglePin: (noteId: string, currentPinned: boolean) => Promise<void>;
}

const CATEGORY_LABELS: Record<NoteCategory, { label: string; icon: string }> = {
  general: { label: 'ทั่วไป', icon: '📝' },
  bank_contact: { label: 'ติดต่อธนาคาร', icon: '📞' },
  contract_doc: { label: 'เอกสารสัญญา', icon: '📂' },
  refinance_appointment: { label: 'นัดหมายรีไฟแนนซ์', icon: '🔄' },
  reminder: { label: 'เตือนความจำ', icon: '⏰' }
};

const COLOR_CONFIGS: Record<NoteColor, { label: string; bg: string; border: string; badge: string }> = {
  cream: {
    label: 'วินเทจครีม',
    bg: 'bg-[#fbfbfa]',
    border: 'border-[#c0b298]',
    badge: 'bg-[#ebdcb2]/60 text-[#4a3e26]'
  },
  yellow: {
    label: 'เหลือง',
    bg: 'bg-[#fef9c3]',
    border: 'border-[#facc15]',
    badge: 'bg-amber-200/80 text-amber-900'
  },
  green: {
    label: 'เขียว',
    bg: 'bg-[#ecfdf5]',
    border: 'border-[#a7f3d0]',
    badge: 'bg-emerald-200/80 text-emerald-900'
  },
  blue: {
    label: 'ฟ้า',
    bg: 'bg-[#eff6ff]',
    border: 'border-[#bfdbfe]',
    badge: 'bg-blue-200/80 text-blue-900'
  },
  purple: {
    label: 'ม่วง',
    bg: 'bg-[#f5f3ff]',
    border: 'border-[#ddd6fe]',
    badge: 'bg-purple-200/80 text-purple-900'
  },
  pink: {
    label: 'ชมพู',
    bg: 'bg-[#fdf2f8]',
    border: 'border-[#fbcfe8]',
    badge: 'bg-pink-200/80 text-pink-900'
  }
};

export default function PersonalNotesModal({
  isOpen,
  onClose,
  notes,
  contracts,
  onSaveNote,
  onDeleteNote,
  onTogglePin
}: PersonalNotesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | 'all'>('all');
  const [selectedContractFilter, setSelectedContractFilter] = useState<string>('all');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('general');
  const [contractId, setContractId] = useState<string>('');
  const [color, setColor] = useState<NoteColor>('cream');
  const [isPinned, setIsPinned] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Copied feedback toast
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // In-app deletion state (avoids window.confirm which is blocked in iframes)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showForm) {
          setShowForm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showForm, onClose]);

  if (!isOpen) return null;

  const handleOpenAddForm = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
    setCategory('general');
    setContractId('');
    setColor('cream');
    setIsPinned(false);
    setShowForm(true);
  };

  const handleEditNote = (note: PersonalNote) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setContractId(note.contractId || '');
    setColor(note.color);
    setIsPinned(note.isPinned);
    setShowForm(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setFormLoading(true);
    try {
      const notePayload: Omit<PersonalNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        content: content.trim(),
        category,
        color,
        isPinned
      };
      if (contractId.trim()) {
        notePayload.contractId = contractId.trim();
      }

      await onSaveNote(
        notePayload,
        editingNoteId || undefined
      );
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // Quick template builders
  const applyTemplate = (templateType: 'bank' | 'refinance' | 'docs') => {
    setShowForm(true);
    setEditingNoteId(null);

    if (templateType === 'bank') {
      setTitle('เบอร์ติดต่อฝ่ายสินเชื่อธนาคาร');
      setCategory('bank_contact');
      setColor('blue');
      setContent(
        `📞 คอลเซ็นเตอร์สินเชื่อบ้าน:\n- ธนาคารกรุงไทย: 02-111-1111\n- ธนาคารกสิกรไทย: 02-888-8888\n- ธนาคารไทยพาณิชย์: 02-777-7777\n- ธอส. (GH Bank): 02-645-9000\n\nเจ้าหน้าที่ผู้ดูแลสัญญา: คุณ............ โทร: ..........`
      );
    } else if (templateType === 'refinance') {
      setTitle('แผนเตรียมตัวรีไฟแนนซ์ / ขอลดดอกเบี้ย');
      setCategory('refinance_appointment');
      setColor('yellow');
      setContent(
        `📌 แผนงานลดดอกเบี้ยบ้าน:\n- วันที่ครบกำหนดสัญญา 3 ปี: ........\n- ยอดหนี้คงเหลือประมาณการ: ........ บาท\n- กลยุทธ์: ยื่น Retention ธนาคารเดิม vs ยื่น Refinance ธนาคารใหม่\n- เอกสารที่ต้องเตรียม: สลิปเงินเดือน 3-6 เดือน, Statement, ใบเสร็จค่างวดย้อนหลัง`
      );
    } else if (templateType === 'docs') {
      setTitle('สารบัญเอกสารสัญญาสินเชื่อบ้าน');
      setCategory('contract_doc');
      setColor('cream');
      setContent(
        `📂 เอกสารสำคัญที่จัดเก็บ:\n1. สำเนาสัญญากู้เงินและบันทึกต่อท้าย\n2. สัญญาจำนองที่ดินพร้อมสิ่งปลูกสร้าง\n3. สำเนาโฉนดที่ดินแปลงบ้าน\n4. กรมธรรม์ประกันอัคคีภัย/ประกัน MRTA\n\nสถานที่จัดเก็บ: แฟ้มเอกสารบ้านเลขที่ 222/101`
      );
    }
  };

  const handleCopyContent = (note: PersonalNote) => {
    const textToCopy = `${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNoteId(note.id);
    setTimeout(() => {
      setCopiedNoteId(null);
    }, 2000);
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    // Category filter
    if (selectedCategory !== 'all' && n.category !== selectedCategory) {
      return false;
    }
    // Contract filter
    if (selectedContractFilter !== 'all') {
      if (selectedContractFilter === 'unlinked') {
        if (n.contractId) return false;
      } else {
        if (n.contractId !== selectedContractFilter) return false;
      }
    }
    return true;
  });

  // Sort: Pinned first, then by updatedAt descending
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-[#fbfbfa] border border-[#c0b298] shadow-2xl rounded-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-2.5 sm:p-5 border-b border-[#c0b298]/80 bg-[#f5f4ed] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#7d6840] text-white flex items-center justify-center shrink-0 text-sm sm:text-base">
              📖
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-bold text-sm sm:text-lg text-[#4a3e26] font-serif truncate">
                  <span className="sm:hidden">สมุดโน๊ตส่วนตัว</span>
                  <span className="hidden sm:inline">สมุดโน๊ตส่วนตัว (Personal Notes)</span>
                </h3>
                <span className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#ebdcb2] text-[#4a3e26] shrink-0 font-mono">
                  <span className="sm:hidden">{notes.length}</span>
                  <span className="hidden sm:inline">{notes.length} โน้ต</span>
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-[#70644e]">
                บันทึกเบอร์ติดต่อธนาคาร เอกสารสำคัญ แผนรีไฟแนนซ์ และเตือนความจำ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!showForm && (
              <button
                onClick={handleOpenAddForm}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#7d6840] hover:bg-[#685533] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span className="text-xs">➕</span>
                <span className="hidden sm:inline">เขียนโน้ตใหม่</span>
                <span className="sm:hidden">เพิ่ม</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 text-[#70644e] hover:text-[#4a3e26] hover:bg-[#e8ebe0] rounded-xl transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Form Modal / Inline Editor */}
          {showForm ? (
            <div className="bg-white border border-[#c0b298] p-4 sm:p-5 rounded-2xl shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-[#e6e4d5] pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#7d6840]" />
                  <h4 className="font-bold text-sm text-[#4a3e26]">
                    {editingNoteId ? 'แก้ไขบันทึกโน้ต' : 'สร้างบันทึกโน้ตใหม่'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs text-[#70644e] hover:text-[#4a3e26] underline cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-[#4a3e26] mb-1">
                    หัวข้อบันทึก <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น เบอร์โทรฝ่ายสินเชื่อ, นัดประเมินราคา, เลขที่สัญญา..."
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-[#c0b298] bg-[#fbfbfa] focus:outline-none focus:border-[#7d6840]"
                    autoFocus
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-bold text-[#4a3e26] mb-1">
                    รายละเอียดข้อความ
                  </label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="พิมพ์เนื้อหา ข้อความ หรือเบอร์โทรศัพท์ที่ต้องการจดจำ..."
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-[#c0b298] bg-[#fbfbfa] focus:outline-none focus:border-[#7d6840] font-sans leading-relaxed"
                  />
                </div>

                {/* Category & Contract Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#4a3e26] mb-1">
                      หมวดหมู่
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as NoteCategory)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#c0b298] bg-[#fbfbfa] focus:outline-none focus:border-[#7d6840]"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([catKey, val]) => (
                        <option key={catKey} value={catKey}>
                          {val.icon} {val.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4a3e26] mb-1">
                      ผูกกับสัญญาสินเชื่อ (ทางเลือก)
                    </label>
                    <select
                      value={contractId}
                      onChange={(e) => setContractId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#c0b298] bg-[#fbfbfa] focus:outline-none focus:border-[#7d6840]"
                    >
                      <option value="">-- ไม่ผูกกับสัญญาใด (ใช้ร่วมกัน) --</option>
                      {contracts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nickname} ({c.bankName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Color Selection & Pin Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#4a3e26] mb-1.5">
                      โทนสีการ์ด (6 เฉดสี)
                    </label>
                    <div className="flex items-center gap-2">
                      {(Object.keys(COLOR_CONFIGS) as NoteColor[]).map((cKey) => {
                        const cfg = COLOR_CONFIGS[cKey];
                        const isSelected = color === cKey;
                        return (
                          <button
                            key={cKey}
                            type="button"
                            onClick={() => setColor(cKey)}
                            title={cfg.label}
                            className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                              cfg.bg
                            } ${cfg.border} ${
                              isSelected ? 'scale-115 ring-2 ring-[#7d6840]' : 'hover:scale-105'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#4a3e26]">
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="rounded text-[#7d6840] focus:ring-[#7d6840] w-4 h-4 cursor-pointer"
                      />
                      <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-600 fill-amber-600' : 'text-[#70644e]'}`} />
                      <span>ปักหมุดไว้บนสุด (Pinned Note)</span>
                    </label>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#e6e4d5]">
                  <div>
                    {editingNoteId && (
                      <button
                        type="button"
                        disabled={isDeleting || formLoading}
                        onClick={async () => {
                          setIsDeleting(true);
                          try {
                            await onDeleteNote(editingNoteId);
                            setShowForm(false);
                            setEditingNoteId(null);
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isDeleting ? 'กำลังลบ...' : 'ลบโน้ตนี้'}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 border border-[#c0b298] text-[#70644e] hover:bg-[#e8ebe0] rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading || isDeleting}
                      className="px-5 py-2 bg-[#7d6840] hover:bg-[#685533] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {formLoading ? 'กำลังบันทึก...' : editingNoteId ? 'บันทึกการแก้ไข' : 'สร้างโน้ต'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : null}

          {/* Quick Templates Bar (Single row on mobile) */}
          {!showForm && (
            <div className="bg-[#f2f4ec] border border-[#d6dcbe] p-1.5 sm:p-2.5 rounded-xl flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#4a3e26] shrink-0">
                <span className="text-xs">✨</span>
                <span className="hidden sm:inline">แม่แบบด่วน:</span>
              </div>
              <button
                onClick={() => applyTemplate('bank')}
                className="flex-1 inline-flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-blue-200 text-[11px] sm:text-xs font-semibold text-blue-900 transition-all cursor-pointer shadow-2xs whitespace-nowrap min-w-0"
              >
                <span className="text-xs shrink-0">📞</span>
                <span className="sm:hidden truncate">ธนาคาร</span>
                <span className="hidden sm:inline">+ เบอร์ธนาคาร</span>
              </button>

              <button
                onClick={() => applyTemplate('refinance')}
                className="flex-1 inline-flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-200 text-[11px] sm:text-xs font-semibold text-amber-900 transition-all cursor-pointer shadow-2xs whitespace-nowrap min-w-0"
              >
                <span className="text-xs shrink-0">🔄</span>
                <span className="sm:hidden truncate">รีไฟแนนซ์</span>
                <span className="hidden sm:inline">+ แผนรีไฟแนนซ์</span>
              </button>

              <button
                onClick={() => applyTemplate('docs')}
                className="flex-1 inline-flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white hover:bg-[#fbfbfa] border border-[#c0b298] text-[11px] sm:text-xs font-semibold text-[#4a3e26] transition-all cursor-pointer shadow-2xs whitespace-nowrap min-w-0"
              >
                <span className="text-xs shrink-0">📂</span>
                <span className="sm:hidden truncate">เอกสาร</span>
                <span className="hidden sm:inline">+ เอกสารสำคัญ</span>
              </button>
            </div>
          )}

          {/* Search & Filtering Controls */}
          {!showForm && (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70644e]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาโน้ต, เบอร์โทรศัพท์, ธนาคาร, เอกสาร..."
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#c0b298] bg-white focus:outline-none focus:border-[#7d6840]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70644e] hover:text-[#4a3e26]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter by Linked Contract */}
                <div className="sm:w-60">
                  <select
                    value={selectedContractFilter}
                    onChange={(e) => setSelectedContractFilter(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-[#c0b298] bg-white focus:outline-none focus:border-[#7d6840]"
                  >
                    <option value="all">สัญญาทั้งหมด (All Contracts)</option>
                    <option value="unlinked">โน้ตทั่วไป (ไม่ระบุสัญญา)</option>
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nickname} ({c.bankName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Filter Pills (Horizontal scrollable on mobile) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-[#7d6840] text-white shadow-2xs'
                      : 'bg-[#f4f3ea] text-[#70644e] hover:bg-[#e8ebe0]'
                  }`}
                >
                  ทั้งหมด ({notes.length})
                </button>

                {(Object.keys(CATEGORY_LABELS) as NoteCategory[]).map((catKey) => {
                  const cfg = CATEGORY_LABELS[catKey];
                  const count = notes.filter((n) => n.category === catKey).length;
                  const isSelected = selectedCategory === catKey;

                  return (
                    <button
                      key={catKey}
                      onClick={() => setSelectedCategory(catKey)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#7d6840] text-white shadow-2xs'
                          : 'bg-[#f4f3ea] text-[#70644e] hover:bg-[#e8ebe0]'
                      }`}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                      <span className="text-[10px] opacity-75 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes Grid */}
          {!showForm && (
            <>
              {sortedNotes.length === 0 ? (
                <div className="p-8 text-center bg-[#f5f4ed] rounded-xl border border-dashed border-[#c0b298] space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#ebdcb2] text-[#7d6840] flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#4a3e26]">ยังไม่มีบันทึกโน้ตในหมวดหมู่นี้</h4>
                  <p className="text-xs text-[#70644e] max-w-sm mx-auto">
                    คลิกปุ่ม <strong>"เขียนโน้ตใหม่"</strong> หรือเลือกแม่แบบด่วนด้านบนเพื่อเริ่มบันทึกข้อมูลสำคัญ
                  </p>
                  <button
                    onClick={handleOpenAddForm}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#7d6840] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>สร้างโน้ตแรก</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {sortedNotes.map((note) => {
                    const colorCfg = COLOR_CONFIGS[note.color] || COLOR_CONFIGS.cream;
                    const catCfg = CATEGORY_LABELS[note.category] || CATEGORY_LABELS.general;
                    const linkedContract = contracts.find((c) => c.id === note.contractId);
                    const isCopied = copiedNoteId === note.id;

                    return (
                      <div
                        key={note.id}
                        className={`p-4 rounded-2xl border transition-all shadow-2xs flex flex-col justify-between group ${colorCfg.bg} ${colorCfg.border}`}
                      >
                        {/* Top: Category, Linked Contract & Action Buttons */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Category Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${colorCfg.badge}`}
                              >
                                <span>{catCfg.icon}</span>
                                <span>{catCfg.label}</span>
                              </span>

                              {/* Linked Contract Badge */}
                              {linkedContract && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/80 text-[#4a3e26] border border-[#c0b298]/60 flex items-center gap-1">
                                  <Building className="w-3 h-3 text-[#7d6840]" />
                                  <span>{linkedContract.nickname}</span>
                                </span>
                              )}
                            </div>

                            {/* Pin / Edit / Delete buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Pin Toggle */}
                              <button
                                onClick={() => onTogglePin(note.id, note.isPinned)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  note.isPinned
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'text-gray-400 hover:text-[#7d6840] hover:bg-black/5'
                                }`}
                                title={note.isPinned ? 'ยกเลิกการปักหมุด' : 'ปักหมุดโน้ตนี้'}
                              >
                                <Pin
                                  className={`w-3.5 h-3.5 ${
                                    note.isPinned ? 'fill-amber-600 text-amber-600' : ''
                                  }`}
                                />
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleEditNote(note)}
                                className="p-1.5 text-gray-400 hover:text-[#4a3e26] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                                title="แก้ไขโน้ต"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button with inline confirmation (replaces window.confirm which is blocked in iframes) */}
                              {deletingNoteId === note.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-lg animate-in fade-in duration-150">
                                  <span className="text-[10px] text-red-700 font-bold">ลบ?</span>
                                  <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setIsDeleting(true);
                                      try {
                                        await onDeleteNote(note.id);
                                      } finally {
                                        setIsDeleting(false);
                                        setDeletingNoteId(null);
                                      }
                                    }}
                                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-md shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                                  >
                                    {isDeleting ? '...' : 'ยืนยัน'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingNoteId(null);
                                    }}
                                    className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-bold rounded-md cursor-pointer transition-colors"
                                    title="ยกเลิก"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingNoteId(note.id);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="ลบโน้ตนี้"
                                >
                                  <span className="text-xs">🗑️</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-bold text-[#4a3e26] mb-1.5 break-words">
                            {note.title}
                          </h4>

                          {/* Content */}
                          <div className="text-xs text-[#52442b] whitespace-pre-wrap break-words leading-relaxed font-sans max-h-56 overflow-y-auto">
                            {note.content}
                          </div>
                        </div>

                        {/* Bottom: Date & Quick Copy Button */}
                        <div className="mt-4 pt-2.5 border-t border-black/5 flex items-center justify-between text-[11px] text-[#70644e]">
                          <span className="text-[10px]">
                            อัปเดต: {formatThaiDate(note.updatedAt.split('T')[0])}
                          </span>

                          <button
                            onClick={() => handleCopyContent(note)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-[#4a3e26] font-semibold text-[11px] border border-[#c0b298]/60 transition-all cursor-pointer shadow-2xs"
                            title="คัดลอกเนื้อหาโน้ต"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span className="text-emerald-700 font-bold">คัดลอกแล้ว!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#7d6840]" />
                                <span>คัดลอก</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#f5f4ed] border-t border-[#c0b298]/80 flex justify-between items-center shrink-0">
          <div className="text-xs text-[#70644e]">
            บันทึกข้อมูลเรียลไทม์ผ่าน Cloud Firestore
          </div>
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
