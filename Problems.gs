/**
 * RENTAL GATE CRM — Problems, Priorities & High-Priority Supervisor Notifications
 */

function createProblem(session, payload) {
  var reservationId = normalizeStr(payload.reservationId);
  var description = normalizeStr(payload.description);
  var priority = normalizeStr(payload.priority) || 'متوسط';
  var assignedEmployeeIds = Array.isArray(payload.assignedEmployeeIds) ? payload.assignedEmployeeIds : [];

  if (!reservationId) throw new Error('معرف الحجز مطلوب.');
  if (!description) throw new Error('يرجى إدخال وصف المشكلة.');
  if (RG_PROBLEM_PRIORITIES.indexOf(priority) === -1) throw new Error('مستوى الأولوية غير صالح.');

  return withScriptLock(function () {
    var reservation = findRecordById(RG_SHEETS.RESERVATIONS, 'id', reservationId);
    if (!reservation) throw new Error('الحجز غير موجود.');

    var employees = readAllRecords(RG_SHEETS.EMPLOYEES, true);
    var empMap = {};
    for (var i = 0; i < employees.length; i++) {
      empMap[employees[i].id] = employees[i];
    }

    var validIds = [];
    var validNames = [];
    for (var j = 0; j < assignedEmployeeIds.length; j++) {
      var eid = normalizeStr(assignedEmployeeIds[j]);
      if (empMap[eid] && validIds.indexOf(eid) === -1) {
        validIds.push(eid);
        validNames.push(empMap[eid].name);
      }
    }

    if (validIds.length === 0) {
      validIds.push(session.employeeId);
      validNames.push(session.user.name);
    }

    var now = nowIso();
    var problem = {
      id: generateId('PRB'),
      problemNumber: 'PRB-' + String(Date.now()).slice(-6),
      reservationId: reservation.id,
      reservationNumber: reservation.reservationNumber,
      customerName: reservation.customerName,
      createdById: session.employeeId,
      createdByName: session.user.name,
      assignedEmployeeIds: JSON.stringify(validIds),
      assignedEmployeeNames: JSON.stringify(validNames),
      description: description,
      priority: priority,
      status: 'جديدة',
      createdAt: now,
      updatedAt: now
    };

    appendRecord(RG_SHEETS.PROBLEMS, problem);

    appendRecord(RG_SHEETS.PROBLEM_UPDATES, {
      id: generateId('PRBU'),
      problemId: problem.id,
      reservationNumber: reservation.reservationNumber,
      employeeId: session.employeeId,
      employeeName: session.user.name,
      previousStatus: '',
      newStatus: 'جديدة',
      previousPriority: '',
      newPriority: priority,
      note: 'تم إنشاء المشكلة: ' + description,
      createdAt: now
    });

    updateRecordByKey(RG_SHEETS.RESERVATIONS, 'id', reservation.id, {
      hasProblem: 'true',
      priority: priority === 'مرتفع' ? 'مرتفع' : reservation.priority,
      updatedAt: now
    });

    logActivity(
      session.user,
      'إنشاء مشكلة',
      'Problem',
      problem.problemNumber,
      'حجز ' + reservation.reservationNumber + ' | الأولوية: ' + priority + ' | ' + description
    );

    for (var k = 0; k < validIds.length; k++) {
      if (validIds[k] !== session.employeeId) {
        createNotification(
          validIds[k],
          '',
          'new_problem',
          'مشكلة جديدة مسندة إليك',
          'مشكلة على الحجز ' + reservation.reservationNumber + ': ' + description,
          'Problem',
          problem.id
        );
      }
    }

    if (priority === 'مرتفع') {
      for (var m = 0; m < employees.length; m++) {
        var emp = employees[m];
        if (emp.status === 'active' && (emp.role === RG_ROLES.SUPERVISOR || emp.role === RG_ROLES.GENERAL_MANAGER)) {
          createNotification(
            emp.id,
            emp.role,
            'high_priority_problem',
            'تنبيه: مشكلة بأولوية مرتفعة',
            'تم فتح مشكلة مرتفعة الأولوية للحجز ' + reservation.reservationNumber + ' (' + reservation.customerName + ') بواسطة ' + session.user.name,
            'Problem',
            problem.id
          );
        }
      }
    }

    return formatProblemForClient(problem);
  });
}

function updateProblem(session, payload) {
  var problemId = normalizeStr(payload.problemId);
  if (!problemId) throw new Error('معرف المشكلة مطلوب.');

  return withScriptLock(function () {
    var existing = findRecordById(RG_SHEETS.PROBLEMS, 'id', problemId);
    if (!existing) throw new Error('المشكلة غير موجودة.');

    var newStatus = payload.status ? normalizeStr(payload.status) : existing.status;
    var newPriority = payload.priority ? normalizeStr(payload.priority) : existing.priority;
    var note = normalizeStr(payload.note);

    if (RG_PROBLEM_STATUSES.indexOf(newStatus) === -1) throw new Error('حالة المشكلة غير صالحة.');
    if (RG_PROBLEM_PRIORITIES.indexOf(newPriority) === -1) throw new Error('مستوى الأولوية غير صالح.');

    var patch = {
      status: newStatus,
      priority: newPriority,
      updatedAt: nowIso()
    };

    var canEditTicket = hasPermission(session, 'edit_ticket_details');
    if (canEditTicket) {
      if (payload.description !== undefined && normalizeStr(payload.description)) {
        patch.description = normalizeStr(payload.description);
      }
      if (payload.customerName !== undefined && normalizeStr(payload.customerName)) {
        patch.customerName = normalizeStr(payload.customerName);
      }
    }

    if (Array.isArray(payload.assignedEmployeeIds)) {
      var employees = readAllRecords(RG_SHEETS.EMPLOYEES, true);
      var empMap = {};
      for (var i = 0; i < employees.length; i++) empMap[employees[i].id] = employees[i];
      var nextIds = [];
      var nextNames = [];
      for (var j = 0; j < payload.assignedEmployeeIds.length; j++) {
        var eid = normalizeStr(payload.assignedEmployeeIds[j]);
        if (empMap[eid] && nextIds.indexOf(eid) === -1) {
          nextIds.push(eid);
          nextNames.push(empMap[eid].name);
        }
      }
      patch.assignedEmployeeIds = JSON.stringify(nextIds);
      patch.assignedEmployeeNames = JSON.stringify(nextNames);
    }

    var updated = updateRecordByKey(RG_SHEETS.PROBLEMS, 'id', problemId, patch);

    appendRecord(RG_SHEETS.PROBLEM_UPDATES, {
      id: generateId('PRBU'),
      problemId: problemId,
      reservationNumber: existing.reservationNumber,
      employeeId: session.employeeId,
      employeeName: session.user.name,
      previousStatus: existing.status,
      newStatus: newStatus,
      previousPriority: existing.priority,
      newPriority: newPriority,
      note: note || (patch.description && patch.description !== existing.description ? 'تعديل بيانات التذكرة' : ('تحديث الحالة إلى ' + newStatus)),
      createdAt: nowIso()
    });

    if (patch.description && patch.description !== existing.description) {
      logActivity(session.user, 'تعديل بيانات التذكرة', 'Problem', existing.problemNumber, 'تم تحديث وصف التذكرة');
    }
    if (existing.priority !== newPriority) {
      logActivity(session.user, 'تغيير أولوية', 'Problem', existing.problemNumber, 'من ' + existing.priority + ' إلى ' + newPriority);
    }
    if (existing.status !== newStatus) {
      logActivity(session.user, 'تعديل حالة', 'Problem', existing.problemNumber, 'من ' + existing.status + ' إلى ' + newStatus);
    } else if (note) {
      logActivity(session.user, 'تحديث مشكلة', 'Problem', existing.problemNumber, note);
    }

    var allProblemsForRes = readAllRecords(RG_SHEETS.PROBLEMS, true).filter(function (p) {
      return p.reservationId === existing.reservationId && p.status !== 'مغلقة' && p.status !== 'تم الحل';
    });
    updateRecordByKey(RG_SHEETS.RESERVATIONS, 'id', existing.reservationId, {
      hasProblem: allProblemsForRes.length > 0 ? 'true' : 'false',
      updatedAt: nowIso()
    });

    return formatProblemForClient(updated);
  });
}

function getProblems(session, params) {
  var problems = readAllRecords(RG_SHEETS.PROBLEMS, true);
  var updates = readAllRecords(RG_SHEETS.PROBLEM_UPDATES, false);

  var updatesByProblem = {};
  for (var u = 0; u < updates.length; u++) {
    var pid = updates[u].problemId;
    if (!updatesByProblem[pid]) updatesByProblem[pid] = [];
    updatesByProblem[pid].push(updates[u]);
  }

  var filterStatus = normalizeStr(params.status);
  var filterPriority = normalizeStr(params.priority);
  var filterEmp = normalizeStr(params.employeeId);
  var search = normalizeStr(params.search).toLowerCase();

  var result = [];
  for (var i = 0; i < problems.length; i++) {
    var p = formatProblemForClient(problems[i]);
    if (filterStatus && p.status !== filterStatus) continue;
    if (filterPriority && p.priority !== filterPriority) continue;
    if (filterEmp && p.assignedEmployeeIds.indexOf(filterEmp) === -1) continue;
    if (search) {
      var hay = (p.problemNumber + ' ' + p.reservationNumber + ' ' + p.customerName + ' ' + p.description).toLowerCase();
      if (hay.indexOf(search) === -1) continue;
    }
    p.updates = (updatesByProblem[p.id] || []).sort(function (a, b) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
    result.push(p);
  }

  result.sort(function (a, b) {
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });

  return { items: result, total: result.length };
}

function formatProblemForClient(p) {
  return {
    id: p.id,
    problemNumber: p.problemNumber,
    reservationId: p.reservationId,
    reservationNumber: p.reservationNumber,
    customerName: p.customerName,
    createdById: p.createdById,
    createdByName: p.createdByName,
    assignedEmployeeIds: safeJsonParse(p.assignedEmployeeIds, []),
    assignedEmployeeNames: safeJsonParse(p.assignedEmployeeNames, []),
    description: p.description,
    priority: p.priority,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  };
}
