import { Dialog, Switch } from "@cloudflare/kumo"
import { X, ShieldCheck } from "@phosphor-icons/react"
import { useEffect, useMemo, useState } from "react"
import {
  AccountDescription,
  SupportedResource,
  VendorDescription,
} from "@gadgets/workshop-shared/gatekeeper"
import { WorkshopButton, WorkshopIconButton } from "./WorkshopControls"
import { useI18n } from "../i18n/I18nContext"
import { translateResourceTitle, translateResourceDesc } from "../GatekeeperModal"
import { translateVendorTagline, translateVendorName } from "../routes/gatekeepers"

interface ConnectConnectorModalProps {
  open: boolean
  mode: "connect" | "manage"
  vendorDescription: VendorDescription
  supportedResources: SupportedResource[]
  logoUrl?: string
  color?: string
  autoProvisions?: boolean
  onOpenChange: (open: boolean) => void
  connecting?: boolean
  onConfirm?: (resourceUrlPatterns?: string[]) => void
  accountDescription?: AccountDescription
  credentialsValid?: boolean
  disconnecting?: boolean
  onDisconnect?: () => void
  grantedResourceUrlPatterns?: string[]
  onEnsureResources?: (resourceUrlPatterns: string[]) => void
  ensuringResourceUrlPatterns?: string[]
}

export default function ConnectConnectorModal({
  open,
  mode,
  vendorDescription,
  supportedResources,
  logoUrl,
  color,
  autoProvisions = false,
  onOpenChange,
  connecting = false,
  onConfirm,
  accountDescription,
  credentialsValid = true,
  disconnecting = false,
  onDisconnect,
  grantedResourceUrlPatterns,
  onEnsureResources,
  ensuringResourceUrlPatterns = [],
}: ConnectConnectorModalProps) {
  const { language } = useI18n()
  const isManage = mode === "manage"

  const grantableResources = useMemo(
    () => supportedResources.filter((r) => Boolean(r.grantable)),
    [supportedResources],
  )

  const isGranted = (urlPattern: string): boolean => {
    if (grantedResourceUrlPatterns === undefined) return true
    return grantedResourceUrlPatterns.includes(urlPattern)
  }

  const [selected, setSelected] = useState<Set<string>>(() => {
    if (isManage) {
      return new Set(
        grantableResources
          .map((r) => r.urlPattern)
          .filter((p) => isGranted(p)),
      )
    }
    return new Set(grantableResources.map((r) => r.urlPattern))
  })

  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)

  useEffect(() => {
    if (!open) setConfirmingDisconnect(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (isManage) {
      setSelected(
        new Set(
          grantableResources
            .map((r) => r.urlPattern)
            .filter((p) => isGranted(p)),
        ),
      )
    } else {
      setSelected(new Set(grantableResources.map((r) => r.urlPattern)))
    }
  }, [open, isManage, supportedResources, grantedResourceUrlPatterns])

  const granular = grantableResources.length > 0
  const noneSelected = granular && selected.size === 0

  const pendingPatterns = isManage
    ? [...selected].filter((p) => !isGranted(p))
    : []
  const hasPending = pendingPatterns.length > 0

  function toggleResource(urlPattern: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(urlPattern)
      else next.delete(urlPattern)
      return next
    })
  }

  function handleAddResources() {
    if (hasPending) onEnsureResources?.(pendingPatterns)
  }

  function discardPending() {
    setSelected(
      new Set(
        grantableResources.map((r) => r.urlPattern).filter((p) => isGranted(p)),
      ),
    )
  }

  const ensuringBusy = ensuringResourceUrlPatterns.length > 0

  function handleConfirm() {
    if (!onConfirm) return
    if (granular) {
      const allSelected = selected.size === grantableResources.length
      onConfirm(allSelected ? undefined : [...selected])
    } else {
      onConfirm(undefined)
    }
  }

  function handleDisconnect() {
    if (!confirmingDisconnect) {
      setConfirmingDisconnect(true)
      return
    }
    onDisconnect?.()
  }

  const accountDisplayName =
    accountDescription?.displayName ??
    accountDescription?.uniqueName ??
    (language === "th" ? "เชื่อมต่อแล้ว" : "Connected")

  const vendorDisplayName = translateVendorName(vendorDescription.displayName, language)

  const headerTitle = isManage
    ? (language === "th" ? `จัดการการเชื่อมต่อ ${vendorDisplayName}` : `Manage ${vendorDescription.displayName}`)
    : (language === "th" ? `เชื่อมต่อ ${vendorDisplayName}` : `Connect ${vendorDescription.displayName}`)

  const headerSubline = isManage ? (
    <div className="mt-0.5 flex items-center gap-1.5 text-[13px] leading-[18px] font-normal tracking-[-0.25px] text-kumo-subtle">
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          credentialsValid ? "bg-kumo-success" : "bg-kumo-danger"
        }`}
        aria-hidden
      />
      <span className="truncate">
        {credentialsValid
          ? accountDescription?.uniqueName
            ? `${accountDisplayName} / ${accountDescription.uniqueName}`
            : accountDisplayName
          : (language === "th" ? "ข้อมูลรับรองหมดอายุ โปรดเชื่อมต่อใหม่จากหน้านี้" : "Credentials expired; reconnect from the Gatekeepers page")}
      </span>
    </div>
  ) : (
    vendorDescription.tagline && (
      <Dialog.Description className="mt-0.5 text-[13px] leading-[18px] font-normal tracking-[-0.25px] text-kumo-subtle">
        {translateVendorTagline(vendorDescription.tagline, language)}
      </Dialog.Description>
    )
  )

  const busy = connecting || disconnecting

  function resourceIcon(resource?: SupportedResource) {
    const icon = resource?.icon?.url ?? logoUrl
    return (
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-kumo-strong"
        style={{ backgroundColor: color ?? "var(--color-kumo-tint)" }}
      >
        {icon ? (
          <img src={icon} alt="" className="h-4 w-4 object-contain" />
        ) : (
          <ResourceIconGlyph />
        )}
      </div>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog
        size="lg"
        className="!z-[1000] !top-[clamp(28px,10vh,96px)] !flex !max-h-[calc((100vh_-_clamp(28px,10vh,96px)_-_28px)_*_0.9)] !w-[min(560px,calc(100vw-32px))] !-translate-y-0 flex-col overflow-hidden bg-kumo-base p-0"
      >
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-kumo-line px-5 py-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ backgroundColor: color ?? "var(--color-kumo-tint)" }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-6 w-6 object-contain"
                />
              ) : (
                <span className="text-[14px] font-semibold text-kumo-strong">
                  {vendorDescription.displayName[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <Dialog.Title className="truncate text-[17px] leading-6 font-medium tracking-[-0.35px] text-kumo-default">
                {headerTitle}
              </Dialog.Title>
              {headerSubline}
            </div>
          </div>
          <Dialog.Close
            render={(props) => (
              <WorkshopIconButton {...props} disabled={busy} aria-label={language === "th" ? "ปิด" : "Close"}>
                <X size={16} />
              </WorkshopIconButton>
            )}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {supportedResources.length > 0 && (
            <div>
              <p className="mb-2.5 text-[12px] leading-4 font-medium uppercase tracking-[0.6px] text-kumo-subtle">
                {granular
                  ? (language === "th" ? "เลือกแหล่งข้อมูลที่ต้องการให้การเชื่อมต่อนี้เข้าถึงได้:" : "Choose which resources this connection can access:")
                  : (language === "th" ? "แหล่งข้อมูลและสิทธิ์ที่รองรับ:" : "Supported resources:")}
              </p>
              <ul className="space-y-2">
                {supportedResources.map((resource) => {
                  const grantable = Boolean(resource.grantable)
                  const granted = isManage && grantable && isGranted(resource.urlPattern)
                  const ensuring = ensuringResourceUrlPatterns.includes(
                    resource.urlPattern,
                  )
                  const checked =
                    grantable &&
                    (selected.has(resource.urlPattern) || ensuring)
                  const disabled = isManage && (granted || ensuring)
                  return (
                    <li
                      key={resource.urlPattern}
                      className="flex items-center gap-3 rounded-lg border border-kumo-line bg-kumo-base px-3 py-2.5"
                    >
                      {resourceIcon(resource)}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] leading-[18px] font-medium tracking-[-0.25px] text-kumo-default">
                          {translateResourceTitle(resource.title, language)}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-4 font-normal tracking-[-0.2px] text-kumo-subtle">
                          {translateResourceDesc(resource.description, language)}
                        </p>
                      </div>
                      {grantable && (
                        <Switch
                          size="sm"
                          className="shrink-0"
                          aria-label={
                            isManage
                              ? `Grant ${resource.title}`
                              : `Enable ${resource.title}`
                          }
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(next) =>
                            toggleResource(resource.urlPattern, next)
                          }
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {!isManage && !autoProvisions && (
            <div
              className="relative mt-5 overflow-hidden rounded-lg border border-kumo-line px-4 py-3"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255, 72, 1, 0.04) 0%, rgba(255, 72, 1, 0.02) 100%)",
              }}
            >
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-kumo-brand"
                  weight="duotone"
                />
                <div className="text-[12px] leading-[17px] font-normal tracking-[-0.2px] text-kumo-default">
                  <span className="font-medium">
                    {language === "th" ? `Gatekeeper ทำหน้าที่เป็นตัวกลางความปลอดภัยระหว่าง ${vendorDisplayName} และชิ้นงานของคุณ` : `Gatekeeper sits between ${vendorDescription.displayName} and your Gadgets.`}
                  </span>{" "}
                  <span className="text-kumo-subtle">
                    {language === "th" ? "แต่ละชิ้นงานจะเข้าถึงได้เฉพาะข้อมูลที่คุณอนุญาตเท่านั้น หากแชร์พื้นที่ทำงาน Gatekeeper จะตรวจสอบสิทธิ์ของผู้ใช้อื่นก่อนเสมอ" : "Each Gadget only sees the resources you connect. If the workspace is shared, Gatekeeper verifies other users have the required permissions before they can access those resources."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isManage && (
            <div className="mt-5 rounded-lg border border-kumo-line bg-kumo-elevated px-4 py-3 text-[12px] leading-[17px] font-normal tracking-[-0.2px] text-kumo-subtle">
              {language === "th" ? "บัญชีนี้สามารถใช้งานร่วมกับชิ้นงานที่คุณเชื่อมต่อไว้ ผู้ใช้ร่วมจะต้องมีสิทธิ์ที่จำเป็นก่อนจึงจะเข้าถึงแหล่งข้อมูลที่เชื่อมต่อได้" : "This account can be used by Gadgets you connect it to. Shared users must have the required permissions before they can access those connected resources."}
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-kumo-line bg-kumo-base px-5 py-3">
          {isManage && confirmingDisconnect ? (
            <p className="m-0 min-w-0 flex-1 text-[12px] leading-4 font-normal tracking-[-0.2px] text-kumo-default">
              {language === "th" ? `ต้องการยกเลิกการเชื่อมต่อ ${vendorDisplayName} หรือไม่? ชิ้นงานที่ใช้การเชื่อมต่อนี้จะไม่สามารถเข้าถึงข้อมูลได้` : `Disconnect ${vendorDescription.displayName}? Gadgets using this will lose access.`}
            </p>
          ) : isManage && hasPending ? (
            <p className="m-0 min-w-0 flex-1 text-[12px] leading-4 font-normal tracking-[-0.2px] text-kumo-subtle">
              {language === "th" ? `มี ${pendingPatterns.length} แหล่งข้อมูลที่รอการเพิ่ม` : `${pendingPatterns.length} resource${pendingPatterns.length === 1 ? "" : "s"} to add`}
            </p>
          ) : !isManage && granular && noneSelected ? (
            <p className="m-0 min-w-0 flex-1 text-[12px] leading-4 font-normal tracking-[-0.2px] text-kumo-subtle">
              {language === "th" ? "โปรดเลือกอย่างน้อยหนึ่งแหล่งข้อมูลเพื่อดำเนินการต่อ" : "Select at least one resource to continue."}
            </p>
          ) : (
            <span aria-hidden />
          )}
          <div className="flex items-center gap-2">
            {isManage ? (
              <>
                {confirmingDisconnect ? (
                  <>
                    <WorkshopButton
                      onClick={() => setConfirmingDisconnect(false)}
                      disabled={disconnecting}
                      className="!h-9"
                    >
                      {language === "th" ? "ยกเลิก" : "Cancel"}
                    </WorkshopButton>
                    <WorkshopButton
                      tone="danger"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="!h-9 min-w-[140px]"
                    >
                      {disconnecting ? (language === "th" ? "กำลังยกเลิก..." : "Disconnecting...") : (language === "th" ? "ยืนยันยกเลิกการเชื่อมต่อ" : "Yes, disconnect")}
                    </WorkshopButton>
                  </>
                ) : hasPending ? (
                  <>
                    <WorkshopButton onClick={discardPending} disabled={ensuringBusy} className="!h-9">
                      {language === "th" ? "ยกเลิก" : "Cancel"}
                    </WorkshopButton>
                    <WorkshopButton
                      tone="primary"
                      onClick={handleAddResources}
                      disabled={ensuringBusy}
                      className="min-w-[140px]"
                    >
                      {ensuringBusy
                        ? (language === "th" ? "กำลังเปิด..." : "Opening...")
                        : (language === "th" ? `ดำเนินการต่อใน ${vendorDisplayName}` : `Continue to ${vendorDescription.displayName}`)}
                    </WorkshopButton>
                  </>
                ) : (
                  <>
                    <Dialog.Close
                      render={(props) => (
                        <WorkshopButton {...props} className="!h-9">
                          {language === "th" ? "ปิด" : "Close"}
                        </WorkshopButton>
                      )}
                    />
                    <WorkshopButton
                      tone="danger"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="!h-9"
                    >
                      {language === "th" ? "ยกเลิกการเชื่อมต่อ" : "Disconnect"}
                    </WorkshopButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Dialog.Close
                  render={(props) => (
                    <WorkshopButton {...props} disabled={connecting} className="!h-9">
                      {language === "th" ? "ยกเลิก" : "Cancel"}
                    </WorkshopButton>
                  )}
                />
                <WorkshopButton
                  tone="primary"
                  onClick={handleConfirm}
                  disabled={connecting || (granular && noneSelected)}
                  className="min-w-[140px]"
                >
                  {autoProvisions
                    ? connecting
                      ? (language === "th" ? "กำลังเพิ่ม..." : "Adding...")
                      : (language === "th" ? `เพิ่ม ${vendorDisplayName}` : `Add ${vendorDescription.displayName}`)
                    : connecting
                    ? (language === "th" ? "กำลังเปิด..." : "Opening...")
                    : (language === "th" ? `ดำเนินการต่อใน ${vendorDisplayName}` : `Continue to ${vendorDescription.displayName}`)}
                </WorkshopButton>
              </>
            )}
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  )
}

function ResourceIconGlyph() {
  const size = 14
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  )
}
