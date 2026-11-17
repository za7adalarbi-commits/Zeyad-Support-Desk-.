/**
 * RENTAL GATE CRM — Reservations Grid, Self-Claim, Quick Status, Supervisor Controls & PDF Export
 */
(function (root) {
  'use strict';

  var ALL_COLUMNS = [
    { key: 'reservationNumber', label: 'رقم الحجز' },
    { key: 'customerName', label: 'اسم العميل' },
    { key: 'customerPhone', label: 'الجوال' },
    { key: 'companyName', label: 'الشركة' },
    { key: 'branchName', label: 'الفرع' },
    { key: 'carName', label: 'السيارة' },
    { key: 'startDate', label: 'بداية الحجز' },
    { key: 'endDate', label: 'نهاية الحجز' },
    { key: 'originalStatusAr', label: 'الحالة الأصلية' },
    { key: 'internalStatus', label: 'المتابعة الداخلية' },
    { key: 'assignedEmployeeNames', label: 'الموظفون المسؤولون' },
    { key: 'priority', label: 'الأولوية' },
    { key: 'lastUpdateText', label: 'آخر تحديث' },
    { key: 'lastUpdatedByName', label: 'آخر موظف' },
    { key: 'lastUpdatedAt', label: 'التاريخ والوقت' }
  ];

  function esc(val) {
    return String(val === null || val === undefined ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusClass(status) {
    if (['تم الحجز', 'تم التسليم', 'تم الاستلام', 'مؤكد', 'مكتمل'].indexOf(status) !== -1) return 'status-success';
    if (['تم التمديد', 'تم الإنشاء', 'جديد', 'قيد الانتظار'].indexOf(status) !== -1) return 'status-info';
    if (['لم يتم الحجز', 'تم الإلغاء', 'ملغي'].indexOf(status) !== -1) return 'status-warning';
    return 'status-neutral';
  }

  function priorityClass(prio) {
    if (prio === 'مرتفع') return 'status-danger';
    if (prio === 'متوسط') return 'status-warning';
    return 'status-neutral';
  }

  function formatTimestamp(iso) {
    if (!iso) return '-';
    return String(iso).replace('T', ' ').substring(0, 16);
  }

  async function render(container, ctx) {
    var t = ctx.t;
    var currentUser = root.RGAuth.getUser();
    var currentEmpId = currentUser ? currentUser.id : '';

    var defaultCols = JSON.parse(localStorage.getItem('rg_crm_visible_cols') || 'null') || ALL_COLUMNS.map(function (c) { return c.key; });
    var state = Object.assign({
      search: '', company: '', branch: '', status: '', employeeId: '', priority: '',
      dateFrom: '', dateTo: '', unfollowedOnly: false, hasProblemsOnly: false,
      sortBy: 'lastUpdatedAt', sortDir: 'desc', page: 1, pageSize: 20,
      visibleCols: defaultCols
    }, ctx.state.reservations || {});
    if (!Array.isArray(state.visibleCols) || state.visibleCols.length === 0) {
      state.visibleCols = defaultCols;
    }
    ctx.state.reservations = state;

    var [empRes, resData] = await Promise.all([
      root.RGApi.callApi('getEmployees', {}),
      root.RGApi.callApi('getReservations', state)
    ]);

    var employees = (empRes.success && empRes.data.items) || [];
    var payload = (resData.success && resData.data) || { items: [], total: 0, page: 1, totalPages: 1, facets: { companies: [], branches: [] } };
    var items = payload.items || [];
    var facets = payload.facets || { companies: [], branches: [] };

    var currentUser = root.RGAuth.getUser();
    var canPullReservations = Boolean(currentUser && root.RGCrmCore.canUserPerform(currentUser, 'pull_reservations'));

    container.innerHTML =
      '<div class="surface-card">' +
        '<div class="section-header">' +
          '<div>' +
            '<h2 class="section-title">' + t('nav_reservations') + '</h2>' +
            '<p class="section-subtitle">إجمالي النتائج المطابقة: <strong class="tabular-nums">' + payload.total + '</strong> · يمكنك استلام أي حجز وتحديث حالته مباشرة أو فتح التفاصيل</p>' +
          '</div>' +
          '<div class="toolbar-row" style="margin-bottom:0;">' +
            (canPullReservations ? '<button type="button" class="btn btn-charcoal" id="res-pull-btn" title="جلب أحدث الحجوزات والتمديدات">' + t('pull_reservations') + '</button>' : '') +
            '<button type="button" class="btn" id="res-cols-btn">' + t('toggle_columns') + '</button>' +
            '<button type="button" class="btn btn-primary" id="res-export-xlsx">' + t('export_excel') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="filter-grid">' +
          '<input type="search" class="input" id="res-search" placeholder="' + t('search_placeholder') + '" value="' + esc(state.search || '') + '">' +
          '<select class="select" id="res-company" aria-label="' + t('company') + '"><option value="">' + t('all_companies') + '</option>' +
            facets.companies.map(function (c) { return '<option value="' + esc(c) + '"' + (state.company === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') +
          '</select>' +
          '<select class="select" id="res-branch" aria-label="' + t('branch') + '"><option value="">' + t('all_branches') + '</option>' +
            facets.branches.map(function (b) { return '<option value="' + esc(b) + '"' + (state.branch === b ? ' selected' : '') + '>' + esc(b) + '</option>'; }).join('') +
          '</select>' +
          '<select class="select" id="res-status" aria-label="' + t('status') + '"><option value="">' + t('all_statuses') + '</option>' +
            root.RGCrmCore.FOLLOWUP_STATUSES.map(function (s) { return '<option value="' + esc(s) + '"' + (state.status === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') +
          '</select>' +
          '<select class="select" id="res-emp" aria-label="' + t('employee') + '"><option value="">' + t('all_employees') + '</option>' +
            employees.map(function (e) { return '<option value="' + esc(e.id) + '"' + (state.employeeId === e.id ? ' selected' : '') + '>' + esc(e.name) + '</option>'; }).join('') +
          '</select>' +
          '<select class="select" id="res-prio" aria-label="' + t('priority') + '"><option value="">' + t('all_priorities') + '</option>' +
            root.RGCrmCore.PROBLEM_PRIORITIES.map(function (p) { return '<option value="' + esc(p) + '"' + (state.priority === p ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') +
          '</select>' +
          '<input type="date" class="input" id="res-from" value="' + esc(state.dateFrom || '') + '" aria-label="' + t('from_date') + '">' +
          '<input type="date" class="input" id="res-to" value="' + esc(state.dateTo || '') + '" aria-label="' + t('to_date') + '">' +
        '</div>' +
        '<div class="toolbar-row">' +
          '<label class="checkbox-item"><input type="checkbox" id="res-unfollowed"' + (state.unfollowedOnly ? ' checked' : '') + '> ' + t('unfollowed_only') + '</label>' +
          '<label class="checkbox-item"><input type="checkbox" id="res-problems"' + (state.hasProblemsOnly ? ' checked' : '') + '> ' + t('has_problems_only') + '</label>' +
          '<button type="button" class="btn btn-sm" id="res-reset-filters">' + t('reset_filters') + '</button>' +
        '</div>' +
        '<div id="res-cols-panel" class="surface-card hidden" style="margin-bottom:14px;padding:12px;">' +
          '<div class="checkbox-grid">' +
            ALL_COLUMNS.map(function (col) {
              var checked = state.visibleCols.indexOf(col.key) !== -1 ? 'checked' : '';
              return '<label class="checkbox-item"><input type="checkbox" class="res-col-toggle" value="' + col.key + '" ' + checked + '> ' + col.label + '</label>';
            }).join('') +
          '</div>' +
        '</div>' +
        (items.length === 0
          ? '<div class="empty-state">لا توجد حجوزات مطابقة للفلاتر الحالية.</div>'
          : '<div class="table-wrap"><table class="data-table"><thead><tr>' +
              ALL_COLUMNS.filter(function (c) { return state.visibleCols.indexOf(c.key) !== -1; }).map(function (c) {
                var arrow = state.sortBy === c.key ? (state.sortDir === 'asc' ? ' ↑' : ' ↓') : '';
                return '<th class="sortable" data-sort="' + c.key + '">' + c.label + arrow + '</th>';
              }).join('') +
              '<th>إجراءات</th>' +
            '</tr></thead><tbody>' +
              items.map(function (r) {
                var assignedIds = Array.isArray(r.assignedEmployeeIds) ? r.assignedEmployeeIds : [];
                var assignedNames = Array.isArray(r.assignedEmployeeNames) ? r.assignedEmployeeNames : [];
                var isMine = currentEmpId && assignedIds.indexOf(currentEmpId) !== -1;

                var tds = ALL_COLUMNS.filter(function (c) { return state.visibleCols.indexOf(c.key) !== -1; }).map(function (c) {
                  if (c.key === 'reservationNumber') {
                    return '<td class="mono"><button type="button" class="btn-link-inline btn-open-res" data-id="' + esc(r.id) + '">' + esc(r.reservationNumber) + '</button>' +
                      (r.hasExtensions ? ' <span class="status-tag status-info">تمديد</span>' : '') +
                      (r.hasProblem ? ' <span class="status-tag status-danger">مشكلة</span>' : '') + '</td>';
                  }
                  if (c.key === 'originalStatusAr') {
                    return '<td><span class="status-tag ' + statusClass(r.originalStatusAr) + '">' + esc(r.originalStatusAr) + '</span></td>';
                  }
                  if (c.key === 'internalStatus') {
                    return '<td>' +
                      '<select class="quick-status-select tbl-quick-status" data-id="' + esc(r.id) + '" aria-label="تحديث حالة الحجز ' + esc(r.reservationNumber) + '">' +
                        root.RGCrmCore.FOLLOWUP_STATUSES.map(function (s) {
                          return '<option value="' + esc(s) + '"' + (r.internalStatus === s ? ' selected' : '') + '>' + esc(s) + '</option>';
                        }).join('') +
                      '</select>' +
                    '</td>';
                  }
                  if (c.key === 'priority') {
                    return '<td><span class="status-tag ' + priorityClass(r.priority) + '">' + esc(r.priority || 'عادي') + '</span></td>';
                  }
                  if (c.key === 'assignedEmployeeNames') {
                    if (!assignedNames.length) {
                      return '<td><span class="status-tag status-neutral">متاح للاستلام</span></td>';
                    }
                    return '<td><div style="display:flex;flex-wrap:wrap;gap:4px;">' +
                      assignedNames.map(function (n, idx) {
                        var isSelf = currentEmpId && assignedIds[idx] === currentEmpId;
                        return '<span class="status-tag ' + (isSelf ? 'status-success' : 'status-info') + '">' + esc(n) + '</span>';
                      }).join('') +
                    '</div></td>';
                  }
                  if (c.key === 'lastUpdatedAt') {
                    return '<td class="mono">' + formatTimestamp(r.lastUpdatedAt) + '</td>';
                  }
                  return '<td class="tabular-nums">' + esc(r[c.key] || '-') + '</td>';
                }).join('');

                var claimBtnHtml = isMine
                  ? '<button type="button" class="btn btn-sm btn-danger btn-unclaim-res" data-id="' + esc(r.id) + '" title="إلغاء الاستلام من حسابك">مستلم ✓ · إلغاء</button>'
                  : '<button type="button" class="btn btn-sm btn-charcoal btn-claim-res" data-id="' + esc(r.id) + '" title="استلام الحجز عندي للمتابعة">استلام عندي</button>';

                return '<tr data-res-id="' + esc(r.id) + '">' + tds +
                  '<td><div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;">' +
                    claimBtnHtml +
                    '<button type="button" class="btn btn-sm btn-primary btn-open-res" data-id="' + esc(r.id) + '">التفاصيل</button>' +
                  '</div></td>' +
                '</tr>';
              }).join('') +
            '</tbody></table></div>') +
        '<div class="pagination-bar">' +
          '<span>صفحة <strong class="tabular-nums">' + payload.page + '</strong> من <strong class="tabular-nums">' + payload.totalPages + '</strong></span>' +
          '<div class="toolbar-row" style="margin-bottom:0;">' +
            '<button type="button" class="btn btn-sm" id="res-prev"' + (payload.page <= 1 ? ' disabled' : '') + '>السابق</button>' +
            '<button type="button" class="btn btn-sm" id="res-next"' + (payload.page >= payload.totalPages ? ' disabled' : '') + '>التالي</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    function applyFilterChange() {
      state.search = document.getElementById('res-search').value;
      state.company = document.getElementById('res-company').value;
      state.branch = document.getElementById('res-branch').value;
      state.status = document.getElementById('res-status').value;
      state.employeeId = document.getElementById('res-emp').value;
      state.priority = document.getElementById('res-prio').value;
      state.dateFrom = document.getElementById('res-from').value;
      state.dateTo = document.getElementById('res-to').value;
      state.unfollowedOnly = document.getElementById('res-unfollowed').checked;
      state.hasProblemsOnly = document.getElementById('res-problems').checked;
      state.page = 1;
      render(container, ctx);
    }

    var searchTimer = null;
    document.getElementById('res-search').addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applyFilterChange, 220);
    });

    ['res-company', 'res-branch', 'res-status', 'res-emp', 'res-prio', 'res-from', 'res-to', 'res-unfollowed', 'res-problems'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', applyFilterChange);
    });

    document.getElementById('res-reset-filters').addEventListener('click', function () {
      Object.assign(state, { search: '', company: '', branch: '', status: '', employeeId: '', priority: '', dateFrom: '', dateTo: '', unfollowedOnly: false, hasProblemsOnly: false, page: 1 });
      render(container, ctx);
    });

    document.getElementById('res-cols-btn').addEventListener('click', function () {
      document.getElementById('res-cols-panel').classList.toggle('hidden');
    });

    container.querySelectorAll('.res-col-toggle').forEach(function (chk) {
      chk.addEventListener('change', function () {
        var next = Array.from(container.querySelectorAll('.res-col-toggle:checked')).map(function (el) { return el.value; });
        if (next.length > 0) {
          state.visibleCols = next;
          localStorage.setItem('rg_crm_visible_cols', JSON.stringify(next));
          render(container, ctx);
        }
      });
    });

    container.querySelectorAll('th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var col = th.getAttribute('data-sort');
        if (state.sortBy === col) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        else { state.sortBy = col; state.sortDir = 'desc'; }
        render(container, ctx);
      });
    });

    document.getElementById('res-prev').addEventListener('click', function () {
      if (state.page > 1) { state.page--; render(container, ctx); }
    });
    document.getElementById('res-next').addEventListener('click', function () {
      if (state.page < payload.totalPages) { state.page++; render(container, ctx); }
    });

    var pullBtn = document.getElementById('res-pull-btn');
    if (pullBtn) {
      pullBtn.addEventListener('click', async function () {
        pullBtn.disabled = true;
        var prevLabel = pullBtn.textContent;
        pullBtn.textContent = ctx.lang === 'en' ? 'Pulling reservations...' : 'جاري سحب الحجوزات...';
        var resp = await root.RGApi.callApi('pullReservations', {});
        if (resp.success && resp.data) {
          var d = resp.data;
          var msg = ctx.lang === 'en'
            ? ('Pulled reservations: ' + (d.importedCount || 0) + ' new · ' + (d.updatedCount || 0) + ' updated · ' + (d.extensionsCount || 0) + ' extensions')
            : ('تم سحب الحجوزات بنجاح: ' + (d.importedCount || 0) + ' جديد · ' + (d.updatedCount || 0) + ' محدث · ' + (d.extensionsCount || 0) + ' تمديد');
          ctx.toast(msg);
          ctx.refreshNotifications();
          render(container, ctx);
        } else {
          ctx.toast(resp.message || 'تعذر سحب الحجوزات.', true);
          pullBtn.disabled = false;
          pullBtn.textContent = prevLabel;
        }
      });
    }

    document.getElementById('res-export-xlsx').addEventListener('click', function () {
      root.RGReports.exportExcelWorkbook([{
        name: 'Reservations',
        headers: ALL_COLUMNS.filter(function (c) { return state.visibleCols.indexOf(c.key) !== -1; }),
        rows: items
      }], 'rental-gate-reservations.xlsx');
      ctx.toast('تم تصدير جدول الحجوزات إلى Excel.');
    });

    // Inline quick status change from Reservations table
    container.querySelectorAll('.tbl-quick-status').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        var rid = sel.getAttribute('data-id');
        sel.disabled = true;
        var resp = await root.RGApi.callApi('quickUpdateReservationStatus', {
          reservationId: rid,
          status: sel.value
        });
        if (resp.success) {
          ctx.toast('تم تحديث حالة الحجز إلى: ' + sel.value);
          ctx.refreshNotifications();
          render(container, ctx);
        } else {
          ctx.toast(resp.message, true);
          sel.disabled = false;
        }
      });
    });

    // Self-claim reservation without waiting for supervisor assignment
    container.querySelectorAll('.btn-claim-res').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        btn.disabled = true;
        var resp = await root.RGApi.callApi('claimReservation', { reservationId: btn.getAttribute('data-id') });
        if (resp.success) {
          ctx.toast(resp.message || 'تم استلام الحجز في قائمتك بنجاح.');
          ctx.refreshNotifications();
          render(container, ctx);
        } else {
          ctx.toast(resp.message, true);
          btn.disabled = false;
        }
      });
    });

    // Self-unclaim reservation right from table
    container.querySelectorAll('.btn-unclaim-res').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        btn.disabled = true;
        var resp = await root.RGApi.callApi('unclaimReservation', { reservationId: btn.getAttribute('data-id') });
        if (resp.success) {
          ctx.toast(resp.message || 'تم إلغاء استلام الحجز.');
          ctx.refreshNotifications();
          render(container, ctx);
        } else {
          ctx.toast(resp.message, true);
          btn.disabled = false;
        }
      });
    });

    container.querySelectorAll('.btn-open-res').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openReservationDrawer(btn.getAttribute('data-id'), ctx, employees, function () {
          render(container, ctx);
        });
      });
    });
  }

  async function openReservationDrawer(reservationId, ctx, employees, onUpdated, opts) {
    var modalRoot = document.getElementById('modal-root');
    var detailRes = await root.RGApi.callApi('getReservationDetails', { reservationId: reservationId });
    if (!detailRes.success) {
      ctx.toast(detailRes.message, true);
      return;
    }

    var d = detailRes.data;
    var r = d.reservation;
    var user = root.RGAuth.getUser();
    var canAssign = root.RGCrmCore.canUserPerform(user, 'assign_employees');
    var canEditReservation = root.RGCrmCore.canUserPerform(user, 'edit_reservation_details');
    var canEditAnyFollowUp = root.RGCrmCore.canUserPerform(user, 'edit_any_followup');
    var canEditTicket = root.RGCrmCore.canUserPerform(user, 'edit_ticket_details');

    var assignedIds = Array.isArray(r.assignedEmployeeIds) ? r.assignedEmployeeIds : [];
    var assignedNames = Array.isArray(r.assignedEmployeeNames) ? r.assignedEmployeeNames : [];
    var isClaimedByMe = assignedIds.indexOf(user.id) !== -1;

    function reopenSelf() {
      openReservationDrawer(r.id, ctx, employees, onUpdated, opts);
      if (onUpdated) onUpdated();
    }

    modalRoot.innerHTML =
      '<div class="drawer-backdrop" id="res-drawer-backdrop" role="dialog" aria-modal="true" aria-labelledby="drawer-res-title">' +
        '<div class="drawer-panel">' +
          '<div class="modal-header">' +
            '<div>' +
              '<h3 class="modal-title mono" id="drawer-res-title">حجز ' + esc(r.reservationNumber) + '</h3>' +
              '<div class="meta-inline"><span>' + esc(r.customerName) + '</span><span>·</span><span class="mono">' + esc(r.customerPhone) + '</span></div>' +
            '</div>' +
            '<div class="toolbar-row" style="margin-bottom:0;">' +
              (opts && opts.onBack ? '<button type="button" class="btn btn-sm btn-charcoal" id="drawer-back-btn">' + esc(opts.backLabel || 'العودة لملف الموظف') + '</button>' : '') +
              (canEditReservation ? '<button type="button" class="btn btn-sm btn-charcoal" id="drawer-edit-res-btn">تعديل تفاصيل الحجز</button>' : '') +
              '<button type="button" class="btn btn-sm btn-primary" id="drawer-pdf-btn">تصدير PDF</button>' +
              '<button type="button" class="btn btn-sm btn-danger" id="drawer-problem-btn">تحويل إلى مشكلة</button>' +
              '<button type="button" class="btn btn-sm" id="drawer-close-btn">إغلاق</button>' +
            '</div>' +
          '</div>' +

          // Interactive Self-Service Claim / Unclaim & Quick Status Bar
          '<div class="surface-card" style="padding:14px;border-inline-start:3px solid #d32228;display:flex;flex-direction:column;gap:12px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">' +
              '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
                '<span class="status-tag ' + statusClass(r.internalStatus) + '">' + esc(r.internalStatus) + '</span>' +
                '<span class="status-tag ' + priorityClass(r.priority) + '">الأولوية: ' + esc(r.priority || 'عادي') + '</span>' +
                '<span style="font-size:12.5px;color:var(--text-secondary);">المستلمون حاليًا: <strong class="tabular-nums">' + assignedIds.length + '</strong></span>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
                (isClaimedByMe
                  ? '<button type="button" class="btn btn-sm btn-danger" id="drawer-unclaim-btn">إلغاء الاستلام من عندي</button>'
                  : '<button type="button" class="btn btn-sm btn-primary" id="drawer-claim-btn">استلام الحجز عندي</button>') +
              '</div>' +
            '</div>' +
            '<div class="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)_auto] gap-2 items-center">' +
              '<select class="select" id="drawer-quick-status" aria-label="تحديث الحالة السريع">' +
                root.RGCrmCore.FOLLOWUP_STATUSES.map(function (s) {
                  return '<option value="' + esc(s) + '"' + (r.internalStatus === s ? ' selected' : '') + '>' + esc(s) + '</option>';
                }).join('') +
              '</select>' +
              '<input class="input" id="drawer-quick-note" placeholder="ملاحظة سريعة اختيارية عند تغيير الحالة...">' +
              '<button type="button" class="btn btn-charcoal" id="drawer-quick-status-btn">تحديث الحالة الآن</button>' +
            '</div>' +
          '</div>' +

          '<div class="detail-summary-grid">' +
            '<div class="detail-kv"><span class="detail-k">الشركة / الفرع</span><span class="detail-v">' + esc(r.companyName) + ' — ' + esc(r.branchName) + '</span></div>' +
            '<div class="detail-kv"><span class="detail-k">السيارة</span><span class="detail-v">' + esc(r.carName) + ' (' + esc(r.plateNumber || '-') + ')</span></div>' +
            '<div class="detail-kv"><span class="detail-k">الفترة</span><span class="detail-v mono">' + esc(r.startDate) + ' → ' + esc(r.endDate) + ' (' + Number(r.daysCount || 1) + ' يوم)</span></div>' +
            '<div class="detail-kv"><span class="detail-k">الاستلام / التسليم</span><span class="detail-v">' + esc(r.pickupTypeAr) + ' / ' + esc(r.returnTypeAr) + '</span></div>' +
            '<div class="detail-kv"><span class="detail-k">الحالة الأصلية / الداخلية</span><span class="detail-v">' + esc(r.originalStatusAr) + ' / ' + esc(r.internalStatus) + '</span></div>' +
            '<div class="detail-kv"><span class="detail-k">آخر تحديث</span><span class="detail-v">' + esc(r.lastUpdateText || '-') + '</span></div>' +
          '</div>' +

          // Collaborator Chips + Individual Removal (Supervisor/GM) + Self Unclaim reminder
          '<div class="surface-card" style="padding:14px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' +
              '<h4 style="margin:0;font-size:14px;">الموظفون المشاركون في متابعة الحجز (' + assignedIds.length + ')</h4>' +
              '<span style="font-size:12px;color:var(--text-muted);">يمكن لأكثر من موظف استلام ومتابعة نفس الحجز معًا</span>' +
            '</div>' +
            (assignedIds.length === 0
              ? '<div style="font-size:13px;color:var(--text-muted);">لا يوجد موظفون مستلمون بعد — اضغط «استلام الحجز عندي» أعلاه للبدء فورًا.</div>'
              : '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
                  assignedIds.map(function (empId, idx) {
                    var empName = assignedNames[idx] || empId;
                    var isSelf = empId === user.id;
                    return '<span class="collab-chip">' +
                      '<span>' + esc(empName) + (isSelf ? ' (أنت)' : '') + '</span>' +
                      (canAssign
                        ? '<button type="button" class="collab-chip-remove drawer-remove-emp" data-emp-id="' + esc(empId) + '" data-emp-name="' + esc(empName) + '" title="إزالة إسناد ' + esc(empName) + '" aria-label="إزالة إسناد ' + esc(empName) + '">✕</button>'
                        : '') +
                    '</span>';
                  }).join('') +
                '</div>') +
          '</div>' +

          '<div class="kpi-grid-3">' +
            '<div class="kpi-card"><span class="kpi-label">أيام الحجز</span><span class="kpi-value tabular-nums" style="font-size:20px;">' + Number(r.daysCount || 0) + '</span></div>' +
            '<div class="kpi-card"><span class="kpi-label">المبلغ الأساسي</span><span class="kpi-value tabular-nums" style="font-size:20px;">' + Number(r.baseAmount || 0) + '</span></div>' +
            '<div class="kpi-card"><span class="kpi-label">التمديدات</span><span class="kpi-value tabular-nums" style="font-size:20px;">' + Number(r.extensionsAmount || 0) + '</span></div>' +
            '<div class="kpi-card kpi-success"><span class="kpi-label">الإجمالي (ر.س)</span><span class="kpi-value tabular-nums" style="font-size:20px;">' + Number(r.totalAmount || 0) + '</span></div>' +
            '<div class="kpi-card"><span class="kpi-label">المتابعات</span><span class="kpi-value tabular-nums" style="font-size:20px;">' + d.followUps.length + '</span></div>' +
            '<div class="kpi-card ' + (d.problems.length ? 'kpi-danger' : '') + '"><span class="kpi-label">المشكلات</span><span class="kpi-value tabular-nums" style="font-size:20px;">' + d.problems.length + '</span></div>' +
          '</div>' +

          '<div class="charts-grid">' +
            '<div class="chart-card"><h4 class="chart-card-title">حالة الحجز والتفصيل المالي</h4><div class="chart-canvas-wrap" style="height:190px;"><canvas id="res-drawer-chart-finance"></canvas></div></div>' +
            '<div class="chart-card"><h4 class="chart-card-title">أداء الموظفين ونشاط الحجز</h4><div class="chart-canvas-wrap" style="height:190px;"><canvas id="res-drawer-chart-activity"></canvas></div></div>' +
          '</div>' +

          (canAssign ? (
            '<div class="surface-card" style="padding:14px;">' +
              '<h4 style="margin:0 0 10px;font-size:14px;">إدارة الإسناد من المشرف / المدير (تحديد متعدد)</h4>' +
              '<div class="checkbox-grid">' +
                employees.filter(function (e) { return e.status === 'active'; }).map(function (emp) {
                  var checked = assignedIds.indexOf(emp.id) !== -1 ? 'checked' : '';
                  return '<label class="checkbox-item"><input type="checkbox" class="drawer-assign-chk" value="' + esc(emp.id) + '" ' + checked + '> ' + esc(emp.name) + '</label>';
                }).join('') +
              '</div>' +
              '<div style="margin-top:10px;"><button type="button" class="btn btn-sm btn-primary" id="drawer-save-assign">حفظ الإسناد</button></div>' +
            '</div>'
          ) : '') +

          '<form class="surface-card" id="drawer-fu-form" style="padding:14px;display:flex;flex-direction:column;gap:10px;">' +
            '<h4 style="margin:0;font-size:14px;">إضافة متابعة جديدة (متاحة دون انتظار الإسناد)</h4>' +
            '<div class="form-grid-2">' +
              '<div class="form-group"><label class="form-label" for="fu-status">حالة المتابعة</label>' +
                '<select class="select" id="fu-status">' +
                  root.RGCrmCore.FOLLOWUP_STATUSES.map(function (s) {
                    return '<option value="' + esc(s) + '"' + (r.internalStatus === s ? ' selected' : '') + '>' + esc(s) + '</option>';
                  }).join('') +
                '</select></div>' +
              '<div class="form-group"><label class="form-label" for="fu-action">الإجراء المتخذ</label>' +
                '<input class="input" id="fu-action" placeholder="مثال: التواصل مع العميل لتأكيد الاستلام" required></div>' +
            '</div>' +
            '<div class="form-group"><label class="form-label" for="fu-notes">الملاحظات</label>' +
              '<textarea class="textarea" id="fu-notes" placeholder="تفاصيل إضافية..."></textarea></div>' +
            '<div id="fu-form-error" class="form-error hidden"></div>' +
            '<div><button type="submit" class="btn btn-primary" id="fu-submit-btn">حفظ المتابعة</button></div>' +
          '</form>' +

          '<div>' +
            '<h4 style="margin:0 0 10px;font-size:14px;">سجل المتابعات والملاحظات (' + d.followUps.length + ')</h4>' +
            (d.followUps.length === 0
              ? '<div class="empty-state" style="padding:20px;">لا توجد متابعات مسجلة لهذا الحجز بعد.</div>'
              : '<div class="timeline-list">' + d.followUps.map(function (f) {
                  var canEditThisFu = canEditAnyFollowUp || f.employeeId === user.id;
                  return '<div class="timeline-item">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
                      '<strong>' + esc(f.employeeName) + '</strong>' +
                      '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<span class="status-tag ' + statusClass(f.status) + '">' + esc(f.status) + '</span>' +
                        (canEditThisFu ? '<button type="button" class="btn btn-sm btn-edit-fu" data-fu-id="' + esc(f.id) + '">تعديل</button>' : '') +
                      '</div>' +
                    '</div>' +
                    '<div>' + esc(f.action) + '</div>' +
                    (f.notes ? '<div style="color:var(--text-secondary);font-size:12.5px;">' + esc(f.notes) + '</div>' : '') +
                    '<div class="meta-inline mono"><span>' + esc(f.followUpDate) + '</span><span>·</span><span>' + esc(f.followUpTime) + '</span></div>' +
                  '</div>';
                }).join('') + '</div>') +
          '</div>' +

          (d.problems.length ? (
            '<div>' +
              '<h4 style="margin:0 0 10px;font-size:14px;">المشكلات / التذاكر المرتبطة بالحجز (' + d.problems.length + ')</h4>' +
              '<div class="timeline-list">' + d.problems.map(function (p) {
                return '<div class="timeline-item">' +
                  '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
                    '<strong class="mono">' + esc(p.problemNumber) + '</strong>' +
                    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
                      '<span class="status-tag ' + priorityClass(p.priority) + '">' + esc(p.priority) + '</span>' +
                      '<span class="status-tag status-info">' + esc(p.status) + '</span>' +
                      '<button type="button" class="btn btn-sm btn-primary btn-edit-prb-in-drawer" data-prb-id="' + esc(p.id) + '">' +
                        (canEditTicket ? 'تعديل التذكرة' : 'تحديث التذكرة') +
                      '</button>' +
                    '</div>' +
                  '</div>' +
                  '<div>' + esc(p.description) + '</div>' +
                  '<div class="meta-inline"><span>بواسطة: ' + esc(p.createdByName) + '</span><span>·</span><span>المسؤولون: ' + esc((p.assignedEmployeeNames || []).join('، ') || '-') + '</span></div>' +
                '</div>';
              }).join('') + '</div>' +
            '</div>'
          ) : '') +
        '</div>' +
      '</div>';

    document.getElementById('drawer-close-btn').addEventListener('click', function () { modalRoot.innerHTML = ''; });
    var backBtn = document.getElementById('drawer-back-btn');
    if (backBtn && opts && opts.onBack) {
      backBtn.addEventListener('click', function () { opts.onBack(); });
    }

    var claimBtn = document.getElementById('drawer-claim-btn');
    if (claimBtn) {
      claimBtn.addEventListener('click', async function () {
        claimBtn.disabled = true;
        var resp = await root.RGApi.callApi('claimReservation', { reservationId: r.id });
        if (resp.success) {
          ctx.toast(resp.message || 'تم استلام الحجز في قائمتك بنجاح.');
          ctx.refreshNotifications();
          reopenSelf();
        } else {
          ctx.toast(resp.message, true);
          claimBtn.disabled = false;
        }
      });
    }

    var unclaimBtn = document.getElementById('drawer-unclaim-btn');
    if (unclaimBtn) {
      unclaimBtn.addEventListener('click', async function () {
        unclaimBtn.disabled = true;
        var resp = await root.RGApi.callApi('unclaimReservation', { reservationId: r.id });
        if (resp.success) {
          ctx.toast(resp.message || 'تم إلغاء استلام الحجز من حسابك.');
          ctx.refreshNotifications();
          reopenSelf();
        } else {
          ctx.toast(resp.message, true);
          unclaimBtn.disabled = false;
        }
      });
    }

    var quickBtn = document.getElementById('drawer-quick-status-btn');
    if (quickBtn) {
      quickBtn.addEventListener('click', async function () {
        quickBtn.disabled = true;
        var nextStatus = document.getElementById('drawer-quick-status').value;
        var quickNote = document.getElementById('drawer-quick-note').value;
        var resp = await root.RGApi.callApi('quickUpdateReservationStatus', {
          reservationId: r.id,
          status: nextStatus,
          note: quickNote
        });
        if (resp.success) {
          ctx.toast('تم تحديث حالة الحجز إلى: ' + nextStatus);
          ctx.refreshNotifications();
          reopenSelf();
        } else {
          ctx.toast(resp.message, true);
          quickBtn.disabled = false;
        }
      });
    }

    var editResBtn = document.getElementById('drawer-edit-res-btn');
    if (editResBtn) {
      editResBtn.addEventListener('click', function () {
        openEditReservationModal(r, ctx, reopenSelf, reopenSelf);
      });
    }

    modalRoot.querySelectorAll('.drawer-remove-emp').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        btn.disabled = true;
        var resp = await root.RGApi.callApi('removeAssignment', {
          reservationId: r.id,
          employeeId: btn.getAttribute('data-emp-id')
        });
        if (resp.success) {
          ctx.toast('تمت إزالة ' + btn.getAttribute('data-emp-name') + ' من الحجز.');
          ctx.refreshNotifications();
          reopenSelf();
        } else {
          ctx.toast(resp.message, true);
          btn.disabled = false;
        }
      });
    });

    var saveAssignBtn = document.getElementById('drawer-save-assign');
    if (saveAssignBtn) {
      saveAssignBtn.addEventListener('click', async function () {
        var ids = Array.from(modalRoot.querySelectorAll('.drawer-assign-chk:checked')).map(function (c) { return c.value; });
        var resp = await root.RGApi.callApi('assignEmployees', { reservationId: r.id, employeeIds: ids });
        if (resp.success) {
          ctx.toast('تم تحديث الموظفين المسؤولين عن الحجز.');
          ctx.refreshNotifications();
          reopenSelf();
        } else {
          ctx.toast(resp.message, true);
        }
      });
    }

    document.getElementById('drawer-fu-form').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var errEl = document.getElementById('fu-form-error');
      errEl.classList.add('hidden');
      var resp = await root.RGApi.callApi('addFollowUp', {
        reservationId: r.id,
        status: document.getElementById('fu-status').value,
        action: document.getElementById('fu-action').value,
        notes: document.getElementById('fu-notes').value
      });
      if (!resp.success) {
        errEl.textContent = resp.message;
        errEl.classList.remove('hidden');
        return;
      }
      ctx.toast('تمت إضافة المتابعة بنجاح.');
      ctx.refreshNotifications();
      reopenSelf();
    });

    modalRoot.querySelectorAll('.btn-edit-fu').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var fuId = btn.getAttribute('data-fu-id');
        var fu = d.followUps.find(function (x) { return x.id === fuId; });
        if (fu) openEditFollowUpModal(fu, r, ctx, reopenSelf, reopenSelf);
      });
    });

    modalRoot.querySelectorAll('.btn-edit-prb-in-drawer').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var prbId = btn.getAttribute('data-prb-id');
        var prb = d.problems.find(function (x) { return x.id === prbId; });
        if (prb && root.RGProblems && root.RGProblems.openProblemUpdateModal) {
          var enriched = Object.assign({}, prb, {
            updates: (d.problemUpdates || []).filter(function (u) { return u.problemId === prb.id; })
          });
          root.RGProblems.openProblemUpdateModal(enriched, employees, ctx, reopenSelf, reopenSelf);
        }
      });
    });

    document.getElementById('drawer-problem-btn').addEventListener('click', function () {
      openCreateProblemModal(r, employees, ctx, reopenSelf, reopenSelf);
    });

    var drawerCharts = renderDrawerCharts(d);

    document.getElementById('drawer-pdf-btn').addEventListener('click', function () {
      openSingleReservationPdfModal(d, ctx, drawerCharts, reopenSelf);
    });
  }

  function openEditReservationModal(reservation, ctx, onSaved, onCancel) {
    var modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML =
      '<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="res-edit-title">' +
        '<form class="modal-panel" id="res-edit-form">' +
          '<div class="modal-header">' +
            '<div>' +
              '<h3 class="modal-title" id="res-edit-title">تعديل تفاصيل الحجز <span class="mono">' + esc(reservation.reservationNumber) + '</span></h3>' +
              '<div class="meta-inline"><span>تحكم المشرف والمدير العام في كامل بيانات الحجز والحالة</span></div>' +
            '</div>' +
            '<button type="button" class="btn btn-sm" id="res-edit-cancel">رجوع</button>' +
          '</div>' +
          '<div class="form-grid-2">' +
            '<div class="form-group"><label class="form-label" for="re-customer">اسم العميل</label><input class="input" id="re-customer" value="' + esc(reservation.customerName) + '" required></div>' +
            '<div class="form-group"><label class="form-label" for="re-phone">رقم الجوال</label><input class="input mono" id="re-phone" value="' + esc(reservation.customerPhone) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-company">شركة التأجير</label><input class="input" id="re-company" value="' + esc(reservation.companyName) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-branch">الفرع</label><input class="input" id="re-branch" value="' + esc(reservation.branchName) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-car">السيارة</label><input class="input" id="re-car" value="' + esc(reservation.carName) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-plate">رقم اللوحة</label><input class="input" id="re-plate" value="' + esc(reservation.plateNumber) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-start">تاريخ البداية</label><input type="date" class="input" id="re-start" value="' + esc(reservation.startDate) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-end">تاريخ النهاية</label><input type="date" class="input" id="re-end" value="' + esc(reservation.endDate) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-pickup">نوع الاستلام</label><input class="input" id="re-pickup" value="' + esc(reservation.pickupTypeAr) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-return">نوع التسليم</label><input class="input" id="re-return" value="' + esc(reservation.returnTypeAr) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-status">الحالة الداخلية</label>' +
              '<select class="select" id="re-status">' +
                root.RGCrmCore.FOLLOWUP_STATUSES.map(function (s) {
                  return '<option value="' + esc(s) + '"' + (reservation.internalStatus === s ? ' selected' : '') + '>' + esc(s) + '</option>';
                }).join('') +
              '</select></div>' +
            '<div class="form-group"><label class="form-label" for="re-prio">الأولوية</label>' +
              '<select class="select" id="re-prio">' +
                root.RGCrmCore.PROBLEM_PRIORITIES.map(function (p) {
                  return '<option value="' + esc(p) + '"' + (reservation.priority === p ? ' selected' : '') + '>' + esc(p) + '</option>';
                }).join('') +
              '</select></div>' +
          '</div>' +
          '<div class="form-grid-3">' +
            '<div class="form-group"><label class="form-label" for="re-days">عدد الأيام</label><input type="number" min="1" class="input mono" id="re-days" value="' + Number(reservation.daysCount || 1) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-base">المبلغ الأساسي (ر.س)</label><input type="number" step="0.01" class="input mono" id="re-base" value="' + Number(reservation.baseAmount || 0) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-ext">التمديدات (ر.س)</label><input type="number" step="0.01" class="input mono" id="re-ext" value="' + Number(reservation.extensionsAmount || 0) + '"></div>' +
          '</div>' +
          '<div class="form-grid-2">' +
            '<div class="form-group"><label class="form-label" for="re-total">الإجمالي النهائي (ر.س)</label><input type="number" step="0.01" class="input mono" id="re-total" value="' + Number(reservation.totalAmount || 0) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="re-last">آخر تحديث / ملخص</label><input class="input" id="re-last" value="' + esc(reservation.lastUpdateText || '') + '"></div>' +
          '</div>' +
          '<div id="res-edit-err" class="form-error hidden"></div>' +
          '<div class="modal-footer">' +
            '<button type="submit" class="btn btn-primary" id="res-edit-save">حفظ تعديلات الحجز</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    var baseEl = document.getElementById('re-base');
    var extEl = document.getElementById('re-ext');
    var totalEl = document.getElementById('re-total');
    function syncTotal() {
      totalEl.value = String(Math.round((Number(baseEl.value || 0) + Number(extEl.value || 0)) * 100) / 100);
    }
    baseEl.addEventListener('input', syncTotal);
    extEl.addEventListener('input', syncTotal);

    document.getElementById('res-edit-cancel').addEventListener('click', function () {
      if (onCancel) onCancel();
      else modalRoot.innerHTML = '';
    });

    document.getElementById('res-edit-form').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var res = await root.RGApi.callApi('updateReservationDetails', {
        reservationId: reservation.id,
        customerName: document.getElementById('re-customer').value,
        customerPhone: document.getElementById('re-phone').value,
        companyName: document.getElementById('re-company').value,
        branchName: document.getElementById('re-branch').value,
        carName: document.getElementById('re-car').value,
        plateNumber: document.getElementById('re-plate').value,
        startDate: document.getElementById('re-start').value,
        endDate: document.getElementById('re-end').value,
        pickupTypeAr: document.getElementById('re-pickup').value,
        returnTypeAr: document.getElementById('re-return').value,
        internalStatus: document.getElementById('re-status').value,
        priority: document.getElementById('re-prio').value,
        daysCount: Number(document.getElementById('re-days').value || 1),
        baseAmount: Number(baseEl.value || 0),
        extensionsAmount: Number(extEl.value || 0),
        totalAmount: Number(totalEl.value || 0),
        lastUpdateText: document.getElementById('re-last').value
      });
      if (!res.success) {
        var e = document.getElementById('res-edit-err');
        e.textContent = res.message;
        e.classList.remove('hidden');
        return;
      }
      ctx.toast('تم حفظ تعديلات تفاصيل الحجز بنجاح.');
      ctx.refreshNotifications();
      if (onSaved) onSaved();
      else modalRoot.innerHTML = '';
    });
  }

  function openEditFollowUpModal(followUp, reservation, ctx, onSaved, onCancel) {
    var modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML =
      '<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="fu-edit-title">' +
        '<form class="modal-panel" id="fu-edit-form">' +
          '<div class="modal-header">' +
            '<div>' +
              '<h3 class="modal-title" id="fu-edit-title">تعديل التحديث والمتابعة — <span class="mono">' + esc(reservation.reservationNumber) + '</span></h3>' +
              '<div class="meta-inline"><span>الموظف: ' + esc(followUp.employeeName) + '</span><span>·</span><span class="mono">' + esc(followUp.followUpDate) + ' ' + esc(followUp.followUpTime) + '</span></div>' +
            '</div>' +
            '<button type="button" class="btn btn-sm" id="fu-edit-cancel">رجوع</button>' +
          '</div>' +
          '<div class="form-grid-2">' +
            '<div class="form-group"><label class="form-label" for="fue-status">الحالة</label>' +
              '<select class="select" id="fue-status">' +
                root.RGCrmCore.FOLLOWUP_STATUSES.map(function (s) {
                  return '<option value="' + esc(s) + '"' + (followUp.status === s ? ' selected' : '') + '>' + esc(s) + '</option>';
                }).join('') +
              '</select></div>' +
            '<div class="form-group"><label class="form-label" for="fue-action">الإجراء المتخذ</label>' +
              '<input class="input" id="fue-action" value="' + esc(followUp.action) + '" required></div>' +
          '</div>' +
          '<div class="form-group"><label class="form-label" for="fue-notes">الملاحظات</label>' +
            '<textarea class="textarea" id="fue-notes">' + esc(followUp.notes || '') + '</textarea></div>' +
          '<label class="checkbox-item"><input type="checkbox" id="fue-sync" checked> مزامنة الحالة وآخر تحديث مع بطاقة الحجز الرئيسية</label>' +
          '<div id="fu-edit-err" class="form-error hidden"></div>' +
          '<div class="modal-footer">' +
            '<button type="submit" class="btn btn-primary">حفظ التعديل</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    document.getElementById('fu-edit-cancel').addEventListener('click', function () {
      if (onCancel) onCancel();
      else modalRoot.innerHTML = '';
    });

    document.getElementById('fu-edit-form').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var res = await root.RGApi.callApi('updateFollowUp', {
        followUpId: followUp.id,
        status: document.getElementById('fue-status').value,
        action: document.getElementById('fue-action').value,
        notes: document.getElementById('fue-notes').value,
        syncToReservation: document.getElementById('fue-sync').checked
      });
      if (!res.success) {
        var e = document.getElementById('fu-edit-err');
        e.textContent = res.message;
        e.classList.remove('hidden');
        return;
      }
      ctx.toast('تم تعديل سجل المتابعة بنجاح.');
      ctx.refreshNotifications();
      if (onSaved) onSaved();
      else modalRoot.innerHTML = '';
    });
  }

  function renderDrawerCharts(details) {
    var images = { finance: '', activity: '' };
    if (!root.Chart) return images;
    var r = details.reservation;
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var txtColor = isDark ? '#cfd1d3' : '#313232';
    var gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(49,50,50,0.07)';

    var finEl = document.getElementById('res-drawer-chart-finance');
    if (finEl) {
      new root.Chart(finEl.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['المبلغ الأساسي', 'التمديدات المعتمدة'],
          datasets: [{
            data: [Number(r.baseAmount || 0), Number(r.extensionsAmount || 0)],
            backgroundColor: ['#313232', '#d32228'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { labels: { color: txtColor, font: { family: "'IBM Plex Sans Arabic', sans-serif", size: 11 } } } }
        }
      });
    }

    var empFollowUpCounts = {};
    (r.assignedEmployeeNames || []).forEach(function (name) {
      empFollowUpCounts[name] = 0;
    });
    details.followUps.forEach(function (f) {
      var n = f.employeeName || 'غير محدد';
      empFollowUpCounts[n] = (empFollowUpCounts[n] || 0) + 1;
    });

    var actLabels = Object.keys(empFollowUpCounts);
    var actValues = actLabels.map(function (k) { return empFollowUpCounts[k]; });
    if (actLabels.length === 0) {
      actLabels = ['المتابعات', 'المشكلات', 'التمديدات'];
      actValues = [details.followUps.length, details.problems.length, details.extensions.length];
    } else {
      actLabels.push('المشكلات');
      actValues.push(details.problems.length);
    }

    var actEl = document.getElementById('res-drawer-chart-activity');
    if (actEl) {
      new root.Chart(actEl.getContext('2d'), {
        type: 'bar',
        data: {
          labels: actLabels,
          datasets: [{
            label: 'النشاط',
            data: actValues,
            backgroundColor: actLabels.map(function (lbl, idx) {
              return lbl === 'المشكلات' ? '#d32228' : (idx % 2 === 0 ? '#313232' : '#555757');
            }),
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: txtColor }, grid: { display: false } },
            y: { ticks: { color: txtColor, precision: 0 }, grid: { color: gridColor }, beginAtZero: true }
          }
        }
      });
    }

    return {
      getImages: function () {
        return [
          finEl ? { title: 'حالة الحجز والتفصيل المالي (' + r.internalStatus + ')', dataUrl: finEl.toDataURL('image/png') } : null,
          actEl ? { title: 'أداء الموظفين ونشاط الحجز', dataUrl: actEl.toDataURL('image/png') } : null
        ].filter(Boolean);
      }
    };
  }

  function openCreateProblemModal(reservation, employees, ctx, onCreated, onCancel) {
    var modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML =
      '<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="prb-create-title">' +
        '<form class="modal-panel" id="prb-create-form">' +
          '<div class="modal-header">' +
            '<h3 class="modal-title" id="prb-create-title">تحويل الحجز ' + esc(reservation.reservationNumber) + ' إلى مشكلة</h3>' +
            '<button type="button" class="btn btn-sm" id="prb-cancel">إغلاق</button>' +
          '</div>' +
          '<div class="form-group"><label class="form-label" for="prb-priority">الأولوية</label>' +
            '<select class="select" id="prb-priority">' +
              '<option value="عادي">عادي</option>' +
              '<option value="متوسط" selected>متوسط</option>' +
              '<option value="مرتفع">مرتفع (يرسل إشعارًا فوريًا للمشرفين)</option>' +
            '</select></div>' +
          '<div class="form-group"><label class="form-label" for="prb-desc">وصف المشكلة</label>' +
            '<textarea class="textarea" id="prb-desc" required placeholder="اشرح تفاصيل المشكلة بوضوح..."></textarea></div>' +
          '<div class="form-group"><span class="form-label">إسناد إلى الموظفين</span><div class="checkbox-grid">' +
            employees.filter(function (e) { return e.status === 'active'; }).map(function (emp) {
              return '<label class="checkbox-item"><input type="checkbox" class="prb-emp-chk" value="' + esc(emp.id) + '"> ' + esc(emp.name) + '</label>';
            }).join('') +
          '</div></div>' +
          '<div id="prb-err" class="form-error hidden"></div>' +
          '<div class="modal-footer">' +
            '<button type="submit" class="btn btn-primary">حفظ المشكلة</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    document.getElementById('prb-cancel').addEventListener('click', function () {
      if (onCancel) onCancel();
      else modalRoot.innerHTML = '';
    });
    document.getElementById('prb-create-form').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var empIds = Array.from(modalRoot.querySelectorAll('.prb-emp-chk:checked')).map(function (c) { return c.value; });
      var res = await root.RGApi.callApi('createProblem', {
        reservationId: reservation.id,
        priority: document.getElementById('prb-priority').value,
        description: document.getElementById('prb-desc').value,
        assignedEmployeeIds: empIds
      });
      if (!res.success) {
        var e = document.getElementById('prb-err');
        e.textContent = res.message;
        e.classList.remove('hidden');
        return;
      }
      ctx.toast('تم إنشاء المشكلة وتسجيلها بنجاح.');
      ctx.refreshNotifications();
      if (onCreated) onCreated();
      else modalRoot.innerHTML = '';
    });
  }

  function openSingleReservationPdfModal(details, ctx, drawerCharts, onCancel) {
    var r = details.reservation;
    var capturedCharts = drawerCharts && drawerCharts.getImages ? drawerCharts.getImages() : [];
    var modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML =
      '<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="single-pdf-title">' +
        '<div class="modal-panel">' +
          '<div class="modal-header">' +
            '<h3 class="modal-title" id="single-pdf-title">إعدادات وتصدير PDF للحجز ' + esc(r.reservationNumber) + '</h3>' +
            '<button type="button" class="btn btn-sm" id="spdf-close">إغلاق</button>' +
          '</div>' +
          '<div class="form-grid-3">' +
            '<div class="form-group"><label class="form-label" for="spdf-title">عنوان التقرير</label><input class="input" id="spdf-title" value="ملف الحجز رقم ' + esc(r.reservationNumber) + '"></div>' +
            '<div class="form-group"><label class="form-label" for="spdf-paper">حجم الورق</label><select class="select" id="spdf-paper"><option value="a4">A4</option><option value="letter">Letter</option></select></div>' +
            '<div class="form-group"><label class="form-label" for="spdf-orient">اتجاه الصفحة</label><select class="select" id="spdf-orient"><option value="portrait">عمودي (Portrait)</option><option value="landscape">أفقي (Landscape)</option></select></div>' +
          '</div>' +
          '<div class="kpi-grid-4">' +
            '<div class="kpi-card"><span class="kpi-label">أيام الحجز</span><span class="kpi-value tabular-nums" style="font-size:18px;">' + Number(r.daysCount || 0) + '</span></div>' +
            '<div class="kpi-card kpi-success"><span class="kpi-label">الإجمالي (ر.س)</span><span class="kpi-value tabular-nums" style="font-size:18px;">' + Number(r.totalAmount || 0) + '</span></div>' +
            '<div class="kpi-card"><span class="kpi-label">المتابعات</span><span class="kpi-value tabular-nums" style="font-size:18px;">' + details.followUps.length + '</span></div>' +
            '<div class="kpi-card ' + (details.problems.length ? 'kpi-danger' : '') + '"><span class="kpi-label">المشكلات</span><span class="kpi-value tabular-nums" style="font-size:18px;">' + details.problems.length + '</span></div>' +
          '</div>' +
          '<div>' +
            '<div class="form-label" style="margin-bottom:8px;">اختر البيانات المراد تضمينها في التقرير:</div>' +
            '<div class="checkbox-grid">' +
              '<label class="checkbox-item"><input type="checkbox" id="spdf-counters" checked> العدادات والملخص المالي</label>' +
              '<label class="checkbox-item"><input type="checkbox" id="spdf-charts" checked> الرسوم البيانية المصغرة (حالة الحجز وأداء الموظف)</label>' +
              '<label class="checkbox-item"><input type="checkbox" id="spdf-followups" checked> المتابعات</label>' +
              '<label class="checkbox-item"><input type="checkbox" id="spdf-notes" checked> الملاحظات</label>' +
              '<label class="checkbox-item"><input type="checkbox" id="spdf-problems" checked> المشكلات وتحديثاتها</label>' +
              '<label class="checkbox-item"><input type="checkbox" id="spdf-customer" checked> بيانات العميل</label>' +
              '<label class="checkbox-item"><input type="checkbox" id="spdf-booking" checked> بيانات الحجز والتمديدات</label>' +
              '<label class="checkbox-item"><input type="checkbox" id="spdf-staff" checked> الموظفون المسؤولون</label>' +
              '<label class="checkbox-item"><input type="checkbox" id="spdf-last" checked> آخر تحديث</label>' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-primary" id="spdf-export">تصدير ملف PDF الآن</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('spdf-close').addEventListener('click', function () {
      if (onCancel) onCancel();
      else modalRoot.innerHTML = '';
    });
    document.getElementById('spdf-export').addEventListener('click', async function () {
      var incCounters = document.getElementById('spdf-counters').checked;
      var incCharts = document.getElementById('spdf-charts').checked;
      var incFollowUps = document.getElementById('spdf-followups').checked;
      var incNotes = document.getElementById('spdf-notes').checked;
      var incProblems = document.getElementById('spdf-problems').checked;
      var incCustomer = document.getElementById('spdf-customer').checked;
      var incBooking = document.getElementById('spdf-booking').checked;
      var incStaff = document.getElementById('spdf-staff').checked;
      var incLast = document.getElementById('spdf-last').checked;

      var summary = [];
      if (incCounters) {
        summary.push({ label: 'أيام الحجز', value: r.daysCount + ' يوم' });
        summary.push({ label: 'الأساسي / التمديد / الإجمالي', value: r.baseAmount + ' + ' + r.extensionsAmount + ' = ' + r.totalAmount + ' ر.س' });
        summary.push({ label: 'عداد المتابعات', value: details.followUps.length });
        summary.push({ label: 'عداد المشكلات', value: details.problems.length });
      }
      if (incCustomer) {
        summary.push({ label: 'العميل', value: r.customerName + ' (' + r.customerPhone + ')' });
      }
      if (incBooking) {
        summary.push({ label: 'الشركة والفرع', value: r.companyName + ' — ' + r.branchName });
        summary.push({ label: 'السيارة والفترة', value: r.carName + ' | ' + r.startDate + ' → ' + r.endDate });
      }
      if (incStaff) {
        summary.push({ label: 'الموظفون المسؤولون', value: (r.assignedEmployeeNames || []).join('، ') || 'غير مسند' });
      }
      if (incLast) {
        summary.push({ label: 'آخر تحديث', value: r.lastUpdatedByName + ': ' + r.lastUpdateText });
      }

      var extraSections = [];
      if (incBooking && details.extensions.length) {
        extraSections.push({
          title: 'التمديدات المعتمدة والمدفوعة (' + details.extensions.length + ')',
          lines: details.extensions.map(function (ex) {
            return ex.extensionNumber + ' | ' + ex.extendDays + ' يوم (' + ex.startDate + ' → ' + ex.endDate + ') | ' + ex.amount + ' ر.س';
          })
        });
      }
      if (incFollowUps && details.followUps.length) {
        extraSections.push({
          title: 'سجل المتابعات (' + details.followUps.length + ')',
          lines: details.followUps.map(function (f) {
            return f.followUpDate + ' ' + f.followUpTime + ' | ' + f.employeeName + ' [' + f.status + ']: ' + f.action + (incNotes && f.notes ? ' — ملاحظة: ' + f.notes : '');
          })
        });
      } else if (incNotes) {
        var noteLines = details.followUps.filter(function (f) { return Boolean(f.notes); }).map(function (f) {
          return f.followUpDate + ' | ' + f.employeeName + ': ' + f.notes;
        });
        if (noteLines.length) {
          extraSections.push({
            title: 'الملاحظات المسجلة (' + noteLines.length + ')',
            lines: noteLines
          });
        }
      }
      if (incProblems && details.problems.length) {
        extraSections.push({
          title: 'المشكلات المرتبطة وتحديثاتها (' + details.problems.length + ')',
          lines: details.problems.map(function (p) {
            return p.problemNumber + ' [' + p.priority + ' / ' + p.status + ']: ' + p.description;
          }).concat((details.problemUpdates || []).map(function (u) {
            return 'تحديث (' + u.employeeName + '): ' + u.newStatus + ' — ' + u.note;
          }))
        });
      }

      var user = root.RGAuth.getUser();
      await root.RGReports.exportArabicPdfDocument({
        title: document.getElementById('spdf-title').value || ('ملف الحجز رقم ' + r.reservationNumber),
        paperSize: document.getElementById('spdf-paper').value,
        orientation: document.getElementById('spdf-orient').value,
        exporterName: user ? user.name : '',
        summaryItems: summary,
        extraSections: extraSections,
        chartImages: incCharts ? capturedCharts : [],
        filename: 'reservation-' + r.reservationNumber + '.pdf'
      });
      ctx.toast('تم تصدير ملف الحجز بصيغة PDF مع العدادات والرسوم البيانية.');
      if (onCancel) onCancel();
      else modalRoot.innerHTML = '';
    });
  }

  root.RGReservations = {
    render: render,
    openReservationDrawer: openReservationDrawer
  };
})(window);
