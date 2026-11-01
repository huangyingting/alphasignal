'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Check,
  Copy,
  KeyRound,
  Mail,
  RefreshCw,
  Shield,
  Sliders,
  User,
  XCircle,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';

type ProfileState = {
  id: string;
  email: string;
  name: string;
  username: string;
  bio: string;
  websiteUrl: string;
  githubHandle: string;
  twitterHandle: string;
  role: string;
  admissionSource: string;
  admittedAt: string | null;
};

type EmailPrefState = {
  dailyDigest: boolean;
  weeklyTopPapers: boolean;
  productAlerts: boolean;
  timezone: string;
  deliveryHour: number;
};

type AdminInvitationRow = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type AdminUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  role: 'ADMIN' | 'OPERATOR' | 'MEMBER' | 'VIEWER';
  admissionSource: string;
  admittedAt: string | null;
  disabledAt: string | null;
};

type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  metadataJson: string;
  createdAt: string;
  actorUser?: { id: string; email: string | null; name: string | null } | null;
  targetUser?: { id: string; email: string | null; name: string | null } | null;
};

function SettingsContent() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);
  const isAdmin = session?.user?.role === 'ADMIN';

  const initialTab = searchParams.get('tab') ?? 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [profile, setProfile] = useState<ProfileState>({
    id: '',
    email: '',
    name: '',
    username: '',
    bio: '',
    websiteUrl: '',
    githubHandle: '',
    twitterHandle: '',
    role: 'MEMBER',
    admissionSource: 'INVITATION',
    admittedAt: null,
  });

  const [emailPref, setEmailPref] = useState<EmailPrefState>({
    dailyDigest: true,
    weeklyTopPapers: true,
    productAlerts: false,
    timezone: 'UTC',
    deliveryHour: 13,
  });

  const [personalization, setPersonalization] = useState<{
    followedTopics: string[];
    followedSubtopics: string[];
    followedCompanies: string[];
    contentTypes: string[];
    stackDescription: string;
  }>({
    followedTopics: ['agents', 'llms', 'open_source', 'development', 'infra'],
    followedSubtopics: ['tool_use', 'mcp', 'code_agents'],
    followedCompanies: ['openai', 'anthropic', 'deepseek'],
    contentTypes: ['NEWS', 'PAPERS', 'MODELS', 'REPOS'],
    stackDescription: '',
  });
  const [companySearch, setCompanySearch] = useState('');
  const [subtopicSearch, setSubtopicSearch] = useState('');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [expenseCopied, setExpenseCopied] = useState(false);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // Admin Governance state
  const [invitations, setInvitations] = useState<AdminInvitationRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'OPERATOR' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [inviteTtl, setInviteTtl] = useState(72);
  const [issuedLink, setIssuedLink] = useState<string | null>(null);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.profile) setProfile(data.profile);
      if (data.emailPreference) setEmailPref(data.emailPreference);
      if (data.personalization) setPersonalization(data.personalization);
    }
  }, [isAuthenticated]);

  const loadAdminGovernance = useCallback(async () => {
    if (!isAdmin) return;
    const res = await fetch('/api/account-invitations');
    if (res.ok) {
      const data = await res.json();
      setInvitations(data.invitations ?? []);
      setUsers(data.users ?? []);
      setAuditLogs(data.auditLogs ?? []);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminGovernance();
    }
  }, [isAdmin, loadAdminGovernance]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaveMessage(null);
    setSaveError(null);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        websiteUrl: profile.websiteUrl,
        githubHandle: profile.githubHandle,
        twitterHandle: profile.twitterHandle,
        emailPreference: emailPref,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error ?? 'Failed to save settings.');
    } else {
      setSaveMessage('Settings saved.');
      if (data.profile) setProfile((prev) => ({ ...prev, ...data.profile }));
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);
    setPwError(null);
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPwError(data.error ?? 'Failed to update password.');
    } else {
      setPwMessage('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
    }
  }

  async function handleIssueInvitation(e: React.FormEvent) {
    e.preventDefault();
    setAdminError(null);
    setIssuedLink(null);
    setIssuedToken(null);
    const res = await fetch('/api/account-invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        role: inviteRole,
        expiresInHours: inviteTtl,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAdminError(data.error ?? 'Failed to issue invitation.');
    } else {
      setIssuedLink(data.inviteUrl);
      setIssuedToken(data.rawToken);
      setInviteEmail('');
      await loadAdminGovernance();
    }
  }

  async function handleInvitationAction(id: string, action: 'revoke' | 'rotate') {
    setAdminError(null);
    const res = await fetch(`/api/account-invitations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAdminError(data.error ?? `Failed to ${action} invitation.`);
    } else {
      if (data.inviteUrl) {
        setIssuedLink(data.inviteUrl);
        setIssuedToken(data.rawToken);
      }
      await loadAdminGovernance();
    }
  }

  async function handleUpdateUser(
    userId: string,
    patch: { role?: 'ADMIN' | 'OPERATOR' | 'MEMBER' | 'VIEWER'; disabled?: boolean }
  ) {
    setAdminError(null);
    const res = await fetch('/api/account/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAdminError(data.error ?? 'Failed to update user.');
    } else {
      await loadAdminGovernance();
    }
  }

  if (status !== 'loading' && !isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="font-serif text-3xl text-[#ededed]">Authentication Required</h1>
        <p className="text-sm text-[#c5c5c5]">
          Sign in with an invited AlphaSignal account to manage profile, email preferences, and governance settings.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2.5 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'GENERAL', icon: User },
    { id: 'personalization', label: 'PERSONALIZATION', icon: Sliders },
    { id: 'subscription', label: 'SUBSCRIPTION', icon: Mail },
    { id: 'perks', label: 'PERKS', icon: Check },
    { id: 'emails', label: 'Emails', icon: Mail },
    { id: 'security', label: 'Security', icon: KeyRound },
    { id: 'appearance', label: 'Appearance', icon: Sliders },
    ...(isAdmin
      ? [
          { id: 'invitations', label: 'Invitations & Roles', icon: Shield },
          { id: 'audit', label: 'Audit Log', icon: Shield },
        ]
      : []),
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="border-b border-[#222222] pb-6">
        <h1 className="font-serif text-3xl text-[#ededed] font-normal">Settings</h1>
        <p className="text-sm text-[#c5c5c5] mt-1">
          Manage your profile, briefing schedule, security credentials, and platform governance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Sidebar Tabs */}
        <nav className="md:col-span-3 space-y-1 font-mono text-xs uppercase">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-testid={`settings-tab-${tab.id}`}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 border text-left transition-colors ${
                  active
                    ? 'border-[#ededed] bg-[#ededed] text-[#030303] font-medium'
                    : 'border-[#222222] bg-[#060606] text-[#c5c5c5] hover:border-[#444444]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Panel */}
        <div className="md:col-span-9 border border-[#222222] bg-[#060606] p-6 sm:p-8">
          {(activeTab === 'profile' || activeTab === 'emails') && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {activeTab === 'profile' ? (
                <>
                  <div className="border-b border-[#1c1c1c] pb-3">
                    <h2 className="font-serif text-xl text-[#ededed] font-normal">
                      Profile Information
                    </h2>
                    <p className="text-xs text-[#737373] font-mono uppercase mt-1">
                      ROLE: {profile.role} • SOURCE: {profile.admissionSource}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, name: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-[#222222] bg-[#040404] text-sm text-[#ededed]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                        Username
                      </label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, username: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-[#222222] bg-[#040404] font-mono text-sm text-[#ededed]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, bio: e.target.value }))
                      }
                      placeholder="AI researcher / systems engineer..."
                      className="w-full px-3 py-2 border border-[#222222] bg-[#040404] text-sm text-[#ededed]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={profile.websiteUrl}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, websiteUrl: e.target.value }))
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                        GitHub Handle
                      </label>
                      <input
                        type="text"
                        value={profile.githubHandle}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, githubHandle: e.target.value }))
                        }
                        placeholder="username"
                        className="w-full px-3 py-2 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                        X / Twitter Handle
                      </label>
                      <input
                        type="text"
                        value={profile.twitterHandle}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, twitterHandle: e.target.value }))
                        }
                        placeholder="handle"
                        className="w-full px-3 py-2 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-b border-[#1c1c1c] pb-3">
                    <h2 className="font-serif text-xl text-[#ededed] font-normal">
                      Email Briefing Preferences
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border border-[#222222] bg-[#040404] cursor-pointer">
                      <div>
                        <div className="text-sm font-medium text-[#ededed]">
                          Daily Intelligence Briefing
                        </div>
                        <div className="text-xs text-[#737373]">
                          Receive the daily summary of top AI repositories, papers, and breakthroughs.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailPref.dailyDigest}
                        onChange={(e) =>
                          setEmailPref((prev) => ({
                            ...prev,
                            dailyDigest: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-[#ededed]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 border border-[#222222] bg-[#040404] cursor-pointer">
                      <div>
                        <div className="text-sm font-medium text-[#ededed]">
                          Weekly Top Papers Deep-Dive
                        </div>
                        <div className="text-xs text-[#737373]">
                          Curated Sunday edition covering highest-impact arXiv preprints and benchmarks.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailPref.weeklyTopPapers}
                        onChange={(e) =>
                          setEmailPref((prev) => ({
                            ...prev,
                            weeklyTopPapers: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-[#ededed]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 border border-[#222222] bg-[#040404] cursor-pointer">
                      <div>
                        <div className="text-sm font-medium text-[#ededed]">
                          Breaking Model Releases
                        </div>
                        <div className="text-xs text-[#737373]">
                          Instant alerts for major frontier model weights and API announcements.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailPref.productAlerts}
                        onChange={(e) =>
                          setEmailPref((prev) => ({
                            ...prev,
                            productAlerts: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-[#ededed]"
                      />
                    </label>
                  </div>
                </>
              )}

              {saveMessage && (
                <p className="font-mono text-xs text-emerald-400">{saveMessage}</p>
              )}
              {saveError && (
                <p className="font-mono text-xs text-red-400">{saveError}</p>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  data-testid="save-settings-button"
                  className="px-5 py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium hover:bg-white"
                >
                  Save Changes
                </button>
                <a
                  href="/api/settings?export=1"
                  download="alphasignal-account-export.json"
                  className="px-4 py-2 border border-[#222222] bg-[#080808] font-mono text-xs uppercase text-[#c5c5c5] hover:text-[#ededed]"
                >
                  Data &amp; Account · Export JSON
                </a>
              </div>
            </form>
          )}

          {activeTab === 'personalization' && (
            <div className="space-y-8">
              <div className="border-b border-[#1c1c1c] pb-4">
                <h2 className="font-serif text-xl text-[#ededed] font-normal">
                  Import Preferences
                </h2>
                <p className="text-xs text-[#c5c5c5] mt-1">
                  Connect your accounts or begin describing yourself to automatically match the topics, subtopics, and companies to follow.
                </p>
                <div className="mt-4 space-y-2">
                  <label className="block font-mono text-[11px] uppercase text-[#737373]">
                    DESCRIBE YOUR STACK ({personalization.stackDescription.length} / 50 characters minimum)
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={personalization.stackDescription}
                      onChange={(e) =>
                        setPersonalization((p) => ({
                          ...p,
                          stackDescription: e.target.value,
                        }))
                      }
                      placeholder="We build autonomous coding agents using OpenAI, Claude Code, MCP servers, vLLM inference, and PyTorch..."
                      className="flex-1 px-3 py-2 border border-[#222222] bg-[#040404] text-xs text-[#ededed]"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setSyncMessage(null);
                        const res = await fetch('/api/settings', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            personalization: {
                              ...personalization,
                              syncStack: true,
                            },
                          }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          if (data.personalization) setPersonalization(data.personalization);
                          setSyncMessage('Stack preferences synchronized.');
                        }
                      }}
                      className="px-4 py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
                    >
                      SYNC
                    </button>
                  </div>
                  {syncMessage && (
                    <p className="font-mono text-xs text-emerald-400">{syncMessage}</p>
                  )}
                </div>
              </div>

              {/* Followed Companies */}
              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#ededed]">Followed Companies</h3>
                <p className="text-xs text-[#737373]">The companies you follow.</p>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="SEARCH COMPANIES (e.g. openai, anthropic, nvidia)"
                    className="flex-1 px-3 py-1.5 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const slug = companySearch.trim().toLowerCase();
                      if (!slug) return;
                      setPersonalization((p) => ({
                        ...p,
                        followedCompanies: Array.from(new Set([...p.followedCompanies, slug])),
                      }));
                      setCompanySearch('');
                    }}
                    className="px-3 py-1.5 border border-[#222222] font-mono text-xs uppercase text-[#ededed]"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {personalization.followedCompanies.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setPersonalization((p) => ({
                          ...p,
                          followedCompanies: p.followedCompanies.filter((x) => x !== c),
                        }))
                      }
                      className="px-2.5 py-1 border border-[#ededed] bg-[#0e0e0e] font-mono text-xs uppercase text-[#ededed]"
                    >
                      {c} ×
                    </button>
                  ))}
                </div>
              </div>

              {/* Followed Topics */}
              <div className="space-y-3 border-t border-[#1c1c1c] pt-6">
                <h3 className="font-serif text-lg text-[#ededed]">
                  Followed Topics · {personalization.followedTopics.length}
                </h3>
                <p className="text-xs text-[#737373]">
                  Pick the subjects you want represented. Selected topics get prioritized across your feed.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'agents',
                    'api',
                    'audio',
                    'benchmarks',
                    'business',
                    'data',
                    'development',
                    'government',
                    'gpus',
                    'image',
                    'infra',
                    'llms',
                    'open_source',
                    'post_training',
                    'reasoning',
                    'retrieval',
                    'robotics',
                    'security',
                    'training_infra',
                    'vibe_coding',
                    'video',
                  ].map((topic) => {
                    const selected = personalization.followedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() =>
                          setPersonalization((p) => ({
                            ...p,
                            followedTopics: selected
                              ? p.followedTopics.filter((t) => t !== topic)
                              : [...p.followedTopics, topic],
                          }))
                        }
                        className={`px-2.5 py-1 border font-mono text-[11px] uppercase ${
                          selected
                            ? 'border-[#ededed] bg-[#ededed] text-[#030303]'
                            : 'border-[#222222] bg-[#040404] text-[#737373]'
                        }`}
                      >
                        {topic} {selected ? '×' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Followed Subtopics */}
              <div className="space-y-3 border-t border-[#1c1c1c] pt-6">
                <h3 className="font-serif text-lg text-[#ededed]">Followed Subtopics</h3>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={subtopicSearch}
                    onChange={(e) => setSubtopicSearch(e.target.value)}
                    placeholder="SEARCH SUBTOPICS (e.g. tool_use, mcp, rag)"
                    className="flex-1 px-3 py-1.5 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const slug = subtopicSearch.trim().toLowerCase();
                      if (!slug) return;
                      setPersonalization((p) => ({
                        ...p,
                        followedSubtopics: Array.from(new Set([...p.followedSubtopics, slug])),
                      }));
                      setSubtopicSearch('');
                    }}
                    className="px-3 py-1.5 border border-[#222222] font-mono text-xs uppercase text-[#ededed]"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {personalization.followedSubtopics.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setPersonalization((p) => ({
                          ...p,
                          followedSubtopics: p.followedSubtopics.filter((x) => x !== s),
                        }))
                      }
                      className="px-2.5 py-1 border border-[#222222] bg-[#0e0e0e] font-mono text-xs uppercase text-[#c5c5c5]"
                    >
                      {s} ×
                    </button>
                  ))}
                </div>
              </div>

              {/* Content types */}
              <div className="space-y-3 border-t border-[#1c1c1c] pt-6">
                <h3 className="font-serif text-lg text-[#ededed]">Content types</h3>
                <p className="text-xs text-[#737373]">
                  Choose which formats show up in your feed, news, papers, model releases, and repositories.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['NEWS', 'PAPERS', 'MODELS', 'REPOS'].map((ct) => {
                    const active = personalization.contentTypes.includes(ct);
                    return (
                      <button
                        key={ct}
                        type="button"
                        onClick={() =>
                          setPersonalization((p) => ({
                            ...p,
                            contentTypes: active
                              ? p.contentTypes.filter((x) => x !== ct)
                              : [...p.contentTypes, ct],
                          }))
                        }
                        className={`px-3 py-1.5 border font-mono text-xs uppercase ${
                          active
                            ? 'border-[#ededed] bg-[#ededed] text-[#030303]'
                            : 'border-[#222222] bg-[#040404] text-[#737373]'
                        }`}
                      >
                        {ct} {active ? '×' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch('/api/settings', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ personalization }),
                    });
                    if (res.ok) {
                      setSyncMessage('Personalization saved.');
                    }
                  }}
                  className="px-5 py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
                >
                  Save Personalization
                </button>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="border-b border-[#1c1c1c] pb-4 flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase text-[#737373]">CURRENT PLAN</div>
                  <h2 className="font-serif text-2xl text-[#ededed]">AlphaSignal Pro</h2>
                </div>
                <Link
                  href="/pricing"
                  className="px-4 py-2 border border-[#ededed] bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
                >
                  COMPARE PLANS
                </Link>
              </div>

              <div className="p-5 border border-[#222222] bg-[#040404] space-y-3">
                <div className="font-mono text-[11px] uppercase text-emerald-400">
                  MOST PEOPLE EXPENSE IT - $0 OUT OF POCKET
                </div>
                <h3 className="font-serif text-xl text-[#ededed]">
                  Get Pro for $0 out of pocket
                </h3>
                <p className="text-xs text-[#c5c5c5] leading-relaxed">
                  Pro helps you get better at your job, so most managers approve it, and many companies reimburse it as a work expense. We&apos;ll write the email for you.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      'Hi — I would like to expense an AlphaSignal Pro subscription ($19/mo) to track AI research papers, model releases, and engineering benchmarks relevant to our stack.'
                    );
                    setExpenseCopied(true);
                    setTimeout(() => setExpenseCopied(false), 2000);
                  }}
                  className="px-4 py-2 border border-[#222222] bg-[#0e0e0e] font-mono text-xs uppercase text-[#ededed]"
                >
                  {expenseCopied ? '✓ Expense Template Copied' : 'Copy Manager Reimbursement Email'}
                </button>
              </div>

              <div className="p-5 border border-[#222222] bg-[#040404] space-y-2">
                <h3 className="font-serif text-xl text-[#ededed]">AlphaSignal Team</h3>
                <p className="text-xs text-[#c5c5c5]">
                  Roll AlphaSignal out across your team — SSO &amp; SAML, centralized billing and seat management, shared topic configurations, usage analytics, and priority support.
                </p>
                <a
                  href="mailto:kevin@alphasignal.ai?subject=AlphaSignal%20Team"
                  className="inline-block mt-2 px-4 py-1.5 border border-[#222222] font-mono text-xs uppercase text-[#ededed]"
                >
                  CONTACT SALES
                </a>
              </div>
            </div>
          )}

          {activeTab === 'perks' && (
            <div className="space-y-6">
              <div className="border-b border-[#1c1c1c] pb-3">
                <h2 className="font-serif text-2xl text-[#ededed]">Perks</h2>
                <p className="text-xs text-[#c5c5c5] mt-1">
                  Your Pro membership automatically qualifies you for these partner offers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: '$200 in Viktor credits', partner: 'Viktor AI' },
                  { title: '$100 in Wisprflow credits', partner: 'Wisprflow' },
                  { title: '50k Anything.com credits', partner: 'Anything.com' },
                  { title: '3 months free access to Skej', partner: 'Skej' },
                ].map((perk) => (
                  <div
                    key={perk.title}
                    className="p-4 border border-[#222222] bg-[#040404] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-sm text-[#ededed]">{perk.title}</div>
                      <div className="font-mono text-[10px] uppercase text-[#737373] mt-0.5">
                        {perk.partner}
                      </div>
                    </div>
                    <Link
                      href="/pricing"
                      className="px-3 py-1 border border-[#222222] bg-[#0e0e0e] font-mono text-xs uppercase text-[#ededed] hover:border-[#444444]"
                    >
                      VIEW
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
              <div className="border-b border-[#1c1c1c] pb-3">
                <h2 className="font-serif text-xl text-[#ededed] font-normal">
                  Update Password
                </h2>
                <p className="text-xs text-[#737373] mt-1">
                  Passwords use scrypt-v1 derivation and require at least 10 characters with letters and numbers.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#222222] bg-[#040404] text-sm text-[#ededed]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs uppercase text-[#c5c5c5]">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#222222] bg-[#040404] text-sm text-[#ededed]"
                />
              </div>

              {pwMessage && (
                <p className="font-mono text-xs text-emerald-400">{pwMessage}</p>
              )}
              {pwError && (
                <p className="font-mono text-xs text-red-400">{pwError}</p>
              )}

              <button
                type="submit"
                className="px-5 py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
              >
                Update Password
              </button>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl text-[#ededed] font-normal">
                Terminal Appearance
              </h2>
              <p className="text-sm text-[#c5c5c5]">
                AlphaSignal uses the canonical high-contrast Obsidian theme (`#030303` background, `#222222` 1px borders, Playfair Display + JetBrains Mono) optimized for zero-glare technical reading.
              </p>
              <div className="p-4 border border-[#ededed] bg-[#030303] font-mono text-xs uppercase text-[#ededed] inline-block">
                ✓ ACTIVE THEME: OBSIDIAN MONOCHROME (#030303)
              </div>
            </div>
          )}

          {activeTab === 'invitations' && isAdmin && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="font-serif text-xl text-[#ededed] font-normal">
                  Issue Single-Use Account Invitation
                </h2>
                <p className="text-xs text-[#c5c5c5]">
                  Registration is strictly invitation-only. Raw tokens are shown once and stored as SHA-256 hashes.
                </p>

                <form
                  onSubmit={handleIssueInvitation}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-5 space-y-1">
                    <label className="block font-mono text-[11px] uppercase text-[#737373]">
                      Invitee Email
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="engineer@organization.org"
                      data-testid="invite-email-input"
                      className="w-full px-3 py-2 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="block font-mono text-[11px] uppercase text-[#737373]">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) =>
                        setInviteRole(
                          e.target.value as 'ADMIN' | 'OPERATOR' | 'MEMBER' | 'VIEWER'
                        )
                      }
                      data-testid="invite-role-select"
                      className="w-full px-3 py-2 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="OPERATOR">OPERATOR</option>
                      <option value="VIEWER">VIEWER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="block font-mono text-[11px] uppercase text-[#737373]">
                      TTL (Hours)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={inviteTtl}
                      onChange={(e) => setInviteTtl(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#222222] bg-[#040404] font-mono text-xs text-[#ededed]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      data-testid="issue-invite-button"
                      className="w-full py-2 bg-[#ededed] text-[#030303] font-mono text-xs uppercase font-medium"
                    >
                      Issue
                    </button>
                  </div>
                </form>

                {adminError && (
                  <p className="font-mono text-xs text-red-400">{adminError}</p>
                )}

                {issuedLink && (
                  <div
                    data-testid="issued-invite-banner"
                    className="p-4 border border-[#ededed] bg-[#0c0c0c] space-y-2"
                  >
                    <div className="font-mono text-xs uppercase text-emerald-400">
                      One-Time Invitation Link Generated (Copy Now)
                    </div>
                    <div className="flex items-center gap-2">
                      <code
                        data-testid="issued-invite-url"
                        data-token={issuedToken ?? ''}
                        className="flex-1 p-2 bg-[#030303] border border-[#222222] font-mono text-xs text-[#ededed] break-all"
                      >
                        {issuedLink}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(issuedLink);
                          setCopiedInvite(true);
                          setTimeout(() => setCopiedInvite(false), 1800);
                        }}
                        className="px-3 py-2 border border-[#222222] bg-[#141414] font-mono text-xs uppercase text-[#ededed] flex items-center gap-1"
                      >
                        {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedInvite ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Invitations Table */}
              <div className="space-y-3 border-t border-[#1c1c1c] pt-6">
                <h3 className="font-mono text-xs uppercase tracking-wider text-[#ededed]">
                  Issued Invitations ({invitations.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#222222] text-[#737373] uppercase">
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Expires</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#161616]">
                      {invitations.map((inv) => {
                        const statusLabel = inv.acceptedAt
                          ? 'ACCEPTED'
                          : inv.revokedAt
                          ? 'REVOKED'
                          : new Date(inv.expiresAt).getTime() <= Date.now()
                          ? 'EXPIRED'
                          : 'PENDING';
                        return (
                          <tr key={inv.id} data-testid="invitation-row">
                            <td className="py-2.5 pr-4 text-[#ededed]">{inv.email}</td>
                            <td className="py-2.5 pr-4 text-[#c5c5c5]">{inv.role}</td>
                            <td className="py-2.5 pr-4">
                              <span className="px-1.5 py-0.5 border border-[#262626] bg-[#101010] text-[10px]">
                                {statusLabel}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-[#737373]">
                              {new Date(inv.expiresAt).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 text-right space-x-2">
                              {!inv.acceptedAt && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleInvitationAction(inv.id, 'rotate')}
                                    data-testid="rotate-invite-button"
                                    className="px-2 py-1 border border-[#222222] hover:border-[#555555] text-[#c5c5c5] inline-flex items-center gap-1"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Rotate</span>
                                  </button>
                                  {!inv.revokedAt && (
                                    <button
                                      type="button"
                                      onClick={() => handleInvitationAction(inv.id, 'revoke')}
                                      data-testid="revoke-invite-button"
                                      className="px-2 py-1 border border-[#222222] hover:border-red-400 text-red-400 inline-flex items-center gap-1"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      <span>Revoke</span>
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Admitted Users & Role Governance */}
              <div className="space-y-3 border-t border-[#1c1c1c] pt-6">
                <h3 className="font-mono text-xs uppercase tracking-wider text-[#ededed]">
                  Admitted Accounts ({users.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#222222] text-[#737373] uppercase">
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Source</th>
                        <th className="py-2 pr-4">Role</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 text-right">Governance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#161616]">
                      {users.map((u) => {
                        const isSelf = u.id === session?.user?.id;
                        const isDisabled = Boolean(u.disabledAt);
                        return (
                          <tr key={u.id} data-testid="user-governance-row">
                            <td className="py-2.5 pr-4 text-[#ededed]">
                              {u.email}
                              {isSelf && <span className="ml-1.5 text-[#737373]">(you)</span>}
                            </td>
                            <td className="py-2.5 pr-4 text-[#737373]">{u.admissionSource}</td>
                            <td className="py-2.5 pr-4">
                              <select
                                disabled={isSelf}
                                value={u.role}
                                onChange={(e) =>
                                  handleUpdateUser(u.id, {
                                    role: e.target.value as
                                      | 'ADMIN'
                                      | 'OPERATOR'
                                      | 'MEMBER'
                                      | 'VIEWER',
                                  })
                                }
                                className="px-2 py-1 border border-[#222222] bg-[#040404] text-[#ededed] disabled:opacity-50"
                              >
                                <option value="ADMIN">ADMIN</option>
                                <option value="OPERATOR">OPERATOR</option>
                                <option value="MEMBER">MEMBER</option>
                                <option value="VIEWER">VIEWER</option>
                              </select>
                            </td>
                            <td className="py-2.5 pr-4">
                              <span
                                className={`px-1.5 py-0.5 border text-[10px] ${
                                  isDisabled
                                    ? 'border-red-900 text-red-400'
                                    : 'border-[#262626] text-emerald-400'
                                }`}
                              >
                                {isDisabled ? 'DISABLED' : 'ACTIVE'}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateUser(u.id, { disabled: !isDisabled })
                                  }
                                  data-testid="toggle-user-status-button"
                                  className="px-2.5 py-1 border border-[#222222] hover:border-[#555555] text-[#c5c5c5]"
                                >
                                  {isDisabled ? 'Re-enable' : 'Disable'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && isAdmin && (
            <div className="space-y-4">
              <div className="border-b border-[#1c1c1c] pb-3">
                <h2 className="font-serif text-xl text-[#ededed] font-normal">
                  Security & Governance Audit Log
                </h2>
                <p className="text-xs text-[#737373] mt-1">
                  Immutable record of account admissions, invitation lifecycle events, role changes, and authentication activity.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table
                  data-testid="audit-log-table"
                  className="w-full text-left font-mono text-xs border-collapse"
                >
                  <thead>
                    <tr className="border-b border-[#222222] text-[#737373] uppercase">
                      <th className="py-2 pr-4">Timestamp</th>
                      <th className="py-2 pr-4">Action</th>
                      <th className="py-2 pr-4">Actor</th>
                      <th className="py-2 pr-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161616]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} data-testid="audit-log-row">
                        <td className="py-2.5 pr-4 text-[#737373] whitespace-nowrap">
                          {new Date(log.createdAt).toISOString().slice(0, 19).replace('T', ' ')}
                        </td>
                        <td className="py-2.5 pr-4 text-[#ededed] font-medium">
                          {log.action}
                        </td>
                        <td className="py-2.5 pr-4 text-[#c5c5c5]">
                          {log.actorUser?.email ?? 'system'}
                        </td>
                        <td className="py-2.5 text-[#737373] break-all max-w-md">
                          {log.metadataJson}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="p-12 font-mono text-xs uppercase text-[#737373]">
            Loading settings...
          </div>
        }
      >
        <SettingsContent />
      </Suspense>
    </AppShell>
  );
}
