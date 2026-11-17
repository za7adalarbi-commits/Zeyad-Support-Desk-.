/**
 * RENTAL GATE CRM — System Settings, GAS /exec Connection & Rental Gate API Sync Center
 */
(function (root) {
  'use strict';

  async function render(container, ctx) {
    var t = ctx.t;
    var user = root.RGAuth.getUser();
    var canAccessApi = root.RGCrmCore.canAccessApi(user);
    var canSync = root.RGCrmCore.canUserPerform(user, 'sync_data');
    var canManageSettings = root.RGCrmCore.canUserPerform(user, 'manage_settings');

    if (!canAccessApi && !canManageSettings) {
      container.innerHTML =
        '<div class="surface-card">' +
          '<h2 class="section-title">صلاحية مقيدة</h2>' +
          '<p class="section-subtitle">إعدادات النظام وربط API والمزامنة مخصصة للمدير العام والمشرف فقط.</p>' +
        '</div>';
      return;
    }

    var results = await Promise.all([
      root.RGApi.callApi('getSettings', {}),
      canSync ? root.RGApi.callApi('getSyncStatus', {}) : Promise.resolve({ success: true, data: { logs: [], lastSync: null } })
    ]);

    var settingsRes = results[0];
    var syncRes = results[1];
    var settings = (settingsRes.success && settingsRes.data) || {};
    var syncData = (syncRes.success && syncRes.data) || { logs: [], lastSync: null };
    var lastSync = syncData.lastSync;

    var autoSyncEnabled = settings.auto_sync_enabled !== undefined ? Boolean(settings.auto_sync_enabled) : (syncData.autoSyncEnabled !== false);
    var autoSyncHours = Number(settings.auto_sync_interval_hours || syncData.autoSyncIntervalHours || 12);

    container.innerHTML =
      '<div class="surface-card">' +
        '<div class="section-header">' +
          '<div><h2 class="section-title">ربط Google Apps Script Web App (/exec)</h2>' +
          '<p class="section-subtitle">مخصص للمدير العام والمشرف فقط · الوضع الحالي: <strong>' + (root.RGApi.isLiveMode() ? 'متصل فعليًا بـ Google Apps Script & Google Sheets' : 'وضع المعاينة المحلية (Sandbox)') + '</strong></p></div>' +
        '</div>' +
        '<div class="form-grid-2">' +
          '<div class="form-group">' +
            '<label class="form-label" for="set-gas-url">رابط Web App (/exec)</label>' +
            '<input class="input mono" id="set-gas-url" placeholder="https://script.google.com/macros/s/.../exec" value="' + root.RGApi.getGasUrl() + '">' +
          '</div>' +
          '<div class="form-group" style="justify-content:flex-end;">' +
            '<div class="toolbar-row" style="margin-bottom:0;">' +
              '<button type="button" class="btn btn-primary" id="btn-save-gas-url">حفظ الرابط</button>' +
              '<button type="button" class="btn" id="btn-ping-gas-url">فحص رابط Apps Script</button>' +
              '<button type="button" class="btn btn-danger" id="btn-clear-gas-url">العودة لوضع المعاينة</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div id="gas-ping-result" class="hidden" style="margin-top:10px;"></div>' +
        '<details style="margin-top:12px;padding:10px 12px;border:1px solid var(--border-hairline);border-radius:var(--radius-sm);background:var(--bg-surface-subtle);">' +
          '<summary style="cursor:pointer;font-weight:700;font-size:13px;">خطوات الربط السريع مع Google Sheets & Google Apps Script</summary>' +
          '<ol style="margin:10px 0 0;padding-inline-start:20px;font-size:12.5px;line-height:1.8;color:var(--text-secondary);">' +
            '<li>أنشئ Google Sheet جديد وانسخ معرفه (<span class="mono">SPREADSHEET_ID</span>) من الرابط.</li>' +
            '<li>افتح <strong>Extensions → Apps Script</strong> وأنشئ الملفات (<span class="mono">Code.gs, Utils.gs, Database.gs, Auth.gs, Reservations.gs, FollowUps.gs, Problems.gs, Employees.gs, Reports.gs, Settings.gs</span>).</li>' +
            '<li>من <strong>Project Settings → Script Properties</strong> أضف <span class="mono">SPREADSHEET_ID</span> و <span class="mono">RG_TOKEN</span>.</li>' +
            '<li>شغّل الدالة <span class="mono">setupRentalGateDatabase()</span> مرة واحدة لإنشاء الـ 12 تبويبًا وحساب المدير وتفعيل المزامنة التلقائية كل 12 ساعة.</li>' +
            '<li>اضغط <strong>Deploy → New deployment → Web app</strong> (Execute as: <strong>Me</strong>, Who has access: <strong>Anyone</strong>) ثم الصق رابط <span class="mono">/exec</span> أعلاه.</li>' +
          '</ol>' +
        '</details>' +
      '</div>' +

      (canSync ? (
        '<div class="surface-card">' +
          '<div class="section-header">' +
            '<div><h2 class="section-title">مزامنة بيانات Rental Gate API</h2>' +
            '<p class="section-subtitle">يتم السحب حصريًا عبر Google Apps Script باستخدام RG_TOKEN المحفوظ في Script Properties.</p></div>' +
            '<div class="toolbar-row" style="margin-bottom:0;">' +
              '<button type="button" class="btn" id="btn-test-rg">اختبار الاتصال</button>' +
              '<button type="button" class="btn btn-primary" id="btn-sync-now">سحب الحجوزات الآن</button>' +
            '</div>' +
          '</div>' +
          '<div class="detail-summary-grid" style="margin-bottom:16px;">' +
            '<div class="detail-kv"><span class="detail-k">حالة الاتصال</span><span class="detail-v" id="sync-conn-status">' + (root.RGApi.isLiveMode() ? (settings.hasRgToken ? 'RG_TOKEN مضبوط في Apps Script' : 'تحقق من RG_TOKEN في Script Properties') : 'وضع المعاينة المحلية') + '</span></div>' +
            '<div class="detail-kv"><span class="detail-k">جدولة التحديث التلقائي</span><span class="detail-v" id="sync-auto-badge">' + (autoSyncEnabled ? ('مفعل — كل ' + autoSyncHours + ' ساعة') : 'متوقف حاليًا') + '</span></div>' +
            '<div class="detail-kv"><span class="detail-k">آخر تاريخ سحب</span><span class="detail-v mono">' + (lastSync ? String(lastSync.finishedAt).replace('T', ' ').substring(0, 19) : 'لم يتم السحب بعد') + '</span></div>' +
            '<div class="detail-kv"><span class="detail-k">الحجوزات المستوردة / المحدثة / التمديدات</span><span class="detail-v tabular-nums">' + (lastSync ? (lastSync.importedCount + ' مستورد · ' + lastSync.updatedCount + ' محدث · ' + lastSync.extensionsCount + ' تمديد') : '0 / 0 / 0') + '</span></div>' +
          '</div>' +
          '<div id="sync-action-msg" class="hidden" style="margin-bottom:14px;"></div>' +
          '<h3 style="margin:0 0 10px;font-size:14.5px;">سجل عمليات السحب (SyncLog)</h3>' +
          (syncData.logs.length === 0
            ? '<div class="empty-state" style="padding:20px;">لا توجد عمليات مزامنة مسجلة بعد.</div>'
            : '<div class="table-wrap"><table class="data-table"><thead><tr>' +
                '<th>المعرف</th><th>المنفذ</th><th>الحالة</th><th>مستورد</th><th>محدث</th><th>تمديدات</th><th>الصفحات</th><th>الرسالة</th><th>التوقيت</th>' +
              '</tr></thead><tbody>' +
                syncData.logs.map(function (l) {
                  return '<tr>' +
                    '<td class="mono">' + l.id + '</td>' +
                    '<td>' + l.triggeredByName + '</td>' +
                    '<td><span class="status-tag ' + (l.status === 'success' ? 'status-success' : 'status-danger') + '">' + (l.status === 'success' ? 'ناجح' : 'فشل') + '</span></td>' +
                    '<td class="tabular-nums">' + l.importedCount + '</td>' +
                    '<td class="tabular-nums">' + l.updatedCount + '</td>' +
                    '<td class="tabular-nums">' + l.extensionsCount + '</td>' +
                    '<td class="tabular-nums">' + l.pagesFetched + '</td>' +
                    '<td>' + (l.errorMessage || '-') + '</td>' +
                    '<td class="mono">' + String(l.finishedAt || '').replace('T', ' ').substring(0, 16) + '</td>' +
                  '</tr>';
                }).join('') +
              '</tbody></table></div>') +
        '</div>'
      ) : '') +

      (canManageSettings ? (
        '<form class="surface-card" id="sys-settings-form">' +
          '<div class="section-header"><div><h2 class="section-title">' + t('nav_settings') + ' العامة والتحديث التلقائي</h2><p class="section-subtitle">تُحفظ الإعدادات في تبويب Settings وتُحدّث مؤقت Apps Script تلقائيًا.</p></div></div>' +
          '<div class="form-grid-2">' +
            '<div class="form-group"><label class="form-label" for="set-company">اسم الشركة</label><input class="input" id="set-company" value="' + (settings.company_name || 'RENTAL GATE') + '"></div>' +
            '<div class="form-group"><label class="form-label" for="set-ttl">مدة صلاحية الجلسة (ساعات)</label><input class="input tabular-nums" type="number" min="1" max="168" id="set-ttl" value="' + (settings.session_ttl_hours || 24) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="set-excluded">الحالات المستبعدة أثناء السحب (مفصولة بفاصلة)</label><input class="input mono" id="set-excluded" value="' + (Array.isArray(settings.excluded_statuses) ? settings.excluded_statuses.join(', ') : 'draft, test, abandoned') + '"></div>' +
            '<div class="form-group" style="justify-content:center;"><label class="checkbox-item"><input type="checkbox" id="set-agent-all"' + (settings.allow_agent_view_all ? ' checked' : '') + '> السماح لموظف خدمة العملاء باستعراض جميع الحجوزات</label></div>' +
          '</div>' +

          '<div style="margin-top:16px;padding:14px;border:1px solid var(--border-hairline);border-radius:var(--radius-sm);background:var(--bg-surface-subtle);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">' +
              '<div><strong style="font-size:14px;">إعدادات التحديث التلقائي من Rental Gate API</strong>' +
              '<div style="font-size:12px;color:var(--text-muted);">يعمل تلقائيًا كل 12 ساعة افتراضيًا عبر Trigger في Google Apps Script، ويمكنك تعديل الفترة هنا.</div></div>' +
              '<label class="checkbox-item" style="font-weight:700;"><input type="checkbox" id="set-auto-sync-enabled"' + (autoSyncEnabled ? ' checked' : '') + '> تفعيل التحديث التلقائي</label>' +
            '</div>' +
            '<div class="form-grid-2" style="align-items:end;">' +
              '<div class="form-group">' +
                '<label class="form-label" for="set-auto-sync-hours">فترة التحديث التلقائي (بالساعات)</label>' +
                '<input class="input tabular-nums" type="number" min="1" max="168" id="set-auto-sync-hours" value="' + autoSyncHours + '">' +
              '</div>' +
              '<div class="form-group">' +
                '<span class="form-label">اختيارات سريعة</span>' +
                '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                  '<button type="button" class="btn btn-sm auto-sync-preset" data-hours="1">كل ساعة</button>' +
                  '<button type="button" class="btn btn-sm auto-sync-preset" data-hours="4">كل 4 ساعات</button>' +
                  '<button type="button" class="btn btn-sm auto-sync-preset" data-hours="6">كل 6 ساعات</button>' +
                  '<button type="button" class="btn btn-sm auto-sync-preset" data-hours="12">كل 12 ساعة (الافتراضي)</button>' +
                  '<button type="button" class="btn btn-sm auto-sync-preset" data-hours="24">كل 24 ساعة</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div style="margin-top:14px;"><button type="submit" class="btn btn-primary" id="btn-save-sys-settings">حفظ الإعدادات وتحديث المزامنة التلقائية</button></div>' +
        '</form>'
      ) : '');

    document.getElementById('btn-save-gas-url').addEventListener('click', function () {
      var val = document.getElementById('set-gas-url').value.trim();
      root.RGApi.setGasUrl(val);
      root.RGApi.setToken('');
      ctx.toast(val ? 'تم حفظ رابط Google Apps Script. يرجى تسجيل الدخول على الخادم الفعلي.' : 'تم المسح.');
      root.RGAuth.logout().then(function () { ctx.onAuthChanged(); });
    });

    document.getElementById('btn-clear-gas-url').addEventListener('click', function () {
      root.RGApi.setGasUrl('');
      root.RGApi.setToken('');
      ctx.toast('تم التبديل إلى وضع المعاينة المحلية.');
      ctx.onAuthChanged();
    });

    document.getElementById('btn-ping-gas-url').addEventListener('click', async function () {
      var val = document.getElementById('set-gas-url').value.trim();
      var out = document.getElementById('gas-ping-result');
      if (!val) {
        out.className = 'form-error';
        out.textContent = 'يرجى إدخال رابط Web App (/exec) أولاً.';
        return;
      }
      var res = await root.RGApi.pingGasUrl(val);
      out.className = res.success ? 'form-success' : 'form-error';
      out.textContent = res.message || (res.success ? 'الاتصال ناجح!' : 'فشل الاتصال.');
    });

    var testRgBtn = document.getElementById('btn-test-rg');
    if (testRgBtn) {
      testRgBtn.addEventListener('click', async function () {
        var msg = document.getElementById('sync-action-msg');
        var res = await root.RGApi.callApi('testConnection', {});
        msg.className = (res.success && res.data && res.data.connected) ? 'form-success' : 'form-error';
        msg.textContent = (res.data && res.data.message) || res.message;
      });
    }

    var syncNowBtn = document.getElementById('btn-sync-now');
    if (syncNowBtn) {
      syncNowBtn.addEventListener('click', async function () {
        syncNowBtn.disabled = true;
        syncNowBtn.textContent = 'جاري السحب...';
        var res = await root.RGApi.callApi('syncRentalGate', {});
        if (res.success) {
          ctx.toast('اكتملت المزامنة بنجاح.');
          render(container, ctx);
        } else {
          var msg = document.getElementById('sync-action-msg');
          msg.className = 'form-error';
          msg.textContent = res.message;
          syncNowBtn.disabled = false;
          syncNowBtn.textContent = 'سحب الحجوزات الآن';
        }
      });
    }

    container.querySelectorAll('.auto-sync-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var inp = document.getElementById('set-auto-sync-hours');
        var chk = document.getElementById('set-auto-sync-enabled');
        if (inp) inp.value = btn.getAttribute('data-hours');
        if (chk) chk.checked = true;
      });
    });

    var sysForm = document.getElementById('sys-settings-form');
    if (sysForm) {
      sysForm.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        var excluded = document.getElementById('set-excluded').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var autoEnabled = document.getElementById('set-auto-sync-enabled').checked;
        var autoHours = Math.max(1, Math.min(168, Number(document.getElementById('set-auto-sync-hours').value || 12)));
        var res = await root.RGApi.callApi('updateSettings', {
          company_name: document.getElementById('set-company').value,
          session_ttl_hours: Number(document.getElementById('set-ttl').value || 24),
          excluded_statuses: excluded,
          allow_agent_view_all: document.getElementById('set-agent-all').checked,
          auto_sync_enabled: autoEnabled,
          auto_sync_interval_hours: autoHours
        });
        if (res.success) {
          ctx.toast('تم حفظ الإعدادات وتحديث جدول التحديث التلقائي (' + (autoEnabled ? ('كل ' + autoHours + ' ساعة') : 'متوقف') + ').');
          render(container, ctx);
        } else {
          ctx.toast(res.message, true);
        }
      });
    }
  }

  root.RGSettings = {
    render: render
  };
})(window);
