'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { User, Plus, Trash2, Mail, Shield, Calendar, ArrowLeft, Clock, Check, X, Bell, Edit3, Megaphone, Key, Loader2, Circle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType, RegistrationRequest, ACCESS_LEVELS, AccessLevel } from '@/types/auth';
import { AnnouncementWithReadStatus, CreateAnnouncementRequest } from '@/types/announcements';
import { supabase } from '@/lib/supabase';

let cachedToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;

async function getAuthToken(): Promise<string | null> {
  if (cachedToken) {
    console.log('[TOKEN] Using cached token');
    return cachedToken;
  }

  if (tokenFetchPromise) {
    console.log('[TOKEN] Waiting for ongoing token fetch');
    return tokenFetchPromise;
  }

  tokenFetchPromise = (async () => {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      console.log('[TOKEN] Trying localStorage...');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && typeof localStorage !== 'undefined') {
        try {
          const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
          const stored = localStorage.getItem(storageKey);
          
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const token = parsed.access_token;
              if (token && typeof token === 'string') {
                console.log('[TOKEN] Found token in localStorage');
                cachedToken = token;
                return token;
              }
            } catch (e) {
              console.log('[TOKEN] localStorage parse failed');
            }
          }
        } catch (e) {
          console.log('[TOKEN] localStorage access failed');
        }
      }

      console.log('[TOKEN] Trying cookies...');
      if (typeof document !== 'undefined') {
        try {
          const cookies = document.cookie.split(';');
          const authCookie = cookies.find(c => c.trim().startsWith('sb-') && c.includes('auth-token'));
          
          if (authCookie) {
            try {
              const cookieValue = authCookie.split('=')[1];
              const decoded = JSON.parse(decodeURIComponent(cookieValue));
              const token = decoded.access_token || decoded;
              if (token && typeof token === 'string') {
                console.log('[TOKEN] Found token in cookies');
                cachedToken = token;
                return token;
              }
            } catch (e) {
              console.log('[TOKEN] Cookie parse failed');
            }
          }
        } catch (e) {
          console.log('[TOKEN] Cookie access failed');
        }
      }

      console.log('[TOKEN] Trying getSession with timeout...');
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]) as any;
      
      const token = result?.data?.session?.access_token || null;
      if (token) {
        console.log('[TOKEN] Got token from getSession');
        cachedToken = token;
      } else {
        console.log('[TOKEN] No token from getSession');
      }
      return token;
    } catch (error) {
      console.error('[TOKEN] Error getting token:', error);
      return null;
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
}

export default function AdminPanel() {
  const { user, logout, rejectRegistration } = useAuth();
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'announcements'>('users');
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user' as 'admin' | 'user',
    access_level: 1 as AccessLevel
  });
  const [selectedPackage, setSelectedPackage] = useState<AccessLevel>(1);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementWithReadStatus[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    image_url: ''
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    image_url: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  
  // Стани для завантаження
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  
  // Стани для зміни пароля
  const [changingPassword, setChangingPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    setIsLoadingAnnouncements(true);
    try {
      console.log('[ADMIN] Loading announcements...');
      const token = await getAuthToken();
      
      const response = await fetch('/api/announcements', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      const data = await response.json();
      
      console.log('[ADMIN] Announcements loaded:', data.announcements?.length);
      
      if (data.success) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('❌ AdminPanel: No access token available');
        return;
      }
      
      const response = await fetch('/api/admin/requests', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('❌ AdminPanel: API error:', response.status, response.statusText);
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.requests) {
        const formattedRequests = result.requests.map((req: any) => ({
          id: req.id,
          email: req.email,
          password: req.password,
          name: req.name,
          createdAt: req.created_at,
          status: 'pending' as const
        }));
        setRegistrationRequests(formattedRequests);
      } else {
        setRegistrationRequests([]);
      }
    } catch (error) {
      console.error('💥 AdminPanel: Error loading requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    loadUsers();
    loadAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(newUser),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadUsers();
        setNewUser({ email: '', password: '', name: '', role: 'user', access_level: 1 });
        setShowAddForm(false);
      } else {
        alert(data.message || 'Error creating user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      alert('You cannot delete your own account');
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadUsers();
      } else {
        alert(data.message || 'Error deleting user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleApproveRequest = async (requestId: string, accessLevel: AccessLevel) => {
    try {
      const response = await fetch('/api/admin/approve-registration', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ requestId, access_level: accessLevel }),
      });

      const data = await response.json();

      if (data.success) {
        await loadRequests();
        await loadUsers();
      } else {
        alert(data.message || 'Error approving request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const success = await rejectRegistration(requestId);
    if (success) {
      await loadRequests();
    }
  };

  const handleUpdateUserAccess = async (userId: string, newAccessLevel: AccessLevel) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ id: userId, access_level: newAccessLevel }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadUsers();
        setEditingUser(null);
      } else {
        alert(data.message || 'Error updating user access level');
      }
    } catch (error) {
      console.error('Error updating user access:', error);
      alert('Error updating user access level');
    }
  };

  const handleChangePassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ id: userId, password: newPassword }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Password updated successfully');
        setChangingPassword(null);
        setNewPassword('');
      } else {
        alert(data.message || 'Error updating password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Error updating password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCreating) {
      console.log('[ADMIN] Already creating, ignoring duplicate submit');
      return;
    }

    setIsCreating(true);
    
    console.log('[ADMIN] Starting announcement creation...');
    console.log('[ADMIN] Form data:', {
      title: newAnnouncement.title,
      contentLength: newAnnouncement.content?.length,
      hasImage: !!newAnnouncement.image_url
    });
    
    if (!newAnnouncement.title || !newAnnouncement.content) {
      console.error('[ADMIN] Validation failed: missing required fields');
      alert('Title and content are required');
      setIsCreating(false);
      return;
    }

    try {
      const normalizedImageUrl = (() => {
        const raw = (newAnnouncement.image_url || '').trim();
        if (!raw) return '';
        if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) return raw;
        return `https://${raw}`;
      })();

      console.log('[ADMIN] Normalized image URL:', normalizedImageUrl);

      const requestBody = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        image_url: normalizedImageUrl || undefined,
      };

      console.log('[ADMIN] Getting session token...');
      const token = await getAuthToken();

      if (!token) {
        console.error('[ADMIN] No auth token available!');
        alert('Authentication error. Please refresh the page and try again.');
        setIsCreating(false);
        return;
      }

      console.log('[ADMIN] Token acquired successfully');

      console.log('[ADMIN] Sending request to /api/announcements');
      console.log('[ADMIN] Request body:', requestBody);
      
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[ADMIN] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      let data: any = null;
      try {
        data = await response.json();
        console.log('[ADMIN] Response data:', data);
      } catch (e) {
        const text = await response.text();
        console.error('[ADMIN] Failed to parse JSON response:', text);
        alert('Server error while creating announcement');
        setIsCreating(false);
        return;
      }

      if (response.ok && data?.success) {
        console.log('[ADMIN] Announcement created successfully!');
        setNewAnnouncement({ title: '', content: '', image_url: '' });
        console.log('[ADMIN] Reloading announcements list...');
        await loadAnnouncements();
        console.log('[ADMIN] Announcements reloaded, resetting form...');
        setIsCreating(false);
        alert('Announcement created successfully!');
      } else {
        console.error('[ADMIN] Create failed:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        setIsCreating(false);
        alert(data?.message || `Error creating announcement: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[ADMIN] Exception during creation:', error);
      setIsCreating(false);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Network error: Could not connect to server. Check if server is running.');
      } else {
        alert(`Error creating announcement: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleEditAnnouncement = (announcement: AnnouncementWithReadStatus) => {
    setEditingAnnouncement(announcement.id);
    setEditForm({
      title: announcement.title,
      content: announcement.content,
      image_url: announcement.image_url || ''
    });
  };

  const handleUpdateAnnouncement = async (id: string) => {
    if (!editForm.title || !editForm.content) {
      alert('Title and content are required');
      return;
    }

    try {
      const token = await getAuthToken();

      if (!token) {
        alert('Authentication error. Please refresh the page.');
        return;
      }
      
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (data.success) {
        setEditingAnnouncement(null);
        setEditForm({ title: '', content: '', image_url: '' });
        await loadAnnouncements();
      } else {
        alert(data.message || 'Error updating announcement');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Error updating announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      console.log('[ADMIN] Delete cancelled by user');
      return;
    }

    console.log('[ADMIN] Starting announcement deletion...', id);

    try {
      console.log('[ADMIN] Getting session token...');
      const token = await getAuthToken();

      if (!token) {
        console.error('[ADMIN] No auth token!');
        alert('Authentication error. Please refresh the page.');
        return;
      }

      console.log('[ADMIN] Token acquired, sending DELETE request to /api/announcements/' + id);
      
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[ADMIN] DELETE Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('[ADMIN] DELETE Response data:', data);

      if (data.success) {
        console.log('[ADMIN] Announcement deleted successfully!');
        await loadAnnouncements();
      } else {
        console.error('[ADMIN] Delete failed:', {
          status: response.status,
          data
        });
        alert(data.message || `Error deleting announcement: ${response.status}`);
      }
    } catch (error) {
      console.error('[ADMIN] Exception during deletion:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Network error: Could not connect to server. Check if server is running.');
      } else {
        alert(`Error deleting announcement: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div 
        className="fixed inset-0 bg-repeat bg-fixed bg-center pointer-events-none z-0"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url(/img/lesson-bg.svg)',
          backgroundSize: '250% auto',
          filter: 'brightness(1.4) contrast(1.1)',
          opacity: 0.5
        }}
      />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-gray-400">Manage training program users</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-sm text-gray-400">Logged in as</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <Link href="/" className="flex items-center justify-center w-full sm:w-auto gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to training program
            </Link>
          </div>
        </div>

        <div className="bg-[#0f1012] rounded-lg p-4 sm:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'users'
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'requests'
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Bell className="w-4 h-4" />
                Requests
                {registrationRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                    {registrationRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'announcements'
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                Announcements ({announcements.length})
              </button>
            </div>
            {activeTab === 'users' && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 bg-primary hover:bg-red-700 px-4 py-2 rounded-lg transition-colors w-full md:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                {showAddForm ? 'Hide Form' : 'Add User'}
              </button>
            )}
          </div>

          {activeTab === 'users' && showAddForm && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium mb-4">New User</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Full Name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Password"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Access Level
                    </label>
                    <select
                      value={newUser.access_level}
                      onChange={(e) => setNewUser(prev => ({ ...prev, access_level: parseInt(e.target.value) as AccessLevel }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value={1}>Basic</option>
                      <option value={2}>Premium</option>
                      <option value={3}>VIP</option>
                      <option value={4}>Without Road Map</option>
                      <option value={5}>Blocked</option>
                      <option value={6}>Creative Push Only</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="ml-3 text-gray-400">Loading users...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No users found</p>
                </div>
              ) : users.map((userItem) => (
                <div key={userItem.id} className="bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 w-full">
                    <div className="bg-gray-700 p-3 rounded-lg mt-1">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium break-all">{userItem.email}</span>
                        {userItem.role === 'admin' && (
                          <div className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded text-xs">
                            <Shield className="w-3 h-3" />
                            Admin
                          </div>
                        )}
                        {editingUser === userItem.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={userItem.access_level}
                              onChange={(e) => handleUpdateUserAccess(userItem.id, parseInt(e.target.value) as AccessLevel)}
                              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value={1}>Basic</option>
                              <option value={2}>Premium</option>
                              <option value={3}>VIP</option>
                              <option value={4}>Without Buttons</option>
                              <option value={5}>Blocked</option>
                              <option value={6}>Creative Push Only</option>
                            </select>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="text-gray-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs">
                            {ACCESS_LEVELS[userItem.access_level as AccessLevel]?.name || 'Unknown'}
                            <button
                              onClick={() => setEditingUser(userItem.id)}
                              className="ml-1 hover:text-blue-300"
                              title="Edit access level"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </div>
                      {userItem.name && (
                        <div className="text-sm text-gray-300 mt-1">
                          <span className="font-medium">Name: {userItem.name}</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-400 mt-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {new Date(userItem.created_at).toLocaleDateString('en-US')}</span>
                        </div>
                        {userItem.last_seen ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Last seen: {new Date(userItem.last_seen).toLocaleString('en-US', {
                              timeZone: 'Europe/Warsaw',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-500">Never</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Circle className={`w-3 h-3 ${userItem.is_active ? 'text-green-500 fill-green-500' : 'text-gray-500 fill-gray-500'}`} />
                          <span className={userItem.is_active ? 'text-green-400' : 'text-gray-500'}>
                            {userItem.is_active ? 'Active' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editingUser !== userItem.id && (
                      <button
                        onClick={() => setEditingUser(userItem.id)}
                        className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        title="Edit access level"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="md:hidden">Edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setChangingPassword(userItem.id);
                        setNewPassword('');
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      title="Change password"
                    >
                      <Key className="w-4 h-4" />
                      <span className="md:hidden">Password</span>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(userItem.id)}
                      disabled={userItem.id === user?.id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      title={userItem.id === user?.id ? 'You cannot delete your own account' : 'Delete user'}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="md:hidden">Delete</span>
                    </button>
                  </div>
                  
                  {/* Форма зміни пароля */}
                  {changingPassword === userItem.id && (
                    <div className="mt-4 p-4 bg-gray-700 rounded-lg w-full">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Change Password for {userItem.email}</h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 6 chars)"
                          className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleChangePassword(userItem.id)}
                            disabled={isUpdatingPassword || newPassword.length < 6}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          >
                            {isUpdatingPassword ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setChangingPassword(null);
                              setNewPassword('');
                            }}
                            className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="ml-3 text-gray-400">Loading requests...</span>
                </div>
              ) : registrationRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No registration requests</p>
                </div>
              ) : (
                registrationRequests.map((request) => (
                  <div key={request.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-orange-600/20 p-3 rounded-lg mt-1">
                          <Clock className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex flex-wrap items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium break-all">{request.email}</span>
                            <div className="flex items-center gap-1 bg-orange-600/20 text-orange-500 px-2 py-1 rounded text-xs">
                              <Clock className="w-3 h-3" />
                              Pending
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                            <Calendar className="w-4 h-4" />
                            <span>Request from: {new Date(request.createdAt).toLocaleString('en-US')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <div className="flex gap-2">
                          <select
                            value={selectedPackage}
                            onChange={(e) => setSelectedPackage(parseInt(e.target.value) as AccessLevel)}
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value={1}>Basic</option>
                            <option value={2}>Premium</option>
                            <option value={3}>VIP</option>
                            <option value={4}>Without Buttons</option>
                            <option value={5}>Blocked</option>
                            <option value={6}>Creative Push Only</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveRequest(request.id, selectedPackage)}
                            className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-colors flex-1 flex items-center justify-center gap-2"
                            title="Approve registration"
                          >
                            <Check className="w-4 h-4" />
                            <span className="md:hidden">Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors flex-1 flex items-center justify-center gap-2"
                            title="Reject registration"
                          >
                            <X className="w-4 h-4" />
                            <span className="md:hidden">Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Create New Announcement</h3>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter announcement title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Content
                    </label>
                    <textarea
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Enter announcement content"
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Image URL (optional)
                    </label>
                    <input
                      type="text"
                      value={newAnnouncement.image_url}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder="https://example.com/image.jpg або /img/promo.webp"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Creating...' : 'Create Announcement'}
                  </button>
                </form>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Existing Announcements</h3>
                <div className="space-y-4">
                  {isLoadingAnnouncements ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <span className="ml-3 text-gray-400">Loading announcements...</span>
                    </div>
                  ) : announcements.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No announcements yet</p>
                  ) : (
                    announcements.map((announcement) => (
                      <div key={announcement.id} className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-5 border border-gray-600 shadow-lg hover:shadow-xl transition-all">
                        {editingAnnouncement === announcement.id ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Title
                              </label>
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Content
                              </label>
                              <textarea
                                value={editForm.content}
                                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={4}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Image URL
                              </label>
                              <input
                                type="text"
                                value={editForm.image_url}
                                onChange={(e) => setEditForm(prev => ({ ...prev, image_url: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateAnnouncement(announcement.id)}
                                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingAnnouncement(null);
                                  setEditForm({ title: '', content: '', image_url: '' });
                                }}
                                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-lg font-semibold text-white">
                              {announcement.title}
                            </h4>
                                {announcement.is_edited && (
                                  <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/30">
                                    Edited
                                  </span>
                                )}
                              </div>
                            <p className="text-gray-300 text-sm mb-3 whitespace-pre-wrap">
                              {announcement.content}
                            </p>
                            {announcement.image_url && (
                              <div className="mb-3">
                                <img
                                  src={announcement.image_url}
                                  alt={announcement.title}
                                    className="max-h-40 rounded-lg object-cover border border-gray-600 shadow-md"
                                />
                              </div>
                            )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                              <span>
                                    {new Date(announcement.created_at).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                      month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                                </div>
                                {announcement.is_edited && announcement.updated_at && (
                                  <div className="flex items-center gap-1 text-blue-400">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      Updated: {new Date(announcement.updated_at).toLocaleDateString('en-US', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                )}
                              {announcement.read_count !== undefined && announcement.total_users !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <Bell className="w-3 h-3" />
                                <span>
                                      {announcement.read_count} / {announcement.total_users} users read
                                </span>
                                  </div>
                              )}
                            </div>
                          </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditAnnouncement(announcement)}
                                className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition-colors group"
                                title="Edit announcement"
                              >
                                <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                                className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors group"
                            title="Delete announcement"
                          >
                                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}