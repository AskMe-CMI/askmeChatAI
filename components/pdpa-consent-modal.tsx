'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function PDPAConsentModal({ onAccept }: { onAccept?: (marketingConsent: boolean) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const [isMarketingAccepted, setIsMarketingAccepted] = useState(false);

    useEffect(() => {
        // Always show modal for testing/demo as requested
        setIsOpen(true);
    }, []);

    const handleAccept = () => {
        if (isAccepted) {
            localStorage.setItem('pdpa-consent', 'true');
            localStorage.setItem('pdpa-consent-date', new Date().toISOString());
            localStorage.setItem('pdpa-marketing-consent', isMarketingAccepted.toString());

            if (onAccept) {
                onAccept(isMarketingAccepted);
            }
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-4xl mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">
                            ข้อตกลงการใช้งานและนโยบายความเป็นส่วนตัว
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">โปรดอ่านและทำความเข้าใจก่อนลงทะเบียน</p>
                    </div>
                </div>

                {/* Content - Full Height (No inner scroll unless necessary) */}
                <div className="mb-6 border rounded-xl p-5 bg-gray-50 dark:bg-zinc-800/50 text-sm text-muted-foreground leading-relaxed space-y-5">
                    <div>
                        <strong className="text-foreground block mb-1">1. บทนำ</strong>
                        <p>ข้อตกลงนี้ทำขึ้นระหว่าง ผู้ให้บริการ ("เรา") และ ผู้ขอใช้บริการ ("ท่าน") เพื่อกำหนดสิทธิและหน้าที่ในการใช้งานแอปพลิเคชัน AI Chat การสมัครสมาชิกถือว่าท่านยอมรับข้อตกลงนี้ทุกประการ</p>
                    </div>

                    <div>
                        <strong className="text-foreground block mb-1">2. การเก็บรวบรวมข้อมูลส่วนบุคคล</strong>
                        <p>เพื่อการให้บริการที่มีประสิทธิภาพ เรามีความจำเป็นต้องเก็บรวบรวมข้อมูลของท่าน ดังนี้:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li><strong>ข้อมูลยืนยันตัวตน:</strong> ชื่อ-นามสกุล, อีเมล, ชื่อผู้ใช้งาน (Username) และรหัสผ่าน (Password)</li>
                            <li><strong>ข้อมูลการใช้งาน:</strong> ประวัติการสนทนา (Chat History) ระหว่างท่านกับ AI, ข้อมูลจราจรทางคอมพิวเตอร์ (Log Files), และเวลาการเข้าใช้งาน</li>
                        </ul>
                    </div>

                    <div>
                        <strong className="text-foreground block mb-1">3. วัตถุประสงค์การใช้ข้อมูล</strong>
                        <p>เราจะประมวลผลข้อมูลของท่านเพื่อ:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>ยืนยันตัวตนและรักษาความปลอดภัยของบัญชีผู้ใช้</li>
                            <li>บันทึกและเรียกดูประวัติการสนทนาย้อนหลังเพื่อความต่อเนื่องในการใช้งาน</li>
                            <li>วิเคราะห์และปรับปรุงประสิทธิภาพของระบบ AI (ในรูปแบบที่ไม่ระบุตัวตน หากมีการนำไปใช้)</li>
                            <li>ติดต่อสื่อสารแจ้งเตือนเกี่ยวกับบัญชี หรือการเปลี่ยนแปลงบริการ</li>
                        </ul>
                    </div>

                    <div>
                        <strong className="text-foreground block mb-1">4. การรักษาความมั่นคงปลอดภัย</strong>
                        <p>เราเราใช้มาตรการทางเทคนิคและการบริหารจัดการตามมาตรฐานสากล เพื่อป้องกันการเข้าถึง แก้ไข หรือเปิดเผยข้อมูลของท่านโดยมิชอบ</p>
                    </div>

                    <div>
                        <strong className="text-foreground block mb-1">5. สิทธิของเจ้าของข้อมูล</strong>
                        <p>ท่านมีสิทธิในการขอเข้าถึง แก้ไข ลบ หรือระงับการใช้ข้อมูลส่วนบุคคลของท่านได้ตามที่กฎหมายกำหนด โดยติดต่อผ่านช่องทางที่เราระบุไว้</p>
                    </div>
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-3 pt-2 border-t">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={isAccepted}
                                onChange={(e) => setIsAccepted(e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-blue-600 checked:bg-blue-600 dark:border-zinc-600 dark:checked:bg-blue-500"
                            />
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-sm text-foreground select-none group-hover:text-blue-600 transition-colors">
                            <span className="font-semibold text-red-500 mr-1">(จำเป็น)</span>
                            ข้าพเจ้าได้อ่านและยอมรับข้อตกลงและเงื่อนไขข้างต้นทุกประการ
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={isMarketingAccepted}
                                onChange={(e) => setIsMarketingAccepted(e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-blue-600 checked:bg-blue-600 dark:border-zinc-600 dark:checked:bg-blue-500"
                            />
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-sm text-foreground select-none group-hover:text-blue-600 transition-colors">
                            <span className="text-muted-foreground mr-1">(ไม่บังคับ)</span>
                            ข้าพเจ้ายินยอมให้ผู้ให้บริการส่งข่าวสาร โปรโมชั่น และสิทธิพิเศษทางการตลาดไปยังอีเมลของข้าพเจ้า
                        </span>
                    </label>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end">
                    <Button
                        onClick={handleAccept}
                        disabled={!isAccepted}
                        className={`w-full sm:w-auto px-8 py-2 font-medium transition-all ${isAccepted
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/30'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600'
                            }`}
                    >
                        ยอมรับและลงทะเบียน
                    </Button>
                </div>
            </div>
        </div>
    );
}
