'use client';

/**
 * Credit Check Button
 * Floating button at bottom-right corner for checking Credit/Token usage
 * Panel displays above button with no overlay background
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Mock data - will be replaced with real API when backend is ready
const MOCK_CREDITS = {
    used: 63500,
    limit: 100000,
    remaining: 36500,
    resetDate: '2026-02-01',
};

export function CreditCheckButton() {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Close panel when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                panelRef.current &&
                buttonRef.current &&
                !panelRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // TODO: Replace with useSWR when API is ready
    const credits = MOCK_CREDITS;
    const percentage = (credits.used / credits.limit) * 100;

    // Color based on remaining percentage
    const remainingPercent = 100 - percentage;

    const getStatusColor = () => {
        if (remainingPercent < 20) return 'text-red-500';
        if (remainingPercent <= 50) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getProgressColor = () => {
        if (remainingPercent < 20) return 'bg-red-500';
        if (remainingPercent <= 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const formatNumber = (num: number) => num.toLocaleString();

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Panel - displays above button */}
            {isOpen && (
                <div
                    ref={panelRef}
                    className="absolute bottom-16 right-0 w-80 bg-background border rounded-lg shadow-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Credit / Token Usage</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-muted-foreground hover:text-foreground text-lg leading-none"
                        >
                            ×
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className={getStatusColor()}>{(100 - percentage).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${getProgressColor()}`}
                                style={{ width: `${Math.max(100 - percentage, 0)}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-muted/50 space-y-0.5">
                            <div className="text-xs text-muted-foreground">Used</div>
                            <div className="text-xl font-bold text-foreground">{formatNumber(credits.used)}</div>
                            <div className="text-xs text-muted-foreground">tokens</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 space-y-0.5">
                            <div className="text-xs text-muted-foreground">Remaining</div>
                            <div className={`text-xl font-bold ${getStatusColor()}`}>
                                {formatNumber(credits.remaining)}
                            </div>
                            <div className="text-xs text-muted-foreground">tokens</div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-1 text-sm border-t pt-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Quota</span>
                            <span className="text-foreground">{formatNumber(credits.limit)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Resets on</span>
                            <span className="text-foreground">
                                {new Date(credits.resetDate).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}{' '}
                                {new Date(credits.resetDate).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Button */}
            <Button
                ref={buttonRef}
                variant="outline"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="h-12 w-12 rounded-full shadow-lg bg-background hover:bg-muted border-2"
                title="Check Credit/Token"
            >
                <span className="text-lg">💎</span>
            </Button>
        </div>
    );
}
