/**
 * RENTAL GATE CRM — Dashboard KPIs & 7 Chart.js Visualizations
 */
(function (root) {
  'use strict';

  var chartInstances = {};

  function destroyCharts() {
    Object.keys(chartInstances).forEach(function (k) {
      if (chartInstances[k]) {
        chartInstances[k].destroy();
        delete chartInstances[k];
      }
    });
  }

  function themeColors() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: isDark ? '#cfd1d3' : '#313232',
      grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(49, 50, 50, 0.07)',
      primary: isDark ? '#e0343a' : '#d32228',
      secondary: isDark ? '#e4e4e7' : '#313232',
      palette: ['#d32228', '#313232', '#157347', '#d97706', '#2563eb', '#6b7280', '#991b1b']
    };
  }

  function buildChart(canvasId, config) {
    var el = document.getElementById(canvasId);
    if (!el || !root.Chart) return;
    if (chartInstances[canvasId]) {
      chartInstances[canvasId].destroy();
    }
    chartInstances[canvasId] = new root.Chart(el.getContext('2d'), config);
  }

  function renderCharts(chartsData, t) {
    if (!root.Chart) return;
    var c = themeColors();
    var baseOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: c.text, font: { family: "'IBM Plex Sans Arabic', sans-serif", size: 12 } } }
      }
    };

    var stDist = chartsData.statusDistribution || {};
    buildChart('chart-status-dist', {
      type: 'doughnut',
      data: {
        labels: Object.keys(stDist),
        datasets: [{ data: Object.values(stDist), backgroundColor: c.palette, borderWidth: 1 }]
      },
      options: baseOpts
    });

    var empPerf = chartsData.employeePerformance || {};
    buildChart('chart-emp-perf', {
      type: 'bar',
      data: {
        labels: Object.keys(empPerf),
        datasets: [{ label: t('followups_count'), data: Object.values(empPerf), backgroundColor: c.primary, borderRadius: 6 }]
      },
      options: Object.assign({}, baseOpts, {
        scales: {
          x: { ticks: { color: c.text }, grid: { display: false } },
          y: { ticks: { color: c.text, precision: 0 }, grid: { color: c.grid }, beginAtZero: true }
        }
      })
    });

    var daily = chartsData.dailyFollowUps || {};
    var dailyKeys = Object.keys(daily).sort();
    buildChart('chart-daily-followups', {
      type: 'line',
      data: {
        labels: dailyKeys,
        datasets: [{
          label: t('daily_followups'),
          data: dailyKeys.map(function (k) { return daily[k]; }),
          borderColor: c.primary,
          backgroundColor: 'rgba(211, 34, 40, 0.08)',
          fill: true,
          tension: 0.25
        }]
      },
      options: Object.assign({}, baseOpts, {
        scales: {
          x: { ticks: { color: c.text }, grid: { color: c.grid } },
          y: { ticks: { color: c.text, precision: 0 }, grid: { color: c.grid }, beginAtZero: true }
        }
      })
    });

    var prbPrio = chartsData.problemsByPriority || {};
    buildChart('chart-problems-priority', {
      type: 'bar',
      data: {
        labels: Object.keys(prbPrio),
        datasets: [{
          label: t('problems'),
          data: Object.values(prbPrio),
          backgroundColor: ['#64748b', '#d97706', '#dc2626'],
          borderRadius: 4
        }]
      },
      options: Object.assign({}, baseOpts, {
        scales: {
          x: { ticks: { color: c.text }, grid: { display: false } },
          y: { ticks: { color: c.text, precision: 0 }, grid: { color: c.grid }, beginAtZero: true }
        }
      })
    });

    var openClosed = chartsData.problemsOpenVsClosed || { open: 0, closed: 0 };
    buildChart('chart-problems-open-closed', {
      type: 'pie',
      data: {
        labels: [t('open_problems'), t('closed_problems')],
        datasets: [{ data: [openClosed.open || 0, openClosed.closed || 0], backgroundColor: ['#dc2626', '#16a34a'] }]
      },
      options: baseOpts
    });

    var byCompany = chartsData.reservationsByCompany || {};
    buildChart('chart-res-company', {
      type: 'bar',
      data: {
        labels: Object.keys(byCompany),
        datasets: [{ label: t('reservations'), data: Object.values(byCompany), backgroundColor: c.primary, borderRadius: 4 }]
      },
      options: Object.assign({}, baseOpts, {
        indexAxis: 'y',
        scales: {
          x: { ticks: { color: c.text, precision: 0 }, grid: { color: c.grid }, beginAtZero: true },
          y: { ticks: { color: c.text }, grid: { display: false } }
        }
      })
    });

    var comp = chartsData.employeeComparison || [];
    buildChart('chart-emp-comparison', {
      type: 'bar',
      data: {
        labels: comp.map(function (x) { return x.name; }),
        datasets: [
          { label: t('assigned_reservations'), data: comp.map(function (x) { return x.assigned; }), backgroundColor: c.primary, borderRadius: 4 },
          { label: t('followups_count'), data: comp.map(function (x) { return x.followUps; }), backgroundColor: c.secondary, borderRadius: 4 }
        ]
      },
      options: Object.assign({}, baseOpts, {
        scales: {
          x: { ticks: { color: c.text }, grid: { display: false } },
          y: { ticks: { color: c.text, precision: 0 }, grid: { color: c.grid }, beginAtZero: true }
        }
      })
    });
  }

  async function render(container, ctx) {
    var t = ctx.t;
    var state = ctx.state.dashboard || { range: '30d', dateFrom: '', dateTo: '' };
    ctx.state.dashboard = state;

    container.innerHTML =
      '<div class="dashboard-filter-bar flex items-center justify-between flex-wrap gap-3">' +
        '<div class="segmented-control" role="tablist" aria-label="' + t('time_filter') + '">' +
          ['today', '7d', '30d', 'month', 'custom'].map(function (r) {
            var active = state.range === r ? ' active' : '';
            return '<button type="button" class="segmented-btn' + active + '" data-range="' + r + '">' + t('range_' + r) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="toolbar-row" id="dash-custom-dates" style="margin-bottom:0;' + (state.range === 'custom' ? '' : 'display:none;') + '">' +
          '<input type="date" class="input" id="dash-date-from" value="' + (state.dateFrom || '') + '" style="width:auto;" aria-label="' + t('from_date') + '">' +
          '<input type="date" class="input" id="dash-date-to" value="' + (state.dateTo || '') + '" style="width:auto;" aria-label="' + t('to_date') + '">' +
          '<button type="button" class="btn btn-primary btn-sm" id="dash-apply-custom">' + t('apply') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="kpi-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" id="dash-kpis"></div>' +
      '<div class="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-4">' +
        '<section class="chart-card"><h3 class="chart-card-title">' + t('chart_status_dist') + '</h3><div class="chart-canvas-wrap"><canvas id="chart-status-dist"></canvas></div></section>' +
        '<section class="chart-card"><h3 class="chart-card-title">' + t('chart_emp_perf') + '</h3><div class="chart-canvas-wrap"><canvas id="chart-emp-perf"></canvas></div></section>' +
        '<section class="chart-card lg:col-span-2"><h3 class="chart-card-title">' + t('chart_daily_fu') + '</h3><div class="chart-canvas-wrap"><canvas id="chart-daily-followups"></canvas></div></section>' +
        '<section class="chart-card"><h3 class="chart-card-title">' + t('chart_prb_prio') + '</h3><div class="chart-canvas-wrap"><canvas id="chart-problems-priority"></canvas></div></section>' +
        '<section class="chart-card"><h3 class="chart-card-title">' + t('chart_prb_open_closed') + '</h3><div class="chart-canvas-wrap"><canvas id="chart-problems-open-closed"></canvas></div></section>' +
        '<section class="chart-card"><h3 class="chart-card-title">' + t('chart_res_company') + '</h3><div class="chart-canvas-wrap"><canvas id="chart-res-company"></canvas></div></section>' +
        '<section class="chart-card"><h3 class="chart-card-title">' + t('chart_emp_comp') + '</h3><div class="chart-canvas-wrap"><canvas id="chart-emp-comparison"></canvas></div></section>' +
      '</div>';

    container.querySelectorAll('[data-range]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.range = btn.getAttribute('data-range');
        render(container, ctx);
      });
    });

    var applyBtn = document.getElementById('dash-apply-custom');
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        state.dateFrom = document.getElementById('dash-date-from').value;
        state.dateTo = document.getElementById('dash-date-to').value;
        render(container, ctx);
      });
    }

    var res = await root.RGApi.callApi('getDashboard', {
      range: state.range,
      dateFrom: state.dateFrom,
      dateTo: state.dateTo
    });

    if (!res.success) {
      document.getElementById('dash-kpis').innerHTML = '<div class="form-error">' + res.message + '</div>';
      return;
    }

    var k = res.data.kpis || {};
    var kpiDefs = [
      { key: 'totalReservations', label: t('kpi_total'), cls: 'border-t-2 border-t-[#d32228]', route: 'reservations', status: '' },
      { key: 'todayReservations', label: t('kpi_today'), cls: '', route: 'reservations', status: '' },
      { key: 'newReservations', label: t('kpi_new'), cls: '', route: 'reservations', status: 'تم الإنشاء' },
      { key: 'booked', label: 'تم الحجز', cls: 'kpi-success', route: 'reservations', status: 'تم الحجز' },
      { key: 'delivered', label: 'تم التسليم', cls: 'kpi-success', route: 'reservations', status: 'تم التسليم' },
      { key: 'received', label: 'تم الاستلام', cls: 'kpi-success', route: 'reservations', status: 'تم الاستلام' },
      { key: 'created', label: 'تم الإنشاء', cls: '', route: 'reservations', status: 'تم الإنشاء' },
      { key: 'cancelled', label: 'تم الإلغاء', cls: 'kpi-warning', route: 'reservations', status: 'تم الإلغاء' },
      { key: 'extended', label: 'تم التمديد', cls: '', route: 'reservations', status: 'تم التمديد' },
      { key: 'notBooked', label: 'لم يتم الحجز', cls: 'kpi-warning', route: 'reservations', status: 'لم يتم الحجز' },
      { key: 'openProblems', label: t('kpi_open_problems'), cls: 'kpi-danger', route: 'problems', status: '' },
      { key: 'highProblems', label: t('kpi_high_problems'), cls: 'kpi-danger', route: 'problems', status: '' },
      { key: 'todayFollowUps', label: t('kpi_today_followups'), cls: '', route: 'team-followups', status: '' }
    ];

    document.getElementById('dash-kpis').innerHTML = kpiDefs.map(function (item) {
      return (
        '<button type="button" class="kpi-card text-start cursor-pointer hover:border-[#d32228] transition-all duration-150 ' + item.cls + '" data-kpi-route="' + item.route + '" data-kpi-status="' + item.status + '">' +
          '<span class="kpi-label">' + item.label + '</span>' +
          '<span class="kpi-value tabular-nums">' + Number(k[item.key] || 0) + '</span>' +
        '</button>'
      );
    }).join('');

    document.querySelectorAll('[data-kpi-route]').forEach(function (cardBtn) {
      cardBtn.addEventListener('click', function () {
        var rTarget = cardBtn.getAttribute('data-kpi-route');
        var stFilter = cardBtn.getAttribute('data-kpi-status');
        if (rTarget === 'reservations') {
          ctx.state.reservations = Object.assign(ctx.state.reservations || {}, { status: stFilter || '', page: 1 });
        }
        var navBtn = document.querySelector('.nav-item[data-route="' + rTarget + '"]');
        if (navBtn) navBtn.click();
      });
    });

    ctx.state.lastDashboardCharts = res.data.charts;
    renderCharts(res.data.charts || {}, t);
  }

  root.RGDashboard = {
    render: render,
    destroyCharts: destroyCharts
  };
})(window);
