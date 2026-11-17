/**
 * RENTAL GATE CRM — Google Sheets Database Layer
 * Uses unique IDs (never row numbers), LockService for concurrent writes,
 * and CacheService for short-lived read optimization.
 */

var RG_SHEETS_SCHEMA = {
  Employees: [
    'id', 'name', 'username', 'passwordHash', 'salt', 'phone', 'email',
    'jobTitle', 'role', 'permissions', 'status', 'lastActivity', 'createdAt', 'updatedAt'
  ],
  Reservations: [
    'id', 'reservationNumber', 'customerName', 'customerPhone', 'companyName',
    'branchName', 'carName', 'plateNumber', 'startDate', 'endDate', 'daysCount',
    'originalStatusCode', 'originalStatusAr', 'pickupTypeAr', 'returnTypeAr',
    'baseAmount', 'extensionsAmount', 'totalAmount', 'hasExtensions',
    'internalStatus', 'priority', 'assignedEmployeeIds', 'assignedEmployeeNames',
    'lastUpdateText', 'lastUpdatedById', 'lastUpdatedByName', 'lastUpdatedAt',
    'hasProblem', 'createdAt', 'updatedAt', 'rawJson'
  ],
  Extensions: [
    'id', 'extensionNumber', 'reservationId', 'reservationNumber', 'statusCode',
    'statusAr', 'paymentStatus', 'extendDays', 'startDate', 'endDate',
    'amount', 'isAcceptedAndPaid', 'syncedAt'
  ],
  Assignments: [
    'id', 'reservationId', 'reservationNumber', 'employeeId', 'employeeName',
    'assignedById', 'assignedByName', 'roleType', 'status', 'assignedAt', 'updatedAt'
  ],
  FollowUps: [
    'id', 'reservationId', 'reservationNumber', 'customerName', 'employeeId',
    'employeeName', 'status', 'action', 'notes', 'followUpDate', 'followUpTime', 'createdAt'
  ],
  Problems: [
    'id', 'problemNumber', 'reservationId', 'reservationNumber', 'customerName',
    'createdById', 'createdByName', 'assignedEmployeeIds', 'assignedEmployeeNames',
    'description', 'priority', 'status', 'createdAt', 'updatedAt'
  ],
  ProblemUpdates: [
    'id', 'problemId', 'reservationNumber', 'employeeId', 'employeeName',
    'previousStatus', 'newStatus', 'previousPriority', 'newPriority', 'note', 'createdAt'
  ],
  ActivityLog: [
    'id', 'userId', 'userName', 'userRole', 'actionType', 'entityType',
    'entityId', 'details', 'logDate', 'logTime', 'createdAt'
  ],
  Notifications: [
    'id', 'recipientEmployeeId', 'recipientRole', 'type', 'title',
    'message', 'entityType', 'entityId', 'isRead', 'createdAt'
  ],
  Settings: [
    'key', 'value', 'updatedBy', 'updatedAt'
  ],
  Sessions: [
    'tokenHash', 'employeeId', 'username', 'role', 'expiresAt',
    'createdAt', 'lastSeenAt', 'isRevoked'
  ],
  SyncLog: [
    'id', 'triggeredById', 'triggeredByName', 'status', 'importedCount',
    'updatedCount', 'extensionsCount', 'pagesFetched', 'errorMessage',
    'durationMs', 'startedAt', 'finishedAt'
  ]
};

function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('SPREADSHEET_ID');
  if (sheetId) {
    return SpreadsheetApp.openById(sheetId);
  }
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error('لم يتم ضبط SPREADSHEET_ID في Script Properties.');
  }
  return active;
}

function withScriptLock(fn) {
  var lock = LockService.getScriptLock();
  var acquired = lock.tryLock(20000);
  if (!acquired) {
    throw new Error('النظام مشغول حالياً بمعالجة عملية متزامنة أخرى، يرجى المحاولة بعد ثوانٍ.');
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function getCacheKey(sheetName) {
  return 'RG_CACHE_' + sheetName;
}

function invalidateCache(sheetName) {
  try {
    CacheService.getScriptCache().remove(getCacheKey(sheetName));
  } catch (e) {}
}

function getSheetOrCreate(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  var headers = RG_SHEETS_SCHEMA[sheetName];
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#313232')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  } else if (sheet.getLastRow() === 0 && headers && headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#313232')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function initDatabase() {
  return withScriptLock(function () {
    var ss = getSpreadsheet();
    var sheetNames = Object.keys(RG_SHEETS_SCHEMA);
    for (var i = 0; i < sheetNames.length; i++) {
      getSheetOrCreate(ss, sheetNames[i]);
      invalidateCache(sheetNames[i]);
    }

    var defaultSettings = {
      company_name: 'RENTAL GATE',
      excluded_statuses: JSON.stringify(['draft', 'test', 'abandoned']),
      session_ttl_hours: '24',
      allow_agent_view_all: 'true',
      default_language: 'ar',
      auto_sync_enabled: 'true',
      auto_sync_interval_hours: '12',
      job_role_presets: JSON.stringify(RG_DEFAULT_ROLE_PRESETS),
      permissions_catalog_custom: JSON.stringify([])
    };

    var settingKeys = Object.keys(defaultSettings);
    for (var k = 0; k < settingKeys.length; k++) {
      var key = settingKeys[k];
      var existing = findRecordById(RG_SHEETS.SETTINGS, 'key', key);
      if (!existing) {
        appendRecord(RG_SHEETS.SETTINGS, {
          key: key,
          value: defaultSettings[key],
          updatedBy: 'system',
          updatedAt: nowIso()
        });
      }
    }

    var employees = readAllRecords(RG_SHEETS.EMPLOYEES, true);
    var adminCreated = false;
    if (employees.length === 0) {
      var props = PropertiesService.getScriptProperties();
      var adminUsername = props.getProperty('INITIAL_ADMIN_USER') || 'admin';
      var adminPass = props.getProperty('INITIAL_ADMIN_PASS') || 'Admin@123';
      var salt = generateId('SALT');
      appendRecord(RG_SHEETS.EMPLOYEES, {
        id: generateId('EMP'),
        name: 'المدير العام',
        username: adminUsername,
        passwordHash: hashPassword(adminPass, salt),
        salt: salt,
        phone: '0500000000',
        email: 'admin@rentalgate.net',
        jobTitle: 'المدير العام',
        role: RG_ROLES.GENERAL_MANAGER,
        permissions: JSON.stringify(['all']),
        status: 'active',
        lastActivity: nowIso(),
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
      adminCreated = true;
    }

    return {
      initializedSheets: sheetNames,
      adminCreated: adminCreated
    };
  });
}

function readAllRecords(sheetName, skipCache) {
  if (!skipCache) {
    try {
      var cached = CacheService.getScriptCache().get(getCacheKey(sheetName));
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
  }

  var ss = getSpreadsheet();
  var sheet = getSheetOrCreate(ss, sheetName);
  var lastRow = sheet.getLastRow();
  var headers = RG_SHEETS_SCHEMA[sheetName];
  if (lastRow <= 1) return [];

  var values = sheet.getRange(1, 1, lastRow, headers.length).getValues();
  var fileHeaders = values[0];
  var records = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var isEmpty = true;
    var obj = {};
    for (var c = 0; c < fileHeaders.length; c++) {
      var header = fileHeaders[c] || headers[c];
      var cell = row[c];
      if (cell !== '' && cell !== null && cell !== undefined) {
        isEmpty = false;
      }
      if (cell instanceof Date) {
        obj[header] = cell.toISOString();
      } else {
        obj[header] = cell;
      }
    }
    if (!isEmpty) {
      records.push(obj);
    }
  }

  if (!skipCache) {
    try {
      var serialized = JSON.stringify(records);
      if (serialized.length < 90000) {
        CacheService.getScriptCache().put(getCacheKey(sheetName), serialized, 120);
      }
    } catch (e) {}
  }

  return records;
}

function findRecordById(sheetName, idField, idValue) {
  var target = normalizeStr(idValue);
  if (!target) return null;
  var rows = readAllRecords(sheetName, true);
  for (var i = 0; i < rows.length; i++) {
    if (normalizeStr(rows[i][idField]) === target) {
      return rows[i];
    }
  }
  return null;
}

function appendRecord(sheetName, recordObj) {
  var ss = getSpreadsheet();
  var sheet = getSheetOrCreate(ss, sheetName);
  var headers = RG_SHEETS_SCHEMA[sheetName];
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var val = recordObj[headers[i]];
    row.push(val !== undefined && val !== null ? val : '');
  }
  sheet.appendRow(row);
  invalidateCache(sheetName);
  return recordObj;
}

function updateRecordByKey(sheetName, keyField, keyValue, patchObj) {
  var ss = getSpreadsheet();
  var sheet = getSheetOrCreate(ss, sheetName);
  var headers = RG_SHEETS_SCHEMA[sheetName];
  var keyIndex = headers.indexOf(keyField);
  if (keyIndex === -1) throw new Error('حقل المفتاح غير موجود: ' + keyField);

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;

  var range = sheet.getRange(2, 1, lastRow - 1, headers.length);
  var values = range.getValues();
  var target = normalizeStr(keyValue);

  for (var r = 0; r < values.length; r++) {
    if (normalizeStr(values[r][keyIndex]) === target) {
      var updated = {};
      for (var c = 0; c < headers.length; c++) {
        var h = headers[c];
        if (Object.prototype.hasOwnProperty.call(patchObj, h)) {
          values[r][c] = patchObj[h] !== undefined && patchObj[h] !== null ? patchObj[h] : '';
        }
        updated[h] = values[r][c] instanceof Date ? values[r][c].toISOString() : values[r][c];
      }
      sheet.getRange(r + 2, 1, 1, headers.length).setValues([values[r]]);
      invalidateCache(sheetName);
      return updated;
    }
  }
  return null;
}

function upsertRecordByKey(sheetName, keyField, keyValue, recordObj) {
  var updated = updateRecordByKey(sheetName, keyField, keyValue, recordObj);
  if (updated) return { action: 'updated', record: updated };
  appendRecord(sheetName, recordObj);
  return { action: 'inserted', record: recordObj };
}

function deleteRecordByKey(sheetName, keyField, keyValue) {
  var ss = getSpreadsheet();
  var sheet = getSheetOrCreate(ss, sheetName);
  var headers = RG_SHEETS_SCHEMA[sheetName];
  var keyIndex = headers.indexOf(keyField);
  if (keyIndex === -1) return false;

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;

  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var target = normalizeStr(keyValue);

  for (var r = values.length - 1; r >= 0; r--) {
    if (normalizeStr(values[r][keyIndex]) === target) {
      sheet.deleteRow(r + 2);
      invalidateCache(sheetName);
      return true;
    }
  }
  return false;
}

function logActivity(user, actionType, entityType, entityId, details) {
  var now = new Date();
  appendRecord(RG_SHEETS.ACTIVITY_LOG, {
    id: generateId('ACT'),
    userId: user ? user.id : 'system',
    userName: user ? user.name : 'النظام',
    userRole: user ? user.role : 'system',
    actionType: actionType,
    entityType: entityType || '',
    entityId: entityId || '',
    details: details || '',
    logDate: formatDateOnly(now),
    logTime: formatTimeOnly(now),
    createdAt: now.toISOString()
  });
}

function createNotification(recipientEmployeeId, recipientRole, type, title, message, entityType, entityId) {
  appendRecord(RG_SHEETS.NOTIFICATIONS, {
    id: generateId('NTF'),
    recipientEmployeeId: recipientEmployeeId || '',
    recipientRole: recipientRole || '',
    type: type || 'info',
    title: title || '',
    message: message || '',
    entityType: entityType || '',
    entityId: entityId || '',
    isRead: 'false',
    createdAt: nowIso()
  });
}
