/**
 * RENTAL GATE CRM — Utilities & Domain Constants
 * Google Apps Script Backend
 */

var RG_SHEETS = {
  EMPLOYEES: 'Employees',
  RESERVATIONS: 'Reservations',
  EXTENSIONS: 'Extensions',
  ASSIGNMENTS: 'Assignments',
  FOLLOWUPS: 'FollowUps',
  PROBLEMS: 'Problems',
  PROBLEM_UPDATES: 'ProblemUpdates',
  ACTIVITY_LOG: 'ActivityLog',
  NOTIFICATIONS: 'Notifications',
  SETTINGS: 'Settings',
  SESSIONS: 'Sessions',
  SYNC_LOG: 'SyncLog'
};

var RG_ROLES = {
  GENERAL_MANAGER: 'general_manager',
  SUPERVISOR: 'supervisor',
  AGENT: 'agent'
};

var RG_FOLLOWUP_STATUSES = [
  'تم الحجز',
  'تم التسليم',
  'تم الاستلام',
  'تم الإنشاء',
  'تم الإلغاء',
  'تم التمديد',
  'لم يتم الحجز'
];

var RG_PROBLEM_PRIORITIES = ['عادي', 'متوسط', 'مرتفع'];

var RG_PROBLEM_STATUSES = [
  'جديدة',
  'قيد المعالجة',
  'بانتظار العميل',
  'بانتظار الشركة',
  'تم الحل',
  'مغلقة'
];

var RG_STATUS_MAP = {
  pending: 'قيد الانتظار',
  new: 'جديد',
  created: 'تم الإنشاء',
  confirmed: 'مؤكد',
  booked: 'تم الحجز',
  reserved: 'تم الحجز',
  active: 'نشط',
  delivered: 'تم التسليم',
  picked_up: 'تم الاستلام',
  received: 'تم الاستلام',
  extended: 'تم التمديد',
  completed: 'مكتمل',
  finished: 'مكتمل',
  cancelled: 'ملغي',
  canceled: 'ملغي',
  rejected: 'مرفوض',
  expired: 'منتهي',
  no_show: 'لم يحضر',
  draft: 'مسودة',
  unpaid: 'غير مدفوع',
  paid: 'مدفوع',
  accepted: 'مقبول',
  approved: 'مقبول'
};

var RG_DELIVERY_MAP = {
  branch: 'استلام من الفرع',
  office: 'استلام من المكتب',
  pickup: 'استلام من الفرع',
  delivery: 'توصيل للموقع',
  home: 'توصيل للمنزل',
  airport: 'توصيل للمطار',
  hotel: 'توصيل للفندق',
  return_branch: 'تسليم في الفرع',
  return_delivery: 'استلام من موقع العميل'
};

function generateId(prefix) {
  var uuid = Utilities.getUuid().replace(/-/g, '').substring(0, 12).toUpperCase();
  return (prefix ? prefix + '_' : '') + uuid;
}

function nowIso() {
  return new Date().toISOString();
}

function formatDateOnly(dateInput) {
  if (!dateInput) return '';
  var d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput).substring(0, 10);
  return Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Riyadh', 'yyyy-MM-dd');
}

function formatTimeOnly(dateInput) {
  var d = dateInput instanceof Date ? dateInput : new Date(dateInput || Date.now());
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Riyadh', 'HH:mm:ss');
}

function safeJsonParse(str, fallback) {
  if (str === null || str === undefined || str === '') return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

function normalizeStr(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function toNumber(val, fallback) {
  var n = Number(val);
  return isNaN(n) ? (fallback || 0) : n;
}

function toBool(val) {
  if (typeof val === 'boolean') return val;
  var s = String(val).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes';
}

function translateOriginalStatus(code) {
  var key = normalizeStr(code).toLowerCase().replace(/\s+/g, '_');
  return RG_STATUS_MAP[key] || normalizeStr(code) || 'غير محدد';
}

function translateDeliveryType(type) {
  var key = normalizeStr(type).toLowerCase().replace(/\s+/g, '_');
  return RG_DELIVERY_MAP[key] || normalizeStr(type) || 'استلام من الفرع';
}

function isExtensionAcceptedAndPaid(ext) {
  var st = normalizeStr(ext.status || ext.status_code || ext.state).toLowerCase();
  var pay = normalizeStr(ext.payment_status || ext.paymentStatus || ext.is_paid).toLowerCase();
  var accepted = st === 'accepted' || st === 'approved' || st === 'confirmed' || st === 'active' || st === 'completed' || st === 'مقبول';
  var paid = pay === 'paid' || pay === 'completed' || pay === 'true' || pay === '1' || pay === 'مدفوع' || ext.paid === true;
  return accepted && paid;
}

function computeTotalAmount(baseAmount, extensionsList) {
  var total = toNumber(baseAmount, 0);
  if (Array.isArray(extensionsList)) {
    for (var i = 0; i < extensionsList.length; i++) {
      total += toNumber(extensionsList[i].amount, 0);
    }
  }
  return Math.round(total * 100) / 100;
}

function jsonResponse(success, message, data, error) {
  var payload = {
    success: Boolean(success),
    message: message || '',
    data: data !== undefined ? data : null,
    error: error || null
  };
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

var RG_ROLE_PERMISSIONS = {
  general_manager: [
    'view_dashboard', 'view_all_reservations', 'pull_reservations', 'assign_employees', 'add_followup',
    'claim_reservation', 'unclaim_reservation', 'quick_update_status',
    'edit_any_followup', 'edit_reservation_details', 'edit_ticket_details',
    'create_problem', 'update_problem', 'view_employees', 'manage_employees',
    'view_all_logs', 'sync_data', 'manage_settings', 'export_reports'
  ],
  supervisor: [
    'view_dashboard', 'view_all_reservations', 'pull_reservations', 'assign_employees', 'add_followup',
    'claim_reservation', 'unclaim_reservation', 'quick_update_status',
    'edit_any_followup', 'edit_reservation_details', 'edit_ticket_details',
    'create_problem', 'update_problem', 'view_employees', 'view_all_logs',
    'sync_data', 'export_reports'
  ],
  agent: [
    'view_dashboard', 'pull_reservations', 'add_followup', 'claim_reservation', 'unclaim_reservation',
    'quick_update_status', 'create_problem', 'update_problem', 'export_reports'
  ]
};

function resolveEffectivePermissions(userOrRole) {
  if (!userOrRole) return [];
  if (typeof userOrRole === 'string') {
    return (RG_ROLE_PERMISSIONS[userOrRole] || []).slice();
  }
  var role = normalizeStr(userOrRole.role) || RG_ROLES.AGENT;
  var raw = Array.isArray(userOrRole.permissions)
    ? userOrRole.permissions
    : safeJsonParse(userOrRole.permissions, []);
  if (raw.indexOf('all') !== -1) {
    return RG_ROLE_PERMISSIONS.general_manager.slice();
  }
  var isLegacyRoleOnly = !raw || raw.length === 0 || (
    raw.length === 1 &&
    [RG_ROLES.AGENT, RG_ROLES.SUPERVISOR, RG_ROLES.GENERAL_MANAGER].indexOf(raw[0]) !== -1
  );
  if (isLegacyRoleOnly) {
    return (RG_ROLE_PERMISSIONS[role] || []).slice();
  }
  return raw.slice();
}

function canAccessApi(userOrRole) {
  var role = typeof userOrRole === 'string' ? userOrRole : (userOrRole && userOrRole.role);
  return role === RG_ROLES.GENERAL_MANAGER || role === RG_ROLES.SUPERVISOR;
}

function hasPermission(sessionOrUser, action) {
  if (!sessionOrUser || !action) return false;
  var userObj = sessionOrUser.user ? sessionOrUser.user : sessionOrUser;
  if (action === 'sync_data' || action === 'manage_api_connection') {
    if (!canAccessApi(userObj)) return false;
  }
  var perms = resolveEffectivePermissions(userObj);
  return perms.indexOf(action) !== -1;
}

function sanitizeEmployeeForClient(emp) {
  if (!emp) return null;
  var effectivePerms = resolveEffectivePermissions(emp);
  return {
    id: emp.id,
    name: emp.name,
    username: emp.username,
    phone: emp.phone,
    email: emp.email,
    jobTitle: emp.jobTitle,
    role: emp.role,
    permissions: effectivePerms,
    status: emp.status,
    lastActivity: emp.lastActivity,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt
  };
}

var RG_DEFAULT_ROLE_PRESETS = [
  {
    id: 'agent_standard',
    label: 'موظف خدمة عملاء (الافتراضي)',
    jobTitle: 'موظف خدمة العملاء',
    role: RG_ROLES.AGENT,
    permissions: RG_ROLE_PERMISSIONS.agent.slice()
  },
  {
    id: 'agent_senior',
    label: 'موظف متابعة أول (صلاحيات موسعة)',
    jobTitle: 'موظف متابعة أول',
    role: RG_ROLES.AGENT,
    permissions: RG_ROLE_PERMISSIONS.agent.concat(['view_all_reservations', 'view_employees', 'edit_any_followup'])
  },
  {
    id: 'qa_reports',
    label: 'مسؤول جودة وتقارير (قراءة وتصدير)',
    jobTitle: 'أخصائي جودة وتقارير',
    role: RG_ROLES.AGENT,
    permissions: ['view_dashboard', 'view_all_reservations', 'view_employees', 'view_all_logs', 'export_reports']
  },
  {
    id: 'supervisor_ops',
    label: 'مشرف عمليات ومتابعة (مع صلاحية API)',
    jobTitle: 'مشرف خدمة العملاء',
    role: RG_ROLES.SUPERVISOR,
    permissions: RG_ROLE_PERMISSIONS.supervisor.slice()
  },
  {
    id: 'general_manager',
    label: 'المدير العام (كامل الصلاحيات)',
    jobTitle: 'المدير العام',
    role: RG_ROLES.GENERAL_MANAGER,
    permissions: RG_ROLE_PERMISSIONS.general_manager.slice()
  }
];

function sanitizePresetPermsServer(role, perms) {
  var list = Array.isArray(perms) ? perms : [];
  var seen = {};
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var k = normalizeStr(list[i]);
    if (!k || seen[k]) continue;
    if (role === RG_ROLES.AGENT && (k === 'sync_data' || k === 'manage_api_connection')) continue;
    seen[k] = true;
    out.push(k);
  }
  return out;
}

function normalizeRolePresetsServer(rawPresets) {
  var source = Array.isArray(rawPresets) && rawPresets.length > 0 ? rawPresets : RG_DEFAULT_ROLE_PRESETS;
  var out = [];
  var seen = {};
  for (var i = 0; i < source.length; i++) {
    var p = source[i];
    if (!p) continue;
    var pid = normalizeStr(p.id) || ('preset_' + (i + 1));
    if (seen[pid]) continue;
    seen[pid] = true;
    var role = [RG_ROLES.GENERAL_MANAGER, RG_ROLES.SUPERVISOR, RG_ROLES.AGENT].indexOf(p.role) !== -1 ? p.role : RG_ROLES.AGENT;
    out.push({
      id: pid,
      label: normalizeStr(p.label) || normalizeStr(p.jobTitle) || pid,
      jobTitle: normalizeStr(p.jobTitle) || normalizeStr(p.label) || 'موظف خدمة العملاء',
      role: role,
      permissions: sanitizePresetPermsServer(role, p.permissions)
    });
  }
  return out;
}
