import * as pdfjsLib from 'pdfjs-dist';
import type { RiskCard, TabCategory } from '../data/riskFramework';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PageData {
    page: number;
    text: string;
    imageBase64?: string; // Set when page has no text (scan)
}

export interface AnalysisError {
    type: 'no_api_key' | 'api_error' | 'parse_error';
    message: string;
}

// ─── Step 1: Extract text AND render images from each page ───────────────────
export async function extractTextPerPage(file: File): Promise<PageData[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: PageData[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        // Extract text
        const content = await page.getTextContent();
        const text = content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        const pageData: PageData = { page: i, text };

        // If page has no/very little text, render it as image for Vision API
        if (text.length < 50) {
            const viewport = page.getViewport({ scale: 1.2 }); // Lower scale to save tokens
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d')!;
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
            // Remove the "data:image/png;base64," prefix
            pageData.imageBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        }

        pages.push(pageData);
    }

    return pages;
}

// ─── Step 2: Map tab label ─────────────────────────────────────────────────────
function getTabFromCode(code: string): TabCategory {
    if (code.startsWith('1')) return 'Vận hành';
    if (code.startsWith('2')) return 'Pháp lý';
    if (code.startsWith('3')) return 'Kỹ thuật';
    if (code.startsWith('4')) return 'Tài chính';
    return 'Vận hành';
}

// ─── Step 3: Build OpenAI messages (Vision for scans, text for text PDFs) ────
type OpenAIContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'low' | 'high' } };

function buildMessages(
    pages: PageData[],
    contractTypeTitle: string,
): { role: 'system' | 'user'; content: string | OpenAIContentPart[] }[] {
    const scanPages = pages.filter((p) => p.imageBase64);
    const isFullyScan = scanPages.length === pages.length;
    const totalPages = pages.length;

    const systemMsg = 'Bạn là chuyên gia phân tích rủi ro hợp đồng tại Việt Nam. Luôn trả lời bằng JSON hợp lệ theo đúng schema yêu cầu.';

    const taskInstructions = `Phân tích hợp đồng loại "${contractTypeTitle}" (${totalPages} trang) theo 4 nhóm rủi ro:
- "1.1"→"1.6": Vận hành (dữ liệu, cấu trúc, tiến độ, KPI, phụ lục, thương hiệu)
- "2.1"→"2.5": Pháp lý (tư cách, hình thức, bồi thường, tranh chấp, rủi ro pháp lý)
- "3.1"→"3.5": Kỹ thuật (hàng hóa, xuất xứ, tiêu chuẩn, tài liệu kỹ thuật, NCC)
- "4.1"→"4.6": Tài chính (đơn giá, thanh toán, điều chỉnh giá, tỷ giá, bảo lãnh, giá thị trường)

Trả về JSON hợp lệ:
{
  "risks": [
    {
      "subcategoryCode": "1.2",
      "tab": "Vận hành",
      "level": "High",
      "pageRef": 3,
      "issue": "Mô tả vấn đề cụ thể",
      "recommendation": "Đề xuất khắc phục",
      "suggestedText": "Nội dung điều khoản thay thế (viết đầy đủ, dùng được ngay)"
    }
  ]
}

QUY TẮC:
- pageRef = số trang thực (1 đến ${totalPages})
- Chỉ báo cáo vấn đề THỰC SỰ trong hợp đồng, không bịa đặt
- suggestedText phải là văn bản pháp lý hoàn chỉnh, có thể thay thế ngay vào hợp đồng
- Phản hồi CHỈ là JSON, không có giải thích thêm`;

    // Case 1: Text-based PDF — use simple text prompt
    if (scanPages.length === 0) {
        const fullText = pages
            .map((p) => `[TRANG ${p.page}]\n${p.text}`)
            .join('\n\n');
        return [
            { role: 'system', content: systemMsg },
            { role: 'user', content: `${taskInstructions}\n\nNỘI DUNG HỢP ĐỒNG:\n${fullText}` },
        ];
    }

    // Case 2: Scan PDF — use Vision API with images
    const userContent: OpenAIContentPart[] = [
        { type: 'text', text: taskInstructions + '\n\nCác trang hợp đồng bên dưới (đọc tất cả để phân tích):' },
    ];

    // For scan PDFs, send all pages as images (cap at 15 to avoid token limit)
    const pagesToSend = isFullyScan ? pages.slice(0, 15) : pages;
    for (const p of pagesToSend) {
        userContent.push({ type: 'text', text: `[TRANG ${p.page}]:` });
        if (p.imageBase64) {
            userContent.push({
                type: 'image_url',
                image_url: {
                    url: `data:image/jpeg;base64,${p.imageBase64}`,
                    detail: 'low', // Use low detail to save tokens
                },
            });
        } else {
            userContent.push({ type: 'text', text: p.text });
        }
    }

    if (pages.length > 15 && isFullyScan) {
        userContent.push({
            type: 'text',
            text: `[Lưu ý: Tài liệu có ${pages.length} trang, chỉ gửi 15 trang đầu để phân tích do giới hạn token]`,
        });
    }

    return [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userContent },
    ];
}

// ─── Step 4: Call OpenAI and parse results ────────────────────────────────────
export async function analyzeWithAI(
    pages: PageData[],
    contractTypeTitle: string,
    apiKey: string,
    model: string,
    onProgress?: (msg: string) => void,
): Promise<RiskCard[] | AnalysisError> {
    if (!apiKey) {
        return {
            type: 'no_api_key',
            message: 'Chưa cấu hình OpenAI API Key. Vui lòng vào ⚙️ Settings để nhập key.',
        };
    }

    const scanCount = pages.filter((p) => p.imageBase64).length;
    if (scanCount > 0) {
        onProgress?.(`Phát hiện ${scanCount}/${pages.length} trang ảnh scan — dùng GPT-4o Vision...`);
    } else {
        onProgress?.('Đang phân tích nội dung hợp đồng...');
    }

    const messages = buildMessages(pages, contractTypeTitle);

    // Vision requires gpt-4o or gpt-4-turbo
    const visionModel = scanCount > 0
        ? (model.startsWith('gpt-4o') ? model : 'gpt-4o')
        : model;

    onProgress?.('Đang gửi đến AI để phân tích...');

    let response: Response;
    try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: visionModel,
                messages,
                temperature: 0.1,
                response_format: { type: 'json_object' },
                max_tokens: 4000,
            }),
        });
    } catch (err) {
        return { type: 'api_error', message: `Lỗi kết nối: ${(err as Error).message}` };
    }

    if (!response.ok) {
        const errBody = await response.text();
        if (response.status === 401) {
            return { type: 'api_error', message: 'API Key không hợp lệ hoặc đã hết hạn. Kiểm tra lại trong ⚙️ Settings.' };
        }
        if (response.status === 429) {
            return { type: 'api_error', message: 'Đã vượt giới hạn API. Vui lòng thử lại sau ít phút.' };
        }
        return { type: 'api_error', message: `Lỗi API (${response.status}): ${errBody.slice(0, 200)}` };
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content ?? '';

    onProgress?.('Đang xử lý kết quả phân tích...');

    let parsed: {
        risks: Array<{
            subcategoryCode: string;
            tab?: TabCategory;
            level: 'High' | 'Medium' | 'Low';
            pageRef?: number;
            issue: string;
            recommendation: string;
            suggestedText?: string;
        }>;
    };

    try {
        parsed = JSON.parse(content);
    } catch {
        return { type: 'parse_error', message: 'AI không trả về đúng định dạng JSON. Vui lòng thử lại.' };
    }

    if (!Array.isArray(parsed.risks)) {
        return { type: 'parse_error', message: 'Phản hồi AI không hợp lệ (thiếu trường "risks").' };
    }

    const cards: RiskCard[] = parsed.risks.map((r, idx) => ({
        id: `ai-${idx}`,
        categoryCode: r.subcategoryCode.split('.')[0],
        subcategoryCode: r.subcategoryCode,
        tab: r.tab ?? getTabFromCode(r.subcategoryCode),
        level: r.level ?? 'Medium',
        // Clamp pageRef to actual PDF page count
        pageRef: r.pageRef && r.pageRef >= 1 && r.pageRef <= pages.length ? r.pageRef : undefined,
        issue: r.issue,
        recommendation: r.recommendation,
        suggestedText: r.suggestedText,
    }));

    return cards;
}
