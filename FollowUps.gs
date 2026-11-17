/**
 * RENTAL GATE CRM — Multi-Employee Assignments & Concurrent Follow-Ups
 */

function assignEmployees(session, payload) {
  requirePermission(session, 'assign_employees');

  var reservationId = normalizeStr(payload.reservationId);
  var employeeIds = Array.isArray(payload.employeeIds) ? payload.employeeIds : [];
  if (!reservationId) throw new Error('معرف الحجز مطلوب.');

  return withScriptLock(function () {
    var reservation = findRecordById(RG_SHEETS.RESERVATIONS, 'id', reservationId);
    if (!reservation) throw new Error('الحجز غير موجود.');

    var employees = readAllRecords(RG_SHEETS.EMPLOYEES, true);
    var empMap = {};
    for (var i = 0; i < employees.length; i++) {
      empMap[employees[i].id] = employees[i];
    }

    var previousIds = safeJsonParse(reservation.assignedEmployeeIds, []);
    var existingAssignments = readAllRecords(RG_SHEETS.ASSIGNMENTS, true);
    for (var a = 0; a < existingAssignments.length; a++) {
      if (existingAssignments[a].reservationId === reservationId && existingAssignments[a].status === 'active') {
        updateRecordByKey(RG_SHEETS.ASSIGNMENTS, 'id', existingAssignments[a].id, {
          status: 'reassigned',
          updatedAt: nowIso()
        });
      }
    }

    var newIds = [];
    var newNames = [];
    for (var j = 0; j < employeeIds.length; j++) {
      var empId = normalizeStr(employeeIds[j]);
      var emp = empMap[empId];
      if (!emp || emp.status !== 'active') continue;
      if (newIds.indexOf(empId) !== -1) continue;

      newIds.push(empId);
      newNames.push(emp.name);

      appendRecord(RG_SHEETS.ASSIGNMENTS, {
        id: generateId('ASN'),
        reservationId: reservation.id,
        reservationNumber: reservation.reservationNumber,
        employeeId: emp.id,
        employeeName: emp.name,
        assignedById: session.employeeId,
        assignedByName: session.user.name,
        roleType: j === 0 ? 'primary' : 'collaborator',
        status: 'active',
        assignedAt: nowIso(),
        updatedAt: nowIso()
      });

      var isReassign = previousIds.length > 0 && previousIds.indexOf(empId) === -1;
      createNotification(
        emp.id,
        emp.role,
        isReassign ? 'reassignment' : 'new_assignment',
        isReassign ? 'إعادة توزيع حجز' : 'إسناد حجز جديد',
        'تم إسناد الحجز رقم ' + reservation.reservationNumber + ' (' + reservation.customerName + ') إليك.',
        'Reservation',
        reservation.id
      );
    }

    updateRecordByKey(RG_SHEETS.RESERVATIONS, 'id', reservation.id, {
      assignedEmployeeIds: JSON.stringify(newIds),
      assignedEmployeeNames: JSON.stringify(newNames),
      updatedAt: nowIso()
    });

    logActivity(
      session.user,
      previousIds.length > 0 ? 'إعادة توزيع حجز' : 'إسناد حجز',
      'Reservation',
      reservation.reservationNumber,
      'إسناد إلى: ' + (newNames.join('، ') || 'غير مسند')
    );

    return {
      reservationId: reservation.id,
      assignedEmployeeIds: newIds,
      assignedEmployeeNames: newNames
    };
  });
}

function removeAssignment(session, payload) {
  requirePermission(session, 'assign_employees');

  var reservationId = normalizeStr(payload.reservationId);
  var employeeId = normalizeStr(payload.employeeId);
  if (!reservationId || !employeeId) throw new Error('معرف الحجز والموظف مطلوبان.');

  return withScriptLock(function () {
    var reservation = findRecordById(RG_SHEETS.RESERVATIONS, 'id', reservationId);
    if (!reservation) throw new Error('الحجز غير موجود.');

    var assignments = readAllRecords(RG_SHEETS.ASSIGNMENTS, true);
    for (var i = 0; i < assignments.length; i++) {
      if (assignments[i].reservationId === reservationId && assignments[i].employeeId === employeeId && assignments[i].status === 'active') {
        updateRecordByKey(RG_SHEETS.ASSIGNMENTS, 'id', assignments[i].id, {
          status: 'removed',
          updatedAt: nowIso()
        });
      }
    }

    var ids = safeJsonParse(reservation.assignedEmployeeIds, []);
    var names = safeJsonParse(reservation.assignedEmployeeNames, []);
    var nextIds = [];
    var nextNames = [];
    for (var j = 0; j < ids.length; j++) {
      if (ids[j] !== employeeId) {
        nextIds.push(ids[j]);
        if (names[j]) nextNames.push(names[j]);
      }
    }

    updateRecordByKey(RG_SHEETS.RESERVATIONS, 'id', reservationId, {
      assignedEmployeeIds: JSON.stringify(nextIds),
      assignedEmployeeNames: JSON.stringify(nextNames),
      updatedAt: nowIso()
    });

    logActivity(session.user, 'إزالة موظف من المتابعة', 'Reservation', reservation.reservationNumber, 'إزالة الموظف ' + employeeId);
    return { reservationId: reservationId, assignedEmployeeIds: nextIds, assignedEmployeeNames: nextNames };
  });
}

function claimReservation(session, payload) {
  var reservationId = normalizeStr(payload.reservationId);
  if (!reservationId) throw new Error('معرف الحجز مطلوب.');

  return withScriptLock(function () {
    var reservation = findRecordById(RG_SHEETS.RESERVATIONS, 'id', reservationId);
    if (!reservation) throw new Error('الحجز غير موجود.');

    var ids = safeJsonParse(reservation.assignedEmployeeIds, []);
    var names = safeJsonParse(reservation.assignedEmployeeNames, []);
    if (ids.indexOf(session.employeeId) === -1) {
      ids.push(session.employeeId);
      names.push(session.user.name);

      appendRecord(RG_SHEETS.ASSIGNMENTS, {
        id: generateId('ASN'),
        reservationId: reservation.id,
        reservationNumber: reservation.reservationNumber,
        employeeId: session.employeeId,
        employeeName: session.user.name,
        assignedById: session.employeeId,
        assignedByName: session.user.name,
        roleType: ids.length === 1 ? 'primary' : 'collaborator',
        status: 'active',
        assignedAt: nowIso(),
        updatedAt: nowIso()
      });

      updateRecordByKey(RG_SHEETS.RESERVATIONS, 'id', reservation.id, {
        assignedEmployeeIds: JSON.stringify(ids),
        assignedEmployeeNames: JSON.stringify(names),
        updatedAt: nowIso()
      });

      logActivity(session.user, 'استلام حجز', 'Reservation', reservation.reservationNumber, 'استلام ذاتي بواسطة ' + session.user.name);
    }

    return {
      reservationId: reservation.id,
      assignedEmployeeIds: ids,
      assignedEmployeeNames: names
    };
  });
}

function unclaimReservation(session, payload) {
  var reservationId = normalizeStr(payload.reservationId);
  if (!reservationId) throw new Error('معرف الحجز مطلوب.');

  return withScriptLock(function () {
    var reservation = findRecordById(RG_SHEETS.RESERVATIONS, 'id', reservationId);
    if (!reservation) throw new Error('الحجز غير موجود.');

    var assignments = readAllRecords(RG_SHEETS.ASSIGNMENTS, true);
    for (var i = 0; i < assignments.length; i++) {
      if (assignments[i].reservationId === reservationId && assignments[i].employeeId === session.employeeId && assignments[i].status === 'active') {
        updateRecordByKey(RG_SHEETS.ASSIGNMENTS, 'id', assignments[i].id, {
          status: 'unclaimed',
          updatedAt: nowIso()
        });
      }
    }

    var ids = safeJsonParse(reservation.assignedEmployeeIds, []);
    var names = safeJsonParse(reservation.assignedEmployeeNames, []);
    var nextIds = [];
    var nextNames = [];
    for (var j = 0; j < ids.length; j++) {
      if (ids[j] !== session.employeeId) {
        nextIds.push(ids[j]);
        if (names[j]) nextNames.push(names[j]);
      }
    }

    updateRecordByKey(RG_SHEETS.RESERVATIONS, 'id', reservationId, {
      assignedEmployeeIds: JSON.stringify(nextIds),
      assignedEmployeeNames: JSON.stringify(nextNames),
      updatedAt: nowIso()
    });

    logActivity(session.user, 'إلغاء استلام حجز', 'Reservation', reservation.reservationNumber, 'إلغاء الاستلام الذاتي بواسطة ' + session.user.name);
    return { reservationId: reservationId, assignedEmployeeIds: nextIds, assignedEmployeeNames: nextNames };
  });
}

function addFollowUp(session, payload) {
  var reservationId = normalizeStr(payload.reservationId);
  var status = normalizeStr(payload.status);
  var action = normalizeStr(payload.action);
  var notes = normalizeStr(payload.notes);

  if (!reservationId) throw new Error('معرف الحجز مطلوب.');
  if (!status || RG_FOLLOWUP_STATUSES.indexOf(status) === -1) {
    throw new Error('حالة المتابعة غير صالحة.');
  }
  if (!action) throw new Error('يرجى كتابة الإجراء المتخذ.');

  return withScriptLock(function () {
    var reservation = findRecordById(RG_SHEETS.RESERVATIONS, 'id', reservationId);
    if (!reservation) throw new Error('الحجز غير موجود.');

    var assignedIds = safeJsonParse(reservation.assignedEmployeeIds, []);

    var now = new Date();
    var followUp = {
      id: generateId('FU'),
      reservationId: reservation.id,
      reservationNumber: reservation.reservationNumber,
      customerName: reservation.customerName,
      employeeId: session.employeeId,
      employeeName: session.user.name,
      status: status,
      action: action,
      notes: notes,
      followUpDate: formatDateOnly(now),
      followUpTime: formatTimeOnly(now),
      createdAt: now.toISOString()
    };

    appendRecord(RG_SHEETS.FOLLOWUPS, followUp);

    var statusChanged = reservation.internalStatus !== status;
    updateRecordByKey(RG_SHEETS.RESERVATIONS, 'id', reservation.id, {
      internalStatus: status,
      lastUpdateText: action + (notes ? ' — ' + notes : ''),
      lastUpdatedById: session.employeeId,
      lastUpdatedByName: session.user.name,
      lastUpdatedAt: now.toISOString(),
      updatedAt: now.toISOString()
    });

    updateRecordByKey(RG_SHEETS.EMPLOYEES, 'id', session.employeeId, {
      lastActivity: now.toISOString()
    });

    logActivity(
      session.user,
      statusChanged ? 'تعديل حالة' : 'إضافة متابعة',
      'Reservation',
      reservation.reservationNumber,
      'الحالة: ' + status + ' | الإجراء: ' + action
    );

    if (notes) {
      logActivity(session.user, 'إضافة ملاحظة', 'Reservation', reservation.reservationNumber, notes);
    }

    for (var i = 0; i < assignedIds.length; i++) {
      if (assignedIds[i] !== session.employeeId) {
        createNotification(
          assignedIds[i],
          '',
          statusChanged ? 'status_change' : 'reservation_update',
          statusChanged ? 'تغيير حالة حجز' : 'متابعة جديدة على حجز مشترك',
          session.user.name + ' حدّث الحجز ' + reservation.reservationNumber + ' إلى: ' + status,
          'Reservation',
          reservation.id
        );
      }
    }

    return followUp;
  });
}

function updateFollowUp(session, payload) {
  var followUpId = normalizeStr(payload.followUpId);
  if (!followUpId) throw new Error('معرف المتابعة مطلوب.');

  return withScriptLock(function () {
    var existing = findRecordById(RG_SHEETS.FOLLOWUPS, 'id', followUpId);
    if (!existing) throw new Error('سجل المتابعة غير موجود.');

    if (existing.employeeId !== session.employeeId && !hasPermission(session, 'edit_any_followup')) {
      throw new Error('FORBIDDEN: لا يمكنك تعديل متابعة موظف آخر.');
    }

    var patch = {};
    if (payload.status && RG_FOLLOWUP_STATUSES.indexOf(payload.status) !== -1) patch.status = payload.status;
    if (payload.action) patch.action = normalizeStr(payload.action);
    if (payload.notes !== undefined) patch.notes = normalizeStr(payload.notes);

    var updated = updateRecordByKey(RG_SHEETS.FOLLOWUPS, 'id', followUpId, patch);

    if (toBool(payload.syncToReservation) && updated) {
      var resPatch = {
        lastUpdatedById: session.employeeId,
        lastUpdatedByName: session.user.name,
        lastUpdatedAt: nowIso(),
        updatedAt: nowIso()
      };
      if (updated.status) resPatch.internalStatus = updated.status;
      if (updated.action) resPatch.lastUpdateText = updated.action + (updated.notes ? ' — ' + updated.notes : '');
      updateRecordByKey(RG_SHEETS.RESERVATIONS, 'id', existing.reservationId, resPatch);
    }

    logActivity(session.user, 'تحديث متابعة', 'FollowUp', followUpId, 'تحديث سجل متابعة الحجز ' + existing.reservationNumber);
    return updated;
  });
}

function getMyFollowUps(session, params) {
  var followUps = readAllRecords(RG_SHEETS.FOLLOWUPS, true).filter(function (f) {
    return f.employeeId === session.employeeId;
  });
  followUps.sort(function (a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  var reservations = readAllRecords(RG_SHEETS.RESERVATIONS, false).filter(function (r) {
    var ids = safeJsonParse(r.assignedEmployeeIds, []);
    return ids.indexOf(session.employeeId) !== -1;
  });

  return {
    followUps: followUps,
    assignedReservations: reservations.map(function (r) {
      return {
        id: r.id,
        reservationNumber: r.reservationNumber,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        companyName: r.companyName,
        branchName: r.branchName,
        carName: r.carName,
        startDate: r.startDate,
        endDate: r.endDate,
        internalStatus: r.internalStatus,
        priority: r.priority,
        lastUpdateText: r.lastUpdateText,
        lastUpdatedAt: r.lastUpdatedAt
      };
    })
  };
}

function getTeamFollowUps(session, params) {
  var followUps = readAllRecords(RG_SHEETS.FOLLOWUPS, true);
  var filterEmp = normalizeStr(params.employeeId);
  var filterStatus = normalizeStr(params.status);
  var filterDate = normalizeStr(params.date);

  var filtered = followUps.filter(function (f) {
    if (filterEmp && f.employeeId !== filterEmp) return false;
    if (filterStatus && f.status !== filterStatus) return false;
    if (filterDate && f.followUpDate !== filterDate) return false;
    return true;
  });

  filtered.sort(function (a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  return { items: filtered.slice(0, 300), total: filtered.length };
}
