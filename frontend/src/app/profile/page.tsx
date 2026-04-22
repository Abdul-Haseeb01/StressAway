'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProfile, updateProfile, uploadAvatar } from '@/utils/api';
import { getStoredToken, getStoredUser, updateStoredUser } from '@/utils/storage';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Format array errors from NestJS into a readable string
    const formatErrorMessage = (msg: any, fallback: string) => {
        if (!msg) return fallback;
        if (Array.isArray(msg)) return msg.join(' • ');
        return typeof msg === 'string' ? msg : fallback;
    };

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        bio: '',
        emergency_contact_phone: '',
        avatar_url: ''
    });

    useEffect(() => {
        const token = getStoredToken();
        if (!token) {
            router.push('/login');
            return;
        }

        setIsAuthorized(true);
        fetchUserProfile();
    }, [router]);

    const fetchUserProfile = async () => {
        try {
            const data = await getProfile();
            const profile = data.profile || {};
            setFormData({
                full_name: profile.full_name || '',
                email: data.email || '',
                phone: profile.phone || '',
                date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth).toISOString().split('T')[0] : '',
                gender: profile.gender || '',
                bio: profile.bio || '',
                emergency_contact_phone: profile.emergency_contact_phone || '',
                avatar_url: profile.avatar_url || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMessage({ text: 'Failed to load profile. Please try logging in again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        setMessage({ text: '', type: '' });

        try {
            const result = await uploadAvatar(file);
            setFormData(prev => ({ ...prev, avatar_url: result.avatar_url }));
            setMessage({ text: 'Avatar uploaded successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);

            // Optionally update user in localStorage
            const currentUser = getStoredUser() || {};
            const updatedUser = {
                ...currentUser,
                avatar_url: result.avatar_url
            };
            
            updateStoredUser(updatedUser);

            // Notify other components (like Header) that the profile has updated
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('userProfileUpdated'));
            }

        } catch (error: any) {
            setMessage({
                text: formatErrorMessage(error.response?.data?.message, 'Failed to upload avatar.'),
                type: 'error'
            });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        try {
            // Update profile info (we omit email and avatar_url)
            const { email, avatar_url, ...profileData } = formData;
            const updatedProfile = await updateProfile(profileData);

            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            setIsEditing(false);

            // Also update local storage if name changed
            const currentUser = getStoredUser() || {};
            const updatedUser = {
                ...currentUser,
                full_name: formData.full_name
            };

            updateStoredUser(updatedUser);

            // Notify other components (like Header) that the profile has updated
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('userProfileUpdated'));
            }

            // Optional: clear success message after 3 seconds
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);

        } catch (error: any) {
            setMessage({
                text: formatErrorMessage(error.response?.data?.message, 'Failed to update profile. Please try again.'),
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    if (!isAuthorized) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-neutral-50">
            <Header />

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 mt-16">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">

                        <div className="bg-primary-900 px-6 py-8 sm:p-10 text-white flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold">Personal Profile</h1>
                                <p className="mt-2 text-primary-100">
                                    Update your personal details.
                                </p>
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-white text-primary-900 rounded-lg hover:bg-neutral-50 transition-colors font-medium shadow-sm"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        <div className="px-6 py-8 sm:p-10">
                            {message.text && (
                                <div className={`mb-6 p-4 rounded-xl flex items-start gap-4 shadow-sm border ${message.type === 'success'
                                    ? 'bg-green-50 text-green-900 border-green-200'
                                    : 'bg-red-50 text-red-900 border-red-200'
                                    }`}>
                                    <span className="text-xl mt-0.5">
                                        {message.type === 'success' ? '✅' : '⚠️'}
                                    </span>
                                    <div>
                                        <h3 className={`text-sm font-semibold mb-1 ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                            {message.type === 'success' ? 'Success' : 'Action Required'}
                                        </h3>
                                        <p className="text-sm font-medium opacity-90">{message.text}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* Profile Picture Section */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-neutral-900 border-b pb-2 mb-4 flex items-center justify-between">
                                        <span>Profile Picture</span>
                                        <span className="text-sm font-normal text-neutral-500">Optional</span>
                                    </h2>
                                    <div className="flex items-center gap-6">
                                        <div className="h-24 w-24 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0 border-2 border-primary-100 flex items-center justify-center">
                                            {formData.avatar_url ? (
                                                <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-neutral-400 text-3xl">👤</span>
                                            )}
                                        </div>
                                        <div className="flex-grow max-w-md">
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <input
                                                        type="file"
                                                        id="avatar"
                                                        accept="image/*"
                                                        onChange={handleAvatarChange}
                                                        disabled={uploadingAvatar}
                                                        className="block w-full text-sm text-neutral-500
                                                            file:mr-4 file:py-2 file:px-4
                                                            file:rounded-full file:border-0
                                                            file:text-sm file:font-semibold
                                                            file:bg-primary-50 file:text-primary-700
                                                            hover:file:bg-primary-100
                                                            disabled:opacity-50 disabled:cursor-not-allowed
                                                        "
                                                    />
                                                    <p className="text-xs text-neutral-500">
                                                        {uploadingAvatar ? 'Uploading...' : 'JPG, PNG, GIF up to 5MB'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-sm font-medium text-neutral-600">
                                                    {formData.avatar_url ? 'Profile picture uploaded' : 'No profile picture'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Information Section */}
                                <div>
                                    <h2 className="text-xl font-semibold text-neutral-900 border-b pb-2 mb-4">
                                        Personal Information
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="full_name" className="block text-sm font-medium text-neutral-700 mb-1">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                id="full_name"
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-neutral-100 disabled:text-neutral-500"
                                                placeholder="John Doe"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                                                Email Address (Read only)
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                disabled
                                                className="w-full px-4 py-2 border border-neutral-200 bg-neutral-100 rounded-lg text-neutral-500"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-neutral-100 disabled:text-neutral-500"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="date_of_birth" className="block text-sm font-medium text-neutral-700 mb-1">
                                                Date of Birth
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    id="date_of_birth"
                                                    name="date_of_birth"
                                                    value={formData.date_of_birth}
                                                    onChange={handleChange}
                                                    disabled={!isEditing}
                                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-neutral-100 disabled:text-neutral-500 appearance-none bg-white modern-date-picker"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                                    📅
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-neutral-700 mb-1">
                                                Emergency Contact Number
                                            </label>
                                            <input
                                                type="tel"
                                                id="emergency_contact_phone"
                                                name="emergency_contact_phone"
                                                value={formData.emergency_contact_phone}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-neutral-100 disabled:text-neutral-500"
                                                placeholder="Emergency backup number"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 mb-1">
                                                Professional/Personal Bio
                                            </label>
                                            <textarea
                                                id="bio"
                                                name="bio"
                                                rows={3}
                                                value={formData.bio}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-neutral-100 disabled:text-neutral-500 resize-none"
                                                placeholder="Brief introduction about yourself..."
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label htmlFor="gender" className="block text-sm font-medium text-neutral-700 mb-1">
                                                Gender identity
                                            </label>
                                            <select
                                                id="gender"
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-neutral-100 disabled:text-neutral-500"
                                            >
                                                <option value="">Prefer not to state</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="non-binary">Non-binary</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>


                                {isEditing && (
                                    <div className="pt-6 border-t border-neutral-200 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            disabled={saving || uploadingAvatar}
                                            onClick={() => setIsEditing(false)}
                                            className="px-6 py-2.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving || uploadingAvatar}
                                            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]"
                                        >
                                            {saving ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                'Save Profile'
                                            )}
                                        </button>
                                    </div>
                                )}
                            </form>

                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

