import React, { useState, useRef, useEffect } from 'react';
import {
    LayoutDashboard,
    History,
    BarChart3,
    Settings,
    Upload,
    FileText,
    Search,
    X,
    ChevronRight,
    ShieldAlert,
    Database,
    FileWarning,
    Sparkles,
    Info,

    MapPin,
    Lightbulb,
    AlertCircle,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import {
    RISK_CATEGORIES,
    CONTRACT_TYPES,
    TABS,
    type TabCategory,
    type RiskCard,
    type RiskSubCategory,
} from './data/riskFramework';
import { extractTextPerPage, analyzeWithAI } from './services/pdfAnalyzer';
import { calculateScores, SCORE_STYLES, type ContractScores } from './services/scoreEngine';

// Configure pdf.js worker — use local file from public/
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RISK_LEVEL_STYLES = {
    High: 'bg-red-50 text-red-600 border border-red-200',
    Medium: 'bg-orange-50 text-orange-600 border border-orange-200',
    Low: 'bg-blue-50 text-blue-600 border border-blue-200',
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ onOpenSettings }: { onOpenSettings: () => void }) => (
    <aside className="w-[220px] shrink-0 flex flex-col bg-[#1e293b] text-slate-300 h-screen sticky top-0 border-r border-slate-700">
        <div className="p-5 flex items-center gap-3 border-b border-slate-700/60">
            <div className="w-9 h-9 bg-[#0d59f2] rounded-xl flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-white text-sm leading-tight">AI Contract Review</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
            {[
                { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', active: true },
                { icon: <History className="w-4 h-4" />, label: 'History', active: false },
                { icon: <BarChart3 className="w-4 h-4" />, label: 'Reports', active: false },
            ].map(({ icon, label, active }) => (
                <a
                    key={label}
                    href="#"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${active
                        ? 'bg-[#0d59f2]/20 text-white border border-[#0d59f2]/30'
                        : 'hover:bg-slate-800 hover:text-white text-slate-400'
                        }`}
                >
                    {icon}
                    <span>{label}</span>
                </a>
            ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
            <button
                onClick={onOpenSettings}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all text-sm font-medium"
            >
                <Settings className="w-4 h-4" />
                <span>⚙️ Settings</span>
            </button>
        </div>
    </aside>
);

// ─── Settings Modal ───────────────────────────────────────────────────────────
const STORAGE_KEYS = {
    apiKey: 'contractpilot_api_key',
    model: 'contractpilot_model',
    webhookUrl: 'contractpilot_webhook_url',
};

const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEYS.apiKey) ?? '');
    const [model] = useState(() => localStorage.getItem(STORAGE_KEYS.model) ?? 'gpt-4o');
    const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem(STORAGE_KEYS.webhookUrl) ?? '');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
        localStorage.setItem(STORAGE_KEYS.model, model);
        localStorage.setItem(STORAGE_KEYS.webhookUrl, webhookUrl);
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 900);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">App Configuration</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">OpenAI API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d59f2]/20 focus:border-[#0d59f2] text-sm transition-all"
                        />
                        {apiKey && (
                            <p className="text-[11px] text-emerald-600 font-semibold">
                                ✓ API Key đã lưu — sẵn sàng sử dụng
                            </p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Model</label>
                        <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#0d59f2]" />
                            GPT-4o
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Google Sheets Webhook URL</label>
                        <input
                            type="text"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://script.google.com/..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d59f2]/20 focus:border-[#0d59f2] text-sm transition-all"
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all ${saved
                            ? 'bg-emerald-500 text-white shadow-emerald-200'
                            : 'bg-[#0d59f2] hover:bg-[#0a47c4] text-white shadow-[#0d59f2]/20'
                            }`}
                    >
                        {saved ? '✓ Đã lưu thành công!' : 'Save Configuration'}
                    </button>
                    <p className="text-[11px] text-slate-400 text-center">
                        Lưu cục bộ trên trình duyệt này — không gửi lên server.
                    </p>
                </div>
            </div>
        </div>
    );
};


// ─── AI Prompt Panel ──────────────────────────────────────────────────────────
const AiPromptPanel = ({
    subcategory,
    onClose,
}: {
    subcategory: RiskSubCategory;
    onClose: () => void;
}) => (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold">{subcategory.code}</p>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{subcategory.title}</h3>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">AI Prompt</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed font-mono">
                        {subcategory.aiPrompt}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition-all"
                >
                    🚀 Run this Prompt
                </button>
            </div>
        </div>
    </div>
);

// ─── PDF Canvas Viewer ───────────────────────────────────────────────────────
const PdfCanvasViewer = ({ file, targetPage }: { file: File; targetPage?: number }) => {
    const [pages, setPages] = useState<string[]>([]);
    const [isRendering, setIsRendering] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        setIsRendering(true);
        setPages([]);
        setError(null);

        (async () => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const rendered: string[] = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    if (cancelled) return;
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext('2d')!;
                    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
                    rendered.push(canvas.toDataURL('image/png'));
                }

                if (!cancelled) {
                    setPages(rendered);
                    setIsRendering(false);
                }
            } catch {
                if (!cancelled) {
                    setError('Không thể đọc file PDF. Vui lòng thử lại.');
                    setIsRendering(false);
                }
            }
        })();

        return () => { cancelled = true; };
    }, [file]);

    // Scroll to target page when it changes
    useEffect(() => {
        if (!targetPage || isRendering) return;
        const el = document.getElementById(`pdf-page-${targetPage}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [targetPage, isRendering]);

    if (isRendering) return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 border-4 border-[#0d59f2] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Đang xử lý PDF...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
            <FileText className="w-10 h-10 text-red-300" />
            <p className="text-xs text-red-400 font-semibold">{error}</p>
        </div>
    );

    return (
        <div ref={containerRef} className="w-full h-full overflow-y-auto flex flex-col gap-2 p-2">
            {pages.map((src, i) => (
                <div key={i} id={`pdf-page-${i + 1}`} className="relative">
                    {/* Page number badge */}
                    <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Trang {i + 1}
                    </div>
                    <img
                        src={src}
                        alt={`Trang ${i + 1}`}
                        className="w-full rounded-lg shadow-sm border border-slate-200"
                    />
                </div>
            ))}
        </div>
    );
};

// ─── PDF Section ─────────────────────────────────────────────────────────────
const PDFSection = ({
    isScanning,
    onScan,
    selectedFile,
    onFileSelect,
    targetPage,
    scanProgress,
}: {
    isScanning: boolean;
    onScan: () => void;
    selectedFile: File | null;
    onFileSelect: (file: File) => void;
    targetPage?: number;
    scanProgress?: string;
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileSelect(file);
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === 'application/pdf') {
            onFileSelect(file);
        }
    };

    return (
        <div className="w-[38%] shrink-0 flex flex-col gap-4 p-6 overflow-y-auto bg-white border-r border-slate-200">

            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />

            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-300 ${isDragging
                        ? 'border-[#0d59f2] bg-[#0d59f2]/10 scale-[1.01]'
                        : 'border-slate-200 hover:border-[#0d59f2]/40 bg-slate-50/50 hover:bg-[#0d59f2]/5'
                    }`}
            >
                <div className="w-12 h-12 bg-[#0d59f2]/10 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-[#0d59f2]" />
                </div>
                {selectedFile ? (
                    <>
                        <h3 className="text-sm font-bold text-slate-800 truncate max-w-full px-2">{selectedFile.name}</h3>
                        <p className="text-xs text-[#0d59f2] mt-0.5">Nhấn để chọn file khác</p>
                    </>
                ) : (
                    <>
                        <h3 className="text-sm font-bold text-slate-800 mb-1">Chọn hoặc kéo thả PDF</h3>
                        <p className="text-xs text-slate-400">Hỗ trợ PDF bao gồm PDF dạng ảnh scan</p>
                    </>
                )}
            </div>

            <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                {selectedFile ? (
                    <PdfCanvasViewer file={selectedFile} targetPage={targetPage} />
                ) : (
                    <>
                        <FileText className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">PDF Preview</p>
                        <span className="mt-2 px-3 py-1 bg-white/80 rounded-full text-xs text-slate-400">Chưa có tài liệu</span>
                    </>
                )}
            </div>

            {isScanning && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>{scanProgress ?? 'Scanning...'}</span>
                        <span>AI analyzing</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0d59f2] rounded-full animate-pulse w-3/4" />
                    </div>
                </div>
            )}

            <button
                onClick={onScan}
                disabled={isScanning || !selectedFile}
                className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${isScanning || !selectedFile
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#0d59f2] hover:bg-[#0a47c4] text-white shadow-xl shadow-[#0d59f2]/20'
                    }`}
            >
                {isScanning ? (
                    <>
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        Scanning for Risks...
                    </>
                ) : (
                    <>
                        <Search className="w-5 h-5" />
                        Scan for Risks
                    </>
                )}
            </button>
        </div>
    );
};

// ─── Risk Card ────────────────────────────────────────────────────────────────
const RiskCardItem = ({
    risk,
    onGoToPage,
}: {
    risk: RiskCard;
    onGoToPage: (page: number) => void;
}) => {
    const [showSuggested, setShowSuggested] = useState(false);
    const category = RISK_CATEGORIES.find((c) => c.code === risk.categoryCode);
    const subcategory = category?.subcategories.find((s) => s.code === risk.subcategoryCode);
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            {/* Header row */}
            <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${RISK_LEVEL_STYLES[risk.level]}`}>
                        {risk.level} Risk
                    </span>
                    {subcategory && (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">
                            {subcategory.code}
                        </span>
                    )}
                </div>
                {/* Kiểm tra button — navigates PDF to the problem page */}
                {risk.pageRef && (
                    <button
                        onClick={() => onGoToPage(risk.pageRef!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d59f2] hover:bg-[#0a47c4] text-white text-xs font-bold rounded-lg transition-all active:scale-95 shrink-0 shadow-sm shadow-[#0d59f2]/30"
                    >
                        <MapPin className="w-3 h-3" />
                        Kiểm tra · Trang {risk.pageRef}
                    </button>
                )}
            </div>

            {subcategory && (
                <p className="text-[11px] font-semibold text-slate-400 mb-3">{subcategory.title}</p>
            )}

            <div className="space-y-3">
                {/* Issue */}
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Vấn đề (Issue)</h4>
                    <p className="text-slate-800 text-sm leading-relaxed">{risk.issue}</p>
                </div>

                {/* Recommendation */}
                <div className="bg-[#0d59f2]/5 rounded-xl p-4 border-l-4 border-[#0d59f2]/50">
                    <h4 className="text-[10px] font-black text-[#0d59f2] uppercase tracking-widest mb-1.5">Đề xuất (Recommendation)</h4>
                    <p className="text-slate-700 text-sm leading-relaxed font-medium italic">{risk.recommendation}</p>
                </div>

                {/* Suggested replacement text */}
                {risk.suggestedText && (
                    <div className="rounded-xl border border-amber-200 overflow-hidden">
                        <button
                            onClick={() => setShowSuggested((v) => !v)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Gợi ý nội dung thay thế</span>
                            </div>
                            <ChevronRight className={`w-3.5 h-3.5 text-amber-400 transition-transform ${showSuggested ? 'rotate-90' : ''}`} />
                        </button>
                        {showSuggested && (
                            <div className="px-4 py-3 bg-amber-50/50 border-t border-amber-100">
                                <pre className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">{risk.suggestedText}</pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Subcategory Row ──────────────────────────────────────────────────────────
const SubcategoryRow = ({
    sub,
    onViewPrompt,
}: {
    sub: RiskSubCategory;
    onViewPrompt: (sub: RiskSubCategory) => void;
}) => (
    <button
        onClick={() => onViewPrompt(sub)}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white hover:bg-[#0d59f2]/5 border border-slate-100 hover:border-[#0d59f2]/30 text-left group transition-all"
    >
        <span className="text-[10px] font-black text-slate-400 w-10 shrink-0">{sub.code}</span>
        <p className="flex-1 text-sm text-slate-700 group-hover:text-slate-900 font-medium leading-tight">{sub.title}</p>
        <Sparkles className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-500 shrink-0 transition-colors" />
    </button>
);

// ─── Score Banner ────────────────────────────────────────────────────────────────
const ScoreBanner = ({ scores }: { scores: ContractScores }) => {
    const s = SCORE_STYLES[scores.overallColor];
    return (
        <div className={`mx-5 mt-4 rounded-2xl border p-4 ${s.bg} border-opacity-40`} style={{ borderColor: 'currentColor' }}>
            <div className="flex items-center gap-4">
                {/* Big score circle */}
                <div className={`w-16 h-16 shrink-0 rounded-full ring-4 ${s.ring} flex flex-col items-center justify-center shadow-sm ${s.bg}`}>
                    <span className={`text-2xl font-black leading-none ${s.text}`}>{scores.overall}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${s.text} opacity-70`}>/ 100</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-black ${s.text}`}>{scores.overallLabel}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${s.badge}`}>
                            {scores.overallColor === 'green' ? '✅ Đạt chuẩn' : scores.overallColor === 'yellow' ? '⚠️ Cần xem xét' : '🔴 Rủi ro cao'}
                        </span>
                    </div>
                    {/* Per-category mini bars */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {(Object.entries(scores.categories) as [TabCategory, typeof scores.categories[TabCategory]][]).map(([cat, cs]) => {
                            const cs_style = SCORE_STYLES[cs.color];
                            return (
                                <div key={cat} className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 font-semibold w-14 shrink-0 truncate">{cat}</span>
                                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${cs_style.bar}`}
                                            style={{ width: `${cs.score}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-black w-6 text-right ${cs_style.text}`}>{cs.score}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-200/60">
                ⚡️ Điểm tính tự động: High −15 · Medium −7 · Low −3 mỗi mục. Cùng file → luôn cùng điểm.
            </p>
        </div>
    );
};

// ─── Analysis Section ─────────────────────────────────────────────────────────
const AnalysisSection = ({
    risks,
    onGoToPage,
    scanError,
    scores,
}: {
    risks: RiskCard[];
    onGoToPage: (page: number) => void;
    scanError?: string;
    scores?: ContractScores;
}) => {
    const [activeTab, setActiveTab] = useState<TabCategory>('Vận hành');
    const [viewMode, setViewMode] = useState<'risks' | 'prompts'>('risks');
    const [selectedSub, setSelectedSub] = useState<RiskSubCategory | null>(null);

    const filteredRisks = risks.filter((r) => r.tab === activeTab);
    const activeCategory = RISK_CATEGORIES.find((c) => c.tab === activeTab);

    return (
        <div className="flex-1 bg-slate-50 flex flex-col h-screen overflow-hidden relative">
            {/* Subcategory/Prompt overlay */}
            {selectedSub && (
                <AiPromptPanel subcategory={selectedSub} onClose={() => setSelectedSub(null)} />
            )}

            {/* Score Banner — shown after scan completes */}
            {scores && risks.length > 0 && <ScoreBanner scores={scores} />}

            {/* Tabs */}
            <div className="bg-white border-b border-slate-200 px-5 pt-4 pb-0 mt-2">
                <div className="flex gap-1">
                    {TABS.map((tab) => {
                        const catScore = scores?.categories[tab.label];
                        const cs_style = catScore ? SCORE_STYLES[catScore.color] : null;
                        return (
                            <button
                                key={tab.label}
                                onClick={() => setActiveTab(tab.label)}
                                className={`px-4 py-3 text-sm font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.label
                                    ? 'text-[#0d59f2] border-[#0d59f2] bg-[#0d59f2]/5'
                                    : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {tab.label}
                                {catScore && cs_style && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${cs_style.badge}`}>
                                        {catScore.score}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* View mode toggle */}
            <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                <div className="flex p-1 bg-slate-200 rounded-xl gap-1">
                    <button
                        onClick={() => setViewMode('risks')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'risks' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <FileWarning className="w-3.5 h-3.5" />
                        Rủi ro ({filteredRisks.length})
                    </button>
                    <button
                        onClick={() => setViewMode('prompts')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'prompts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Info className="w-3.5 h-3.5" />
                        AI Prompts ({activeCategory?.subcategories.length ?? 0})
                    </button>
                </div>
                <p className="text-xs text-slate-400 font-semibold ml-auto">{activeCategory?.title}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-3">
                {viewMode === 'risks' ? (
                    filteredRisks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            {scanError ? (
                                <>
                                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                                        <AlertCircle className="w-8 h-8 text-red-400" />
                                    </div>
                                    <p className="text-red-500 font-semibold text-sm max-w-xs">{scanError}</p>
                                    <p className="text-xs text-slate-400 mt-2">Kiểm tra lại API Key trong ⚙️ Settings</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                        <ShieldAlert className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-medium">Chưa có rủi ro nào được phát hiện</p>
                                    <p className="text-xs text-slate-300 mt-1">Tải lên hợp đồng và nhấn "Scan for Risks"</p>
                                </>
                            )}
                        </div>
                    ) : (
                        filteredRisks.map((r) => <RiskCardItem key={r.id} risk={r} onGoToPage={onGoToPage} />)
                    )
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs text-slate-400 px-1 pb-1">
                            Nhấn vào từng mục để xem AI Prompt đầy đủ và chạy thử.
                        </p>
                        {activeCategory?.subcategories.map((sub) => (
                            <SubcategoryRow key={sub.id} sub={sub} onViewPrompt={setSelectedSub} />
                        ))}
                    </div>
                )}
            </div>

            {/* Sticky sync button */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-slate-50/95 via-slate-50/80 to-transparent">
                <button className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                    <Database className="w-5 h-5" />
                    Duyệt & Đồng bộ Google Sheets 📊
                </button>
            </div>
        </div>
    );
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedContractType] = useState(CONTRACT_TYPES[0].code);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [targetPage, setTargetPage] = useState<number | undefined>(undefined);
    const [risks, setRisks] = useState<RiskCard[]>([]);
    const [scanError, setScanError] = useState<string | undefined>(undefined);
    const [scanProgress, setScanProgress] = useState<string | undefined>(undefined);

    // Deterministic score — recalculated whenever risks change
    const scores = risks.length > 0 ? calculateScores(risks) : undefined;

    const handleScan = async () => {
        if (!selectedFile) return;
        setIsScanning(true);
        setScanError(undefined);
        setRisks([]);
        setScanProgress('Đang đọc file PDF...');

        try {
            // Step 1: Extract text from each page
            const pages = await extractTextPerPage(selectedFile);

            // Step 2: Get API config from localStorage
            const apiKey = localStorage.getItem('contractpilot_api_key') ?? '';
            const model = localStorage.getItem('contractpilot_model') ?? 'gpt-4o';
            const contractType = CONTRACT_TYPES.find((ct) => ct.code === selectedContractType);
            const contractTitle = contractType?.title ?? 'Hợp đồng';

            // Step 3: Call AI analysis
            const result = await analyzeWithAI(pages, contractTitle, apiKey, model, setScanProgress);

            if (Array.isArray(result)) {
                setRisks(result);
            } else {
                // It's an AnalysisError
                setScanError(result.message);
            }
        } catch (err) {
            setScanError(`Lỗi không mong đợi: ${(err as Error).message}`);
        } finally {
            setIsScanning(false);
            setScanProgress(undefined);
        }
    };

    const handleGoToPage = (page: number) => {
        setTargetPage(undefined);
        setTimeout(() => setTargetPage(page), 50);
    };

    return (
        <div className="flex w-full h-screen bg-white overflow-hidden">
            <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
            <main className="flex-1 flex overflow-hidden">
                <PDFSection
                    isScanning={isScanning}
                    onScan={handleScan}
                    selectedFile={selectedFile}
                    onFileSelect={setSelectedFile}
                    targetPage={targetPage}
                    scanProgress={scanProgress}
                />
                <AnalysisSection
                    risks={risks}
                    onGoToPage={handleGoToPage}
                    scanError={scanError}
                    scores={scores}
                />
            </main>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default App;
