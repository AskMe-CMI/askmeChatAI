'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function PDPAConsentModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);

    useEffect(() => {
        // Always show modal for testing
        // TODO: Uncomment localStorage check for production
        // const hasConsented = localStorage.getItem('pdpa-consent');
        // if (!hasConsented) {
        //     setIsOpen(true);
        // }
        setIsOpen(true);
    }, []);

    const handleAccept = () => {
        if (isAccepted) {
            localStorage.setItem('pdpa-consent', 'true');
            localStorage.setItem('pdpa-consent-date', new Date().toISOString());
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                        ความยินยอมในการเก็บข้อมูลส่วนบุคคล
                    </h2>
                </div>

                {/* PDPA Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium mb-4">
                    <span>🛡️</span>
                    <span>PDPA Compliance</span>
                </div>

                {/* Content */}
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                    <p>
                        คุณให้ความยินยอมในการเก็บรวบรวม ใช้ และประมวลผลข้อมูลส่วนบุคคลของคุณตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
                    </p>
                    <p>
                        เพื่อใช้ในกระบวนการลงทะเบียนและการตรวจสอบตัวตนด้วยเทคโนโลยีจดจำใบหน้าสำหรับงานสัมมนา{' '}
                        <span className="font-semibold text-foreground">
                            AskMe Solutions | CyberX 2025: Beyond Boundaries (Next-Level AI & Cybersecurity Without Limits)
                        </span>{' '}
                        วันที่ 14 มีนาคม 2568 เท่านั้น
                    </p>
                    <p>
                        ข้อมูลของคุณจะไม่ถูกนำไปใช้เพื่อวัตถุประสงค์อื่นใดและจะถูกลบหลังเสร็จสิ้นงานสัมมนา
                    </p>
                    <p>
                        คุณมีสิทธิ์เพิกถอนความยินยอมนี้ได้ตลอดเวลาโดยไม่ส่งผลกระทบต่อความชอบด้วยกฎหมายของการประมวลผลข้อมูลที่เกิดขึ้นก่อนการเพิกถอน
                    </p>
                    <p>
                        รายละเอียดเพิ่มเติมเกี่ยวกับสิทธิ์ของคุณและมาตรการคุ้มครองข้อมูลส่วนบุคคลสามารถติดต่อได้ที่{' '}
                        <a
                            href="mailto:salescmi@askme.co.th"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            salescmi@askme.co.th
                        </a>
                    </p>
                </div>

                {/* Consent Checkbox */}
                <div className="mt-5 pt-4 border-t">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isAccepted}
                            onChange={(e) => setIsAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-zinc-600"
                        />
                        <span className="text-sm text-foreground">
                            ข้าพเจ้ายินยอมให้เก็บรวบรวมข้อมูลตามที่ระบุข้างต้น
                        </span>
                    </label>
                </div>

                {/* Actions */}
                <div className="mt-5 flex justify-end">
                    <Button
                        onClick={handleAccept}
                        disabled={!isAccepted}
                        className={`px-6 ${isAccepted
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-400'
                            }`}
                    >
                        ดำเนินการต่อ
                    </Button>
                </div>
            </div>
        </div>
    );
}
