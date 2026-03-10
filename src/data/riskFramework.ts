// ─── Types ────────────────────────────────────────────────────────────────────
export type RiskLevel = 'High' | 'Medium' | 'Low';
export type TabCategory = 'Vận hành' | 'Pháp lý' | 'Kỹ thuật' | 'Tài chính';

export interface RiskSubCategory {
    id: string;
    code: string; // e.g. "7.1.1"
    title: string;
    aiPrompt: string;
}

export interface RiskCategory {
    id: string;
    code: string; // e.g. "7.1"
    title: string;
    tab: TabCategory;
    subcategories: RiskSubCategory[];
}

export interface ContractType {
    code: string;
    title: string;
    checklistRef: string;
    aiPrompt: string;
}

export interface RiskCard {
    id: string;
    categoryCode: string;
    subcategoryCode: string;
    tab: TabCategory;
    level: RiskLevel;
    issue: string;
    recommendation: string;
    pageRef?: number;        // PDF page number where the issue was found
    suggestedText?: string; // Suggested replacement text
}

// ─── Risk Categories Data ─────────────────────────────────────────────────────
export const RISK_CATEGORIES: RiskCategory[] = [
    {
        id: 'general-risk',
        code: '1',
        title: 'Kiểm soát Rủi ro Chung',
        tab: 'Vận hành',
        subcategories: [
            {
                id: '1.1',
                code: '1.1',
                title: 'Rủi ro về dữ liệu & tài liệu hợp đồng',
                aiPrompt:
                    'Phân tích chất lượng tài liệu (lỗi định dạng, scan, nhất quán thông tin định danh) và khả năng trích xuất tự động (cần OCR?).',
            },
            {
                id: '1.2',
                code: '1.2',
                title: 'Rủi ro về cấu trúc, nội dung và sai lệch tiêu chuẩn',
                aiPrompt:
                    'So sánh nội dung hợp đồng với mẫu chuẩn, xác định sai lệch, điều khoản mâu thuẫn/mơ hồ, thiếu điều khoản (Bảo mật, Bất khả kháng) và tính rõ ràng của nghĩa vụ.',
            },
            {
                id: '1.3',
                code: '1.3',
                title: 'Rủi ro vận hành, tiến độ và năng lực nhà cung cấp',
                aiPrompt:
                    'Đánh giá năng lực NCC (hồ sơ, kinh nghiệm), rủi ro chậm tiến độ và rủi ro phụ thuộc vào NCC duy nhất (single vendor risk).',
            },
            {
                id: '1.4',
                code: '1.4',
                title: 'Rủi ro KPIs và chất lượng dịch vụ',
                aiPrompt:
                    'Đánh giá tính cụ thể/khả thi của KPI, xác định nghĩa vụ thiếu chỉ số đo lường, và kiểm tra cơ chế phạt/thưởng đi kèm KPI.',
            },
            {
                id: '1.5',
                code: '1.5',
                title: 'Rủi ro liên quan đến phụ lục, tài liệu tham chiếu',
                aiPrompt:
                    'Kiểm tra sự đầy đủ, tính đúng đắn của phụ lục và tài liệu tham chiếu, phát hiện sự không đồng bộ giữa hợp đồng chính và phụ lục.',
            },
            {
                id: '1.6',
                code: '1.6',
                title: 'Rủi ro tài trợ thương hiệu & uy tín dự án',
                aiPrompt:
                    'Đánh giá rủi ro uy tín đối tác, phân tích điều khoản bảo vệ thương hiệu, và cơ chế xử lý khi có vi phạm uy tín.',
            },
        ],
    },
    {
        id: 'legal-compliance',
        code: '2',
        title: 'Kiểm tra Tính Pháp lý & Tuân thủ',
        tab: 'Pháp lý',
        subcategories: [
            {
                id: '2.1',
                code: '2.1',
                title: 'Tính pháp lý của chủ thể & tư cách giao kết',
                aiPrompt:
                    'Xác minh tư cách pháp lý, năng lực và thẩm quyền của người ký, xác định rủi ro pháp lý nếu người ký không đúng thẩm quyền.',
            },
            {
                id: '2.2',
                code: '2.2',
                title: 'Tính pháp lý của hình thức & nội dung hợp đồng',
                aiPrompt:
                    'Kiểm tra hình thức, tính đầy đủ của nội dung bắt buộc, tính hợp pháp của các điều khoản (tránh trái luật/đạo đức xã hội) và nguy cơ điều khoản vô hiệu.',
            },
            {
                id: '2.3',
                code: '2.3',
                title: 'Điều khoản phòng vệ, bồi thường, bất khả kháng',
                aiPrompt:
                    'Phân tích điều khoản Bảo mật, Bất khả kháng, đánh giá tính hợp lý và giới hạn của điều khoản Bồi thường/Mức phạt (tuân thủ 8% Luật TM).',
            },
            {
                id: '2.4',
                code: '2.4',
                title: 'Điều khoản giải quyết tranh chấp & luật áp dụng',
                aiPrompt:
                    'Xác định cơ chế giải quyết tranh chấp (Trọng tài/Tòa án), Luật áp dụng, Thẩm quyền giải quyết và rủi ro về thời hiệu khởi kiện.',
            },
            {
                id: '2.5',
                code: '2.5',
                title: 'Rủi ro pháp lý tiềm ẩn & khả năng phát sinh tranh chấp',
                aiPrompt:
                    'Tổng hợp các điều khoản có nguy cơ gây tranh chấp, dự báo xác suất và tác động, đồng thời nhận diện rủi ro vi phạm quy định pháp luật (đấu thầu, thuế...).',
            },
        ],
    },
    {
        id: 'technical-goods',
        code: '3',
        title: 'Kiểm tra Thông tin Hàng hóa, Vật tư, Thiết bị',
        tab: 'Kỹ thuật',
        subcategories: [
            {
                id: '3.1',
                code: '3.1',
                title: 'Mô tả hàng hóa, model, thông số kỹ thuật',
                aiPrompt:
                    'Trích xuất và kiểm tra tính rõ ràng, nhất quán của danh mục hàng hóa (tên, mã, model, số lượng) và thông số kỹ thuật.',
            },
            {
                id: '3.2',
                code: '3.2',
                title: 'Xuất xứ, CO/CQ, chứng từ kỹ thuật',
                aiPrompt:
                    'Kiểm tra yêu cầu về Xuất xứ, CO/CQ, tính đầy đủ của hồ sơ kỹ thuật (manual, bản vẽ) và sự khớp nối giữa chứng từ và mô tả thiết bị.',
            },
            {
                id: '3.3',
                code: '3.3',
                title: 'Tiêu chuẩn áp dụng (TCVN, IEC, ISO … )',
                aiPrompt:
                    'Trích xuất các tiêu chuẩn kỹ thuật được viện dẫn, đánh giá tính phù hợp, tính thống nhất giữa các phần của hợp đồng.',
            },
            {
                id: '3.4',
                code: '3.4',
                title: 'Kiểm tra tính đầy đủ của tài liệu kỹ thuật & phụ kiện đi kèm',
                aiPrompt:
                    'Kiểm tra danh mục phụ kiện và tài liệu kỹ thuật đi kèm, phát hiện thiếu sót gây rủi ro vận hành/nghiệm thu/bảo hành.',
            },
            {
                id: '3.5',
                code: '3.5',
                title: 'So sánh nhà cung cấp & năng lực kỹ thuật',
                aiPrompt:
                    'Phân tích năng lực kỹ thuật của NCC, so sánh giá/chất lượng với thị trường và đánh giá lịch sử thực hiện các dự án trước.',
            },
        ],
    },
    {
        id: 'financial-terms',
        code: '4',
        title: 'Kiểm tra Giá cả, Thanh toán và Điều kiện Thương mại',
        tab: 'Tài chính',
        subcategories: [
            {
                id: '4.1',
                code: '4.1',
                title: 'Xác định đơn giá, thành phần giá và điều kiện báo giá',
                aiPrompt:
                    'Trích xuất đơn giá/tổng giá trị, làm rõ thành phần giá (VAT, vận chuyển, lắp đặt) và rủi ro thay đổi giá theo thời hạn báo giá.',
            },
            {
                id: '4.2',
                code: '4.2',
                title: 'Điều khoản thanh quyết toán, tạm ứng và chứng từ',
                aiPrompt:
                    'Phân tích phương thức/tiến độ thanh toán, yêu cầu về Bảo lãnh tạm ứng, và tính đầy đủ, hợp lệ của bộ chứng từ thanh toán.',
            },
            {
                id: '4.3',
                code: '4.3',
                title: 'Điều khoản điều chỉnh giá và rủi ro biến động thị trường',
                aiPrompt:
                    'Kiểm tra sự hiện diện và tính rõ ràng của điều khoản điều chỉnh giá (theo vật liệu, tỷ giá), đánh giá rủi ro nếu thiếu.',
            },
            {
                id: '4.4',
                code: '4.4',
                title: 'Rủi ro tỷ giá, chi phí phát sinh và phân bổ chi phí',
                aiPrompt:
                    'Kiểm tra đồng tiền thanh toán, cơ chế xử lý rủi ro tỷ giá, và xác định trách nhiệm phân bổ các chi phí phát sinh.',
            },
            {
                id: '4.5',
                code: '4.5',
                title: 'Bảo lãnh, đảm bảo hợp đồng và bảo hiểm hàng hóa',
                aiPrompt:
                    'Kiểm tra các yêu cầu về Bảo lãnh (thực hiện, tạm ứng, bảo hành) và trách nhiệm Bảo hiểm hàng hóa/rủi ro.',
            },
            {
                id: '4.6',
                code: '4.6',
                title: 'So sánh giá thị trường & đề xuất phương án đàm phán',
                aiPrompt:
                    'So sánh giá hợp đồng với giá thị trường/NCC khác, xác định rủi ro giá bất thường, và đề xuất phương án đàm phán giá tối ưu.',
            },
        ],
    },
];

// ─── Contract Types (Section 7.5) ─────────────────────────────────────────────
export const CONTRACT_TYPES: ContractType[] = [
    {
        code: '7.5.1',
        title: 'Hợp đồng mua bán hàng hóa, vật tư và thiết bị',
        checklistRef: 'Checklist 7.5.1',
        aiPrompt:
            'Kiểm tra hợp đồng mua bán hàng hóa, vật tư và thiết bị này theo Checklist 7.5.1 và xác định các điểm thiếu, không rõ ràng.',
    },
    {
        code: '7.5.2',
        title: 'Hợp đồng thi công xây dựng công trình',
        checklistRef: 'Checklist 7.5.2',
        aiPrompt:
            'Kiểm tra hợp đồng thi công xây dựng công trình này theo Checklist 7.5.2 và xác định các điểm thiếu, không rõ ràng.',
    },
    {
        code: '7.5.3',
        title: 'Hợp đồng tư vấn thiết kế công trình',
        checklistRef: 'Checklist 7.5.3',
        aiPrompt:
            'Kiểm tra hợp đồng tư vấn thiết kế công trình này theo Checklist 7.5.3 và xác định các điểm thiếu, không rõ ràng.',
    },
    {
        code: '7.5.4',
        title: 'Thỏa thuận bảo mật (NDA)',
        checklistRef: 'Checklist 7.5.4',
        aiPrompt: 'Kiểm tra Thỏa thuận bảo mật (NDA) này theo Checklist 7.5.4 và xác định các điểm thiếu, không rõ ràng.',
    },
    {
        code: '7.5.5',
        title: 'Biên bản ghi nhớ (MOU)',
        checklistRef: 'Checklist 7.5.5',
        aiPrompt: 'Kiểm tra Biên bản ghi nhớ (MOU) này theo Checklist 7.5.5 và xác định các điểm thiếu, không rõ ràng.',
    },
    {
        code: '7.5.6',
        title: 'Hợp đồng hợp tác kinh doanh (BCC)',
        checklistRef: 'Checklist 7.5.6',
        aiPrompt:
            'Kiểm tra hợp đồng hợp tác kinh doanh (BCC) này theo Checklist 7.5.6 và xác định các điểm thiếu, không rõ ràng.',
    },
    {
        code: '7.5.7',
        title: 'Hợp đồng tín dụng',
        checklistRef: 'Checklist 7.5.7',
        aiPrompt: 'Kiểm tra hợp đồng tín dụng này theo Checklist 7.5.7 và xác định các điểm thiếu, không rõ ràng.',
    },
    {
        code: '7.5.8',
        title: 'Hợp đồng bảo lãnh',
        checklistRef: 'Checklist 7.5.8',
        aiPrompt: 'Kiểm tra hợp đồng bảo lãnh này theo Checklist 7.5.8 và xác định các điểm thiếu, không rõ ràng.',
    },
    {
        code: '7.5.9',
        title: 'Hợp đồng thế chấp tài sản',
        checklistRef: 'Checklist 7.5.9',
        aiPrompt:
            'Kiểm tra hợp đồng thế chấp tài sản này theo Checklist 7.5.9 và xác định các điểm thiếu, không rõ ràng.',
    },
    {
        code: '7.5.10',
        title: 'Hợp đồng bảo hiểm giai đoạn xây dựng',
        checklistRef: 'Checklist 7.5.10',
        aiPrompt:
            'Kiểm tra hợp đồng bảo hiểm giai đoạn xây dựng này theo Checklist 7.5.10 và xác định các điểm thiếu, không rõ ràng.',
    },
    {
        code: '7.5.11',
        title: 'Hợp đồng bảo hiểm giai đoạn vận hành',
        checklistRef: 'Checklist 7.5.11',
        aiPrompt:
            'Kiểm tra hợp đồng bảo hiểm giai đoạn vận hành này theo Checklist 7.5.11 và xác định các điểm thiếu, không rõ ràng.',
    },
    {
        code: '7.5.12',
        title: 'Hợp đồng Giao Khoán',
        checklistRef: 'Checklist 7.5.12',
        aiPrompt:
            'Kiểm tra Hợp đồng Giao Khoán này theo Checklist 7.5.12 và xác định các điểm thiếu, không rõ ràng về phạm vi công việc, đơn giá khoán, nghiệm thu và điều khoản thanh toán.',
    },

];

// ─── Tab definitions ───────────────────────────────────────────────────────────
export const TABS: { label: TabCategory; code: string }[] = [
    { label: 'Vận hành', code: '1' },
    { label: 'Pháp lý', code: '2' },
    { label: 'Kỹ thuật', code: '3' },
    { label: 'Tài chính', code: '4' },
];

// ─── Mock Risk Data ────────────────────────────────────────────────────────────
export const MOCK_RISKS: RiskCard[] = [
    {
        id: 'r1',
        categoryCode: '1',
        subcategoryCode: '1.2',
        tab: 'Vận hành',
        level: 'High',
        pageRef: 23,
        issue:
            'Thiếu điều khoản Bất khả kháng (Force Majeure) cụ thể. Hợp đồng không định nghĩa rõ các sự kiện được coi là bất khả kháng, gây rủi ro tranh chấp khi có sự cố.',
        recommendation:
            'Bổ sung điều khoản Force Majeure theo mẫu chuẩn, liệt kê các sự kiện cụ thể: thiên tai, dịch bệnh, bạo loạn, lệnh của cơ quan nhà nước. Quy định rõ thời gian thông báo (tối đa 7 ngày).',
        suggestedText:
            'Điều XX. Bất khả kháng\n1. Sự kiện bất khả kháng là sự kiện xảy ra một cách khách quan, không thể lường trước và không thể khắc phục được mặc dù đã áp dụng mọi biện pháp cần thiết, bao gồm: thiên tai, hỏa hoạn, lũ lụt, động đất, dịch bệnh, chiến tranh, bạo loạn, hoặc quyết định của cơ quan nhà nước có thẩm quyền.\n2. Bên bị ảnh hưởng bởi sự kiện bất khả kháng phải thông báo bằng văn bản cho bên còn lại trong vòng 07 (bảy) ngày kể từ ngày xảy ra sự kiện.',
    },
    {
        id: 'r2',
        categoryCode: '1',
        subcategoryCode: '1.4',
        tab: 'Vận hành',
        level: 'Medium',
        pageRef: 7,
        issue:
            'KPI nghiệm thu chỉ ghi "chất lượng tốt" mà không có thước đo cụ thể (%, thời gian phản hồi, tỷ lệ lỗi). Gây khó khăn trong việc đánh giá và tranh chấp sau này.',
        recommendation:
            'Bổ sung phụ lục KPI chi tiết: tỷ lệ lỗi < 0.5%, thời gian phản hồi sự cố < 4h, uptime đạt ≥ 99.5%. Kèm theo cơ chế phạt khi không đạt.',
        suggestedText:
            'Phụ lục KPI – Tiêu chí Nghiệm thu:\n- Tỷ lệ lỗi sản phẩm: ≤ 0,5% trên tổng số lượng giao hàng.\n- Thời gian phản hồi sự cố: ≤ 4 giờ kể từ khi nhận thông báo.\n- Uptime hệ thống (nếu có): ≥ 99,5%/tháng.\n- Tiến độ giao hàng: đúng ngày ký kết, sai lệch không quá 02 ngày làm việc.\nTrong trường hợp không đạt KPI, Bên B chịu phạt 0,1% giá trị hợp đồng cho mỗi chỉ tiêu không đạt.',
    },
    {
        id: 'r3',
        categoryCode: '2',
        subcategoryCode: '2.3',
        tab: 'Pháp lý',
        level: 'High',
        pageRef: 15,
        issue:
            'Điều khoản bồi thường vi phạm hợp đồng không giới hạn mức tối đa. Theo Luật Thương mại 2005, mức phạt vi phạm không quá 8% giá trị phần nghĩa vụ bị vi phạm.',
        recommendation:
            'Bổ sung Liability Cap: mức phạt vi phạm tối đa 8% giá trị hợp đồng theo Điều 301 Luật Thương mại 2005. Tách biệt điều khoản phạt vi phạm và bồi thường thiệt hại.',
        suggestedText:
            'Điều XX. Phạt vi phạm và Bồi thường thiệt hại\n1. Trường hợp một bên vi phạm nghĩa vụ hợp đồng, bên vi phạm phải chịu phạt vi phạm với mức phạt tối đa không vượt quá 8% (tám phần trăm) giá trị phần nghĩa vụ bị vi phạm, theo quy định tại Điều 301 Luật Thương mại 2005.\n2. Ngoài khoản phạt vi phạm, bên bị vi phạm có quyền yêu cầu bồi thường thiệt hại thực tế phát sinh do hành vi vi phạm gây ra.',
    },
    {
        id: 'r4',
        categoryCode: '2',
        subcategoryCode: '2.4',
        tab: 'Pháp lý',
        level: 'Medium',
        pageRef: 16,
        issue:
            'Điều khoản giải quyết tranh chấp chỉ ghi "tại tòa án có thẩm quyền" mà không chỉ định Tòa án cụ thể, có thể gây tranh cãi về thẩm quyền xét xử.',
        recommendation:
            'Xác định rõ: "Tòa án nhân dân [Tỉnh/Thành phố] nơi Bên A đặt trụ sở chính". Xem xét bổ sung phương án Trọng tài VIAC để giảm thời gian giải quyết.',
        suggestedText:
            'Điều XX. Giải quyết tranh chấp\n1. Hai bên cam kết giải quyết mọi tranh chấp phát sinh từ hoặc liên quan đến Hợp đồng này thông qua thương lượng, hòa giải thiện chí trong thời hạn 30 ngày.\n2. Trường hợp không thương lượng được, tranh chấp sẽ được giải quyết tại Tòa án nhân dân Thành phố Hồ Chí Minh, theo quy định của pháp luật Việt Nam.',
    },
    {
        id: 'r5',
        categoryCode: '3',
        subcategoryCode: '3.3',
        tab: 'Kỹ thuật',
        level: 'Medium',
        pageRef: 5,
        issue:
            'Hợp đồng viện dẫn tiêu chuẩn "IEC 60947" nhưng không ghi rõ phiên bản năm. Tiêu chuẩn IEC có nhiều phiên bản cập nhật (2014, 2020) với yêu cầu kỹ thuật khác nhau.',
        recommendation:
            'Ghi rõ phiên bản tiêu chuẩn: "IEC 60947-2:2020" hoặc "TCVN tương đương mới nhất". Bổ sung điều khoản: nếu tiêu chuẩn được cập nhật trong thời hạn hợp đồng, áp dụng phiên bản nào.',
        suggestedText:
            'Thiết bị phải đáp ứng tiêu chuẩn kỹ thuật IEC 60947-2:2020 (hoặc TCVN 6592-2:2009 tương đương). Trong trường hợp tiêu chuẩn được cập nhật trong thời hạn thực hiện Hợp đồng, các bên sẽ thống nhất áp dụng phiên bản hiệu lực tại thời điểm ký kết Hợp đồng, trừ khi có thỏa thuận khác bằng văn bản.',
    },
    {
        id: 'r6',
        categoryCode: '4',
        subcategoryCode: '4.3',
        tab: 'Tài chính',
        level: 'High',
        pageRef: 26,
        issue:
            'Không có điều khoản điều chỉnh giá trong khi hợp đồng kéo dài 24 tháng. Biến động giá nguyên vật liệu và tỷ giá có thể làm tăng chi phí lên đến 15-20%.',
        recommendation:
            'Bổ sung Price Adjustment Clause: cho phép điều chỉnh giá nếu giá nguyên vật liệu thay đổi > 5% so với thời điểm ký kết, dựa trên chỉ số giá CPI công bố bởi Tổng cục Thống kê.',
        suggestedText:
            'Điều XX. Điều chỉnh giá\n1. Giá hợp đồng được xem xét điều chỉnh trong trường hợp chỉ số giá nguyên vật liệu chính (theo công bố của Tổng cục Thống kê Việt Nam) biến động vượt quá 5% so với thời điểm ký kết.\n2. Đề xuất điều chỉnh giá phải được lập thành văn bản và có xác nhận của cả hai bên. Mức điều chỉnh tối đa không vượt quá 10% giá trị hợp đồng trong suốt thời gian thực hiện.',
    },
    {
        id: 'r7',
        categoryCode: '4',
        subcategoryCode: '4.4',
        tab: 'Tài chính',
        level: 'Medium',
        pageRef: 27,
        issue:
            'Hợp đồng thanh toán bằng USD nhưng không có cơ chế xử lý rủi ro tỷ giá. Nếu VND/USD biến động > 3%, một bên sẽ chịu thiệt hại đáng kể.',
        recommendation:
            'Bổ sung điều khoản chốt tỷ giá tại ngày ký hoặc sử dụng tỷ giá giao dịch thực tế tại Vietcombank vào ngày thanh toán. Xem xét chia sẻ rủi ro tỷ giá theo tỷ lệ 50/50.',
        suggestedText:
            'Điều XX. Tỷ giá thanh toán\nCác khoản thanh toán bằng USD trong Hợp đồng này sẽ được quy đổi theo tỷ giá mua vào của Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank) tại ngày thanh toán thực tế. Trong trường hợp tỷ giá USD/VND thay đổi vượt quá 3% so với tỷ giá tại ngày ký kết Hợp đồng, hai bên sẽ thương lượng chia sẻ phần chênh lệch theo tỷ lệ 50/50.',
    },
];
