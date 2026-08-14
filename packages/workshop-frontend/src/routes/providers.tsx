import { useI18n } from "../i18n/I18nContext"
import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect, useRef } from "react"
import { DropdownMenu, useKumoToastManager } from "@cloudflare/kumo"
import { useAuthenticatedApi } from "../AuthContext"
import {
  AiChatAuthorInfo,
  AiGatewayInfo,
  AiModelProvider,
  SUGGESTED_MODELS,
} from "@gadgets/workshop-shared/api"
import {
  Plus,
  Trash,
  Lightning,
  Star,
  MagnifyingGlass,
  DotsThreeVertical,
} from "@phosphor-icons/react"
import AddModelModal from "../AddModelModal"
import { useDocumentTitle } from "../useDocumentTitle"
import { MENU_CONTENT, MENU_ITEM, MENU_ITEM_DANGER } from "../components/menuStyles"

export const Route = createFileRoute("/providers")({ component: ProvidersPage })

// ─── constants ────────────────────────────────────────────────────────────────

const PROVIDER_ORDER = Object.keys(SUGGESTED_MODELS) as AiModelProvider[]

const PRIMARY_BTN =
  "press inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-kumo-brand px-3.5 text-[13px] font-medium tracking-[-0.25px] text-white transition-colors hover:bg-kumo-brand-hover"

// ─── model row ─────────────────────────────────────────────────────────────────

function ModelRow({
  model,
  isPreferred,
  isQuick,
  isBuiltIn,
  onDelete,
  onSetPreferred,
  onSetQuick,
  language,
}: {
  model: AiChatAuthorInfo
  isPreferred: boolean
  isQuick: boolean
  isBuiltIn: boolean
  onDelete: () => void
  onSetPreferred: () => void
  onSetQuick: () => void
  language: string
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSetPreferred}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSetPreferred()
        }
      }}
      title={
        isPreferred
          ? (language === "th" ? "โมเดลหลักปัจจุบัน (คลิกเพื่อยกเลิก)" : "Primary model. Click to clear")
          : (language === "th" ? "คลิกเพื่อตั้งเป็นโมเดลหลักสำหรับการสนทนา" : "Click to set as primary model")
      }
      className={`group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-[background-color,border-color,box-shadow] duration-150 ease-out ${
        isPreferred
          ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]"
          : "border-kumo-line bg-kumo-base hover:border-kumo-line-hover hover:bg-kumo-elevated"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Monogram */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold transition-colors ${
          isPreferred
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "bg-kumo-fill text-kumo-subtle group-hover:bg-kumo-tint"
        }`}>
          {isPreferred ? <Star size={16} weight="fill" /> : model.name[0]?.toUpperCase()}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium tracking-tight text-kumo-default">
              {model.name}
            </span>
            {isBuiltIn && (
              <span className="shrink-0 rounded-full bg-kumo-tint px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.4px] text-kumo-subtle">
                built-in
              </span>
            )}
            {isPreferred && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-600 dark:text-emerald-400">
                <Star size={10} weight="fill" />
                {language === "th" ? "โมเดลหลัก" : "primary"}
              </span>
            )}
            {isQuick && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[rgba(255,72,1,0.10)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-kumo-brand">
                <Lightning size={10} weight="fill" />
                {language === "th" ? "ความเร็วสูง" : "quick"}
              </span>
            )}
          </div>
          <span className="mt-0.5 block truncate font-mono text-[12px] text-kumo-inactive">
            {model.id}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div onClick={(e) => { e.stopPropagation() }}>
        <DropdownMenu>
          <DropdownMenu.Trigger
            render={
              <button
                aria-label="Provider actions"
                className="cursor-pointer rounded-md p-1.5 text-kumo-subtle transition-colors hover:bg-kumo-fill hover:text-kumo-default focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <DotsThreeVertical size={16} />
              </button>
            }
          />
          <DropdownMenu.Content className={MENU_CONTENT}>
            <DropdownMenu.Item onClick={onSetPreferred} className={MENU_ITEM}>
              <Star size={13} className="mr-2" weight={isPreferred ? "fill" : "regular"} />
              {isPreferred
                ? (language === "th" ? "ยกเลิกโมเดลหลัก" : "Clear primary model")
                : (language === "th" ? "ตั้งเป็นโมเดลหลัก (Primary)" : "Set as primary model")}
            </DropdownMenu.Item>
            <DropdownMenu.Item onClick={onSetQuick} className={MENU_ITEM}>
              <Lightning size={13} className="mr-2" weight={isQuick ? "fill" : "regular"} />
              {isQuick
                ? (language === "th" ? "ยกเลิกโมเดลความเร็วสูง" : "Clear quick model")
                : (language === "th" ? "ตั้งเป็นโมเดลความเร็วสูง (Quick)" : "Set as quick model")}
            </DropdownMenu.Item>
            {!isBuiltIn && (
              <DropdownMenu.Item variant="danger" onClick={onDelete} className={MENU_ITEM_DANGER}>
                <Trash size={13} className="mr-2" />
                {language === "th" ? "ลบผู้ให้บริการ" : "Delete provider"}
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ─── notice callout ───────────────────────────────────────────────────────────

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-kumo-line bg-kumo-base px-3 py-2.5 text-[12px] leading-[17px] text-kumo-subtle">
      {children}
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

function ProvidersPage() {
  const { t, language } = useI18n()
  useDocumentTitle(language === "th" ? "ผู้ให้บริการ AI" : "AI Providers")

  const { authenticatedApi } = useAuthenticatedApi()
  const toasts = useKumoToastManager()
  const [models, setModels] = useState<AiChatAuthorInfo[]>([])
  const [quickModel, setQuickModel] = useState<string | null>(null)
  const [preferredModel, setPreferredModel] = useState<string | null>(null)
  const [aiConfig, setAiConfig] = useState<AiGatewayInfo | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchAll = async () => {
    setLoadError(false)
    try {
      const [modelList, qm, pm, cfg] = await Promise.all([
        authenticatedApi.listModels(),
        authenticatedApi.getQuickModel(),
        authenticatedApi.getPreferredModel(),
        authenticatedApi.getAiConfig(),
      ])
      setModels(modelList)
      setQuickModel(qm)
      setPreferredModel(pm)
      setAiConfig(cfg)
    } catch (err) {
      console.error("Failed to load providers:", err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [authenticatedApi])

  
  const isBuiltIn = (modelId: string): boolean => {
    if (!aiConfig?.enabled) return false
    const enabled = new Set((aiConfig as Extract<AiGatewayInfo, { enabled: true }>).enabledProviders)
    return PROVIDER_ORDER.some((p) => enabled.has(p) && modelId in SUGGESTED_MODELS[p])
  }

  const handleDelete = async (model: AiChatAuthorInfo) => {
    if (!confirm(language === "th" ? "ลบ " + JSON.stringify(model.name) + " หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้" : "Delete " + JSON.stringify(model.name) + "? This cannot be undone.")) return
    setDeletingId(model.id)
    try {
      await authenticatedApi.deleteModel(model.id)
      await fetchAll()
    } catch (err) {
      console.error("Failed to delete model:", err)
      toasts.add({ title: language === "th" ? "ไม่สามารถลบผู้ให้บริการได้" : "Failed to delete provider", variant: "error" })
    } finally {
      setDeletingId(null)
    }
  }

  const preferredInFlight = useRef(false)
  const handleSetPreferred = async (modelId: string) => {
    if (preferredInFlight.current) return
    preferredInFlight.current = true
    const next = preferredModel === modelId ? null : modelId
    setPreferredModel(next)
    try {
      await authenticatedApi.setPreferredModel(next)
      toasts.add({
        title: next
          ? (language === "th" ? "ตั้งเป็นโมเดลหลักเรียบร้อยแล้ว" : "Set as primary model")
          : (language === "th" ? "ยกเลิกโมเดลหลักแล้ว" : "Cleared primary model"),
        variant: "success",
      })
    } catch (err) {
      console.error("Failed to set preferred model:", err)
      setPreferredModel(preferredModel)
      toasts.add({ title: language === "th" ? "ไม่สามารถอัปเดตโมเดลหลักได้" : "Failed to update primary model", variant: "error" })
    } finally {
      preferredInFlight.current = false
    }
  }

  const quickInFlight = useRef(false)
  const handleSetQuick = async (modelId: string) => {
    if (quickInFlight.current) return
    quickInFlight.current = true
    const next = quickModel === modelId ? null : modelId
    setQuickModel(next)
    try {
      await authenticatedApi.setQuickModel(next)
      toasts.add({
        title: next
          ? (language === "th" ? "ตั้งเป็นโมเดลความเร็วสูงเรียบร้อยแล้ว" : "Set as quick model")
          : (language === "th" ? "ยกเลิกโมเดลความเร็วสูงแล้ว" : "Cleared quick model"),
        variant: "success",
      })
    } catch (err) {
      console.error("Failed to set quick model:", err)
      setQuickModel(quickModel)
      toasts.add({ title: language === "th" ? "ไม่สามารถอัปเดตโมเดลเริ่มต้นได้" : "Failed to update default model", variant: "error" })
    } finally {
      quickInFlight.current = false
    }
  }

  const filtered = models.filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
  })

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-6 sm:px-10">
      <header className="flex items-end justify-between gap-4 px-3 pb-3 pt-10">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-kumo-default">{t("providersTitle")}</h1>
          <p className="mt-1 text-[13px] leading-[18px] tracking-[-0.25px] text-kumo-subtle">
            {t("providersSubtitle")}
          </p>
        </div>
        <button type="button" onClick={() => setSheetOpen(true)} className={PRIMARY_BTN}>
          <Plus size={14} weight="bold" />
          {t("addProvider")}
        </button>
      </header>

      {/* Search */}
      {!loading && !loadError && models.length > 0 && (
        <div className="mb-3 px-3">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kumo-inactive" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchProviders")}
              className="h-9 w-full rounded-lg border border-kumo-line bg-kumo-base pl-9 pr-4 text-[13px] tracking-[-0.25px] text-kumo-default placeholder:text-kumo-inactive transition-[border-color,box-shadow] duration-150 ease-out focus:border-kumo-ring focus:outline-none focus:ring-[3px] focus:ring-kumo-ring/15"
            />
          </div>
        </div>
      )}

      <div className="chat-panel flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pt-1 pb-16">
        {/* Notices */}
        {!loading && !loadError && models.length > 0 && (
          <div className="flex flex-col gap-2 px-3 pb-2">
            <Notice>
              <Star size={15} weight="fill" className="mt-px shrink-0 text-emerald-500" />
              <span>
                <strong className="font-medium text-kumo-default">
                  {language === "th" ? "โมเดลหลัก (Primary model):" : "Primary model:"}
                </strong>{" "}
                {preferredModel
                  ? (models.find((m) => m.id === preferredModel)?.name ?? preferredModel) + "."
                  : (language === "th" ? "ยังไม่ได้กำหนด (จะใช้โมเดลแรกในรายการ)" : "none set (defaults to first model).")}{" "}
                {language === "th"
                  ? "ใช้สำหรับการสร้างและสนทนาในพื้นที่ทำงาน (คลิกที่แถวโมเดลเพื่อเลือก)"
                  : "Used for creating and chatting in workspaces. Click any model to set it."}
              </span>
            </Notice>

            <Notice>
              <Lightning size={15} className="mt-px shrink-0 text-kumo-brand" />
              <span>
                <strong className="font-medium text-kumo-default">
                  {language === "th" ? "โมเดลความเร็วสูง (Quick model):" : "Quick model:"}
                </strong>{" "}
                {quickModel
                  ? (models.find((m) => m.id === quickModel)?.name ?? quickModel) + "."
                  : (language === "th" ? "ยังไม่ได้กำหนด" : "none set.")}{" "}
                {language === "th"
                  ? "ใช้สำหรับงานขนาดเล็ก เช่น การตั้งชื่อแชทอัตโนมัติ"
                  : "Used for fast tasks like generating chat titles."}
              </span>
            </Notice>
          </div>
        )}

        {/* Model list */}
        {loading ? (
          <div className="flex flex-col gap-0.5 px-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[56px] animate-pulse rounded-xl bg-kumo-elevated" />
            ))}
          </div>
        ) : loadError ? (
          <div className="py-12 text-center text-sm">
            <p className="text-kumo-danger">{language === "th" ? "เกิดข้อผิดพลาดในการโหลดผู้ให้บริการ AI" : "Something went wrong loading your providers."}</p>
            <button type="button" onClick={fetchAll} className="mt-1 cursor-pointer text-kumo-brand underline">
              {language === "th" ? "ลองใหม่อีกครั้ง" : "Try again"}
            </button>
          </div>
        ) : models.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-3 py-16 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kumo-fill text-kumo-subtle">
              <Lightning size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-kumo-default">{language === "th" ? "ยังไม่มีผู้ให้บริการ AI" : "No AI providers yet"}</p>
              <p className="mt-1 text-[13px] leading-[18px] text-kumo-subtle">
                {language === "th" ? "เพิ่มผู้ให้บริการโมเดลเพื่อเริ่มต้นสร้างพื้นที่ทำงานด้วย AI" : "Add a provider to start building workspaces with AI."}
              </p>
            </div>
            <button type="button" onClick={() => setSheetOpen(true)} className={PRIMARY_BTN}>
              <Plus size={14} weight="bold" />
              {language === "th" ? "เพิ่มผู้ให้บริการแรกของคุณ" : "Add your first provider"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-kumo-inactive">{language === "th" ? "ไม่พบผู้ให้บริการ AI ที่ค้นหา" : "No providers found"}</div>
        ) : (
          <div className="flex flex-col gap-2 px-3">
            {filtered.map((model) => (
              <div
                key={model.id}
                className={deletingId === model.id ? "pointer-events-none opacity-50" : ""}
              >
                <ModelRow
                  model={model}
                  isPreferred={preferredModel === model.id}
                  isQuick={quickModel === model.id}
                  isBuiltIn={isBuiltIn(model.id)}
                  onDelete={() => handleDelete(model)}
                  onSetPreferred={() => handleSetPreferred(model.id)}
                  onSetQuick={() => handleSetQuick(model.id)}
                  language={language}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add model dialog */}
      <AddModelModal
        visible={sheetOpen}
        onCancel={() => setSheetOpen(false)}
        onSuccess={() => {
          setSheetOpen(false)
          fetchAll()
        }}
        authenticatedApi={authenticatedApi}
        aiConfig={aiConfig}
      />
    </div>
  )
}