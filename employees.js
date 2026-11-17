/**
 * RENTAL GATE CRM — Employees Directory, Ready-Made Role Presets, Custom Permissions & Account Management
 */
(function (root) {
  'use strict';

  function esc(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function groupCatalogItems(catalog) {
    var groups = [];
    (catalog || []).forEach(function (c) {
      if (groups.indexOf(c.group) === -1) groups.push(c.group);
    });
    return groups;
  }

  async function render(container, ctx) {
    var t = ctx.t;
    var user = root.RGAuth.getUser();
    var canManage = root.RGCrmCore.canUserPerform(user, 'manage_employees');

    var res = await root.RGApi.callApi('getEmployees', {});
    if (!res.success) {
      container.innerHTML = '<div class="form-error">' + esc(res.message) + '</div>';
      return;
    }

    var items = res.data.items || [];
    var rolePresets = root.RGCrmCore.normalizeRolePresets(res.data.rolePresets);
    var customPermissions = Array.isArray(res.data.customPermissions) ? res.data.customPermissions : [];
    var catalog = root.RGCrmCore.mergePermissionsCatalog(customPermissions);
    var catalogMap = {};
    catalog.forEach(function (c) { catalogMap[c.key] = c; });

    var roleLabels = root.RGCrmCore.ROLE_LABELS[ctx.lang] || root.RGCrmCore.ROLE_LABELS.ar;

    var presetsSectionHtml = canManage ? (
      '<div class="surface-card" id="role-presets-section">' +
        '<div class="section-header">' +
          '<div>' +
            '<h2 class="section-title">إدارة الصلاحيات الجاهزة (القوالب الوظيفية)</h2>' +
            '<p class="section-subtitle">أضف قوالب صلاحيات جاهزة، عدّل أسماءها وصلاحياتها، أو عدّل وأضف مسميات الصلاحيات الفردية (<strong class="tabular-nums">' + rolePresets.length + '</strong> قوالب نشطة)</p>' +
          '</div>' +
          '<div class="toolbar-row" style="margin-bottom:0;">' +
            '<button type="button" class="btn btn-primary" id="preset-add-btn">+ إضافة صلاحية جاهزة</button>' +
            '<button type="button" class="btn" id="perms-catalog-btn">إدارة وتعديل الصلاحيات الفردية</button>' +
            '<button type="button" class="btn btn-sm" id="preset-reset-btn" data-confirm="0">استعادة الافتراضي</button>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:12px;">' +
          rolePresets.map(function (pr) {
            var permKeys = Array.isArray(pr.permissions) ? pr.permissions : [];
            var previewLabels = permKeys.slice(0, 4).map(function (k) {
              return (catalogMap[k] && catalogMap[k].label) || k;
            });
            var extraCount = Math.max(0, permKeys.length - previewLabels.length);
            var roleTagClass = pr.role === 'general_manager'
              ? 'status-danger'
              : (pr.role === 'supervisor' ? 'status-warning' : 'status-info');

            return '<div class="surface-card" style="padding:14px;background:var(--bg-surface-subtle);display:flex;flex-direction:column;justify-content:space-between;gap:10px;" data-preset-card="' + esc(pr.id) + '">' +
              '<div style="display:flex;flex-direction:column;gap:6px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">' +
                  '<strong style="font-size:14px;line-height:1.4;">' + esc(pr.label) + '</strong>' +
                  '<span class="status-tag ' + roleTagClass + '">' + esc(roleLabels[pr.role] || pr.role) + '</span>' +
                '</div>' +
                '<div class="meta-inline">' +
                  '<span>المسمى: <strong>' + esc(pr.jobTitle) + '</strong></span>' +
                  '<span>·</span>' +
                  '<span class="tabular-nums">' + permKeys.length + ' صلاحية</span>' +
                '</div>' +
                '<div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">' +
                  (previewLabels.length ? esc(previewLabels.join(' · ')) : 'لا توجد صلاحيات محددة') +
                  (extraCount > 0 ? ' <strong style="color:var(--brand-primary);">+' + extraCount + ' أخرى</strong>' : '') +
                '</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding-top:8px;border-top:1px solid var(--border-hairline);">' +
                '<button type="button" class="btn btn-sm preset-edit-btn" data-id="' + esc(pr.id) + '">تعديل الاسم والصلاحيات</button>' +
                '<button type="button" class="btn btn-sm btn-primary preset-use-btn" data-id="' + esc(pr.id) + '">تعيين لموظف</button>' +
                '<button type="button" class="btn btn-sm btn-danger preset-del-btn" data-id="' + esc(pr.id) + '" data-confirm="0">حذف</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>'
    ) : '';

    container.innerHTML =
      '<div class="surface-card">' +
        '<div class="section-header">' +
          '<div><h2 class="section-title">' + t('nav_employees') + '</h2><p class="section-subtitle">إجمالي الموظفين: <strong class="tabular-nums">' + items.length + '</strong></p></div>' +
          (canManage ? (
            '<div class="toolbar-row" style="margin-bottom:0;">' +
              '<button type="button" class="btn" id="emp-scroll-presets-btn">الصلاحيات الجاهزة (' + rolePresets.length + ')</button>' +
              '<button type="button" class="btn btn-primary" id="emp-add-btn">إضافة موظف جديد</button>' +
            '</div>'
          ) : '') +
        '</div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
          '<th>الموظف والنشاط</th><th>المستخدم</th><th>الوظيفة</th><th>الدور والصلاحيات</th><th>الحالة</th><th>حجوزات</th><th>متابعات</th><th>مشكلات</th><th>آخر نشاط</th><th>العملاء</th>' +
          (canManage ? '<th>تعديل</th>' : '') +
        '</tr></thead><tbody>' +
          items.map(function (e) {
            var isActive = e.status === 'active';
            var isSelf = user && e.id === user.id;
            var permsList = root.RGCrmCore.resolveEffectivePermissions(e);
            return '<tr>' +
              '<td>' +
                '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                  '<button type="button" class="btn-link-inline emp-view-btn" data-id="' + esc(e.id) + '">' + esc(e.name) + '</button>' +
                  (canManage && !isSelf ? (
                    '<button type="button" class="btn btn-sm ' + (isActive ? 'btn-danger' : '') + ' emp-toggle-btn" data-id="' + esc(e.id) + '" data-next="' + (isActive ? 'disabled' : 'active') + '" title="' + (isActive ? 'إيقاف نشاط الموظف فوراً' : 'تشغيل نشاط الموظف') + '">' +
                      (isActive ? 'إيقاف النشاط' : 'تشغيل النشاط') +
                    '</button>'
                  ) : '') +
                '</div>' +
                '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;" class="mono">' + esc(e.phone || '') + '</div>' +
              '</td>' +
              '<td class="mono">' + esc(e.username) + '</td>' +
              '<td>' + esc(e.jobTitle) + '</td>' +
              '<td>' +
                '<div>' + esc(roleLabels[e.role] || e.role) + '</div>' +
                '<div style="font-size:11px;color:var(--text-muted);" class="tabular-nums">' + permsList.length + ' صلاحية</div>' +
              '</td>' +
              '<td><span class="status-tag ' + (isActive ? 'status-success' : 'status-danger') + '">' + (isActive ? 'نشط' : 'متوقف عن النشاط') + '</span></td>' +
              '<td class="tabular-nums">' + (e.reservationsCount || 0) + '</td>' +
              '<td class="tabular-nums">' + (e.followUpsCount || 0) + '</td>' +
              '<td class="tabular-nums">' + (e.problemsCount || 0) + '</td>' +
              '<td class="mono" style="white-space:nowrap;">' + (e.lastActivity ? esc(String(e.lastActivity).replace('T', ' ').substring(0, 16)) : '-') + '</td>' +
              '<td><button type="button" class="btn btn-sm btn-primary emp-view-btn" data-id="' + esc(e.id) + '">العملاء</button></td>' +
              (canManage ? (
                '<td><button type="button" class="btn btn-sm emp-edit-btn" data-id="' + esc(e.id) + '">تعديل</button></td>'
              ) : '') +
            '</tr>';
          }).join('') +
        '</tbody></table></div>' +
      '</div>' +
      presetsSectionHtml;

    var scrollPresetsBtn = document.getElementById('emp-scroll-presets-btn');
    if (scrollPresetsBtn) {
      scrollPresetsBtn.addEventListener('click', function () {
        var sec = document.getElementById('role-presets-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    var addBtn = document.getElementById('emp-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        openEmployeeModal(null, ctx, function () { render(container, ctx); }, {
          rolePresets: rolePresets,
          customPermissions: customPermissions
        });
      });
    }

    container.querySelectorAll('.emp-view-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openEmployeeDetailsDrawer(btn.getAttribute('data-id'), ctx, items, function () {
          render(container, ctx);
        });
      });
    });

    container.querySelectorAll('.emp-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var emp = items.find(function (x) { return x.id === btn.getAttribute('data-id'); });
        if (emp) {
          openEmployeeModal(emp, ctx, function () { render(container, ctx); }, {
            rolePresets: rolePresets,
            customPermissions: customPermissions
          });
        }
      });
    });

    container.querySelectorAll('.emp-toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var nextStatus = btn.getAttribute('data-next');
        var resToggle = await root.RGApi.callApi('disableEmployee', {
          employeeId: btn.getAttribute('data-id'),
          status: nextStatus
        });
        if (resToggle.success) {
          ctx.toast(nextStatus === 'disabled' ? 'تم إيقاف نشاط الموظف وإلغاء جلساته.' : 'تم تشغيل نشاط الموظف بنجاح.');
          render(container, ctx);
        } else {
          ctx.toast(resToggle.message, true);
        }
      });
    });

    if (canManage) {
      document.getElementById('preset-add-btn').addEventListener('click', function () {
        openRolePresetModal(null, customPermissions, ctx, function () { render(container, ctx); });
      });

      document.getElementById('perms-catalog-btn').addEventListener('click', function () {
        openPermissionsCatalogModal(customPermissions, ctx, function () { render(container, ctx); });
      });

      var resetBtn = document.getElementById('preset-reset-btn');
      resetBtn.addEventListener('click', async function () {
        if (resetBtn.getAttribute('data-confirm') !== '1') {
          resetBtn.setAttribute('data-confirm', '1');
          resetBtn.textContent = 'تأكيد استعادة الافتراضي؟';
          resetBtn.classList.add('btn-danger');
          setTimeout(function () {
            if (document.body.contains(resetBtn)) {
              resetBtn.setAttribute('data-confirm', '0');
              resetBtn.textContent = 'استعادة الافتراضي';
              resetBtn.classList.remove('btn-danger');
            }
          }, 3500);
          return;
        }
        resetBtn.disabled = true;
        var resp = await root.RGApi.callApi('resetRolePresets', {});
        if (resp.success) {
          ctx.toast(resp.message || 'تمت استعادة القوالب الافتراضية.');
          render(container, ctx);
        } else {
          ctx.toast(resp.message, true);
          resetBtn.disabled = false;
        }
      });

      container.querySelectorAll('.preset-edit-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var found = rolePresets.find(function (p) { return p.id === btn.getAttribute('data-id'); });
          if (found) {
            openRolePresetModal(found, customPermissions, ctx, function () { render(container, ctx); });
          }
        });
      });

      container.querySelectorAll('.preset-use-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openEmployeeModal(null, ctx, function () { render(container, ctx); }, {
            rolePresets: rolePresets,
            customPermissions: customPermissions,
            initialPresetId: btn.getAttribute('data-id')
          });
        });
      });

      container.querySelectorAll('.preset-del-btn').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          if (btn.getAttribute('data-confirm') !== '1') {
            btn.setAttribute('data-confirm', '1');
            btn.textContent = 'تأكيد الحذف؟';
            setTimeout(function () {
              if (document.body.contains(btn)) {
                btn.setAttribute('data-confirm', '0');
                btn.textContent = 'حذف';
              }
            }, 3500);
            return;
          }
          btn.disabled = true;
          var delResp = await root.RGApi.callApi('deleteRolePreset', { presetId: btn.getAttribute('data-id') });
          if (delResp.success) {
            ctx.toast(delResp.message || 'تم حذف الصلاحية الجاهزة.');
            render(container, ctx);
          } else {
            ctx.toast(delResp.message, true);
            btn.disabled = false;
            btn.setAttribute('data-confirm', '0');
            btn.textContent = 'حذف';
          }
        });
      });
    }
  }

  function openRolePresetModal(existingPreset, customPermissions, ctx, onSaved) {
    var modalRoot = document.getElementById('modal-root');
    var isEdit = Boolean(existingPreset && existingPreset.id);
    var liveCustomPerms = Array.isArray(customPermissions) ? customPermissions.slice() : [];
    var catalog = root.RGCrmCore.mergePermissionsCatalog(liveCustomPerms);
    var groups = groupCatalogItems(catalog);
    var initialRole = (existingPreset && existingPreset.role) || 'agent';
    var initialPerms = (existingPreset && Array.isArray(existingPreset.permissions))
      ? existingPreset.permissions.slice()
      : root.RGCrmCore.resolveEffectivePermissions(initialRole);

    modalRoot.innerHTML =
      '<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="preset-modal-title">' +
        '<form class="modal-panel" id="preset-form" style="max-width:760px;">' +
          '<div class="modal-header">' +
            '<h3 class="modal-title" id="preset-modal-title">' + (isEdit ? 'تعديل الصلاحية الجاهزة: ' + esc(existingPreset.label) : 'إضافة صلاحية جاهزة جديدة') + '</h3>' +
            '<button type="button" class="btn btn-sm" id="preset-modal-cancel">إغلاق</button>' +
          '</div>' +

          '<div class="form-grid-3">' +
            '<div class="form-group"><label class="form-label" for="pr-label">اسم الصلاحية الجاهزة (القالب)</label><input class="input" id="pr-label" value="' + esc(existingPreset ? existingPreset.label : '') + '" placeholder="مثال: مشرف وردية مسائية" required></div>' +
            '<div class="form-group"><label class="form-label" for="pr-job">المسمى الوظيفي الافتراضي</label><input class="input" id="pr-job" value="' + esc(existingPreset ? existingPreset.jobTitle : '') + '" placeholder="مثال: مشرف خدمة عملاء"></div>' +
            '<div class="form-group"><label class="form-label" for="pr-role">الدور الأساسي</label><select class="select" id="pr-role">' +
              '<option value="agent"' + (initialRole === 'agent' ? ' selected' : '') + '>موظف خدمة العملاء</option>' +
              '<option value="supervisor"' + (initialRole === 'supervisor' ? ' selected' : '') + '>المشرف</option>' +
              '<option value="general_manager"' + (initialRole === 'general_manager' ? ' selected' : '') + '>المدير العام</option>' +
            '</select></div>' +
          '</div>' +

          '<div style="padding:12px;border:1px solid var(--border-hairline);border-radius:var(--radius-sm);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' +
              '<div><strong style="font-size:13.5px;">الصلاحيات المشمولة في هذا القالب</strong>' +
              '<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">حدد الصلاحيات أو ألغها، أو أضف صلاحية جديدة مباشرة للقائمة.</div></div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                '<button type="button" class="btn btn-sm" id="pr-perm-defaults">افتراضي الدور</button>' +
                '<button type="button" class="btn btn-sm" id="pr-perm-all">تحديد الكل</button>' +
                '<button type="button" class="btn btn-sm" id="pr-perm-clear">إلغاء الكل</button>' +
              '</div>' +
            '</div>' +

            '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:8px 10px;margin-bottom:10px;background:var(--bg-surface-subtle);border:1px solid var(--border-hairline);border-radius:var(--radius-sm);">' +
              '<input class="input" id="pr-quick-perm-label" placeholder="أضف صلاحية جديدة للقائمة (مثال: متابعة VIP)..." style="flex:1;min-width:180px;min-height:32px;font-size:12.5px;">' +
              '<input class="input" id="pr-quick-perm-group" value="صلاحيات مخصصة" placeholder="المجموعة" style="width:145px;min-height:32px;font-size:12.5px;">' +
              '<button type="button" class="btn btn-sm btn-primary" id="pr-quick-perm-add">+ إضافة صلاحية</button>' +
            '</div>' +

            '<div id="pr-permissions-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:10px;"></div>' +
          '</div>' +

          '<div id="pr-form-err" class="form-error hidden"></div>' +
          '<div class="modal-footer">' +
            '<button type="submit" class="btn btn-primary" id="pr-save-btn">' + (isEdit ? 'حفظ تعديلات الصلاحية الجاهزة' : 'حفظ الصلاحية الجاهزة') + '</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    var roleSelect = document.getElementById('pr-role');
    var permsGrid = document.getElementById('pr-permissions-grid');
    var selectedSet = {};
    initialPerms.forEach(function (k) { selectedSet[k] = true; });

    function renderGrid() {
      var roleVal = roleSelect.value;
      var isAgent = roleVal === 'agent';
      catalog = root.RGCrmCore.mergePermissionsCatalog(liveCustomPerms);
      groups = groupCatalogItems(catalog);
      permsGrid.innerHTML = groups.map(function (g) {
        var groupItems = catalog.filter(function (c) { return c.group === g; });
        return '<div style="padding:10px;border:1px solid var(--border-hairline);border-radius:var(--radius-sm);background:var(--bg-surface-subtle);">' +
          '<div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--brand-primary);">' + esc(g) + '</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;">' +
            groupItems.map(function (item) {
              var isApiPerm = item.key === 'sync_data' || item.key === 'manage_api_connection';
              var disabled = isApiPerm && isAgent;
              var checked = Boolean(selectedSet[item.key]) && !disabled;
              return '<label class="checkbox-item" style="font-size:12.5px;">' +
                '<input type="checkbox" class="pr-perm-checkbox" value="' + esc(item.key) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '> ' +
                '<span>' + esc(item.label) + (item.isCustom ? ' <em style="font-size:10.5px;color:var(--brand-primary);">(مخصصة)</em>' : '') + '</span>' +
              '</label>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('');

      permsGrid.querySelectorAll('.pr-perm-checkbox').forEach(function (cb) {
        cb.addEventListener('change', function () {
          if (cb.checked) selectedSet[cb.value] = true;
          else delete selectedSet[cb.value];
        });
      });
    }

    renderGrid();

    roleSelect.addEventListener('change', renderGrid);

    document.getElementById('pr-perm-defaults').addEventListener('click', function () {
      selectedSet = {};
      root.RGCrmCore.resolveEffectivePermissions(roleSelect.value).forEach(function (k) { selectedSet[k] = true; });
      renderGrid();
    });

    document.getElementById('pr-perm-all').addEventListener('click', function () {
      catalog.forEach(function (c) {
        if (roleSelect.value === 'agent' && (c.key === 'sync_data' || c.key === 'manage_api_connection')) return;
        selectedSet[c.key] = true;
      });
      renderGrid();
    });

    document.getElementById('pr-perm-clear').addEventListener('click', function () {
      selectedSet = {};
      renderGrid();
    });

    document.getElementById('pr-quick-perm-add').addEventListener('click', async function () {
      var lblEl = document.getElementById('pr-quick-perm-label');
      var grpEl = document.getElementById('pr-quick-perm-group');
      var lbl = lblEl.value.trim();
      if (!lbl) {
        ctx.toast('اكتب اسم الصلاحية الجديدة أولاً.', true);
        return;
      }
      var addResp = await root.RGApi.callApi('savePermissionDefinition', {
        label: lbl,
        group: grpEl.value.trim() || 'صلاحيات مخصصة'
      });
      if (!addResp.success) {
        ctx.toast(addResp.message, true);
        return;
      }
      liveCustomPerms = addResp.data.customPermissions || [];
      if (addResp.data.saved && addResp.data.saved.key) {
        selectedSet[addResp.data.saved.key] = true;
      }
      lblEl.value = '';
      renderGrid();
      ctx.toast('تمت إضافة الصلاحية الجديدة وتحديدها في القالب.');
    });

    document.getElementById('preset-modal-cancel').addEventListener('click', function () {
      if (onSaved && existingPreset && existingPreset._fromEmployeeModal) {
        onSaved({ cancelled: true, customPermissions: liveCustomPerms });
      } else {
        modalRoot.innerHTML = '';
      }
    });

    document.getElementById('preset-form').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var errEl = document.getElementById('pr-form-err');
      errEl.classList.add('hidden');
      var saveBtn = document.getElementById('pr-save-btn');
      saveBtn.disabled = true;

      var perms = Object.keys(selectedSet).filter(function (k) { return selectedSet[k]; });
      var resp = await root.RGApi.callApi('saveRolePreset', {
        id: isEdit ? existingPreset.id : '',
        label: document.getElementById('pr-label').value,
        jobTitle: document.getElementById('pr-job').value,
        role: roleSelect.value,
        permissions: perms
      });

      if (!resp.success) {
        errEl.textContent = resp.message;
        errEl.classList.remove('hidden');
        saveBtn.disabled = false;
        return;
      }

      ctx.toast(resp.message || 'تم حفظ الصلاحية الجاهزة.');
      modalRoot.innerHTML = '';
      if (onSaved) {
        onSaved({
          rolePresets: resp.data.rolePresets,
          savedPreset: resp.data.savedPreset,
          customPermissions: liveCustomPerms
        });
      }
    });
  }

  function openPermissionsCatalogModal(customPermissions, ctx, onDone) {
    var modalRoot = document.getElementById('modal-root');
    var liveCustom = Array.isArray(customPermissions) ? customPermissions.slice() : [];

    function renderCatalogModal() {
      var catalog = root.RGCrmCore.mergePermissionsCatalog(liveCustom);
      modalRoot.innerHTML =
        '<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="perms-cat-title">' +
          '<div class="modal-panel" style="max-width:780px;">' +
            '<div class="modal-header">' +
              '<div><h3 class="modal-title" id="perms-cat-title">إدارة وتعديل الصلاحيات الفردية</h3>' +
              '<p class="section-subtitle">يمكنك إضافة صلاحية مخصصة جديدة، أو تعديل اسم ومجموعة أي صلاحية، أو حذف الصلاحيات المخصصة.</p></div>' +
              '<button type="button" class="btn btn-sm" id="perms-cat-close">إغلاق</button>' +
            '</div>' +

            '<form id="perm-add-form" style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;padding:12px;background:var(--bg-surface-subtle);border:1px solid var(--border-hairline);border-radius:var(--radius-sm);">' +
              '<div class="form-group" style="flex:1.4;min-width:190px;"><label class="form-label" for="new-perm-label">اسم الصلاحية الجديدة</label><input class="input" id="new-perm-label" placeholder="مثال: مراجعة العقود الشهرية" required></div>' +
              '<div class="form-group" style="flex:1;min-width:150px;"><label class="form-label" for="new-perm-group">المجموعة</label><input class="input" id="new-perm-group" value="صلاحيات مخصصة" required></div>' +
              '<button type="submit" class="btn btn-primary">+ إضافة صلاحية</button>' +
            '</form>' +

            '<div class="table-wrap" style="max-height:380px;overflow:auto;"><table class="data-table"><thead><tr>' +
              '<th>اسم الصلاحية</th><th>المجموعة</th><th>النوع</th><th>إجراء</th>' +
            '</tr></thead><tbody>' +
              catalog.map(function (c) {
                return '<tr data-perm-key="' + esc(c.key) + '">' +
                  '<td><input class="input perm-row-label" value="' + esc(c.label) + '" style="min-height:32px;font-size:12.5px;"></td>' +
                  '<td><input class="input perm-row-group" value="' + esc(c.group) + '" style="min-height:32px;font-size:12.5px;width:150px;"></td>' +
                  '<td>' + (c.isCustom
                    ? '<span class="status-tag status-info">مخصصة</span>'
                    : (c.isRenamed ? '<span class="status-tag status-warning">معدل</span>' : '<span class="status-tag status-neutral">أساسية</span>')) + '</td>' +
                  '<td><div style="display:flex;gap:6px;">' +
                    '<button type="button" class="btn btn-sm btn-primary perm-row-save" data-key="' + esc(c.key) + '">حفظ التعديل</button>' +
                    ((c.isCustom || c.isRenamed)
                      ? '<button type="button" class="btn btn-sm btn-danger perm-row-del" data-key="' + esc(c.key) + '">' + (c.isCustom ? 'حذف' : 'استعادة') + '</button>'
                      : '') +
                  '</div></td>' +
                '</tr>';
              }).join('') +
            '</tbody></table></div>' +
          '</div>' +
        '</div>';

      document.getElementById('perms-cat-close').addEventListener('click', function () {
        modalRoot.innerHTML = '';
        if (onDone) onDone({ customPermissions: liveCustom });
      });

      document.getElementById('perm-add-form').addEventListener('submit', async function (ev) {
        ev.preventDefault();
        var resp = await root.RGApi.callApi('savePermissionDefinition', {
          label: document.getElementById('new-perm-label').value,
          group: document.getElementById('new-perm-group').value
        });
        if (!resp.success) {
          ctx.toast(resp.message, true);
          return;
        }
        liveCustom = resp.data.customPermissions || [];
        ctx.toast('تمت إضافة الصلاحية الجديدة.');
        renderCatalogModal();
      });

      modalRoot.querySelectorAll('.perm-row-save').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var key = btn.getAttribute('data-key');
          var row = modalRoot.querySelector('tr[data-perm-key="' + key + '"]');
          var labelVal = row.querySelector('.perm-row-label').value;
          var groupVal = row.querySelector('.perm-row-group').value;
          btn.disabled = true;
          var resp = await root.RGApi.callApi('savePermissionDefinition', {
            key: key,
            label: labelVal,
            group: groupVal
          });
          if (!resp.success) {
            ctx.toast(resp.message, true);
            btn.disabled = false;
            return;
          }
          liveCustom = resp.data.customPermissions || [];
          ctx.toast('تم حفظ تعديل الصلاحية.');
          renderCatalogModal();
        });
      });

      modalRoot.querySelectorAll('.perm-row-del').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var key = btn.getAttribute('data-key');
          btn.disabled = true;
          var resp = await root.RGApi.callApi('deletePermissionDefinition', { key: key });
          if (!resp.success) {
            ctx.toast(resp.message, true);
            btn.disabled = false;
            return;
          }
          liveCustom = resp.data.customPermissions || [];
          ctx.toast(resp.message || 'تم تحديث الصلاحية.');
          renderCatalogModal();
        });
      });
    }

    renderCatalogModal();
  }

  async function openEmployeeDetailsDrawer(employeeId, ctx, allEmployees, onUpdated) {
    var modalRoot = document.getElementById('modal-root');
    var resp = await root.RGApi.callApi('getEmployeeDetails', { employeeId: employeeId });
    if (!resp.success) {
      ctx.toast(resp.message, true);
      return;
    }

    var d = resp.data;
    var emp = d.employee;
    var stats = d.stats || {};
    var reservations = d.assignedReservations || [];
    var followUps = d.followUps || [];
    var roleLabels = root.RGCrmCore.ROLE_LABELS[ctx.lang] || root.RGCrmCore.ROLE_LABELS.ar;

    modalRoot.innerHTML =
      '<div class="drawer-backdrop" id="emp-drawer-backdrop" role="dialog" aria-modal="true" aria-labelledby="emp-drawer-title">' +
        '<div class="drawer-panel">' +
          '<div class="modal-header">' +
            '<div><h3 class="modal-title" id="emp-drawer-title">' + esc(emp.name) + '</h3>' +
            '<div class="meta-inline"><span>' + esc(emp.jobTitle) + '</span><span>·</span><span>' + esc(roleLabels[emp.role] || emp.role) + '</span>' +
            (emp.phone ? '<span>·</span><span class="mono">' + esc(emp.phone) + '</span>' : '') + '</div></div>' +
            '<button type="button" class="btn btn-sm" id="emp-drawer-close">إغلاق</button>' +
          '</div>' +

          '<div class="kpi-grid-4">' +
            '<div class="kpi-card"><span class="kpi-label">العملاء</span><span class="kpi-value tabular-nums" style="font-size:20px;">' + (stats.uniqueCustomersCount || 0) + '</span></div>' +
            '<div class="kpi-card"><span class="kpi-label">الحجوزات</span><span class="kpi-value tabular-nums" style="font-size:20px;">' + (stats.reservationsCount || 0) + '</span></div>' +
            '<div class="kpi-card kpi-success"><span class="kpi-label">المتابعات</span><span class="kpi-value tabular-nums" style="font-size:20px;">' + (stats.followUpsCount || 0) + '</span></div>' +
            '<div class="kpi-card ' + ((stats.problemsCount || 0) ? 'kpi-danger' : '') + '"><span class="kpi-label">المشكلات</span><span class="kpi-value tabular-nums" style="font-size:20px;">' + (stats.problemsCount || 0) + '</span></div>' +
          '</div>' +

          '<div class="chart-card"><h4 class="chart-card-title">ملخص حالات حجوزات الموظف</h4><div class="chart-canvas-wrap" style="height:175px;"><canvas id="emp-drawer-chart"></canvas></div></div>' +

          '<div>' +
            '<h4 style="margin:0 0 10px;font-size:14px;">عملاء وحجوزات الموظف (' + reservations.length + ') — اضغط على أي حجز لعرض التفاصيل</h4>' +
            (reservations.length === 0
              ? '<div class="empty-state" style="padding:20px;">لا توجد حجوزات أو عملاء مسندون لهذا الموظف حاليًا.</div>'
              : '<div class="timeline-list">' + reservations.map(function (r) {
                  var whatHappened = r.latestFollowUp
                    ? (r.latestFollowUp.employeeName + ' (' + r.latestFollowUp.status + '): ' + r.latestFollowUp.action + (r.latestFollowUp.notes ? ' — ' + r.latestFollowUp.notes : ''))
                    : (r.lastUpdateText || 'تم استيراد الحجز وبانتظار المتابعة');
                  return '<button type="button" class="interactive-res-card emp-open-res" data-res-id="' + esc(r.id) + '">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;width:100%;">' +
                      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
                        '<strong class="mono">' + esc(r.reservationNumber) + '</strong>' +
                        '<span>·</span>' +
                        '<strong>' + esc(r.customerName) + '</strong>' +
                        '<span class="mono" style="color:var(--text-muted);font-size:12px;">' + esc(r.customerPhone) + '</span>' +
                      '</div>' +
                      '<span class="status-tag status-info">' + esc(r.internalStatus) + '</span>' +
                    '</div>' +
                    '<div class="meta-inline">' +
                      '<span>' + esc(r.companyName) + ' — ' + esc(r.branchName) + '</span><span>·</span>' +
                      '<span>' + esc(r.carName) + '</span><span>·</span>' +
                      '<span class="mono">' + esc(r.startDate) + ' → ' + esc(r.endDate) + '</span>' +
                    '</div>' +
                    '<div class="res-story-box"><strong>ما حدث في الحجز:</strong> ' + esc(whatHappened) + '</div>' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;width:100%;font-size:12px;color:var(--text-muted);">' +
                      '<span class="tabular-nums">المتابعات: ' + r.followUpsCount + ' (منها ' + r.myFollowUpsCount + ' للموظف) · المشكلات: ' + r.problemsCount + '</span>' +
                      '<span style="color:var(--brand-primary);font-weight:700;">فتح تفاصيل الحجز ←</span>' +
                    '</div>' +
                  '</button>';
                }).join('') + '</div>') +
          '</div>' +

          '<div>' +
            '<h4 style="margin:0 0 10px;font-size:14px;">سجل متابعات الموظف (' + followUps.length + ')</h4>' +
            (followUps.length === 0
              ? '<div class="empty-state" style="padding:20px;">لم يقم هذا الموظف بتسجيل متابعات بعد.</div>'
              : '<div class="timeline-list">' + followUps.map(function (f) {
                  return '<div class="timeline-item">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
                      '<button type="button" class="btn-link-inline mono emp-open-res" data-res-id="' + esc(f.reservationId) + '">' + esc(f.reservationNumber) + ' — ' + esc(f.customerName) + '</button>' +
                      '<span class="status-tag status-info">' + esc(f.status) + '</span>' +
                    '</div>' +
                    '<div>' + esc(f.action) + '</div>' +
                    (f.notes ? '<div style="color:var(--text-secondary);font-size:12.5px;">' + esc(f.notes) + '</div>' : '') +
                    '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
                      '<div class="meta-inline mono"><span>' + esc(f.followUpDate) + '</span><span>·</span><span>' + esc(f.followUpTime) + '</span></div>' +
                      '<button type="button" class="btn btn-sm emp-open-res" data-res-id="' + esc(f.reservationId) + '">تفاصيل الحجز</button>' +
                    '</div>' +
                  '</div>';
                }).join('') + '</div>') +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('emp-drawer-close').addEventListener('click', function () { modalRoot.innerHTML = ''; });

    modalRoot.querySelectorAll('.emp-open-res').forEach(function (el) {
      el.addEventListener('click', function () {
        var resId = el.getAttribute('data-res-id');
        root.RGReservations.openReservationDrawer(resId, ctx, allEmployees, onUpdated, {
          backLabel: 'العودة إلى ' + emp.name,
          onBack: function () {
            openEmployeeDetailsDrawer(employeeId, ctx, allEmployees, onUpdated);
          }
        });
      });
    });

    var chartEl = document.getElementById('emp-drawer-chart');
    if (chartEl && root.Chart) {
      var statusMap = stats.statusCounts || {};
      var labels = Object.keys(statusMap);
      var values = Object.values(statusMap);
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      new root.Chart(chartEl.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['لا توجد بيانات'],
          datasets: [{
            label: 'عدد الحجوزات',
            data: values.length ? values : [0],
            backgroundColor: '#d32228',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: isDark ? '#cfd1d3' : '#313232' }, grid: { display: false } },
            y: { ticks: { color: isDark ? '#cfd1d3' : '#313232', precision: 0 }, beginAtZero: true }
          }
        }
      });
    }
  }

  function openEmployeeModal(existing, ctx, onSaved, opts) {
    var options = opts || {};
    var modalRoot = document.getElementById('modal-root');
    var isEdit = Boolean(existing);
    var presets = root.RGCrmCore.normalizeRolePresets(options.rolePresets);
    var customPermissions = Array.isArray(options.customPermissions) ? options.customPermissions.slice() : [];
    var catalog = root.RGCrmCore.mergePermissionsCatalog(customPermissions);
    var groups = groupCatalogItems(catalog);

    var initialPreset = options.initialPresetId
      ? presets.find(function (p) { return p.id === options.initialPresetId; })
      : null;

    var draftState = {
      name: existing ? existing.name : '',
      username: existing ? existing.username : '',
      phone: existing ? (existing.phone || '') : '',
      email: existing ? (existing.email || '') : '',
      jobTitle: initialPreset ? initialPreset.jobTitle : (existing ? existing.jobTitle : 'موظف خدمة العملاء'),
      role: initialPreset ? initialPreset.role : (existing ? existing.role : 'agent'),
      presetId: initialPreset ? initialPreset.id : 'custom',
      permissions: initialPreset
        ? initialPreset.permissions.slice()
        : (existing ? root.RGCrmCore.resolveEffectivePermissions(existing) : root.RGCrmCore.resolveEffectivePermissions('agent'))
    };

    function drawModal() {
      catalog = root.RGCrmCore.mergePermissionsCatalog(customPermissions);
      groups = groupCatalogItems(catalog);

      modalRoot.innerHTML =
        '<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="emp-modal-title">' +
          '<form class="modal-panel" id="emp-form" style="max-width:790px;">' +
            '<div class="modal-header">' +
              '<h3 class="modal-title" id="emp-modal-title">' + (isEdit ? 'تعديل بيانات وصلاحيات: ' + esc(existing.name) : 'إنشاء حساب موظف جديد') + '</h3>' +
              '<button type="button" class="btn btn-sm" id="emp-cancel">إغلاق</button>' +
            '</div>' +

            '<div style="padding:12px;border:1px solid var(--border-hairline);border-radius:var(--radius-sm);background:var(--bg-surface-subtle);">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">' +
                '<label class="form-label" for="ef-preset" style="margin:0;">الوظائف والصلاحيات الجاهزة (قالب سريع)</label>' +
                '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                  '<button type="button" class="btn btn-sm btn-primary" id="ef-preset-add">+ حفظ كقالب جديد</button>' +
                  '<button type="button" class="btn btn-sm" id="ef-preset-edit"' + (draftState.presetId === 'custom' ? ' disabled' : '') + '>تعديل المحدد</button>' +
                  '<button type="button" class="btn btn-sm btn-danger" id="ef-preset-delete" data-confirm="0"' + (draftState.presetId === 'custom' ? ' disabled' : '') + '>حذف المحدد</button>' +
                '</div>' +
              '</div>' +
              '<select class="select" id="ef-preset" style="margin-bottom:8px;">' +
                '<option value="custom"' + (draftState.presetId === 'custom' ? ' selected' : '') + '>— تخصيص يدوي للصلاحيات —</option>' +
                presets.map(function (pr) {
                  return '<option value="' + esc(pr.id) + '"' + (draftState.presetId === pr.id ? ' selected' : '') + '>' + esc(pr.label) + '</option>';
                }).join('') +
              '</select>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                presets.map(function (pr) {
                  var isActiveChip = draftState.presetId === pr.id;
                  return '<button type="button" class="btn btn-sm ef-preset-chip' + (isActiveChip ? ' btn-primary' : '') + '" data-preset-id="' + esc(pr.id) + '">' + esc(pr.label) + '</button>';
                }).join('') +
              '</div>' +
            '</div>' +

            '<div class="form-grid-2">' +
              '<div class="form-group"><label class="form-label" for="ef-name">الاسم الكامل</label><input class="input" id="ef-name" value="' + esc(draftState.name) + '" required></div>' +
              '<div class="form-group"><label class="form-label" for="ef-username">اسم المستخدم</label><input class="input mono" id="ef-username" value="' + esc(draftState.username) + '" ' + (isEdit ? 'disabled' : 'required') + '></div>' +
              '<div class="form-group"><label class="form-label" for="ef-phone">رقم الهاتف</label><input class="input mono" id="ef-phone" value="' + esc(draftState.phone) + '"></div>' +
              '<div class="form-group"><label class="form-label" for="ef-email">البريد الإلكتروني</label><input class="input mono" type="email" id="ef-email" value="' + esc(draftState.email) + '"></div>' +
              '<div class="form-group"><label class="form-label" for="ef-job">المسمى الوظيفي</label><input class="input" id="ef-job" value="' + esc(draftState.jobTitle) + '"></div>' +
              '<div class="form-group"><label class="form-label" for="ef-role">الدور الأساسي</label><select class="select" id="ef-role">' +
                '<option value="agent"' + (draftState.role === 'agent' ? ' selected' : '') + '>موظف خدمة العملاء</option>' +
                '<option value="supervisor"' + (draftState.role === 'supervisor' ? ' selected' : '') + '>المشرف</option>' +
                '<option value="general_manager"' + (draftState.role === 'general_manager' ? ' selected' : '') + '>المدير العام</option>' +
              '</select></div>' +
            '</div>' +

            '<div style="padding:12px;border:1px solid var(--border-hairline);border-radius:var(--radius-sm);">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' +
                '<div><strong style="font-size:13.5px;">الصلاحيات المخصصة لهذا الموظف</strong>' +
                '<div id="ef-api-lock-note" style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">صلاحيات API والربط محصورة تلقائيًا بدور المشرف أو المدير العام فقط.</div></div>' +
                '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                  '<button type="button" class="btn btn-sm" id="ef-manage-perms-btn">+ إضافة / تعديل صلاحية</button>' +
                  '<button type="button" class="btn btn-sm" id="ef-perm-defaults">افتراضي الدور</button>' +
                  '<button type="button" class="btn btn-sm" id="ef-perm-all">تحديد الكل</button>' +
                '</div>' +
              '</div>' +
              '<div id="ef-permissions-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;">' +
                groups.map(function (g) {
                  var groupItems = catalog.filter(function (c) { return c.group === g; });
                  return '<div style="padding:10px;border:1px solid var(--border-hairline);border-radius:var(--radius-sm);background:var(--bg-surface-subtle);">' +
                    '<div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--brand-primary);">' + esc(g) + '</div>' +
                    '<div style="display:flex;flex-direction:column;gap:6px;">' +
                      groupItems.map(function (item) {
                        var checked = draftState.permissions.indexOf(item.key) !== -1;
                        var isApiPerm = item.key === 'sync_data' || item.key === 'manage_api_connection';
                        var disabledAttr = (isApiPerm && draftState.role === 'agent') ? ' disabled' : '';
                        return '<label class="checkbox-item" style="font-size:12.5px;">' +
                          '<input type="checkbox" class="ef-perm-checkbox" value="' + esc(item.key) + '"' + (checked && !disabledAttr ? ' checked' : '') + disabledAttr + '> ' +
                          '<span>' + esc(item.label) + '</span>' +
                        '</label>';
                      }).join('') +
                    '</div>' +
                  '</div>';
                }).join('') +
              '</div>' +
            '</div>' +

            '<div class="form-group"><label class="form-label" for="ef-pass">' + (isEdit ? 'إعادة تعيين كلمة المرور (اختياري — اتركه فارغًا للإبقاء)' : 'كلمة المرور (6 أحرف على الأقل)') + '</label>' +
              '<input class="input" type="password" id="ef-pass" ' + (isEdit ? '' : 'required minlength="6"') + '></div>' +
            '<div id="emp-form-err" class="form-error hidden"></div>' +
            '<div class="modal-footer"><button type="submit" class="btn btn-primary">' + (isEdit ? 'حفظ التعديلات والصلاحيات' : 'إنشاء الحساب') + '</button></div>' +
          '</form>' +
        '</div>';

      var roleSelect = document.getElementById('ef-role');
      var presetSelect = document.getElementById('ef-preset');
      var jobInput = document.getElementById('ef-job');
      var editPresetBtn = document.getElementById('ef-preset-edit');
      var delPresetBtn = document.getElementById('ef-preset-delete');

      function captureDraft() {
        draftState.name = document.getElementById('ef-name').value;
        draftState.username = document.getElementById('ef-username').value;
        draftState.phone = document.getElementById('ef-phone').value;
        draftState.email = document.getElementById('ef-email').value;
        draftState.jobTitle = jobInput.value;
        draftState.role = roleSelect.value;
        draftState.presetId = presetSelect.value;
        var perms = [];
        modalRoot.querySelectorAll('.ef-perm-checkbox:checked').forEach(function (cb) {
          if (!cb.disabled) perms.push(cb.value);
        });
        draftState.permissions = perms;
      }

      function syncPresetButtonsState() {
        var isCustom = presetSelect.value === 'custom';
        editPresetBtn.disabled = isCustom;
        delPresetBtn.disabled = isCustom;
      }

      function syncApiLockForRole(roleVal) {
        var isAgent = roleVal === 'agent';
        modalRoot.querySelectorAll('.ef-perm-checkbox').forEach(function (cb) {
          if (cb.value === 'sync_data' || cb.value === 'manage_api_connection') {
            cb.disabled = isAgent;
            if (isAgent) cb.checked = false;
          }
        });
      }

      function applyPermissionsList(perms, roleVal) {
        syncApiLockForRole(roleVal);
        modalRoot.querySelectorAll('.ef-perm-checkbox').forEach(function (cb) {
          if (cb.disabled) {
            cb.checked = false;
          } else {
            cb.checked = perms.indexOf(cb.value) !== -1;
          }
        });
      }

      function applyPresetById(presetId) {
        var found = presets.find(function (p) { return p.id === presetId; });
        if (!found) return;
        draftState.presetId = found.id;
        presetSelect.value = found.id;
        jobInput.value = found.jobTitle;
        roleSelect.value = found.role;
        applyPermissionsList(found.permissions, found.role);
        modalRoot.querySelectorAll('.ef-preset-chip').forEach(function (ch) {
          ch.classList.toggle('btn-primary', ch.getAttribute('data-preset-id') === found.id);
        });
        syncPresetButtonsState();
      }

      presetSelect.addEventListener('change', function () {
        if (presetSelect.value !== 'custom') {
          applyPresetById(presetSelect.value);
        } else {
          draftState.presetId = 'custom';
          modalRoot.querySelectorAll('.ef-preset-chip').forEach(function (ch) { ch.classList.remove('btn-primary'); });
          syncPresetButtonsState();
        }
      });

      modalRoot.querySelectorAll('.ef-preset-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          applyPresetById(chip.getAttribute('data-preset-id'));
        });
      });

      document.getElementById('ef-preset-add').addEventListener('click', function () {
        captureDraft();
        openRolePresetModal({
          id: '',
          label: '',
          jobTitle: draftState.jobTitle,
          role: draftState.role,
          permissions: draftState.permissions,
          _fromEmployeeModal: true
        }, customPermissions, ctx, function (resPreset) {
          if (resPreset && resPreset.customPermissions) customPermissions = resPreset.customPermissions;
          if (resPreset && resPreset.rolePresets) {
            presets = root.RGCrmCore.normalizeRolePresets(resPreset.rolePresets);
            if (resPreset.savedPreset) {
              draftState.presetId = resPreset.savedPreset.id;
              draftState.jobTitle = resPreset.savedPreset.jobTitle;
              draftState.role = resPreset.savedPreset.role;
              draftState.permissions = resPreset.savedPreset.permissions.slice();
            }
          }
          drawModal();
          if (onSaved && resPreset && !resPreset.cancelled) {
            // refresh underlying page smoothly on close, preserve current modal open
          }
        });
      });

      editPresetBtn.addEventListener('click', function () {
        captureDraft();
        var found = presets.find(function (p) { return p.id === presetSelect.value; });
        if (!found) return;
        openRolePresetModal(Object.assign({}, found, { _fromEmployeeModal: true }), customPermissions, ctx, function (resPreset) {
          if (resPreset && resPreset.customPermissions) customPermissions = resPreset.customPermissions;
          if (resPreset && resPreset.rolePresets) {
            presets = root.RGCrmCore.normalizeRolePresets(resPreset.rolePresets);
            if (resPreset.savedPreset) {
              draftState.presetId = resPreset.savedPreset.id;
              draftState.jobTitle = resPreset.savedPreset.jobTitle;
              draftState.role = resPreset.savedPreset.role;
              draftState.permissions = resPreset.savedPreset.permissions.slice();
            }
          }
          drawModal();
        });
      });

      delPresetBtn.addEventListener('click', async function () {
        if (presetSelect.value === 'custom') return;
        if (delPresetBtn.getAttribute('data-confirm') !== '1') {
          delPresetBtn.setAttribute('data-confirm', '1');
          delPresetBtn.textContent = 'تأكيد الحذف؟';
          setTimeout(function () {
            if (document.body.contains(delPresetBtn)) {
              delPresetBtn.setAttribute('data-confirm', '0');
              delPresetBtn.textContent = 'حذف المحدد';
            }
          }, 3500);
          return;
        }
        captureDraft();
        var resp = await root.RGApi.callApi('deleteRolePreset', { presetId: presetSelect.value });
        if (!resp.success) {
          ctx.toast(resp.message, true);
          return;
        }
        presets = root.RGCrmCore.normalizeRolePresets(resp.data.rolePresets);
        draftState.presetId = 'custom';
        ctx.toast(resp.message || 'تم حذف الصلاحية الجاهزة.');
        drawModal();
      });

      document.getElementById('ef-manage-perms-btn').addEventListener('click', function () {
        captureDraft();
        openPermissionsCatalogModal(customPermissions, ctx, function (resCat) {
          if (resCat && resCat.customPermissions) customPermissions = resCat.customPermissions;
          drawModal();
        });
      });

      roleSelect.addEventListener('change', function () {
        var r = roleSelect.value;
        presetSelect.value = 'custom';
        draftState.presetId = 'custom';
        syncPresetButtonsState();
        applyPermissionsList(root.RGCrmCore.resolveEffectivePermissions(r), r);
      });

      document.getElementById('ef-perm-defaults').addEventListener('click', function () {
        var r = roleSelect.value;
        presetSelect.value = 'custom';
        draftState.presetId = 'custom';
        syncPresetButtonsState();
        applyPermissionsList(root.RGCrmCore.resolveEffectivePermissions(r), r);
      });

      document.getElementById('ef-perm-all').addEventListener('click', function () {
        presetSelect.value = 'custom';
        draftState.presetId = 'custom';
        syncPresetButtonsState();
        var r = roleSelect.value;
        syncApiLockForRole(r);
        modalRoot.querySelectorAll('.ef-perm-checkbox').forEach(function (cb) {
          if (!cb.disabled) cb.checked = true;
        });
      });

      modalRoot.querySelectorAll('.ef-perm-checkbox').forEach(function (cb) {
        cb.addEventListener('change', function () {
          presetSelect.value = 'custom';
          draftState.presetId = 'custom';
          syncPresetButtonsState();
        });
      });

      document.getElementById('emp-cancel').addEventListener('click', function () {
        modalRoot.innerHTML = '';
        if (onSaved) onSaved();
      });

      document.getElementById('emp-form').addEventListener('submit', async function (ev) {
        ev.preventDefault();
        var errEl = document.getElementById('emp-form-err');
        errEl.classList.add('hidden');

        var selectedPerms = [];
        modalRoot.querySelectorAll('.ef-perm-checkbox:checked').forEach(function (cb) {
          if (!cb.disabled) selectedPerms.push(cb.value);
        });

        var payload = {
          name: document.getElementById('ef-name').value,
          username: document.getElementById('ef-username').value,
          phone: document.getElementById('ef-phone').value,
          email: document.getElementById('ef-email').value,
          jobTitle: document.getElementById('ef-job').value,
          role: document.getElementById('ef-role').value,
          permissions: selectedPerms
        };
        var pwd = document.getElementById('ef-pass').value;
        if (isEdit) {
          payload.employeeId = existing.id;
          if (pwd) payload.newPassword = pwd;
        } else {
          payload.password = pwd;
        }

        var res = await root.RGApi.callApi(isEdit ? 'updateEmployee' : 'createEmployee', payload);
        if (!res.success) {
          errEl.textContent = res.message;
          errEl.classList.remove('hidden');
          return;
        }
        ctx.toast(isEdit ? 'تم تحديث بيانات وصلاحيات الموظف.' : 'تم إنشاء حساب الموظف بالصلاحيات المحددة بنجاح.');
        modalRoot.innerHTML = '';
        if (onSaved) onSaved();
      });
    }

    drawModal();
  }

  root.RGEmployees = {
    render: render,
    openEmployeeDetailsDrawer: openEmployeeDetailsDrawer
  };
})(window);
