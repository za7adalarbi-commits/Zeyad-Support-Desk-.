/**
 * RENTAL GATE CRM — Web App Entry Point (doGet & doPost)
 */

function doGet(e) {
  return handleApiRequest(e, 'GET');
}

function doPost(e) {
  return handleApiRequest(e, 'POST');
}

function handleApiRequest(e, method) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var body = {};
    if (method === 'POST' && e && e.postData && e.postData.contents) {
      body = safeJsonParse(e.postData.contents, {});
    }

    var action = normalizeStr(body.action || params.action);
    var token = normalizeStr(body.token || params.token);
    var payload = body.payload || params || {};

    if (!action || action === 'ping') {
      return jsonResponse(true, 'RENTAL GATE CRM API متصل ويعمل بنجاح.', {
        service: 'RENTAL GATE CRM',
        timestamp: nowIso()
      });
    }

    if (action === 'login') {
      var loginData = handleLogin(payload);
      return jsonResponse(true, 'تم تسجيل الدخول بنجاح.', loginData);
    }

    var session = requireAuth(token);

    var result = null;
    switch (action) {
      case 'logout':
        result = handleLogout(session);
        break;
      case 'getMe':
        result = { user: session.user };
        break;
      case 'getDashboard':
        result = getDashboard(session, payload);
        break;
      case 'getReservations':
        result = getReservations(session, payload);
        break;
      case 'getReservationDetails':
        result = getReservationDetails(session, payload);
        break;
      case 'claimReservation':
        result = claimReservation(session, payload);
        break;
      case 'unclaimReservation':
        result = unclaimReservation(session, payload);
        break;
      case 'quickUpdateReservationStatus':
        result = quickUpdateReservationStatus(session, payload);
        break;
      case 'updateReservationDetails':
        result = updateReservationDetails(session, payload);
        break;
      case 'addFollowUp':
        result = addFollowUp(session, payload);
        break;
      case 'updateFollowUp':
        result = updateFollowUp(session, payload);
        break;
      case 'assignEmployees':
        result = assignEmployees(session, payload);
        break;
      case 'removeAssignment':
        result = removeAssignment(session, payload);
        break;
      case 'getMyFollowUps':
        result = getMyFollowUps(session, payload);
        break;
      case 'getTeamFollowUps':
        result = getTeamFollowUps(session, payload);
        break;
      case 'createProblem':
        result = createProblem(session, payload);
        break;
      case 'updateProblem':
        result = updateProblem(session, payload);
        break;
      case 'getProblems':
        result = getProblems(session, payload);
        break;
      case 'getEmployees':
        result = getEmployees(session);
        break;
      case 'getEmployeeDetails':
        result = getEmployeeDetails(session, payload);
        break;
      case 'createEmployee':
        result = createEmployee(session, payload);
        break;
      case 'updateEmployee':
        result = updateEmployee(session, payload);
        break;
      case 'disableEmployee':
        result = disableEmployee(session, payload);
        break;
      case 'saveRolePreset':
        result = saveRolePreset(session, payload);
        break;
      case 'deleteRolePreset':
        result = deleteRolePreset(session, payload);
        break;
      case 'resetRolePresets':
        result = resetRolePresets(session);
        break;
      case 'savePermissionDefinition':
        result = savePermissionDefinition(session, payload);
        break;
      case 'deletePermissionDefinition':
        result = deletePermissionDefinition(session, payload);
        break;
      case 'getActivityLogs':
        result = getActivityLogs(session, payload);
        break;
      case 'getNotifications':
        result = getNotifications(session);
        break;
      case 'markNotificationRead':
        result = markNotificationRead(session, payload);
        break;
      case 'pullReservations':
        result = pullReservations(session);
        break;
      case 'syncRentalGate':
        result = syncRentalGate(session);
        break;
      case 'testConnection':
        result = testRentalGateConnection(session);
        break;
      case 'getSyncStatus':
        result = getSyncStatus(session);
        break;
      case 'getReports':
        result = getReports(session, payload);
        break;
      case 'getSettings':
        result = getSettings(session);
        break;
      case 'updateSettings':
        result = updateSettings(session, payload);
        break;
      default:
        return jsonResponse(false, 'الإجراء المطلوب غير معروف.', null, 'UNKNOWN_ACTION: ' + action);
    }

    return jsonResponse(true, 'تمت العملية بنجاح.', result, null);
  } catch (err) {
    return jsonResponse(false, err.message || 'حدث خطأ غير متوقع.', null, err.message || String(err));
  }
}

/**
 * دالة التهيئة الأولى: شغّلها مرة واحدة من محرر Apps Script
 * تنشئ التبويبات الـ12 وحساب المدير وتفعل المزامنة التلقائية كل 12 ساعة
 */
function setupRentalGateDatabase() {
  var result = initDatabase();
  var triggerInfo = configureAutoSyncTrigger(12, true);
  result.autoSyncTrigger = triggerInfo;
  Logger.log(JSON.stringify(result));
  return result;
}

/**
 * دالة مستقلة لتفعيل/تحديث المزامنة التلقائية كل 12 ساعة من محرر Apps Script
 */
function setupAutoSync12Hours() {
  var res = configureAutoSyncTrigger(12, true);
  Logger.log(JSON.stringify(res));
  return res;
}
