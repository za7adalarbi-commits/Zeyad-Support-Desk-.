/**
 * RENTAL GATE CRM — Rental Gate API Integration & Reservations Service
 * Token is read strictly from Script Properties: RG_TOKEN
 */

var RG_RESERVATIONS_API = 'https://api.rentalgate.net/api/reservations/filter';
var RG_EXTENDS_API = 'https://api.rentalgate.net/api/reservation-extends/filter';

function getRgToken() {
  var props = PropertiesService.getScriptProperties();
  return normalizeStr(props.getProperty('RG_TOKEN') || props.getProperty('RENTAL_TOKEN'));
}

function callRentalGateEndpoint(url, token, page, perPage) {
  var payload = {
    page: page || 1,
    per_page: perPage || 100
  };
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var res = UrlFetchApp.fetch(url, options);
  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('خطأ من Rental Gate API (' + code + '): ' + text.substring(0, 250));
  }
  return JSON.parse(text);
}

function fetchAllRentalGatePages(url, token) {
  var allItems = [];
  var page = 1;
  var pagesFetched = 0;
  var maxPages = 100;

  while (page <= maxPages) {
    var body = callRentalGateEndpoint(url, token, page, 100);
    pagesFetched++;
    var rows = [];
    var lastPage = 1;

    if (Array.isArray(body)) {
      rows = body;
      lastPage = 1;
    } else if (body && body.data) {
      if (Array.isArray(body.data)) {
        rows = body.data;
        lastPage = toNumber((body.meta && body.meta.last_page) || body.last_page, 1);
      } else if (Array.isArray(body.data.data)) {
        rows = body.data.data;
        lastPage = toNumber(body.data.last_page || (body.data.meta && body.data.meta.last_page), 1);
      }
    }

    for (var i = 0; i < rows.length; i++) {
      allItems.push(rows[i]);
    }

    if (page >= lastPage || rows.length === 0) {
      break;
    }
    page++;
  }

  return { items: allItems, pagesFetched: pagesFetched };
}

function testRentalGateConnection(session) {
  requireApiAccess(session);
  var token = getRgToken();
  if (!token) {
    return {
      connected: false,
      hasToken: false,
      message: 'مفتاح RG_TOKEN غير مضبوط في Script Properties.'
    };
  }
  try {
    callRentalGateEndpoint(RG_RESERVATIONS_API, token, 1, 1);
    return {
      connected: true,
      hasToken: true,
      checkedAt: nowIso(),
      message: 'الاتصال بواجهة Rental Gate API ناجح ويعمل بشكل سليم.'
    };
  } catch (err) {
    return {
      connected: false,
      hasToken: true,
      checkedAt: nowIso(),
      message: err.message
    };
  }
}

function syncRentalGate(session) {
  requireApiAccess(session);
  return runRentalGateSyncInternal({
    id: session.employeeId,
    employeeId: session.employeeId,
    name: session.user.name,
    role: session.role
  });
}

function pullReservations(session) {
  requirePermission(session, 'pull_reservations');
  var syncResult = runRentalGateSyncInternal({
    id: session.employeeId,
    employeeId: session.employeeId,
    name: session.user.name,
    role: session.role
  });
  return {
    importedCount: syncResult.importedCount || 0,
    updatedCount: syncResult.updatedCount || 0,
    extensionsCount: syncResult.extensionsCount || 0,
    finishedAt: syncResult.finishedAt || nowIso()
  };
}

function runRentalGateSyncInternal(actor) {
  var token = getRgToken();
  if (!token) {
    throw new Error('لم يتم ضبط RG_TOKEN في Script Properties.');
  }

  var actorId = (actor && (actor.employeeId || actor.id)) || 'SYSTEM';
  var actorName = (actor && actor.name) || 'المزامنة التلقائية';
  var actorObj = { id: actorId, name: actorName, role: (actor && actor.role) || 'system' };

  var startedAt = nowIso();
  var startMs = Date.now();

  return withScriptLock(function () {
    var importedCount = 0;
    var updatedCount = 0;
    var extensionsCount = 0;
    var pagesFetched = 0;

    try {
      var excludedSetting = findRecordById(RG_SHEETS.SETTINGS, 'key', 'excluded_statuses');
      var excludedStatuses = safeJsonParse(excludedSetting ? excludedSetting.value : '[]', []);
      var excludedSet = {};
      for (var e = 0; e < excludedStatuses.length; e++) {
        excludedSet[normalizeStr(excludedStatuses[e]).toLowerCase()] = true;
      }

      var extFetch = fetchAllRentalGatePages(RG_EXTENDS_API, token);
      pagesFetched += extFetch.pagesFetched;

      var extByResNumber = {};
      for (var x = 0; x < extFetch.items.length; x++) {
        var ext = extFetch.items[x];
        if (!isExtensionAcceptedAndPaid(ext)) continue;

        var extNum = normalizeStr(ext.id || ext.extension_number || ext.code);
        var resNumForExt = normalizeStr(ext.reservation_number || (ext.reservation && ext.reservation.reservation_number) || ext.reservation_id);
        if (!resNumForExt) continue;

        var extRecord = {
          id: generateId('EXT'),
          extensionNumber: extNum || generateId('EXTN'),
          reservationId: '',
          reservationNumber: resNumForExt,
          statusCode: normalizeStr(ext.status || 'accepted'),
          statusAr: translateOriginalStatus(ext.status || 'accepted'),
          paymentStatus: normalizeStr(ext.payment_status || 'paid'),
          extendDays: toNumber(ext.days || ext.extend_days, 0),
          startDate: formatDateOnly(ext.start_date || ext.from_date),
          endDate: formatDateOnly(ext.end_date || ext.to_date),
          amount: toNumber(ext.total || ext.amount || ext.price, 0),
          isAcceptedAndPaid: 'true',
          syncedAt: nowIso()
        };

        upsertRecordByKey(RG_SHEETS.EXTENSIONS, 'extensionNumber', extRecord.extensionNumber, extRecord);
        extensionsCount++;

        if (!extByResNumber[resNumForExt]) extByResNumber[resNumForExt] = [];
        extByResNumber[resNumForExt].push(extRecord);
      }

      var resFetch = fetchAllRentalGatePages(RG_RESERVATIONS_API, token);
      pagesFetched += resFetch.pagesFetched;

      var existingReservations = readAllRecords(RG_SHEETS.RESERVATIONS, true);
      var existingByNumber = {};
      for (var r = 0; r < existingReservations.length; r++) {
        existingByNumber[normalizeStr(existingReservations[r].reservationNumber)] = existingReservations[r];
      }

      for (var i = 0; i < resFetch.items.length; i++) {
        var item = resFetch.items[i];
        var resNumber = normalizeStr(item.reservation_number || item.code || item.reference || item.id);
        if (!resNumber) continue;

        var statusCode = normalizeStr(item.status || item.status_code).toLowerCase();
        if (excludedSet[statusCode]) continue;

        var extsForThis = extByResNumber[resNumber] || [];
        var extAmountSum = 0;
        for (var j = 0; j < extsForThis.length; j++) {
          extAmountSum += toNumber(extsForThis[j].amount, 0);
        }

        var baseAmount = toNumber(item.total_price || item.total || item.amount || item.base_amount, 0);
        var totalAmount = computeTotalAmount(baseAmount, extsForThis);
        var existing = existingByNumber[resNumber];

        var customerObj = item.customer || item.user || {};
        var companyObj = item.company || item.partner || {};
        var branchObj = item.branch || item.location || {};
        var carObj = item.car || item.vehicle || {};

        var resPayload = {
          id: existing ? existing.id : generateId('RES'),
          reservationNumber: resNumber,
          customerName: normalizeStr(item.customer_name || customerObj.name || customerObj.full_name || 'عميل'),
          customerPhone: normalizeStr(item.customer_phone || customerObj.phone || customerObj.mobile || ''),
          companyName: normalizeStr(item.company_name || companyObj.name || ''),
          branchName: normalizeStr(item.branch_name || branchObj.name || ''),
          carName: normalizeStr(item.car_name || carObj.name || (carObj.brand ? (carObj.brand + ' ' + (carObj.model || '')) : '')),
          plateNumber: normalizeStr(item.plate_number || carObj.plate_number || ''),
          startDate: formatDateOnly(item.start_date || item.pickup_date),
          endDate: formatDateOnly(item.end_date || item.return_date),
          daysCount: toNumber(item.days_count || item.days, 1),
          originalStatusCode: statusCode,
          originalStatusAr: translateOriginalStatus(statusCode),
          pickupTypeAr: translateDeliveryType(item.pickup_type || item.delivery_type),
          returnTypeAr: translateDeliveryType(item.return_type || item.dropoff_type),
          baseAmount: baseAmount,
          extensionsAmount: Math.round(extAmountSum * 100) / 100,
          totalAmount: totalAmount,
          hasExtensions: extsForThis.length > 0 ? 'true' : 'false',
          internalStatus: existing ? existing.internalStatus : (extsForThis.length > 0 ? 'تم التمديد' : 'تم الإنشاء'),
          priority: existing ? existing.priority : 'عادي',
          assignedEmployeeIds: existing ? existing.assignedEmployeeIds : '[]',
          assignedEmployeeNames: existing ? existing.assignedEmployeeNames : '[]',
          lastUpdateText: existing ? existing.lastUpdateText : 'تم الاستيراد من Rental Gate',
          lastUpdatedById: existing ? existing.lastUpdatedById : actorId,
          lastUpdatedByName: existing ? existing.lastUpdatedByName : actorName,
          lastUpdatedAt: existing ? existing.lastUpdatedAt : nowIso(),
          hasProblem: existing ? existing.hasProblem : 'false',
          createdAt: existing ? existing.createdAt : nowIso(),
          updatedAt: nowIso(),
          rawJson: JSON.stringify(item).substring(0, 5000)
        };

        var result = upsertRecordByKey(RG_SHEETS.RESERVATIONS, 'reservationNumber', resNumber, resPayload);
        if (result.action === 'inserted') importedCount++;
        else updatedCount++;
      }

      var syncRecord = {
        id: generateId('SYNC'),
        triggeredById: actorId,
        triggeredByName: actorName,
        status: 'success',
        importedCount: importedCount,
        updatedCount: updatedCount,
        extensionsCount: extensionsCount,
        pagesFetched: pagesFetched,
        errorMessage: '',
        durationMs: Date.now() - startMs,
        startedAt: startedAt,
        finishedAt: nowIso()
      };
      appendRecord(RG_SHEETS.SYNC_LOG, syncRecord);
      logActivity(actorObj, 'سحب بيانات', 'Sync', syncRecord.id,
        'استيراد ' + importedCount + '، تحديث ' + updatedCount + '، تمديدات ' + extensionsCount);

      return syncRecord;
    } catch (err) {
      var errRecord = {
        id: generateId('SYNC'),
        triggeredById: actorId,
        triggeredByName: actorName,
        status: 'error',
        importedCount: importedCount,
        updatedCount: updatedCount,
        extensionsCount: extensionsCount,
        pagesFetched: pagesFetched,
        errorMessage: err.message,
        durationMs: Date.now() - startMs,
        startedAt: startedAt,
        finishedAt: nowIso()
      };
      appendRecord(RG_SHEETS.SYNC_LOG, errRecord);
      throw err;
    }
  });
}

function configureAutoSyncTrigger(hours, enabled) {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'scheduledAutoSync') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  if (!enabled) return { enabled: false, intervalHours: hours };

  var h = Math.max(1, Math.min(168, Math.round(toNumber(hours, 12))));
  var builder = ScriptApp.newTrigger('scheduledAutoSync').timeBased();
  if ([1, 2, 4, 6, 8, 12].indexOf(h) !== -1) {
    builder.everyHours(h).create();
  } else if (h >= 24 && h % 24 === 0) {
    builder.everyDays(Math.round(h / 24)).create();
  } else {
    // Apps Script everyHours only accepts 1, 2, 4, 6, 8, 12; hourly trigger checks elapsed interval
    builder.everyHours(1).create();
  }
  return { enabled: true, intervalHours: h };
}

function scheduledAutoSync() {
  var enabledRec = findRecordById(RG_SHEETS.SETTINGS, 'key', 'auto_sync_enabled');
  var enabled = enabledRec ? toBool(enabledRec.value) : true;
  if (!enabled) return;

  var intervalRec = findRecordById(RG_SHEETS.SETTINGS, 'key', 'auto_sync_interval_hours');
  var intervalHours = intervalRec ? Math.max(1, Math.min(168, toNumber(intervalRec.value, 12))) : 12;

  var logs = readAllRecords(RG_SHEETS.SYNC_LOG, true);
  if (logs.length > 0) {
    logs.sort(function (a, b) {
      return String(b.finishedAt || b.startedAt).localeCompare(String(a.finishedAt || a.startedAt));
    });
    var lastTime = new Date(logs[0].finishedAt || logs[0].startedAt).getTime();
    if (!isNaN(lastTime)) {
      var elapsedHours = (Date.now() - lastTime) / 3600000;
      if (elapsedHours < (intervalHours - 0.1)) {
        return;
      }
    }
  }

  runRentalGateSyncInternal({
    id: 'SYSTEM',
    employeeId: 'SYSTEM',
    name: 'المزامنة التلقائية (كل ' + intervalHours + ' ساعة)',
    role: 'system'
  });
}

function getSyncStatus(session) {
  requireApiAccess(session);
  var logs = readAllRecords(RG_SHEETS.SYNC_LOG, true);
  logs.sort(function (a, b) {
    return String(b.startedAt).localeCompare(String(a.startedAt));
  });
  var enabledRec = findRecordById(RG_SHEETS.SETTINGS, 'key', 'auto_sync_enabled');
  var intervalRec = findRecordById(RG_SHEETS.SETTINGS, 'key', 'auto_sync_interval_hours');
  return {
    hasToken: Boolean(getRgToken()),
    autoSyncEnabled: enabledRec ? toBool(enabledRec.value) : true,
    autoSyncIntervalHours: intervalRec ? toNumber(intervalRec.value, 12) : 12,
    lastSync: logs.length > 0 ? logs[0] : null,
    logs: logs.slice(0, 20)
  };
}

function getReservations(session, params) {
  var all = readAllRecords(RG_SHEETS.RESERVATIONS, false);
  var allowAllSetting = findRecordById(RG_SHEETS.SETTINGS, 'key', 'allow_agent_view_all');
  var allowAgentAll = allowAllSetting ? toBool(allowAllSetting.value) : true;

  var companiesMap = {};
  var branchesMap = {};
  var filtered = [];

  var search = normalizeStr(params.search).toLowerCase();
  var company = normalizeStr(params.company);
  var branch = normalizeStr(params.branch);
  var status = normalizeStr(params.status);
  var employeeId = normalizeStr(params.employeeId);
  var priority = normalizeStr(params.priority);
  var dateFrom = normalizeStr(params.dateFrom);
  var dateTo = normalizeStr(params.dateTo);
  var unfollowedOnly = toBool(params.unfollowedOnly);
  var hasProblemsOnly = toBool(params.hasProblemsOnly);

  var followUps = readAllRecords(RG_SHEETS.FOLLOWUPS, false);
  var followedResIds = {};
  for (var f = 0; f < followUps.length; f++) {
    followedResIds[followUps[f].reservationId] = true;
  }

  for (var i = 0; i < all.length; i++) {
    var r = all[i];
    if (r.companyName) companiesMap[r.companyName] = true;
    if (r.branchName) branchesMap[r.branchName] = true;

    var assignedIds = safeJsonParse(r.assignedEmployeeIds, []);
    if (session.role === RG_ROLES.AGENT && !allowAgentAll && !hasPermission(session, 'view_all_reservations')) {
      if (assignedIds.indexOf(session.employeeId) === -1) continue;
    }

    if (search) {
      var hay = (r.reservationNumber + ' ' + r.customerName + ' ' + r.customerPhone + ' ' + r.carName + ' ' + r.companyName).toLowerCase();
      if (hay.indexOf(search) === -1) continue;
    }
    if (company && r.companyName !== company) continue;
    if (branch && r.branchName !== branch) continue;
    if (status && r.internalStatus !== status && r.originalStatusAr !== status) continue;
    if (priority && r.priority !== priority) continue;
    if (employeeId && assignedIds.indexOf(employeeId) === -1) continue;
    if (dateFrom && r.startDate < dateFrom) continue;
    if (dateTo && r.startDate > dateTo) continue;
    if (unfollowedOnly && followedResIds[r.id]) continue;
    if (hasProblemsOnly && !toBool(r.hasProblem)) continue;

    filtered.push({
      id: r.id,
      reservationNumber: r.reservationNumber,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      companyName: r.companyName,
      branchName: r.branchName,
      carName: r.carName,
      plateNumber: r.plateNumber,
      startDate: r.startDate,
      endDate: r.endDate,
      daysCount: toNumber(r.daysCount, 1),
      originalStatusCode: r.originalStatusCode,
      originalStatusAr: r.originalStatusAr,
      pickupTypeAr: r.pickupTypeAr,
      returnTypeAr: r.returnTypeAr,
      baseAmount: toNumber(r.baseAmount, 0),
      extensionsAmount: toNumber(r.extensionsAmount, 0),
      totalAmount: toNumber(r.totalAmount, 0),
      hasExtensions: toBool(r.hasExtensions),
      internalStatus: r.internalStatus,
      priority: r.priority,
      assignedEmployeeIds: assignedIds,
      assignedEmployeeNames: safeJsonParse(r.assignedEmployeeNames, []),
      lastUpdateText: r.lastUpdateText,
      lastUpdatedById: r.lastUpdatedById,
      lastUpdatedByName: r.lastUpdatedByName,
      lastUpdatedAt: r.lastUpdatedAt,
      hasProblem: toBool(r.hasProblem),
      isFollowed: Boolean(followedResIds[r.id])
    });
  }

  var sortBy = normalizeStr(params.sortBy) || 'lastUpdatedAt';
  var sortDir = normalizeStr(params.sortDir) === 'asc' ? 1 : -1;
  filtered.sort(function (a, b) {
    var va = a[sortBy];
    var vb = b[sortBy];
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sortDir;
    return String(va || '').localeCompare(String(vb || '')) * sortDir;
  });

  var page = Math.max(1, toNumber(params.page, 1));
  var pageSize = Math.min(200, Math.max(1, toNumber(params.pageSize, 25)));
  var total = filtered.length;
  var startIdx = (page - 1) * pageSize;
  var paged = filtered.slice(startIdx, startIdx + pageSize);

  return {
    items: paged,
    total: total,
    page: page,
    pageSize: pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    facets: {
      companies: Object.keys(companiesMap).sort(),
      branches: Object.keys(branchesMap).sort()
    }
  };
}

function getReservationDetails(session, params) {
  var id = normalizeStr(params.reservationId);
  var resNumber = normalizeStr(params.reservationNumber);
  var reservation = id
    ? findRecordById(RG_SHEETS.RESERVATIONS, 'id', id)
    : findRecordById(RG_SHEETS.RESERVATIONS, 'reservationNumber', resNumber);

  if (!reservation) {
    throw new Error('لم يتم العثور على الحجز المطلوب.');
  }

  var extensions = readAllRecords(RG_SHEETS.EXTENSIONS, false).filter(function (e) {
    return e.reservationNumber === reservation.reservationNumber;
  });

  var assignments = readAllRecords(RG_SHEETS.ASSIGNMENTS, false).filter(function (a) {
    return a.reservationId === reservation.id && a.status === 'active';
  });

  var followUps = readAllRecords(RG_SHEETS.FOLLOWUPS, true).filter(function (f) {
    return f.reservationId === reservation.id;
  }).sort(function (a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  var problems = readAllRecords(RG_SHEETS.PROBLEMS, true).filter(function (p) {
    return p.reservationId === reservation.id;
  });

  var problemUpdates = readAllRecords(RG_SHEETS.PROBLEM_UPDATES, false).filter(function (u) {
    return u.reservationNumber === reservation.reservationNumber;
  });

  return {
    reservation: {
      id: reservation.id,
      reservationNumber: reservation.reservationNumber,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      companyName: reservation.companyName,
      branchName: reservation.branchName,
      carName: reservation.carName,
      plateNumber: reservation.plateNumber,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      daysCount: toNumber(reservation.daysCount, 1),
      originalStatusCode: reservation.originalStatusCode,
      originalStatusAr: reservation.originalStatusAr,
      pickupTypeAr: reservation.pickupTypeAr,
      returnTypeAr: reservation.returnTypeAr,
      baseAmount: toNumber(reservation.baseAmount, 0),
      extensionsAmount: toNumber(reservation.extensionsAmount, 0),
      totalAmount: toNumber(reservation.totalAmount, 0),
      hasExtensions: toBool(reservation.hasExtensions),
      internalStatus: reservation.internalStatus,
      priority: reservation.priority,
      assignedEmployeeIds: safeJsonParse(reservation.assignedEmployeeIds, []),
      assignedEmployeeNames: safeJsonParse(reservation.assignedEmployeeNames, []),
      lastUpdateText: reservation.lastUpdateText,
      lastUpdatedById: reservation.lastUpdatedById,
      lastUpdatedByName: reservation.lastUpdatedByName,
      lastUpdatedAt: reservation.lastUpdatedAt,
      hasProblem: toBool(reservation.hasProblem)
    },
    extensions: extensions,
    assignments: assignments,
    followUps: followUps,
    problems: problems,
    problemUpdates: problemUpdates
  };
}

function quickUpdateReservationStatus(session, payload) {
  var reservationId = normalizeStr(payload.reservationId);
  var status = normalizeStr(payload.status);
  var note = normalizeStr(payload.note);
  if (!reservationId) throw new Error('معرف الحجز مطلوب.');
  if (!status || RG_FOLLOWUP_STATUSES.indexOf(status) === -1) {
    throw new Error('حالة الحجز غير صالحة.');
  }

  return withScriptLock(function () {
    var reservation = findRecordById(RG_SHEETS.RESERVATIONS, 'id', reservationId);
    if (!reservation) throw new Error('الحجز غير موجود.');

    var now = new Date();
    var actionText = 'تحديث سريع للحالة إلى: ' + status;
    var followUp = {
      id: generateId('FU'),
      reservationId: reservation.id,
      reservationNumber: reservation.reservationNumber,
      customerName: reservation.customerName,
      employeeId: session.employeeId,
      employeeName: session.user.name,
      status: status,
      action: actionText,
      notes: note,
      followUpDate: formatDateOnly(now),
      followUpTime: formatTimeOnly(now),
      createdAt: now.toISOString()
    };
    appendRecord(RG_SHEETS.FOLLOWUPS, followUp);

    var updated = updateRecordByKey(RG_SHEETS.RESERVATIONS, 'id', reservation.id, {
      internalStatus: status,
      lastUpdateText: note ? (actionText + ' — ' + note) : actionText,
      lastUpdatedById: session.employeeId,
      lastUpdatedByName: session.user.name,
      lastUpdatedAt: now.toISOString(),
      updatedAt: now.toISOString()
    });

    updateRecordByKey(RG_SHEETS.EMPLOYEES, 'id', session.employeeId, {
      lastActivity: now.toISOString()
    });

    logActivity(session.user, 'تعديل حالة', 'Reservation', reservation.reservationNumber, 'تحديث مباشر إلى: ' + status + (note ? ' | ' + note : ''));
    return { reservation: updated, followUp: followUp };
  });
}

function updateReservationDetails(session, payload) {
  requirePermission(session, 'edit_reservation_details');

  var reservationId = normalizeStr(payload.reservationId);
  if (!reservationId) throw new Error('معرف الحجز مطلوب.');

  return withScriptLock(function () {
    var existing = findRecordById(RG_SHEETS.RESERVATIONS, 'id', reservationId);
    if (!existing) throw new Error('الحجز غير موجود.');

    var patch = {
      lastUpdatedById: session.employeeId,
      lastUpdatedByName: session.user.name,
      lastUpdatedAt: nowIso(),
      updatedAt: nowIso()
    };

    var editableFields = [
      'customerName', 'customerPhone', 'companyName', 'branchName',
      'carName', 'plateNumber', 'startDate', 'endDate',
      'pickupTypeAr', 'returnTypeAr', 'lastUpdateText'
    ];
    for (var i = 0; i < editableFields.length; i++) {
      var f = editableFields[i];
      if (payload[f] !== undefined) patch[f] = normalizeStr(payload[f]);
    }
    if (payload.daysCount !== undefined) patch.daysCount = Math.max(1, toNumber(payload.daysCount, 1));
    if (payload.baseAmount !== undefined) patch.baseAmount = toNumber(payload.baseAmount, 0);
    if (payload.extensionsAmount !== undefined) patch.extensionsAmount = toNumber(payload.extensionsAmount, 0);
    if (payload.totalAmount !== undefined) patch.totalAmount = toNumber(payload.totalAmount, 0);
    if (payload.internalStatus && RG_FOLLOWUP_STATUSES.indexOf(payload.internalStatus) !== -1) {
      patch.internalStatus = payload.internalStatus;
    }
    if (payload.priority && RG_PROBLEM_PRIORITIES.indexOf(payload.priority) !== -1) {
      patch.priority = payload.priority;
    }

    var updated = updateRecordByKey(RG_SHEETS.RESERVATIONS, 'id', reservationId, patch);
    logActivity(session.user, 'تعديل تفاصيل الحجز', 'Reservation', existing.reservationNumber, 'تحديث تفاصيل الحجز/البيانات بواسطة ' + session.user.name);
    return updated;
  });
}

