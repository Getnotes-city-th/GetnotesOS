import { Link, useRouterState } from "@tanstack/react-router"
import { Desktop, Moon, Plug, Sun, Translate } from "@phosphor-icons/react"
import { Tooltip } from "@cloudflare/kumo"
import UserMenu from "../UserMenu"
import { useTheme } from "../../ThemeContext"
import { useI18n } from "../../i18n/I18nContext"
import type { ThemeMode } from "../../theme"

const THEME_SEQUENCE: ThemeMode[] = ["system", "light", "dark"]

function nextThemeMode(mode: ThemeMode): ThemeMode {
  return THEME_SEQUENCE[(THEME_SEQUENCE.indexOf(mode) + 1) % THEME_SEQUENCE.length]
}

function ThemeModeButton() {
  const { themeMode, resolvedThemeMode, setThemeMode } = useTheme()
  const { t } = useI18n()
  const label = themeMode === "system"
    ? `${t("theme")}: ${t("themeSystem")} (${resolvedThemeMode})`
    : `${t("theme")}: ${themeMode === "dark" ? t("themeDark") : t("themeLight")}`
  const nextMode = nextThemeMode(themeMode)

  return (
    <Tooltip
      content={`${label}. ${t("theme")}: ${nextMode}`}
      render={(
        <button
          type="button"
          aria-label={`${label}. ${t("theme")}: ${nextMode}`}
          onClick={() => setThemeMode(nextMode)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-kumo-inactive transition-colors hover:bg-kumo-tint hover:text-kumo-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kumo-ring focus-visible:ring-offset-2 focus-visible:ring-offset-kumo-elevated"
        >
          {themeMode === "system" ? (
            <Desktop size={15} />
          ) : themeMode === "dark" ? (
            <Moon size={15} />
          ) : (
            <Sun size={15} />
          )}
        </button>
      )}
    />
  )
}

function LanguageButton() {
  const { language, toggleLanguage } = useI18n()
  const tooltip = language === "th" ? "ภาษา: ไทย (กดเพื่อเปลี่ยนเป็น English)" : "Language: English (Click to switch to ภาษาไทย)"

  return (
    <Tooltip
      content={tooltip}
      render={(
        <button
          type="button"
          aria-label={tooltip}
          onClick={() => toggleLanguage()}
          className="flex h-8 px-1.5 cursor-pointer items-center justify-center gap-1 rounded-md text-xs font-medium text-kumo-inactive transition-colors hover:bg-kumo-tint hover:text-kumo-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kumo-ring focus-visible:ring-offset-2 focus-visible:ring-offset-kumo-elevated"
        >
          <Translate size={14} />
          <span>{language === "th" ? "TH" : "EN"}</span>
        </button>
      )}
    />
  )
}

function StripLink({
  to,
  label,
  children,
}: {
  to: "/gatekeepers"
  label: string
  children: React.ReactNode
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const active = pathname === to
  return (
    <Tooltip content={label}>
      <Link
        to={to}
        aria-label={label}
        className={[
          "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          active
            ? "bg-kumo-fill text-kumo-brand"
            : "text-kumo-inactive hover:bg-kumo-tint hover:text-kumo-default",
        ].join(" ")}
      >
        {children}
      </Link>
    </Tooltip>
  )
}

export default function SidebarUtilityStrip({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useI18n()
  return (
    <div
      className={[
        "shrink-0 flex items-center gap-1 border-t border-kumo-line bg-kumo-elevated px-3 py-2",
        collapsed ? "flex-col justify-center gap-2 px-1.5" : "",
      ].join(" ")}
    >
      <StripLink to="/gatekeepers" label={t("gatekeepers")}>
        <Plug size={15} />
      </StripLink>
      <div className={collapsed ? "flex flex-col items-center gap-2" : "ml-auto flex items-center gap-1"}>
        <LanguageButton />
        <ThemeModeButton />
        <UserMenu />
      </div>
    </div>
  )
}
