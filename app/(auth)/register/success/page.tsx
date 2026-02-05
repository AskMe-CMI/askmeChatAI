import { CheckCircle } from 'lucide-react';

export default function RegisterSuccessPage() {
    return (
        <div className="flex h-dvh w-screen items-center justify-center px-4">
            <div className="w-full max-w-md p-[3rem] flex flex-col items-center text-center gap-6 bg-[#fbfaf4] dark:bg-card text-foreground dark:text-card-foreground rounded-[16px] shadow-lg shadow-[#F9D0AC]/25 dark:shadow-none border border-[#F9D0AC] dark:border-border">
                <CheckCircle size={60} className="text-[#0fa2b1] dark:text-[#0fa2b1]" />
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold">ลงทะเบียนสำเร็จ</h1>
                    <p className="text-muted-foreground">
                        ระบบได้ส่งรายละเอียดการใช้งานและวันหมดอายุไปทางอีเมลแล้ว
                    </p>
                </div>
            </div>
        </div>
    );
}
