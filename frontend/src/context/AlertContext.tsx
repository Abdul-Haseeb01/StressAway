'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type AlertType = 'success' | 'error' | 'info';

interface Alert {
    id: string;
    message: string;
    type: AlertType;
}

interface AlertContextType {
    showAlert: (message: string, type?: AlertType) => void;
    showConfirm: (message: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [confirmDialog, setConfirmDialog] = useState<{ message: string, resolve: (value: boolean) => void } | null>(null);

    const showConfirm = useCallback((message: string) => {
        return new Promise<boolean>((resolve) => {
            setConfirmDialog({ message, resolve });
        });
    }, []);

    const showAlert = useCallback((message: string, type: AlertType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setAlerts(prev => [...prev, { id, message, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 5000);
    }, []);

    // Global alert listener for external events
    useEffect(() => {
        const handleGlobalAlert = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && customEvent.detail.message) {
                showAlert(customEvent.detail.message, customEvent.detail.type || 'error');
            }
        };

        window.addEventListener('globalAlert', handleGlobalAlert);
        return () => window.removeEventListener('globalAlert', handleGlobalAlert);
    }, [showAlert]);

    const removeAlert = (id: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    const handleConfirm = (value: boolean) => {
        if (confirmDialog) {
            confirmDialog.resolve(value);
            setConfirmDialog(null);
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {/* The main app content must render correctly */}
            {children}

            {/* Standard Confirmation Modal */}
            {confirmDialog && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Confirmation</h3>
                        <p style={{ marginBottom: '20px', color: '#4b5563' }}>{confirmDialog.message}</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleConfirm(false)}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#e5e7eb', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleConfirm(true)}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#1e40af', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Standard Bottom Right Alerts */}
            {alerts.length > 0 && (
                <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999999, display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '350px' }}>
                    {alerts.map(alert => (
                        <div
                            key={alert.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px',
                                borderRadius: '12px',
                                backgroundColor: alert.type === 'error' ? '#dc2626' : (alert.type === 'success' ? '#1e40af' : '#1e40af'),
                                // '#16a34a' :
                                color: 'white',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                pointerEvents: 'auto'
                            }}
                        >
                            <span style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: '1.4' }}>{alert.message}</span>
                            <button
                                onClick={() => removeAlert(alert.id)}
                                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', marginLeft: '10px' }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
