import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiVendorStats, apiVendorMe, clearToken, fmtApiError, authAxios } from '@/lib/auth';
import { toast } from 'sonner';
import {
  LayoutGrid,
  User,
  Images,
  Inbox,
  CalendarDays,
  BarChart3,
  CreditCard,
  Settings as SettingsIcon,
  Eye,
  MessageCircle,
  Users,
  MousePointerClick,
  LogOut,
  ExternalLink,
  Crown,
  Bell,
  CheckSquare,
  Clock,
  Plus,
  Sparkles,
  Heart,
  Wallet,
} from 'lucide-react';

import ProfileTab from './ProfileTab';
import PortfolioTab from './PortfolioTab';
import LeadsTab from './LeadsTab';
import SubscriptionTab from './SubscriptionTab';
import WeddingsTab from './WeddingsTab';
import WeddingWorkspace from './WeddingWorkspace';
import SettingsTab from './SettingsTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'weddings', label: 'Weddings', icon: CalendarDays },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'portfolio', label: 'Portfolio', icon: Images },
  { id: 'leads', label: 'Leads', icon: Inbox },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const StatCard = ({ icon: Icon, label, value, testid }) => (
  <div className="pearl-card p-5" data-testid={testid}>
    <div className="flex items-center gap-2 text-[#988FA6] text-xs uppercase tracking-widest mb-2">
      <Icon className="w-4 h-4" /> {label}
    </div>
    <p className="font-display text-3xl text-[#2D2638]">{value}</p>
  </div>
);

const dateKey = (value) => {
  if (value === undefined || value === null || value === '') return '';
  const date = value instanceof Date ? value : new Date(String(value).slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const daysFromToday = (value) => {
  const due = dateKey(value);
  if (!due) return null;
  const today = dateKey(new Date());
  return Math.round((new Date(`${due}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000);
};

const formatDashboardDate = (value) => {
  const key = dateKey(value);
  if (!key) return 'Date not set';
  return new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const isCompletedWedding = (wedding) =>
  ['completed', 'cancelled', 'canceled'].includes(
    String(wedding?.status || '').toLowerCase()
  );

const VendorDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview');
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [dashboardWeddings, setDashboardWeddings] = useState([]);
  const [dashboardTasks, setDashboardTasks] = useState([]);
  const [dashboardNotifications, setDashboardNotifications] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [busy, setBusy] = useState(true);
  const previousNewLeads = useRef(null);
  const hasProAccess =
    planDetails?.lead_access === true ||
    String(vendor?.plan || '').toLowerCase() === 'pro';

  useEffect(() => {
    const onGoto = (e) => {
      if (e.detail) {
        setTab(e.detail);
      }
    };

    window.addEventListener('wedora:goto-tab', onGoto);

    return () => {
      window.removeEventListener('wedora:goto-tab', onGoto);
    };
  }, []);

  useEffect(() => {
    if (
      !loading &&
      (!user || (user.role !== 'vendor' && user.role !== 'admin'))
    ) {
      navigate('/vendor/auth');
    }
  }, [user, loading, navigate]);

  const load = useCallback(async () => {
    setBusy(true);

    try {
      const [me, st, weddingResponse] = await Promise.all([
        apiVendorMe(),
        apiVendorStats(),
        authAxios.get('/vendor/weddings'),
      ]);

      setVendor(me?.vendor || null);
      setPlanDetails(me?.plan_details || null);
      setStats(st || null);

      const nextWeddings = Array.isArray(weddingResponse?.data?.weddings)
        ? weddingResponse.data.weddings
        : [];
      setDashboardWeddings(nextWeddings);
      setDashboardLoading(true);

      const activeWeddings = nextWeddings.filter((wedding) => !isCompletedWedding(wedding));
      const taskResults = [];
      const notificationResults = [];

      // Limit concurrent requests so larger PRO accounts do not flood the API.
      for (let index = 0; index < activeWeddings.length; index += 8) {
        const batch = activeWeddings.slice(index, index + 8);
        const batchResults = await Promise.all(batch.map(async (wedding) => {
          const weddingId = wedding.id || wedding._id;
          if (!weddingId) return { tasks: [], notifications: [] };

          const [tasksResponse, notificationsResponse] = await Promise.allSettled([
            authAxios.get(`/vendor/weddings/${weddingId}/tasks`),
            authAxios.get(`/vendor/weddings/${weddingId}/notifications`),
          ]);

          const weddingTasks = tasksResponse.status === 'fulfilled' &&
            Array.isArray(tasksResponse.value?.data?.tasks)
            ? tasksResponse.value.data.tasks
            : [];
          const weddingNotifications = notificationsResponse.status === 'fulfilled' &&
            Array.isArray(notificationsResponse.value?.data?.notifications)
            ? notificationsResponse.value.data.notifications
            : [];

          return {
            tasks: weddingTasks.map((task) => ({
              ...task,
              wedding_id: weddingId,
              wedding_name: wedding.wedding_name || wedding.name || 'Wedding',
            })),
            notifications: weddingNotifications.map((notification) => ({
              ...notification,
              wedding_id: weddingId,
              wedding_name: wedding.wedding_name || wedding.name || 'Wedding',
            })),
          };
        }));

        batchResults.forEach((result) => {
          taskResults.push(...result.tasks);
          notificationResults.push(...result.notifications);
        });
      }

      setDashboardTasks(taskResults);
      setDashboardNotifications(notificationResults);
    } catch (e) {
      toast.error(
        fmtApiError(
          e?.response?.data?.detail,
          'Could not load dashboard'
        )
      );
    } finally {
      setDashboardLoading(false);
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user, load]);

  useEffect(() => {
    if (!vendor?.id || !hasProAccess) {
      previousNewLeads.current = null;
      return undefined;
    }

    previousNewLeads.current = stats ? Number(stats.new_leads || 0) : null;

    const checkForNewLeads = async () => {
      try {
        const latestStats = await apiVendorStats();
        const latestCount = Number(latestStats?.new_leads || 0);
        const previousCount = previousNewLeads.current;

        setStats(latestStats || null);
        const leadAlertsEnabled =
          window.localStorage.getItem('wedora_vendor_lead_notifications') !== 'false';

        if (
          leadAlertsEnabled &&
          previousCount !== null &&
          latestCount > previousCount
        ) {
          const difference = latestCount - previousCount;
          toast.success(
            `${difference} new client ${difference === 1 ? 'enquiry' : 'enquiries'} received`
          );
        }
        previousNewLeads.current = latestCount;
      } catch {
        // Keep the dashboard usable if a background notification check fails.
      }
    };

    const intervalId = window.setInterval(checkForNewLeads, 45000);
    return () => window.clearInterval(intervalId);
  }, [vendor?.id, hasProAccess]);

  const today = dateKey(new Date());
  const activeWeddings = dashboardWeddings.filter((wedding) => !isCompletedWedding(wedding));
  const upcomingWeddings = activeWeddings
    .filter((wedding) => {
      const eventDate = dateKey(wedding.wedding_date || wedding.event_date);
      return eventDate && eventDate >= today;
    })
    .sort((a, b) =>
      dateKey(a.wedding_date || a.event_date).localeCompare(
        dateKey(b.wedding_date || b.event_date)
      )
    );
  const nearestWedding = upcomingWeddings[0] || activeWeddings[0] || null;
  const openTasks = dashboardTasks.filter((task) => !task.completed);
  const todaysTasks = openTasks.filter((task) => dateKey(task.due_date) === today);
  const overdueTasks = openTasks.filter((task) => {
    const due = dateKey(task.due_date);
    return due && due < today;
  });
  const upcomingTaskDeadlines = openTasks
    .map((task) => ({ ...task, days_until_due: daysFromToday(task.due_date) }))
    .filter((task) => task.days_until_due !== null && task.days_until_due >= 0 && task.days_until_due <= 14)
    .sort((a, b) => a.days_until_due - b.days_until_due);
  const upcomingReminders = dashboardNotifications
    .map((notification) => ({
      ...notification,
      days_until_due: daysFromToday(notification.reminder_date),
    }))
    .filter((notification) =>
      notification.days_until_due !== null &&
      notification.days_until_due >= 0 &&
      notification.days_until_due <= 14
    )
    .sort((a, b) => a.days_until_due - b.days_until_due);
  const unreadNotificationCount = dashboardNotifications.filter(
    (notification) => !notification.read
  ).length;

  const openWeddingWorkspace = (weddingId = null) => {
    const wedding =
      dashboardWeddings.find((item) => (item.id || item._id) === weddingId) ||
      nearestWedding ||
      activeWeddings[0];
    if (!wedding) {
      setTab('weddings');
      toast.info('Create a wedding first to use this shortcut.');
      return;
    }
    setSelectedWedding(wedding);
  };

  const logout = () => {
    clearToken();
    navigate('/for-vendors');
  };

  if (loading || !user) {
    return null;
  }

  if (busy && !vendor) {
    return (
      <div className="min-h-screen silky-bg pt-40 text-center">
        <div className="thinking-orb mx-auto" />
      </div>
    );
  }

  if (selectedWedding) {
    return (
      <WeddingWorkspace
        wedding={selectedWedding}
        vendor={vendor}
        onBack={() => setSelectedWedding(null)}
      />
    );
  }

  return (
    <div
      className="min-h-screen silky-bg pt-28 pb-16 px-4"
      data-testid="vendor-dashboard"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl overflow-hidden bg-white/70 border border-white/80 flex items-center justify-center">
              {vendor?.logo ? (
                <img
                  src={vendor.logo}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display text-2xl text-[#988FA6]">
                  {vendor?.business_name?.[0] || 'W'}
                </span>
              )}
            </div>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-[#2D2638] flex items-center gap-2">
                {vendor?.business_name || 'Vendor Dashboard'}

                {vendor?.plan === 'pro' && (
                  <Crown
                    className="w-5 h-5 text-[#F58D91]"
                    data-testid="pro-crown"
                  />
                )}
              </h1>

              <p className="text-xs text-[#6B617A] mt-0.5">
                <span
                  className="uppercase tracking-widest"
                  data-testid="current-plan-label"
                >
                  {planDetails?.label || vendor?.plan || 'Free'}
                </span>{' '}
                plan

                {vendor?.slug && (
                  <>
                    {' · '}
                    <a
                      href={`/vendor/${vendor.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-pink-300 inline-flex items-center gap-1"
                    >
                      View public profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasProAccess && (
              <button
                type="button"
                data-testid="dashboard-notifications"
                aria-label={`${stats?.new_leads || 0} new lead notifications`}
                onClick={() => {
                  setTab('leads');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="chip !text-xs inline-flex items-center gap-1.5"
              >
                <span className="relative inline-flex">
                  <Bell className="w-3.5 h-3.5" />
                  {Number(stats?.new_leads || 0) > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-gradient-to-r from-[#F7B7D8] to-[#C9B8FF] text-[#2D2638] text-[9px] font-semibold flex items-center justify-center">
                      {Number(stats.new_leads) > 99 ? '99+' : stats.new_leads}
                    </span>
                  )}
                </span>
                Notifications
              </button>
            )}

            <button
              data-testid="dashboard-logout"
              onClick={logout}
              className="chip !text-xs inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="liquid-glass rounded-full p-1.5 flex overflow-x-auto gap-1 mb-7 max-w-full"
          data-testid="dashboard-tabs"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              data-testid={`tab-${id}`}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                tab === id
                  ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 text-[#2D2638] font-medium shadow-sm'
                  : 'text-[#6B617A] hover:text-[#2D2638]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div data-testid="overview-tab" className="space-y-6">
            <section className="pearl-card p-6 md:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#988FA6]">
                    Vendor Command Center · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl text-[#2D2638] mt-2">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {vendor?.business_name || 'there'}
                  </h2>
                  <p className="text-sm text-[#6B617A] mt-2">
                    {upcomingWeddings.length
                      ? `You have ${upcomingWeddings.length} upcoming ${upcomingWeddings.length === 1 ? 'wedding' : 'weddings'} to keep in view.`
                      : 'Your wedding work and follow-ups will appear here.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWedding(null);
                      setTab('weddings');
                    }}
                    className="glow-btn !py-2.5 !px-4 !text-sm inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> New Wedding
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
              <StatCard
                icon={CheckSquare}
                label="Tasks Due Today"
                value={dashboardLoading ? '…' : todaysTasks.length}
                testid="stat-tasks-today"
              />
              <StatCard
                icon={CalendarDays}
                label="Upcoming Weddings"
                value={upcomingWeddings.length}
                testid="stat-upcoming-weddings"
              />
              <StatCard
                icon={Inbox}
                label="Pending Responses"
                value={hasProAccess ? (stats?.new_leads ?? 0) : 'PRO'}
                testid="stat-pending-responses"
              />
              <StatCard
                icon={Bell}
                label="Unread Reminders"
                value={dashboardLoading ? '…' : unreadNotificationCount}
                testid="stat-unread-reminders"
              />
              <div className="pearl-card p-5" data-testid="stat-payment-deadlines">
                <div className="flex items-center gap-2 text-[#988FA6] text-xs uppercase tracking-widest mb-2">
                  <CreditCard className="w-4 h-4" /> Payment Deadlines
                </div>
                <p className="font-display text-xl text-[#2D2638]">Not tracked yet</p>
                <p className="text-xs text-[#6B617A] mt-1">Payment records have dates, but no due-date field.</p>
              </div>
            </div>

            <section className="pearl-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#988FA6]">Quick Actions</p>
                  <h3 className="font-heading font-semibold text-lg text-[#2D2638] mt-1">Jump back into your work</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['Add Client', Users],
                  ['Add Expense', Wallet],
                  ['Add Task', CheckSquare],
                  ['Open Weddings', CalendarDays],
                ].map(([label, Icon]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      if (label === 'Open Weddings') {
                        setSelectedWedding(null);
                        setTab('weddings');
                      } else {
                        openWeddingWorkspace();
                      }
                    }}
                    className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-left text-sm text-[#4A4257] hover:bg-white hover:border-[#C9B8FF]/70 transition inline-flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4 text-[#8B6AA8]" /> {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#8B8194] mt-3">
                Client, expense, and task shortcuts open your nearest wedding workspace.
              </p>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <section className="pearl-card p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#988FA6]">Today</p>
                    <h3 className="font-heading font-semibold text-lg text-[#2D2638] mt-1">Tasks and follow-ups</h3>
                  </div>
                  <button type="button" onClick={openWeddingWorkspace} className="chip !text-xs">Open workspace</button>
                </div>
                {dashboardLoading ? (
                  <p className="text-sm text-[#8B8194]">Loading your wedding tasks…</p>
                ) : todaysTasks.length || overdueTasks.length ? (
                  <div className="space-y-2">
                    {[...overdueTasks, ...todaysTasks].slice(0, 6).map((task) => (
                      <button
                        type="button"
                        key={task.id}
                        onClick={() => openWeddingWorkspace(task.wedding_id)}
                        className="w-full rounded-xl border border-[#eadff2] bg-white/75 px-4 py-3 text-left flex items-start gap-3 hover:bg-white"
                      >
                        <CheckSquare className={`w-4 h-4 mt-0.5 ${task.due_date < today ? 'text-red-400' : 'text-[#8B6AA8]'}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-[#3F3748]">{task.title}</span>
                          <span className="block text-xs text-[#8B8194] mt-1">{task.wedding_name} · {task.due_date < today ? 'Overdue' : 'Due today'}</span>
                        </span>
                      </button>
                    ))}
                    {overdueTasks.length + todaysTasks.length > 6 && (
                      <p className="text-xs text-[#8B8194]">And {overdueTasks.length + todaysTasks.length - 6} more tasks.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B617A]">No saved tasks due today. Add task due dates in a wedding workspace to see them here.</p>
                )}
              </section>

              <section className="pearl-card p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#988FA6]">Wedding Countdown</p>
                    <h3 className="font-heading font-semibold text-lg text-[#2D2638] mt-1">Coming up next</h3>
                  </div>
                  <Heart className="w-5 h-5 text-[#F58D91]" />
                </div>
                {nearestWedding && dateKey(nearestWedding.wedding_date || nearestWedding.event_date) ? (
                  <div className="rounded-2xl bg-gradient-to-r from-[#F7B7D8]/20 to-[#C9B8FF]/25 border border-white/80 p-5">
                    <p className="text-sm text-[#6B617A]">{nearestWedding.wedding_name || nearestWedding.name || 'Wedding'}</p>
                    <p className="font-display text-3xl text-[#2D2638] mt-1">
                      {daysFromToday(nearestWedding.wedding_date || nearestWedding.event_date) === 0
                        ? 'Today'
                        : `${daysFromToday(nearestWedding.wedding_date || nearestWedding.event_date)} days to go`}
                    </p>
                    <p className="text-sm text-[#6B617A] mt-1">
                      {formatDashboardDate(nearestWedding.wedding_date || nearestWedding.event_date)}
                      {nearestWedding.city ? ` · ${nearestWedding.city}` : ''}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[#6B617A]">Add a wedding date to start a countdown.</p>
                )}
                {upcomingWeddings.length > 1 && (
                  <div className="mt-3 space-y-2">
                    {upcomingWeddings.slice(1, 4).map((wedding) => (
                      <div key={wedding.id || wedding._id} className="flex items-center justify-between text-sm text-[#6B617A]">
                        <span>{wedding.wedding_name || wedding.name || 'Wedding'}</span>
                        <span>{formatDashboardDate(wedding.wedding_date || wedding.event_date)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="pearl-card p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#988FA6]">Next 14 Days</p>
                    <h3 className="font-heading font-semibold text-lg text-[#2D2638] mt-1">Upcoming deadlines</h3>
                  </div>
                  <Clock className="w-5 h-5 text-[#8B6AA8]" />
                </div>
                {dashboardLoading ? (
                  <p className="text-sm text-[#8B8194]">Loading reminders…</p>
                ) : upcomingTaskDeadlines.length || upcomingReminders.length ? (
                  <div className="space-y-2">
                    {[
                      ...upcomingTaskDeadlines.map((item) => ({ ...item, kind: 'Task' })),
                      ...upcomingReminders.map((item) => ({ ...item, kind: item.notification_type || 'Reminder', due_date: item.reminder_date })),
                    ]
                      .sort((a, b) => String(a.due_date || '').localeCompare(String(b.due_date || '')))
                      .slice(0, 6)
                      .map((item, index) => (
                        <div key={`${item.kind}-${item.id || index}`} className="rounded-xl border border-[#eadff2] bg-white/75 px-4 py-3 flex items-center justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block text-sm text-[#3F3748] truncate">{item.title}</span>
                            <span className="block text-xs text-[#8B8194] mt-1">{item.wedding_name} · {item.kind}</span>
                          </span>
                          <span className="shrink-0 text-xs text-[#6B617A]">{formatDashboardDate(item.due_date)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B617A]">No task deadlines or reminders in the next 14 days.</p>
                )}
              </section>

              <section className="pearl-card p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#988FA6]">Notifications</p>
                    <h3 className="font-heading font-semibold text-lg text-[#2D2638] mt-1">Unread wedding reminders</h3>
                  </div>
                  <Bell className="w-5 h-5 text-[#8B6AA8]" />
                </div>
                {unreadNotificationCount > 0 ? (
                  <div className="space-y-2">
                    {dashboardNotifications.filter((item) => !item.read).slice(0, 4).map((item) => (
                      <div key={item.id} className="rounded-xl border border-[#eadff2] bg-white/75 px-4 py-3">
                        <p className="text-sm text-[#3F3748]">{item.title}</p>
                        <p className="text-xs text-[#8B8194] mt-1">{item.wedding_name}{item.reminder_date ? ` · ${formatDashboardDate(item.reminder_date)}` : ''}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B617A]">No unread wedding reminders.</p>
                )}
              </section>
            </div>

            <section className="pearl-card p-5 md:p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B6AA8]" />
                <h3 className="font-heading font-semibold text-[#2D2638]">Your business pulse</h3>
              </div>
              <p className="text-sm text-[#6B617A] mt-2">
                {overdueTasks.length
                  ? `${overdueTasks.length} task${overdueTasks.length === 1 ? ' is' : 's are'} overdue. Review the task list in the relevant wedding workspace.`
                  : hasProAccess && Number(stats?.new_leads || 0) > 0
                  ? `You have ${stats.new_leads} new client ${Number(stats.new_leads) === 1 ? 'enquiry' : 'enquiries'} waiting for a response.`
                  : nearestWedding
                  ? `Your next wedding is ${daysFromToday(nearestWedding.wedding_date || nearestWedding.event_date) === 0 ? 'today' : `in ${daysFromToday(nearestWedding.wedding_date || nearestWedding.event_date)} days`}. Check its tasks and reminders before the event.`
                  : 'Add a wedding to see its schedule, tasks, and reminders here.'}
              </p>
            </section>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard icon={Eye} label="Profile Views" value={stats?.profile_views ?? 0} testid="stat-profile-views" />
              <StatCard icon={Inbox} label="Leads" value={hasProAccess ? (stats?.leads ?? 0) : 'PRO'} testid="stat-leads" />
              <StatCard icon={MessageCircle} label="WhatsApp Clicks" value={stats?.whatsapp_clicks ?? 0} testid="stat-whatsapp-clicks" />
              <StatCard icon={Users} label="Contact Requests" value={stats?.contact_requests ?? 0} testid="stat-contact-requests" />
              <StatCard icon={MousePointerClick} label="Portfolio Views" value={stats?.portfolio_views ?? 0} testid="stat-portfolio-views" />
            </div>

            <div className="pearl-card p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="font-heading font-semibold text-[#2D2638]">Profile Completion</p>
                <p className="text-sm text-[#6B617A]" data-testid="profile-completion">{stats?.profile_completion ?? 0}%</p>
              </div>
              <div className="h-3 rounded-full bg-white/70 border border-white/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#C9B8FF] via-[#F7B7D8] to-[#A9E8FF] transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, Number(stats?.profile_completion) || 0))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Weddings */}
        {tab === 'weddings' && vendor && (
          <WeddingsTab
            vendor={vendor}
            onOpenWedding={(wedding) => setSelectedWedding(wedding)}
          />
        )}

        {/* Profile */}
        {tab === 'profile' && vendor && (
          <ProfileTab
            vendor={vendor}
            planDetails={planDetails}
            onSaved={load}
          />
        )}

        {/* Portfolio */}
        {tab === 'portfolio' && vendor && (
          <PortfolioTab
            vendor={vendor}
            planDetails={planDetails}
            onSaved={load}
          />
        )}

        {/* Leads */}
        {tab === 'leads' && vendor && (
          <LeadsTab vendor={vendor} />
        )}

        {/* Analytics */}
        {tab === 'analytics' && stats && (
          <div
            className="pearl-card p-6 md:p-8"
            data-testid="analytics-tab"
          >
            <h3 className="font-heading font-semibold text-lg text-[#2D2638] mb-5">
              Analytics
            </h3>

            {hasProAccess ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  icon={Eye}
                  label="Views → Leads"
                  value={
                    stats.profile_views
                      ? `${Math.round(
                          (100 * stats.leads) / stats.profile_views
                        )}%`
                      : '—'
                  }
                  testid="stat-conversion"
                />

                <StatCard
                  icon={Inbox}
                  label="New Leads"
                  value={stats.new_leads ?? 0}
                  testid="stat-new-leads"
                />

                <StatCard
                  icon={MessageCircle}
                  label="WhatsApp Rate"
                  value={
                    stats.profile_views
                      ? `${Math.round(
                          (100 * stats.whatsapp_clicks) /
                            stats.profile_views
                        )}%`
                      : '—'
                  }
                  testid="stat-whatsapp-rate"
                />
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#C9B8FF]/60 bg-white/50 p-10 text-center">
                <p className="text-[#6B617A] mb-4">
                  Analytics are available to PRO vendors after payment is verified.
                </p>

                <button
                  data-testid="analytics-upgrade-btn"
                  onClick={() => setTab('subscription')}
                  className="glow-btn !py-2 !px-6 !text-sm"
                >
                  View PRO Plan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Subscription */}
        {tab === 'subscription' && vendor && (
          <SubscriptionTab
            vendor={vendor}
            planDetails={planDetails}
            onSaved={load}
          />
        )}

        {/* Settings */}
        {tab === 'settings' && vendor && (
          <SettingsTab
            vendor={vendor}
            user={user}
            onLogout={logout}
          />
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
