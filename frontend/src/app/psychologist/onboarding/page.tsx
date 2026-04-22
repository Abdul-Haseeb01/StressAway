'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, getProfile } from '@/utils/api';
import { useAlert } from '@/context/AlertContext';

export default function PsychologistOnboarding() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        bio: '',
        emergency_contact_phone: '',
        qualifications: '',
        experience_years: '',
        license_number: '',
    });

    useEffect(() => {
        const verifyUser = async () => {
            try {
                const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
                if (!userDataStr) {
                    router.push('/login');
                    return;
                }
                const user = JSON.parse(userDataStr);
                if (user.role !== 'psychologist') {
                    router.push('/dashboard');
                    return;
                }
                
                // Fetch latest profile to pre-fill form
                const profileData = await getProfile();
                const p = profileData.profile || {};
                
                setFormData({
                    full_name: p.full_name || user.full_name || '',
                    phone: p.phone || '',
                    date_of_birth: p.date_of_birth ? new Date(p.date_of_birth).toISOString().split('T')[0] : '',
                    gender: p.gender || '',
                    bio: p.bio || '',
                    emergency_contact_phone: p.emergency_contact_phone || '',
                    qualifications: p.qualifications || '',
                    experience_years: p.experience_years?.toString() || '',
                    license_number: p.license_number || '',
                });

                if (p.qualifications && p.verification_status !== 'rejected') {
                    // Already submitted and not rejected
                    router.push('/psychologist');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        };
        verifyUser();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updateData = {
                ...formData,
                experience_years: formData.experience_years ? parseInt(formData.experience_years) : 0,
                verification_status: 'pending' 
            };
            
            await updateProfile(updateData);
            
            // Also update local storage user if needed
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                userObj.verification_status = 'pending';
                userObj.full_name = formData.full_name;
                if ((localStorage.getItem('token') || sessionStorage.getItem('token'))) {
                    localStorage.setItem('user', JSON.stringify(userObj));
                } else {
                    sessionStorage.setItem('user', JSON.stringify(userObj));
                }
            }

            showAlert('Details submitted successfully! Awaiting administrator approval.', 'success');
            router.push('/psychologist');
        } catch (err: any) {
            const errorData = err.response?.data;
            if (errorData?.message && Array.isArray(errorData.message)) {
                // Join multiple validation errors
                showAlert(`Please correct the following: ${errorData.message.join(', ')}`, 'error');
            } else {
                showAlert(errorData?.message || 'Failed to submit details', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="spinner border-primary-600 w-12 h-12"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
            <div className="w-full max-w-2xl mx-auto">
                <div className="text-center mb-10 animate-fade-in-up">
                    <h1 className="text-4xl font-black text-neutral-900 mb-3 tracking-tight">Psychologist Verification</h1>
                    <p className="text-neutral-600 font-medium max-w-lg mx-auto">Complete your professional profile to join our mental health support network.</p>
                </div>

                <div className="bg-white rounded-3xl shadow-soft-2xl border border-neutral-100 overflow-hidden animate-fade-in-up">
                    <form onSubmit={handleSubmit} className="divide-y divide-neutral-100">
                        {/* Section 1: General Info */}
                        <div className="p-8 space-y-6">
                            <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
                                <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center text-sm font-black">01</span>
                                General Profile Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label text-neutral-700 font-bold">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="input w-full bg-neutral-50/50"
                                        placeholder="Dr. Jane Smith"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label text-neutral-700 font-bold">Phone Number</label>
                                    <input
                                        required
                                        type="tel"
                                        className="input w-full bg-neutral-50/50"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label text-neutral-700 font-bold">Date of Birth</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="date"
                                            className="input w-full bg-neutral-50/50 modern-date-picker"
                                            value={formData.date_of_birth}
                                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                            📅
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="label text-neutral-700 font-bold">Gender</label>
                                    <select
                                        required
                                        className="input w-full bg-neutral-50/50"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="label text-neutral-700 font-bold">Professional Bio</label>
                                <textarea
                                    className="input w-full bg-neutral-50/50 min-h-[100px]"
                                    placeholder="Write a brief professional introduction..."
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label text-neutral-700 font-bold">Emergency Contact Phone</label>
                                <input
                                    type="tel"
                                    className="input w-full bg-neutral-50/50"
                                    placeholder="Emergency backup contact number"
                                    value={formData.emergency_contact_phone}
                                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Section 2: Verification Details */}
                        <div className="p-8 bg-neutral-50/30 space-y-6">
                            <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
                                <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center text-sm font-black">02</span>
                                Professional Verification
                            </h2>
                            <div>
                                <label className="label text-neutral-700 font-bold">Academic Qualifications & Degrees</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="input w-full bg-white"
                                    placeholder="e.g. Ph.D. in Clinical Psychology, M.S. in Counseling..."
                                    value={formData.qualifications}
                                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label text-neutral-700 font-bold">Years of Experience</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="input w-full bg-white"
                                        placeholder="e.g. 5"
                                        value={formData.experience_years}
                                        onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label text-neutral-700 font-bold">License Number</label>
                                    <input
                                        type="text"
                                        required
                                        className="input w-full bg-white"
                                        placeholder="Professional Registration ID"
                                        value={formData.license_number}
                                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white text-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full max-w-sm font-bold shadow-navy py-4 text-lg"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <div className="spinner-sm mr-2 border-white/30 border-t-white"></div>
                                        Submitting...
                                    </span>
                                ) : (
                                    'Submit for Verification'
                                )}
                            </button>
                            <p className="mt-4 text-xs text-neutral-500 font-medium">By submitting, you agree to our Terms of Service for Professional Practitioners.</p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

