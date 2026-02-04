'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    alt?: string;
}

export function ImagePreviewModal({
    isOpen,
    onClose,
    url,
    alt = 'Image preview',
}: ImagePreviewModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    // Debug: log the URL to check if it's correct
    console.log('ImagePreviewModal URL:', url);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="image-preview-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50"
                    onClick={onClose}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        aria-label="Close preview"
                    >
                        <X size={24} />
                    </button>

                    <motion.img
                        key="image-preview-content"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        src={url}
                        alt={alt}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            objectFit: 'contain',
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

