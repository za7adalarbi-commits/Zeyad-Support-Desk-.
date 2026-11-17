/**
 * RENTAL GATE CRM — Main Application Controller, Routing, i18n, Theme & Notifications
 */
(function (root) {
  'use strict';

  var PREFS_KEY = 'rg_crm_user_prefs';
  var state = {
    route: 'dashboard',
    prefs: Object.assign({ lang: 'ar', theme: 'light', sidebarCollapsed: false }, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')),
    notifications: { items: [], unreadCount: 0 }
  };

  var I18N = {
    ar: {
      brand: 'RENTAL GATE CRM',
      nav_dashboard: 'لوحة التحكم',
      nav_reservations: 'الحجوزات',
      nav_my_followups: 'متابعاتي',
      nav_team_followups: 'متابعات الفريق',
      nav_problems: 'المشكلات',
      nav_reports: 'التقارير والإحصائيات',
      nav_employees: 'الموظفون',
      nav_activity: 'سجل النشاطات',
      nav_settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      theme_dark: 'الوضع الليلي',
      theme_light: 'الوضع النهاري',
      lang_toggle: 'EN',
      time_filter: 'الفلتر الزمني',
      range_today: 'اليوم',
      range_7d: 'آخر 7 أيام',
      range_30d: 'آخر 30 يومًا',
      range_month: 'هذا الشهر',
      range_custom: 'نطاق مخصص',
      from_date: 'من تاريخ',
      to_date: 'إلى تاريخ',
      apply: 'تطبيق',
      kpi_total: 'إجمالي الحجوزات',
      kpi_today: 'حجوزات اليوم',
      kpi_new: 'الحجوزات الجديدة',
      kpi_open_problems: 'المشكلات المفتوحة',
      kpi_high_problems: 'المشكلات المرتفعة',
      kpi_today_followups: 'المتابعات اليوم',
      chart_status_dist: 'توزيع الحجوزات حسب الحالة',
      chart_emp_perf: 'أداء الموظفين (المتابعات)',
      chart_daily_fu: 'المتابعات اليومية',
      chart_prb_prio: 'المشكلات حسب الأولوية',
      chart_prb_open_closed: 'المشكلات المفتوحة والمغلقة',
      chart_res_company: 'الحجوزات حسب الشركات',
      chart_emp_comp: 'مقارنة نشاط الموظفين',
      followups_count: 'عدد المتابعات',
      daily_followups: 'المتابعات اليومية',
      problems: 'المشكلات',
      open_problems: 'مفتوحة',
      closed_problems: 'مغلقة / تم الحل',
      reservations: 'الحجوزات',
      assigned_reservations: 'الحجوزات المسندة',
      toggle_columns: 'إظهار / إخفاء الأعمدة',
      pull_reservations: 'سحب الحجوزات',
      export_excel: 'تصدير Excel',
      search_placeholder: 'بحث برقم الحجز، العميل، الجوال، السيارة...',
      company: 'الشركة',
      branch: 'الفرع',
      status: 'الحالة',
      employee: 'الموظف',
      priority: 'الأولوية',
      all_companies: 'جميع الشركات',
      all_branches: 'جميع الفروع',
      all_statuses: 'جميع الحالات',
      all_employees: 'جميع الموظفين',
      all_priorities: 'جميع الأولويات',
      unfollowed_only: 'الحجوزات غير المتابعة',
      has_problems_only: 'الحجوزات التي تحتوي على مشكلات',
      reset_filters: 'إعادة ضبط',
      reports_subtitle: 'إعداد وتصدير تقارير Excel وPDF الاحترافية بدعم العربية RTL',
      export_settings_btn: 'إعدادات التصدير (Excel / PDF)',
      generate_report: 'تحديث التقرير'
    },
    en: {
      brand: 'RENTAL GATE CRM',
      nav_dashboard: 'Dashboard',
      nav_reservations: 'Reservations',
      nav_my_followups: 'My Follow-Ups',
      nav_team_followups: 'Team Follow-Ups',
      nav_problems: 'Problems',
      nav_reports: 'Reports & Export',
      nav_employees: 'Employees',
      nav_activity: 'Activity Log',
      nav_settings: 'Settings & Sync',
      logout: 'Sign Out',
      theme_dark: 'Dark Mode',
      theme_light: 'Light Mode',
      lang_toggle: 'عربي',
      time_filter: 'Time Range',
      range_today: 'Today',
      range_7d: 'Last 7 Days',
      range_30d: 'Last 30 Days',
      range_month: 'This Month',
      range_custom: 'Custom',
      from_date: 'From',
      to_date: 'To',
      apply: 'Apply',
      kpi_total: 'Total Reservations',
      kpi_today: "Today's Reservations",
      kpi_new: 'New Reservations',
      kpi_open_problems: 'Open Problems',
      kpi_high_problems: 'High-Priority Problems',
      kpi_today_followups: "Today's Follow-Ups",
      chart_status_dist: 'Reservations by Status',
      chart_emp_perf: 'Employee Performance',
      chart_daily_fu: 'Daily Follow-Ups',
      chart_prb_prio: 'Problems by Priority',
      chart_prb_open_closed: 'Open vs Closed Problems',
      chart_res_company: 'Reservations by Company',
      chart_emp_comp: 'Employee Activity Comparison',
      followups_count: 'Follow-Ups',
      daily_followups: 'Daily Follow-Ups',
      problems: 'Problems',
      open_problems: 'Open',
      closed_problems: 'Closed / Resolved',
      reservations: 'Reservations',
      assigned_reservations: 'Assigned Reservations',
      toggle_columns: 'Columns',
      pull_reservations: 'Pull Reservations',
      export_excel: 'Export Excel',
      search_placeholder: 'Search reservation #, customer, phone, car...',
      company: 'Company',
      branch: 'Branch',
      status: 'Status',
      employee: 'Employee',
      priority: 'Priority',
      all_companies: 'All Companies',
      all_branches: 'All Branches',
      all_statuses: 'All Statuses',
      all_employees: 'All Employees',
      all_priorities: 'All Priorities',
      unfollowed_only: 'Unfollowed Only',
      has_problems_only: 'With Problems Only',
      reset_filters: 'Reset Filters',
      reports_subtitle: 'Configure and export formatted Excel & RTL Arabic PDF reports',
      export_settings_btn: 'Export Settings (Excel / PDF)',
      generate_report: 'Refresh Report'
    }
  };

  function t(key) {
    var dict = I18N[state.prefs.lang] || I18N.ar;
    return dict[key] || key;
  }

  function savePrefs() {
    localStorage.setItem(PREFS_KEY, JSON.stringify(state.prefs));
  }

  function applyThemeAndLang() {
    var html = document.documentElement;
    html.setAttribute('lang', state.prefs.lang === 'en' ? 'en' : 'ar');
    html.setAttribute('dir', state.prefs.lang === 'en' ? 'ltr' : 'rtl');
    html.setAttribute('data-theme', state.prefs.theme === 'dark' ? 'dark' : 'light');
    if (state.prefs.theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
  }

  function toast(message, isError) {
    var stack = document.getElementById('toast-stack');
    if (!stack) return;
    while (stack.children.length >= 2) {
      stack.removeChild(stack.firstChild);
    }
    var el = document.createElement('div');
    el.className = 'toast-item';
    if (isError) {
      el.style.borderColor = 'var(--status-danger-text)';
      el.style.color = 'var(--status-danger-text)';
    }
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2600);
  }

  async function refreshNotifications() {
    if (!root.RGAuth.getUser()) return;
    var res = await root.RGApi.callApi('getNotifications', {});
    if (res.success && res.data) {
      state.notifications = res.data;
      var badge = document.getElementById('notif-badge');
      if (badge) {
        var count = res.data.unreadCount || 0;
        badge.textContent = String(count);
        badge.classList.toggle('hidden', count === 0);
      }
    }
  }

  function toggleNotificationsPopover() {
    var existing = document.getElementById('notif-popover');
    if (existing) {
      existing.remove();
      return;
    }
    var pop = document.createElement('div');
    pop.id = 'notif-popover';
    pop.className = 'notif-popover';
    var items = state.notifications.items || [];
    pop.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<strong>الإشعارات (' + (state.notifications.unreadCount || 0) + ')</strong>' +
        '<button type="button" class="btn btn-sm" id="notif-mark-all">تحديد الكل كمقروء</button>' +
      '</div>' +
      (items.length === 0
        ? '<div class="empty-state" style="padding:20px;">لا توجد إشعارات حاليًا.</div>'
        : items.map(function (n) {
            return '<button type="button" class="notif-item' + (n.isRead ? '' : ' unread') + '" data-nid="' + n.id + '" style="text-align:start;font-family:inherit;">' +
              '<strong>' + n.title + '</strong>' +
              '<span style="font-size:12.5px;color:var(--text-secondary);">' + n.message + '</span>' +
              '<span class="mono" style="font-size:11px;color:var(--text-muted);">' + String(n.createdAt).replace('T', ' ').substring(0, 16) + '</span>' +
            '</button>';
          }).join(''));

    document.body.appendChild(pop);

    document.getElementById('notif-mark-all').addEventListener('click', async function () {
      await root.RGApi.callApi('markNotificationRead', { markAll: true });
      await refreshNotifications();
      pop.remove();
    });

    pop.querySelectorAll('[data-nid]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        await root.RGApi.callApi('markNotificationRead', { notificationId: btn.getAttribute('data-nid') });
        await refreshNotifications();
        pop.remove();
      });
    });
  }

  async function renderActivityLog(container, ctx) {
    var res = await root.RGApi.callApi('getActivityLogs', {});
    if (!res.success) {
      container.innerHTML = '<div class="form-error">' + res.message + '</div>';
      return;
    }
    var items = res.data.items || [];
    container.innerHTML =
      '<div class="surface-card">' +
        '<div class="section-header"><div><h2 class="section-title">' + ctx.t('nav_activity') + '</h2><p class="section-subtitle">سجل غير قابل للتعديل أو الحذف لجميع عمليات النظام.</p></div></div>' +
        (items.length === 0
          ? '<div class="empty-state">لا توجد نشاطات مسجلة.</div>'
          : '<div class="table-wrap"><table class="data-table"><thead><tr>' +
              '<th>المستخدم</th><th>نوع العملية</th><th>العنصر المرتبط</th><th>التفاصيل</th><th>التاريخ</th><th>الوقت</th>' +
            '</tr></thead><tbody>' +
              items.map(function (l) {
                return '<tr>' +
                  '<td><strong>' + l.userName + '</strong></td>' +
                  '<td><span class="status-tag status-info">' + l.actionType + '</span></td>' +
                  '<td class="mono">' + (l.entityType ? l.entityType + ': ' + l.entityId : '-') + '</td>' +
                  '<td>' + (l.details || '-') + '</td>' +
                  '<td class="mono">' + l.logDate + '</td>' +
                  '<td class="mono">' + l.logTime + '</td>' +
                '</tr>';
              }).join('') +
            '</tbody></table></div>') +
      '</div>';
  }

  function renderLoginScreen() {
    var appRoot = document.getElementById('app-root');
    var isLive = root.RGApi.isLiveMode();

    appRoot.innerHTML =
      '<main class="auth-screen">' +
        '<section class="auth-shell">' +
          '<div class="auth-brand-panel">' +
            '<div class="auth-brand-top">' +
              '<img src="./assets/images/logo.png" alt="Rental Gate Logo" class="auth-logo">' +
              '<div><h1 class="auth-brand-title">RENTAL GATE CRM</h1><p class="auth-brand-sub">نظام إدارة خدمة العملاء والحجوزات</p></div>' +
            '</div>' +
            '<p class="auth-summary">منصة متكاملة لإدارة حجوزات Rental Gate، متابعات الموظفين المتعددة، المشكلات ذات الأولوية، والتقارير الاحترافية عبر Google Sheets وGoogle Apps Script.</p>' +
            '<ul class="auth-highlights">' +
              '<li>سحب الحجوزات والتمديدات المعتمدة من Rental Gate API بأمان</li>' +
              '<li>متابعات مستقلة لكل موظف دون استبدال أو تعارض كتابة</li>' +
              '<li>إشعارات فورية للمشكلات مرتفعة الأولوية وسجل نشاطات موثق</li>' +
            '</ul>' +
          '</div>' +
          '<div class="auth-form-panel">' +
            '<div class="auth-form-header">' +
              '<div><h2>تسجيل الدخول</h2><p>أدخل بيانات حسابك الوظيفي للمتابعة</p></div>' +
              '<div class="auth-toolbar-mini">' +
                '<button type="button" class="btn btn-sm" id="login-theme-btn">' + (state.prefs.theme === 'dark' ? t('theme_light') : t('theme_dark')) + '</button>' +
                '<button type="button" class="btn btn-sm" id="login-lang-btn">' + t('lang_toggle') + '</button>' +
              '</div>' +
            '</div>' +
            '<form id="login-form" style="display:flex;flex-direction:column;gap:14px;">' +
              '<div class="form-group"><label class="form-label" for="login-username">اسم المستخدم</label><input class="input mono" id="login-username" autocomplete="username" required></div>' +
              '<div class="form-group"><label class="form-label" for="login-password">كلمة المرور</label><input class="input" type="password" id="login-password" autocomplete="current-password" required></div>' +
              '<div id="login-error" class="form-error hidden"></div>' +
              '<button type="submit" class="btn btn-primary" id="login-submit-btn">دخول إلى النظام</button>' +
            '</form>' +
            '<div class="auth-mode-box">' +
              '<div><strong>وضع التشغيل:</strong> ' + (isLive ? 'متصل بـ Google Apps Script' : 'معاينة محلية (Sandbox)') + '</div>' +
              (!isLive ? (
                '<div class="auth-demo-quick">' +
                  '<button type="button" class="btn btn-sm demo-fill-btn" data-u="admin" data-p="Admin@123">حساب المدير (admin)</button>' +
                  '<button type="button" class="btn btn-sm demo-fill-btn" data-u="supervisor" data-p="Super@123">حساب المشرف (supervisor)</button>' +
                  '<button type="button" class="btn btn-sm demo-fill-btn" data-u="agent1" data-p="Agent@123">حساب موظف (agent1)</button>' +
                '</div>'
              ) : '') +
              '<details style="margin-top:8px;">' +
                '<summary style="cursor:pointer;font-size:12px;color:var(--text-muted);font-weight:600;">إعداد ربط الخادم (للمدير والمشرف)</summary>' +
                '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;">' +
                  '<input class="input mono" id="login-gas-url" placeholder="رابط Google Apps Script /exec" value="' + root.RGApi.getGasUrl() + '" style="min-height:32px;font-size:12px;">' +
                  '<button type="button" class="btn btn-sm" id="login-save-gas">ربط</button>' +
                '</div>' +
              '</details>' +
            '</div>' +
          '</div>' +
        '</section>' +
      '</main>';

    document.getElementById('login-theme-btn').addEventListener('click', function () {
      state.prefs.theme = state.prefs.theme === 'dark' ? 'light' : 'dark';
      savePrefs();
      applyThemeAndLang();
      renderLoginScreen();
    });

    document.getElementById('login-lang-btn').addEventListener('click', function () {
      state.prefs.lang = state.prefs.lang === 'ar' ? 'en' : 'ar';
      savePrefs();
      applyThemeAndLang();
      renderLoginScreen();
    });

    document.querySelectorAll('.demo-fill-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.getElementById('login-username').value = btn.getAttribute('data-u');
        document.getElementById('login-password').value = btn.getAttribute('data-p');
      });
    });

    document.getElementById('login-save-gas').addEventListener('click', function () {
      var u = document.getElementById('login-gas-url').value.trim();
      root.RGApi.setGasUrl(u);
      toast(u ? 'تم حفظ رابط Apps Script الفعلي.' : 'تم التبديل لوضع المعاينة.');
      renderLoginScreen();
    });

    document.getElementById('login-form').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var errEl = document.getElementById('login-error');
      errEl.classList.add('hidden');
      var submitBtn = document.getElementById('login-submit-btn');
      submitBtn.disabled = true;

      var u = document.getElementById('login-username').value;
      var p = document.getElementById('login-password').value;
      var res = await root.RGAuth.login(u, p);
      submitBtn.disabled = false;

      if (!res.success) {
        errEl.textContent = res.message;
        errEl.classList.remove('hidden');
        return;
      }
      await bootAuthenticatedApp();
    });
  }

  var NAV_ITEMS = [
    { id: 'dashboard', key: 'nav_dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
    { id: 'reservations', key: 'nav_reservations', icon: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14v11z' },
    { id: 'my-followups', key: 'nav_my_followups', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
    { id: 'team-followups', key: 'nav_team_followups', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    { id: 'problems', key: 'nav_problems', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01' },
    { id: 'reports', key: 'nav_reports', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
    { id: 'employees', key: 'nav_employees', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
    { id: 'activity', key: 'nav_activity', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    { id: 'settings', key: 'nav_settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' }
  ];

  function renderIcon(pathData) {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + pathData + '"/></svg>';
  }

  async function renderRoute() {
    var container = document.getElementById('page-content');
    var heading = document.getElementById('page-heading');
    if (!container) return;

    var curUser = root.RGAuth.getUser();
    if (state.route === 'settings' && (!curUser || (!root.RGCrmCore.canAccessApi(curUser) && !root.RGCrmCore.canUserPerform(curUser, 'manage_settings')))) {
      state.route = 'dashboard';
    }

    root.RGDashboard.destroyCharts();
    var navItem = NAV_ITEMS.find(function (n) { return n.id === state.route; }) || NAV_ITEMS[0];
    if (heading) heading.textContent = t(navItem.key);

    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-route') === state.route);
    });

    var ctx = {
      t: t,
      lang: state.prefs.lang,
      state: state,
      toast: toast,
      refreshNotifications: refreshNotifications,
      onAuthChanged: bootAuthenticatedApp
    };

    switch (state.route) {
      case 'dashboard':
        await root.RGDashboard.render(container, ctx);
        break;
      case 'reservations':
        await root.RGReservations.render(container, ctx);
        break;
      case 'my-followups':
        await root.RGFollowUps.renderMyFollowUps(container, ctx);
        break;
      case 'team-followups':
        await root.RGFollowUps.renderTeamFollowUps(container, ctx);
        break;
      case 'problems':
        await root.RGProblems.render(container, ctx);
        break;
      case 'reports':
        await root.RGReports.render(container, ctx);
        break;
      case 'employees':
        await root.RGEmployees.render(container, ctx);
        break;
      case 'activity':
        await renderActivityLog(container, ctx);
        break;
      case 'settings': {
        var curUser = root.RGAuth.getUser();
        if (!curUser || (!root.RGCrmCore.canAccessApi(curUser) && !root.RGCrmCore.canUserPerform(curUser, 'manage_settings'))) {
          state.route = 'dashboard';
          await root.RGDashboard.render(container, ctx);
          break;
        }
        await root.RGSettings.render(container, ctx);
        break;
      }
      default:
        await root.RGDashboard.render(container, ctx);
    }
  }

  function renderAppShell(user) {
    var appRoot = document.getElementById('app-root');
    var roleLabels = root.RGCrmCore.ROLE_LABELS[state.prefs.lang] || root.RGCrmCore.ROLE_LABELS.ar;
    var collapsedClass = state.prefs.sidebarCollapsed ? ' collapsed w-[76px]' : ' w-64';

    appRoot.innerHTML =
      '<div class="app-shell flex min-h-screen bg-[#f7f7f8] dark:bg-[#141516] text-[#313232] dark:text-zinc-100">' +
        '<div class="sidebar-overlay" id="sidebar-overlay"></div>' +
        '<aside class="sidebar' + collapsedClass + ' shrink-0 bg-white dark:bg-[#1d1e20] text-[#313232] dark:text-zinc-100 border-e border-[#e6e7e8] dark:border-[#2f3134] border-t-[3px] border-t-[#d32228] flex flex-col sticky top-0 h-screen z-30 transition-all duration-200" id="app-sidebar" aria-label="القائمة الرئيسية">' +
          '<div class="sidebar-brand h-16 px-4 flex items-center justify-between border-b border-[#e6e7e8] dark:border-[#2f3134] gap-2.5">' +
            '<a href="#dashboard" class="sidebar-brand-link flex items-center gap-2.5 min-w-0 text-[#313232] dark:text-white no-underline" id="brand-home-link">' +
              '<img src="./assets/images/logo.png" alt="Rental Gate" class="w-9 h-9 rounded-lg object-cover bg-white border border-[#e6e7e8] dark:border-[#2f3134] p-0.5 shrink-0">' +
              '<div class="sidebar-brand-text min-w-0 leading-tight">' +
                '<div class="text-[13.5px] font-bold tracking-tight truncate">RENTAL GATE</div>' +
                '<div class="text-[10px] font-bold tracking-wider text-[#d32228] uppercase">SUPPORT CRM</div>' +
              '</div>' +
            '</a>' +
            '<button type="button" class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#f7f7f8] dark:bg-[#252729] hover:bg-[#fdf0f0] dark:hover:bg-[#d32228]/20 text-[#555757] dark:text-zinc-300 hover:text-[#d32228] border border-[#e6e7e8] dark:border-[#2f3134] cursor-pointer transition-colors shrink-0" id="sidebar-collapse-btn" aria-label="طي القائمة" title="طي / توسيع القائمة">' +
              renderIcon('M4 6h16M4 12h16M4 18h16') +
            '</button>' +
          '</div>' +
          '<nav class="sidebar-nav flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-1">' +
            NAV_ITEMS.map(function (item) {
              if (item.id === 'employees' && !root.RGCrmCore.canUserPerform(user, 'view_employees') && user.role === 'agent') {
                return '';
              }
              if (item.id === 'settings' && !root.RGCrmCore.canAccessApi(user) && !root.RGCrmCore.canUserPerform(user, 'manage_settings')) {
                return '';
              }
              return '<button type="button" class="nav-item" data-route="' + item.id + '" title="' + t(item.key) + '">' +
                '<span class="nav-icon">' + renderIcon(item.icon) + '</span>' +
                '<span class="nav-label">' + t(item.key) + '</span>' +
              '</button>';
            }).join('') +
          '</nav>' +
          '<div class="sidebar-footer p-3 border-t border-[#e6e7e8] dark:border-[#2f3134]">' +
            '<div class="sidebar-footer-card flex items-center gap-2.5 p-2 rounded-lg bg-[#f7f7f8] dark:bg-[#252729] border border-[#e6e7e8] dark:border-[#2f3134]">' +
              '<div class="w-8 h-8 rounded-md bg-[#d32228] text-white flex items-center justify-center font-bold text-xs shrink-0">' + String(user.name || 'U').charAt(0) + '</div>' +
              '<div class="sidebar-user-meta min-w-0 flex-1">' +
                '<div class="text-[12.5px] font-bold text-[#313232] dark:text-white truncate">' + user.name + '</div>' +
                '<div class="text-[11px] text-[#767878] dark:text-zinc-400 truncate">' + (roleLabels[user.role] || user.role) + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</aside>' +
        '<div class="main-column flex-1 min-w-0 flex flex-col">' +
          '<header class="topbar h-16 bg-white dark:bg-[#1d1e20] border-b border-[#e6e7e8] dark:border-[#2f3134] px-4 md:px-6 flex items-center justify-between gap-3 sticky top-0 z-20">' +
            '<div class="topbar-start flex items-center gap-3 min-w-0">' +
              '<button type="button" class="btn btn-icon mobile-menu-btn" id="mobile-menu-btn" aria-label="فتح القائمة">☰</button>' +
              '<h1 class="page-heading m-0 text-base md:text-lg font-bold text-[#313232] dark:text-white truncate" id="page-heading">' + t('nav_dashboard') + '</h1>' +
            '</div>' +
            '<div class="topbar-actions flex items-center gap-1.5 sm:gap-2 shrink-0">' +
              '<button type="button" class="btn btn-icon" id="notif-toggle-btn" aria-label="الإشعارات">' +
                renderIcon('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0') +
                '<span class="notif-count hidden" id="notif-badge">0</span>' +
              '</button>' +
              '<button type="button" class="btn btn-sm" id="theme-toggle-btn" aria-label="' + (state.prefs.theme === 'dark' ? t('theme_light') : t('theme_dark')) + '">' +
                '<span class="sm:hidden">' + renderIcon(state.prefs.theme === 'dark' ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' : 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z') + '</span>' +
                '<span class="hidden sm:inline">' + (state.prefs.theme === 'dark' ? t('theme_light') : t('theme_dark')) + '</span>' +
              '</button>' +
              '<button type="button" class="btn btn-sm" id="lang-toggle-btn">' + t('lang_toggle') + '</button>' +
              '<button type="button" class="btn btn-sm btn-danger" id="logout-btn">' +
                '<span class="sm:hidden">' + (state.prefs.lang === 'en' ? 'Exit' : 'خروج') + '</span>' +
                '<span class="hidden sm:inline">' + t('logout') + '</span>' +
              '</button>' +
            '</div>' +
          '</header>' +
          '<main class="page-content p-4 md:p-6 flex-1 flex flex-col gap-5" id="page-content"></main>' +
        '</div>' +
      '</div>';

    document.getElementById('sidebar-collapse-btn').addEventListener('click', function () {
      state.prefs.sidebarCollapsed = !state.prefs.sidebarCollapsed;
      savePrefs();
      var sb = document.getElementById('app-sidebar');
      sb.classList.toggle('collapsed', state.prefs.sidebarCollapsed);
      sb.classList.toggle('w-[76px]', state.prefs.sidebarCollapsed);
      sb.classList.toggle('w-64', !state.prefs.sidebarCollapsed);
    });

    var overlay = document.getElementById('sidebar-overlay');
    var sidebar = document.getElementById('app-sidebar');
    document.getElementById('mobile-menu-btn').addEventListener('click', function () {
      sidebar.classList.add('mobile-open');
      overlay.classList.add('active');
    });
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });

    document.querySelectorAll('.nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.route = btn.getAttribute('data-route');
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        renderRoute();
      });
    });

    document.getElementById('notif-toggle-btn').addEventListener('click', toggleNotificationsPopover);

    document.getElementById('theme-toggle-btn').addEventListener('click', function () {
      state.prefs.theme = state.prefs.theme === 'dark' ? 'light' : 'dark';
      savePrefs();
      applyThemeAndLang();
      renderAppShell(user);
      renderRoute();
    });

    document.getElementById('lang-toggle-btn').addEventListener('click', function () {
      state.prefs.lang = state.prefs.lang === 'ar' ? 'en' : 'ar';
      savePrefs();
      applyThemeAndLang();
      renderAppShell(user);
      renderRoute();
    });

    document.getElementById('logout-btn').addEventListener('click', async function () {
      state.route = 'dashboard';
      await root.RGAuth.logout();
      renderLoginScreen();
    });
  }

  async function bootAuthenticatedApp() {
    var user = await root.RGAuth.restoreSession();
    if (!user) {
      renderLoginScreen();
      return;
    }
    renderAppShell(user);
    await refreshNotifications();
    await renderRoute();
  }

  document.addEventListener('rg:unauthorized', function () {
    renderLoginScreen();
  });

  document.addEventListener('DOMContentLoaded', function () {
    applyThemeAndLang();
    bootAuthenticatedApp();
  });
})(window);
