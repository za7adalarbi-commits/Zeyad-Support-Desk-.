/**
 * RENTAL GATE CRM — Employees Management & Server-Side RBAC
 */

function getEmployees(session) {
  var employees = readAllRecords(RG_SHEETS.EMPLOYEES, true);
  var reservations = readAllRecords(RG_SHEETS.RESERVATIONS, false);
  var followUps = readAllRecords(RG_SHEETS.FOLLOWUPS, false);
  var problems = readAllRecords(RG_SHEETS.PROBLEMS, false);

  var resCounts = {};
  for (var r = 0; r < reservations.length; r++) {
    var ids = safeJsonParse(reservations[r].assignedEmployeeIds, []);
    for (var j = 0; j < ids.length; j++) {
      resCounts[ids[j]] = (resCounts[ids[j]] || 0) + 1;
    }
  }

  var fuCounts = {};
  for (var f = 0; f < followUps.length; f++) {
    var eid = followUps[f].employeeId;
    fuCounts[eid] = (fuCounts[eid] || 0) + 1;
  }

  var prbCounts = {};
  for (var p = 0; p < problems.length; p++) {
    var pids = safeJsonParse(problems[p].assignedEmployeeIds, []);
    for (var k = 0; k < pids.length; k++) {
      prbCounts[pids[k]] = (prbCounts[pids[k]] || 0) + 1;
    }
  }

  var list = [];
  for (var i = 0; i < employees.length; i++) {
    var clean = sanitizeEmployeeForClient(employees[i]);
    clean.reservationsCount = resCounts[clean.id] || 0;
    clean.followUpsCount = fuCounts[clean.id] || 0;
    clean.problemsCount = prbCounts[clean.id] || 0;
    list.push(clean);
  }

  return {
    items: list,
    total: list.length,
    rolePresets: readRolePresetsSetting(),
    customPermissions: readCustomPermissionsSetting()
  };
}

function getEmployeeDetails(session, params) {
  var employeeId = normalizeStr(params.employeeId) || session.employeeId;
  if (employeeId !== session.employeeId && !hasPermission(session, 'view_employees')) {
    throw new Error('FORBIDDEN: لا يمكنك استعراض ملف موظف آخر.');
  }

  var employee = findRecordById(RG_SHEETS.EMPLOYEES, 'id', employeeId);
  if (!employee) throw new Error('لم يتم العثور على الموظف المطلوب.');

  var reservations = readAllRecords(RG_SHEETS.RESERVATIONS, false);
  var followUps = readAllRecords(RG_SHEETS.FOLLOWUPS, true);
  var problems = readAllRecords(RG_SHEETS.PROBLEMS, true);

  var empFollowUps = followUps.filter(function (f) {
    return f.employeeId === employeeId;
  }).sort(function (a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  var touchedResIds = {};
  var fuByRes = {};
  for (var f = 0; f < followUps.length; f++) {
    var fu = followUps[f];
    if (!fuByRes[fu.reservationId]) fuByRes[fu.reservationId] = [];
    fuByRes[fu.reservationId].push(fu);
    if (fu.employeeId === employeeId) touchedResIds[fu.reservationId] = true;
  }

  var prbByRes = {};
  var empProblems = [];
  for (var p = 0; p < problems.length; p++) {
    var pr = problems[p];
    if (!prbByRes[pr.reservationId]) prbByRes[pr.reservationId] = [];
    prbByRes[pr.reservationId].push(pr);
    var pids = safeJsonParse(pr.assignedEmployeeIds, []);
    if (pr.createdById === employeeId || pids.indexOf(employeeId) !== -1) {
      empProblems.push(pr);
    }
  }

  var statusCounts = {};
  var customerSet = {};
  var empReservations = [];

  for (var r = 0; r < reservations.length; r++) {
    var res = reservations[r];
    var assignedIds = safeJsonParse(res.assignedEmployeeIds, []);
    if (assignedIds.indexOf(employeeId) === -1 && !touchedResIds[res.id]) continue;

    customerSet[normalizeStr(res.customerPhone || res.customerName)] = true;
    var st = res.internalStatus || 'تم الإنشاء';
    statusCounts[st] = (statusCounts[st] || 0) + 1;

    var resFus = (fuByRes[res.id] || []).slice().sort(function (a, b) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
    var myResFus = resFus.filter(function (x) { return x.employeeId === employeeId; });

    empReservations.push({
      id: res.id,
      reservationNumber: res.reservationNumber,
      customerName: res.customerName,
      customerPhone: res.customerPhone,
      companyName: res.companyName,
      branchName: res.branchName,
      carName: res.carName,
      startDate: res.startDate,
      endDate: res.endDate,
      daysCount: toNumber(res.daysCount, 1),
      totalAmount: toNumber(res.totalAmount, 0),
      originalStatusAr: res.originalStatusAr,
      internalStatus: res.internalStatus,
      priority: res.priority,
      hasProblem: toBool(res.hasProblem),
      lastUpdateText: res.lastUpdateText,
      lastUpdatedByName: res.lastUpdatedByName,
      lastUpdatedAt: res.lastUpdatedAt,
      followUpsCount: resFus.length,
      myFollowUpsCount: myResFus.length,
      problemsCount: (prbByRes[res.id] || []).length,
      latestFollowUp: resFus.length > 0 ? resFus[0] : null
    });
  }

  empReservations.sort(function (a, b) {
    return String(b.lastUpdatedAt).localeCompare(String(a.lastUpdatedAt));
  });

  return {
    employee: sanitizeEmployeeForClient(employee),
    assignedReservations: empReservations,
    followUps: empFollowUps,
    problems: empProblems,
    stats: {
      uniqueCustomersCount: Object.keys(customerSet).length,
      reservationsCount: empReservations.length,
      followUpsCount: empFollowUps.length,
      problemsCount: empProblems.length,
      statusCounts: statusCounts
    }
  };
}

function createEmployee(session, payload) {
  requirePermission(session, 'manage_employees');

  var name = normalizeStr(payload.name);
  var username = normalizeStr(payload.username).toLowerCase();
  var password = String(payload.password || '');
  var phone = normalizeStr(payload.phone);
  var email = normalizeStr(payload.email);
  var jobTitle = normalizeStr(payload.jobTitle) || 'موظف خدمة العملاء';
  var role = normalizeStr(payload.role) || RG_ROLES.AGENT;

  if (!name || !username || !password) {
    throw new Error('الاسم واسم المستخدم وكلمة المرور حقول إلزامية.');
  }
  if (password.length < 6) {
    throw new Error('كلمة المرور يجب أن لا تقل عن 6 أحرف.');
  }
  if ([RG_ROLES.GENERAL_MANAGER, RG_ROLES.SUPERVISOR, RG_ROLES.AGENT].indexOf(role) === -1) {
    throw new Error('الدور الوظيفي غير صالح.');
  }

  return withScriptLock(function () {
    var existing = readAllRecords(RG_SHEETS.EMPLOYEES, true);
    for (var i = 0; i < existing.length; i++) {
      if (normalizeStr(existing[i].username).toLowerCase() === username) {
        throw new Error('اسم المستخدم مستخدم مسبقًا.');
      }
    }

    var salt = generateId('SALT');
    var now = nowIso();
    var emp = {
      id: generateId('EMP'),
      name: name,
      username: username,
      passwordHash: hashPassword(password, salt),
      salt: salt,
      phone: phone,
      email: email,
      jobTitle: jobTitle,
      role: role,
      permissions: JSON.stringify(Array.isArray(payload.permissions) && payload.permissions.length ? payload.permissions : resolveEffectivePermissions(role)),
      status: 'active',
      lastActivity: '',
      createdAt: now,
      updatedAt: now
    };

    appendRecord(RG_SHEETS.EMPLOYEES, emp);
    logActivity(session.user, 'إنشاء موظف', 'Employee', emp.id, 'إنشاء حساب للموظف: ' + emp.name + ' (' + emp.role + ')');
    return sanitizeEmployeeForClient(emp);
  });
}

function updateEmployee(session, payload) {
  requirePermission(session, 'manage_employees');

  var employeeId = normalizeStr(payload.employeeId);
  if (!employeeId) throw new Error('معرف الموظف مطلوب.');

  return withScriptLock(function () {
    var existing = findRecordById(RG_SHEETS.EMPLOYEES, 'id', employeeId);
    if (!existing) throw new Error('الموظف غير موجود.');

    var patch = { updatedAt: nowIso() };
    if (payload.name) patch.name = normalizeStr(payload.name);
    if (payload.phone !== undefined) patch.phone = normalizeStr(payload.phone);
    if (payload.email !== undefined) patch.email = normalizeStr(payload.email);
    if (payload.jobTitle) patch.jobTitle = normalizeStr(payload.jobTitle);
    if (payload.role && [RG_ROLES.GENERAL_MANAGER, RG_ROLES.SUPERVISOR, RG_ROLES.AGENT].indexOf(payload.role) !== -1) {
      patch.role = payload.role;
    }
    if (Array.isArray(payload.permissions)) {
      patch.permissions = JSON.stringify(payload.permissions);
    }
    if (payload.status && (payload.status === 'active' || payload.status === 'disabled')) {
      patch.status = payload.status;
      if (payload.status === 'disabled') {
        revokeEmployeeSessions(employeeId);
      }
    }
    if (payload.newPassword && String(payload.newPassword).length >= 6) {
      var newSalt = generateId('SALT');
      patch.salt = newSalt;
      patch.passwordHash = hashPassword(String(payload.newPassword), newSalt);
      revokeEmployeeSessions(employeeId);
    }

    var updated = updateRecordByKey(RG_SHEETS.EMPLOYEES, 'id', employeeId, patch);
    logActivity(session.user, 'تحديث موظف', 'Employee', employeeId, 'تحديث بيانات/صلاحيات الموظف ' + (patch.name || existing.name));
    return sanitizeEmployeeForClient(updated);
  });
}

function disableEmployee(session, payload) {
  requirePermission(session, 'manage_employees');

  var employeeId = normalizeStr(payload.employeeId);
  if (!employeeId) throw new Error('معرف الموظف مطلوب.');
  if (employeeId === session.employeeId) {
    throw new Error('لا يمكنك إيقاف حسابك الشخصي أثناء تسجيل الدخول.');
  }

  return withScriptLock(function () {
    var existing = findRecordById(RG_SHEETS.EMPLOYEES, 'id', employeeId);
    if (!existing) throw new Error('الموظف غير موجود.');

    var nextStatus = normalizeStr(payload.status) === 'active' ? 'active' : 'disabled';
    var updated = updateRecordByKey(RG_SHEETS.EMPLOYEES, 'id', employeeId, {
      status: nextStatus,
      updatedAt: nowIso()
    });
    if (nextStatus === 'disabled') {
      revokeEmployeeSessions(employeeId);
    }
    logActivity(session.user, nextStatus === 'disabled' ? 'إيقاف حساب موظف' : 'تفعيل حساب موظف', 'Employee', employeeId, existing.name);
    return sanitizeEmployeeForClient(updated);
  });
}

function readRolePresetsSetting() {
  var rec = findRecordById(RG_SHEETS.SETTINGS, 'key', 'job_role_presets');
  var parsed = rec ? safeJsonParse(rec.value, RG_DEFAULT_ROLE_PRESETS) : RG_DEFAULT_ROLE_PRESETS;
  return normalizeRolePresetsServer(parsed);
}

function readCustomPermissionsSetting() {
  var rec = findRecordById(RG_SHEETS.SETTINGS, 'key', 'permissions_catalog_custom');
  var parsed = rec ? safeJsonParse(rec.value, []) : [];
  return Array.isArray(parsed) ? parsed : [];
}

function saveRolePreset(session, payload) {
  requirePermission(session, 'manage_employees');
  var label = normalizeStr(payload.label);
  if (!label) throw new Error('اسم الصلاحية الجاهزة مطلوب.');
  var role = [RG_ROLES.GENERAL_MANAGER, RG_ROLES.SUPERVISOR, RG_ROLES.AGENT].indexOf(payload.role) !== -1
    ? payload.role
    : RG_ROLES.AGENT;
  var jobTitle = normalizeStr(payload.jobTitle) || label;
  var perms = sanitizePresetPermsServer(role, payload.permissions);
  var pid = normalizeStr(payload.id);

  return withScriptLock(function () {
    var list = readRolePresetsSetting();
    var idx = -1;
    if (pid) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === pid) { idx = i; break; }
      }
    }
    var record = {
      id: idx !== -1 ? pid : (pid || generateId('PRESET')),
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
    upsertRecordByKey(RG_SHEETS.SETTINGS, 'key', 'job_role_presets', {
      key: 'job_role_presets',
      value: JSON.stringify(list),
      updatedBy: session.user.name,
      updatedAt: nowIso()
    });
    logActivity(session.user, idx !== -1 ? 'تعديل صلاحية جاهزة' : 'إضافة صلاحية جاهزة', 'RolePreset', record.id, record.label);
    return { rolePresets: list, savedPreset: record };
  });
}

function deleteRolePreset(session, payload) {
  requirePermission(session, 'manage_employees');
  var targetId = normalizeStr(payload.presetId || payload.id);
  if (!targetId) throw new Error('معرف الصلاحية الجاهزة مطلوب.');

  return withScriptLock(function () {
    var list = readRolePresetsSetting();
    var removed = null;
    var next = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === targetId) removed = list[i];
      else next.push(list[i]);
    }
    if (!removed) throw new Error('الصلاحية الجاهزة غير موجودة.');
    if (next.length === 0) throw new Error('يجب الإبقاء على قالب صلاحية جاهزة واحد على الأقل.');
    upsertRecordByKey(RG_SHEETS.SETTINGS, 'key', 'job_role_presets', {
      key: 'job_role_presets',
      value: JSON.stringify(next),
      updatedBy: session.user.name,
      updatedAt: nowIso()
    });
    logActivity(session.user, 'حذف صلاحية جاهزة', 'RolePreset', targetId, removed.label);
    return { rolePresets: next };
  });
}

function resetRolePresets(session) {
  requirePermission(session, 'manage_employees');
  return withScriptLock(function () {
    var defaults = normalizeRolePresetsServer(RG_DEFAULT_ROLE_PRESETS);
    upsertRecordByKey(RG_SHEETS.SETTINGS, 'key', 'job_role_presets', {
      key: 'job_role_presets',
      value: JSON.stringify(defaults),
      updatedBy: session.user.name,
      updatedAt: nowIso()
    });
    logActivity(session.user, 'استعادة الصلاحيات الجاهزة', 'RolePreset', 'defaults', 'استعادة القوالب الافتراضية');
    return { rolePresets: defaults };
  });
}

function savePermissionDefinition(session, payload) {
  requirePermission(session, 'manage_employees');
  var label = normalizeStr(payload.label);
  var group = normalizeStr(payload.group) || 'صلاحيات مخصصة';
  if (!label) throw new Error('اسم الصلاحية مطلوب.');
  var rawKey = normalizeStr(payload.key);
  if (!rawKey) {
    rawKey = 'custom_' + generateId('P').toLowerCase();
  }
  rawKey = rawKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (!rawKey) throw new Error('مفتاح الصلاحية غير صالح.');

  return withScriptLock(function () {
    var list = readCustomPermissionsSetting();
    var builtInKeys = {};
    var roles = Object.keys(RG_ROLE_PERMISSIONS);
    for (var r = 0; r < roles.length; r++) {
      var arr = RG_ROLE_PERMISSIONS[roles[r]];
      for (var j = 0; j < arr.length; j++) builtInKeys[arr[j]] = true;
    }
    var item = {
      key: rawKey,
      label: label,
      group: group,
      isCustom: !builtInKeys[rawKey] && rawKey.indexOf('custom_') === 0
    };
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (normalizeStr(list[i].key) === rawKey) { idx = i; break; }
    }
    if (idx !== -1) list[idx] = item;
    else list.push(item);

    upsertRecordByKey(RG_SHEETS.SETTINGS, 'key', 'permissions_catalog_custom', {
      key: 'permissions_catalog_custom',
      value: JSON.stringify(list),
      updatedBy: session.user.name,
      updatedAt: nowIso()
    });
    logActivity(session.user, idx !== -1 ? 'تعديل صلاحية' : 'إضافة صلاحية', 'Permission', rawKey, label);
    return { customPermissions: list, saved: item };
  });
}

function deletePermissionDefinition(session, payload) {
  requirePermission(session, 'manage_employees');
  var targetKey = normalizeStr(payload.key);
  if (!targetKey) throw new Error('مفتاح الصلاحية مطلوب.');

  return withScriptLock(function () {
    var list = readCustomPermissionsSetting();
    var next = list.filter(function (c) { return normalizeStr(c.key) !== targetKey; });
    upsertRecordByKey(RG_SHEETS.SETTINGS, 'key', 'permissions_catalog_custom', {
      key: 'permissions_catalog_custom',
      value: JSON.stringify(next),
      updatedBy: session.user.name,
      updatedAt: nowIso()
    });
    var presets = readRolePresetsSetting();
    if (targetKey.indexOf('custom_') === 0) {
      for (var i = 0; i < presets.length; i++) {
        presets[i].permissions = (presets[i].permissions || []).filter(function (pk) { return pk !== targetKey; });
      }
      upsertRecordByKey(RG_SHEETS.SETTINGS, 'key', 'job_role_presets', {
        key: 'job_role_presets',
        value: JSON.stringify(presets),
        updatedBy: session.user.name,
        updatedAt: nowIso()
      });
    }
    logActivity(session.user, 'حذف صلاحية', 'Permission', targetKey, targetKey);
    return { customPermissions: next, rolePresets: presets };
  });
}
