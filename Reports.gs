/**
 * RENTAL GATE CRM — Dashboard KPIs, Analytics, Reports, ActivityLog & Notifications
 */

function resolveDateRange(rangeKey, customFrom, customTo) {
  var today = new Date();
  var end = formatDateOnly(today);
  var start = '';

  if (rangeKey === 'today') {
    start = end;
  } else if (rangeKey === '7d') {
    start = formatDateOnly(new Date(today.getTime() - 6 * 86400000));
  } else if (rangeKey === '30d') {
    start = formatDateOnly(new Date(today.getTime() - 29 * 86400000));
  } else if (rangeKey === 'month') {
    start = end.substring(0, 7) + '-01';
  } else if (rangeKey === 'custom') {
    start = normalizeStr(customFrom);
    end = normalizeStr(customTo) || end;
  }
  return { start: start, end: end };
}

function getDashboard(session, params) {
  var range = resolveDateRange(normalizeStr(params.range) || '30d', params.dateFrom, params.dateTo);
  var todayStr = formatDateOnly(new Date());

  var reservations = readAllRecords(RG_SHEETS.RESERVATIONS, false);
  var followUps = readAllRecords(RG_SHEETS.FOLLOWUPS, false);
  var problems = readAllRecords(RG_SHEETS.PROBLEMS, false);
  var employees = readAllRecords(RG_SHEETS.EMPLOYEES, false);

  var filteredRes = reservations.filter(function (r) {
    var d = formatDateOnly(r.startDate || r.createdAt);
    if (range.start && d < range.start) return false;
    if (range.end && d > range.end) return false;
    return true;
  });

  var statusCounts = {
    'تم الحجز': 0,
    'تم التسليم': 0,
    'تم الاستلام': 0,
    'تم الإنشاء': 0,
    'تم الإلغاء': 0,
    'تم التمديد': 0,
    'لم يتم الحجز': 0
  };

  var companyCounts = {};
  var todayReservations = 0;
  var newReservations = 0;

  for (var i = 0; i < filteredRes.length; i++) {
    var res = filteredRes[i];
    var st = res.internalStatus || 'تم الإنشاء';
    if (Object.prototype.hasOwnProperty.call(statusCounts, st)) {
      statusCounts[st]++;
    }
    if (formatDateOnly(res.createdAt) === todayStr || formatDateOnly(res.startDate) === todayStr) {
      todayReservations++;
    }
    if (st === 'تم الإنشاء') newReservations++;
    var comp = res.companyName || 'غير محدد';
    companyCounts[comp] = (companyCounts[comp] || 0) + 1;
  }

  var todayFollowUps = 0;
  var dailyFollowUps = {};
  var empFollowUpCounts = {};

  for (var f = 0; f < followUps.length; f++) {
    var fu = followUps[f];
    if (fu.followUpDate === todayStr) todayFollowUps++;
    if (range.start && fu.followUpDate < range.start) continue;
    if (range.end && fu.followUpDate > range.end) continue;
    dailyFollowUps[fu.followUpDate] = (dailyFollowUps[fu.followUpDate] || 0) + 1;
    empFollowUpCounts[fu.employeeName] = (empFollowUpCounts[fu.employeeName] || 0) + 1;
  }

  var openProblems = 0;
  var closedProblems = 0;
  var highProblems = 0;
  var problemPriorities = { 'عادي': 0, 'متوسط': 0, 'مرتفع': 0 };

  for (var p = 0; p < problems.length; p++) {
    var pr = problems[p];
    var isClosed = pr.status === 'مغلقة' || pr.status === 'تم الحل';
    if (isClosed) closedProblems++;
    else openProblems++;
    if (pr.priority === 'مرتفع' && !isClosed) highProblems++;
    if (Object.prototype.hasOwnProperty.call(problemPriorities, pr.priority)) {
      problemPriorities[pr.priority]++;
    }
  }

  var empActivityComparison = [];
  for (var e = 0; e < employees.length; e++) {
    var emp = employees[e];
    if (emp.status !== 'active') continue;
    var assignedTotal = 0;
    for (var r2 = 0; r2 < filteredRes.length; r2++) {
      var aIds = safeJsonParse(filteredRes[r2].assignedEmployeeIds, []);
      if (aIds.indexOf(emp.id) !== -1) assignedTotal++;
    }
    empActivityComparison.push({
      name: emp.name,
      followUps: empFollowUpCounts[emp.name] || 0,
      assigned: assignedTotal
    });
  }

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
      employeeComparison: empActivityComparison
    }
  };
}

function getReports(session, params) {
  var reportType = normalizeStr(params.reportType) || 'all_reservations';
  var dateFrom = normalizeStr(params.dateFrom);
  var dateTo = normalizeStr(params.dateTo);
  var employeeId = normalizeStr(params.employeeId);
  var status = normalizeStr(params.status);
  var company = normalizeStr(params.company);
  var branch = normalizeStr(params.branch);
  var priority = normalizeStr(params.priority);

  var reservations = readAllRecords(RG_SHEETS.RESERVATIONS, false);
  var followUps = readAllRecords(RG_SHEETS.FOLLOWUPS, false);
  var problems = readAllRecords(RG_SHEETS.PROBLEMS, false);
  var extensions = readAllRecords(RG_SHEETS.EXTENSIONS, false);
  var employees = readAllRecords(RG_SHEETS.EMPLOYEES, false);

  var followedSet = {};
  for (var f = 0; f < followUps.length; f++) followedSet[followUps[f].reservationId] = true;

  var filteredRes = reservations.filter(function (r) {
    if (dateFrom && r.startDate < dateFrom) return false;
    if (dateTo && r.startDate > dateTo) return false;
    if (company && r.companyName !== company) return false;
    if (branch && r.branchName !== branch) return false;
    if (status && r.internalStatus !== status) return false;
    if (priority && r.priority !== priority) return false;
    if (employeeId) {
      var ids = safeJsonParse(r.assignedEmployeeIds, []);
      if (ids.indexOf(employeeId) === -1) return false;
    }
    return true;
  });

  if (toBool(params.logExport)) {
    logActivity(session.user, 'تصدير تقرير', 'Report', reportType, 'تصدير تقرير: ' + reportType);
  }

  if (reportType === 'followups_log') {
    var fuRows = followUps.filter(function (x) {
      if (dateFrom && x.followUpDate < dateFrom) return false;
      if (dateTo && x.followUpDate > dateTo) return false;
      if (employeeId && x.employeeId !== employeeId) return false;
      if (status && x.status !== status) return false;
      return true;
    });
    return { reportType: reportType, rows: fuRows };
  }

  if (reportType === 'problems') {
    var prRows = problems.map(formatProblemForClient).filter(function (p) {
      if (priority && p.priority !== priority) return false;
      if (status && p.status !== status) return false;
      if (employeeId && p.assignedEmployeeIds.indexOf(employeeId) === -1) return false;
      return true;
    });
    return { reportType: reportType, rows: prRows };
  }

  if (reportType === 'extensions') {
    return { reportType: reportType, rows: extensions };
  }

  if (reportType === 'unfollowed') {
    return {
      reportType: reportType,
      rows: filteredRes.filter(function (r) { return !followedSet[r.id]; })
    };
  }

  if (reportType === 'employee_performance') {
    var perf = employees.map(function (emp) {
      var empFus = followUps.filter(function (x) { return x.employeeId === emp.id; });
      var empRes = reservations.filter(function (r) {
        return safeJsonParse(r.assignedEmployeeIds, []).indexOf(emp.id) !== -1;
      });
      var empPrb = problems.filter(function (p) {
        return safeJsonParse(p.assignedEmployeeIds, []).indexOf(emp.id) !== -1;
      });
      return {
        employeeName: emp.name,
        jobTitle: emp.jobTitle,
        role: emp.role,
        assignedReservations: empRes.length,
        followUpsCount: empFus.length,
        problemsCount: empPrb.length,
        lastActivity: emp.lastActivity
      };
    });
    return { reportType: reportType, rows: perf };
  }

  return { reportType: reportType, rows: filteredRes };
}

function getActivityLogs(session, params) {
  var logs = readAllRecords(RG_SHEETS.ACTIVITY_LOG, true);
  var userId = normalizeStr(params.userId);
  var actionType = normalizeStr(params.actionType);
  var date = normalizeStr(params.date);

  var filtered = logs.filter(function (l) {
    if (!hasPermission(session, 'view_all_logs') && l.userId !== session.employeeId) {
      return false;
    }
    if (userId && l.userId !== userId) return false;
    if (actionType && l.actionType !== actionType) return false;
    if (date && l.logDate !== date) return false;
    return true;
  });

  filtered.sort(function (a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  return { items: filtered.slice(0, 300), total: filtered.length };
}

function getNotifications(session) {
  var all = readAllRecords(RG_SHEETS.NOTIFICATIONS, true);
  var mine = all.filter(function (n) {
    return n.recipientEmployeeId === session.employeeId ||
      (!n.recipientEmployeeId && n.recipientRole === session.role);
  });

  mine.sort(function (a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  var unreadCount = 0;
  var items = mine.slice(0, 50).map(function (n) {
    var read = toBool(n.isRead);
    if (!read) unreadCount++;
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      entityType: n.entityType,
      entityId: n.entityId,
      isRead: read,
      createdAt: n.createdAt
    };
  });

  return { items: items, unreadCount: unreadCount };
}

function markNotificationRead(session, payload) {
  return withScriptLock(function () {
    var all = readAllRecords(RG_SHEETS.NOTIFICATIONS, true);
    var targetId = normalizeStr(payload.notificationId);
    var markAll = toBool(payload.markAll);

    for (var i = 0; i < all.length; i++) {
      var n = all[i];
      var isMine = n.recipientEmployeeId === session.employeeId ||
        (!n.recipientEmployeeId && n.recipientRole === session.role);
      if (!isMine) continue;
      if (markAll || n.id === targetId) {
        updateRecordByKey(RG_SHEETS.NOTIFICATIONS, 'id', n.id, { isRead: 'true' });
      }
    }
    return { updated: true };
  });
}
