// Questionnaire with History Tab
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getQuestions, submitQuestionnaire, getQuestionnaireLogs } from '@/utils/api';
import { useAlert } from '@/context/AlertContext';

const options = [
    { label: "Minimum", value: 1 },
    { label: "", value: 2 },
    { label: "", value: 3 },
    { label: "", value: 4 },
    { label: "Maximum", value: 5 }
];

interface Question {
    id: string;
    question_text: string;
    question_order: number;
    weight: number;
    min_value: number;
    max_value: number;
}

type TabMode = 'assessment' | 'history';

export default function Questionnaire() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});

    const [tab, setTab] = useState<TabMode>('assessment');
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // UI states
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showHalfwayPrompt, setShowHalfwayPrompt] = useState(false);
    const [resultData, setResultData] = useState<{ stress_score: number, sos_triggered?: boolean } | null>(null);
    const [started, setStarted] = useState(false);
    const [showSosPopup, setShowSosPopup] = useState(false);

    const [showDisclaimer, setShowDisclaimer] = useState(true);

    useEffect(() => {
        const token = (localStorage.getItem('token') || sessionStorage.getItem('token'));
        const userDataStr = localStorage.getItem('user');
        if (!token || !userDataStr) { router.push('/login'); return; }
        const userData = JSON.parse(userDataStr);
        if (userData.role === 'admin' || userData.role === 'super_admin') { router.push('/admin'); return; }
        if (userData.role === 'psychologist') { router.push('/psychologist'); return; }
        setIsAuthorized(true);
        fetchQuestions();
    }, [router]);

    const fetchQuestions = async () => {
        try {
            const data = await getQuestions();
            setQuestions(data || []);
        } catch {
            showAlert('Failed to load questionnaire. Please try again later.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await getQuestionnaireLogs();
            setHistoryLogs(data || []);
        } catch {
            showAlert('Failed to load history.', 'error');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleTabChange = (t: TabMode) => {
        setTab(t);
        if (t === 'history') loadHistory();
    };

    const handleAnswer = (value: number) => {
        if (!questions[currentQuestion]) return;
        const questionId = questions[currentQuestion].id;
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
        if (currentQuestion === 9 && !showHalfwayPrompt && questions.length > 10) {
            setShowHalfwayPrompt(true);
            return;
        }
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
            setShowHalfwayPrompt(false);
        }
    };

    const handleSubmit = async () => {
        const responses = Object.entries(answers).map(([question_id, answer_value]) => ({ question_id, answer_value }));
        if (responses.length === 0) { showAlert('Please answer at least some questions.', 'info'); return; }
        setSubmitting(true);
        try {
            const data = await submitQuestionnaire(responses, showHalfwayPrompt ? 'Submitted after 10 questions' : 'Completed full assessment');
            setResultData(data);
            if (data.sos_triggered) {
                setShowSosPopup(true);
            }
        } catch {
            showAlert('Failed to submit results. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const continueAssessment = () => {
        setShowHalfwayPrompt(false);
        setCurrentQuestion(10);
    };

    const resetAssessment = () => {
        setResultData(null);
        setAnswers({});
        setCurrentQuestion(0);
        setStarted(false);
        setShowSosPopup(false);
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (!isAuthorized || loading) {
        return (
            <div className="min-h-screen flex flex-col bg-neutral-50 items-center justify-center">
                <Header />
                <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-neutral-50 text-center items-center justify-center">
                <Header />
                <h2 className="text-xl font-medium text-neutral-600">No questions available right now.</h2>
            </div>
        );
    }

    // ── Result screen ────────────────────────────────────────────────────────
    if (resultData) {
        const score = resultData.stress_score;
        const isHigh = score > 70;
        const isMid  = score > 40;
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
                                Because your stress score is high ({score.toFixed(0)}%), we have automatically notified your emergency SOS contacts. Help is on the way.
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

                <main className="flex-1 pt-24 pb-12 flex items-center justify-center">
                    <div className="container-custom max-w-xl text-center">
                        <div className="card animate-fade-in-up py-12 px-8">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-neutral-900 mb-4">Assessment Complete</h1>
                            <p className="text-neutral-600 mb-8">Your responses have been recorded successfully.</p>

                            <div className={`rounded-2xl p-6 mb-8 border ${isHigh ? 'bg-red-50 border-red-200' : isMid ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                                <p className={`text-sm font-semibold mb-1 ${isHigh ? 'text-red-600' : isMid ? 'text-orange-600' : 'text-green-600'}`}>
                                    Estimated Stress Score
                                </p>
                                <p className={`text-5xl font-black mb-2 ${isHigh ? 'text-red-700' : isMid ? 'text-orange-700' : 'text-green-700'}`}>
                                    {score.toFixed(0)}<span className="text-xl font-normal opacity-50 ml-1">/100</span>
                                </p>
                                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isHigh ? 'bg-red-100 text-red-700' : isMid ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                    {isHigh ? '⚠ High Stress' : isMid ? '~ Moderate Stress' : '✓ Low Stress'}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={resetAssessment} className="flex-1 btn btn-outline">
                                    Retake Test
                                </button>
                                <button onClick={() => router.push('/dashboard')} className="flex-1 btn btn-primary shadow-navy">
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const questionObj = questions[currentQuestion];
    const isAnswered = questionObj && answers[questionObj.id] !== undefined;
    const progressTotal = showHalfwayPrompt ? 10 : questions.length;
    const progress = Math.min(((currentQuestion + (isAnswered ? 1 : 0)) / progressTotal) * 100, 100);

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Header />

            <main className="flex-1 pt-24 pb-12">
                <div className="container-custom max-w-3xl">

                    {/* Header + tabs */}
                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-neutral-900 mb-1">Stress Assessment</h1>
                            <p className="text-neutral-500">Answer honestly for accurate results</p>
                        </div>
                        <div className="bg-white p-1 rounded-lg border border-neutral-200 inline-flex shadow-sm">
                            {(['assessment', 'history'] as TabMode[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => handleTabChange(t)}
                                    className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${tab === t
                                        ? 'bg-primary-600 text-white shadow'
                                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Disclaimer Warning - Only on start screen */}
                    {showDisclaimer && !started && tab === 'assessment' && (
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-8 rounded-r-xl shadow-sm animate-fade-in relative">
                            <button 
                                onClick={() => setShowDisclaimer(false)}
                                className="absolute top-2 right-2 text-orange-400 hover:text-orange-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="flex items-start pr-8">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-orange-700 font-medium">
                                        <span className="font-bold uppercase tracking-wider text-xs mr-2">Disclaimer:</span> 
                                        This assessment is based on self-reported data. Results are for guidance only and do not substitute for professional medical or psychological advice. AI-calculated stress scores may contain errors.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── HISTORY ── */}
                    {tab === 'history' && (
                        <div className="card">
                            <h2 className="text-xl font-bold mb-6 text-neutral-900">Assessment History</h2>
                            {loadingHistory ? (
                                <div className="text-center py-12 text-neutral-400">Loading…</div>
                            ) : historyLogs.length === 0 ? (
                                <div className="text-center py-16 text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl">
                                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="font-medium">No assessments yet</p>
                                    <p className="text-sm mt-1">Switch to Assessment tab to begin</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                                    {historyLogs.map((log: any) => {
                                        const score = parseFloat(log.stress_score || 0);
                                        const isHigh = score > 70;
                                        const isMid  = score > 40;
                                        return (
                                            <div key={log.id} className="flex items-center gap-4 p-4 bg-white border border-neutral-100 rounded-xl hover:border-primary-200 transition-colors shadow-sm">
                                                {/* Score circle */}
                                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-base shrink-0
                                                    ${isHigh ? 'bg-red-100 text-red-600' : isMid ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                                    {score.toFixed(0)}
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-neutral-800">Stress Assessment</p>
                                                    <p className="text-xs text-neutral-400">{formatDate(log.created_at)}</p>
                                                    {log.notes && <p className="text-xs text-neutral-500 mt-0.5 italic">{log.notes}</p>}
                                                </div>
                                                {/* Badge */}
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

                    {/* ── ASSESSMENT ── */}
                    {tab === 'assessment' && (
                        <>
                            {!started ? (
                                <div className="card text-center py-16 animate-fade-in-up">
                                    <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-inner">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h2 className="text-3xl font-black text-neutral-900 mb-4 tracking-tight">Ready for your Assessment?</h2>
                                    <p className="text-neutral-500 mb-10 max-w-md mx-auto leading-relaxed">
                                        This validated questionnaire helps us understand your current mental state. Please answer based on how you've felt over the past week.
                                    </p>
                                    <button 
                                        onClick={() => setStarted(true)} 
                                        className="btn btn-primary shadow-navy px-12 py-4"
                                    >
                                        Start Questionnaire assessment
                                    </button>
                                </div>
                            ) : showHalfwayPrompt ? (
                                <div className="card mb-6 animate-fade-in-up text-center py-12">
                                    <h2 className="text-3xl font-semibold mb-4 text-primary-900">You're Halfway There!</h2>
                                    <p className="text-neutral-600 text-lg mb-8 max-w-lg mx-auto">
                                        You've completed the initial 10 questions. Submit now for a quick score, or continue for a more accurate result.
                                    </p>
                                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                                        <button onClick={handleSubmit} disabled={submitting} className="btn btn-outline">
                                            {submitting ? 'Submitting...' : 'Submit Now'}
                                        </button>
                                        <button onClick={continueAssessment} disabled={submitting} className="btn btn-primary shadow-navy">
                                            Continue for Better Accuracy
                                        </button>
                                    </div>
                                    <div className="mt-8 text-sm">
                                        <button onClick={handlePrevious} className="text-neutral-500 hover:text-neutral-900 underline">
                                            Wait, let me review my last answer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Progress Bar */}
                                    <div className="mb-8">
                                        <div className="flex justify-between text-sm text-neutral-600 mb-2">
                                            <span>Question {currentQuestion + 1} of {questions.length}</span>
                                            <span>{Math.round(progress)}% Complete</span>
                                        </div>
                                        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-navy-gradient transition-all duration-300" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>


                                    {/* Question Card */}
                                    {questionObj && (
                                        <div className="card mb-6 animate-fade-in-up">
                                            <h2 className="text-2xl font-semibold mb-6 text-neutral-900">{questionObj.question_text}</h2>
                                            <div className="relative py-8 px-4 sm:px-12">
                                                {/* Connecting Line - precisely centered on the circles */}
                                                <div className="absolute top-[3.5rem] sm:top-[4rem] left-[12.5%] right-[12.5%] h-1 bg-neutral-200 z-0 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-primary-300 transition-all duration-700 ease-out" 
                                                        style={{ width: `${answers[questionObj.id] ? (answers[questionObj.id] - 1) * 25 : 0}%` }} 
                                                    />
                                                </div>

                                                <div className="relative flex justify-between items-start z-10">
                                                    {options.map((option) => {
                                                        const isSelected = answers[questionObj.id] === option.value;
                                                        return (
                                                            <div key={option.value} className="flex flex-col items-center flex-1">
                                                                <button
                                                                    onClick={() => handleAnswer(option.value)}
                                                                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 flex items-center justify-center text-xl sm:text-2xl font-black transition-all duration-300 transform shadow-sm ${isSelected
                                                                        ? 'bg-primary-600 border-primary-100 text-white scale-125 shadow-xl ring-4 ring-primary-50'
                                                                        : 'bg-white border-neutral-300 text-neutral-600 hover:border-primary-400 hover:text-primary-600 hover:scale-110 active:scale-90'}`}
                                                                >
                                                                    {option.value}
                                                                </button>
                                                                <span className={`mt-5 text-[10px] sm:text-xs font-bold uppercase tracking-tight text-center transition-all duration-300 min-h-[1rem] ${isSelected ? 'text-primary-700 opacity-100' : 'text-neutral-500 opacity-60'}`}>
                                                                    {option.label || ""}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation */}
                                    <div className="flex justify-between">
                                        <button onClick={handlePrevious} disabled={currentQuestion === 0} className="btn btn-outline">
                                            Previous
                                        </button>
                                        {currentQuestion === questions.length - 1 ? (
                                            <button onClick={handleSubmit} disabled={submitting || !isAnswered} className="btn btn-primary shadow-navy">
                                                {submitting ? 'Submitting...' : 'Submit Assessment'}
                                            </button>
                                        ) : (
                                            <button onClick={handleNext} disabled={!isAnswered} className="btn btn-primary shadow-navy">
                                                Next Question
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

