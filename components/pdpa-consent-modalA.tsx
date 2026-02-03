'use client';

import { useEffect, useState } from 'react';

export function PDPAConsentModalAlt({ onAccept }: { onAccept?: (marketingConsent: boolean) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const [isAcknowledged, setIsAcknowledged] = useState(false);

    useEffect(() => {
        setIsOpen(true);
    }, []);

    const handleAccept = () => {
        if (isAccepted && isAcknowledged) {
            localStorage.setItem('pdpa-consent-alt', 'true');
            localStorage.setItem('pdpa-consent-alt-date', new Date().toISOString());

            if (onAccept) {
                onAccept(true);
            }
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col md:mx-4">
                {/* Header */}
                <div className="flex items-center gap-3 p-6 border-b shrink-0">
                    <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600 dark:text-teal-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            นโยบายความเป็นส่วนตัวและการขอความยินยอม
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">สำหรับบริการ Cloud Drive - Demo Version</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="text-sm text-muted-foreground leading-relaxed space-y-6">

                        {/* Company Info */}
                        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4">
                            <h3 className="font-semibold text-foreground mb-2">ผู้ควบคุมข้อมูลส่วนบุคคล:</h3>
                            <p className="font-medium text-foreground">บริษัท อาซ์คมี โซลูชั่น แอนด์ คอนซัลแทนท์ จำกัด</p>
                            <p>เลขที่ 108 อาคารบางกอกไทยทาวเวอร์ ชั้น 8 ห้อง 801 ถนนรางน้ำ แขวงถนนพญาไท เขตราชเทวี กรุงเทพฯ 10400</p>
                            <p>โทรศัพท์: 02-245-1335</p>
                            <p>อีเมล: dpo@askme.co.th</p>
                            <p>เว็บไซต์: www.askme.co.th</p>
                        </div>

                        {/* Section 1 */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">1. วัตถุประสงค์ในการเก็บรวบรวมข้อมูล</h3>
                            <p className="mb-2">บริษัทขอเก็บรวบรวมข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ดังต่อไปนี้:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>จัดสร้างและบริหารจัดการบัญชีผู้ใช้งาน เพื่อให้ท่านสามารถเข้าถึงและใช้บริการได้อย่างมีประสิทธิภาพ</li>
                                <li>ให้บริการ Cloud Storage พร้อมดำเนินการประมวลผลข้อมูล เพื่อการตอบสนองและอำนวยความสะดวกแก่ท่าน</li>
                                <li>พัฒนาคุณภาพของบริการ โดยวิเคราะห์ข้อมูลเพื่อปรับปรุงและเพิ่มประสิทธิภาพของระบบให้ดียิ่งขึ้น</li>
                                <li>ติดต่อสื่อสารกับท่าน เพื่อแจ้งข้อมูลข่าวสาร อัพเดทบริการ หรือดำเนินการแก้ไขปัญหาต่าง ๆ ที่เกี่ยวข้องกับการใช้บริการ</li>
                            </ul>
                            <p className="mt-2 text-xs italic bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                                หมายเหตุ: บริการนี้เป็นการสาธิต (Demo) เพื่อใช้ในกิจกรรมทางการตลาดและนำเสนอความสามารถของเทคโนโลยี ทั้งนี้ การเก็บรวบรวมข้อมูลจะดำเนินการตามมาตรฐานความปลอดภัยและหลักปฏิบัติที่เกี่ยวข้อง
                            </p>
                        </div>

                        {/* Section 2 - Data Table */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">2. ข้อมูลที่เราเก็บรวบรวม</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse border border-gray-200 dark:border-gray-700">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-800">
                                            <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">ประเภทข้อมูล</th>
                                            <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">รายละเอียด</th>
                                            <th className="border border-gray-200 dark:border-gray-700 p-2 text-left">ฐานทางกฎหมาย</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-200 dark:border-gray-700 p-2">ข้อมูลบัญชีผู้ใช้</td>
                                            <td className="border border-gray-200 dark:border-gray-700 p-2">ชื่อ-นามสกุล, อีเมล, ชื่อผู้ใช้งาน, รหัสผ่าน (เข้ารหัส)</td>
                                            <td className="border border-gray-200 dark:border-gray-700 p-2">ความยินยอม + สัญญา</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-200 dark:border-gray-700 p-2">ข้อมูลการใช้งาน</td>
                                            <td className="border border-gray-200 dark:border-gray-700 p-2">ไฟล์ที่อัพโหลด (สำหรับ Cloud Drive), เวลาการใช้งาน</td>
                                            <td className="border border-gray-200 dark:border-gray-700 p-2">ความยินยอม</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-200 dark:border-gray-700 p-2">ข้อมูลทางเทคนิค</td>
                                            <td className="border border-gray-200 dark:border-gray-700 p-2">IP Address, ประเภทอุปกรณ์, Browser</td>
                                            <td className="border border-gray-200 dark:border-gray-700 p-2">ประโยชน์โดยชอบด้วยกฎหมาย (Legitimate Interest)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">3. การเก็บรักษาและรักษาความปลอดภัย</h3>
                            <p className="mb-2">ข้อมูลของท่านจะได้รับการเก็บรักษาไว้บนเซิร์ฟเวอร์ที่มีมาตรฐานความปลอดภัยสูง โดยมีการเข้ารหัสข้อมูล (Encryption) การควบคุมการเข้าถึง (Access Control) และระบบไฟร์วอลล์ (Firewall) อย่างเข้มงวด</p>
                            <p className="mb-2">ระยะเวลาในการจัดเก็บข้อมูลมีรายละเอียดดังนี้:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>ข้อมูลบัญชีผู้ใช้: จะถูกเก็บรักษาตลอดระยะเวลาที่ท่านใช้บริการ และจะดำเนินการลบข้อมูลภายใน 30 วันหลังจากที่ท่านได้ลบบัญชี</li>
                                <li>ข้อความสนทนา (Chat Logs): จะถูกเก็บไว้นานสูงสุด 90 วัน หรือจนกว่าท่านจะร้องขอให้ลบข้อมูล</li>
                                <li>สำหรับการใช้งานในเวอร์ชันสาธิต (Demo): ข้อมูลทั้งหมดจะถูกลบภายใน 180 วันหลังสิ้นสุดโครงการ Demo</li>
                            </ul>
                            <p className="mt-2">ทั้งนี้ รหัสผ่านของท่านจะได้รับการเข้ารหัสด้วยวิธีแบบทางเดียว (Hashing) ที่ไม่สามารถถอดรหัสกลับมาได้ เพื่อเสริมสร้างความปลอดภัยสูงสุดให้กับข้อมูลส่วนบุคคลของท่าน</p>
                        </div>

                        {/* Section 4 */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">4. การเปิดเผยข้อมูล</h3>
                            <p className="mb-2">บริษัทฯ ให้ความสำคัญกับความเป็นส่วนตัวของข้อมูลของท่านเป็นอย่างยิ่ง และจะไม่เปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลภายนอก เว้นแต่ในกรณีดังต่อไปนี้:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>ได้รับความยินยอมจากท่านโดยชัดแจ้ง</li>
                                <li>มีข้อกำหนดทางกฎหมาย หรือคำสั่งของหน่วยงานที่มีอำนาจ เช่น ศาล หรือองค์กรของรัฐที่เกี่ยวข้อง</li>
                                <li>การเปิดเผยต่อผู้ให้บริการโครงสร้างพื้นฐานระบบ (Cloud Provider) ซึ่งอยู่ภายใต้ข้อตกลงการรักษาความลับอย่างเคร่งครัด</li>
                            </ul>
                            <p className="mt-2">สำหรับการใช้งานผ่าน AI Gateway: ข้อมูลของท่านอาจถูกส่งต่อไปยังผู้ให้บริการ AI รายอื่น (เช่น OpenAI, Anthropic) เพื่อดำเนินการประมวลผลและจัดเตรียมคำตอบให้แก่ท่าน ทั้งนี้ กรุณาศึกษาและพิจารณานโยบายความเป็นส่วนตัวของผู้ให้บริการดังกล่าวโดยละเอียดก่อนใช้งาน</p>
                        </div>

                        {/* Section 5 */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">5. ข้อจำกัดความรับผิดชอบ</h3>
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 space-y-2">
                                <p><strong>ข้อควรทราบ:</strong> บริการนี้เป็นเวอร์ชั่นสาธิต (Demo Version) จัดทำขึ้นเพื่อวัตถุประสงค์ในการทดลองใช้งานและสาธิตความสามารถของระบบเท่านั้น</p>
                                <p>ข้อมูลและคำตอบที่ได้จากระบบ AI อาจมีความคลาดเคลื่อน ไม่ครบถ้วน หรืออาจไม่เป็นปัจจุบันเสมอ จึงไม่ควรนำไปใช้เป็นข้อมูลอ้างอิงหรือข้อเสนอแนะในด้านวิชาชีพ ไม่ว่าจะเป็นการแพทย์ กฎหมาย การเงิน หรือภาษี ทั้งนี้ผู้ใช้ควรตรวจสอบและใช้ดุลยพินิจอย่างรอบคอบก่อนนำข้อมูลไปใช้ในทางปฏิบัติ</p>
                                <p>บริษัทฯ ไม่รับรองความพร้อมใช้งานของระบบ (Uptime) ในระดับ 100% และขอสงวนสิทธิ์ในการปฏิเสธความรับผิดชอบต่อความเสียหายที่อาจเกิดขึ้นจากการใช้งานบริการนี้</p>
                                <p>ผู้ใช้เป็นผู้รับผิดชอบต่อเนื้อหา ข้อมูล หรือไฟล์ที่ได้อัปโหลดหรือส่งผ่านเข้าสู่ระบบด้วยตนเองแต่เพียงผู้เดียว</p>
                            </div>
                        </div>

                        {/* Section 6 */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">6. สิทธิของท่านภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)</h3>
                            <p className="mb-2">บริษัทฯ เคารพและให้ความสำคัญต่อสิทธิของท่านตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 โดยท่านมีสิทธิ์ดำเนินการเกี่ยวกับข้อมูลส่วนบุคคลของท่าน ดังต่อไปนี้:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><strong>สิทธิเข้าถึงข้อมูล</strong> – ท่านสามารถร้องขอเข้าดูข้อมูลส่วนบุคคลของท่านที่บริษัทฯ จัดเก็บไว้</li>
                                <li><strong>สิทธิแก้ไขข้อมูล</strong> – ท่านมีสิทธิ์ขอให้บริษัทฯแก้ไขหรือปรับปรุงข้อมูลที่ไม่ถูกต้องหรือไม่สมบูรณ์ให้ถูกต้องเป็นปัจจุบัน</li>
                                <li><strong>สิทธิลบข้อมูล</strong> – ท่านสามารถร้องขอให้บริษัทฯลบข้อมูลส่วนบุคคลของท่าน ยกเว้นกรณีที่บริษัทฯจำเป็นต้องเก็บรักษาข้อมูลตามข้อกฎหมายที่เกี่ยวข้อง</li>
                                <li><strong>สิทธิคัดค้านการประมวลผลข้อมูล</strong> – ท่านมีสิทธิ์ในการคัดค้านการประมวลผลข้อมูลส่วนบุคคลในบางวัตถุประสงค์ตามที่กฎหมายกำหนด</li>
                                <li><strong>สิทธิเพิกถอนความยินยอม</strong> – ท่านสามารถเพิกถอนความยินยอมในการประมวลผลข้อมูลส่วนบุคคลได้ทุกเมื่อ โดยไม่ส่งผลกระทบต่อการประมวลผลที่เกิดขึ้นก่อนการเพิกถอน</li>
                                <li><strong>สิทธิขอรับข้อมูล</strong> – ท่านสามารถร้องขอรับสำเนาข้อมูลส่วนบุคคลของท่านในรูปแบบอิเล็กทรอนิกส์ตามที่บริษัทฯกำหนด</li>
                            </ul>
                            <p className="mt-2">หากท่านประสงค์จะใช้สิทธิข้างต้น กรุณาติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) ผ่านทางอีเมล <a href="mailto:dpo@askme.co.th" className="text-teal-600 hover:underline">dpo@askme.co.th</a> ทั้งนี้บริษัทฯจะดำเนินการตามคำขอของท่านโดยเร็วที่สุดตามข้อกำหนดของกฎหมาย</p>
                        </div>

                        {/* Section 7 - Consent */}
                        <div className="mt-6 pt-6 border-t space-y-4">
                            <h3 className="font-semibold text-foreground">7. การให้ความยินยอม</h3>

                            {/* Checkbox 1 - Required */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isAccepted}
                                    onChange={(e) => setIsAccepted(e.target.checked)}
                                    className="shrink-0 mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                    ข้าพเจ้าให้ความยินยอมแก่บริษัท อาซ์คมี โซลูชั่น แอนด์ คอนซัลแทนท์ จำกัด ในการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้า ตามที่ระบุไว้ในนโยบายความเป็นส่วนตัวฉบับนี้ เพื่อวัตถุประสงค์ในการให้บริการ Cloud Drive Demo
                                </span>
                            </label>

                            {/* Checkbox 2 - Required */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isAcknowledged}
                                    onChange={(e) => setIsAcknowledged(e.target.checked)}
                                    className="shrink-0 mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                    ข้าพเจ้าขอรับทราบและเข้าใจว่า:
                                    <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                                        <li>บริการนี้เป็นบริการสาธิต (Demo) มิใช่บริการในเชิงพาณิชย์เต็มรูปแบบ</li>
                                        <li>คำตอบหรือข้อมูลที่ได้รับจากระบบ AI อาจมีความคลาดเคลื่อนหรือไม่ครบถ้วน</li>
                                        <li>ข้าพเจ้าสามารถเพิกถอนความยินยอมในการให้ข้อมูลส่วนบุคคลได้ตลอดเวลา ตามช่องทางที่บริษัทกำหนด</li>
                                    </ul>
                                    <span className="block mt-1">ข้าพเจ้าขอยืนยันว่าข้าพเจ้าได้อ่านและยอมรับข้อกำหนดและเงื่อนไขการให้บริการ (Terms of Service) ของบริษัทโดยครบถ้วนแล้ว</span>
                                </span>
                            </label>

                            <div className="flex items-center justify-end pt-4 border-t">
                                <button
                                    onClick={handleAccept}
                                    disabled={!isAccepted || !isAcknowledged}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${isAccepted && isAcknowledged
                                        ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                                        }`}
                                >
                                    ยอมรับและลงทะเบียน
                                </button>
                            </div>

                            <p className="text-xs text-muted-foreground text-center font-semibold">
                                วันที่มีผลบังคับใช้: {new Date().toLocaleDateString('th-TH')} | เวอร์ชั่น: 1.0b (สำหรับการสาธิต)
                            </p>

                            <p className="text-xs text-muted-foreground text-center">
                                หากท่านไม่ประสงค์จะยอมรับเงื่อนไขดังกล่าว ท่านสามารถเลือกที่จะไม่ใช้บริการนี้ได้<br />
                                หากมีข้อสงสัยหรือประสงค์สอบถามข้อมูลเพิ่มเติม กรุณาติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล ทางอีเมล: <a href="mailto:dpo@askme.co.th" className="text-teal-600 hover:underline">dpo@askme.co.th</a>
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
