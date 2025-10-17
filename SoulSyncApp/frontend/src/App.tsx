import ErrorBoundary from './components/ErrorBoundary'
import { useNotificationsSSE } from './utils/notificationsSSE'
import ToastProvider from './components/ToastProvider'
import { useNotificationPoller } from './utils/notificationPoller'
import { setSentryUser } from './sentry';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/dashboard/AdminDashboard';
import AdminDocsAlerting from './pages/admin/AdminDocsAlerting';
import SystemLogs from './pages/admin/SystemLogs';
import CspReports from './pages/admin/CspReports';
import SLOConfig from './pages/admin/SLOConfig';
import VersionBadge from './components/VersionBadge';
import LegalRenderer from './pages/legal/LegalRenderer';
import ImportedDashboards from './pages/dashboard/ImportedDashboards';
import Paywall from './pages/Paywall'
import BillingSuccess from './pages/BillingSuccess'
import BillingCancel from './pages/BillingCancel'
import Cookies from './pages/Cookies'
import AdminDiagnostics from './pages/AdminDiagnostics'
import React
import { useTranslation } from 'react-i18next' from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import PaywallGate from './components/PaywallGate'
import Home from './pages/Home'
import AdminDevices from './pages/AdminDevices'
import Direct from './pages/Direct'
import IntroSlides from './pages/IntroSlides'
import Settings from './pages/Settings'
import About from './pages/About'
import Questionnaire from './pages/Questionnaire'
import Profile from './pages/Profile'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Register from './pages/Register'
import Protected from './components/Protected'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

import CookieConsent from './components/CookieConsent'
import AnalyticsPlaceholder from './components/AnalyticsPlaceholder'
import useCookieConsent from './hooks/useCookieConsent'
import VersionInfo from './components/VersionInfo'

export default function App(){
  useNotificationPoller();
  useNotificationsSSE();{
  const { t, i18n } = useTranslation() {
  const { consent } = useCookieConsent()

  return (
    <ToastProvider>

    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <Routes>
<Route path="/admin/notifications" element={<Notifications/>} />
        <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/questionnaire" element={<Protected><Questionnaire /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/reports" element={<Protected><Reports /></Protected>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
  <Route path="/admin/diagnostics" element={<AdminDiagnostics />} />
  <Route path="/paywall" element={<Paywall />} />
  <Route path="/billing/success" element={<BillingSuccess />} />
  <Route path="/billing/cancel" element={<BillingCancel />} />
  <Route path="/verifier" element={<PaywallGate feature=\"verifier\"><Verifier /></PaywallGate>} />
  <Route path="/direct" element={<Direct />} />
        <Route path="/admin/devices" element={<AdminDevices />} />
        <Route path="/admin/notifications" element={<Notifications/>} />
  <Route path="/admin/notifications/archives" element={<NotificationsArchives/>} />
  <Route path="/admin/webhooks" element={<WebhooksPage/>} />
  <Route path="/admin/logs" element={<LogsPage/>} />
  <Route path="/admin/docs/alerting" element={<AdminDocsAlerting/>} />
  <Route path="/admin/system-logs" element={<SystemLogs/>} />
  <Route path="/admin/slo-config" element={<SLOConfig/>} />
  <Route path="/verify" element={<Verify/>} />
  <Route path="/integrity" element={<Integrity/>} />
  <Route path="/logs" element={<Logs/>} />
  <Route path="/legal" element={<Legal/>} />
  <Route path="/sdk" element={<SDK/>} />
  <Route path="/admin/csp" element={<CspReports/>} />
</Routes>
        <VersionBadge />
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 right-4 bg-white border p-2 rounded shadow">
    <a className="mr-4 underline" href="/legal">Legal</a>
    <a className="underline" href="/dashboards/imported">Imported Dashboards</a>
  </div>
)}
        <CookieConsent />
        {/* Analytics loaded only if consent given */}
        {consent?.analytics && <AnalyticsPlaceholder />}
      </main>
      <footer className="mt-auto text-center text-sm opacity-80 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        © 2025 SoulSync — <a href="/legal/index.html" target="_blank" rel="noreferrer" className="hover:underline">Legal</a> — <a href="mailto:soulsyncfrequency@gmail.com" className="hover:underline">Contact</a>
        <VersionInfo />
        <Link to="/cookies" className="text-sm text-gray-500">Cookies</Link>
</footer>
    </div>
  )
}

import Verify from './pages/Verify';
import Integrity from './pages/Integrity';

import Logs from './pages/Logs';
import Legal from './pages/Legal';
import SDK from './pages/SDK';
