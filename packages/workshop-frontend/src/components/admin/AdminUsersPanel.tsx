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
  Crown,
  Prohibit,
  CheckCircle,
  ArrowsClockwise,
  User,
  DotsThreeVertical,
  LockKey,
} from '@phosphor-icons/react'
import { AdminApi, AdminUserSummary } from '@gadgets/workshop-shared/api'
import { useI18n } from '../../i18n/I18nContext'
import { hashPassword } from '../../passwordHash'
import { MENU_CONTENT } from '../menuStyles'
import DeleteConfirmationDialog from '../DeleteConfirmationDialog'

export default function AdminUsersPanel({ admin }: { admin: RpcStub<AdminApi> }) {
  const { language } = useI18n()
  const toasts = useKumoToastManager()

  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busyUser, setBusyUser] = useState<string | null>(null)

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState<AdminUserSummary | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

  // Delete modal state
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUserSummary | null>(null)
  const [deletingUser, setDeletingUser] = useState(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const list = await admin.listUsers()
      setUsers(list)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
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
    if (!q) return users
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.displayName && u.displayName.toLowerCase().includes(q))
    )
  }, [users, search])

  const totalUsers = users.length
  const totalAdmins = users.filter((u) => u.isAdmin).length
  const totalSuspended = users.filter((u) => u.suspended).length

  const handleToggleAdmin = async (user: AdminUserSummary) => {
    try {
      setBusyUser(user.username)
      const nextAdmin = !user.isAdmin
      await admin.setUserAdmin(user.username, nextAdmin)
      setUsers((prev) =>
        prev.map((u) => (u.username === user.username ? { ...u, isAdmin: nextAdmin } : u))
      )
      toasts.add({
        title:
          language === 'th'
            ? `${nextAdmin ? 'แต่งตั้ง' : 'ยกเลิก'} สิทธิ์ผู้ดูแลระบบของ @${user.username} สำเร็จ`
            : `${nextAdmin ? 'Granted' : 'Revoked'} admin rights for @${user.username}`,
        variant: 'success',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update admin rights'
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
      const message = err instanceof Error ? err.message : 'Failed to update account status'
      toasts.add({ title: message, variant: 'error' })
    } finally {
      setBusyUser(null)
    }
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
      const message = err instanceof Error ? err.message : 'Failed to reset password'
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
      const message = err instanceof Error ? err.message : 'Failed to delete user'
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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
            <Crown size={24} weight="bold" />
          </div>
          <div>
            <p className="text-xs font-medium text-kumo-subtle uppercase tracking-wider">
              {language === 'th' ? 'ผู้ดูแลระบบ' : 'Admins'}
            </p>
            <p className="text-2xl font-bold text-kumo-strong mt-0.5">{totalAdmins}</p>
          </div>
        </div>

        <div className="bg-kumo-elevated border border-kumo-line rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500">
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
                ? 'ค้นหาตามชื่อ หรือ @username...'
                : 'Search by name or @username...'
            }
            className="pl-9 w-full"
          />
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
                <th className="px-5 py-3.5">{language === 'th' ? 'ผู้ใช้งาน' : 'User'}</th>
                <th className="px-5 py-3.5">{language === 'th' ? 'บทบาท' : 'Role'}</th>
                <th className="px-5 py-3.5">{language === 'th' ? 'สถานะ' : 'Status'}</th>
                <th className="px-5 py-3.5">{language === 'th' ? 'เข้าสู่ระบบล่าสุด' : 'Last Active'}</th>
                <th className="px-5 py-3.5">{language === 'th' ? 'วันที่สมัคร' : 'Joined'}</th>
                <th className="px-5 py-3.5 text-right">{language === 'th' ? 'จัดการ' : 'Actions'}</th>
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
                        {user.isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Crown size={12} weight="fill" />
                            {language === 'th' ? 'แอดมิน' : 'Admin'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-kumo-tint text-kumo-subtle border border-kumo-line">
                            <User size={12} />
                            {language === 'th' ? 'ผู้ใช้ทั่วไป' : 'Member'}
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        {user.suspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <Prohibit size={12} weight="bold" />
                            {language === 'th' ? 'ถูกระงับ' : 'Suspended'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle size={12} weight="fill" />
                            {language === 'th' ? 'ปกติ' : 'Active'}
                          </span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="px-5 py-3.5 text-xs text-kumo-subtle whitespace-nowrap">
                        {formatDate(user.lastLoginAt)}
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-3.5 text-xs text-kumo-subtle whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions Menu */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenu.Trigger
                            render={(props) => (
                              <Button
                                {...props}
                                variant="ghost"
                                size="sm"
                                disabled={isBusy}
                                icon={DotsThreeVertical}
                                className="!p-1.5 text-kumo-subtle hover:text-kumo-default"
                              />
                            )}
                          />
                          <DropdownMenu.Content
                            className={MENU_CONTENT}
                            align="end"
                          >
                            {/* Toggle Admin */}
                            <DropdownMenu.Item
                              className="flex items-center gap-2 px-3 py-2 text-xs rounded-md cursor-pointer text-kumo-default hover:bg-kumo-tint"
                              onClick={() => handleToggleAdmin(user)}
                            >
                              {user.isAdmin ? (
                                <>
                                  <ShieldSlash size={14} className="text-amber-500" />
                                  <span>
                                    {language === 'th'
                                      ? 'ปลดสิทธิ์ผู้ดูแลระบบ'
                                      : 'Demote from Admin'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck size={14} className="text-amber-500" />
                                  <span>
                                    {language === 'th'
                                      ? 'แต่งตั้งเป็นผู้ดูแลระบบ'
                                      : 'Promote to Admin'}
                                  </span>
                                </>
                              )}
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
                              onClick={() => handleToggleSuspended(user)}
                            >
                              {user.suspended ? (
                                <>
                                  <CheckCircle size={14} className="text-emerald-500" />
                                  <span>{language === 'th' ? 'ปลดการระงับบัญชี' : 'Unsuspend Account'}</span>
                                </>
                              ) : (
                                <>
                                  <Prohibit size={14} className="text-rose-500" />
                                  <span>{language === 'th' ? 'ระงับบัญชี' : 'Suspend Account'}</span>
                                </>
                              )}
                            </DropdownMenu.Item>

                            <DropdownMenu.Separator className="h-px bg-kumo-line my-1" />

                            {/* Delete User */}
                            <DropdownMenu.Item
                              className="flex items-center gap-2 px-3 py-2 text-xs rounded-md cursor-pointer text-rose-500 hover:bg-rose-500/10"
                              onClick={() => setDeleteModalUser(user)}
                            >
                              <Trash size={14} />
                              <span>{language === 'th' ? 'ลบบัญชีผู้ใช้' : 'Delete Account'}</span>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
