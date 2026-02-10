'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { User, Plus, Trash2, Mail, Shield, Calendar, ArrowLeft, Clock, Check, X, Bell, Edit3, Megaphone, Key, Loader2, Circle, DollarSign, ExternalLink, Wallet, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType, RegistrationRequest, ACCESS_LEVELS, AccessLevel } from '@/types/auth';
import { AnnouncementWithReadStatus, CreateAnnouncementRequest } from '@/types/announcements';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  crypto_address: string;
  transaction_hash: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  profiles?: {
    email: string;
    name: string | null;
  };
}

interface BlacklistedEmail {
  email: string;
  reason: string | null;
  request_from: string | null;
  created_at: string;
}

// Removed global cachedToken to ensure freshness
let tokenFetchPromise: Promise<string | null> | null = null;

async function getAuthToken(): Promise<string | null> {
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  tokenFetchPromise = (async () => {
    try {
      if (typeof window === 'undefined') return null;

      // 1. Try getSession first (Priority: Freshness)
      // This handles token refresh automatically
      try {
        console.log('[TOKEN] Trying getSession with timeout...');
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
          )
        ]) as { data: { session: any } };

        if (sessionResult.data?.session?.access_token) {
          console.log('[TOKEN] Got fresh token from getSession');
          return sessionResult.data.session.access_token;
        }
      } catch (e) {
        console.warn('[TOKEN] getSession failed or timed out, trying fallbacks');
      }

      // 2. Fallback: LocalStorage (Priority: Resilience)
      console.log('[TOKEN] Trying localStorage fallback...');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && typeof localStorage !== 'undefined') {
        try {
          const projectId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
          if (projectId) {
            const storageKey = `sb-${projectId}-auth-token`;
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
              const parsed = JSON.parse(stored);
              const token = parsed.access_token;
              if (token) {
                console.log('[TOKEN] Found token in localStorage');
                return token;
              }
            }
          }
        } catch (e) {
          console.log('[TOKEN] localStorage access failed');
        }
      }
      
      return null;
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
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'announcements' | 'transactions' | 'blacklist'>('users');
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
  
  // Транзакції та баланс
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [adjustingBalance, setAdjustingBalance] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'add' | 'set'>('add');
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);

  // Payment Reminder (Single per user)
  const [editingReminder, setEditingReminder] = useState<string | null>(null);
  const [reminderText, setReminderText] = useState('');
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  
  // Overdue Message (Custom for Payment Overdue screen)
  const [editingOverdue, setEditingOverdue] = useState<string | null>(null);
  const [overdueText, setOverdueText] = useState('');
  const [isUpdatingOverdue, setIsUpdatingOverdue] = useState(false);
  
  // Blacklist
  const [blacklist, setBlacklist] = useState<BlacklistedEmail[]>([]);
  const [isLoadingBlacklist, setIsLoadingBlacklist] = useState(true);
  const [newBlacklistEmail, setNewBlacklistEmail] = useState('');
  const [newBlacklistReason, setNewBlacklistReason] = useState('');
  const [isAddingToBlacklist, setIsAddingToBlacklist] = useState(false);

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

  const loadTransactions = useCallback(async () => {
    setIsLoadingTransactions(true);
    try {
      const response = await fetch('/api/admin/transactions');
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  const loadBlacklist = useCallback(async () => {
    setIsLoadingBlacklist(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/admin/blacklist', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      const data = await response.json();
      if (data.success) {
        setBlacklist(data.blacklist);
      }
    } catch (error) {
      console.error('Error loading blacklist:', error);
    } finally {
      setIsLoadingBlacklist(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    loadUsers();
    loadAnnouncements();
    loadTransactions();
    loadBlacklist();
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
    if (!confirm('Are you sure you want to reject this request?')) return;
    const success = await rejectRegistration(requestId);
    if (success) {
      await loadRequests();
    }
  };

  const handleBlockRequest = async (requestId: string, email: string) => {
    if (!confirm(`Are you sure you want to block ${email} and reject their request?`)) return;
    
    try {
      // 1. Add to Blacklist
      const response = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          reason: 'Blocked from requests list',
          request_from: registrationRequests.find(r => r.id === requestId)?.name || 'Unknown'
        }),
      });
      
      const data = await response.json();
      if (!data.success) {
        alert(data.message || 'Error adding to blacklist');
        return;
      }

      // 2. Reject Request
      const success = await rejectRegistration(requestId);
      if (success) {
        await loadRequests();
        await loadBlacklist();
        alert(`${email} has been blacklisted and the request was rejected.`);
      }
    } catch (error) {
      console.error('Error blocking request:', error);
      alert('An error occurred while blocking the request.');
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

  const handleUpdateTransaction = async (id: string, status: 'confirmed' | 'rejected') => {
    try {
      const response = await fetch('/api/admin/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (data.success) {
        await loadTransactions();
        await loadUsers(); // Balance might have changed
      } else {
        alert(data.message || 'Error updating transaction');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleAdjustBalance = async (userId: string) => {
    if (!balanceAmount || isNaN(parseFloat(balanceAmount))) {
      alert('Please enter a valid amount');
      return;
    }
    setIsUpdatingBalance(true);
    try {
      const response = await fetch('/api/admin/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: parseFloat(balanceAmount), type: balanceType }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Balance updated successfully');
        setAdjustingBalance(null);
        setBalanceAmount('');
        await loadUsers();
      } else {
        alert(data.message || 'Error adjusting balance');
      }
    } catch (error) {
      console.error('Error adjusting balance:', error);
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  const handleUpdateReminder = async (userId: string) => {
    if (!reminderText.trim()) {
      alert('Reminder text is required');
      return;
    }
    
    setIsUpdatingReminder(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Auth error');
        return;
      }

      const response = await fetch('/api/admin/payment-reminder', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ userId, payment_reminder: reminderText }),
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        alert('Reminder updated');
        setEditingReminder(null);
        setReminderText('');
        loadUsers(); // Refresh to show updated reminder
      } else {
        alert(data.message || 'Error updating reminder');
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      alert('Network error');
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  const handleDeleteReminder = async (userId: string) => {
    if (!confirm('Clear payment reminder for this user?')) return;
    
    setIsUpdatingReminder(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch('/api/admin/payment-reminder', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ userId, payment_reminder: null }),
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        alert('Reminder cleared');
        loadUsers(); // Refresh
      } else {
        alert(data.message || 'Error clearing reminder');
      }
    } catch (error) {
      console.error('Error clearing reminder:', error);
      alert('Network error');
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  const handleUpdateOverdue = async (userId: string) => {
    setIsUpdatingOverdue(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Auth error');
        return;
      }

      const response = await fetch('/api/admin/overdue-message', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ userId, overdue_message: overdueText }),
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        alert('Overdue message updated');
        setEditingOverdue(null);
        setOverdueText('');
        loadUsers();
      } else {
        alert(data.message || 'Error updating overdue message');
      }
    } catch (error) {
      console.error('Error updating overdue message:', error);
      alert('Network error');
    } finally {
      setIsUpdatingOverdue(false);
    }
  };

  const handleAddToBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlacklistEmail) return;
    
    setIsAddingToBlacklist(true);
    try {
      const response = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newBlacklistEmail, reason: newBlacklistReason }),
      });
      
      const data = await response.json();
      if (data.success) {
        setNewBlacklistEmail('');
        setNewBlacklistReason('');
        await loadBlacklist();
      } else {
        alert(data.message || 'Error adding to blacklist');
      }
    } catch (error) {
      console.error('Error adding to blacklist:', error);
    } finally {
      setIsAddingToBlacklist(false);
    }
  };

  const handleRemoveFromBlacklist = async (email: string) => {
    if (!confirm(`Remove ${email} from blacklist?`)) return;
    
    try {
      const response = await fetch(`/api/admin/blacklist?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (data.success) {
        await loadBlacklist();
      } else {
        alert(data.message || 'Error removing from blacklist');
      }
    } catch (error) {
      console.error('Error removing from blacklist:', error);
    }
  };

  const handleDeleteOverdue = async (userId: string) => {
    if (!confirm('Clear overdue message for this user?')) return;
    
    setIsUpdatingOverdue(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch('/api/admin/overdue-message', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ userId, overdue_message: null }),
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        alert('Overdue message cleared');
        loadUsers();
      } else {
        alert(data.message || 'Error clearing overdue message');
      }
    } catch (error) {
      console.error('Error clearing overdue message:', error);
      alert('Network error');
    } finally {
      setIsUpdatingOverdue(false);
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
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'transactions'
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Wallet className="w-4 h-4" />
                Transactions ({transactions.length})
                {transactions.filter(t => t.status === 'pending').length > 0 && (
                  <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                    {transactions.filter(t => t.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('blacklist')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'blacklist'
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Shield className="w-4 h-4 text-red-500" />
                Blacklist ({blacklist.length})
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
                      <option value={7}>Payment Overdue</option>
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
                              <option value={7}>Payment Overdue</option>
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
                        setAdjustingBalance(userItem.id);
                        setBalanceAmount('');
                        setBalanceType('add');
                      }}
                      className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      title="Adjust balance"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span className="md:hidden">Balance</span>
                    </button>
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
                  {/* Payment Reminder Section */}
                  <div className="mt-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-600/30">
                    {userItem.payment_reminder && editingReminder !== userItem.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-yellow-400 text-xs font-medium flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            Active Payment Reminder
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingReminder(userItem.id);
                                setReminderText(userItem.payment_reminder || '');
                              }}
                              className="text-blue-400 hover:text-blue-300 p-1"
                              title="Edit reminder"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteReminder(userItem.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Clear reminder"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-white text-sm bg-black/20 p-2 rounded border border-yellow-600/20">
                          {userItem.payment_reminder}
                        </div>
                      </div>
                    ) : editingReminder === userItem.id ? (
                      <div className="space-y-2">
                        <div className="text-yellow-400 text-xs font-medium">
                          {userItem.payment_reminder ? 'Edit' : 'Set'} Payment Reminder
                        </div>
                        <textarea
                          value={reminderText}
                          onChange={(e) => setReminderText(e.target.value)}
                          placeholder="Reminder text (shown as running line in user cabinet)..."
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingReminder(null);
                              setReminderText('');
                            }}
                            className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateReminder(userItem.id)}
                            disabled={isUpdatingReminder || !reminderText.trim()}
                            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                          >
                            {isUpdatingReminder ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingReminder(userItem.id);
                          setReminderText('');
                        }}
                        className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center gap-1 w-full justify-center py-1"
                      >
                        <Plus className="w-3 h-3" />
                        Set Payment Reminder
                      </button>
                    )}
                  </div>

                  {/* Overdue Message Section */}
                  <div className="mt-3 p-3 bg-red-900/20 rounded-lg border border-red-600/30">
                    {userItem.overdue_message && editingOverdue !== userItem.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-red-400 text-xs font-medium flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Custom Overdue Message
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingOverdue(userItem.id);
                                setOverdueText(userItem.overdue_message || '');
                              }}
                              className="text-blue-400 hover:text-blue-300 p-1"
                              title="Edit overdue message"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteOverdue(userItem.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Clear overdue message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-white text-sm bg-black/20 p-2 rounded border border-red-600/20 max-w-full overflow-hidden text-ellipsis">
                          {userItem.overdue_message}
                        </div>
                      </div>
                    ) : editingOverdue === userItem.id ? (
                      <div className="space-y-2">
                        <div className="text-red-400 text-xs font-medium">
                          {userItem.overdue_message ? 'Edit' : 'Set'} Overdue Message
                        </div>
                        <textarea
                          value={overdueText}
                          onChange={(e) => setOverdueText(e.target.value)}
                          placeholder="Custom message for overdue screen..."
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingOverdue(null);
                              setOverdueText('');
                            }}
                            className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateOverdue(userItem.id)}
                            disabled={isUpdatingOverdue || !overdueText.trim()}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                          >
                            {isUpdatingOverdue ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingOverdue(userItem.id);
                          setOverdueText('');
                        }}
                        className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 w-full justify-center py-1"
                      >
                        <Plus className="w-3 h-3" />
                        Set Custom Overdue Message
                      </button>
                    )}
                  </div>
                  
                  {/* Форма регулювання балансу */}
                  {adjustingBalance === userItem.id && (
                    <div className="mt-4 p-4 bg-gray-700 rounded-lg w-full">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Adjust Balance for {userItem.email}</h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={balanceType}
                          onChange={(e) => setBalanceType(e.target.value as 'add' | 'set')}
                          className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="add">Add to current</option>
                          <option value="set">Set total</option>
                        </select>
                        <input
                          type="number"
                          value={balanceAmount}
                          onChange={(e) => setBalanceAmount(e.target.value)}
                          placeholder="Amount"
                          className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAdjustBalance(userItem.id)}
                            disabled={isUpdatingBalance || !balanceAmount}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          >
                            {isUpdatingBalance ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Save
                          </button>
                          <button
                            onClick={() => setAdjustingBalance(null)}
                            className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
                            <option value={7}>Payment Overdue</option>
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
                            className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded-lg transition-colors flex-1 flex items-center justify-center gap-2"
                            title="Reject registration"
                          >
                            <X className="w-4 h-4" />
                            <span className="md:hidden">Reject</span>
                          </button>
                          <button
                            onClick={() => handleBlockRequest(request.id, request.email)}
                            className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors flex-1 flex items-center justify-center gap-2"
                            title="Block and Reject"
                          >
                            <Shield className="w-4 h-4" />
                            <span className="md:hidden">Block</span>
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
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="ml-3 text-gray-400">Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No transactions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-3 px-4 text-sm font-medium text-gray-400 uppercase">User</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-400 uppercase">Amount</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-400 uppercase">Details</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-400 uppercase">Status</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.02]">
                          <td className="py-4 px-4">
                            <div className="text-sm font-medium">{tx.profiles?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{tx.profiles?.email}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm font-bold text-green-400">${tx.amount}</div>
                            <div className="text-xs text-gray-500">{tx.currency}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-xs text-gray-400 truncate max-w-[200px]" title={tx.transaction_hash}>
                              Hash: {tx.transaction_hash}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                              {new Date(tx.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${
                              tx.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                              tx.status === 'pending' ? 'bg-orange-500/20 text-orange-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {tx.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateTransaction(tx.id, 'confirmed')}
                                  className="p-1 px-2 bg-green-600 hover:bg-green-700 rounded text-white text-xs flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateTransaction(tx.id, 'rejected')}
                                  className="p-1 px-2 bg-red-600 hover:bg-red-700 rounded text-white text-xs flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'blacklist' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Add to Blacklist</h3>
                <form onSubmit={handleAddToBlacklist} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={newBlacklistEmail}
                      onChange={(e) => setNewBlacklistEmail(e.target.value)}
                      placeholder="Email to block"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newBlacklistReason}
                      onChange={(e) => setNewBlacklistReason(e.target.value)}
                      placeholder="Reason (optional)"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingToBlacklist || !newBlacklistEmail}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAddingToBlacklist ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Block Email
                  </button>
                </form>
              </div>

              <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <h3 className="text-xl font-semibold p-6 pb-2 text-white">Blacklisted Emails</h3>
                {isLoadingBlacklist ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="ml-3 text-gray-400">Loading blacklist...</span>
                  </div>
                ) : blacklist.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Blacklist is empty</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-700 bg-black/40">
                          <th className="py-3 px-6 text-sm font-medium text-gray-400 uppercase">Email</th>
                          <th className="py-3 px-6 text-sm font-medium text-gray-400 uppercase">Request from</th>
                          <th className="py-3 px-6 text-sm font-medium text-gray-400 uppercase">Reason</th>
                          <th className="py-3 px-6 text-sm font-medium text-gray-400 uppercase">Blocked On</th>
                          <th className="py-3 px-6 text-sm font-medium text-gray-400 uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {blacklist.map((item) => (
                          <tr key={item.email} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6 text-sm font-medium text-red-400">{item.email}</td>
                            <td className="py-4 px-6 text-sm text-gray-300">{item.request_from || '—'}</td>
                            <td className="py-4 px-6 text-sm text-gray-300 italic">{item.reason || '—'}</td>
                            <td className="py-4 px-6 text-sm text-gray-500 text-xs">
                              {new Date(item.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleRemoveFromBlacklist(item.email)}
                                className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-red-600/20 rounded-lg"
                                title="Remove from blacklist"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}