import { useState, useEffect, useMemo } from 'react'
import { RpcStub } from 'capnweb'
import { Button, Input, DropdownMenu, Dialog, useKumoToastManager } from '@cloudflare/kumo'
import {
  Users,
  ShieldCheck,
  ShieldSlash,
  Key,
  Trash,
  MagnifyingGlass,
  Prohibit,
  CheckCircle,
  ArrowsClockwise,
  User,
  DotsThreeVertical,
  LockKey,
} from '@phosphor-icons/react'
import { AdminApi, AdminRole, AdminUserSummary } from '@gadgets/workshop-shared/api'
import { useI18n } from '../../i18n/I18nContext'
import { hashPassword } from '../../passwordHash'
import { MENU_CONTENT } from '../menuStyles'
import DeleteConfirmationDialog from '../DeleteConfirmationDialog'

type PendingUserAction = {
  kind: 'suspend' | 'role'
  user: AdminUserSummary
  role?: AdminRole | null
}

export default function AdminUsersPanel({ admin, canManage = true }: { admin: RpcStub<AdminApi>; canManage?: boolean }) {
  const { language } = useI18n()
  const toasts = useKumoToastManager()

  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'admin' | 'support' | 'user'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'joined'>('recent')
  const [busyUser, setBusyUser] = useState<string | null>(null)

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState<AdminUserSummary | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

  // Delete modal state
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUserSummary | null>(null)
  const [deletingUser, setDeletingUser] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingUserAction | null>(null)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const list = await admin.listUsers()
      setUsers(list)
    } catch (err) {
      const message = language === 'th' ? 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้' : err instanceof Error ? err.message : 'Failed to load users'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [admin])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users
      .filter((u) => {
        if (roleFilter === 'owner' && u.role !== 'owner') return false
        if (roleFilter === 'admin' && u.role !== 'admin') return false
        if (roleFilter === 'support' && u.role !== 'support') return false
        if (roleFilter === 'user' && u.role !== null) return false
        if (statusFilter === 'active' && u.suspended) return false
        if (statusFilter === 'suspended' && !u.suspended) return false
        if (!q) return true
        return u.username.toLowerCase().includes(q) || (u.displayName && u.displayName.toLowerCase().includes(q))
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.displayName || a.username).localeCompare(b.displayName || b.username)
        if (sortBy === 'joined') return b.createdAt.localeCompare(a.createdAt)
        return (b.lastLoginAt || '').localeCompare(a.lastLoginAt || '')
      })
  }, [users, search, roleFilter, statusFilter, sortBy])

  const totalUsers = users.length
  const totalAdmins = users.filter((u) => u.isAdmin).length
  const totalSuspended = users.filter((u) => u.suspended).length

  const handleSetRole = async (user: AdminUserSummary, role: AdminRole | null) => {
    if (user.role === role) return
    try {
      setBusyUser(user.username)
      await admin.setUserRole(user.username, role)
      setUsers((prev) => prev.map((u) => u.username === user.username
        ? { ...u, role, isAdmin: role !== null }
        : u))
      toasts.add({
        title: language === 'th'
          ? `เปลี่ยนบทบาท @${user.username} เป็น ${role === 'admin' ? 'แอดมิน' : role === 'support' ? 'ซัพพอร์ต' : 'ผู้ใช้ทั่วไป'} แล้ว`
          : `Changed @${user.username} to ${role ?? 'User'}`,
        variant: 'success',
      })
    } catch (err) {
      const message = language === 'th' ? 'ไม่สามารถเปลี่ยนบทบาทผู้ใช้ได้' : err instanceof Error ? err.message : 'Failed to change user role'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setBusyUser(null)
    }
  }

  const handleToggleSuspended = async (user: AdminUserSummary) => {
    try {
      setBusyUser(user.username)
      const nextSuspended = !user.suspended
      await admin.setUserSuspended(user.username, nextSuspended)
      setUsers((prev) =>
        prev.map((u) => (u.username === user.username ? { ...u, suspended: nextSuspended } : u))
      )
      toasts.add({
        title:
          language === 'th'
            ? `${nextSuspended ? 'ระงับ' : 'ปลดระงับ'} บัญชี @${user.username} เรียบร้อยแล้ว`
            : `Account @${user.username} ${nextSuspended ? 'suspended' : 'unsuspended'}`,
        variant: 'success',
      })
    } catch (err) {
      const message = language === 'th' ? 'ไม่สามารถอัปเดตสถานะบัญชีได้' : err instanceof Error ? err.message : 'Failed to update account status'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setBusyUser(null)
    }
  }

  const confirmPendingAction = async () => {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)
    if (action.kind === 'role') await handleSetRole(action.user, action.role ?? null)
    else await handleToggleSuspended(action.user)
  }

  const handleResetPassword = async () => {
    if (!resetModalUser) return
    if (!newPassword) {
      toasts.add({
        title: language === 'th' ? 'กรุณาระบุรหัสผ่านใหม่' : 'Please enter a new password',
        variant: 'error',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      toasts.add({
        title: language === 'th' ? 'รหัสผ่านยืนยันไม่ตรงกัน' : 'Passwords do not match',
        variant: 'error',
      })
      return
    }

    try {
      setResettingPassword(true)
      const hash = await hashPassword(resetModalUser.username, newPassword)
      await admin.resetUserPassword(resetModalUser.username, hash)
      toasts.add({
        title:
          language === 'th'
            ? `รีเซ็ตรหัสผ่านของ @${resetModalUser.username} เรียบร้อยแล้ว`
            : `Password reset successfully for @${resetModalUser.username}`,
        variant: 'success',
      })
      setResetModalUser(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const message = language === 'th' ? 'ไม่สามารถรีเซ็ตรหัสผ่านได้' : err instanceof Error ? err.message : 'Failed to reset password'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setResettingPassword(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return
    try {
      setDeletingUser(true)
      await admin.deleteUser(deleteModalUser.username)
      setUsers((prev) => prev.filter((u) => u.username !== deleteModalUser.username))
      toasts.add({
        title:
          language === 'th'
            ? `ลบบัญชี @${deleteModalUser.username} เรียบร้อยแล้ว`
            : `Deleted account @${deleteModalUser.username}`,
        variant: 'success',
      })
      setDeleteModalUser(null)
    } catch (err) {
      const message = language === 'th' ? 'ไม่สามารถลบบัญชีผู้ใช้ได้' : err instanceof Error ? err.message : 'Failed to delete user'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setDeletingUser(false)
    }
  }

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return language === 'th' ? 'ไม่มีข้อมูล' : 'Never'
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-kumo-tint text-kumo-brand">
            <Users size={24} weight="bold" />
          </div>
          <div>
            <p className="text-xs font-medium text-kumo-subtle uppercase tracking-wider">
              {language === 'th' ? 'ผู้ใช้ทั้งหมด' : 'Total Users'}
            </p>
            <p className="text-2xl font-bold text-kumo-strong mt-0.5">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-kumo-warning-tint text-kumo-warning">
            <ShieldCheck size={24} weight="bold" />
          </div>
          <div>
            <p className="text-xs font-medium text-kumo-subtle uppercase tracking-wider">
              {language === 'th' ? 'ผู้ดูแลระบบ' : 'Admins'}
            </p>
            <p className="text-2xl font-bold text-kumo-strong mt-0.5">{totalAdmins}</p>
          </div>
        </div>

        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-kumo-danger-tint text-kumo-danger">
            <Prohibit size={24} weight="bold" />
          </div>
          <div>
            <p className="text-xs font-medium text-kumo-subtle uppercase tracking-wider">
              {language === 'th' ? 'บัญชีถูกระงับ' : 'Suspended'}
            </p>
            <p className="text-2xl font-bold text-kumo-strong mt-0.5">{totalSuspended}</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-kumo-subtle pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === 'th'
                ? 'ค้นหาด้วยชื่อหรือ @username…'
                : 'Search by name or @username…'
            }
            className="pl-9 w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className="h-9 rounded-md border border-kumo-line bg-kumo-elevated px-2.5 text-xs text-kumo-default"
            aria-label={language === 'th' ? 'กรองบทบาท' : 'Filter role'}
          >
            <option value="all">{language === 'th' ? 'ทุกบทบาท' : 'All roles'}</option>
            <option value="owner">{language === 'th' ? 'เจ้าของระบบ' : 'Owner'}</option>
            <option value="admin">{language === 'th' ? 'แอดมิน' : 'Admins'}</option>
            <option value="support">{language === 'th' ? 'ซัพพอร์ต' : 'Support'}</option>
            <option value="user">{language === 'th' ? 'ผู้ใช้ทั่วไป' : 'Users'}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-9 rounded-md border border-kumo-line bg-kumo-elevated px-2.5 text-xs text-kumo-default"
            aria-label={language === 'th' ? 'กรองสถานะ' : 'Filter status'}
          >
            <option value="all">{language === 'th' ? 'ทุกสถานะ' : 'All statuses'}</option>
            <option value="active">{language === 'th' ? 'ปกติ' : 'Active'}</option>
            <option value="suspended">{language === 'th' ? 'ถูกระงับ' : 'Suspended'}</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-9 rounded-md border border-kumo-line bg-kumo-elevated px-2.5 text-xs text-kumo-default"
            aria-label={language === 'th' ? 'เรียงผู้ใช้' : 'Sort users'}
          >
            <option value="recent">{language === 'th' ? 'เข้าสู่ระบบล่าสุด' : 'Most recent login'}</option>
            <option value="name">{language === 'th' ? 'ชื่อ' : 'Name'}</option>
            <option value="joined">{language === 'th' ? 'วันที่สมัคร' : 'Joined date'}</option>
          </select>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadUsers}
          disabled={loading}
          icon={ArrowsClockwise}
          className={loading ? 'animate-spin' : ''}
        >
          {language === 'th' ? 'รีเฟรช' : 'Refresh'}
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-kumo-elevated border border-kumo-line rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-kumo-line bg-kumo-tint/50 text-kumo-subtle text-xs font-medium uppercase tracking-wider">
                <th scope="col" className="px-5 py-3.5">{language === 'th' ? 'ผู้ใช้' : 'User'}</th>
                <th scope="col" className="px-5 py-3.5">{language === 'th' ? 'บทบาท' : 'Role'}</th>
                <th scope="col" className="px-5 py-3.5">{language === 'th' ? 'สถานะ' : 'Status'}</th>
                <th scope="col" className="px-5 py-3.5">{language === 'th' ? 'เข้าสู่ระบบล่าสุด' : 'Last Login'}</th>
                <th scope="col" className="px-5 py-3.5">{language === 'th' ? 'วันที่สมัคร' : 'Joined'}</th>
                <th scope="col" className="px-5 py-3.5 text-right">{language === 'th' ? 'จัดการ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kumo-line">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-kumo-subtle">
                    <ArrowsClockwise size={24} className="animate-spin mx-auto mb-2 text-kumo-brand" />
                    {language === 'th' ? 'กำลังโหลดรายชื่อผู้ใช้...' : 'Loading users...'}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-kumo-subtle">
                    <User size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-kumo-default">
                      {language === 'th' ? 'ไม่พบผู้ใช้งาน' : 'No users found'}
                    </p>
                    <p className="text-xs mt-1">
                      {search
                        ? language === 'th'
                          ? 'ลองเปลี่ยนคำค้นหา'
                          : 'Try changing your search terms'
                        : language === 'th'
                          ? 'ยังไม่มีผู้ใช้งานลงทะเบียนในระบบ'
                          : 'No registered accounts yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isBusy = busyUser === user.username
                  const initial = (user.displayName || user.username).charAt(0).toUpperCase()

                  return (
                    <tr
                      key={user.username}
                      className="hover:bg-kumo-tint/40 transition-colors duration-150"
                    >
                      {/* User Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm bg-gradient-to-br from-kumo-brand/20 to-kumo-brand/10 text-kumo-brand border border-kumo-brand/20 shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-kumo-strong truncate">
                              {user.displayName || user.username}
                            </div>
                            <div className="text-xs text-kumo-subtle truncate">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.role === 'owner'
                            ? 'bg-kumo-brand/10 text-kumo-brand border-kumo-brand/20'
                            : user.role === 'admin'
                              ? 'bg-kumo-warning-tint text-kumo-warning border-kumo-warning/20'
                              : user.role === 'support'
                                ? 'bg-kumo-info-tint text-kumo-info border-kumo-info/20'
                                : 'bg-kumo-tint text-kumo-subtle border-kumo-line'
                        }`}>
                          {user.role === 'owner' || user.role === 'admin' ? <ShieldCheck size={12} weight="bold" /> : user.role === 'support' ? <ShieldSlash size={12} /> : <User size={12} />}
                          {user.role === 'owner'
                            ? language === 'th' ? 'เจ้าของระบบ' : 'Owner'
                            : user.role === 'admin'
                              ? language === 'th' ? 'แอดมิน' : 'Admin'
                              : user.role === 'support'
                                ? language === 'th' ? 'ซัพพอร์ต' : 'Support'
                                : language === 'th' ? 'ผู้ใช้ทั่วไป' : 'User'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        {user.suspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-kumo-danger-tint text-kumo-danger border border-kumo-danger/20">
                            <Prohibit size={12} weight="bold" />
                            {language === 'th' ? 'ถูกระงับ' : 'Suspended'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-kumo-success-tint text-kumo-success border border-kumo-success/20">
                            <CheckCircle size={12} weight="fill" />
                            {language === 'th' ? 'ปกติ' : 'Active'}
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="px-5 py-3.5 text-xs text-kumo-subtle whitespace-nowrap">
                        {formatDate(user.lastLoginAt)}
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-3.5 text-xs text-kumo-subtle whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions Menu */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {canManage && user.role !== 'owner' ? <DropdownMenu>
                          <DropdownMenu.Trigger
                            render={(props) => (
                              <Button
                                {...props}
                                variant="ghost"
                                size="sm"
                                disabled={isBusy}
                                icon={DotsThreeVertical}
                                aria-label={
                                  language === 'th'
                                    ? `การดำเนินการสำหรับ @${user.username}`
                                    : `Actions for @${user.username}`
                                }
                                className="!p-1.5 text-kumo-subtle hover:text-kumo-default"
                              />
                            )}
                          />
                          <DropdownMenu.Content
                            className={MENU_CONTENT}
                            align="end"
                          >
                            <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-xs rounded-md cursor-pointer text-kumo-default hover:bg-kumo-tint" onClick={() => setPendingAction({ kind: 'role', user, role: 'admin' })}>
                              <ShieldCheck size={14} className="text-kumo-warning" />
                              <span>{language === 'th' ? 'กำหนดเป็นแอดมิน' : 'Set as Admin'}</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-xs rounded-md cursor-pointer text-kumo-default hover:bg-kumo-tint" onClick={() => setPendingAction({ kind: 'role', user, role: 'support' })}>
                              <ShieldSlash size={14} className="text-kumo-info" />
                              <span>{language === 'th' ? 'กำหนดเป็นซัพพอร์ต' : 'Set as Support'}</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-xs rounded-md cursor-pointer text-kumo-default hover:bg-kumo-tint" onClick={() => setPendingAction({ kind: 'role', user, role: null })}>
                              <User size={14} className="text-kumo-subtle" />
                              <span>{language === 'th' ? 'กำหนดเป็นผู้ใช้ทั่วไป' : 'Set as User'}</span>
                            </DropdownMenu.Item>

                            {/* Reset Password */}
                            <DropdownMenu.Item
                              className="flex items-center gap-2 px-3 py-2 text-xs rounded-md cursor-pointer text-kumo-default hover:bg-kumo-tint"
                              onClick={() => {
                                setResetModalUser(user)
                                setNewPassword('')
                                setConfirmPassword('')
                              }}
                            >
                              <Key size={14} className="text-kumo-brand" />
                              <span>{language === 'th' ? 'รีเซ็ตรหัสผ่าน' : 'Reset Password'}</span>
                            </DropdownMenu.Item>

                            {/* Toggle Suspended */}
                            <DropdownMenu.Item
                              className="flex items-center gap-2 px-3 py-2 text-xs rounded-md cursor-pointer text-kumo-default hover:bg-kumo-tint"
                              onClick={() => setPendingAction({ kind: 'suspend', user })}
                            >
                              {user.suspended ? (
                                <>
                                  <CheckCircle size={14} className="text-kumo-success" />
                                  <span>{language === 'th' ? 'ปลดการระงับบัญชี' : 'Unsuspend Account'}</span>
                                </>
                              ) : (
                                <>
                                  <Prohibit size={14} className="text-kumo-danger" />
                                  <span>{language === 'th' ? 'ระงับบัญชี' : 'Suspend Account'}</span>
                                </>
                              )}
                            </DropdownMenu.Item>

                            <DropdownMenu.Separator className="h-px bg-kumo-line my-1" />

                            {/* Delete User */}
                            <DropdownMenu.Item
                              className="flex items-center gap-2 px-3 py-2 text-xs rounded-md cursor-pointer text-kumo-danger hover:bg-kumo-danger-tint"
                              onClick={() => setDeleteModalUser(user)}
                            >
                              <Trash size={14} />
                              <span>{language === 'th' ? 'ลบบัญชีผู้ใช้' : 'Delete Account'}</span>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu> : <span className="text-xs text-kumo-subtle">{language === 'th' ? 'ดูอย่างเดียว' : 'View only'}</span>}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingAction && (
        <DeleteConfirmationDialog
          open={!!pendingAction}
          title={pendingAction.kind === 'suspend'
            ? pendingAction.user.suspended
              ? (language === 'th' ? `ปลดระงับ @${pendingAction.user.username}?` : `Unsuspend @${pendingAction.user.username}?`)
              : (language === 'th' ? `ระงับ @${pendingAction.user.username}?` : `Suspend @${pendingAction.user.username}?`)
            : (language === 'th' ? `เปลี่ยนบทบาท @${pendingAction.user.username}?` : `Change @${pendingAction.user.username}'s role?`)}
          description={pendingAction.kind === 'suspend'
            ? (language === 'th' ? 'ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้ขณะถูกระงับ' : 'A suspended user cannot sign in until the account is restored.')
            : (language === 'th' ? 'การเปลี่ยนบทบาทจะมีผลกับสิทธิ์การเข้าถึงหน้าแอดมินทันที' : 'The new role changes this user’s admin access immediately.')}
          confirmLabel={language === 'th' ? 'ยืนยัน' : 'Confirm'}
          confirmingLabel={language === 'th' ? 'กำลังบันทึก...' : 'Saving...'}
          isDeleting={!!busyUser}
          onOpenChange={(open) => { if (!open && !busyUser) setPendingAction(null) }}
          onConfirm={confirmPendingAction}
        />
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <Dialog.Root
          open={!!resetModalUser}
          onOpenChange={(open) => {
            if (!open && !resettingPassword) setResetModalUser(null)
          }}
        >
          <Dialog className="!z-[1000] !w-[min(440px,calc(100vw-32px))] bg-kumo-base p-6 rounded-xl border border-kumo-line shadow-lg !top-[20%] !-translate-y-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-kumo-tint text-kumo-brand">
                <LockKey size={20} weight="bold" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-kumo-strong">
                  {language === 'th' ? 'รีเซ็ตรหัสผ่านผู้ใช้' : 'Reset User Password'}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-kumo-subtle">
                  @{resetModalUser.username} ({resetModalUser.displayName || resetModalUser.username})
                </Dialog.Description>
              </div>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <label className="block text-xs font-medium text-kumo-subtle mb-1.5">
                  {language === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-kumo-subtle mb-1.5">
                  {language === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'}
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResetModalUser(null)}
                disabled={resettingPassword}
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleResetPassword}
                disabled={resettingPassword || !newPassword}
              >
                {resettingPassword
                  ? language === 'th'
                    ? 'กำลังรีเซ็ต...'
                    : 'Resetting...'
                  : language === 'th'
                    ? 'ยืนยันการรีเซ็ต'
                    : 'Set New Password'}
              </Button>
            </div>
          </Dialog>
        </Dialog.Root>
      )}

      {/* Delete User Dialog */}
      {deleteModalUser && (
        <DeleteConfirmationDialog
          open={!!deleteModalUser}
          title={
            language === 'th'
              ? `ลบบัญชี @${deleteModalUser.username}?`
              : `Delete account @${deleteModalUser.username}?`
          }
          description={
            language === 'th'
              ? `การดำเนินการนี้จะลบข้อมูลส่วนตัวและ Workspace ทั้งหมดของ @${deleteModalUser.username} อย่างถาวร และไม่สามารถกู้คืนได้`
              : `This will permanently delete @${deleteModalUser.username} along with all their workspaces and stored data. This action cannot be undone.`
          }
          isDeleting={deletingUser}
          onOpenChange={(open) => {
            if (!open && !deletingUser) setDeleteModalUser(null)
          }}
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  )
}
