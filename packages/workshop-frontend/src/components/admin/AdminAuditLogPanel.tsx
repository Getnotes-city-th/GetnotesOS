import { useEffect, useMemo, useState } from 'react'
import { RpcStub } from 'capnweb'
import { AdminApi, AdminAuditEvent } from '@gadgets/workshop-shared/api'
import { Button, Input, useKumoToastManager } from '@cloudflare/kumo'
import { ArrowsClockwise, ClockCounterClockwise, MagnifyingGlass } from '@phosphor-icons/react'
import { useI18n } from '../../i18n/I18nContext'

const ACTION_LABELS_TH: Record<string, string> = {
  'settings.signups': 'การเปิดรับสมาชิก',
  'settings.siteName': 'ชื่อเว็บไซต์',
  'settings.logo': 'โลโก้เว็บไซต์',
  'settings.instructions': 'คำสั่ง AI Agent',
  'settings.announcement': 'ประกาศแถบนำทาง',
  'settings.banner': 'แถบประกาศ',
  'settings.accentColor': 'สีหลัก',
  'connector.resource': 'ทรัพยากรตัวเชื่อมต่อ',
  'connector.mode': 'โหมดตัวเชื่อมต่อ',
  'blueprint.featured': 'พิมพ์เขียวแนะนำ',
  'format.promote': 'เพิ่มรูปแบบผลงาน',
  'format.remove': 'นำรูปแบบผลงานออก',
  'format.update': 'แก้ไขรูปแบบผลงาน',
  'format.reorder': 'จัดลำดับรูปแบบผลงาน',
  'user.role': 'สิทธิ์ผู้ใช้',
  'user.suspension': 'สถานะบัญชี',
  'user.passwordReset': 'รีเซ็ตรหัสผ่าน',
  'user.delete': 'ลบบัญชีผู้ใช้',
}

const ACTION_LABELS_EN: Record<string, string> = {
  'settings.signups': 'Sign-up access',
  'settings.siteName': 'Site name',
  'settings.logo': 'Site logo',
  'settings.instructions': 'Agent instructions',
  'settings.announcement': 'Top-bar announcement',
  'settings.banner': 'Announcement banner',
  'settings.accentColor': 'Accent color',
  'connector.resource': 'Connector resource',
  'connector.mode': 'Connector mode',
  'blueprint.featured': 'Featured blueprint',
  'format.promote': 'Promoted format',
  'format.remove': 'Removed format',
  'format.update': 'Updated format',
  'format.reorder': 'Reordered formats',
  'user.role': 'User role',
  'user.suspension': 'Account status',
  'user.passwordReset': 'Password reset',
  'user.delete': 'Deleted user',
}

export function auditActionLabel(action: string, language: string): string {
  return (language === 'th' ? ACTION_LABELS_TH : ACTION_LABELS_EN)[action] ?? action
}

export function auditDetailLabel(detail: string | undefined, language: string): string {
  if (!detail) return ''
  if (language !== 'th') return detail
  return ({
    enabled: 'เปิดใช้งาน',
    disabled: 'ปิดใช้งาน',
    reset: 'คืนค่าเริ่มต้น',
    cleared: 'ล้างข้อมูล',
    admin: 'แอดมิน',
    support: 'ซัพพอร์ต',
    owner: 'เจ้าของระบบ',
    user: 'ผู้ใช้ทั่วไป',
    suspended: 'ระงับบัญชี',
    active: 'ใช้งานปกติ',
    optional: 'เลือกเอง',
    'formats': 'รูปแบบ',
  } as Record<string, string>)[detail] ?? detail
}

export default function AdminAuditLogPanel({ admin }: { admin: RpcStub<AdminApi> }) {
  const { language } = useI18n()
  const toasts = useKumoToastManager()
  const [events, setEvents] = useState<AdminAuditEvent[]>([])
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const loadEvents = async () => {
    try {
      setLoading(true)
      setEvents(await admin.listAuditLog(200))
    } catch (err) {
      toasts.add({
        title: language === 'th' ? 'ไม่สามารถโหลดประวัติการทำรายการได้' : err instanceof Error ? err.message : 'Failed to load audit log',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEvents() }, [admin])

  const actionOptions = useMemo(
    () => [...new Set(events.map((event) => event.action))].sort(),
    [events],
  )

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return events.filter((event) => {
      if (actionFilter !== 'all' && event.action !== actionFilter) return false
      if (!query) return true
      return [event.actor, event.action, event.target, event.detail]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    })
  }, [events, search, actionFilter])

  const formatDate = (value: string) => new Date(value).toLocaleString(language === 'th' ? 'th-TH' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-kumo-strong">
            {language === 'th' ? 'ประวัติการทำรายการ' : 'Audit log'}
          </h2>
          <p className="text-sm text-kumo-subtle mt-1">
            {language === 'th' ? 'ตรวจสอบการเปลี่ยนแปลงสำคัญของผู้ดูแลระบบย้อนหลัง' : 'Review important deployment changes made by administrators.'}
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={ArrowsClockwise} onClick={loadEvents} disabled={loading}>
          {language === 'th' ? 'รีเฟรช' : 'Refresh'}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={language === 'th' ? 'ค้นหาผู้ดำเนินการหรือรายการ…' : 'Search actor or action…'}
            className="pl-9 w-full"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className="h-9 rounded-md border border-kumo-line bg-kumo-elevated px-3 text-sm text-kumo-default"
          aria-label={language === 'th' ? 'กรองประเภทการทำรายการ' : 'Filter action type'}
        >
          <option value="all">{language === 'th' ? 'ทุกประเภท' : 'All actions'}</option>
          {actionOptions.map((action) => <option key={action} value={action}>{auditActionLabel(action, language)}</option>)}
        </select>
      </div>

      <div className="bg-kumo-elevated border border-kumo-line rounded-xl overflow-hidden shadow-xs">
        {loading && events.length === 0 ? (
          <div className="px-5 py-14 text-center text-kumo-subtle">
            <ArrowsClockwise size={24} className="animate-spin mx-auto mb-2 text-kumo-brand" />
            {language === 'th' ? 'กำลังโหลดประวัติ…' : 'Loading audit log…'}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="px-5 py-14 text-center text-kumo-subtle">
            <ClockCounterClockwise size={30} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium text-kumo-default">{language === 'th' ? 'ยังไม่มีรายการ' : 'No audit events'}</p>
            <p className="text-xs mt-1">{language === 'th' ? 'การเปลี่ยนแปลงจากผู้ดูแลจะปรากฏที่นี่' : 'Administrator changes will appear here.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-kumo-line">
            {filteredEvents.map((event) => (
              <div key={event.id} className="px-5 py-4 flex items-start gap-3 hover:bg-kumo-tint/30 transition-colors">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-kumo-tint text-kumo-brand flex items-center justify-center shrink-0">
                  <ClockCounterClockwise size={17} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-kumo-strong">{auditActionLabel(event.action, language)}</span>
                    {event.target && <span className="text-sm text-kumo-default truncate">· {event.target}</span>}
                    {event.detail && <span className="text-xs rounded-full bg-kumo-tint px-2 py-0.5 text-kumo-subtle">{auditDetailLabel(event.detail, language)}</span>}
                  </div>
                  <div className="text-xs text-kumo-subtle mt-1">
                    {language === 'th' ? 'โดย' : 'by'} <span className="font-medium text-kumo-default">@{event.actor}</span>
                    <span className="mx-1.5">·</span>{formatDate(event.occurredAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
