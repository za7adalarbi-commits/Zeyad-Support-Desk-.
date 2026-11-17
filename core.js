/**
 * RENTAL GATE CRM — Pure Domain Core (Shared by Browser Frontend & Node Unit Tests)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RGCrmCore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ROLES = {
    GENERAL_MANAGER: 'general_manager',
    SUPERVISOR: 'supervisor',
    AGENT: 'agent'
  };

  var ROLE_LABELS = {
    ar: {
      general_manager: 'المدير العام',
      supervisor: 'المشرف',
      agent: 'موظف خدمة العملاء'
    },
    en: {
      general_manager: 'General Manager',
      supervisor: 'Supervisor',
      agent: 'Customer Support Agent'
    }
  };

  var FOLLOWUP_STATUSES = [
    'تم الحجز',
    'تم التسليم',
    'تم الاستلام',
    'تم الإنشاء',
    'تم الإلغاء',
    'تم التمديد',
    'لم يتم الحجز'
  ];

  var PROBLEM_PRIORITIES = ['عادي', 'متوسط', 'مرتفع'];

  var PROBLEM_STATUSES = [
    'جديدة',
    'قيد المعالجة',
    'بانتظار العميل',
    'بانتظار الشركة',
    'تم الحل',
    'مغلقة'
  ];

  var STATUS_TRANSLATIONS = {
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

  var DELIVERY_TRANSLATIONS = {
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

  function normalizeStr(v) {
    if (v === null || v === undefined) return '';
    return String(v).trim();
  }

  function toNum(v, fallback) {
    var n = Number(v);
    return isNaN(n) ? (fallback || 0) : n;
  }

  function translateOriginalStatus(code) {
    var key = normalizeStr(code).toLowerCase().replace(/\s+/g, '_');
    return STATUS_TRANSLATIONS[key] || normalizeStr(code) || 'غير محدد';
  }

  function translateDeliveryType(type) {
    var key = normalizeStr(type).toLowerCase().replace(/\s+/g, '_');
    return DELIVERY_TRANSLATIONS[key] || normalizeStr(type) || 'استلام من الفرع';
  }

  function isExtensionAcceptedAndPaid(ext) {
    if (!ext || typeof ext !== 'object') return false;
    var st = normalizeStr(ext.status || ext.status_code || ext.state).toLowerCase();
    var pay = normalizeStr(ext.payment_status || ext.paymentStatus || ext.is_paid).toLowerCase();
    var accepted = ['accepted', 'approved', 'confirmed', 'active', 'completed', 'مقبول'].indexOf(st) !== -1;
    var paid = ['paid', 'completed', 'true', '1', 'مدفوع'].indexOf(pay) !== -1 || ext.paid === true;
    return accepted && paid;
  }

  function computeTotalAmount(baseAmount, extensions) {
    var total = toNum(baseAmount, 0);
    if (Array.isArray(extensions)) {
      for (var i = 0; i < extensions.length; i++) {
        total += toNum(extensions[i].amount, 0);
      }
    }
    return Math.round(total * 100) / 100;
  }

  function mergeSyncedReservation(existing, apiItem, acceptedExtensions, actor) {
    var resNumber = normalizeStr(apiItem.reservation_number || apiItem.code || apiItem.reference || apiItem.id);
    var statusCode = normalizeStr(apiItem.status || apiItem.status_code).toLowerCase();
    var exts = Array.isArray(acceptedExtensions) ? acceptedExtensions : [];
    var extAmountSum = 0;
    for (var i = 0; i < exts.length; i++) {
      extAmountSum += toNum(exts[i].amount, 0);
    }

    var baseAmount = toNum(apiItem.total_price || apiItem.total || apiItem.amount || apiItem.base_amount, 0);
    var totalAmount = computeTotalAmount(baseAmount, exts);
    var now = new Date().toISOString();

    return {
      id: existing ? existing.id : ('RES_' + resNumber),
      reservationNumber: resNumber,
      customerName: normalizeStr(apiItem.customer_name || (apiItem.customer && apiItem.customer.name) || 'عميل'),
      customerPhone: normalizeStr(apiItem.customer_phone || (apiItem.customer && apiItem.customer.phone) || ''),
      companyName: normalizeStr(apiItem.company_name || (apiItem.company && apiItem.company.name) || ''),
      branchName: normalizeStr(apiItem.branch_name || (apiItem.branch && apiItem.branch.name) || ''),
      carName: normalizeStr(apiItem.car_name || (apiItem.car && apiItem.car.name) || ''),
      plateNumber: normalizeStr(apiItem.plate_number || (apiItem.car && apiItem.car.plate_number) || ''),
      startDate: normalizeStr(apiItem.start_date || apiItem.pickup_date).substring(0, 10),
      endDate: normalizeStr(apiItem.end_date || apiItem.return_date).substring(0, 10),
      daysCount: toNum(apiItem.days_count || apiItem.days, 1),
      originalStatusCode: statusCode,
      originalStatusAr: translateOriginalStatus(statusCode),
      pickupTypeAr: translateDeliveryType(apiItem.pickup_type || apiItem.delivery_type),
      returnTypeAr: translateDeliveryType(apiItem.return_type || apiItem.dropoff_type),
      baseAmount: baseAmount,
      extensionsAmount: Math.round(extAmountSum * 100) / 100,
      totalAmount: totalAmount,
      hasExtensions: exts.length > 0,
      // Strictly preserve internal workflow state & assignments across syncs
      internalStatus: existing ? existing.internalStatus : (exts.length > 0 ? 'تم التمديد' : 'تم الإنشاء'),
      priority: existing ? existing.priority : 'عادي',
      assignedEmployeeIds: existing ? existing.assignedEmployeeIds : [],
      assignedEmployeeNames: existing ? existing.assignedEmployeeNames : [],
      lastUpdateText: existing ? existing.lastUpdateText : 'تم الاستيراد من Rental Gate',
      lastUpdatedById: existing ? existing.lastUpdatedById : (actor ? actor.id : 'system'),
      lastUpdatedByName: existing ? existing.lastUpdatedByName : (actor ? actor.name : 'النظام'),
      lastUpdatedAt: existing ? existing.lastUpdatedAt : now,
      hasProblem: existing ? Boolean(existing.hasProblem) : false,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };
  }

  var ROLE_PERMISSION_MATRIX = {
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

  var PERMISSIONS_CATALOG = [
    { key: 'view_dashboard', label: 'عرض لوحة التحكم والإحصائيات', group: 'عام' },
    { key: 'view_all_reservations', label: 'استعراض جميع الحجوزات', group: 'الحجوزات' },
    { key: 'pull_reservations', label: 'سحب وتحديث الحجوزات من قائمة الحجوزات', group: 'الحجوزات' },
    { key: 'claim_reservation', label: 'استلام الحجوزات ذاتيًا', group: 'الحجوزات' },
    { key: 'unclaim_reservation', label: 'إلغاء استلام الحجز', group: 'الحجوزات' },
    { key: 'quick_update_status', label: 'التحديث السريع لحالة الحجز', group: 'الحجوزات' },
    { key: 'add_followup', label: 'إضافة متابعات وملاحظات', group: 'المتابعات' },
    { key: 'edit_any_followup', label: 'تعديل متابعات وتحديثات الفريق', group: 'المتابعات' },
    { key: 'assign_employees', label: 'إسناد وإزالة الموظفين عن الحجوزات', group: 'الإشراف' },
    { key: 'edit_reservation_details', label: 'تعديل تفاصيل الحجوزات والأسعار', group: 'الإشراف' },
    { key: 'create_problem', label: 'تحويل الحجز إلى مشكلة / تذكرة', group: 'المشكلات' },
    { key: 'update_problem', label: 'تحديث حالة التذاكر والمشكلات', group: 'المشكلات' },
    { key: 'edit_ticket_details', label: 'تعديل بيانات ووصف التذاكر', group: 'الإشراف' },
    { key: 'view_employees', label: 'عرض الموظفين وملفات عملائهم', group: 'الإشراف' },
    { key: 'view_all_logs', label: 'الاطلاع على سجل نشاطات الفريق', group: 'التقارير والرقابة' },
    { key: 'export_reports', label: 'تصدير تقارير Excel وPDF', group: 'التقارير والرقابة' },
    { key: 'sync_data', label: 'الوصول إلى Rental Gate API والمزامنة', group: 'الإدارة والربط (API)' },
    { key: 'manage_employees', label: 'إدارة حسابات الموظفين وصلاحياتهم', group: 'الإدارة والربط (API)' },
    { key: 'manage_settings', label: 'تعديل إعدادات النظام والتحديث التلقائي', group: 'الإدارة والربط (API)' }
  ];

  var JOB_ROLE_PRESETS = [
    {
      id: 'agent_standard',
      label: 'موظف خدمة عملاء (الافتراضي)',
      jobTitle: 'موظف خدمة العملاء',
      role: ROLES.AGENT,
      permissions: ROLE_PERMISSION_MATRIX.agent.slice()
    },
    {
      id: 'agent_senior',
      label: 'موظف متابعة أول (صلاحيات موسعة)',
      jobTitle: 'موظف متابعة أول',
      role: ROLES.AGENT,
      permissions: ROLE_PERMISSION_MATRIX.agent.concat(['view_all_reservations', 'view_employees', 'edit_any_followup'])
    },
    {
      id: 'qa_reports',
      label: 'مسؤول جودة وتقارير (قراءة وتصدير)',
      jobTitle: 'أخصائي جودة وتقارير',
      role: ROLES.AGENT,
      permissions: ['view_dashboard', 'view_all_reservations', 'view_employees', 'view_all_logs', 'export_reports']
    },
    {
      id: 'supervisor_ops',
      label: 'مشرف عمليات ومتابعة (مع صلاحية API)',
      jobTitle: 'مشرف خدمة العملاء',
      role: ROLES.SUPERVISOR,
      permissions: ROLE_PERMISSION_MATRIX.supervisor.slice()
    },
    {
      id: 'general_manager',
      label: 'المدير العام (كامل الصلاحيات)',
      jobTitle: 'المدير العام',
      role: ROLES.GENERAL_MANAGER,
      permissions: ROLE_PERMISSION_MATRIX.general_manager.slice()
    }
  ];

  function resolveEffectivePermissions(roleOrUser) {
    if (!roleOrUser) return [];
    if (typeof roleOrUser === 'string') {
      return (ROLE_PERMISSION_MATRIX[roleOrUser] || []).slice();
    }
    var role = roleOrUser.role || ROLES.AGENT;
    var rawPerms = Array.isArray(roleOrUser.permissions) ? roleOrUser.permissions : [];
    if (rawPerms.indexOf('all') !== -1) {
      return ROLE_PERMISSION_MATRIX.general_manager.slice();
    }
    var isLegacyRoleOnly = rawPerms.length === 0 || (
      rawPerms.length === 1 &&
      [ROLES.AGENT, ROLES.SUPERVISOR, ROLES.GENERAL_MANAGER].indexOf(rawPerms[0]) !== -1
    );
    if (isLegacyRoleOnly) {
      return (ROLE_PERMISSION_MATRIX[role] || []).slice();
    }
    return rawPerms.slice();
  }

  function canAccessApi(roleOrUser) {
    var role = typeof roleOrUser === 'string' ? roleOrUser : (roleOrUser && roleOrUser.role);
    return role === ROLES.GENERAL_MANAGER || role === ROLES.SUPERVISOR;
  }

  function canUserPerform(roleOrUser, action) {
    if (!roleOrUser || !action) return false;
    if (action === 'sync_data' || action === 'manage_api_connection') {
      if (!canAccessApi(roleOrUser)) return false;
    }
    var allowed = resolveEffectivePermissions(roleOrUser);
    return allowed.indexOf(action) !== -1;
  }

  function mergePermissionsCatalog(customItems) {
    var overrides = Array.isArray(customItems) ? customItems : [];
    var overrideMap = {};
    var extras = [];
    for (var i = 0; i < overrides.length; i++) {
      var item = overrides[i];
      if (!item || !item.key) continue;
      var cleanKey = normalizeStr(item.key);
      if (!cleanKey) continue;
      overrideMap[cleanKey] = {
        key: cleanKey,
        label: normalizeStr(item.label) || cleanKey,
        group: normalizeStr(item.group) || 'صلاحيات مخصصة',
        isCustom: Boolean(item.isCustom)
      };
    }

    var builtInKeys = {};
    var result = [];
    for (var b = 0; b < PERMISSIONS_CATALOG.length; b++) {
      var base = PERMISSIONS_CATALOG[b];
      builtInKeys[base.key] = true;
      var ov = overrideMap[base.key];
      result.push({
        key: base.key,
        label: ov ? ov.label : base.label,
        group: ov ? ov.group : base.group,
        isCustom: false,
        isRenamed: Boolean(ov && (ov.label !== base.label || ov.group !== base.group))
      });
    }

    for (var j = 0; j < overrides.length; j++) {
      var cand = overrides[j];
      if (!cand || !cand.key) continue;
      var ck = normalizeStr(cand.key);
      if (!ck || builtInKeys[ck] || extras.some(function (x) { return x.key === ck; })) continue;
      extras.push({
        key: ck,
        label: normalizeStr(cand.label) || ck,
        group: normalizeStr(cand.group) || 'صلاحيات مخصصة',
        isCustom: true,
        isRenamed: false
      });
    }

    return result.concat(extras);
  }

  function sanitizePresetPermissions(role, perms) {
    var list = Array.isArray(perms) ? perms : [];
    var seen = {};
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var k = normalizeStr(list[i]);
      if (!k || seen[k]) continue;
      if (role === ROLES.AGENT && (k === 'sync_data' || k === 'manage_api_connection')) continue;
      seen[k] = true;
      out.push(k);
    }
    return out;
  }

  function normalizeRolePresets(rawPresets) {
    var source = Array.isArray(rawPresets) && rawPresets.length > 0 ? rawPresets : JOB_ROLE_PRESETS;
    var out = [];
    var seen = {};
    for (var i = 0; i < source.length; i++) {
      var p = source[i];
      if (!p) continue;
      var pid = normalizeStr(p.id) || ('preset_' + (i + 1));
      if (seen[pid]) continue;
      seen[pid] = true;
      var role = [ROLES.GENERAL_MANAGER, ROLES.SUPERVISOR, ROLES.AGENT].indexOf(p.role) !== -1 ? p.role : ROLES.AGENT;
      out.push({
        id: pid,
        label: normalizeStr(p.label) || normalizeStr(p.jobTitle) || pid,
        jobTitle: normalizeStr(p.jobTitle) || normalizeStr(p.label) || 'موظف خدمة العملاء',
        role: role,
        permissions: sanitizePresetPermissions(role, p.permissions)
      });
    }
    return out;
  }

  function upsertRolePreset(presets, input) {
    var list = normalizeRolePresets(presets);
    var label = normalizeStr(input && input.label);
    if (!label) throw new Error('اسم الصلاحية الجاهزة مطلوب.');
    var role = [ROLES.GENERAL_MANAGER, ROLES.SUPERVISOR, ROLES.AGENT].indexOf(input.role) !== -1 ? input.role : ROLES.AGENT;
    var jobTitle = normalizeStr(input && input.jobTitle) || label;
    var perms = sanitizePresetPermissions(role, input && input.permissions);
    var pid = normalizeStr(input && input.id);

    var idx = -1;
    if (pid) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === pid) { idx = i; break; }
      }
    }

    var record = {
      id: idx !== -1 ? pid : (pid || ('PRESET_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).slice(2, 6).toUpperCase())),
      label: label,
      jobTitle: jobTitle,
      role: role,
      permissions: perms
    };

    if (idx !== -1) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    return { presets: list, saved: record, isNew: idx === -1 };
  }

  function removeRolePreset(presets, presetId) {
    var list = normalizeRolePresets(presets);
    var target = normalizeStr(presetId);
    if (!target) throw new Error('معرف الصلاحية الجاهزة مطلوب.');
    var next = list.filter(function (p) { return p.id !== target; });
    if (next.length === 0) {
      throw new Error('يجب الإبقاء على قالب صلاحية جاهزة واحد على الأقل.');
    }
    return next;
  }

  function upsertPermissionDefinition(customItems, input) {
    var list = Array.isArray(customItems) ? customItems.slice() : [];
    var label = normalizeStr(input && input.label);
    var group = normalizeStr(input && input.group) || 'صلاحيات مخصصة';
    if (!label) throw new Error('اسم الصلاحية مطلوب.');

    var rawKey = normalizeStr(input && input.key);
    if (!rawKey) {
      rawKey = 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5);
    }
    rawKey = rawKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!rawKey) throw new Error('مفتاح الصلاحية غير صالح.');

    var isBuiltIn = PERMISSIONS_CATALOG.some(function (b) { return b.key === rawKey; });
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (normalizeStr(list[i].key) === rawKey) { idx = i; break; }
    }

    var item = {
      key: rawKey,
      label: label,
      group: group,
      isCustom: !isBuiltIn
    };

    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    return { customPermissions: list, saved: item, catalog: mergePermissionsCatalog(list) };
  }

  function removePermissionDefinition(customItems, key) {
    var list = Array.isArray(customItems) ? customItems.slice() : [];
    var target = normalizeStr(key);
    if (!target) throw new Error('مفتاح الصلاحية مطلوب.');
    var isBuiltIn = PERMISSIONS_CATALOG.some(function (b) { return b.key === target; });
    var next = list.filter(function (c) { return normalizeStr(c.key) !== target; });
    return {
      customPermissions: next,
      removedKey: isBuiltIn ? null : target,
      resetBuiltIn: isBuiltIn,
      catalog: mergePermissionsCatalog(next)
    };
  }

  function claimReservationRecord(reservation, employee) {
    var ids = Array.isArray(reservation && reservation.assignedEmployeeIds) ? reservation.assignedEmployeeIds.slice() : [];
    var names = Array.isArray(reservation && reservation.assignedEmployeeNames) ? reservation.assignedEmployeeNames.slice() : [];
    var empId = normalizeStr(employee && employee.id);
    var empName = normalizeStr(employee && employee.name);
    if (!empId) return { assignedEmployeeIds: ids, assignedEmployeeNames: names, added: false };
    if (ids.indexOf(empId) !== -1) {
      return { assignedEmployeeIds: ids, assignedEmployeeNames: names, added: false };
    }
    ids.push(empId);
    names.push(empName || empId);
    return { assignedEmployeeIds: ids, assignedEmployeeNames: names, added: true };
  }

  function unclaimReservationRecord(reservation, employeeId) {
    var ids = Array.isArray(reservation && reservation.assignedEmployeeIds) ? reservation.assignedEmployeeIds : [];
    var names = Array.isArray(reservation && reservation.assignedEmployeeNames) ? reservation.assignedEmployeeNames : [];
    var targetId = normalizeStr(employeeId);
    var nextIds = [];
    var nextNames = [];
    var removed = false;
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] === targetId) {
        removed = true;
      } else {
        nextIds.push(ids[i]);
        if (names[i]) nextNames.push(names[i]);
      }
    }
    return { assignedEmployeeIds: nextIds, assignedEmployeeNames: nextNames, removed: removed };
  }

  function filterReservations(reservations, followUps, filters, userContext) {
    var f = filters || {};
    var search = normalizeStr(f.search).toLowerCase();
    var followedSet = {};
    if (Array.isArray(followUps)) {
      for (var i = 0; i < followUps.length; i++) {
        followedSet[followUps[i].reservationId] = true;
      }
    }

    var allowAgentViewAll = !userContext || userContext.allowAgentViewAll !== false;
    var out = [];

    for (var j = 0; j < reservations.length; j++) {
      var r = reservations[j];
      var assignedIds = Array.isArray(r.assignedEmployeeIds) ? r.assignedEmployeeIds : [];

      if (userContext && userContext.role === ROLES.AGENT && !allowAgentViewAll && !(userContext.user && canUserPerform(userContext.user, 'view_all_reservations'))) {
        if (assignedIds.indexOf(userContext.employeeId) === -1) continue;
      }

      if (search) {
        var hay = (
          normalizeStr(r.reservationNumber) + ' ' +
          normalizeStr(r.customerName) + ' ' +
          normalizeStr(r.customerPhone) + ' ' +
          normalizeStr(r.carName) + ' ' +
          normalizeStr(r.companyName) + ' ' +
          normalizeStr(r.branchName)
        ).toLowerCase();
        if (hay.indexOf(search) === -1) continue;
      }

      if (f.company && r.companyName !== f.company) continue;
      if (f.branch && r.branchName !== f.branch) continue;
      if (f.status && r.internalStatus !== f.status && r.originalStatusAr !== f.status) continue;
      if (f.priority && r.priority !== f.priority) continue;
      if (f.employeeId && assignedIds.indexOf(f.employeeId) === -1) continue;
      if (f.dateFrom && r.startDate < f.dateFrom) continue;
      if (f.dateTo && r.startDate > f.dateTo) continue;
      if (f.unfollowedOnly && followedSet[r.id]) continue;
      if (f.hasProblemsOnly && !r.hasProblem) continue;

      out.push(Object.assign({}, r, { isFollowed: Boolean(followedSet[r.id]) }));
    }

    var sortBy = f.sortBy || 'lastUpdatedAt';
    var sortDir = f.sortDir === 'asc' ? 1 : -1;
    out.sort(function (a, b) {
      var va = a[sortBy];
      var vb = b[sortBy];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sortDir;
      return String(va || '').localeCompare(String(vb || '')) * sortDir;
    });

    return out;
  }

  function computeDashboardMetrics(reservations, followUps, problems, employees, dateRange, todayStr) {
    var today = todayStr || new Date().toISOString().substring(0, 10);
    var start = (dateRange && dateRange.start) || '';
    var end = (dateRange && dateRange.end) || '';

    var filteredRes = (reservations || []).filter(function (r) {
      var d = normalizeStr(r.startDate || r.createdAt).substring(0, 10);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });

    var statusCounts = {};
    for (var s = 0; s < FOLLOWUP_STATUSES.length; s++) {
      statusCounts[FOLLOWUP_STATUSES[s]] = 0;
    }

    var companyCounts = {};
    var todayReservations = 0;
    var newReservations = 0;

    for (var i = 0; i < filteredRes.length; i++) {
      var r = filteredRes[i];
      var st = r.internalStatus || 'تم الإنشاء';
      if (Object.prototype.hasOwnProperty.call(statusCounts, st)) {
        statusCounts[st]++;
      }
      var createdDate = normalizeStr(r.createdAt).substring(0, 10);
      var startDate = normalizeStr(r.startDate).substring(0, 10);
      if (createdDate === today || startDate === today) {
        todayReservations++;
      }
      if (st === 'تم الإنشاء') newReservations++;
      var comp = r.companyName || 'غير محدد';
      companyCounts[comp] = (companyCounts[comp] || 0) + 1;
    }

    var todayFollowUps = 0;
    var dailyFollowUps = {};
    var empFollowUpCounts = {};

    for (var f = 0; f < (followUps || []).length; f++) {
      var fu = followUps[f];
      if (fu.followUpDate === today) todayFollowUps++;
      if (start && fu.followUpDate < start) continue;
      if (end && fu.followUpDate > end) continue;
      dailyFollowUps[fu.followUpDate] = (dailyFollowUps[fu.followUpDate] || 0) + 1;
      empFollowUpCounts[fu.employeeName] = (empFollowUpCounts[fu.employeeName] || 0) + 1;
    }

    var openProblems = 0;
    var closedProblems = 0;
    var highProblems = 0;
    var problemPriorities = { 'عادي': 0, 'متوسط': 0, 'مرتفع': 0 };

    for (var p = 0; p < (problems || []).length; p++) {
      var pr = problems[p];
      var isClosed = pr.status === 'مغلقة' || pr.status === 'تم الحل';
      if (isClosed) closedProblems++;
      else openProblems++;
      if (pr.priority === 'مرتفع' && !isClosed) highProblems++;
      if (Object.prototype.hasOwnProperty.call(problemPriorities, pr.priority)) {
        problemPriorities[pr.priority]++;
      }
    }

    var employeeComparison = (employees || [])
      .filter(function (e) { return e.status === 'active'; })
      .map(function (emp) {
        var assignedCount = 0;
        for (var r2 = 0; r2 < filteredRes.length; r2++) {
          var ids = Array.isArray(filteredRes[r2].assignedEmployeeIds) ? filteredRes[r2].assignedEmployeeIds : [];
          if (ids.indexOf(emp.id) !== -1) assignedCount++;
        }
        return {
          name: emp.name,
          followUps: empFollowUpCounts[emp.name] || 0,
          assigned: assignedCount
        };
      });

    return {
      kpis: {
        totalReservations: filteredRes.length,
        todayReservations: todayReservations,
        newReservations: newReservations,
        booked: statusCounts['تم الحجز'],
        delivered: statusCounts['تم التسليم'],
        received: statusCounts['تم الاستلام'],
        created: statusCounts['تم الإنشاء'],
        cancelled: statusCounts['تم الإلغاء'],
        extended: statusCounts['تم التمديد'],
        notBooked: statusCounts['لم يتم الحجز'],
        openProblems: openProblems,
        highProblems: highProblems,
        todayFollowUps: todayFollowUps
      },
      charts: {
        statusDistribution: statusCounts,
        employeePerformance: empFollowUpCounts,
        dailyFollowUps: dailyFollowUps,
        problemsByPriority: problemPriorities,
        problemsOpenVsClosed: { open: openProblems, closed: closedProblems },
        reservationsByCompany: companyCounts,
        employeeComparison: employeeComparison
      }
    };
  }

  return {
    ROLES: ROLES,
    ROLE_LABELS: ROLE_LABELS,
    ROLE_PERMISSION_MATRIX: ROLE_PERMISSION_MATRIX,
    PERMISSIONS_CATALOG: PERMISSIONS_CATALOG,
    JOB_ROLE_PRESETS: JOB_ROLE_PRESETS,
    FOLLOWUP_STATUSES: FOLLOWUP_STATUSES,
    PROBLEM_PRIORITIES: PROBLEM_PRIORITIES,
    PROBLEM_STATUSES: PROBLEM_STATUSES,
    translateOriginalStatus: translateOriginalStatus,
    translateDeliveryType: translateDeliveryType,
    isExtensionAcceptedAndPaid: isExtensionAcceptedAndPaid,
    computeTotalAmount: computeTotalAmount,
    mergeSyncedReservation: mergeSyncedReservation,
    resolveEffectivePermissions: resolveEffectivePermissions,
    canAccessApi: canAccessApi,
    canUserPerform: canUserPerform,
    mergePermissionsCatalog: mergePermissionsCatalog,
    normalizeRolePresets: normalizeRolePresets,
    upsertRolePreset: upsertRolePreset,
    removeRolePreset: removeRolePreset,
    upsertPermissionDefinition: upsertPermissionDefinition,
    removePermissionDefinition: removePermissionDefinition,
    claimReservationRecord: claimReservationRecord,
    unclaimReservationRecord: unclaimReservationRecord,
    filterReservations: filterReservations,
    computeDashboardMetrics: computeDashboardMetrics
  };
}));
