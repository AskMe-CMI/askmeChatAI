"use client"

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Array of presentation images
const PRESENTATION_IMAGES = Array.from({ length: 14 }, (_, i) => ({
    src: `/images/present${String(i + 1).padStart(2, '0')}.jpg`,
    alt: `AskMe AI Gateway Presentation Slide ${i + 1}`
}));

export default function ChangeLogPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const router = useRouter();
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play functionality (7 seconds)
  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [currentIndex]);

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayRef.current = setTimeout(() => {
        paginate(1);
    }, 7000); // 7 seconds
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
        autoPlayRef.current = null;
    }
  };

  const handleManualNav = (newDirection: number) => {
    stopAutoPlay();
    paginate(newDirection);
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
        let nextIndex = prevIndex + newDirection;
        if (nextIndex < 0) nextIndex = PRESENTATION_IMAGES.length - 1;
        if (nextIndex >= PRESENTATION_IMAGES.length) nextIndex = 0;
        return nextIndex;
    });
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#020617] text-white overflow-hidden selection:bg-blue-500/30">
        
      {/* Background Ambience directly inspired by the image */}
      {/* Deep purple/blue base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#000000]" />
      
      {/* Left-side cyan/blue glow (The "AI" portal light source) */}
      <div className="absolute -left-[10%] top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen" />
      <div className="absolute -left-[5%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none opacity-50 mix-blend-screen" />

      {/* Subtle grid overlay (CSS only, no external file needed) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="absolute left-6 top-6 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md border border-white/5 shadow-lg group"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back
      </button>

      {/* Main Content Container */}
      <div className="relative w-full h-dvh flex flex-col pt-16 pb-12 px-4 md:px-12 z-10 justify-between">
        
        {/* Header */}
        <div className="text-center space-y-2 mt-4 mb-3">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
             <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                    ASKME AI GATEWAY
                </span>
                <br />
                {/* <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                    AI GATEWAY
                </span> */}
             </h1>
             <p className="text-blue-200/70 text-sm md:text-lg font-light tracking-wide max-w-3xl mx-auto" >
                ศูนย์กลางควบคุมการใช้งาน AI ขององค์กร ทั้ง On-prem และ Cloud อย่างปลอดภัยและตรวจสอบได้
             </p>
            </motion.div>
        </div>

        {/* Carousel Area */}
        <div 
            className="relative flex-1 w-full max-w-7xl mx-auto flex items-center justify-center px-4 md:px-20 my-6"
            onMouseEnter={stopAutoPlay}
            onMouseLeave={startAutoPlay}
        >
            {/* Navigation Buttons (Desktop) - Outside */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:flex rounded-full h-14 w-14 hover:bg-white/10 transition-all z-50 text-white/40 hover:text-white hover:scale-110 active:scale-95"
                onClick={() => handleManualNav(-1)}
            >
                <ChevronLeft className="h-10 w-10" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex rounded-full h-14 w-14 hover:bg-white/10 transition-all z-50 text-white/40 hover:text-white hover:scale-110 active:scale-95"
                onClick={() => handleManualNav(1)}
            >
                <ChevronRight className="h-10 w-10" />
            </Button>

            {/* Image Container */}
            <div className="relative w-full h-[50vh] md:h-[60vh] p-0.5 rounded-2xl bg-gradient-to-b from-blue-500/30 to-purple-500/10 backdrop-blur-md shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]">
                <div className="relative w-full h-full overflow-hidden rounded-xl bg-[#020617]/80 backdrop-blur-sm">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.img
                            key={currentIndex}
                            src={PRESENTATION_IMAGES[currentIndex].src}
                            alt={PRESENTATION_IMAGES[currentIndex].alt}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="absolute inset-0 w-full h-full object-contain"
                            draggable={false}
                        />
                    </AnimatePresence>
                </div>
            </div>
        </div>

        {/* Footer & Navigation */}
        <div className="flex flex-col items-center gap-6">
             {/* Pagination Dots */}
             <div className="flex justify-center gap-2 flex-wrap px-6 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/5 shadow-lg">
                {PRESENTATION_IMAGES.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            const newDirection = idx > currentIndex ? 1 : -1;
                            setDirection(newDirection);
                            setCurrentIndex(idx);
                            stopAutoPlay();
                        }}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                            idx === currentIndex 
                                ? "w-8 bg-gradient-to-r from-blue-400 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]" 
                                : "w-1.5 bg-white/20 hover:bg-white/50"
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
             </div>

             {/* Website Link (from image ref) */}
             <div className="text-white/30 text-sm font-light tracking-widest hover:text-white/60 transition-colors cursor-default">
                www.askme.co.th
             </div>
        </div>

      </div>
    </div>
  );
}
