/**
 * RENTAL GATE CRM — My Follow-Ups (with Self-Unclaim & Quick Status) & Team Follow-Ups Views
 */
(function (root) {
  'use strict';

  function esc(val) {
    return String(val === null || val === undefined ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function renderMyFollowUps(container, ctx) {
    var t = ctx.t;
    var [res, empRes] = await Promise.all([
      root.RGApi.callApi('getMyFollowUps', {}),
      root.RGApi.callApi('getEmployees', {})
    ]);
    if (!res.success) {
      container.innerHTML = '<div class="form-error">' + esc(res.message) + '</div>';
      return;
    }

    var employees = (empRes.success && empRes.data.items) || [];
    var assigned = res.data.assignedReservations || [];
    var followUps = res.data.followUps || [];

    container.innerHTML =
      '<div class="surface-card">' +
        '<div class="section-header">' +
          '<div><h2 class="section-title">' + t('nav_my_followups') + '</h2><p class="section-subtitle">الحجوزات المستلمة والمسندة إليك (<strong class="tabular-nums">' + assigned.length + '</strong>) وسجل متابعاتك (<strong class="tabular-nums">' + followUps.length + '</strong>)</p></div>' +
        '</div>' +
        (assigned.length === 0
          ? '<div class="empty-state">لا توجد حجوزات مستلمة في قائمتك حاليًا — يمكنك استلام أي حجز من صفحة الحجوزات مباشرة.</div>'
          : '<div class="table-wrap"><table class="data-table"><thead><tr>' +
              '<th>رقم الحجز</th><th>العميل</th><th>الجوال</th><th>الشركة</th><th>السيارة</th><th>الحالة الداخلية</th><th>آخر تحديث</th><th>إجراءات</th>' +
            '</tr></thead><tbody>' +
              assigned.map(function (r) {
                return '<tr>' +
                  '<td class="mono"><strong>' + esc(r.reservationNumber) + '</strong></td>' +
                  '<td>' + esc(r.customerName) + '</td>' +
                  '<td class="mono">' + esc(r.customerPhone) + '</td>' +
                  '<td>' + esc(r.companyName) + '</td>' +
                  '<td>' + esc(r.carName) + '</td>' +
                  '<td>' +
                    '<select class="quick-status-select myfu-quick-status" data-id="' + esc(r.id) + '" aria-label="تحديث حالة ' + esc(r.reservationNumber) + '">' +
                      root.RGCrmCore.FOLLOWUP_STATUSES.map(function (s) {
                        return '<option value="' + esc(s) + '"' + (r.internalStatus === s ? ' selected' : '') + '>' + esc(s) + '</option>';
                      }).join('') +
                    '</select>' +
                  '</td>' +
                  '<td>' + esc(r.lastUpdateText || '-') + '</td>' +
                  '<td><div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;">' +
                    '<button type="button" class="btn btn-sm btn-primary myfu-open" data-id="' + esc(r.id) + '">متابعة / تفاصيل</button>' +
                    '<button type="button" class="btn btn-sm btn-danger myfu-unclaim" data-id="' + esc(r.id) + '">إلغاء الاستلام</button>' +
                  '</div></td>' +
                '</tr>';
              }).join('') +
            '</tbody></table></div>') +
      '</div>' +
      '<div class="surface-card">' +
        '<div class="section-header"><h3 class="section-title">سجل متابعاتي السابقة</h3></div>' +
        (followUps.length === 0
          ? '<div class="empty-state">لم تقم بتسجيل أي متابعات بعد.</div>'
          : '<div class="timeline-list">' + followUps.map(function (f) {
              return '<div class="timeline-item">' +
                '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">' +
                  '<button type="button" class="btn-link-inline mono myfu-open" data-id="' + esc(f.reservationId) + '">' + esc(f.reservationNumber) + ' — ' + esc(f.customerName) + '</button>' +
                  '<span class="status-tag status-info">' + esc(f.status) + '</span>' +
                '</div>' +
                '<div>' + esc(f.action) + '</div>' +
                (f.notes ? '<div style="color:var(--text-secondary);font-size:12.5px;">' + esc(f.notes) + '</div>' : '') +
                '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
                  '<div class="meta-inline mono"><span>' + esc(f.followUpDate) + '</span><span>·</span><span>' + esc(f.followUpTime) + '</span></div>' +
                  '<button type="button" class="btn btn-sm myfu-open" data-id="' + esc(f.reservationId) + '">تفاصيل الحجز</button>' +
                '</div>' +
              '</div>';
            }).join('') + '</div>') +
      '</div>';

    container.querySelectorAll('.myfu-quick-status').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        sel.disabled = true;
        var resp = await root.RGApi.callApi('quickUpdateReservationStatus', {
          reservationId: sel.getAttribute('data-id'),
          status: sel.value
        });
        if (resp.success) {
          ctx.toast('تم تحديث حالة الحجز إلى: ' + sel.value);
          ctx.refreshNotifications();
          renderMyFollowUps(container, ctx);
        } else {
          ctx.toast(resp.message, true);
          sel.disabled = false;
        }
      });
    });

    container.querySelectorAll('.myfu-unclaim').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        btn.disabled = true;
        var resp = await root.RGApi.callApi('unclaimReservation', { reservationId: btn.getAttribute('data-id') });
        if (resp.success) {
          ctx.toast(resp.message || 'تم إلغاء استلام الحجز.');
          ctx.refreshNotifications();
          renderMyFollowUps(container, ctx);
        } else {
          ctx.toast(resp.message, true);
          btn.disabled = false;
        }
      });
    });

    container.querySelectorAll('.myfu-open').forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.RGReservations.openReservationDrawer(btn.getAttribute('data-id'), ctx, employees, function () {
          renderMyFollowUps(container, ctx);
        });
      });
    });
  }

  async function renderTeamFollowUps(container, ctx) {
    var t = ctx.t;
    var state = ctx.state.teamFollowUps || { employeeId: '', status: '', date: '' };
    ctx.state.teamFollowUps = state;

    var [empRes, fuRes, empDetailRes] = await Promise.all([
      root.RGApi.callApi('getEmployees', {}),
      root.RGApi.callApi('getTeamFollowUps', state),
      state.employeeId ? root.RGApi.callApi('getEmployeeDetails', { employeeId: state.employeeId }) : Promise.resolve(null)
    ]);
    var employees = (empRes.success && empRes.data.items) || [];
    var items = (fuRes.success && fuRes.data.items) || [];
    var empDetails = (empDetailRes && empDetailRes.success) ? empDetailRes.data : null;

    container.innerHTML =
      '<div class="surface-card">' +
        '<div class="section-header">' +
          '<div><h2 class="section-title">' + t('nav_team_followups') + '</h2><p class="section-subtitle">سجل متابعات الفريق بالكامل — اضغط على أي حجز للاطلاع على كامل التفاصيل</p></div>' +
          (state.employeeId ? '<button type="button" class="btn btn-sm btn-primary" id="tfu-open-emp-profile">فتح ملف عملاء الموظف بالكامل</button>' : '') +
        '</div>' +
        '<div class="filter-grid">' +
          '<select class="select" id="tfu-emp" aria-label="الموظف"><option value="">جميع الموظفين</option>' +
            employees.map(function (e) { return '<option value="' + esc(e.id) + '"' + (state.employeeId === e.id ? ' selected' : '') + '>' + esc(e.name) + '</option>'; }).join('') +
          '</select>' +
          '<select class="select" id="tfu-status" aria-label="الحالة"><option value="">جميع الحالات</option>' +
            root.RGCrmCore.FOLLOWUP_STATUSES.map(function (s) { return '<option value="' + esc(s) + '"' + (state.status === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') +
          '</select>' +
          '<input type="date" class="input" id="tfu-date" value="' + esc(state.date || '') + '" aria-label="التاريخ">' +
          '<button type="button" class="btn btn-sm" id="tfu-reset">إعادة ضبط</button>' +
        '</div>' +
        (empDetails ? (
          '<div style="margin-bottom:18px;">' +
            '<h3 style="margin:0 0 10px;font-size:14.5px;">عملاء وحجوزات ' + esc(empDetails.employee.name) + ' (' + empDetails.assignedReservations.length + ')</h3>' +
            (empDetails.assignedReservations.length === 0
              ? '<div class="empty-state" style="padding:16px;">لا توجد حجوزات مسندة لهذا الموظف.</div>'
              : '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">' +
                  empDetails.assignedReservations.map(function (r) {
                    var story = r.latestFollowUp ? (r.latestFollowUp.status + ': ' + r.latestFollowUp.action) : (r.lastUpdateText || 'بانتظار المتابعة');
                    return '<button type="button" class="interactive-res-card tfu-open-res" data-res-id="' + esc(r.id) + '">' +
                      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;">' +
                        '<strong class="mono">' + esc(r.reservationNumber) + '</strong>' +
                        '<span class="status-tag status-info">' + esc(r.internalStatus) + '</span>' +
                      '</div>' +
                      '<div style="font-weight:600;">' + esc(r.customerName) + ' <span class="mono" style="font-size:12px;color:var(--text-muted);">(' + esc(r.customerPhone) + ')</span></div>' +
                      '<div class="res-story-box"><strong>ما حدث:</strong> ' + esc(story) + '</div>' +
                      '<div style="font-size:12px;color:var(--brand-primary);font-weight:700;">عرض تفاصيل الحجز ←</div>' +
                    '</button>';
                  }).join('') +
                '</div>') +
          '</div>'
        ) : '') +
        (items.length === 0
          ? '<div class="empty-state">لا توجد متابعات مطابقة.</div>'
          : '<div class="table-wrap"><table class="data-table"><thead><tr>' +
              '<th>رقم الحجز</th><th>العميل</th><th>الموظف</th><th>الحالة</th><th>الإجراء</th><th>الملاحظات</th><th>التاريخ والوقت</th><th>تفاصيل الحجز</th>' +
            '</tr></thead><tbody>' +
              items.map(function (f) {
                return '<tr>' +
                  '<td class="mono"><button type="button" class="btn-link-inline tfu-open-res" data-res-id="' + esc(f.reservationId) + '">' + esc(f.reservationNumber) + '</button></td>' +
                  '<td>' + esc(f.customerName) + '</td>' +
                  '<td><button type="button" class="btn-link-inline tfu-open-emp" data-emp-id="' + esc(f.employeeId) + '">' + esc(f.employeeName) + '</button></td>' +
                  '<td><span class="status-tag status-info">' + esc(f.status) + '</span></td>' +
                  '<td>' + esc(f.action) + '</td>' +
                  '<td>' + esc(f.notes || '-') + '</td>' +
                  '<td class="mono">' + esc(f.followUpDate) + ' ' + esc(f.followUpTime) + '</td>' +
                  '<td><button type="button" class="btn btn-sm btn-primary tfu-open-res" data-res-id="' + esc(f.reservationId) + '">التفاصيل</button></td>' +
                '</tr>';
              }).join('') +
            '</tbody></table></div>') +
      '</div>';

    ['tfu-emp', 'tfu-status', 'tfu-date'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        state.employeeId = document.getElementById('tfu-emp').value;
        state.status = document.getElementById('tfu-status').value;
        state.date = document.getElementById('tfu-date').value;
        renderTeamFollowUps(container, ctx);
      });
    });

    document.getElementById('tfu-reset').addEventListener('click', function () {
      state.employeeId = '';
      state.status = '';
      state.date = '';
      renderTeamFollowUps(container, ctx);
    });

    var openEmpBtn = document.getElementById('tfu-open-emp-profile');
    if (openEmpBtn && root.RGEmployees && root.RGEmployees.openEmployeeDetailsDrawer) {
      openEmpBtn.addEventListener('click', function () {
        root.RGEmployees.openEmployeeDetailsDrawer(state.employeeId, ctx, employees, function () {
          renderTeamFollowUps(container, ctx);
        });
      });
    }

    container.querySelectorAll('.tfu-open-res').forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.RGReservations.openReservationDrawer(btn.getAttribute('data-res-id'), ctx, employees, function () {
          renderTeamFollowUps(container, ctx);
        });
      });
    });

    container.querySelectorAll('.tfu-open-emp').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var eid = btn.getAttribute('data-emp-id');
        if (root.RGEmployees && root.RGEmployees.openEmployeeDetailsDrawer) {
          root.RGEmployees.openEmployeeDetailsDrawer(eid, ctx, employees, function () {
            renderTeamFollowUps(container, ctx);
          });
        }
      });
    });
  }

  root.RGFollowUps = {
    renderMyFollowUps: renderMyFollowUps,
    renderTeamFollowUps: renderTeamFollowUps
  };
})(window);
