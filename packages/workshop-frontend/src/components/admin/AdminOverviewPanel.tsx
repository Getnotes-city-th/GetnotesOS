import { useEffect, useMemo, useState } from 'react'
import { RpcStub } from 'capnweb'
import { AdminApi, AdminAuditEvent, AdminSettingsView, AdminUserSummary } from '@gadgets/workshop-shared/api'
import { Button, useKumoToastManager } from '@cloudflare/kumo'
import { ArrowsClockwise, CheckCircle, ClockCounterClockwise, PlugsConnected, ShieldCheck, Users, WarningCircle } from '@phosphor-icons/react'
import { useI18n } from '../../i18n/I18nContext'
import { auditActionLabel, auditDetailLabel } from './AdminAuditLogPanel'

export default function AdminOverviewPanel({ admin }: { admin: RpcStub<AdminApi> }) {
  const { language } = useI18n()
  const toasts = useKumoToastManager()
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [settings, setSettings] = useState<AdminSettingsView | null>(null)
  const [events, setEvents] = useState<AdminAuditEvent[]>([])
  const [loading, setLoading] = useState(true)

  const loadOverview = async () => {
    try {
      setLoading(true)
      const [nextUsers, nextSettings, nextEvents] = await Promise.all([
        admin.listUsers(),
        admin.getSettings(),
        admin.listAuditLog(8),
      ])
      setUsers(nextUsers)
      setSettings(nextSettings)
      setEvents(nextEvents)
    } catch (err) {
      toasts.add({
        title: language === 'th' ? 'ไม่สามารถโหลดภาพรวมระบบได้' : err instanceof Error ? err.message : 'Failed to load dashboard',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOverview() }, [admin])

  const metrics = useMemo(() => {
    const enabledConnectors = settings?.resourceVendors.filter((vendor) => vendor.autoProvisions
      ? vendor.ambientMode !== 'disabled'
      : vendor.enabled).length ?? 0
    const enabledFormats = settings?.formats.filter((format) => format.enabled && !format.missing).length ?? 0
    return [
      { label: language === 'th' ? 'ผู้ใช้ทั้งหมด' : 'Total users', value: users.length, icon: Users, tone: 'brand' },
      { label: language === 'th' ? 'ผู้ดูแลระบบ' : 'Administrators', value: users.filter((user) => user.isAdmin).length, icon: ShieldCheck, tone: 'warning' },
      { label: language === 'th' ? 'บัญชีถูกระงับ' : 'Suspended', value: users.filter((user) => user.suspended).length, icon: WarningCircle, tone: 'danger' },
      { label: language === 'th' ? 'ตัวเชื่อมต่อเปิดใช้' : 'Active connectors', value: enabledConnectors, icon: PlugsConnected, tone: 'success' },
      { label: language === 'th' ? 'รูปแบบผลงาน' : 'Active formats', value: enabledFormats, icon: CheckCircle, tone: 'brand' },
    ]
  }, [language, settings, users])

  const toneClasses: Record<string, string> = {
    brand: 'bg-kumo-tint text-kumo-brand',
    warning: 'bg-kumo-warning-tint text-kumo-warning',
    danger: 'bg-kumo-danger-tint text-kumo-danger',
    success: 'bg-kumo-success-tint text-kumo-success',
  }

  const formatDate = (value: string) => new Date(value).toLocaleString(language === 'th' ? 'th-TH' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-kumo-strong">{language === 'th' ? 'ภาพรวมระบบ' : 'System overview'}</h2>
          <p className="text-sm text-kumo-subtle mt-1">{language === 'th' ? 'สรุปสถานะสำคัญของ GetnotesOS ในจุดเดียว' : 'A quick view of the deployment health and activity.'}</p>
        </div>
        <Button variant="secondary" size="sm" icon={ArrowsClockwise} onClick={loadOverview} disabled={loading}>
          {language === 'th' ? 'รีเฟรช' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="bg-kumo-elevated border border-kumo-line rounded-xl p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneClasses[metric.tone]}`}><Icon size={19} weight="bold" /></div>
              <p className="text-xs text-kumo-subtle mt-3">{metric.label}</p>
              <p className="text-2xl font-bold text-kumo-strong mt-0.5">{loading && !settings ? '—' : metric.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-5">
          <h3 className="font-semibold text-kumo-strong">{language === 'th' ? 'สถานะการเข้าถึง' : 'Access status'}</h3>
          <div className="mt-4 flex items-center gap-3">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center ${!settings ? 'bg-kumo-tint text-kumo-subtle' : settings.signupsEnabled ? 'bg-kumo-success-tint text-kumo-success' : 'bg-kumo-warning-tint text-kumo-warning'}`}>
              {!settings ? <ArrowsClockwise size={19} className="animate-spin" /> : settings.signupsEnabled ? <CheckCircle size={19} weight="fill" /> : <WarningCircle size={19} weight="fill" />}
            </span>
            <div>
              <p className="text-sm font-medium text-kumo-default">{!settings ? (language === 'th' ? 'กำลังโหลดสถานะ…' : 'Loading status…') : settings.signupsEnabled ? (language === 'th' ? 'เปิดรับสมาชิกใหม่' : 'New sign-ups enabled') : (language === 'th' ? 'ปิดรับสมาชิกใหม่' : 'New sign-ups disabled')}</p>
              <p className="text-xs text-kumo-subtle mt-0.5">{language === 'th' ? 'ผู้ใช้เดิมยังเข้าสู่ระบบได้ตามปกติ' : 'Existing users can still sign in.'}</p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-kumo-line text-xs text-kumo-subtle">
            {language === 'th' ? 'แบรนด์' : 'Brand'}: <span className="text-kumo-default font-medium">{settings?.siteName || 'GetnotesOS'}</span>
          </div>
        </div>

        <div className="bg-kumo-elevated border border-kumo-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-kumo-line flex items-center gap-2">
            <ClockCounterClockwise size={18} className="text-kumo-brand" weight="bold" />
            <h3 className="font-semibold text-kumo-strong">{language === 'th' ? 'กิจกรรมล่าสุด' : 'Recent activity'}</h3>
          </div>
          {events.length === 0 ? (
            <p className="px-5 py-8 text-sm text-kumo-subtle text-center">{language === 'th' ? 'ยังไม่มีประวัติการทำรายการ' : 'No activity yet.'}</p>
          ) : (
            <div className="divide-y divide-kumo-line">
              {events.slice(0, 6).map((event) => (
                <div key={event.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-kumo-default truncate">
                      <span className="font-medium">{auditActionLabel(event.action, language)}</span>
                      {event.target && <span className="text-kumo-subtle"> · {event.target}</span>}
                    </p>
                    <p className="text-xs text-kumo-subtle mt-0.5">@{event.actor}{event.detail ? ` · ${auditDetailLabel(event.detail, language)}` : ''}</p>
                  </div>
                  <time className="text-[11px] text-kumo-subtle whitespace-nowrap">{formatDate(event.occurredAt)}</time>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
