// Chatbot Page
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import api from '@/utils/api';
import { RootState } from '@/store/store';
import { setMessages, addMessage } from '@/store/slices/chatSlice';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ChatbotPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { messages } = useSelector((state: RootState) => state.chat);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        fetchChatHistory();
    }, [router]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchChatHistory = async () => {
        try {
            const response = await api.get('/chatbot/history');
            dispatch(setMessages(response.data));
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current && messagesEndRef.current.parentElement) {
            const container = messagesEndRef.current.parentElement;
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    const handleSend = async () => {
        if (!input.trim() || sending) return;

        const userMessage = {
            id: Date.now().toString(),
            message: input,
            is_user_message: true,
            created_at: new Date().toISOString(),
        };

        dispatch(addMessage(userMessage));
        setInput('');
        setSending(true);

        try {
            const response = await api.post('/chatbot/send', { message: input });

            const botMessage = {
                id: (Date.now() + 1).toString(),
                message: response.data.bot_response,
                is_user_message: false,
                created_at: new Date().toISOString(),
            };

            dispatch(addMessage(botMessage));
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        
        return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const isNewDay = (index: number) => {
        if (index === 0) return true;
        const prevDate = new Date(messages[index - 1].created_at).toDateString();
        const currDate = new Date(messages[index].created_at).toDateString();
        return prevDate !== currDate;
    };

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Header />

            <main className="w-full max-w-screen-xl mx-auto pt-24 pb-4 px-4 sm:px-6">
                <div className="flex flex-col w-full h-[calc(100vh-120px)] min-h-[500px] bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden">
                    <div className="shrink-0 py-4 text-center border-b border-neutral-100 bg-neutral-50/50">
                        <h1 className="text-2xl font-black text-neutral-900 mb-0.5 tracking-tight">AI Mental Wellness Assistant</h1>
                        <p className="text-neutral-500 text-xs hidden sm:block">Personalized support tailored to your recent stress scores</p>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 bg-white overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 flex flex-col min-h-0 w-full relative scrollbar-thin">
                        {messages.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-500 py-12">
                                <div className="text-6xl mb-6 bg-primary-50 w-24 h-24 rounded-full flex items-center justify-center text-primary-600">
                                    <svg className="w-12 h-12 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-neutral-900 mb-2">How are you feeling today?</h3>
                                <p className="max-w-md">Start a conversation! I can help you manage stress, suggest wellness activities, or guide you through relaxation techniques.</p>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div key={message.id} className="flex flex-col gap-4">
                                {isNewDay(index) && (
                                    <div className="flex justify-center my-6">
                                        <span className="bg-neutral-200/80 backdrop-blur-sm text-neutral-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.1em] shadow-sm border border-neutral-300/50">
                                            {formatDateHeader(message.created_at)}
                                        </span>
                                    </div>
                                )}
                                <div
                                    className={`flex ${message.is_user_message ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 ${message.is_user_message
                                            ? 'bg-primary-600 text-white rounded-br-none shadow-md shadow-primary-900/10'
                                            : 'bg-neutral-200 text-neutral-800 rounded-bl-none border border-neutral-300'
                                            }`}
                                    >
                                        {message.is_user_message ? (
                                            <p className="whitespace-pre-wrap">{message.message}</p>
                                        ) : (
                                            <div className="prose prose-sm sm:prose-base max-w-none text-neutral-800 prose-p:leading-relaxed prose-pre:bg-neutral-800 prose-pre:text-white prose-a:text-primary-600">
                                                <ReactMarkdown>{message.message}</ReactMarkdown>
                                            </div>
                                        )}
                                        <div className={`text-xs mt-2 text-right ${message.is_user_message ? 'text-primary-200' : 'text-neutral-400'}`}>
                                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sending && (
                            <div className="flex justify-start">
                                <div className="bg-neutral-100 rounded-2xl rounded-bl-none border border-neutral-200 px-5 py-4">
                                    <div className="flex space-x-2 items-center h-6">
                                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-4 shrink-0" />
                    </div>

                    {/* Input Area */}
                    <div className="shrink-0 bg-neutral-50 border-t border-neutral-100 p-4 flex items-center gap-4 w-full">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Message StressAway Assistant..."
                            className="flex-1 bg-neutral-100 border-none focus:ring-0 px-4 py-2 text-neutral-900 placeholder:text-neutral-400 outline-none caret-black"
                            disabled={sending}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className="bg-primary-600 hover:bg-primary-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

