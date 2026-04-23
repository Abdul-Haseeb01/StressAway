// Modern Wellness Page
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type ActivityType = 'timer' | 'emoji';

interface Activity {
    id: number;
    title: string;
    icon: string;
    durationMinutes: number;
    description: string;
    type: ActivityType;
    recommendedFor: string[];
}

const ALL_ACTIVITIES: Activity[] = [
    { id: 1, title: 'Deep Breathing', icon: '🫁', durationMinutes: 5, description: 'Calm your mind with guided breathing. Listen to the calming breath sounds.', type: 'timer', recommendedFor: ['😟', '😢', '😐'] },
    { id: 2, title: 'Meditation', icon: '🧘', durationMinutes: 10, description: 'Mindfulness meditation session. Sit comfortably and listen to the calming sound.', type: 'timer', recommendedFor: ['😟', '😐', '🙂'] },
    { id: 3, title: 'Progressive Relaxation', icon: '😌', durationMinutes: 15, description: 'Release tension from your body. Close your eyes, lay down comfortably, and listen to the calming sound.', type: 'timer', recommendedFor: ['😟', '😢'] },
    { id: 5, title: 'Yoga Stretches', icon: '🤸', durationMinutes: 4, description: 'Gentle stretching exercises. Select your starting pose to begin.', type: 'timer', recommendedFor: ['😐', '🙂', '😊'] },
    { id: 6, title: 'Emojic Activities', icon: '✨', durationMinutes: 3, description: 'Copy positive emojis to share or save', type: 'emoji', recommendedFor: ['😟', '😢', '😐', '🙂', '😊'] },
];

const MOODS = [
    { emoji: '😊', label: 'Great' },
    { emoji: '🙂', label: 'Good' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '😟', label: 'Stressed' },
    { emoji: '😢', label: 'Sad' },
];

const POSITIVE_EMOJIS = ['😊', '😀', '😃', '😄', '😆'];

const YOGA_POSES = [
    { title: "Child's Pose", duration: "1 min", image: "/uploads/child pose.jpg" },
    { title: "Cat-Cow Stretch", duration: "1 min", image: "/uploads/Cat-Cow-Pose.jpg" },
    { title: "Cobra Pose", duration: "1 min", image: "/uploads/cobra.jpg" },
    { title: "Knee To Chest", duration: "1 min", image: "/uploads/knee to chest.jpg" },
];

export default function Wellness() {
    const router = useRouter();
    const [step, setStep] = useState<'mood' | 'recommendations' | 'active' | 'complete'>('mood');
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [activeActivity, setActiveActivity] = useState<Activity | null>(null);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [exitTargetStep, setExitTargetStep] = useState<'recommendations' | 'complete' | null>(null);

    // Yoga State
    const [showYogaSelection, setShowYogaSelection] = useState(false);
    const [completedYogaPoses, setCompletedYogaPoses] = useState<number[]>([]);
    const [isPreparingYoga, setIsPreparingYoga] = useState(false);

    // Emoji Game State
    const [emojiIndex, setEmojiIndex] = useState(0);
    const [completedEmojis, setCompletedEmojis] = useState(0);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isEarlyExit, setIsEarlyExit] = useState(false);

    // Auth & Navigation Effect
    useEffect(() => {
        const token = (localStorage.getItem('token') || sessionStorage.getItem('token'));
        const userDataStr = localStorage.getItem('user');

        if (!token || !userDataStr) {
            router.push('/login');
            return;
        }

        const userData = JSON.parse(userDataStr);
        if (userData.role === 'admin' || userData.role === 'super_admin') {
            router.push('/admin');
            return;
        } else if (userData.role === 'psychologist') {
            router.push('/psychologist');
            return;
        }

        setIsAuthorized(true);
    }, [router]);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    // Timer Effect & Yoga Rotation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            setIsActive(false);
            setIsEarlyExit(false);
            if (activeActivity?.title === 'Yoga Stretches') {
                const newCompleted = [...completedYogaPoses, emojiIndex];
                setCompletedYogaPoses(newCompleted);
                if (newCompleted.length < YOGA_POSES.length) {
                    setShowYogaSelection(true);
                } else {
                    setStep('complete');
                }
            } else {
                setStep('complete');
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, activeActivity, completedYogaPoses, emojiIndex]);

    const handleMoodSelect = (emoji: string) => {
        setSelectedMood(emoji);
        setStep('recommendations');
    };

    const startTimerActivity = (activity: Activity) => {
        setActiveActivity(activity);
        
        if (activity.title === 'Yoga Stretches') {
            setCompletedYogaPoses([]);
            setShowYogaSelection(true);
            setIsActive(false);
            setIsPreparingYoga(false);
            setTimeLeft(60); // Each pose is 1 minute
        } else {
            setTimeLeft(activity.durationMinutes * 60);
            setIsActive(true);
        }
        
        setStep('active');
    };

    const handleYogaPoseSelect = (index: number) => {
        setEmojiIndex(index);
        setShowYogaSelection(false);
        setIsPreparingYoga(true);
        setIsActive(false);
        setTimeLeft(60);
    };

    const startYogaSession = () => {
        setIsPreparingYoga(false);
        setIsActive(true);
    };

    const requestExit = (target: 'recommendations' | 'complete') => {
        setIsActive(false);
        setExitTargetStep(target);
        setShowExitConfirm(true);
    };

    const confirmExit = () => {
        if (exitTargetStep === 'complete') {
            setIsEarlyExit(true);
        } else {
            setIsEarlyExit(false);
        }
        if (exitTargetStep) {
            setStep(exitTargetStep);
        }
        setShowExitConfirm(false);
        setExitTargetStep(null);
    };

    const cancelExit = () => {
        setShowExitConfirm(false);
        setExitTargetStep(null);
        if (timeLeft > 0 && activeActivity?.type === 'timer' && !showYogaSelection) {
            setIsActive(true);
        }
    };

    const startEmojiActivity = (activity: Activity) => {
        setActiveActivity(activity);
        setEmojiIndex(0);
        setCompletedEmojis(0);
        setStep('active');
    };

    const handleEmojiClick = (emoji: string) => {
        navigator.clipboard.writeText(emoji);
        setCompletedEmojis(prev => prev + 1); // Track how many they copied

        // Show temporary toast or feedback
        const el = document.getElementById(`emoji-${emoji}`);
        if (el) {
            el.classList.add('scale-125', 'text-green-500');
            setTimeout(() => el.classList.remove('scale-125', 'text-green-500'), 300);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const getRecommendedActivities = () => {
        if (!selectedMood) return ALL_ACTIVITIES;
        return ALL_ACTIVITIES.filter(a => a.recommendedFor.includes(selectedMood));
    };

    const resetFlow = () => {
        setStep('mood');
        setTimeLeft(0);
        setIsActive(false);
        setShowYogaSelection(false);
        setShowExitConfirm(false);
        setCompletedYogaPoses([]);
        setIsPreparingYoga(false);
        setIsEarlyExit(false);
    };

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Header />

            <main className="flex-1 pt-24 pb-12">
                <div className="container-custom max-w-4xl">

                    {step === 'mood' && (
                        <div className="animate-fade-in-up text-center">
                            <h1 className="text-4xl font-bold text-neutral-900 mb-4">Wellness Center</h1>
                            <p className="text-neutral-600 mb-12 text-lg">Let's find the right activity for you today.</p>

                            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 sm:p-12">
                                <h2 className="text-2xl font-bold mb-8 text-neutral-900">How are you feeling right now?</h2>
                                <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                                    {MOODS.map((mood, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleMoodSelect(mood.emoji)}
                                            className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-primary-50 transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-primary-100"
                                        >
                                            <span className="text-6xl sm:text-7xl group-hover:scale-110 transition-transform duration-300">
                                                {mood.emoji}
                                            </span>
                                            <span className="font-medium text-neutral-600 group-hover:text-primary-700">
                                                {mood.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'recommendations' && (
                        <div className="animate-fade-in-up">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">Recommended for You</h1>
                                    <p className="text-neutral-600">Based on your mood ({selectedMood})</p>
                                </div>
                                <button onClick={resetFlow} className="text-primary-600 hover:text-primary-800 font-medium px-4 py-2 bg-primary-50 rounded-lg transition-colors">
                                    Change Mood
                                </button>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                {getRecommendedActivities().map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col h-full"
                                    >
                                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform origin-left">{activity.icon}</div>
                                        <h3 className="text-xl font-bold text-neutral-900 mb-2">{activity.title}</h3>
                                        <p className="text-neutral-600 mb-6 flex-1">{activity.description}</p>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {activity.durationMinutes} min
                                            </div>
                                            <button
                                                onClick={() => activity.type === 'timer' ? startTimerActivity(activity) : startEmojiActivity(activity)}
                                                className="bg-neutral-900 hover:bg-primary-600 text-white px-5 py-2 rounded-xl transition-colors font-medium text-sm"
                                            >
                                                Start
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'active' && activeActivity && (
                        <div className="animate-fade-in-up max-w-2xl mx-auto">
                            <button onClick={() => requestExit('recommendations')} className="mb-6 text-neutral-500 hover:text-neutral-900 flex items-center gap-2 font-medium transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Back to Activities
                            </button>

                            <div className="bg-white rounded-3xl shadow-lg border border-neutral-100 p-8 sm:p-12 text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-neutral-100">
                                    {activeActivity.type === 'timer' ? (
                                        <div
                                            className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
                                            style={{ 
                                                width: `${
                                                    activeActivity.title === 'Yoga Stretches' 
                                                        ? ((completedYogaPoses.length + (1 - timeLeft / 60)) / YOGA_POSES.length) * 100 
                                                        : ((activeActivity.durationMinutes * 60 - timeLeft) / (activeActivity.durationMinutes * 60)) * 100
                                                }%` 
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="h-full bg-accent-500 transition-all duration-500"
                                            style={{ width: `${Math.min((completedEmojis / 10) * 100, 100)}%` }}
                                        />
                                    )}
                                </div>

                                <div className="text-6xl mb-6 mt-4">{activeActivity.icon}</div>
                                <h2 className="text-3xl font-bold text-neutral-900 mb-3">{activeActivity.title}</h2>
                                {!showYogaSelection && !isPreparingYoga && <p className="text-neutral-600 text-lg mb-12">{activeActivity.description}</p>}

                                {showYogaSelection && activeActivity.title === 'Yoga Stretches' && (
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold mb-6 text-neutral-800">
                                            {completedYogaPoses.length === 0 ? "Which pose would you like to start with?" : "Next pose to practice:"}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {YOGA_POSES.map((pose, idx) => {
                                                const isCompleted = completedYogaPoses.includes(idx);
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => !isCompleted && handleYogaPoseSelect(idx)}
                                                        disabled={isCompleted}
                                                        className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all group relative ${isCompleted ? 'opacity-50 grayscale border-neutral-100 cursor-not-allowed' : 'border-neutral-100 hover:border-primary-500 hover:bg-primary-50'}`}
                                                    >
                                                        {isCompleted && (
                                                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full z-10">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                            </div>
                                                        )}
                                                        <div className="w-full h-32 mb-3 rounded-xl overflow-hidden bg-neutral-50 shadow-inner">
                                                            <img src={pose.image} alt={pose.title} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
                                                        </div>
                                                        <span className="font-bold text-neutral-700">{pose.title}</span>
                                                        <span className="text-xs text-neutral-500">{pose.duration}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-8 text-sm text-neutral-500 italic">
                                            {completedYogaPoses.length} of {YOGA_POSES.length} poses completed
                                        </div>
                                    </div>
                                )}

                                {isPreparingYoga && activeActivity.title === 'Yoga Stretches' && (
                                    <div className="animate-fade-in text-center py-4">
                                        <div className="max-w-md mx-auto bg-neutral-50 rounded-3xl p-8 border border-neutral-100 mb-8">
                                            <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 bg-white shadow-sm">
                                                <img 
                                                    src={YOGA_POSES[emojiIndex].image} 
                                                    alt={YOGA_POSES[emojiIndex].title} 
                                                    className="w-full h-full object-contain p-4"
                                                />
                                            </div>
                                            <h3 className="text-2xl font-bold text-neutral-900 mb-2">Prepare for {YOGA_POSES[emojiIndex].title}</h3>
                                            <p className="text-neutral-600 mb-8">Find a comfortable space on your mat. We'll hold this pose for 1 minute.</p>
                                            <button
                                                onClick={startYogaSession}
                                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-primary-100 flex items-center justify-center gap-3 group"
                                            >
                                                Start Pose
                                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeActivity.type === 'timer' && !showYogaSelection && !isPreparingYoga && (
                                    <div className="space-y-8">

                                        {/* Activity-Specific Additions */}
                                        {activeActivity.title === 'Deep Breathing' && isActive && (
                                            <div className="my-12 flex flex-col items-center">
                                                <div className="w-48 h-48 bg-primary-100 rounded-full flex items-center justify-center animate-breathe shadow-[0_0_40px_rgba(59,130,246,0.3)] mb-8">
                                                    <div className="w-32 h-32 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold opacity-80 animate-breathe-inner">
                                                        Breathe
                                                    </div>
                                                </div>
                                                <audio src="/uploads/breath.mp3" autoPlay loop />
                                            </div>
                                        )}

                                        {(activeActivity.title === 'Meditation' || activeActivity.title === 'Progressive Relaxation') && isActive && (
                                            <div className="my-4 text-primary-600 flex flex-col items-center">
                                                <svg className="w-8 h-8 animate-pulse mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                                <span className="text-sm font-medium">Playing relaxing ambient sounds...</span>
                                                <audio src="/uploads/relaxation.mp3" autoPlay loop />
                                            </div>
                                        )}

                                        {activeActivity.title === 'Yoga Stretches' && (
                                            <div className="my-8 space-y-6">
                                                <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-xl border-4 border-primary-100 bg-white">
                                                    <img 
                                                        src={YOGA_POSES[emojiIndex % YOGA_POSES.length].image} 
                                                        alt={YOGA_POSES[emojiIndex % YOGA_POSES.length].title}
                                                        className="w-full h-full object-contain p-4"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end p-6 text-left pointer-events-none">
                                                        <span className="text-primary-100 font-bold text-sm uppercase tracking-wider opacity-80">Current Pose</span>
                                                        <h3 className="text-white text-3xl font-bold">{YOGA_POSES[emojiIndex % YOGA_POSES.length].title}</h3>
                                                    </div>
                                                </div>
                                                <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100 shadow-sm">
                                                    {YOGA_POSES[emojiIndex % YOGA_POSES.length].title === 'Cat-Cow Stretch' ? (
                                                        <div className="text-center">
                                                            <p className="text-primary-900 font-black text-2xl mb-2 animate-pulse">
                                                                {timeLeft > 30 ? "🐱 Cat Pose" : "🐮 Cow Pose"}
                                                            </p>
                                                            <p className="text-primary-700 font-medium text-lg">
                                                                {timeLeft > 30 ? "Arch your back up towards the ceiling" : "Drop your belly and look up slightly"}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-primary-800 font-bold text-lg text-center">Pose {completedYogaPoses.length + 1} of {YOGA_POSES.length}</p>
                                                    )}
                                                </div>
                                                <audio src="/uploads/atmosphere.mp3" autoPlay loop />
                                            </div>
                                        )}

                                        <div className="text-7xl font-mono font-bold text-primary-600 tracking-tight">
                                            {formatTime(timeLeft)}
                                        </div>
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => setIsActive(!isActive)}
                                                className={`px-8 py-3 rounded-xl font-bold text-lg transition-colors ${isActive ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                                            >
                                                {isActive ? 'Pause' : 'Resume'}
                                            </button>
                                            <button
                                                onClick={() => requestExit('complete')}
                                                className="px-6 py-3 rounded-xl font-medium text-neutral-500 hover:bg-neutral-100 transition-colors"
                                            >
                                                End Early
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeActivity.type === 'emoji' && (
                                    <div className="space-y-8">
                                        <div className="text-xl font-medium text-neutral-500 mb-6">
                                            Click on any emoji to copy it to your clipboard constraint! Share positivity.
                                        </div>

                                        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8">
                                            {POSITIVE_EMOJIS.map((emoji, idx) => (
                                                <button
                                                    key={idx}
                                                    id={`emoji-${emoji}`}
                                                    onClick={() => handleEmojiClick(emoji)}
                                                    className="text-5xl sm:text-6xl transform transition-transform hover:scale-110 active:scale-90 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-primary-200 hover:bg-primary-50 hover:shadow-sm"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="text-neutral-400 font-medium mb-8">
                                            Emojis Copied: <span className="text-primary-600 font-bold">{completedEmojis}</span>
                                        </div>

                                        <button
                                            onClick={() => setStep('complete')}
                                            className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md w-full sm:w-auto"
                                        >
                                            I'm Done
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'complete' && activeActivity && (
                        <div className="animate-fade-in-up max-w-2xl mx-auto text-center">
                            <div className="bg-white rounded-3xl shadow-xl border border-neutral-100 p-12 mb-8 relative overflow-hidden">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-float ${isEarlyExit ? 'bg-orange-50 text-orange-600' : 'bg-primary-50 text-primary-600'}`}>
                                    {isEarlyExit ? (
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    ) : (
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    )}
                                </div>
                                <h1 className="text-4xl font-black text-neutral-900 mb-4 tracking-tight">
                                    {isEarlyExit ? "Session Ended" : "Activity Complete!"}
                                </h1>
                                <p className="text-neutral-600 text-xl mb-12 max-w-md mx-auto leading-relaxed">
                                    {isEarlyExit 
                                        ? "Activity not fully completed please complete it from start or choose any other activity." 
                                        : <>You successfully finished <strong>{activeActivity.title}</strong>. Take a moment to notice how much better you feel.</>}
                                </p>
                                <button
                                    onClick={resetFlow}
                                    className="bg-neutral-900 hover:bg-primary-600 text-white font-bold px-10 py-5 rounded-2xl transition-all shadow-xl hover:shadow-primary-100 hover:-translate-y-1"
                                >
                                    Return to Wellness Center
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Exit Confirmation Modal */}
                    {showExitConfirm && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h3 className="text-2xl font-bold text-neutral-900 mb-2">End activity early?</h3>
                                <p className="text-neutral-600 mb-8">Activity not fully completed please complete it from start or choose any other activity.</p>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={cancelExit}
                                        className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 transition-colors"
                                    >
                                        Keep Going
                                    </button>
                                    <button 
                                        onClick={confirmExit}
                                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                    >
                                        Yes, End Early
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            <style jsx global>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0px); }
                }

                @keyframes breathe {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.5); opacity: 0.3; }
                }

                @keyframes breathe-inner {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                .animate-breathe {
                    animation: breathe 8s infinite ease-in-out;
                }

                .animate-breathe-inner {
                    animation: breathe-inner 8s infinite ease-in-out;
                }
            `}</style>
            <Footer />
        </div>
    );
}

