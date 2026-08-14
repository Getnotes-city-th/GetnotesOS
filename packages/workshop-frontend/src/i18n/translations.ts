export type Language = 'th' | 'en'

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
  exampleTask1Title: string
  exampleTask1Desc: string
  exampleTask2Title: string
  exampleTask2Desc: string
  exampleTask3Title: string
  exampleTask3Desc: string
  exampleTask4Title: string
  exampleTask4Desc: string

  // Settings & General
  languageSettings: string
  languageSettingsDesc: string
  appearance: string
  connections: string
  connectionsDesc: string
  save: string
  cancel: string
  delete: string
  edit: string
  create: string
  newWorkspace: string
  newBlueprint: string
  close: string
  back: string
  loading: string
  success: string
  error: string
}

export const translations: Record<Language, TranslationDictionary> = {
  th: {
    // Navigation & Shell
    home: 'หน้าแรก',
    workspaces: 'พื้นที่ทำงาน',
    blueprints: 'แม่แบบพิมพ์เขียว',
    outputs: 'ผลงานที่สร้าง',
    explore: 'สำรวจ',
    gatekeepers: 'ตัวเชื่อมต่อ',
    favorites: 'รายการโปรด',
    favoriteEmpty: 'กดถูกใจพื้นที่ทำงานเพื่อนำมาไว้ที่นี่',
    recentWorkspaces: 'พื้นที่ทำงานล่าสุด',
    noRecentWorkspaces: 'ยังไม่มีพื้นที่ทำงาน',
    search: 'ค้นหา',
    searchPlaceholder: 'ค้นหาด่วน... (⌘K)',
    collapseSidebar: 'ย่อแถบข้าง',
    expandSidebar: 'ขยายแถบข้าง',
    theme: 'ธีมการแสดงผล',
    themeLight: 'สว่าง',
    themeDark: 'มืด',
    themeSystem: 'ตามระบบ',
    language: 'ภาษา (Language)',
    languageThai: 'ภาษาไทย (TH)',
    languageEnglish: 'English (EN)',
    profile: 'โปรไฟล์',
    settings: 'การตั้งค่า',
    admin: 'ผู้ดูแลระบบ',
    signOut: 'ออกจากระบบ',

    // Home Page
    heroTitle: 'วันนี้ต้องการให้ GetnotesOS ช่วยทำอะไรดีครับ?',
    heroSubtitle: 'ถามคำถาม สร้างผลงาน หรือสร้างแอปที่ทำงานร่วมกับเครื่องมือและข้อมูลของคุณ',
    chatPlaceholder: 'พิมพ์เพื่อเริ่มบทสนทนาใหม่…',
    chatOptions: 'ตัวเลือกการแชท',
    addResource: 'เพิ่มแหล่งข้อมูล',
    selectModel: 'เลือกโมเดล AI',
    noAgent: 'ไม่ได้เลือก AI',
    sendMessage: 'ส่งข้อความ',
    getStarted: 'เริ่มต้นใช้งาน',
    exampleTask1Title: 'สร้างแอปเครื่องมือด่วน',
    exampleTask1Desc: 'แอปขนาดเล็กสำหรับโต้ตอบ เครื่องคิดเลข หรือหน้า Dashboard',
    exampleTask2Title: 'สร้างสไลด์นำเสนอประชุมทีม',
    exampleTask2Desc: 'สไลด์สรุปความคืบหน้า ความเสี่ยง และเรื่องที่ต้องตัดสินใจ',
    exampleTask3Title: 'สร้างเอกสารสรุปก่อนประชุม 1:1',
    exampleTask3Desc: 'เอกสารสรุปภาพรวม สิ่งที่ต้องตรวจสอบ และคำร้องขอสำคัญ',
    exampleTask4Title: 'ทำงานอัตโนมัติ',
    exampleTask4Desc: 'สั่งให้ Agent ทำงานอัตโนมัติเมื่อมีอีเมลใหม่เข้ามา',

    // Settings & General
    languageSettings: 'การตั้งค่าภาษา / Language Settings',
    languageSettingsDesc: 'เลือกภาษาที่แสดงในระบบ GetnotesOS',
    appearance: 'รูปลักษณ์และธีม',
    connections: 'การเชื่อมต่อภายนอก',
    connectionsDesc: 'เชื่อมต่อบัญชีกับบริการต่างๆ เพื่อให้ AI ดึงข้อมูลและทำงานร่วมกันได้',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    create: 'สร้างใหม่',
    newWorkspace: 'สร้างพื้นที่ทำงานใหม่',
    newBlueprint: 'สร้างแม่แบบใหม่',
    close: 'ปิด',
    back: 'ย้อนกลับ',
    loading: 'กำลังโหลด...',
    success: 'สำเร็จ',
    error: 'เกิดข้อผิดพลาด',
  },
  en: {
    // Navigation & Shell
    home: 'Home',
    workspaces: 'Workspaces',
    blueprints: 'Blueprints',
    outputs: 'Outputs',
    explore: 'Explore',
    gatekeepers: 'Gatekeepers',
    favorites: 'FAVORITES',
    favoriteEmpty: 'Favorite a workspace to keep it here.',
    recentWorkspaces: 'RECENT WORKSPACES',
    noRecentWorkspaces: 'No workspaces yet.',
    search: 'Search',
    searchPlaceholder: 'Quick search... (⌘K)',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    language: 'Language',
    languageThai: 'ภาษาไทย (TH)',
    languageEnglish: 'English (EN)',
    profile: 'Profile',
    settings: 'Settings',
    admin: 'Admin',
    signOut: 'Sign out',

    // Home Page
    heroTitle: 'What are we working on?',
    heroSubtitle: 'Ask a question, create an output, or create an app that works with your tools and data.',
    chatPlaceholder: 'Start a new conversation…',
    chatOptions: 'Open chat options',
    addResource: 'Add resource',
    selectModel: 'Select model',
    noAgent: 'No agent',
    sendMessage: 'Send message',
    getStarted: 'GET STARTED',
    exampleTask1Title: 'Build a quick tool',
    exampleTask1Desc: 'A small interactive app, calculator, or dashboard',
    exampleTask2Title: 'Build a team meeting deck',
    exampleTask2Desc: 'Slides with progress, risks, and what needs a decision',
    exampleTask3Title: 'Write a 1:1 pre-read',
    exampleTask3Desc: 'A doc with a snapshot, things to inspect, and one ask',
    exampleTask4Title: 'Automate a workflow',
    exampleTask4Desc: 'Trigger an agent when a new email arrives',

    // Settings & General
    languageSettings: 'Language Settings',
    languageSettingsDesc: 'Choose the display language for GetnotesOS',
    appearance: 'Appearance',
    connections: 'Connections',
    connectionsDesc: 'Connect external accounts to let AI read and write data with your tools',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    newWorkspace: 'New workspace',
    newBlueprint: 'New blueprint',
    close: 'Close',
    back: 'Back',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
  },
}
