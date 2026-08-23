'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Key,
  User,
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckSquare,
  Square,
  Search,
  RefreshCw,
  ExternalLink,
  Layers,
  ShieldCheck,
  Terminal,
  Copy,
  Trash2,
  Play,
  Sparkles,
  BookOpen,
  AlertCircle,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { UserSettings, DiscoveredCourseItem, ConsoleLogItem } from '@/lib/types';

interface AccountSetupViewProps {
  settings: UserSettings | null;
  onSaveSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  onTriggerSync: () => void;
  isSyncing: boolean;
}

export function AccountSetupView({
  settings,
  onSaveSettings,
  onTriggerSync,
  isSyncing,
}: AccountSetupViewProps) {
  // Credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoSyncOnSave, setAutoSyncOnSave] = useState(true);
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [credsSavedSuccess, setCredsSavedSuccess] = useState(false);

  // Courses state
  const [discoveredCourses, setDiscoveredCourses] = useState<DiscoveredCourseItem[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isSavingCourses, setIsSavingCourses] = useState(false);
  const [coursesSavedSuccess, setCoursesSavedSuccess] = useState(false);

  // Live Console state
  const [isConsoleOpenMobile, setIsConsoleOpenMobile] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogItem[]>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: 'Account & Course Manager initialized. Ready for credentials configuration.',
      tag: 'INFO',
      type: 'info',
    },
  ]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Initialize from settings
  useEffect(() => {
    if (settings) {
      setUsername(settings.ousl_username || '');
      setPassword(settings.ousl_password || '');
      setAutoSyncOnSave(settings.auto_sync_on_save !== false);
      if (settings.discovered_courses && settings.discovered_courses.length > 0) {
        setDiscoveredCourses(settings.discovered_courses);
      }
      if (settings.selected_courses) {
        setSelectedCourses(settings.selected_courses);
      }
    }
  }, [settings]);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const addLog = (
    message: string,
    tag: 'AUTH' | 'DISCOVERY' | 'CRAWLER' | 'SUCCESS' | 'ERROR' | 'INFO' = 'INFO',
    type: 'step' | 'done' | 'error' | 'info' = 'step'
  ) => {
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message,
        tag,
        type,
      },
    ]);
  };

  // 1. Handle Saving Credentials
  const handleSaveCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim()) {
      addLog('Please enter your OUSL student username/ID before saving.', 'ERROR', 'error');
      return;
    }

    setIsSavingCreds(true);
    addLog(`Saving credentials for student "${username}"...`, 'AUTH', 'step');

    try {
      await onSaveSettings({
        ousl_username: username.trim(),
        ousl_password: password,
        auto_sync_on_save: autoSyncOnSave,
      });

      setCredsSavedSuccess(true);
      addLog('Credentials saved successfully to store.', 'SUCCESS', 'done');

      setTimeout(() => setCredsSavedSuccess(false), 2000);

      // If auto-sync on save is enabled and password is provided, trigger course discovery
      if (autoSyncOnSave && password) {
        addLog('Auto-discovery enabled: Initiating course discovery on OUSL LMS...', 'DISCOVERY', 'step');
        handleDiscoverCourses();
      }
    } catch (err) {
      addLog(`Failed to save credentials: ${err instanceof Error ? err.message : String(err)}`, 'ERROR', 'error');
    } finally {
      setIsSavingCreds(false);
    }
  };

  // 2. Handle Discovering Courses via SSE
  const handleDiscoverCourses = async () => {
    if (!username.trim() || !password) {
      addLog('Both username and password are required to discover courses from OUSL.', 'ERROR', 'error');
      return;
    }

    setIsDiscovering(true);
    addLog('Connecting to OUSL IAM Keycloak server for course discovery...', 'DISCOVERY', 'step');

    try {
      const params = new URLSearchParams({
        username: username.trim(),
        password: password,
      });

      const eventSource = new EventSource(`/api/courses/discover?${params.toString()}`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'start' || payload.type === 'progress') {
            addLog(payload.message, 'DISCOVERY', 'step');
          } else if (payload.type === 'done') {
            addLog(payload.message, 'SUCCESS', 'done');
            if (payload.courses && Array.isArray(payload.courses)) {
              setDiscoveredCourses(payload.courses);
              // If no courses were selected, select all discovered
              if (selectedCourses.length === 0) {
                const allCodes = payload.courses.map((c: DiscoveredCourseItem) => c.code);
                setSelectedCourses(allCodes);
                onSaveSettings({
                  discovered_courses: payload.courses,
                  selected_courses: allCodes,
                });
              } else {
                onSaveSettings({
                  discovered_courses: payload.courses,
                });
              }
            }
            setIsDiscovering(false);
            eventSource.close();
          } else if (payload.type === 'error') {
            addLog(payload.message || 'Discovery error occurred.', 'ERROR', 'error');
            setIsDiscovering(false);
            eventSource.close();
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (err) => {
        addLog('Course discovery connection closed or failed.', 'ERROR', 'error');
        eventSource.close();
        setIsDiscovering(false);
      };
    } catch (err) {
      addLog(`Discovery trigger error: ${err instanceof Error ? err.message : String(err)}`, 'ERROR', 'error');
      setIsDiscovering(false);
    }
  };

  // 3. Toggle Individual Course Selection
  const handleToggleCourse = (courseCode: string) => {
    const isCurrentlySelected = selectedCourses.includes(courseCode);
    const updated = isCurrentlySelected
      ? selectedCourses.filter((code) => code !== courseCode)
      : [...selectedCourses, courseCode];

    setSelectedCourses(updated);
    addLog(
      `${isCurrentlySelected ? 'Removed' : 'Added'} [${courseCode}] ${isCurrentlySelected ? 'from' : 'to'} active crawl whitelist.`,
      'INFO',
      'info'
    );

    // Auto-save course selection
    onSaveSettings({ selected_courses: updated });
  };

  const handleSelectAllCourses = () => {
    const allCodes = discoveredCourses.map((c) => c.code);
    setSelectedCourses(allCodes);
    onSaveSettings({ selected_courses: allCodes });
    addLog(`Selected all ${allCodes.length} discovered courses.`, 'INFO', 'info');
  };

  const handleDeselectAllCourses = () => {
    setSelectedCourses([]);
    onSaveSettings({ selected_courses: [] });
    addLog('Deselected all courses.', 'INFO', 'info');
  };

  const handleSaveCourseSelection = async () => {
    setIsSavingCourses(true);
    try {
      await onSaveSettings({ selected_courses: selectedCourses });
      setCoursesSavedSuccess(true);
      addLog(`Saved selection of ${selectedCourses.length} courses.`, 'SUCCESS', 'done');
      setTimeout(() => setCoursesSavedSuccess(false), 2000);
    } catch (err) {
      addLog(`Failed to save course selection: ${err}`, 'ERROR', 'error');
    } finally {
      setIsSavingCourses(false);
    }
  };

  // Filtered courses for display
  const filteredCourses = useMemo(() => {
    if (!courseSearchQuery.trim()) return discoveredCourses;
    const q = courseSearchQuery.toLowerCase();
    return discoveredCourses.filter(
      (c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
    );
  }, [discoveredCourses, courseSearchQuery]);

  const handleCopyLogs = () => {
    const text = consoleLogs
      .map((l) => `[${l.time}] [${l.tag || 'LOG'}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    addLog('Console logs copied to clipboard.', 'INFO', 'info');
  };

  const handleClearLogs = () => {
    setConsoleLogs([
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message: 'Console cleared.',
        tag: 'INFO',
        type: 'info',
      },
    ]);
  };

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header Hero Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#EAEAE5] p-5 sm:p-6 rounded-2xl shadow-refero-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18181B] text-white flex items-center justify-center shadow-refero-sm">
              <Key className="w-4 h-4" />
            </div>
            <h1 className="text-[17px] sm:text-[18px] font-semibold text-[#18181B] tracking-tight">
              Credentials & Course Manager
            </h1>
          </div>
          <p className="text-[12.5px] sm:text-[13px] text-[#71717A] mt-1.5 leading-relaxed max-w-2xl">
            Configure your personal OUSL LMS login credentials and customize which enrolled semester courses to track and index for announcements, CATs, grades, and vivas.
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="px-3 py-1.5 bg-white rounded-xl border border-black/[0.08] shadow-refero-sm text-[12px] font-medium text-[#18181B] flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                username ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
            <span>{username ? `ID: ${username.split('@')[0]}` : 'Credentials Unset'}</span>
          </div>

          <div className="px-3 py-1.5 bg-white rounded-xl border border-black/[0.08] shadow-refero-sm text-[12px] font-medium text-[#18181B] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#71717A]" />
            <span>
              {selectedCourses.length} / {discoveredCourses.length} Active
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Credentials & Course Whitelist (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: OUSL LMS Credentials Form */}
          <div className="bg-[#EAEAE5] p-5 sm:p-6 rounded-2xl shadow-refero-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#18181B]" />
                <h2 className="text-[14.5px] font-semibold text-[#18181B]">
                  1. OUSL LMS Student Credentials
                </h2>
              </div>
              <span className="text-[11px] text-[#71717A]">Keycloak IAM OAuth2</span>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="text-[12px] font-semibold text-[#18181B] flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5 text-[#71717A]" />
                  <span>OUSL Student Username / Email</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. s12345678@ousl.lk or student ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-[14px] bg-white rounded-xl border border-black/[0.08] shadow-refero-sm focus:outline-none focus:ring-1 focus:ring-black/20 transition-all placeholder:text-[#71717A] min-h-[44px]"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="text-[12px] font-semibold text-[#18181B] flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#71717A]" />
                    <span>OUSL Student Password</span>
                  </span>
                  <span className="text-[11px] text-[#71717A]">Stored locally</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your OUSL Moodle / IAM password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-12 py-2.5 text-[14px] bg-white rounded-xl border border-black/[0.08] shadow-refero-sm focus:outline-none focus:ring-1 focus:ring-black/20 transition-all placeholder:text-[#71717A] min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#71717A] hover:text-[#18181B] active:scale-95 transition-all rounded-lg"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Auto Sync Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-black/[0.04] mt-2">
                <div className="pr-3">
                  <span className="text-[12.5px] font-semibold text-[#18181B] block">
                    Auto-Discover Courses on Save
                  </span>
                  <span className="text-[11px] text-[#71717A] block">
                    Automatically pull all enrolled semester courses when credentials are updated
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 min-h-[44px] min-w-[48px] justify-end">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={autoSyncOnSave}
                    aria-label="Auto-Discover Courses on Save"
                    checked={autoSyncOnSave}
                    onChange={(e) => setAutoSyncOnSave(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-black/[0.15] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:right-[22px] peer-checked:after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#18181B]" />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2.5 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDiscoverCourses}
                  disabled={isDiscovering || !username || !password}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[12.5px] font-medium text-[#18181B] bg-white hover:bg-[#F9F9F7] active:bg-[#ede3da] border border-black/[0.08] rounded-xl shadow-refero-sm disabled:opacity-50 active:scale-[0.98] transition-all min-h-[44px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
                  <span>{isDiscovering ? 'Discovering...' : 'Discover Enrolled Courses'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingCreds}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-[12.5px] font-medium text-white bg-[#18181B] hover:bg-[#27272A] rounded-xl shadow-refero-sm disabled:opacity-60 active:scale-[0.98] transition-all min-h-[44px]"
                >
                  {credsSavedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : isSavingCreds ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Save Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Enrolled Courses & Whitelist Selection */}
          <div className="bg-[#EAEAE5] p-5 sm:p-6 rounded-2xl shadow-refero-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#18181B]" />
                  <h2 className="text-[14.5px] font-semibold text-[#18181B]">
                    2. Enrolled Courses Whitelist
                  </h2>
                </div>
                <p className="text-[11.5px] text-[#71717A] mt-0.5">
                  Tick courses individually to select which ones are crawled and indexed.
                </p>
              </div>

              {/* Quick Select Buttons */}
              {discoveredCourses.length > 0 && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleSelectAllCourses}
                    className="px-3.5 py-1.5 text-[12px] font-medium text-[#18181B] bg-white rounded-xl border border-black/[0.08] shadow-refero-sm hover:bg-[#F9F9F7] active:bg-[#ede3da] active:scale-[0.98] transition-all min-h-[38px]"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAllCourses}
                    className="px-3.5 py-1.5 text-[12px] font-medium text-[#71717A] bg-white rounded-xl border border-black/[0.08] shadow-refero-sm hover:bg-[#F9F9F7] active:bg-[#ede3da] hover:text-[#18181B] active:scale-[0.98] transition-all min-h-[38px]"
                  >
                    Deselect All
                  </button>
                </div>
              )}
            </div>

            {/* Course Search */}
            {discoveredCourses.length > 0 && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Search discovered courses..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-[14px] bg-white rounded-xl border border-black/[0.08] shadow-refero-sm focus:outline-none focus:ring-1 focus:ring-black/20 transition-all placeholder:text-[#71717A] min-h-[44px]"
                />
              </div>
            )}

            {/* Courses List */}
            {discoveredCourses.length > 0 ? (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredCourses.map((course) => {
                  const isChecked = selectedCourses.includes(course.code);
                  return (
                    <div
                      key={course.code}
                      role="checkbox"
                      aria-checked={isChecked}
                      tabIndex={0}
                      onClick={() => handleToggleCourse(course.code)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 min-h-[54px] select-none active:bg-black/[0.04] ${
                        isChecked
                          ? 'bg-white border-black/[0.12] shadow-refero-sm'
                          : 'bg-black/[0.02] border-black/[0.04] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Custom Checkbox */}
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                            isChecked
                              ? 'bg-[#18181B] text-white'
                              : 'border border-black/30 bg-white hover:border-black'
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4" />}
                        </div>

                        {/* Course Code & Title */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[12px] font-bold text-[#18181B]">
                              {course.code}
                            </span>
                            <span
                              className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-medium ${
                                isChecked
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-black/[0.06] text-[#71717A]'
                              }`}
                            >
                              {isChecked ? 'Crawling' : 'Skipped'}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#71717A] truncate max-w-sm mt-0.5">
                            {course.title.replace(course.code, '').trim() || course.title}
                          </p>
                        </div>
                      </div>

                      {/* Course Link */}
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.04] active:bg-black/[0.08] rounded-xl transition-colors active:scale-95"
                          title="Open course on OUSL Moodle"
                          aria-label={`Open ${course.code} on OUSL Moodle`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty Discovery State */
              <div className="p-8 text-center bg-white/60 rounded-2xl border border-black/[0.04] space-y-2">
                <BookOpen className="w-6 h-6 mx-auto text-[#71717A]" />
                <p className="text-[13.5px] font-semibold text-[#18181B]">
                  No courses discovered yet
                </p>
                <p className="text-[12px] text-[#71717A] max-w-xs mx-auto">
                  Enter your credentials above and click &quot;Discover Enrolled Courses&quot; to fetch your registered courses.
                </p>
              </div>
            )}

            {/* Course Whitelist Actions */}
            <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-black/[0.06] flex-wrap">
              <span className="text-[12px] text-[#71717A]">
                {selectedCourses.length} of {discoveredCourses.length} courses active for crawl
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveCourseSelection}
                  disabled={isSavingCourses}
                  className="px-4 py-2.5 text-[12.5px] font-medium text-[#18181B] bg-white hover:bg-[#F9F9F7] active:bg-[#ede3da] border border-black/[0.08] rounded-xl shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
                >
                  {coursesSavedSuccess ? 'Saved Selection!' : 'Save Selection'}
                </button>

                <button
                  type="button"
                  onClick={onTriggerSync}
                  disabled={isSyncing || selectedCourses.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[12.5px] font-medium text-white bg-[#18181B] hover:bg-[#27272A] rounded-xl shadow-refero-sm disabled:opacity-60 active:scale-[0.98] transition-all min-h-[44px]"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isSyncing ? 'Crawling...' : 'Crawl Selected Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Setup Console (5 Cols on desktop, Collapsible Accordion on mobile) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Mobile Console Toggle Trigger */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsConsoleOpenMobile(!isConsoleOpenMobile)}
              className="w-full p-4 rounded-2xl bg-[#18181B] text-white flex items-center justify-between shadow-refero-sm min-h-[48px] active:scale-[0.99] transition-all select-none"
              aria-expanded={isConsoleOpenMobile}
              aria-label="Toggle Live Console Output"
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-[13.5px] font-semibold">Live Setup Console</span>
                <span className="text-[11px] px-2 py-0.5 bg-white/10 rounded-full text-zinc-300 font-mono">
                  {consoleLogs.length} logs
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                  isConsoleOpenMobile ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>
          </div>

          {/* Console Window (Always visible on desktop, toggleable on mobile) */}
          <div
            className={`bg-[#18181B] text-[#F4F4F0] rounded-2xl shadow-refero-lg overflow-hidden flex flex-col h-full min-h-[420px] ${
              isConsoleOpenMobile ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Terminal Window Header */}
            <div className="px-4 py-3 bg-[#27272A] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1.5 ml-2 font-mono text-[11px] text-[#A1A1AA]">
                  <Terminal className="w-3.5 h-3.5 text-white" />
                  <span className="font-semibold text-white">Setup & Crawl Console</span>
                </div>
              </div>

              {/* Console Action Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyLogs}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="Copy Console Output"
                  aria-label="Copy Console Output"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleClearLogs}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="Clear Console"
                  aria-label="Clear Console"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Console Body Output */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[11.5px] space-y-2.5 leading-relaxed select-text min-h-[250px]">
              {consoleLogs.map((log) => {
                const tagColor =
                  log.tag === 'AUTH'
                    ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
                    : log.tag === 'DISCOVERY'
                    ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                    : log.tag === 'CRAWLER'
                    ? 'text-purple-300 border-purple-500/30 bg-purple-500/10'
                    : log.tag === 'SUCCESS'
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    : log.tag === 'ERROR'
                    ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                    : 'text-zinc-300 border-zinc-600 bg-zinc-800';

                return (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-[#71717A] shrink-0 text-[10.5px]">[{log.time}]</span>
                    {log.tag && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border shrink-0 ${tagColor}`}
                      >
                        {log.tag}
                      </span>
                    )}
                    <span
                      className={`break-words flex-1 ${
                        log.type === 'error'
                          ? 'text-rose-300'
                          : log.type === 'done'
                          ? 'text-emerald-300 font-medium'
                          : 'text-[#E4E4E7]'
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                );
              })}

              {(isDiscovering || isSyncing) && (
                <div className="flex items-center gap-2 text-zinc-400 pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="animate-pulse text-[11px]">
                    {isDiscovering ? 'Connecting & discovering courses...' : 'Crawling course updates...'}
                  </span>
                </div>
              )}

              <div ref={consoleEndRef} />
            </div>

            {/* Console Footer Info */}
            <div className="px-4 py-2.5 bg-[#202023] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#A1A1AA]">
              <span>Ready &bull; Headless Engine</span>
              <span>{consoleLogs.length} events</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
