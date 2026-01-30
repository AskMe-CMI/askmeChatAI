'use client';

/**
 * Credit Check Button
 * Floating button at bottom-right corner for checking Credit/Token usage
 * Panel displays above button with no overlay background
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoaderIcon } from '@/components/icons';
import { getUsageStatsAction, type UsageStatsResponse } from '@/app/(auth)/api-actions';
import { toast } from 'sonner';

export function CreditCheckButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<UsageStatsResponse | null>(null);
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

    // Handle button click with loading state
    const handleClick = async () => {
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        setIsOpen(true);

        try {
            const result = await getUsageStatsAction();

            if (result.success && result.data) {
                setStats(result.data);
            } else {
                toast.error(result.message || 'Failed to fetch credit usage');
                // Optional: keep panel open to show error state or close it? 
                // Currently keeping it open but with no data it might look empty if we don't handle it.
                // But we will handle "no stats" in render.
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
            toast.error('An error occurred while fetching credits');
        } finally {
            setIsLoading(false);
        }
    };

    const percentage = stats ? stats.tokens.percentage_used : 0;
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
                    className="absolute bottom-16 right-0 w-80 bg-white/80 backdrop-blur-lg dark:bg-zinc-900/80 border rounded-lg shadow-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
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

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-8 h-8 animate-spin text-muted-foreground">
                                <LoaderIcon size={32} />
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
                        </div>
                    ) : stats ? (
                        <>
                            {/* User Info (Optional) */}
                            {/* <div className="text-xs text-muted-foreground mb-2 truncate">
                                {stats.email}
                            </div> */}

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
                                    <div className="text-xl font-bold text-foreground">{formatNumber(stats.tokens.used)}</div>
                                    <div className="text-xs text-muted-foreground">tokens</div>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 space-y-0.5">
                                    <div className="text-xs text-muted-foreground">Remaining</div>
                                    <div className={`text-xl font-bold ${getStatusColor()}`}>
                                        {formatNumber(stats.tokens.remaining)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">tokens</div>
                                </div>
                            </div>

                            {/* Spend Info */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-3 rounded-lg bg-muted/50 space-y-0.5">
                                    <div className="text-xs text-muted-foreground">Request Count</div>
                                    <div className="text-lg font-semibold text-foreground">{formatNumber(stats.usage.request_count)}</div>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 space-y-0.5">
                                    <div className="text-xs text-muted-foreground">Total Spend</div>
                                    <div className="text-lg font-semibold text-foreground">${stats.usage.spend.toFixed(5)}</div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="space-y-1 text-sm border-t pt-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Quota</span>
                                    <span className="text-foreground">{formatNumber(stats.tokens.limit)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Resets on</span>
                                    <span className="text-foreground">
                                        {stats.tokens.expiry_date ? (
                                            <>
                                                {new Date(stats.tokens.expiry_date).toLocaleDateString('en-US', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}{' '}
                                                {new Date(stats.tokens.expiry_date).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </>
                                        ) : (
                                            'N/A'
                                        )}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                            No usage data available
                        </div>
                    )}
                </div>
            )}

            {/* Button */}
            <Button
                ref={buttonRef}
                variant="outline"
                size="icon"
                onClick={handleClick}
                disabled={isLoading}
                className="h-12 w-12 rounded-full shadow-lg bg-background hover:bg-muted border-2"
                title="Check Credit/Token"
            >
                {isLoading ? (
                    <div className="w-5 h-5 animate-spin">
                        <LoaderIcon size={20} />
                    </div>
                ) : (
                    <span className="text-lg">💎</span>
                )}
            </Button>
        </div>
    );
}
