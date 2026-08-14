import { useI18n } from "../i18n/I18nContext"
import { logRpcFailure } from "../rpcErrors"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { useKumoToastManager } from "@cloudflare/kumo"
import {
  MagnifyingGlass,
  ArrowsClockwise,
  Plus,
  CaretRight,
  Hexagon,
  ShieldCheck,
  Plugs,
} from "@phosphor-icons/react"
import ViewToggle from "../components/ViewToggle"
import { useAuthenticatedApi } from "../AuthContext"
import { refreshGatekeeperApps } from "../useGatekeeperApps"
import { EmptyState } from "../components/EmptyState"
import ConnectConnectorModal from "../components/ConnectConnectorModal"
import {
  AccountDescription,
  SupportedResource,
  VendorDescription,
} from "@gadgets/workshop-shared/gatekeeper"
import { GatekeeperVendorInfo } from "@gadgets/workshop-shared/api"
import { useDocumentTitle } from "../useDocumentTitle"
import { useSiteName } from "../ServerConfigContext"
import { AccountsSubscriberAdapter } from "../accountsSubscriber"

export const Route = createFileRoute("/gatekeepers")({
  component: ConnectorsPage,
})

const VENDOR_NAME_TH: Record<string, string> = {
  "Email": "Email (อีเมล)",
  "Email Receiver": "ตัวรับอีเมล (Email Receiver)",
  "Scheduled Tasks": "งานตั้งเวลาอัตโนมัติ (Scheduled Tasks)",
  "Context": "คลังบริบทและทักษะ (Context)",
  "MCP Server": "เซิร์ฟเวอร์ MCP (MCP Server)",
  "Cloudflare MCP Server Portals": "พอร์ทัลเซิร์ฟเวอร์ Cloudflare MCP",
  "LINE": "LINE Official Account",
  "Facebook": "Facebook Page (แฟนเพจ)",
}

export function translateVendorName(name: string | undefined, lang: string): string {
  if (!name || lang !== "th") return name ?? ""
  return VENDOR_NAME_TH[name] ?? name
}

const VENDOR_TAGLINE_TH: Record<string, string> = {
  "Sign in with Cloudflare": "เข้าสู่ระบบด้วย Cloudflare เพื่อจัดการทรัพยากรบนคลาวด์",
  "Read and write your Confluence pages and spaces": "อ่านและแก้ไข Spaces, หน้าเอกสาร และบล็อกโพสต์บน Confluence",
  "Author and consult shared context collections": "สร้างและเข้าถึงคลังเอกสารบริบทและทักษะความรู้สำหรับ AI",
  "Trigger gadgets from incoming email": "ส่งและรับอีเมล และสั่งงานชิ้นงานอัตโนมัติจากอีเมลขาเข้า",
  "Manage Facebook Pages, post content, and reply in Messenger": "จัดการแฟนเพจ Facebook โพสต์คอนเทนต์ และตอบแชท Messenger",
  "Triage issues, review PRs, and manage repos": "จัดการ Issues, รีวิว Pull Requests และจัดการคลังโค้ดบน GitHub",
  "Draft replies, edit docs, read sheets, manage calendars, and analyze data": "ร่างข้อความ, แก้ไข Docs, อ่านข้อมูล Sheets, จัดการ Calendar และวิเคราะห์ข้อมูล BigQuery",
  "Control your smart home, read sensor state, and edit Lovelace dashboards.": "ควบคุมอุปกรณ์สมาร์ทโฮม ตรวจสอบสถานะเซนเซอร์ และแก้ไขแดชบอร์ด",
  "Send push messages, flex messages, and broadcasts": "ส่งข้อความ Push, Flex Messages และบรอดแคสต์หาผู้ติดตามทาง LINE",
  "Triage, create, and update issues": "คัดกรอง สร้าง และอัปเดตสถานะ Issues บน Linear",
  "Connect any Model Context Protocol server": "เชื่อมต่อ Endpoint ของเซิร์ฟเวอร์ MCP ที่คุณระบุ",
  "Read and write your Notion pages and databases": "อ่านและแก้ไขหน้าเอกสารและฐานข้อมูลใน Notion",
  "Run workspace tasks on a schedule": "ตั้งเวลาทำงานอัตโนมัติและจัดการ Cron workflow ในพื้นที่ทำงาน",
  "Read channels, DMs, and threads": "อ่านแชนเนล ข้อความส่วนตัว (DM) และเธรดการสนทนาใน Slack",
  "Manage playlists, your library, and playback": "จัดการเพลย์ลิสต์ คลังเพลง และควบคุมการเล่นเพลงบน Spotify",
  "Query Postgres, inspect schema, and manage projects": "คิวรีฐานข้อมูล Postgres ตรวจสอบ Schema และจัดการโปรเจกต์ Supabase",
  "Search and enrich B2B company & contact intelligence": "ค้นหาและเสริมข้อมูลประวัติธุรกิจ B2B และรายชื่อผู้ติดต่อบน ZoomInfo",
  "Temporarily unavailable": "ไม่พร้อมใช้งานชั่วคราว",
}

export function translateVendorTagline(tagline: string | undefined, lang: string): string {
  if (!tagline || lang !== "th") return tagline ?? ""
  if (VENDOR_TAGLINE_TH[tagline]) return VENDOR_TAGLINE_TH[tagline]
  for (const [k, v] of Object.entries(VENDOR_TAGLINE_TH)) {
    if (tagline.startsWith(k) || k.startsWith(tagline.slice(0, 20))) return v
  }
  return tagline
}

interface AccountEntry {
  id: number
  accountDescription: AccountDescription
  vendorId: string
  vendorDescription: VendorDescription
  supportedResources: SupportedResource[]
  credentialsValid: boolean
}

interface VendorEntry {
  id: string
  description: VendorDescription
  supportedResources: SupportedResource[]
}

function VendorIconTile({
  logoUrl,
  color,
  fallback,
  size = 28,
  className = "h-12 w-12 rounded-2xl",
}: {
  logoUrl?: string
  color?: string
  fallback: string
  size?: number
  className?: string
}) {
  return (
    <div
      className={`relative grid shrink-0 place-items-center ${className}`}
      style={{ backgroundColor: color ?? "var(--color-kumo-tint)" }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" className="object-contain" style={{ width: size, height: size }} />
      ) : (
        <span className="text-[15px] font-semibold text-kumo-strong">
          {fallback[0]?.toUpperCase() ?? "?"}
        </span>
      )}
    </div>
  )
}

interface ConnectorCardProps {
  logoUrl?: string
  color?: string
  fallback: string
  name: string
  badge?: { label: string; tone: "new" | "popular" }
  metaLine?: React.ReactNode
  tagline?: string
  state: "connected" | "available" | "expired"
  onClick: () => void
  onReconnect?: () => void
  reconnectBusy?: boolean
  view?: "grid" | "list"
}

function ConnectorCard({
  logoUrl,
  color,
  fallback,
  name,
  badge,
  metaLine,
  tagline,
  state,
  onClick,
  onReconnect,
  reconnectBusy = false,
  view = "grid",
}: ConnectorCardProps) {
  const { language } = useI18n()
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onClick()
    }
  }

  const statusDot =
    state === "connected" ? (
      <span
        className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-kumo-success ring-2 ring-kumo-base"
        aria-hidden
      />
    ) : state === "expired" ? (
      <span
        className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-kumo-danger ring-2 ring-kumo-base"
        aria-hidden
      />
    ) : null

  const badgeEl = badge ? (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-3 font-semibold uppercase tracking-[0.4px] ${
        badge.tone === "new"
          ? "bg-[rgba(255,72,1,0.10)] text-kumo-brand"
          : "bg-kumo-tint text-kumo-subtle"
      }`}
    >
      {badge.label}
    </span>
  ) : null

  const trailing =
    state === "expired" && onReconnect ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (!reconnectBusy) onReconnect()
        }}
        disabled={reconnectBusy}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-kumo-line bg-kumo-base px-3 text-[12px] leading-4 font-medium tracking-[-0.2px] text-kumo-default transition-[background-color,border-color,opacity,transform] duration-150 ease-out hover:border-kumo-fill hover:bg-kumo-tint active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        <ArrowsClockwise size={12} weight="bold" />
        {reconnectBusy ? (language === "th" ? "กำลังเปิด..." : "Opening...") : (language === "th" ? "เชื่อมต่อใหม่" : "Reconnect")}
      </button>
    ) : (
      <div className="grid h-7 w-7 place-items-center text-kumo-inactive transition-colors group-hover:text-kumo-default">
        {state === "available" ? (
          <Plus size={16} weight="bold" />
        ) : (
          <CaretRight size={14} weight="bold" />
        )}
      </div>
    )

  if (view === "list") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 ease-out hover:bg-kumo-tint"
      >
        <div className="relative shrink-0">
          <VendorIconTile
            logoUrl={logoUrl}
            color={color}
            fallback={fallback}
            size={20}
            className="h-9 w-9 rounded-lg"
          />
          {statusDot}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium tracking-[-0.25px] text-kumo-default">
              {translateVendorName(name, language)}
            </span>
            {badgeEl}
          </div>
          {(metaLine || tagline) && (
            <div className="mt-0.5 truncate text-[12px] leading-4 font-normal tracking-[-0.2px] text-kumo-subtle">
              {metaLine ?? translateVendorTagline(tagline, language)}
            </div>
          )}
        </div>
        <div className="shrink-0 self-center">{trailing}</div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="themed-card-hover-shadow group grid w-full cursor-pointer grid-cols-[48px_1fr_auto] items-center gap-4 rounded-2xl border border-kumo-line bg-kumo-base px-5 py-5 text-left transition-[border-color,transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:border-kumo-fill active:scale-[0.995]"
    >
      <div className="self-start">
        <div className="relative">
          <VendorIconTile logoUrl={logoUrl} color={color} fallback={fallback} />
          {statusDot}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] leading-5 font-medium tracking-[-0.25px] text-kumo-default">
            {translateVendorName(name, language)}
          </span>
          {badgeEl}
        </div>
        {metaLine && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] leading-4 font-normal tracking-[-0.2px] text-kumo-subtle">
            {metaLine}
          </div>
        )}
        {tagline && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-[18px] font-normal tracking-[-0.25px] text-kumo-subtle">
            {translateVendorTagline(tagline, language)}
          </p>
        )}
      </div>

      <div className="self-center">{trailing}</div>
    </div>
  )
}

function SectionEyebrow({ label, count }: { label: string; count?: number }) {
  return (
    <div className="mb-3.5 flex items-center gap-3 px-1">
      <h2 className="m-0 text-[11px] leading-4 font-semibold uppercase tracking-[0.9px] text-kumo-subtle">
        {label}
      </h2>
      <div className="h-px flex-1 bg-kumo-line" />
      {typeof count === "number" && (
        <span className="text-[11px] leading-4 font-semibold tracking-[-0.1px] text-kumo-inactive">
          {count}
        </span>
      )}
    </div>
  )
}

function ConnectorsHeroDiagram({
  accounts,
  vendors,
  siteName,
}: {
  accounts: AccountEntry[]
  vendors: VendorEntry[]
  siteName: string
}) {
  const { language } = useI18n()
  const [hoveredSource, setHoveredSource] = useState<number | null>(null)
  const seen = new Set<string>()
  const nodes = [
    ...accounts.map((account) => ({
      key: `account-${account.id}`,
      vendorId: account.vendorId,
      logoUrl: account.vendorDescription.logo?.url,
      color: account.vendorDescription.color,
      fallback: account.vendorDescription.displayName,
    })),
    ...vendors.map((vendor) => ({
      key: `vendor-${vendor.id}`,
      vendorId: vendor.id,
      logoUrl: vendor.description.logo?.url,
      color: vendor.description.color,
      fallback: vendor.description.displayName,
    })),
  ].filter((node) => {
    if (seen.has(node.vendorId)) return false
    seen.add(node.vendorId)
    return true
  }).slice(0, 3)

  const sourceNodes = [
    { className: "left-1 top-3", x: 4, y: 12 },
    { className: "left-10 top-[62px]", x: 40, y: 62 },
    { className: "left-1 bottom-3", x: 4, y: 120 },
  ]
  const nodeSize = 44
  const gatekeeper = { x: 176, y: 58, width: 52, height: 52 }
  const gadget = { x: 268, y: 58, width: 172, height: 52 }
  const gatekeeperInput = {
    x: gatekeeper.x,
    y: gatekeeper.y + gatekeeper.height / 2,
  }
  const gatekeeperOutput = {
    x: gatekeeper.x + gatekeeper.width,
    y: gatekeeper.y + gatekeeper.height / 2,
  }
  const gadgetInput = {
    x: gadget.x,
    y: gadget.y + gadget.height / 2,
  }

  const sourcePoint = (index: number) => ({
    x: sourceNodes[index].x + nodeSize,
    y: sourceNodes[index].y + nodeSize / 2,
  })
  const inputPath = (index: number) => {
    const start = sourcePoint(index)
    const end = gatekeeperInput
    const dx = end.x - start.x
    return `M${start.x} ${start.y} C${start.x + dx * 0.45} ${start.y} ${end.x - dx * 0.35} ${end.y} ${end.x} ${end.y}`
  }

  return (
    <div className="relative isolate hidden h-[176px] w-[444px] lg:block">
      <svg
        className="absolute inset-0 h-full w-full text-kumo-line"
        viewBox="0 0 444 176"
        fill="none"
      >
        {nodes[0] && (
          <path
            d={inputPath(0)}
            className={hoveredSource === 0 ? "connectors-hero-flow-line" : ""}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="3 7"
          />
        )}
        {nodes[1] && (
          <path
            d={inputPath(1)}
            className={hoveredSource === 1 ? "connectors-hero-flow-line" : ""}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="3 7"
          />
        )}
        {nodes[2] && (
          <path
            d={inputPath(2)}
            className={hoveredSource === 2 ? "connectors-hero-flow-line" : ""}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="3 7"
          />
        )}
        <path
          d={`M${gatekeeperOutput.x} ${gatekeeperOutput.y} L${gadgetInput.x} ${gadgetInput.y}`}
          stroke="currentColor"
          strokeWidth="1.2"
        />
        {hoveredSource !== null && (
          <path
            d={`M${gatekeeperOutput.x} ${gatekeeperOutput.y} L${gadgetInput.x} ${gadgetInput.y}`}
            className="connectors-hero-flow-line"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="3 7"
          />
        )}
      </svg>

      {nodes.length > 0 ? (
        nodes.map((node, index) => (
          <div
            key={node.key}
            onMouseEnter={() => setHoveredSource(index)}
            onMouseLeave={() => setHoveredSource(null)}
            onFocus={() => setHoveredSource(index)}
            onBlur={() => setHoveredSource(null)}
            className={`themed-card-hover-shadow absolute grid h-11 w-11 place-items-center rounded-2xl border border-kumo-line bg-kumo-base transition-[border-color,transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:border-kumo-fill ${sourceNodes[index].className}`}
          >
            <VendorIconTile
              logoUrl={node.logoUrl}
              color={node.color}
              fallback={node.fallback}
              size={18}
              className="h-8 w-8 rounded-xl"
            />
          </div>
        ))
      ) : (
        <>
          {sourceNodes.map((node, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredSource(index)}
              onMouseLeave={() => setHoveredSource(null)}
              className={`themed-card-hover-shadow absolute h-11 w-11 rounded-2xl border border-kumo-line bg-kumo-elevated transition-[border-color,transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:border-kumo-fill ${node.className}`}
            />
          ))}
        </>
      )}

      <div className="group absolute left-[176px] top-[58px] z-20">
        <button
          type="button"
          className="themed-card-hover-shadow grid h-[52px] w-[52px] place-items-center rounded-2xl border border-kumo-line bg-kumo-base text-kumo-brand transition-[border-color,box-shadow] hover:border-kumo-fill focus:outline-none focus-visible:ring-2 focus-visible:ring-kumo-ring focus-visible:ring-offset-2 focus-visible:ring-offset-kumo-base"
          aria-label="Gatekeeper keeps Gadget access limited to connected resources"
        >
          <ShieldCheck size={21} weight="duotone" />
        </button>
        <div className="themed-floating-shadow-lg pointer-events-none absolute left-1/2 top-[-108px] z-30 w-[228px] origin-bottom -translate-x-1/2 translate-y-1 scale-[0.98] rounded-2xl border border-kumo-line bg-kumo-base p-3 text-left opacity-0 transition-[opacity,transform] delay-0 duration-150 ease-out group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-hover:delay-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-focus-within:delay-100">
          <div className="flex items-start gap-2.5">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-kumo-tint text-kumo-brand">
              <ShieldCheck size={16} weight="duotone" />
            </div>
            <div className="min-w-0">
              <p className="m-0 text-[12px] leading-4 font-semibold tracking-[-0.2px] text-kumo-default">
                Gatekeeper
              </p>
              <p className="mt-1 text-[11px] leading-4 font-normal tracking-[-0.1px] text-kumo-subtle">
                {language === "th" ? "จำกัดการเข้าถึงในพื้นที่ทำงานเฉพาะแหล่งข้อมูลที่คุณเชื่อมต่อ และตรวจสอบสิทธิ์ของผู้ใช้ทุกคนอย่างปลอดภัย" : "Keeps each workspace limited to the resources you connect and ensures every user has the required permissions before accessing them."}
              </p>
            </div>
          </div>
          <span className="absolute left-1/2 bottom-[-5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-kumo-line bg-kumo-base" />
        </div>
      </div>

      <div className="absolute left-[268px] top-[58px] z-10 flex h-[52px] w-[172px] items-center gap-2 rounded-2xl border border-kumo-line bg-kumo-elevated pl-2 pr-4">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-kumo-base text-kumo-brand">
          <Hexagon size={17} weight="bold" />
        </div>
        <span className="relative -top-px min-w-0 truncate text-base leading-5 font-semibold tracking-tight text-kumo-default">
          {siteName}
        </span>
      </div>
    </div>
  )
}

type ModalTarget =
  | { kind: "connect"; vendorId: string }
  | { kind: "manage"; accountId: number }
  | null

function ConnectorsPage() {
  const { t, language } = useI18n()
  useDocumentTitle(t("gatekeepersTitle"))
  const siteName = useSiteName()

  const { authenticatedApi } = useAuthenticatedApi()
  const toasts = useKumoToastManager()

  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "grid"
    return localStorage.getItem("gatekeepers-view") === "list" ? "list" : "grid"
  })
  const [accounts, setAccounts] = useState<AccountEntry[]>([])
  const [vendors, setVendors] = useState<VendorEntry[]>([])
  const [accountsLoaded, setAccountsLoaded] = useState(false)
  const [vendorsLoaded, setVendorsLoaded] = useState(false)
  const [addable, setAddable] = useState<GatekeeperVendorInfo[]>([])
  const [loadError, setLoadError] = useState(false)

  const [modalTarget, setModalTarget] = useState<ModalTarget>(null)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const [reconnectingAccountId, setReconnectingAccountId] = useState<number | null>(null)
  const [ensuringResourceUrlPatterns, setEnsuringResourceUrlPatterns] = useState<string[]>([])

  useEffect(() => {
    localStorage.setItem("gatekeepers-view", view)
  }, [view])

  useEffect(() => {
    let cancelled = false
    const accountMap = new Map<number, AccountEntry>()

    setAccountsLoaded(false)
    setVendorsLoaded(false)

    authenticatedApi.listAddableGatekeepers()
      .then((list) => {
        if (!cancelled) setAddable(list)
      })
      .catch((err) => {
        logRpcFailure("Failed to load addable gatekeepers:", err)
      })

    authenticatedApi.listGatekeeperVendors()
      .then((vendorList) => {
        if (cancelled) return
        const unavailable = vendorList.filter((v) => v.unavailable)
        if (unavailable.length > 0) {
          toasts.add({
            title: language === "th" ? `บางบริการไม่พร้อมใช้งานชั่วคราว: ${unavailable.map((v) => v.id).join(", ")}` : `Some services are temporarily unavailable: ${unavailable.map((v) => v.id).join(", ")}`,
            variant: "warning",
          })
        }
        setVendors(
          vendorList
            .filter((v) => !v.unavailable)
            .map((v) => ({
              id: v.id,
              description: v.description,
              supportedResources: v.supportedResources,
            })),
        )
        setVendorsLoaded(true)
      })
      .catch((err) => {
        logRpcFailure("Failed to load available services:", err)
        if (!cancelled) setLoadError(true)
      })

    const subscriber = new AccountsSubscriberAdapter({
      add({ id, description, vendor, supportedResources, credentialsValid, vendorId }) {
        if (cancelled) return
        accountMap.set(id, {
          id,
          accountDescription: description,
          vendorId,
          vendorDescription: vendor,
          supportedResources,
          credentialsValid,
        })
        setAccounts(Array.from(accountMap.values()))
        setAccountsLoaded(true)
      },
      remove(id) {
        if (cancelled) return
        accountMap.delete(id)
        setAccounts(Array.from(accountMap.values()))
      },
    })
    const subscription = authenticatedApi.subscribeConnectedAccounts(subscriber)
    subscription.catch((err) => {
      logRpcFailure("Failed to subscribe to connected accounts:", err)
      if (!cancelled) setAccountsLoaded(true)
    })

    return () => {
      cancelled = true
      subscription[Symbol.dispose]()
    }
  }, [authenticatedApi])

  const handleOpenConnect = (vendorId: string) => {
    setModalTarget({ kind: "connect", vendorId })
  }

  const handleOpenManage = (accountId: number) => {
    setModalTarget({ kind: "manage", accountId })
  }

  const handleCloseModal = () => {
    setModalTarget(null)
  }

  const handleConfirmConnect = async (resourceUrlPatterns?: string[]) => {
    if (!modalTarget || modalTarget.kind !== "connect") return
    const vendorId = modalTarget.vendorId
    const vendor = availableVendors.find((v) => v.id === vendorId)
    const isAmbient = !!vendor?.description.autoProvisionsAccount

    setConnecting(true)
    try {
      if (isAmbient) {
        await authenticatedApi.provisionAmbientAccount(vendorId)
        setAddable((prev) => prev.filter((g) => g.id !== vendorId))
        toasts.add({
          title: language === "th" ? `เชื่อมต่อ ${vendor?.description.displayName ?? vendorId} สำเร็จ` : `Added ${vendor?.description.displayName ?? vendorId}`,
          variant: "success",
        })
        handleCloseModal()
        refreshGatekeeperApps(authenticatedApi)
      } else {
        const result = await authenticatedApi.connectAccount(vendorId, resourceUrlPatterns)
        if (result.url) {
          window.open(result.url, "_blank", "noopener,noreferrer")
          toasts.add({
            title: language === "th" ? `โปรดดำเนินการเชื่อมต่อบัญชีในแท็บใหม่ที่เปิดขึ้น` : `Complete the ${vendor?.description.displayName ?? vendorId} connection in the new tab.`,
            variant: "success",
          })
          handleCloseModal()
        }
      }
    } catch (err) {
      console.error("Failed to connect gatekeeper:", err)
      toasts.add({
        title: language === "th" ? `ไม่สามารถเชื่อมต่อ ${vendor?.description.displayName ?? vendorId} ได้` : `Failed to connect ${vendor?.description.displayName ?? vendorId}`,
        variant: "error",
      })
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!modalTarget || modalTarget.kind !== "manage") return
    const account = accounts.find((a) => a.id === modalTarget.accountId)
    if (!account) return

    setDisconnecting(true)
    try {
      await authenticatedApi.disconnectAccount(account.id)
      toasts.add({
        title: language === "th" ? `ยกเลิกการเชื่อมต่อ ${account.vendorDescription.displayName} สำเร็จ` : `Disconnected ${account.vendorDescription.displayName}`,
        variant: "success",
      })
      handleCloseModal()
      refreshGatekeeperApps(authenticatedApi)
    } catch (err) {
      console.error("Failed to disconnect gatekeeper:", err)
      toasts.add({
        title: language === "th" ? `ไม่สามารถยกเลิกการเชื่อมต่อ ${account.vendorDescription.displayName} ได้` : `Failed to disconnect ${account.vendorDescription.displayName}`,
        variant: "error",
      })
    } finally {
      setDisconnecting(false)
    }
  }

  const handleReconnect = async (accountId: number) => {
    const account = accounts.find((a) => a.id === accountId)
    setReconnectingAccountId(accountId)
    try {
      const result = await authenticatedApi.reconnectAccount(accountId)
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer")
        toasts.add({
          title: language === "th" ? `โปรดดำเนินการเชื่อมต่อบัญชีใหม่ในแท็บที่เปิดขึ้น` : `Complete the ${account?.vendorDescription.displayName ?? "account"} reconnect in the new tab.`,
          variant: "success",
        })
      }
    } catch (err) {
      console.error("Failed to reconnect gatekeeper:", err)
      toasts.add({
        title: language === "th" ? "ไม่สามารถเริ่มการเชื่อมต่อใหม่ได้" : "Failed to start reconnect",
        variant: "error",
      })
    } finally {
      setReconnectingAccountId(null)
    }
  }

  const handleEnsureResources = async (resourceUrlPatterns: string[]) => {
    if (!modalTarget || modalTarget.kind !== "manage") return
    const account = accounts.find((a) => a.id === modalTarget.accountId)
    if (!account) return

    setEnsuringResourceUrlPatterns(resourceUrlPatterns)
    try {
      const result = await authenticatedApi.ensureAccountResources(
        account.id,
        resourceUrlPatterns,
      )
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer")
        toasts.add({
          title: language === "th" ? "โปรดอนุญาตสิทธิ์การเข้าถึงเพิ่มเติมในแท็บใหม่" : "Grant the additional access in the new tab.",
          variant: "success",
        })
      }
    } catch (err) {
      console.error("Failed to request additional resources:", err)
      toasts.add({
        title: language === "th" ? "ไม่สามารถขอสิทธิ์การเข้าถึงเพิ่มเติมได้" : "Failed to request additional access",
        variant: "error",
      })
    } finally {
      setEnsuringResourceUrlPatterns([])
    }
  }

  const availableVendors = useMemo(() => {
    const combined: VendorEntry[] = [...vendors]
    for (const a of addable) {
      if (!combined.some((v) => v.id === a.id)) {
        combined.push({
          id: a.id,
          description: a.description,
          supportedResources: a.supportedResources,
        })
      }
    }
    return combined
  }, [vendors, addable])

  const searchLower = search.trim().toLowerCase()

  const matchesSearch = (text?: string) =>
    Boolean(text && text.toLowerCase().includes(searchLower))

  const filteredAccounts = useMemo(() => {
    if (!searchLower) return accounts
    return accounts.filter(
      (a) =>
        matchesSearch(a.vendorDescription.displayName) ||
        matchesSearch(a.vendorDescription.tagline) ||
        matchesSearch(a.accountDescription.displayName) ||
        matchesSearch(a.accountDescription.uniqueName) ||
        a.supportedResources.some((r) => matchesSearch(r.title)),
    )
  }, [accounts, searchLower])

  const filteredAvailable = useMemo(() => {
    if (!searchLower) return availableVendors
    return availableVendors.filter(
      (v) =>
        matchesSearch(v.description.displayName) ||
        matchesSearch(v.description.tagline) ||
        v.supportedResources.some((r) => matchesSearch(r.title)),
    )
  }, [availableVendors, searchLower])

  const activeAccount: AccountEntry | undefined =
    modalTarget?.kind === "manage"
      ? accounts.find((a) => a.id === modalTarget.accountId)
      : undefined
  const activeVendor: VendorEntry | undefined =
    modalTarget?.kind === "connect"
      ? availableVendors.find((v) => v.id === modalTarget.vendorId)
      : activeAccount
      ? availableVendors.find((v) => v.id === activeAccount.vendorId) ?? {
          id: activeAccount.vendorId,
          description: activeAccount.vendorDescription,
          supportedResources: activeAccount.supportedResources,
        }
      : undefined

  const isTargetAmbient =
    modalTarget?.kind === "connect" && !!activeVendor?.description.autoProvisionsAccount

  const sectionGridClass =
    view === "list" ? "flex flex-col gap-0.5" : "grid gap-3 sm:grid-cols-2"

  const initialLoading =
    !loadError &&
    (!vendorsLoaded || !accountsLoaded) &&
    vendors.length === 0 &&
    accounts.length === 0

  return (
    <div className="min-h-[calc(100vh-3.5rem-1px)] bg-kumo-base">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-8 sm:py-14">
        <header className="mb-8 grid gap-8 lg:grid-cols-[minmax(0,540px)_444px] lg:items-center lg:justify-between">
          <div>
            <h1 className="m-0 text-3xl font-semibold leading-tight tracking-tight text-kumo-default sm:text-[34px]">
              {t("gatekeepersTitle")}
            </h1>
            <p className="mt-2 text-[14px] leading-[20px] font-normal tracking-[-0.25px] text-kumo-subtle">
              {t("gatekeepersSubtitle")}
            </p>
          </div>
          <ConnectorsHeroDiagram accounts={accounts} vendors={vendors} siteName={siteName} />
        </header>

        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-kumo-inactive"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchGatekeepers")}
              className="h-10 w-full rounded-lg border border-kumo-line bg-kumo-base pl-9 pr-4 text-[14px] leading-5 tracking-[-0.25px] text-kumo-default placeholder:text-kumo-inactive transition-[border-color,box-shadow] focus:border-kumo-ring focus:outline-none focus:ring-[3px] focus:ring-kumo-ring/15"
            />
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {loadError && (
          <div className="rounded-2xl border border-kumo-line bg-kumo-base px-4 py-6 text-center">
            <p className="m-0 text-[13px] leading-[18px] font-medium tracking-[-0.25px] text-kumo-danger">
              {language === "th" ? "เกิดข้อผิดพลาดในการโหลดตัวเชื่อมต่อ" : "Something went wrong loading your gatekeepers."}
            </p>
            <p className="mt-1 text-[12px] leading-4 font-normal tracking-[-0.2px] text-kumo-subtle">
              {language === "th" ? "โปรดตรวจสอบการเชื่อมต่อแล้วลองรีเฟรชหน้าเว็บอีกครั้ง" : "Check your connection and try refreshing the page."}
            </p>
          </div>
        )}

        {initialLoading && (
          <div className="rounded-2xl border border-kumo-line bg-kumo-base px-4 py-8 text-center text-[13px] leading-[18px] font-normal tracking-[-0.25px] text-kumo-subtle">
            {language === "th" ? "กำลังโหลดตัวเชื่อมต่อ…" : "Loading gatekeepers..."}
          </div>
        )}

        {filteredAccounts.length > 0 && (
          <section className="mb-10">
            <SectionEyebrow label={t("connectedGatekeepers")} count={filteredAccounts.length} />
            <div className={sectionGridClass}>
              {filteredAccounts.map((account) => {
                const displayName =
                  account.accountDescription.displayName ??
                  account.accountDescription.uniqueName ??
                  (language === "th" ? "เชื่อมต่อแล้ว" : "Connected")
                const tagline = account.vendorDescription.tagline
                return (
                  <ConnectorCard
                    key={account.id}
                    logoUrl={account.vendorDescription.logo?.url}
                    color={account.vendorDescription.color}
                    fallback={account.vendorDescription.displayName}
                    name={account.vendorDescription.displayName}
                    metaLine={
                      <span
                        className={`truncate ${
                          account.credentialsValid ? "" : "text-kumo-danger"
                        }`}
                      >
                        {account.credentialsValid
                          ? displayName
                          : (language === "th" ? "ข้อมูลรับรองหมดอายุ" : "Credentials expired")}
                      </span>
                    }
                    tagline={tagline}
                    state={account.credentialsValid ? "connected" : "expired"}
                    onClick={() => handleOpenManage(account.id)}
                    onReconnect={() => handleReconnect(account.id)}
                    reconnectBusy={reconnectingAccountId === account.id}
                    view={view}
                  />
                )
              })}
            </div>
          </section>
        )}

        {filteredAvailable.length > 0 && (
          <section className="mb-10">
            <SectionEyebrow label={language === "th" ? "พร้อมใช้งาน" : "Available"} />
            <div className={sectionGridClass}>
              {filteredAvailable.map((vendor) => (
                <ConnectorCard
                  key={vendor.id}
                  logoUrl={vendor.description.logo?.url}
                  color={vendor.description.color}
                  fallback={vendor.description.displayName}
                  name={vendor.description.displayName}
                  tagline={vendor.description.tagline}
                  state="available"
                  onClick={() => handleOpenConnect(vendor.id)}
                  view={view}
                />
              ))}
            </div>
          </section>
        )}

        {!initialLoading &&
          !loadError &&
          filteredAccounts.length === 0 &&
          filteredAvailable.length === 0 && (
            <EmptyState
              title={
                search
                  ? (language === "th" ? "ไม่พบตัวเชื่อมต่อที่ตรงกับการค้นหา" : "No gatekeepers match")
                  : (language === "th" ? "ยังไม่มีตัวเชื่อมต่อ" : "No gatekeepers yet")
              }
              description={
                search
                  ? (language === "th" ? "ไม่พบข้อมูลที่ตรงกับคำค้นหาของคุณ" : "We couldn't find anything matching your search.")
                  : (language === "th" ? "ตัวเชื่อมต่อจะปรากฏที่นี่เมื่อพร้อมใช้งานในพื้นที่ทำงานของคุณ" : "Gatekeepers will appear here as they become available in your workspace.")
              }
              icon={Plugs}
            />
          )}
      </div>

      {activeVendor && (
        <ConnectConnectorModal
          key={modalTarget?.kind === "manage"
            ? `manage:${modalTarget.accountId}`
            : `connect:${modalTarget?.vendorId ?? ""}`}
          open={modalTarget !== null}
          mode={modalTarget?.kind === "manage" ? "manage" : "connect"}
          vendorDescription={activeVendor.description}
          supportedResources={activeVendor.supportedResources}
          logoUrl={activeVendor.description.logo?.url}
          color={activeVendor.description.color}
          autoProvisions={isTargetAmbient}
          connecting={connecting}
          onConfirm={handleConfirmConnect}
          accountDescription={activeAccount?.accountDescription}
          credentialsValid={activeAccount?.credentialsValid}
          grantedResourceUrlPatterns={activeAccount?.accountDescription.grantedResourceUrlPatterns}
          onEnsureResources={handleEnsureResources}
          ensuringResourceUrlPatterns={ensuringResourceUrlPatterns}
          disconnecting={disconnecting}
          onDisconnect={handleDisconnect}
          onOpenChange={(open) => {
            if (!open && !connecting && !disconnecting) handleCloseModal()
          }}
        />
      )}
    </div>
  )
}
