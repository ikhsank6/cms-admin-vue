// RBAC permission catalogue: `<module>.<action>`.
// The backend is the source of truth; this list drives the admin UI (menus, buttons, role editor).

export const PERMISSION_MODULES = {
  page: ['view', 'create', 'update', 'delete', 'publish'],
  article: ['view', 'create', 'update', 'delete', 'publish'],
  category: ['view', 'create', 'update', 'delete'],
  tag: ['view', 'create', 'update', 'delete'],
  media: ['view', 'upload', 'delete'],
  banner: ['view', 'create', 'update', 'delete', 'publish'],
  menu: ['view', 'create', 'update', 'delete'],
  setting: ['view', 'update'],
  user: ['view', 'create', 'update', 'delete'],
  role: ['view', 'create', 'update', 'delete'],
  audit_log: ['view'],
} as const

export type PermissionModule = keyof typeof PERMISSION_MODULES
export type PermissionKey = {
  [M in PermissionModule]: `${M}.${(typeof PERMISSION_MODULES)[M][number]}`
}[PermissionModule]

export const ALL_PERMISSIONS: PermissionKey[] = Object.entries(PERMISSION_MODULES).flatMap(
  ([module, actions]) => actions.map((action) => `${module}.${action}` as PermissionKey),
)

export const MODULE_LABELS: Record<PermissionModule, string> = {
  page: 'Pages',
  article: 'Articles',
  category: 'Categories',
  tag: 'Tags',
  media: 'Media',
  banner: 'Banners',
  menu: 'Menus',
  setting: 'Settings',
  user: 'Users',
  role: 'Roles',
  audit_log: 'Audit Log',
}

/** Wildcard granted to the Super Admin role. */
export const SUPER_PERMISSION = '*'

export function hasPermission(granted: readonly string[], required: string | string[]): boolean {
  if (granted.includes(SUPER_PERMISSION)) return true
  const list = Array.isArray(required) ? required : [required]
  return list.every((p) => granted.includes(p))
}

export function hasAnyPermission(granted: readonly string[], required: string[]): boolean {
  if (granted.includes(SUPER_PERMISSION)) return true
  return required.some((p) => granted.includes(p))
}
