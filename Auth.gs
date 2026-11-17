/**
 * RENTAL GATE CRM — Authentication, Sessions & Server-Side RBAC
 */

function sha256Hex(input) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(input), Utilities.Charset.UTF_8);
  var hex = [];
  for (var i = 0; i < digest.length; i++) {
    var b = (digest[i] + 256) % 256;
    var s = b.toString(16);
    if (s.length === 1) s = '0' + s;
    hex.push(s);
  }
  return hex.join('');
}

function hashPassword(password, salt) {
  return sha256Hex(String(salt) + '::RENTAL_GATE_CRM::' + String(password));
}

function hashToken(rawToken) {
  return sha256Hex('TOKEN::' + String(rawToken));
}

function getSessionTtlHours() {
  var rec = findRecordById(RG_SHEETS.SETTINGS, 'key', 'session_ttl_hours');
  var h = rec ? toNumber(rec.value, 24) : 24;
  return h > 0 ? h : 24;
}

function handleLogin(payload) {
  var username = normalizeStr(payload.username).toLowerCase();
  var password = String(payload.password || '');

  if (!username || !password) {
    throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور.');
  }

  return withScriptLock(function () {
    var employees = readAllRecords(RG_SHEETS.EMPLOYEES, true);
    var user = null;
    for (var i = 0; i < employees.length; i++) {
      if (normalizeStr(employees[i].username).toLowerCase() === username) {
        user = employees[i];
        break;
      }
    }

    if (!user) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }

    if (normalizeStr(user.status) !== 'active') {
      throw new Error('هذا الحساب موقوف حاليًا. يرجى مراجعة المدير العام.');
    }

    var expectedHash = hashPassword(password, user.salt);
    if (expectedHash !== user.passwordHash) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }

    var rawToken = generateId('SES') + '_' + Utilities.getUuid().replace(/-/g, '');
    var tokenHash = hashToken(rawToken);
    var ttlHours = getSessionTtlHours();
    var now = new Date();
    var expiresAt = new Date(now.getTime() + ttlHours * 3600 * 1000);

    appendRecord(RG_SHEETS.SESSIONS, {
      tokenHash: tokenHash,
      employeeId: user.id,
      username: user.username,
      role: user.role,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
      isRevoked: 'false'
    });

    updateRecordByKey(RG_SHEETS.EMPLOYEES, 'id', user.id, {
      lastActivity: now.toISOString()
    });

    logActivity(user, 'تسجيل الدخول', 'Employee', user.id, 'تسجيل دخول ناجح للمستخدم ' + user.username);

    return {
      token: rawToken,
      expiresAt: expiresAt.toISOString(),
      user: sanitizeEmployeeForClient(user)
    };
  });
}

function handleLogout(session) {
  return withScriptLock(function () {
    updateRecordByKey(RG_SHEETS.SESSIONS, 'tokenHash', session.tokenHash, {
      isRevoked: 'true',
      lastSeenAt: nowIso()
    });
    logActivity(session.user, 'تسجيل الخروج', 'Employee', session.user.id, 'تسجيل خروج');
    return { loggedOut: true };
  });
}

function requireAuth(token) {
  var rawToken = normalizeStr(token);
  if (!rawToken) {
    throw new Error('UNAUTHORIZED: جلسة غير مصرح بها، يرجى تسجيل الدخول.');
  }

  var tokenHash = hashToken(rawToken);
  var sessionRec = findRecordById(RG_SHEETS.SESSIONS, 'tokenHash', tokenHash);
  if (!sessionRec || toBool(sessionRec.isRevoked)) {
    throw new Error('UNAUTHORIZED: الجلسة منتهية أو تم تسجيل الخروج.');
  }

  if (new Date(sessionRec.expiresAt).getTime() <= Date.now()) {
    throw new Error('UNAUTHORIZED: انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجددًا.');
  }

  var user = findRecordById(RG_SHEETS.EMPLOYEES, 'id', sessionRec.employeeId);
  if (!user || normalizeStr(user.status) !== 'active') {
    throw new Error('UNAUTHORIZED: الحساب غير نشط أو غير موجود.');
  }

  var cleanUser = sanitizeEmployeeForClient(user);
  return {
    tokenHash: tokenHash,
    employeeId: user.id,
    role: user.role,
    permissions: cleanUser.permissions,
    user: cleanUser
  };
}

function requireRole(session, allowedRoles) {
  if (!session || !session.role) {
    throw new Error('FORBIDDEN: لا توجد صلاحية صالحة.');
  }
  if (allowedRoles.indexOf(session.role) === -1) {
    throw new Error('FORBIDDEN: ليس لديك صلاحية تنفيذ هذا الإجراء.');
  }
}

function requirePermission(session, action) {
  if (!session || !hasPermission(session, action)) {
    throw new Error('FORBIDDEN: ليس لديك صلاحية تنفيذ هذا الإجراء (' + action + ').');
  }
}

function requireApiAccess(session) {
  if (!session || !canAccessApi(session.user || session)) {
    throw new Error('FORBIDDEN: صلاحيات API وإعدادات الربط مخصصة للمدير العام والمشرف فقط.');
  }
}

function revokeEmployeeSessions(employeeId) {
  var sessions = readAllRecords(RG_SHEETS.SESSIONS, true);
  for (var i = 0; i < sessions.length; i++) {
    if (sessions[i].employeeId === employeeId && !toBool(sessions[i].isRevoked)) {
      updateRecordByKey(RG_SHEETS.SESSIONS, 'tokenHash', sessions[i].tokenHash, {
        isRevoked: 'true'
      });
    }
  }
}
