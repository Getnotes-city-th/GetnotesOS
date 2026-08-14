export type Language = "th" | "en"

export interface TranslationDictionary {
  // Navigation & Shell
  home: string
  workspaces: string
  blueprints: string
  outputs: string
  explore: string
  gatekeepers: string
  favorites: string
  favoriteEmpty: string
  recentWorkspaces: string
  noRecentWorkspaces: string
  search: string
  searchPlaceholder: string
  collapseSidebar: string
  expandSidebar: string
  theme: string
  themeLight: string
  themeDark: string
  themeSystem: string
  language: string
  languageThai: string
  languageEnglish: string
  profile: string
  settings: string
  admin: string
  signOut: string
  providers: string
  share: string

  // Command Palette (⌘K)
  palettePlaceholder: string
  paletteEmpty: string
  paletteNewWorkspace: string

  // Home Page
  heroTitle: string
  heroSubtitle: string
  chatPlaceholder: string
  chatOptions: string
  addResource: string
  selectModel: string
  noAgent: string
  sendMessage: string
  getStarted: string

  // Workspaces Page
  workspacesTitle: string
  workspacesSubtitle: string
  createWorkspace: string
  yourWorkspaces: string
  noWorkspacesMatch: string
  unfavorite: string
  favoriteAction: string
  rename: string
  shareWorkspace: string
  deleteWorkspace: string

  // Blueprints Page
  blueprintsTitle: string
  blueprintsSubtitle: string
  createBlueprint: string
  featuredBlueprints: string
  searchBlueprints: string
  upload: string
  uploading: string
  exploreAction: string
  removeFromLibrary: string

  // Outputs Page
  outputsTitle: string
  outputsSubtitle: string
  searchOutputs: string
  allOutputs: string
  noOutputsYet: string

  // Explore Page
  exploreTitle: string
  exploreSubtitle: string

  // Gatekeepers Page
  gatekeepersTitle: string
  gatekeepersSubtitle: string
  searchGatekeepers: string
  connectedGatekeepers: string
  availableGatekeepers: string
  connect: string
  disconnect: string
  manage: string

  // Providers Page
  providersTitle: string
  providersSubtitle: string
  addProvider: string
  searchProviders: string

  // Profile & Settings
  profileTitle: string
  profileSubtitle: string
  account: string
  displayName: string
  editDisplayName: string
  saveDisplayName: string
  userId: string
  copyUserId: string
  languageSettings: string
  languageSettingsDesc: string
  security: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  changePassword: string
  appearance: string
  connections: string
  connectionsDesc: string

  // Workspace Editor & Tabs
  code: string
  needsReview: string
  autoApproval: string
  history: string
  fullScreen: string
  hideThinking: string
  showThinking: string
  thinking: string
  copyMessage: string
  copied: string
  stopGeneration: string

  // Auth
  signIn: string
  signUp: string
  username: string
  password: string
  noAccountPrompt: string
  hasAccountPrompt: string
  createAccount: string
  loginFailed: string

  // General Controls
  save: string
  cancel: string
  delete: string
  edit: string
  create: string
  close: string
  back: string
  loading: string
  success: string
  error: string
}

export const translations: Record<Language, TranslationDictionary> = {
  th: {
    // Navigation & Shell
    home: "หน้าแรก",
    workspaces: "พื้นที่ทำงาน",
    blueprints: "แม่แบบพิมพ์เขียว",
    outputs: "ผลงานที่สร้าง",
    explore: "สำรวจ",
    gatekeepers: "ตัวเชื่อมต่อ",
    favorites: "รายการโปรด",
    favoriteEmpty: "กดถูกใจพื้นที่ทำงานเพื่อนำมาไว้ที่นี่",
    recentWorkspaces: "พื้นที่ทำงานล่าสุด",
    noRecentWorkspaces: "ยังไม่มีพื้นที่ทำงาน",
    search: "ค้นหา",
    searchPlaceholder: "ค้นหาด่วน... (⌘K)",
    collapseSidebar: "ย่อแถบข้าง",
    expandSidebar: "ขยายแถบข้าง",
    theme: "ธีมการแสดงผล",
    themeLight: "สว่าง",
    themeDark: "มืด",
    themeSystem: "ตามระบบ",
    language: "ภาษา (Language)",
    languageThai: "ภาษาไทย (TH)",
    languageEnglish: "English (EN)",
    profile: "โปรไฟล์",
  providers: "ผู้ให้บริการ AI",
  share: "แชร์พื้นที่ทำงาน",
    settings: "การตั้งค่า",
    admin: "ผู้ดูแลระบบ",
    signOut: "ออกจากระบบ",

    // Command Palette (⌘K)
    palettePlaceholder: "พิมพ์คำค้นหาพื้นที่ทำงาน, แม่แบบ หรือพิมพ์คำสั่ง...",
    paletteEmpty: "ไม่พบผลการค้นหา",
    paletteNewWorkspace: "สร้างพื้นที่ทำงานใหม่",

    // Home Page
    heroTitle: "วันนี้ต้องการให้ GetnotesOS ช่วยทำอะไรดีครับ?",
    heroSubtitle: "ถามคำถาม สร้างผลงาน หรือสร้างแอปที่ทำงานร่วมกับเครื่องมือและข้อมูลของคุณ",
    chatPlaceholder: "พิมพ์เพื่อเริ่มบทสนทนาใหม่…",
    chatOptions: "ตัวเลือกการแชท",
    addResource: "เพิ่มแหล่งข้อมูล",
    selectModel: "เลือกโมเดล AI",
    noAgent: "ไม่ได้เลือก AI",
    sendMessage: "ส่งข้อความ",
    getStarted: "เริ่มต้นใช้งาน",

    // Workspaces Page
    workspacesTitle: "พื้นที่ทำงาน",
    workspacesSubtitle: "แต่ละพื้นที่ทำงานเป็นสภาพแวดล้อมเฉพาะ พร้อมการสนทนา ตัวเชื่อมต่อ และผลงานที่แยกจากกัน",
    createWorkspace: "สร้างพื้นที่ทำงานใหม่",
    yourWorkspaces: "พื้นที่ทำงานของคุณ",
    noWorkspacesMatch: "ไม่พบพื้นที่ทำงานที่ตรงกัน",
    unfavorite: "ยกเลิกรายการโปรด",
    favoriteAction: "เพิ่มในรายการโปรด",
    rename: "เปลี่ยนชื่อ",
    shareWorkspace: "แชร์พื้นที่ทำงาน",
    deleteWorkspace: "ลบพื้นที่ทำงาน",

    // Blueprints Page
    blueprintsTitle: "แม่แบบพิมพ์เขียว",
    blueprintsSubtitle: "จุดเริ่มต้นที่นำกลับมาใช้ใหม่ได้ที่คุณสร้างหรือบันทึกไว้ เปิดพื้นที่ทำงานใหม่ได้ทันทีจากแม่แบบเหล่านี้",
    createBlueprint: "สร้างแม่แบบใหม่",
    featuredBlueprints: "แม่แบบแนะนำ",
    searchBlueprints: "ค้นหาแม่แบบ...",
    upload: "อัปโหลด",
    uploading: "กำลังอัปโหลด…",
    exploreAction: "สำรวจแม่แบบ",
    removeFromLibrary: "ลบออกจากคลัง",

    // Outputs Page
    outputsTitle: "ผลงานที่สร้าง",
    outputsSubtitle: "ผลงานทั้งหมดที่พื้นที่ทำงานของคุณสร้างไว้ รวมอยู่ในที่เดียว",
    searchOutputs: "ค้นหาผลงาน...",
    allOutputs: "ทั้งหมด",
    noOutputsYet: "ยังไม่มีผลงานที่สร้าง",

    // Explore Page
    exploreTitle: "สำรวจ",
    exploreSubtitle: "สำรวจแม่แบบเด่นสำหรับเริ่มต้นใช้งาน เปิดเพื่อสร้างพื้นที่ทำงานทันที หรือบันทึกเก็บไว้ใช้ภายหลัง",

    // Gatekeepers Page
    gatekeepersTitle: "ตัวเชื่อมต่อ",
    gatekeepersSubtitle: "เพิ่มแอปและบัญชีบริการที่พื้นที่ทำงานของคุณสามารถเรียกใช้ เชื่อมต่อครั้งเดียวแล้วนำไปใช้ได้กับทุกสิ่งที่คุณสร้าง",
    searchGatekeepers: "ค้นหาตัวเชื่อมต่อ…",
    connectedGatekeepers: "เชื่อมต่อแล้ว",
    availableGatekeepers: "ตัวเชื่อมต่อที่พร้อมใช้งาน",
    connect: "เชื่อมต่อ",
    disconnect: "ยกเลิกการเชื่อมต่อ",
    manage: "จัดการ",

    // Providers Page
    providersTitle: "ผู้ให้บริการ AI",
    providersSubtitle: "ตั้งค่าโมเดล AI สำหรับใช้งานในพื้นที่ทำงานของคุณ",
    addProvider: "เพิ่มผู้ให้บริการ",
    searchProviders: "ค้นหาผู้ให้บริการ…",

    // Profile & Settings
    profileTitle: "โปรไฟล์",
    profileSubtitle: "จัดการข้อมูลบัญชีผู้ใช้ รูปโปรไฟล์ และความปลอดภัย",
    account: "บัญชีผู้ใช้",
    displayName: "ชื่อที่แสดง",
    editDisplayName: "แก้ไขชื่อ",
    saveDisplayName: "บันทึกชื่อ",
    userId: "รหัสผู้ใช้ (User ID)",
    copyUserId: "คัดลอกรหัสผู้ใช้",
    languageSettings: "การตั้งค่าภาษา / Language Settings",
    languageSettingsDesc: "เลือกภาษาที่แสดงในระบบ GetnotesOS",
    security: "ความปลอดภัย",
    currentPassword: "รหัสผ่านปัจจุบัน",
    newPassword: "รหัสผ่านใหม่",
    confirmPassword: "ยืนยันรหัสผ่านใหม่",
    changePassword: "เปลี่ยนรหัสผ่าน",
    appearance: "รูปลักษณ์และธีม",
    connections: "การเชื่อมต่อภายนอก",
    connectionsDesc: "เชื่อมต่อบัญชีกับบริการต่างๆ เพื่อให้ AI ดึงข้อมูลและทำงานร่วมกันได้",

    // Workspace Editor & Tabs
    code: "โค้ด",
    needsReview: "รอการตรวจสอบ",
    autoApproval: "อนุมัติอัตโนมัติ",
    history: "ประวัติ",
    fullScreen: "เต็มจอ",
    hideThinking: "ซ่อนกระบวนการคิด",
    showThinking: "แสดงกระบวนการคิด",
    thinking: "กำลังประมวลผลความคิด…",
    copyMessage: "คัดลอกข้อความ",
    copied: "คัดลอกแล้ว",
    stopGeneration: "หยุดการทำงาน",

    // Auth
    signIn: "เข้าสู่ระบบ",
    signUp: "สร้างบัญชีใหม่",
    username: "ชื่อผู้ใช้งาน",
    password: "รหัสผ่าน",
    noAccountPrompt: "ยังไม่มีบัญชีผู้ใช้?",
    hasAccountPrompt: "มีบัญชีผู้ใช้อยู่แล้ว?",
    createAccount: "ลงทะเบียนใช้งาน",
    loginFailed: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",

    // General Controls
    save: "บันทึก",
    cancel: "ยกเลิก",
    delete: "ลบ",
    edit: "แก้ไข",
    create: "สร้างใหม่",
    close: "ปิด",
    back: "ย้อนกลับ",
    loading: "กำลังโหลด...",
    success: "สำเร็จ",
    error: "เกิดข้อผิดพลาด",
  },
  en: {
    // Navigation & Shell
    home: "Home",
    workspaces: "Workspaces",
    blueprints: "Blueprints",
    outputs: "Outputs",
    explore: "Explore",
    gatekeepers: "Gatekeepers",
    favorites: "FAVORITES",
    favoriteEmpty: "Favorite a workspace to keep it here.",
    recentWorkspaces: "RECENT WORKSPACES",
    noRecentWorkspaces: "No workspaces yet.",
    search: "Search",
    searchPlaceholder: "Quick search... (⌘K)",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    language: "Language",
    languageThai: "ภาษาไทย (TH)",
    languageEnglish: "English (EN)",
    profile: "Profile",
  providers: "Providers",
  share: "Share",
    settings: "Settings",
    admin: "Admin",
    signOut: "Sign out",

    // Command Palette (⌘K)
    palettePlaceholder: "Search workspaces, blueprints, or type a command...",
    paletteEmpty: "No matching commands or workspaces",
    paletteNewWorkspace: "New workspace",

    // Home Page
    heroTitle: "What are we working on?",
    heroSubtitle: "Ask a question, create an output, or create an app that works with your tools and data.",
    chatPlaceholder: "Start a new conversation…",
    chatOptions: "Open chat options",
    addResource: "Add resource",
    selectModel: "Select model",
    noAgent: "No agent",
    sendMessage: "Send message",
    getStarted: "GET STARTED",

    // Workspaces Page
    workspacesTitle: "Workspaces",
    workspacesSubtitle: "Each workspace is an isolated environment with its own conversations, gatekeepers, and outputs.",
    createWorkspace: "Create workspace",
    yourWorkspaces: "Your workspaces",
    noWorkspacesMatch: "No workspaces match",
    unfavorite: "Unfavorite",
    favoriteAction: "Favorite",
    rename: "Rename",
    shareWorkspace: "Share workspace",
    deleteWorkspace: "Delete workspace",

    // Blueprints Page
    blueprintsTitle: "Blueprints",
    blueprintsSubtitle: "Reusable starting points youve published or saved. Spin up a workspace from any of them.",
    createBlueprint: "New blueprint",
    featuredBlueprints: "Featured",
    searchBlueprints: "Search blueprints…",
    upload: "Upload",
    uploading: "Uploading…",
    exploreAction: "Explore",
    removeFromLibrary: "Remove from library",

    // Outputs Page
    outputsTitle: "Outputs",
    outputsSubtitle: "Everything your workspaces have produced, in one place.",
    searchOutputs: "Search outputs...",
    allOutputs: "All",
    noOutputsYet: "No outputs yet",

    // Explore Page
    exploreTitle: "Explore",
    exploreSubtitle: "Discover featured blueprints to use as starting points. Open one to create a workspace from it, or save it to reuse later.",

    // Gatekeepers Page
    gatekeepersTitle: "Gatekeepers",
    gatekeepersSubtitle: "Add the apps and accounts your workspaces can use. Connect once, then wire them into anything you build.",
    searchGatekeepers: "Search gatekeepers…",
    connectedGatekeepers: "Connected",
    availableGatekeepers: "Available gatekeepers",
    connect: "Connect",
    disconnect: "Disconnect",
    manage: "Manage",

    // Providers Page
    providersTitle: "AI providers",
    providersSubtitle: "Configure the AI models available to your workspaces.",
    addProvider: "Add provider",
    searchProviders: "Search providers…",

    // Profile & Settings
    profileTitle: "Profile",
    profileSubtitle: "Manage your account details, avatar, and security.",
    account: "Account",
    displayName: "Display name",
    editDisplayName: "Edit display name",
    saveDisplayName: "Save display name",
    userId: "User ID",
    copyUserId: "Copy user ID",
    languageSettings: "Language Settings",
    languageSettingsDesc: "Choose the display language for GetnotesOS",
    security: "Security",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    changePassword: "Change password",
    appearance: "Appearance",
    connections: "Connections",
    connectionsDesc: "Connect external accounts to let AI read and write data with your tools",

    // Workspace Editor & Tabs
    code: "Code",
    needsReview: "Needs review",
    autoApproval: "Auto-approval",
    history: "History",
    fullScreen: "Full screen",
    hideThinking: "Hide thinking",
    showThinking: "Show thinking",
    thinking: "Thinking",
    copyMessage: "Copy message",
    copied: "Copied",
    stopGeneration: "Stop",

    // Auth
    signIn: "Sign in",
    signUp: "Create account",
    username: "Username",
    password: "Password",
    noAccountPrompt: "Don't have an account?",
    hasAccountPrompt: "Already have an account?",
    createAccount: "Create one",
    loginFailed: "Invalid username or password",

    // General Controls
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    close: "Close",
    back: "Back",
    loading: "Loading...",
    success: "Success",
    error: "Error",
  },
}
