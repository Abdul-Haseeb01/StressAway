'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAlert } from '@/context/AlertContext';
import { predictFacialEmotion, getFacialEmotionLogs } from '@/utils/api';

type TabMode = 'scan' | 'history';

export default function FacialEmotion() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const [isAuthorized, setIsAuthorized] = useState(false);

    const [mode, setMode] = useState<TabMode>('scan');
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [cameraActive, setCameraActive] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [showSosPopup, setShowSosPopup] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // ── Auth check ──────────────────────────────────────────────────────────
    useEffect(() => {
        const token = (localStorage.getItem('token') || sessionStorage.getItem('token'));
        const userDataStr = localStorage.getItem('user');
        if (!token || !userDataStr) { router.push('/login'); return; }
        const userData = JSON.parse(userDataStr);
        if (userData.role === 'admin' || userData.role === 'super_admin') { router.push('/admin'); return; }
        if (userData.role === 'psychologist') { router.push('/psychologist'); return; }
        setIsAuthorized(true);
    }, [router]);

    // ── Kill camera on unmount ───────────────────────────────────────────────
    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        };
    }, []);

    // ── Camera ───────────────────────────────────────────────────────────────
    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.load();
        }
        setCameraActive(false);
    }, []);

    const startCamera = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } }
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.oncanplay = () => {
                    videoRef.current?.play().catch(console.error);
                    setCameraActive(true);
                };
                videoRef.current.load();
            }
        } catch (err: any) {
            showAlert(
                err.name === 'NotAllowedError'
                    ? 'Camera permission denied — please allow camera access in your browser'
                    : 'Camera could not be opened: ' + err.message,
                'error'
            );
        }
    };

    const captureImage = async () => {
        if (!videoRef.current || !cameraActive) return;
        setCapturing(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
            setCapturedImage(imageBase64);
            stopCamera();

            const response = await predictFacialEmotion(imageBase64);
            if (!response.success) {
                setResultImage(response.image_base64 || null);
                showAlert(response.message || 'No face detected', 'error');
                return;
            }
            setResultImage(response.image_base64 || null);
            setResult({
                emotion: response.detected_emotion,
                stress_score: response.stress_score,
                sos_triggered: response.sos_triggered
            });
            if (response.sos_triggered) {
                setShowSosPopup(true);
            }
        } catch (err: any) {
            showAlert(err.response?.data?.message || 'Failed to capture image', 'error');
            setCapturedImage(null);
        } finally {
            setCapturing(false);
        }
    };

    const resetScan = () => {
        setResult(null);
        setResultImage(null);
        setCapturedImage(null);
        setShowSosPopup(false);
    };

    // ── Tab switching ────────────────────────────────────────────────────────
    const handleTabChange = (newMode: TabMode) => {
        stopCamera();
        setMode(newMode);
        setResult(null);
        setResultImage(null);
        setCapturedImage(null);
        if (newMode === 'history') loadHistory();
    };

    // ── History ──────────────────────────────────────────────────────────────
    const loadHistory = async () => {
        setLoadingHistory(true);
        try { setHistoryLogs(await getFacialEmotionLogs()); }
        catch { showAlert('Failed to load scan history', 'error'); }
        finally { setLoadingHistory(false); }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (!isAuthorized) return null;

    const showVideo = cameraActive && !capturedImage && !resultImage;
    const showPreview = !!(capturedImage || resultImage);

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50 relative">
            <Header />

            {/* SOS POPUP */}
            {showSosPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border-t-8 border-red-600 animate-scale-up">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h2 className="text-2xl font-black text-neutral-900 mb-2">Emergency SOS Sent!</h2>
                        <p className="text-neutral-500 mb-8 leading-relaxed">
                            Because your facial scan indicates high stress ({parseFloat(result?.stress_score).toFixed(0)}%), we have automatically notified your emergency SOS contacts. Help is on the way.
                        </p>
                        <button
                            onClick={() => setShowSosPopup(false)}
                            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            )}

            <main className="flex-1 pt-24 pb-12">
                <div className="container-custom max-w-5xl">

                    {/* Page header + tabs */}
                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-neutral-900 mb-1">Facial Emotion Analysis</h1>
                            <p className="text-neutral-500">AI-powered emotion detection for stress assessment</p>
                        </div>
                        <div className="bg-white p-1 rounded-lg border border-neutral-200 inline-flex shadow-sm">
                            {(['scan', 'history'] as TabMode[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => handleTabChange(t)}
                                    className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${mode === t
                                        ? 'bg-primary-600 text-white shadow'
                                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}
                                >
                                    {t === 'scan' ? 'Live Scan' : 'History'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── HISTORY ── */}
                    {mode === 'history' && (
                        <div className="card max-w-3xl mx-auto">
                            <h2 className="text-xl font-bold mb-6 text-neutral-900">Scan History</h2>
                            {loadingHistory ? (
                                <div className="text-center py-12 text-neutral-400">Loading…</div>
                            ) : historyLogs.length === 0 ? (
                                <div className="text-center py-16 text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl">
                                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="font-medium">No scans recorded yet</p>
                                    <p className="text-sm mt-1">Switch to Live Scan to begin</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                                    {historyLogs.map(log => {
                                        const score = parseFloat(log.stress_score || 0);
                                        const isHigh = score > 70;
                                        const isMid = score > 40;
                                        return (
                                            <div key={log.id} className="flex items-center gap-4 p-4 bg-white border border-neutral-100 rounded-xl hover:border-primary-200 transition-colors shadow-sm">
                                                {/* Score circle */}
                                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-base shrink-0
                                                    ${isHigh ? 'bg-red-100 text-red-600' : isMid ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                                    {score.toFixed(0)}
                                                </div>
                                                {/* Emotion + date */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-neutral-800 capitalize">{log.detected_emotion || '—'}</p>
                                                    <p className="text-xs text-neutral-400">{formatDate(log.created_at)}</p>
                                                </div>
                                                {/* Level badge */}
                                                <div className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0
                                                    ${isHigh ? 'bg-red-50 text-red-600' : isMid ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                                    {isHigh ? 'High' : isMid ? 'Moderate' : 'Low'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── SCAN ── */}
                    {mode === 'scan' && (
                        <div className="grid lg:grid-cols-2 gap-8">

                            {/* LEFT: Camera panel */}
                            <div className="card flex flex-col gap-4">
                                <h2 className="text-xl font-semibold text-neutral-900">Live Camera</h2>

                                <div className="relative aspect-video bg-neutral-900 rounded-xl overflow-hidden">
                                    {/* Result/captured image overlay */}
                                    {showPreview && (
                                        <img
                                            src={resultImage || capturedImage!}
                                            alt="Scan preview"
                                            className="absolute inset-0 w-full h-full object-cover z-10"
                                        />
                                    )}

                                    {/* Video — always mounted */}
                                    <video
                                        ref={videoRef}
                                        muted
                                        playsInline
                                        autoPlay
                                        className={`w-full h-full object-cover transition-opacity duration-200 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
                                    />

                                    {/* Idle state */}
                                    {!cameraActive && !showPreview && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                            <svg className="w-16 h-16 opacity-20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm opacity-40">Camera is off</span>
                                        </div>
                                    )}

                                    {/* Analysing spinner */}
                                    {capturing && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                            <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mb-3" />
                                            <span className="text-white font-semibold animate-pulse">Analyzing…</span>
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    {!cameraActive && !showPreview && (
                                        <button onClick={startCamera} className="btn btn-primary flex-1 py-3 text-base font-semibold">
                                            Start Camera
                                        </button>
                                    )}
                                    {cameraActive && (
                                        <>
                                            <button onClick={captureImage} disabled={capturing} className="btn bg-primary-600 hover:bg-primary-700 text-white flex-1 py-3 text-base border-none shadow">
                                                {capturing ? 'Analyzing…' : 'Capture & Analyze'}
                                            </button>
                                            <button onClick={stopCamera} disabled={capturing} className="btn btn-outline px-4">Stop</button>
                                        </>
                                    )}
                                    {showPreview && !capturing && (
                                        <button onClick={resetScan} className="btn btn-outline flex-1 py-3">
                                            Take Another Scan
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT: Results panel */}
                            <div className="card flex flex-col">
                                <h2 className="text-xl font-semibold text-neutral-900 border-b pb-4 mb-6">AI Diagnostics</h2>

                                {result ? (
                                    <div className="flex flex-col gap-4 flex-1">
                                        {/* Emotion */}
                                        <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 text-center">
                                            <div className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">Detected Emotion</div>
                                            <div className="text-3xl font-black text-primary-900 capitalize">{result.emotion || '—'}</div>
                                        </div>

                                        {/* Stress score 0-100 */}
                                        <div className={`rounded-xl p-6 text-center flex-1 flex flex-col items-center justify-center border
                                            ${result.stress_score > 70 ? 'bg-red-50 border-red-200' :
                                                result.stress_score > 40 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                                            <div className={`text-xs font-bold uppercase tracking-widest mb-3
                                                ${result.stress_score > 70 ? 'text-red-500' : result.stress_score > 40 ? 'text-orange-500' : 'text-green-600'}`}>
                                                Estimated Stress Score
                                            </div>
                                            <div className={`text-7xl font-black flex items-baseline mb-3
                                                ${result.stress_score > 70 ? 'text-red-600' : result.stress_score > 40 ? 'text-orange-500' : 'text-green-600'}`}>
                                                {parseFloat(result.stress_score).toFixed(0)}
                                                <span className="text-3xl ml-2 opacity-40">/100</span>
                                            </div>
                                            <div className={`text-sm font-semibold px-4 py-2 rounded-full
                                                ${result.stress_score > 70 ? 'bg-red-100 text-red-700' :
                                                    result.stress_score > 40 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                {result.stress_score > 70 ? '⚠ High Stress' : result.stress_score > 40 ? '~ Moderate Stress' : '✓ Low Stress'}
                                            </div>
                                        </div>

                                        <button onClick={resetScan} className="btn bg-neutral-900 hover:bg-neutral-800 text-white w-full py-3 border-none shadow mt-auto">
                                            Run Another Scan
                                        </button>
                                    </div>

                                ) : resultImage ? (
                                    /* No-face detected */
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50 border-2 border-dashed border-red-200 rounded-xl">
                                        <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-red-800 mb-2">No Face Detected</h3>
                                        <p className="text-red-600 text-sm mb-5">Ensure your face is clearly visible, well-lit, and centred in the frame.</p>
                                        <button onClick={resetScan} className="btn bg-red-600 hover:bg-red-700 text-white w-full border-none">Retry</button>
                                    </div>

                                ) : (
                                    /* Idle */
                                    <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-400 py-12 px-6">
                                        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                                            <svg className="w-10 h-10 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-semibold text-neutral-500 mb-1">Awaiting Scan</p>
                                        <p className="text-sm">Start the camera, then click "Capture & Analyze".</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

