'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { User, Users, Plus, Trash2, Mail, Shield, Calendar, ArrowLeft, Clock, Check, X, Bell, Edit3, Megaphone, Key, Loader2, Circle, DollarSign, ExternalLink, Wallet, MessageSquare, ShoppingBag, ChevronDown, Smartphone, Monitor, AlertTriangle, RefreshCw, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType, RegistrationRequest, ACCESS_LEVELS, AccessLevel, Team } from '@/types/auth';
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

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  type: string;
  duration_days: number;
  is_active: boolean;
  created_at: string;
}

interface Purchase {
  id: string;
  user_id: string;
  service_id: string;
  amount: number;
  status: string;
  created_at: string;
  user: { email: string; name: string | null };
  service: { title: string };
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
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'announcements' | 'transactions' | 'blacklist' | 'services' | 'purchases'>('users');
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

  // Expired Message (Custom for Access Expired screen)
  const [editingExpired, setEditingExpired] = useState<string | null>(null);
  const [expiredText, setExpiredText] = useState('');
  const [isUpdatingExpired, setIsUpdatingExpired] = useState(false);
  
  // Blacklist
  const [blacklist, setBlacklist] = useState<BlacklistedEmail[]>([]);
  const [isLoadingBlacklist, setIsLoadingBlacklist] = useState(true);
  const [newBlacklistEmail, setNewBlacklistEmail] = useState('');
  const [newBlacklistReason, setNewBlacklistReason] = useState('');
  const [isAddingToBlacklist, setIsAddingToBlacklist] = useState(false);
  
  // Expiration date editing
  const [editingExpiry, setEditingExpiry] = useState<string | null>(null);
  const [expiryValue, setExpiryValue] = useState('');
  const [isUpdatingExpiry, setIsUpdatingExpiry] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Shop & Services
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isEditingService, setIsEditingService] = useState<Service | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({ 
    title: '', 
    price: 0, 
    type: 'subscription',
    duration_days: 30,
    is_active: true,
    description: '',
    image_url: ''
  });

  // Purchases
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true);

  // Device attempts
  const [deviceAttempts, setDeviceAttempts] = useState<Record<string, any[]>>({});
  const [loadingDeviceAttempts, setLoadingDeviceAttempts] = useState<string | null>(null);
  const [resettingDevice, setResettingDevice] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', notes: '', access_level: 1, access_expires_at: '' });
  const [addingMemberTeamId, setAddingMemberTeamId] = useState<string | null>(null);
  const [memberSearchEmail, setMemberSearchEmail] = useState('');
  const [editingTeamExpiry, setEditingTeamExpiry] = useState<string | null>(null);
  const [teamExpiryValue, setTeamExpiryValue] = useState('');
  const [viewingTeamTransactions, setViewingTeamTransactions] = useState<string | null>(null);

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

  const loadServices = useCallback(async () => {
    setIsLoadingServices(true);
    try {
      const response = await fetch('/api/admin/services', { cache: 'no-store' });
      const data = await response.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoadingServices(false);
    }
  }, []);

  const loadPurchases = useCallback(async () => {
    setIsLoadingPurchases(true);
    try {
      const response = await fetch('/api/admin/purchases', { cache: 'no-store' });
      const data = await response.json();
      if (data.success) {
        setPurchases(data.purchases);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setIsLoadingPurchases(false);
    }
  }, []);

  const handleUpdateService = async (serviceData: Partial<Service>) => {
    try {
      const isNew = !serviceData.id;
      const url = '/api/admin/services';
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      
      const data = await response.json();
      if (data.success) {
        loadServices();
        setShowServiceForm(false);
        setNewService({ title: '', price: 0, type: 'subscription', duration_days: 30, is_active: true, description: '', image_url: '' });
        setIsEditingService(null);
      } else {
        alert(data.message || 'Error saving service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const response = await fetch(`/api/admin/services?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        loadServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

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

  const loadDeviceAttempts = useCallback(async (userId: string) => {
    setLoadingDeviceAttempts(userId);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/device?userId=${userId}`, {
        headers,
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setDeviceAttempts(prev => ({ ...prev, [userId]: data.attempts || [] }));
      }
    } catch (error) {
      console.error('Error loading device attempts:', error);
    } finally {
      setLoadingDeviceAttempts(null);
    }
  }, []);

  const handleResetDevice = useCallback(async (userId: string) => {
    if (!confirm('Reset device binding for this user? They will be able to log in from any device (new device will be saved on next login).')) return;
    
    setResettingDevice(userId);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/device?userId=${userId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        alert('Device binding reset successfully');
        await loadUsers();
      } else {
        alert(data.message || 'Error resetting device');
      }
    } catch (error) {
      console.error('Error resetting device:', error);
      alert('Network error. Please try again.');
    } finally {
      setResettingDevice(null);
    }
  }, []);

  const loadTeams = useCallback(async () => {
    setIsLoadingTeams(true);
    try {
      const response = await fetch('/api/admin/teams', { cache: 'no-store' });
      const data = await response.json();
      if (data.success) {
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setIsLoadingTeams(false);
    }
  }, []);

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim()) { alert('Team name is required'); return; }
    try {
      const body: any = { name: teamForm.name.trim() };
      if (teamForm.notes) body.notes = teamForm.notes;
      if (teamForm.access_level) body.access_level = teamForm.access_level;
      if (teamForm.access_expires_at) body.access_expires_at = new Date(teamForm.access_expires_at).toISOString();
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.success) {
        setShowTeamForm(false);
        setTeamForm({ name: '', notes: '', access_level: 1, access_expires_at: '' });
        loadTeams();
      } else {
        alert(data.message || 'Error creating team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleUpdateTeam = async (teamId: string, updates: any) => {
    try {
      const response = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teamId, ...updates }),
      });
      const data = await response.json();
      if (data.success) {
        loadTeams();
        setEditingTeam(null);
      } else {
        alert(data.message || 'Error updating team');
      }
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const handleSetTeamExpiry = async (teamId: string, memberIds: string[], expiryDate: string) => {
    try {
      const isoDate = expiryDate ? new Date(expiryDate).toISOString() : null;
      await Promise.all(
        memberIds.map(userId =>
          fetch('/api/admin/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, access_expires_at: isoDate }),
          })
        )
      );
      await loadUsers();
      setEditingTeamExpiry(null);
      setTeamExpiryValue('');
    } catch (error) {
      console.error('Error setting team expiry:', error);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Delete this team? Members will be unassigned.')) return;
    try {
      const response = await fetch('/api/admin/teams', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teamId }),
      });
      const data = await response.json();
      if (data.success) {
        loadTeams();
        loadUsers();
      } else {
        alert(data.message || 'Error deleting team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleAddMember = async (teamId: string, userId: string) => {
    try {
      const response = await fetch('/api/admin/teams/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userId }),
      });
      const data = await response.json();
      if (data.success) {
        loadTeams();
        loadUsers();
        setAddingMemberTeamId(null);
        setMemberSearchEmail('');
      } else {
        alert(data.message || 'Error adding member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/teams/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.success) {
        loadTeams();
        loadUsers();
      } else {
        alert(data.message || 'Error removing member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

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
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'services') {
      loadServices();
    } else if (activeTab === 'purchases') {
      loadPurchases();
    }
  }, [activeTab, loadServices, loadPurchases]);

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

  const handleUpdateUserExpiry = async (userId: string, newExpiry: string | null) => {
    setIsUpdatingExpiry(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ id: userId, access_expires_at: newExpiry }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadUsers();
        setEditingExpiry(null);
      } else {
        alert(data.message || 'Error updating expiration date');
      }
    } catch (error) {
      console.error('Error updating expiration:', error);
      alert('Error updating expiration date');
    } finally {
      setIsUpdatingExpiry(false);
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

  const handleAssignTeam = async (userId: string, teamName: string) => {
    if (!teamName.trim()) return;
    try {
      const response = await fetch('/api/admin/teams/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, teamName }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Team assigned successfully');
        loadUsers();
      } else {
        alert(data.message || 'Error assigning team');
      }
    } catch (error) {
      console.error('Error assigning team:', error);
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

  const handleUpdateExpired = async (userId: string) => {
    setIsUpdatingExpired(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Auth error');
        return;
      }

      const response = await fetch('/api/admin/expired-message', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ userId, expired_message: expiredText }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert('Expired message updated');
        setEditingExpired(null);
        setExpiredText('');
        loadUsers();
      } else {
        alert(data.message || 'Error updating expired message');
      }
    } catch (error) {
      console.error('Error updating expired message:', error);
      alert('Network error');
    } finally {
      setIsUpdatingExpired(false);
    }
  };

  const handleClearExpired = async (userId: string) => {
    if (!confirm('Clear expired message for this user?')) return;
    
    setIsUpdatingExpired(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Auth error');
        return;
      }

      const response = await fetch('/api/admin/expired-message', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ userId, expired_message: null }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert('Expired message cleared');
        loadUsers();
      } else {
        alert(data.message || 'Error clearing expired message');
      }
    } catch (error) {
      console.error('Error clearing expired message:', error);
      alert('Network error');
    } finally {
      setIsUpdatingExpired(false);
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

              <button
                onClick={() => setActiveTab('services')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'services'
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Services
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'purchases'
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Purchases
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
                      <option value={2}>Knowledge Base</option>
                      <option value={3}>Mentorship</option>
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
            <div className="space-y-6">
              {isLoadingUsers || isLoadingTeams ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="ml-3 text-gray-400">Loading...</span>
                </div>
              ) : (
                <>
                  {/* Teams section */}
                  {teams.map((team) => {
                    const teamMembers = users.filter(u => u.team_id === team.id);
                    const isEditingThisTeam = editingTeam === team.id;
                    return (
                      <div key={team.id} className="rounded-lg border border-blue-900/40 overflow-hidden">
                        {/* Team Header */}
                        <div className="bg-blue-950/40 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            {isEditingThisTeam ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={teamForm.name}
                                  onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white flex-1 max-w-[200px]"
                                  placeholder="Team name"
                                />
                                <input
                                  type="text"
                                  value={teamForm.notes}
                                  onChange={(e) => setTeamForm(prev => ({ ...prev, notes: e.target.value }))}
                                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300 flex-1 max-w-[300px]"
                                  placeholder="Notes (optional)"
                                />
                              </div>
                            ) : (
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-semibold text-blue-200 truncate">{team.name}</span>
                                  <span className="text-xs text-gray-500">({teamMembers.length} members)</span>
                                  {team.notes && (
                                    <span className="text-xs text-gray-500 truncate hidden sm:block">— {team.notes}</span>
                                  )}
                                  <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-blue-900/30 rounded border border-blue-900/50">
                                    <DollarSign className="w-3 h-3 text-green-400" />
                                    <span className="text-xs font-mono text-green-300">
                                      {teamMembers.reduce((sum, m) => sum + (m.balance || 0), 0).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Team-wide Expires */}
                            {!isEditingThisTeam && (
                              editingTeamExpiry === team.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="date"
                                    value={teamExpiryValue}
                                    onChange={(e) => setTeamExpiryValue(e.target.value)}
                                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white w-30"
                                  />
                                  <button
                                    onClick={() => handleSetTeamExpiry(team.id, teamMembers.map(m => m.id), teamExpiryValue)}
                                    className="text-green-400 hover:text-green-300 p-1"
                                    title="Apply to all members"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => { setEditingTeamExpiry(null); setTeamExpiryValue(''); }}
                                    className="text-gray-400 hover:text-white p-1"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingTeamExpiry(team.id);
                                    setTeamExpiryValue('');
                                  }}
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 transition-colors px-2 py-1 rounded border border-gray-700 hover:border-blue-700"
                                  title="Set expiry for all members"
                                >
                                  <Calendar className="w-3 h-3" />
                                  Expires for all
                                </button>
                              )
                            )}
                            {isEditingThisTeam ? (
                              <>
                                <button
                                  onClick={() => handleUpdateTeam(team.id, { name: teamForm.name, notes: teamForm.notes })}
                                  className="text-green-400 hover:text-green-300 p-1"
                                  title="Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingTeam(null)}
                                  className="text-gray-400 hover:text-white p-1"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setViewingTeamTransactions(team.id);
                                    if (transactions.length === 0) loadTransactions();
                                  }}
                                  className="text-gray-400 hover:text-purple-400 p-1 transition-colors"
                                  title="View Transactions"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingTeam(team.id);
                                    setTeamForm({ name: team.name, notes: team.notes || '', access_level: team.access_level, access_expires_at: '' });
                                  }}
                                  className="text-gray-400 hover:text-blue-400 p-1 transition-colors"
                                  title="Edit team"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTeam(team.id)}
                                  className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                                  title="Delete team"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>


                        {/* Team Members Table */}
                        {teamMembers.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse bg-gray-800/30">
                              <thead>
                                <tr className="border-b border-gray-700/50 text-gray-500 text-xs bg-gray-900/30">
                                  <th className="p-3 font-medium w-[25%]">User</th>
                                  <th className="p-3 font-medium w-[10%]">Access Level</th>
                                  <th className="p-3 font-medium w-[12%]">Status</th>
                                  <th className="p-3 font-medium w-[8%]">Total Time</th>
                                  <th className="p-3 font-medium w-[9%]">Last Session</th>
                                  <th className="p-3 font-medium w-[10%]">Expires</th>
                                  <th className="p-3 font-medium w-[10%]">Created</th>
                                  <th className="p-3 font-medium text-right w-[16%]">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700/30">
                                {teamMembers.map((userItem) => (
                                  <Fragment key={userItem.id}>
                                    <tr className="hover:bg-gray-700/20 transition-colors">
                                      <td className="p-3">
                                        <div className="flex items-center gap-2">
                                          <div className="bg-gray-700 p-1.5 rounded">
                                            <User className="w-3.5 h-3.5 text-gray-300" />
                                          </div>
                                          <div>
                                            <div className="text-sm font-medium text-white flex items-center gap-1.5">
                                              {userItem.email}
                                              {userItem.role === 'admin' && <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-medium bg-primary/20 text-primary"><Shield className="w-2.5 h-2.5" />Admin</span>}
                                            </div>
                                            {userItem.name && <div className="text-xs text-gray-400">{userItem.name}</div>}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        {editingUser === userItem.id ? (
                                          <div className="flex items-center gap-1">
                                            <select
                                              value={userItem.access_level}
                                              onChange={(e) => handleUpdateUserAccess(userItem.id, parseInt(e.target.value) as AccessLevel)}
                                              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none w-28"
                                            >
                                              <option value={1}>Basic</option>
                                              <option value={2}>Knowledge Base</option>
                                              <option value={3}>Mentorship</option>
                                              <option value={4}>Without Road Map</option>
                                              <option value={5}>Blocked</option>
                                              <option value={6}>Creative Push Only</option>
                                              <option value={7}>Payment Overdue</option>
                                            </select>
                                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>
                                          </div>
                                        ) : (
                                          <button onClick={() => setEditingUser(userItem.id)} className="group flex items-center gap-1 text-xs hover:text-blue-400 transition-colors">
                                            <div className={`w-1.5 h-1.5 rounded-full ${userItem.access_level >= 3 ? 'bg-purple-500' : userItem.access_level === 2 ? 'bg-blue-500' : 'bg-gray-500'}`} />
                                            {ACCESS_LEVELS[userItem.access_level as AccessLevel]?.name || 'Unknown'}
                                            <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </button>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        <div className="flex flex-col gap-0.5">
                                          <div className="flex items-center gap-1.5">
                                            <Circle className={`w-1.5 h-1.5 ${userItem.is_active ? 'text-green-500 fill-green-500' : 'text-gray-500 fill-gray-500'}`} />
                                            <span className={`text-xs ${userItem.is_active ? 'text-green-400' : 'text-gray-500'}`}>{userItem.is_active ? 'Active' : (userItem as any).last_seen ? new Date((userItem as any).last_seen).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) + ' ' + new Date((userItem as any).last_seen).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <span className="text-xs text-gray-400">{(userItem as any).total_time_minutes ? ((userItem as any).total_time_minutes >= 60 ? Math.floor((userItem as any).total_time_minutes / 60) + 'h ' + ((userItem as any).total_time_minutes % 60) + 'm' : (userItem as any).total_time_minutes + 'm') : '0m'}</span>
                                      </td>
                                      <td className="p-3">
                                        <span className="text-xs text-gray-400">{(userItem as any).last_session_duration_minutes ? ((userItem as any).last_session_duration_minutes >= 60 ? Math.floor((userItem as any).last_session_duration_minutes / 60) + 'h ' + ((userItem as any).last_session_duration_minutes % 60) + 'm' : (userItem as any).last_session_duration_minutes + 'm') : '0m'}</span>
                                      </td>
                                      <td className="p-3">
                                        {editingExpiry === userItem.id ? (
                                          <div className="flex items-center gap-1">
                                            <input type="date" value={expiryValue} onChange={(e) => setExpiryValue(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white w-28" />
                                            <button onClick={() => handleUpdateUserExpiry(userItem.id, expiryValue ? new Date(expiryValue).toISOString() : null)} disabled={isUpdatingExpiry} className="text-green-500 hover:text-green-400 p-1"><Check className="w-3 h-3" /></button>
                                            <button onClick={() => setEditingExpiry(null)} className="text-gray-400 hover:text-white p-1"><X className="w-3 h-3" /></button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5 text-xs">
                                            <span className={!userItem.access_expires_at ? 'text-green-500' : (new Date(userItem.access_expires_at) < new Date() ? 'text-red-500' : 'text-gray-300')}>
                                              {userItem.access_expires_at ? new Date(userItem.access_expires_at).toLocaleDateString() : 'Lifetime'}
                                            </span>
                                            <button onClick={() => { setEditingExpiry(userItem.id); setExpiryValue(userItem.access_expires_at ? new Date(userItem.access_expires_at).toISOString().split('T')[0] : ''); }} className="text-gray-600 hover:text-blue-400 transition-colors"><Edit3 className="w-3 h-3" /></button>
                                          </div>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        <span className="text-xs text-gray-500">
                                          {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : '—'}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right">
                                        <div className="flex justify-end gap-1">
                                          <button
                                            onClick={() => {
                                              if (expandedUser === userItem.id) {
                                                setExpandedUser(null);
                                                setAdjustingBalance(null);
                                                setChangingPassword(null);
                                                setEditingReminder(null);
                                                setEditingOverdue(null);
                                              } else {
                                                setExpandedUser(userItem.id);
                                              }
                                            }}
                                            className={`p-1.5 rounded transition-colors relative ${expandedUser === userItem.id ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                                            title="More Actions"
                                          >
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedUser === userItem.id ? 'rotate-180' : ''}`} />
                                            {((userItem.payment_reminder ? 1 : 0) + (userItem.overdue_message ? 1 : 0) + (userItem.expired_message ? 1 : 0)) > 0 && (
                                              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                                {(userItem.payment_reminder ? 1 : 0) + (userItem.overdue_message ? 1 : 0) + (userItem.expired_message ? 1 : 0)}
                                              </span>
                                            )}
                                          </button>
                                          <button
                                            onClick={() => handleRemoveMember(userItem.id)}
                                            className="p-1.5 hover:bg-orange-900/30 text-gray-400 hover:text-orange-400 rounded transition-colors"
                                            title="Remove from team"
                                          >
                                            <Users className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteUser(userItem.id)}
                                            disabled={userItem.id === user?.id}
                                            className="p-1.5 hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded transition-colors disabled:opacity-30"
                                            title="Delete User"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                    {/* Expanded Details Row */}
                                    {(expandedUser === userItem.id || adjustingBalance === userItem.id || changingPassword === userItem.id || editingReminder === userItem.id || editingOverdue === userItem.id) && (
                                      <tr className="bg-gray-800/30">
                                        <td colSpan={6} className="p-4 border-l-2 border-blue-800">
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {/* Balance Section */}
                                            <div className="space-y-2">
                                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance Adjustment</div>
                                              <div className="flex flex-col gap-2">
                                                <select value={balanceType} onChange={(e) => setBalanceType(e.target.value as 'add' | 'set')} className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white">
                                                  <option value="add">Add</option>
                                                  <option value="set">Set</option>
                                                </select>
                                                <div className="flex gap-2">
                                                  <input type="number" value={balanceAmount} onChange={(e) => { if (adjustingBalance !== userItem.id) { setAdjustingBalance(userItem.id); setBalanceAmount(''); setBalanceType('add'); } setBalanceAmount(e.target.value) }} placeholder="Amount" className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                                  <button onClick={() => handleAdjustBalance(userItem.id)} disabled={isUpdatingBalance || !balanceAmount} className="bg-green-600 hover:bg-green-500 text-white rounded px-2 py-1 text-xs"><Check className="w-3 h-3" /></button>
                                                </div>
                                              </div>
                                            </div>
                                            {/* Password Section */}
                                            <div className="space-y-2">
                                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reset Password</div>
                                              <div className="flex gap-2">
                                                <input type="password" value={newPassword} onChange={(e) => { if (changingPassword !== userItem.id) { setChangingPassword(userItem.id); setNewPassword(''); } setNewPassword(e.target.value) }} placeholder="New Pass" className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                                <button onClick={() => handleChangePassword(userItem.id)} disabled={isUpdatingPassword || newPassword.length < 6} className="bg-yellow-600 hover:bg-yellow-500 text-white rounded px-2 py-1 text-xs"><Key className="w-3 h-3" /></button>
                                              </div>
                                            </div>
                                            {/* Team Assignment */}
                                            <div className="space-y-2">
                                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Move to Team</div>
                                              <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleAssignTeam(userItem.id, fd.get('teamName') as string); }} className="flex gap-2">
                                                <input name="teamName" type="text" defaultValue={userItem.team_name || ''} placeholder="Team Name" className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 text-xs"><Check className="w-3 h-3" /></button>
                                              </form>
                                            </div>
                                            {/* Reminder Section */}
                                            <div className="space-y-2">
                                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                                <span>Payment Reminder</span>
                                                {userItem.payment_reminder && (<button onClick={() => handleDeleteReminder(userItem.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>)}
                                              </div>
                                              <div className="flex gap-2">
                                                <input type="text" value={reminderText} onChange={(e) => { if (editingReminder !== userItem.id) { setEditingReminder(userItem.id); setReminderText(userItem.payment_reminder || ''); } setReminderText(e.target.value) }} placeholder={userItem.payment_reminder || "Set reminder..."} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                                <button onClick={() => handleUpdateReminder(userItem.id)} disabled={isUpdatingReminder} className="bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 text-xs"><Check className="w-3 h-3" /></button>
                                              </div>
                                            </div>
                                            {/* Overdue Section */}
                                            <div className="space-y-2">
                                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                                <span>Overdue Message</span>
                                                {userItem.overdue_message && (<button onClick={() => handleDeleteOverdue(userItem.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>)}
                                              </div>
                                              <div className="flex gap-2">
                                                <input type="text" value={overdueText} onChange={(e) => { if (editingOverdue !== userItem.id) { setEditingOverdue(userItem.id); setOverdueText(userItem.overdue_message || ''); } setOverdueText(e.target.value) }} placeholder={userItem.overdue_message || "Set message..."} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                                <button onClick={() => handleUpdateOverdue(userItem.id)} disabled={isUpdatingOverdue} className="bg-red-600 hover:bg-red-500 text-white rounded px-2 py-1 text-xs"><Check className="w-3 h-3" /></button>
                                              </div>
                                            </div>
                                            {/* Expired Section */}
                                            <div className="space-y-2">
                                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                                <span>Expired Message</span>
                                                {userItem.expired_message && (<button onClick={() => handleClearExpired(userItem.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>)}
                                              </div>
                                              <div className="flex gap-2">
                                                <input type="text" value={expiredText} onChange={(e) => { if (editingExpired !== userItem.id) { setEditingExpired(userItem.id); setExpiredText(userItem.expired_message || ''); } setExpiredText(e.target.value) }} placeholder={userItem.expired_message || "Set expired message..."} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                                <button onClick={() => handleUpdateExpired(userItem.id)} disabled={isUpdatingExpired} className="bg-orange-600 hover:bg-orange-500 text-white rounded px-2 py-1 text-xs"><Check className="w-3 h-3" /></button>
                                              </div>
                                            </div>
                                          </div>
                                          {/* Device Info */}
                                          <div className="mt-4 pt-4 border-t border-gray-700">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <Monitor className="w-3.5 h-3.5" />
                                                <span>Device Binding</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {(userItem.device_token || userItem.first_fingerprint) && (
                                                  <button onClick={() => handleResetDevice(userItem.id)} disabled={resettingDevice === userItem.id} className="inline-flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400 transition-colors">
                                                    <RefreshCw className={`w-3 h-3 ${resettingDevice === userItem.id ? 'animate-spin' : ''}`} />
                                                    Reset Device
                                                  </button>
                                                )}
                                                <button onClick={() => loadDeviceAttempts(userItem.id)} disabled={loadingDeviceAttempts === userItem.id} className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                                  {loadingDeviceAttempts === userItem.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                                                  Load Attempts
                                                </button>
                                              </div>
                                            </div>
                                            {!userItem.first_fingerprint && !userItem.device_token && (
                                              <div className="text-xs text-gray-500">No device registered yet.</div>
                                            )}
                                            {deviceAttempts[userItem.id] && deviceAttempts[userItem.id].length > 0 && (
                                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                                <div className="text-xs font-semibold text-red-400 flex items-center gap-1 mb-1">
                                                  <AlertTriangle className="w-3 h-3" />
                                                  Blocked Login Attempts ({deviceAttempts[userItem.id].length})
                                                </div>
                                                {deviceAttempts[userItem.id].map((attempt: any, idx: number) => (
                                                  <div key={attempt.id || idx} className="bg-red-900/20 border border-red-900/30 rounded p-2 text-xs">
                                                    <div className="flex items-center justify-between mb-1">
                                                      <span className="text-red-400 font-medium">{new Date(attempt.created_at).toLocaleString()}</span>
                                                      <span className="text-gray-500">IP: {attempt.ip_address || 'unknown'}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-gray-400">
                                                      {attempt.device_info?.browser && <span>Browser: {attempt.device_info.browser}</span>}
                                                      {attempt.device_info?.os && <span>OS: {attempt.device_info.os}</span>}
                                                      {attempt.device_info?.device_type && <span>Type: {attempt.device_info.device_type}</span>}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-xs text-gray-600">No members in this team yet</div>
                        )}

                        {/* Add member to team */}
                        <div className="bg-gray-900/30 px-4 py-2 border-t border-gray-700/30">
                          {addingMemberTeamId === team.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="email"
                                value={memberSearchEmail}
                                onChange={(e) => setMemberSearchEmail(e.target.value)}
                                placeholder="User email to add..."
                                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                              />
                              <button
                                onClick={() => {
                                  const found = users.find(u => u.email.toLowerCase() === memberSearchEmail.toLowerCase());
                                  if (found) handleAddMember(team.id, found.id);
                                  else alert('User not found');
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 text-xs"
                              >
                                Add
                              </button>
                              <button onClick={() => { setAddingMemberTeamId(null); setMemberSearchEmail(''); }} className="text-gray-400 hover:text-white text-xs">Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingMemberTeamId(team.id)}
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Add member
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Create New Team */}
                  {showTeamForm ? (
                    <div className="rounded-lg border border-dashed border-gray-600 p-4 bg-gray-800/30">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">New Team</h3>
                      <div className="flex flex-wrap gap-3">
                        <input
                          type="text"
                          value={teamForm.name}
                          onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Team name *"
                          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white flex-1 min-w-[150px]"
                        />
                        <input
                          type="text"
                          value={teamForm.notes}
                          onChange={(e) => setTeamForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Notes (optional)"
                          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 flex-1 min-w-[200px]"
                        />
                        <div className="flex gap-2">
                          <button onClick={handleCreateTeam} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm">Create</button>
                          <button onClick={() => { setShowTeamForm(false); setTeamForm({ name: '', notes: '', access_level: 1, access_expires_at: '' }); }} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm">Cancel</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTeamForm(true)}
                      className="w-full py-3 rounded-lg border border-dashed border-gray-700 text-gray-500 hover:text-blue-400 hover:border-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Team
                    </button>
                  )}

                  {/* Users without a team */}
                  {(() => {
                    const unassigned = users.filter(u => !u.team_id);
                    if (unassigned.length === 0) return null;
                    return (
                      <div className="rounded-lg border border-gray-700/50 overflow-hidden">
                        <div className="bg-gray-800/50 px-4 py-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-400">Without Team</span>
                          <span className="text-xs text-gray-600">({unassigned.length})</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse bg-gray-800/20">
                            <thead>
                              <tr className="border-b border-gray-700/50 text-gray-500 text-xs bg-gray-900/20">
                                <th className="p-3 font-medium w-[25%]">User</th>
                                <th className="p-3 font-medium w-[10%]">Access Level</th>
                                <th className="p-3 font-medium w-[12%]">Status</th>
                                <th className="p-3 font-medium w-[8%]">Total Time</th>
                                <th className="p-3 font-medium w-[9%]">Last Session</th>
                                <th className="p-3 font-medium w-[10%]">Expires</th>
                                <th className="p-3 font-medium w-[10%]">Created</th>
                                <th className="p-3 font-medium text-right w-[16%]">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/30">
                              {unassigned.map((userItem) => (
                                <Fragment key={userItem.id}>
                                  <tr className="hover:bg-gray-700/20 transition-colors">
                                    <td className="p-3">
                                      <div className="flex items-center gap-2">
                                        <div className="bg-gray-700 p-1.5 rounded">
                                          <User className="w-3.5 h-3.5 text-gray-300" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-white flex items-center gap-1.5">
                                            {userItem.email}
                                            {userItem.role === 'admin' && <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-medium bg-primary/20 text-primary"><Shield className="w-2.5 h-2.5" />Admin</span>}
                                          </div>
                                          {userItem.name && <div className="text-xs text-gray-400">{userItem.name}</div>}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      {editingUser === userItem.id ? (
                                        <div className="flex items-center gap-1">
                                          <select value={userItem.access_level} onChange={(e) => handleUpdateUserAccess(userItem.id, parseInt(e.target.value) as AccessLevel)} className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:outline-none w-28">
                                            <option value={1}>Basic</option>
                                            <option value={2}>Knowledge Base</option>
                                            <option value={3}>Mentorship</option>
                                            <option value={4}>Without Road Map</option>
                                            <option value={5}>Blocked</option>
                                            <option value={6}>Creative Push Only</option>
                                            <option value={7}>Payment Overdue</option>
                                          </select>
                                          <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>
                                        </div>
                                      ) : (
                                        <button onClick={() => setEditingUser(userItem.id)} className="group flex items-center gap-1 text-xs hover:text-blue-400 transition-colors">
                                          <div className={`w-1.5 h-1.5 rounded-full ${userItem.access_level >= 3 ? 'bg-purple-500' : userItem.access_level === 2 ? 'bg-blue-500' : 'bg-gray-500'}`} />
                                          {ACCESS_LEVELS[userItem.access_level as AccessLevel]?.name || 'Unknown'}
                                          <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <Circle className={`w-1.5 h-1.5 ${userItem.is_active ? 'text-green-500 fill-green-500' : 'text-gray-500 fill-gray-500'}`} />
                                          <span className={`text-xs ${userItem.is_active ? 'text-green-400' : 'text-gray-500'}`}>{userItem.is_active ? 'Active' : (userItem as any).last_seen ? new Date((userItem as any).last_seen).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) + ' ' + new Date((userItem as any).last_seen).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <span className="text-xs text-gray-400">{(userItem as any).total_time_minutes ? ((userItem as any).total_time_minutes >= 60 ? Math.floor((userItem as any).total_time_minutes / 60) + 'h ' + ((userItem as any).total_time_minutes % 60) + 'm' : (userItem as any).total_time_minutes + 'm') : '0m'}</span>
                                    </td>
                                    <td className="p-3">
                                      <span className="text-xs text-gray-400">{(userItem as any).last_session_duration_minutes ? ((userItem as any).last_session_duration_minutes >= 60 ? Math.floor((userItem as any).last_session_duration_minutes / 60) + 'h ' + ((userItem as any).last_session_duration_minutes % 60) + 'm' : (userItem as any).last_session_duration_minutes + 'm') : '0m'}</span>
                                    </td>
                                    <td className="p-3">
                                      {editingExpiry === userItem.id ? (
                                        <div className="flex items-center gap-1">
                                          <input type="date" value={expiryValue} onChange={(e) => setExpiryValue(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white w-28" />
                                          <button onClick={() => handleUpdateUserExpiry(userItem.id, expiryValue ? new Date(expiryValue).toISOString() : null)} disabled={isUpdatingExpiry} className="text-green-500 hover:text-green-400 p-1"><Check className="w-3 h-3" /></button>
                                          <button onClick={() => setEditingExpiry(null)} className="text-gray-400 hover:text-white p-1"><X className="w-3 h-3" /></button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-xs">
                                          <span className={!userItem.access_expires_at ? 'text-green-500' : (new Date(userItem.access_expires_at) < new Date() ? 'text-red-500' : 'text-gray-300')}>
                                            {userItem.access_expires_at ? new Date(userItem.access_expires_at).toLocaleDateString() : 'Lifetime'}
                                          </span>
                                          <button onClick={() => { setEditingExpiry(userItem.id); setExpiryValue(userItem.access_expires_at ? new Date(userItem.access_expires_at).toISOString().split('T')[0] : ''); }} className="text-gray-600 hover:text-blue-400 transition-colors"><Edit3 className="w-3 h-3" /></button>
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <span className="text-xs text-gray-500">
                                        {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : '—'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex justify-end gap-1">
                                        <button
                                          onClick={() => {
                                            if (expandedUser === userItem.id) {
                                              setExpandedUser(null);
                                              setAdjustingBalance(null);
                                              setChangingPassword(null);
                                              setEditingReminder(null);
                                              setEditingOverdue(null);
                                            } else {
                                              setExpandedUser(userItem.id);
                                            }
                                          }}
                                          className={`p-1.5 rounded transition-colors relative ${expandedUser === userItem.id ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                                          title="More Actions"
                                        >
                                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedUser === userItem.id ? 'rotate-180' : ''}`} />
                                          {((userItem.payment_reminder ? 1 : 0) + (userItem.overdue_message ? 1 : 0) + (userItem.expired_message ? 1 : 0)) > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                              {(userItem.payment_reminder ? 1 : 0) + (userItem.overdue_message ? 1 : 0) + (userItem.expired_message ? 1 : 0)}
                                            </span>
                                          )}
                                        </button>
                                        <button onClick={() => handleDeleteUser(userItem.id)} disabled={userItem.id === user?.id} className="p-1.5 hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded transition-colors disabled:opacity-30" title="Delete User">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  {/* Expanded Details Row */}
                                  {(expandedUser === userItem.id || adjustingBalance === userItem.id || changingPassword === userItem.id || editingReminder === userItem.id || editingOverdue === userItem.id) && (
                                    <tr className="bg-gray-800/30">
                                      <td colSpan={6} className="p-4 border-l-2 border-primary">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                          {/* Balance Section */}
                                          <div className="space-y-2">
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance Adjustment</div>
                                            <div className="flex flex-col gap-2">
                                              <select value={balanceType} onChange={(e) => setBalanceType(e.target.value as 'add' | 'set')} className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white">
                                                <option value="add">Add</option>
                                                <option value="set">Set</option>
                                              </select>
                                              <div className="flex gap-2">
                                                <input type="number" value={balanceAmount} onChange={(e) => { if (adjustingBalance !== userItem.id) { setAdjustingBalance(userItem.id); setBalanceAmount(''); setBalanceType('add'); } setBalanceAmount(e.target.value) }} placeholder="Amount" className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                                <button onClick={() => handleAdjustBalance(userItem.id)} disabled={isUpdatingBalance || !balanceAmount} className="bg-green-600 hover:bg-green-500 text-white rounded px-2 py-1 text-xs"><Check className="w-3 h-3" /></button>
                                              </div>
                                            </div>
                                          </div>
                                          {/* Password Section */}
                                          <div className="space-y-2">
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reset Password</div>
                                            <div className="flex gap-2">
                                              <input type="password" value={newPassword} onChange={(e) => { if (changingPassword !== userItem.id) { setChangingPassword(userItem.id); setNewPassword(''); } setNewPassword(e.target.value) }} placeholder="New Pass" className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                              <button onClick={() => handleChangePassword(userItem.id)} disabled={isUpdatingPassword || newPassword.length < 6} className="bg-yellow-600 hover:bg-yellow-500 text-white rounded px-2 py-1 text-xs"><Key className="w-3 h-3" /></button>
                                            </div>
                                          </div>
                                          {/* Team Assignment */}
                                          <div className="space-y-2">
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assign to Team</div>
                                            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleAssignTeam(userItem.id, fd.get('teamName') as string); }} className="flex gap-2">
                                              <input name="teamName" type="text" defaultValue={userItem.team_name || ''} placeholder="Team Name" className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 text-xs"><Check className="w-3 h-3" /></button>
                                            </form>
                                          </div>
                                          {/* Reminder Section */}
                                          <div className="space-y-2">
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                              <span>Payment Reminder</span>
                                              {userItem.payment_reminder && (<button onClick={() => handleDeleteReminder(userItem.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>)}
                                            </div>
                                            <div className="flex gap-2">
                                              <input type="text" value={reminderText} onChange={(e) => { if (editingReminder !== userItem.id) { setEditingReminder(userItem.id); setReminderText(userItem.payment_reminder || ''); } setReminderText(e.target.value) }} placeholder={userItem.payment_reminder || "Set reminder..."} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                              <button onClick={() => handleUpdateReminder(userItem.id)} disabled={isUpdatingReminder} className="bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 text-xs"><Check className="w-3 h-3" /></button>
                                            </div>
                                          </div>
                                          {/* Overdue Section */}
                                          <div className="space-y-2">
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                              <span>Overdue Message</span>
                                              {userItem.overdue_message && (<button onClick={() => handleDeleteOverdue(userItem.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>)}
                                            </div>
                                            <div className="flex gap-2">
                                              <input type="text" value={overdueText} onChange={(e) => { if (editingOverdue !== userItem.id) { setEditingOverdue(userItem.id); setOverdueText(userItem.overdue_message || ''); } setOverdueText(e.target.value) }} placeholder={userItem.overdue_message || "Set message..."} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                              <button onClick={() => handleUpdateOverdue(userItem.id)} disabled={isUpdatingOverdue} className="bg-red-600 hover:bg-red-500 text-white rounded px-2 py-1 text-xs"><Check className="w-3 h-3" /></button>
                                            </div>
                                          </div>
                                          {/* Expired Section */}
                                          <div className="space-y-2">
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                              <span>Expired Message</span>
                                              {userItem.expired_message && (<button onClick={() => handleClearExpired(userItem.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>)}
                                            </div>
                                            <div className="flex gap-2">
                                              <input type="text" value={expiredText} onChange={(e) => { if (editingExpired !== userItem.id) { setEditingExpired(userItem.id); setExpiredText(userItem.expired_message || ''); } setExpiredText(e.target.value) }} placeholder={userItem.expired_message || "Set expired message..."} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                                              <button onClick={() => handleUpdateExpired(userItem.id)} disabled={isUpdatingExpired} className="bg-orange-600 hover:bg-orange-500 text-white rounded px-2 py-1 text-xs"><Check className="w-3 h-3" /></button>
                                            </div>
                                          </div>
                                        </div>
                                        {/* Device Info */}
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                              <Monitor className="w-3.5 h-3.5" />
                                              <span>Device Binding</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {(userItem.device_token || userItem.first_fingerprint) && (
                                                <button onClick={() => handleResetDevice(userItem.id)} disabled={resettingDevice === userItem.id} className="inline-flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400 transition-colors">
                                                  <RefreshCw className={`w-3 h-3 ${resettingDevice === userItem.id ? 'animate-spin' : ''}`} />
                                                  Reset Device
                                                </button>
                                              )}
                                              <button onClick={() => loadDeviceAttempts(userItem.id)} disabled={loadingDeviceAttempts === userItem.id} className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                                {loadingDeviceAttempts === userItem.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                                                Load Attempts
                                              </button>
                                            </div>
                                          </div>
                                          {!userItem.first_fingerprint && !userItem.device_token && (
                                            <div className="text-xs text-gray-500">No device registered yet.</div>
                                          )}
                                          {deviceAttempts[userItem.id] && deviceAttempts[userItem.id].length > 0 && (
                                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                              <div className="text-xs font-semibold text-red-400 flex items-center gap-1 mb-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Blocked Login Attempts ({deviceAttempts[userItem.id].length})
                                              </div>
                                              {deviceAttempts[userItem.id].map((attempt: any, idx: number) => (
                                                <div key={attempt.id || idx} className="bg-red-900/20 border border-red-900/30 rounded p-2 text-xs">
                                                  <div className="flex items-center justify-between mb-1">
                                                    <span className="text-red-400 font-medium">{new Date(attempt.created_at).toLocaleString()}</span>
                                                    <span className="text-gray-500">IP: {attempt.ip_address || 'unknown'}</span>
                                                  </div>
                                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-gray-400">
                                                    {attempt.device_info?.browser && <span>Browser: {attempt.device_info.browser}</span>}
                                                    {attempt.device_info?.os && <span>OS: {attempt.device_info.os}</span>}
                                                    {attempt.device_info?.device_type && <span>Type: {attempt.device_info.device_type}</span>}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
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
                            <option value={2}>Knowledge Base</option>
                            <option value={3}>Mentorship</option>
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
                        <th className="py-3 px-4 text-sm font-medium text-gray-400 uppercase">Team</th>
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
          
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Services Management</h3>
                <button
                  onClick={() => {
                    setShowServiceForm(true);
                    setNewService({ title: '', price: 0, type: 'subscription', duration_days: 30, is_active: true, description: '', image_url: '' });
                    setIsEditingService(null);
                  }}
                  className="bg-primary hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Service
                </button>
              </div>

              {showServiceForm && (
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6">
                  <h4 className="text-lg font-bold mb-4">{isEditingService ? 'Edit Service' : 'New Service'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Title</label>
                      <input 
                        className="w-full bg-gray-700 rounded-lg p-2 text-white"
                        value={newService.title}
                        onChange={e => setNewService({...newService, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Price</label>
                      <input 
                        type="number"
                        className="w-full bg-gray-700 rounded-lg p-2 text-white"
                        value={newService.price}
                        onChange={e => setNewService({...newService, price: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Type</label>
                      <select 
                        className="w-full bg-gray-700 rounded-lg p-2 text-white"
                        value={newService.type}
                        onChange={e => setNewService({...newService, type: e.target.value})}
                      >
                        <option value="subscription">Subscription</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Duration (Days)</label>
                      <input 
                        type="number"
                        className="w-full bg-gray-700 rounded-lg p-2 text-white"
                        value={newService.duration_days}
                        onChange={e => setNewService({...newService, duration_days: Number(e.target.value)})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Description</label>
                      <textarea 
                        className="w-full bg-gray-700 rounded-lg p-2 text-white"
                        rows={3}
                        value={newService.description}
                        onChange={e => setNewService({...newService, description: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-sm text-gray-400 mb-1">Image URL</label>
                       <input 
                        className="w-full bg-gray-700 rounded-lg p-2 text-white"
                        value={newService.image_url}
                        onChange={e => setNewService({...newService, image_url: e.target.value})}
                       />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id="is_active"
                        checked={newService.is_active}
                        onChange={e => setNewService({...newService, is_active: e.target.checked})}
                      />
                      <label htmlFor="is_active" className="text-sm text-gray-400">Active (Visible in Shop)</label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button 
                      onClick={() => setShowServiceForm(false)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleUpdateService({ ...newService, id: isEditingService?.id })}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg"
                    >
                      Save Service
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(service => (
                  <div key={service.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 relative group">
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setIsEditingService(service);
                          setNewService(service);
                          setShowServiceForm(true);
                        }}
                        className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => handleDeleteService(service.id)}
                         className="p-2 bg-red-600 rounded-lg hover:bg-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-lg mb-1">{service.title}</h4>
                    <p className="text-sm text-gray-400 mb-2 h-10 overflow-hidden">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">${service.price}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${service.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Type: {service.type} | Duration: {service.duration_days} days
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="bg-gray-800 rounded-xl overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-[#111] text-gray-400 uppercase text-xs">
                     <tr>
                       <th className="px-6 py-3">Date</th>
                       <th className="px-6 py-3">User</th>
                       <th className="px-6 py-3">Service</th>
                       <th className="px-6 py-3">Amount</th>
                       <th className="px-6 py-3">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-700">
                     {purchases.map(purchase => (
                       <tr key={purchase.id} className="hover:bg-gray-700/50">
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {new Date(purchase.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-white">{purchase.user?.email || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{purchase.user?.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-white">{purchase.service?.title || 'Unknown Service'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-white">${purchase.amount}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                              {purchase.status}
                            </span>
                          </td>
                       </tr>
                     ))}
                     {purchases.length === 0 && (
                       <tr>
                         <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No purchases found</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          )}




        </div>
      </div>
      
      {/* Team Transactions Modal */}
      {viewingTeamTransactions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/50 rounded-t-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Team Transactions
              </h3>
              <button 
                onClick={() => setViewingTeamTransactions(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-0 overflow-auto flex-1">
              {(() => {
                const team = teams.find(t => t.id === viewingTeamTransactions);
                const teamMemberIds = users.filter(u => u.team_id === viewingTeamTransactions).map(u => u.id);
                const teamTransactions = transactions.filter(t => teamMemberIds.includes(t.user_id));
                
                if (!team) return null;
                
                return (
                  <div className="bg-gray-900">
                    <div className="p-4 bg-blue-900/10 border-b border-blue-900/30">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Team: <span className="font-semibold text-white">{team.name}</span></span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Total Balance:</span>
                          <span className="font-mono text-green-400 font-bold">
                            ${users.filter(u => u.team_id === viewingTeamTransactions).reduce((sum, m) => sum + (m.balance || 0), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {teamTransactions.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-800 text-gray-400 text-xs sticky top-0">
                          <tr>
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium">User</th>
                            <th className="p-3 font-medium">Type/Hash</th>
                            <th className="p-3 font-medium">Amount</th>
                            <th className="p-3 font-medium text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {teamTransactions.map((tx) => {
                            const user = users.find(u => u.id === tx.user_id);
                            return (
                              <tr key={tx.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="p-3 text-xs text-gray-400">
                                  {new Date(tx.created_at).toLocaleString()}
                                </td>
                                <td className="p-3 text-sm text-white">
                                  <div className="flex flex-col">
                                    <span>{user?.email || 'Unknown'}</span>
                                    {user?.name && <span className="text-xs text-gray-500">{user.name}</span>}
                                  </div>
                                </td>
                                <td className="p-3 text-xs text-gray-400 font-mono">
                                  <div className="max-w-[200px] truncate" title={tx.transaction_hash}>
                                    {tx.transaction_hash}
                                  </div>
                                  <div className="text-gray-500">{tx.currency} • {tx.crypto_address}</div>
                                </td>
                                <td className="p-3 text-sm font-mono text-white">
                                  {tx.amount.toFixed(2)} USDT
                                </td>
                                <td className="p-3 text-right">
                                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                    tx.status === 'confirmed' ? 'bg-green-900/30 text-green-400' :
                                    tx.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                                    'bg-yellow-900/30 text-yellow-400'
                                  }`}>
                                    {tx.status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-12 text-center text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No transactions found for this team.</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            
            <div className="p-4 border-t border-gray-700 bg-gray-800/30 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setViewingTeamTransactions(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}