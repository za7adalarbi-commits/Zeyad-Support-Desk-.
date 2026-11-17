/**
 * RENTAL GATE CRM — System Settings (Token & Secrets Never Exposed)
 */

function getSettings(session) {
  requireApiAccess(session);
  var rows = readAllRecords(RG_SHEETS.SETTINGS, true);
  var map = {};
  for (var i = 0; i < rows.length; i++) {
    map[rows[i].key] = rows[i].value;
  }

  var intervalHours = Math.max(1, Math.min(168, toNumber(map.auto_sync_interval_hours, 12)));
  var autoSyncEnabled = map.auto_sync_enabled !== undefined ? toBool(map.auto_sync_enabled) : true;

  return {
    company_name: map.company_name || 'RENTAL GATE',
    excluded_statuses: safeJsonParse(map.excluded_statuses, ['draft', 'test', 'abandoned']),
    session_ttl_hours: toNumber(map.session_ttl_hours, 24),
    allow_agent_view_all: toBool(map.allow_agent_view_all !== undefined ? map.allow_agent_view_all : 'true'),
    default_language: map.default_language || 'ar',
    auto_sync_enabled: autoSyncEnabled,
    auto_sync_interval_hours: intervalHours,
    hasRgToken: Boolean(getRgToken())
  };
}

function updateSettings(session, payload) {
  requirePermission(session, 'manage_settings');

  return withScriptLock(function () {
    var allowedKeys = [
      'company_name',
      'excluded_statuses',
      'session_ttl_hours',
      'allow_agent_view_all',
      'default_language',
      'auto_sync_enabled',
      'auto_sync_interval_hours'
    ];

    for (var i = 0; i < allowedKeys.length; i++) {
      var k = allowedKeys[i];
      if (!Object.prototype.hasOwnProperty.call(payload, k)) continue;
      var val = payload[k];
      if (k === 'excluded_statuses' && Array.isArray(val)) {
        val = JSON.stringify(val);
      } else if (k === 'auto_sync_interval_hours') {
        val = String(Math.max(1, Math.min(168, toNumber(val, 12))));
      } else if (k === 'auto_sync_enabled') {
        val = toBool(val) ? 'true' : 'false';
      } else {
        val = String(val);
      }
      upsertRecordByKey(RG_SHEETS.SETTINGS, 'key', k, {
        key: k,
        value: val,
        updatedBy: session.user.name,
        updatedAt: nowIso()
      });
    }

    var current = getSettings(session);
    configureAutoSyncTrigger(current.auto_sync_interval_hours, current.auto_sync_enabled);

    logActivity(session.user, 'تحديث الإعدادات', 'Settings', 'system',
      'تم تحديث إعدادات النظام (التحديث التلقائي: ' + (current.auto_sync_enabled ? ('كل ' + current.auto_sync_interval_hours + ' ساعة') : 'متوقف') + ')');
    return current;
  });
}
