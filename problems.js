/**
 * RENTAL GATE CRM — Problems, Priorities, Supervisor Ticket Editing & ProblemUpdates Audit Trail
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

  function prioBadge(p) {
    if (p === 'مرتفع') return '<span class="status-tag status-danger">مرتفع</span>';
    if (p === 'متوسط') return '<span class="status-tag status-warning">متوسط</span>';
    return '<span class="status-tag status-neutral">عادي</span>';
  }

  function statusBadge(s) {
    if (s === 'تم الحل' || s === 'مغلقة') return '<span class="status-tag status-success">' + esc(s) + '</span>';
    if (s === 'جديدة') return '<span class="status-tag status-danger">' + esc(s) + '</span>';
    return '<span class="status-tag status-warning">' + esc(s) + '</span>';
  }

  async function render(container, ctx) {
    var t = ctx.t;
    var state = ctx.state.problems || { status: '', priority: '', employeeId: '', search: '' };
    ctx.state.problems = state;

    var [prbRes, empRes] = await Promise.all([
      root.RGApi.callApi('getProblems', state),
      root.RGApi.callApi('getEmployees', {})
    ]);
    var items = (prbRes.success && prbRes.data.items) || [];
    var employees = (empRes.success && empRes.data.items) || [];

    container.innerHTML =
      '<div class="surface-card">' +
        '<div class="section-header">' +
          '<div><h2 class="section-title">' + t('nav_problems') + '</h2><p class="section-subtitle">إجمالي المشكلات المطابقة: <strong class="tabular-nums">' + items.length + '</strong></p></div>' +
        '</div>' +
        '<div class="filter-grid">' +
          '<input type="search" class="input" id="prb-search" placeholder="بحث برقم المشكلة أو الحجز أو العميل..." value="' + esc(state.search || '') + '">' +
          '<select class="select" id="prb-status" aria-label="حالة المشكلة"><option value="">جميع الحالات</option>' +
            root.RGCrmCore.PROBLEM_STATUSES.map(function (s) { return '<option value="' + esc(s) + '"' + (state.status === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') +
          '</select>' +
          '<select class="select" id="prb-prio" aria-label="الأولوية"><option value="">جميع الأولويات</option>' +
            root.RGCrmCore.PROBLEM_PRIORITIES.map(function (p) { return '<option value="' + esc(p) + '"' + (state.priority === p ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') +
          '</select>' +
          '<select class="select" id="prb-emp" aria-label="المسؤول"><option value="">جميع الموظفين</option>' +
            employees.map(function (e) { return '<option value="' + esc(e.id) + '"' + (state.employeeId === e.id ? ' selected' : '') + '>' + esc(e.name) + '</option>'; }).join('') +
          '</select>' +
          '<button type="button" class="btn btn-sm" id="prb-reset">إعادة ضبط</button>' +
        '</div>' +
        (items.length === 0
          ? '<div class="empty-state">لا توجد مشكلات مطابقة للفلاتر الحالية.</div>'
          : '<div class="table-wrap"><table class="data-table"><thead><tr>' +
              '<th>رقم المشكلة</th><th>رقم الحجز</th><th>العميل</th><th>الوصف</th><th>الأولوية</th><th>الحالة</th><th>المنشئ</th><th>المسؤولون</th><th>آخر تحديث</th><th>إدارة</th>' +
            '</tr></thead><tbody>' +
              items.map(function (p) {
                return '<tr>' +
                  '<td class="mono"><strong>' + esc(p.problemNumber) + '</strong></td>' +
                  '<td class="mono"><button type="button" class="btn-link-inline prb-open-res" data-res-id="' + esc(p.reservationId) + '">' + esc(p.reservationNumber) + '</button></td>' +
                  '<td>' + esc(p.customerName) + '</td>' +
                  '<td style="max-width:260px;">' + esc(p.description) + '</td>' +
                  '<td>' + prioBadge(p.priority) + '</td>' +
                  '<td>' + statusBadge(p.status) + '</td>' +
                  '<td>' + esc(p.createdByName) + '</td>' +
                  '<td>' + esc((p.assignedEmployeeNames || []).join('، ') || '-') + '</td>' +
                  '<td class="mono">' + String(p.updatedAt || '').replace('T', ' ').substring(0, 16) + '</td>' +
                  '<td><button type="button" class="btn btn-sm btn-primary btn-manage-prb" data-id="' + esc(p.id) + '">متابعة / تحديث</button></td>' +
                '</tr>';
              }).join('') +
            '</tbody></table></div>') +
      '</div>';

    var searchTimer = null;
    document.getElementById('prb-search').addEventListener('input', function (ev) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.search = ev.target.value;
        render(container, ctx);
      }, 220);
    });

    ['prb-status', 'prb-prio', 'prb-emp'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        state.status = document.getElementById('prb-status').value;
        state.priority = document.getElementById('prb-prio').value;
        state.employeeId = document.getElementById('prb-emp').value;
        render(container, ctx);
      });
    });

    document.getElementById('prb-reset').addEventListener('click', function () {
      state.status = ''; state.priority = ''; state.employeeId = ''; state.search = '';
      render(container, ctx);
    });

    container.querySelectorAll('.prb-open-res').forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.RGReservations.openReservationDrawer(btn.getAttribute('data-res-id'), ctx, employees, function () {
          render(container, ctx);
        });
      });
    });

    container.querySelectorAll('.btn-manage-prb').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = items.find(function (x) { return x.id === btn.getAttribute('data-id'); });
        if (p) openProblemUpdateModal(p, employees, ctx, function () { render(container, ctx); });
      });
    });
  }

  function openProblemUpdateModal(problem, employees, ctx, onSaved, onCancel) {
    var user = root.RGAuth.getUser();
    var canEditTicket = Boolean(user && root.RGCrmCore.canUserPerform(user, 'edit_ticket_details'));
    var modalRoot = document.getElementById('modal-root');

    modalRoot.innerHTML =
      '<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="prb-upd-title">' +
        '<form class="modal-panel" id="prb-upd-form">' +
          '<div class="modal-header">' +
            '<div><h3 class="modal-title mono" id="prb-upd-title">' + esc(problem.problemNumber) + ' — حجز ' + esc(problem.reservationNumber) + '</h3>' +
            '<div class="meta-inline"><span>' + esc(problem.customerName) + '</span><span>·</span><span>أنشئت بواسطة: ' + esc(problem.createdByName) + '</span></div></div>' +
            '<button type="button" class="btn btn-sm" id="prb-upd-close">إغلاق</button>' +
          '</div>' +
          (canEditTicket
            ? '<div class="form-grid-2">' +
                '<div class="form-group"><label class="form-label" for="pu-customer">اسم العميل في التذكرة</label><input class="input" id="pu-customer" value="' + esc(problem.customerName) + '" required></div>' +
                '<div class="form-group"><label class="form-label" for="pu-status">الحالة</label><select class="select" id="pu-status">' +
                  root.RGCrmCore.PROBLEM_STATUSES.map(function (s) {
                    return '<option value="' + esc(s) + '"' + (problem.status === s ? ' selected' : '') + '>' + esc(s) + '</option>';
                  }).join('') +
                '</select></div>' +
              '</div>' +
              '<div class="form-group"><label class="form-label" for="pu-desc">بيانات ووصف التذكرة</label><textarea class="textarea" id="pu-desc" required>' + esc(problem.description) + '</textarea></div>' +
              '<div class="form-group"><label class="form-label" for="pu-prio">الأولوية</label><select class="select" id="pu-prio">' +
                root.RGCrmCore.PROBLEM_PRIORITIES.map(function (p) {
                  return '<option value="' + esc(p) + '"' + (problem.priority === p ? ' selected' : '') + '>' + esc(p) + '</option>';
                }).join('') +
              '</select></div>'
            : '<p style="margin:0;padding:12px;background:var(--bg-surface-subtle);border:1px solid var(--border-hairline);border-radius:var(--radius-sm);">' + esc(problem.description) + '</p>' +
              '<div class="form-grid-2">' +
                '<div class="form-group"><label class="form-label" for="pu-status">الحالة</label><select class="select" id="pu-status">' +
                  root.RGCrmCore.PROBLEM_STATUSES.map(function (s) {
                    return '<option value="' + esc(s) + '"' + (problem.status === s ? ' selected' : '') + '>' + esc(s) + '</option>';
                  }).join('') +
                '</select></div>' +
                '<div class="form-group"><label class="form-label" for="pu-prio">الأولوية</label><select class="select" id="pu-prio">' +
                  root.RGCrmCore.PROBLEM_PRIORITIES.map(function (p) {
                    return '<option value="' + esc(p) + '"' + (problem.priority === p ? ' selected' : '') + '>' + esc(p) + '</option>';
                  }).join('') +
                '</select></div>' +
              '</div>') +
          '<div class="form-group"><span class="form-label">الموظفون المشاركون في المعالجة</span><div class="checkbox-grid">' +
            employees.filter(function (e) { return e.status === 'active'; }).map(function (emp) {
              var chk = (problem.assignedEmployeeIds || []).indexOf(emp.id) !== -1 ? 'checked' : '';
              return '<label class="checkbox-item"><input type="checkbox" class="pu-emp-chk" value="' + esc(emp.id) + '" ' + chk + '> ' + esc(emp.name) + '</label>';
            }).join('') +
          '</div></div>' +
          '<div class="form-group"><label class="form-label" for="pu-note">ملاحظة التحديث' + (canEditTicket ? ' (اختيارية عند تعديل البيانات)' : '') + '</label>' +
            '<textarea class="textarea" id="pu-note" placeholder="سجّل تفاصيل الإجراء المتخذ..."' + (canEditTicket ? '' : ' required') + '></textarea></div>' +
          '<div><h4 style="margin:0 0 8px;font-size:13.5px;">سجل التعديلات (ProblemUpdates)</h4>' +
            '<div class="timeline-list">' +
              ((problem.updates || []).map(function (u) {
                return '<div class="timeline-item">' +
                  '<div style="display:flex;justify-content:space-between;gap:8px;"><strong>' + esc(u.employeeName) + '</strong><span class="mono" style="font-size:11.5px;color:var(--text-muted);">' + String(u.createdAt).replace('T', ' ').substring(0, 16) + '</span></div>' +
                  '<div style="font-size:12.5px;">الحالة: ' + esc(u.previousStatus || '-') + ' ← <strong>' + esc(u.newStatus) + '</strong> | الأولوية: ' + esc(u.previousPriority || '-') + ' ← <strong>' + esc(u.newPriority) + '</strong></div>' +
                  '<div>' + esc(u.note) + '</div>' +
                '</div>';
              }).join('') || '<div class="empty-state" style="padding:12px;">لا توجد تحديثات إضافية.</div>') +
            '</div>' +
          '</div>' +
          '<div class="modal-footer"><button type="submit" class="btn btn-primary">' + (canEditTicket ? 'حفظ التذكرة والتحديث' : 'حفظ التحديث') + '</button></div>' +
        '</form>' +
      '</div>';

    document.getElementById('prb-upd-close').addEventListener('click', function () {
      if (onCancel) onCancel();
      else modalRoot.innerHTML = '';
    });
    document.getElementById('prb-upd-form').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var empIds = Array.from(modalRoot.querySelectorAll('.pu-emp-chk:checked')).map(function (c) { return c.value; });
      var payload = {
        problemId: problem.id,
        status: document.getElementById('pu-status').value,
        priority: document.getElementById('pu-prio').value,
        assignedEmployeeIds: empIds,
        note: document.getElementById('pu-note').value
      };
      if (canEditTicket) {
        payload.customerName = document.getElementById('pu-customer').value;
        payload.description = document.getElementById('pu-desc').value;
      }
      var res = await root.RGApi.callApi('updateProblem', payload);
      if (res.success) {
        ctx.toast('تم تحديث التذكرة وتسجيل التعديل بنجاح.');
        ctx.refreshNotifications();
        if (onSaved) onSaved();
        else modalRoot.innerHTML = '';
      } else {
        ctx.toast(res.message, true);
      }
    });
  }

  root.RGProblems = {
    render: render,
    openProblemUpdateModal: openProblemUpdateModal
  };
})(window);
