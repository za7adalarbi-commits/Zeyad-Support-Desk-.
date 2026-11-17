/**
 * RENTAL GATE CRM — Advanced Reports, Excel (SheetJS) & Arabic RTL PDF (jsPDF + Canvas)
 */
(function (root) {
  'use strict';

  function loadLogoImage() {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = './assets/images/logo.png';
    });
  }

  function exportExcelWorkbook(sheetsConfig, filename) {
    if (!root.XLSX) {
      throw new Error('مكتبة SheetJS غير محملة.');
    }
    var wb = root.XLSX.utils.book_new();
    sheetsConfig.forEach(function (cfg) {
      var rows = cfg.rows || [];
      var headers = cfg.headers || [];
      var aoa = [headers.map(function (h) { return h.label; })];
      rows.forEach(function (r) {
        aoa.push(headers.map(function (h) {
          var v = typeof h.value === 'function' ? h.value(r) : r[h.key];
          if (Array.isArray(v)) return v.join('، ');
          return v !== undefined && v !== null ? v : '';
        }));
      });
      var ws = root.XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = headers.map(function (h) {
        return { wch: Math.max(14, Math.min(40, (h.label || '').length + 8)) };
      });
      if (aoa.length > 1) {
        var lastCol = root.XLSX.utils.encode_col(Math.max(0, headers.length - 1));
        ws['!autofilter'] = { ref: 'A1:' + lastCol + aoa.length };
      }
      ws['!views'] = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];
      root.XLSX.utils.book_append_sheet(wb, ws, (cfg.name || 'Report').substring(0, 31));
    });
    root.XLSX.writeFile(wb, filename || 'rental-gate-report.xlsx');
  }

  async function exportArabicPdfDocument(options) {
    if (!root.jspdf || !root.jspdf.jsPDF) {
      throw new Error('مكتبة jsPDF غير محملة.');
    }

    var paperSize = options.paperSize || 'a4';
    var orientation = options.orientation || 'landscape';
    var isRtl = options.dir !== 'ltr';
    var title = options.title || 'تقرير RENTAL GATE CRM';
    var exporterName = options.exporterName || '';
    var summaryItems = options.summaryItems || [];
    var columns = options.columns || [];
    var rows = options.rows || [];
    var extraSections = options.extraSections || [];
    var chartImages = options.chartImages || [];

    var doc = new root.jspdf.jsPDF({ orientation: orientation, unit: 'mm', format: paperSize });
    var pageWmm = doc.internal.pageSize.getWidth();
    var pageHmm = doc.internal.pageSize.getHeight();
    var scale = 2;
    var cw = Math.round(pageWmm * 3.78 * scale);
    var ch = Math.round(pageHmm * 3.78 * scale);
    var pad = 42 * scale;
    var logoImg = await loadLogoImage();

    var pages = [];
    function newPage() {
      var canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cw, ch);
      ctx.direction = isRtl ? 'rtl' : 'ltr';
      pages.push({ canvas: canvas, ctx: ctx, y: pad });
      return pages[pages.length - 1];
    }

    function drawHeader(p) {
      var ctx = p.ctx;
      ctx.fillStyle = '#313232';
      ctx.fillRect(0, 0, cw, 92 * scale);
      ctx.fillStyle = '#d32228';
      ctx.fillRect(0, 0, cw, 6 * scale);

      if (logoImg) {
        var lx = isRtl ? cw - pad - 56 * scale : pad;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(lx - 4, 16 * scale, 60 * scale, 60 * scale);
        ctx.drawImage(logoImg, lx, 20 * scale, 52 * scale, 52 * scale);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + (18 * scale) + 'px "IBM Plex Sans Arabic", "Segoe UI", Arial, sans-serif';
      ctx.textAlign = isRtl ? 'right' : 'left';
      var textX = isRtl ? cw - pad - 74 * scale : pad + 74 * scale;
      ctx.fillText(title, textX, 44 * scale);

      ctx.fillStyle = '#d4d6d8';
      ctx.font = (11 * scale) + 'px "IBM Plex Sans Arabic", "Segoe UI", Arial, sans-serif';
      var metaText = 'التاريخ: ' + new Date().toLocaleString('ar-SA') + (exporterName ? '  |  المصدر: ' + exporterName : '');
      ctx.fillText(metaText, textX, 68 * scale);
      p.y = 116 * scale;
    }

    function ensureSpace(p, neededHeight) {
      if (p.y + neededHeight > ch - 56 * scale) {
        var next = newPage();
        drawHeader(next);
        return next;
      }
      return p;
    }

    var page = newPage();
    drawHeader(page);

    if (summaryItems.length > 0) {
      var boxW = (cw - pad * 2 - (summaryItems.length - 1) * 12 * scale) / Math.min(summaryItems.length, 4);
      var rowCount = Math.ceil(summaryItems.length / 4);
      var idx = 0;
      for (var r = 0; r < rowCount; r++) {
        page = ensureSpace(page, 62 * scale);
        var colsInRow = Math.min(4, summaryItems.length - idx);
        var actualBoxW = (cw - pad * 2 - (colsInRow - 1) * 10 * scale) / colsInRow;
        for (var c = 0; c < colsInRow; c++) {
          var item = summaryItems[idx++];
          var bx = isRtl
            ? cw - pad - (c + 1) * actualBoxW - c * 10 * scale
            : pad + c * (actualBoxW + 10 * scale);
          page.ctx.fillStyle = '#f8fafc';
          page.ctx.strokeStyle = '#cbd5e1';
          page.ctx.lineWidth = 1 * scale;
          page.ctx.fillRect(bx, page.y, actualBoxW, 50 * scale);
          page.ctx.strokeRect(bx, page.y, actualBoxW, 50 * scale);

          page.ctx.fillStyle = '#475569';
          page.ctx.font = (10 * scale) + 'px "IBM Plex Sans Arabic", Arial, sans-serif';
          page.ctx.textAlign = isRtl ? 'right' : 'left';
          page.ctx.fillText(String(item.label), isRtl ? bx + actualBoxW - 10 * scale : bx + 10 * scale, page.y + 18 * scale);

          page.ctx.fillStyle = '#0f172a';
          page.ctx.font = 'bold ' + (14 * scale) + 'px "IBM Plex Sans Arabic", Arial, sans-serif';
          page.ctx.fillText(String(item.value), isRtl ? bx + actualBoxW - 10 * scale : bx + 10 * scale, page.y + 39 * scale);
        }
        page.y += 62 * scale;
      }
    }

    if (columns.length > 0 && rows.length > 0) {
      var tableW = cw - pad * 2;
      var colW = tableW / columns.length;
      var rowH = 26 * scale;

      function drawTableHeader(p) {
        p.ctx.fillStyle = '#313232';
        p.ctx.fillRect(pad, p.y, tableW, rowH);
        p.ctx.fillStyle = '#ffffff';
        p.ctx.font = 'bold ' + (10 * scale) + 'px "IBM Plex Sans Arabic", Arial, sans-serif';
        p.ctx.textAlign = isRtl ? 'right' : 'left';
        columns.forEach(function (col, ci) {
          var x = isRtl ? cw - pad - ci * colW - 6 * scale : pad + ci * colW + 6 * scale;
          p.ctx.fillText(String(col.label).substring(0, 22), x, p.y + 17 * scale);
        });
        p.y += rowH;
      }

      page = ensureSpace(page, rowH * 2);
      drawTableHeader(page);

      rows.forEach(function (row, ri) {
        if (page.y + rowH > ch - 56 * scale) {
          page = newPage();
          drawHeader(page);
          drawTableHeader(page);
        }
        page.ctx.fillStyle = ri % 2 === 0 ? '#ffffff' : '#f8fafc';
        page.ctx.fillRect(pad, page.y, tableW, rowH);
        page.ctx.strokeStyle = '#e2e8f0';
        page.ctx.strokeRect(pad, page.y, tableW, rowH);
        page.ctx.fillStyle = '#0f172a';
        page.ctx.font = (9.5 * scale) + 'px "IBM Plex Sans Arabic", Arial, sans-serif';
        page.ctx.textAlign = isRtl ? 'right' : 'left';
        columns.forEach(function (col, ci) {
          var val = typeof col.value === 'function' ? col.value(row) : row[col.key];
          if (Array.isArray(val)) val = val.join('، ');
          var txt = String(val !== undefined && val !== null ? val : '-').substring(0, 26);
          var x = isRtl ? cw - pad - ci * colW - 6 * scale : pad + ci * colW + 6 * scale;
          page.ctx.fillText(txt, x, page.y + 17 * scale);
        });
        page.y += rowH;
      });
      page.y += 16 * scale;
    }

    extraSections.forEach(function (sec) {
      page = ensureSpace(page, 44 * scale);
      page.ctx.fillStyle = '#d32228';
      page.ctx.font = 'bold ' + (13 * scale) + 'px "IBM Plex Sans Arabic", Arial, sans-serif';
      page.ctx.textAlign = isRtl ? 'right' : 'left';
      page.ctx.fillText(sec.title, isRtl ? cw - pad : pad, page.y + 16 * scale);
      page.y += 26 * scale;
      (sec.lines || []).forEach(function (line) {
        page = ensureSpace(page, 22 * scale);
        page.ctx.fillStyle = '#313232';
        page.ctx.font = (10.5 * scale) + 'px "IBM Plex Sans Arabic", Arial, sans-serif';
        page.ctx.fillText(String(line).substring(0, 120), isRtl ? cw - pad : pad, page.y + 14 * scale);
        page.y += 20 * scale;
      });
      page.y += 10 * scale;
    });

    for (var ci = 0; ci < chartImages.length; ci++) {
      var chImg = chartImages[ci];
      if (!chImg || !chImg.dataUrl) continue;
      page = ensureSpace(page, 180 * scale);
      page.ctx.fillStyle = '#313232';
      page.ctx.font = 'bold ' + (12 * scale) + 'px "IBM Plex Sans Arabic", Arial, sans-serif';
      page.ctx.textAlign = isRtl ? 'right' : 'left';
      page.ctx.fillText(chImg.title || '', isRtl ? cw - pad : pad, page.y + 14 * scale);
      page.y += 22 * scale;
      var imgEl = await new Promise(function (res) {
        var im = new Image();
        im.onload = function () { res(im); };
        im.onerror = function () { res(null); };
        im.src = chImg.dataUrl;
      });
      if (imgEl) {
        var drawW = Math.min(cw - pad * 2, 420 * scale);
        var drawH = (imgEl.height / imgEl.width) * drawW;
        if (drawH > 155 * scale) {
          drawH = 155 * scale;
          drawW = (imgEl.width / imgEl.height) * drawH;
        }
        page.ctx.drawImage(imgEl, isRtl ? cw - pad - drawW : pad, page.y, drawW, drawH);
        page.y += drawH + 16 * scale;
      }
    }

    var totalPages = pages.length;
    pages.forEach(function (p, idx) {
      p.ctx.fillStyle = '#64748b';
      p.ctx.font = (10 * scale) + 'px "IBM Plex Sans Arabic", Arial, sans-serif';
      p.ctx.textAlign = 'center';
      p.ctx.fillText('RENTAL GATE CRM — صفحة ' + (idx + 1) + ' من ' + totalPages, cw / 2, ch - 20 * scale);
      if (idx > 0) doc.addPage(paperSize, orientation);
      doc.addImage(p.canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWmm, pageHmm);
    });

    doc.save(options.filename || 'rental-gate-report.pdf');
  }

  var REPORT_TYPES = [
    { id: 'all_reservations', labelAr: 'جميع الحجوزات', labelEn: 'All Reservations' },
    { id: 'by_status', labelAr: 'الحجوزات حسب الحالة', labelEn: 'Reservations by Status' },
    { id: 'employee_performance', labelAr: 'أداء الموظفين', labelEn: 'Employee Performance' },
    { id: 'followups_log', labelAr: 'سجل المتابعات', labelEn: 'Follow-Ups Log' },
    { id: 'problems', labelAr: 'المشكلات', labelEn: 'Problems' },
    { id: 'priorities', labelAr: 'الأولويات', labelEn: 'Priorities' },
    { id: 'unfollowed', labelAr: 'الحجوزات غير المتابعة', labelEn: 'Unfollowed Reservations' },
    { id: 'extensions', labelAr: 'التمديدات', labelEn: 'Extensions' }
  ];

  var RESERVATION_COLUMNS = [
    { key: 'reservationNumber', label: 'رقم الحجز' },
    { key: 'customerName', label: 'اسم العميل' },
    { key: 'customerPhone', label: 'الجوال' },
    { key: 'companyName', label: 'الشركة' },
    { key: 'branchName', label: 'الفرع' },
    { key: 'carName', label: 'السيارة' },
    { key: 'startDate', label: 'بداية الحجز' },
    { key: 'endDate', label: 'نهاية الحجز' },
    { key: 'originalStatusAr', label: 'حالة الحجز الأصلية' },
    { key: 'internalStatus', label: 'حالة المتابعة الداخلية' },
    { key: 'assignedEmployeeNames', label: 'الموظفون المسؤولون' },
    { key: 'priority', label: 'الأولوية' },
    { key: 'totalAmount', label: 'الإجمالي' },
    { key: 'lastUpdateText', label: 'آخر تحديث' },
    { key: 'lastUpdatedByName', label: 'آخر موظف' }
  ];

  async function render(container, ctx) {
    var t = ctx.t;
    var state = ctx.state.reports || { reportType: 'all_reservations', rows: [] };
    ctx.state.reports = state;

    var [empRes, resMeta] = await Promise.all([
      root.RGApi.callApi('getEmployees', {}),
      root.RGApi.callApi('getReservations', { page: 1, pageSize: 5 })
    ]);
    var employees = (empRes.success && empRes.data.items) || [];
    var facets = (resMeta.success && resMeta.data.facets) || { companies: [], branches: [] };

    container.innerHTML =
      '<div class="surface-card">' +
        '<div class="section-header">' +
          '<div><h2 class="section-title">' + t('nav_reports') + '</h2><p class="section-subtitle">' + t('reports_subtitle') + '</p></div>' +
          '<div class="toolbar-row" style="margin-bottom:0;">' +
            '<button type="button" class="btn btn-primary" id="btn-open-export-modal">' + t('export_settings_btn') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="segmented-control" id="report-type-tabs" style="margin-bottom:16px;">' +
          REPORT_TYPES.map(function (rt) {
            var active = state.reportType === rt.id ? ' active' : '';
            var lbl = ctx.lang === 'en' ? rt.labelEn : rt.labelAr;
            return '<button type="button" class="segmented-btn' + active + '" data-rtype="' + rt.id + '">' + lbl + '</button>';
          }).join('') +
        '</div>' +
        '<div class="filter-grid">' +
          '<input type="date" class="input" id="rep-from" aria-label="' + t('from_date') + '">' +
          '<input type="date" class="input" id="rep-to" aria-label="' + t('to_date') + '">' +
          '<select class="select" id="rep-emp" aria-label="' + t('employee') + '"><option value="">' + t('all_employees') + '</option>' +
            employees.map(function (e) { return '<option value="' + e.id + '">' + e.name + '</option>'; }).join('') +
          '</select>' +
          '<select class="select" id="rep-company" aria-label="' + t('company') + '"><option value="">' + t('all_companies') + '</option>' +
            facets.companies.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') +
          '</select>' +
          '<select class="select" id="rep-branch" aria-label="' + t('branch') + '"><option value="">' + t('all_branches') + '</option>' +
            facets.branches.map(function (b) { return '<option value="' + b + '">' + b + '</option>'; }).join('') +
          '</select>' +
          '<button type="button" class="btn btn-accent" id="rep-run-btn">' + t('generate_report') + '</button>' +
        '</div>' +
        '<div id="report-charts-wrap" class="charts-grid" style="margin-bottom:16px;">' +
          '<div class="chart-card"><h3 class="chart-card-title">توزيع بيانات التقرير</h3><div class="chart-canvas-wrap" style="height:220px;"><canvas id="report-chart-primary"></canvas></div></div>' +
          '<div class="chart-card"><h3 class="chart-card-title">التوزيع حسب الشركة / الأولوية</h3><div class="chart-canvas-wrap" style="height:220px;"><canvas id="report-chart-secondary"></canvas></div></div>' +
        '</div>' +
        '<div id="report-preview-wrap"></div>' +
      '</div>';

    async function loadPreview(logExport) {
      var params = {
        reportType: state.reportType,
        dateFrom: document.getElementById('rep-from').value,
        dateTo: document.getElementById('rep-to').value,
        employeeId: document.getElementById('rep-emp').value,
        company: document.getElementById('rep-company').value,
        branch: document.getElementById('rep-branch').value,
        logExport: Boolean(logExport)
      };
      var r = await root.RGApi.callApi('getReports', params);
      var wrap = document.getElementById('report-preview-wrap');
      if (!r.success) {
        wrap.innerHTML = '<div class="form-error">' + r.message + '</div>';
        return;
      }
      state.rows = r.data.rows || [];
      if (state.rows.length === 0) {
        wrap.innerHTML = '<div class="empty-state">لا توجد بيانات مطابقة لمعايير التقرير المحددة.</div>';
        return;
      }
      var keys = Object.keys(state.rows[0]).filter(function (k) {
        return ['rawJson', 'id', 'reservationId', 'employeeId', 'createdById', 'lastUpdatedById', 'assignedEmployeeIds'].indexOf(k) === -1;
      }).slice(0, 10);

      renderReportCharts(state.reportType, state.rows);

      wrap.innerHTML =
        '<div class="meta-inline" style="margin-bottom:10px;"><span>عدد السجلات: <strong class="tabular-nums">' + state.rows.length + '</strong></span></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
          keys.map(function (k) { return '<th>' + k + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
          state.rows.slice(0, 50).map(function (row) {
            return '<tr>' + keys.map(function (k) {
              var val = row[k];
              if (Array.isArray(val)) val = val.join('، ');
              return '<td class="tabular-nums">' + (val !== undefined && val !== null ? String(val) : '-') + '</td>';
            }).join('') + '</tr>';
          }).join('') +
        '</tbody></table></div>';
    }

    var reportChartInstances = [];
    function renderReportCharts(reportType, rows) {
      if (!root.Chart) return;
      reportChartInstances.forEach(function (ch) { ch.destroy(); });
      reportChartInstances = [];

      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      var txt = isDark ? '#cfd1d3' : '#313232';
      var primaryCounts = {};
      var secondaryCounts = {};

      rows.forEach(function (r) {
        var k1 = r.internalStatus || r.status || r.employeeName || r.statusAr || 'غير محدد';
        primaryCounts[k1] = (primaryCounts[k1] || 0) + (reportType === 'employee_performance' ? Number(r.followUpsCount || 0) : 1);

        var k2 = r.companyName || r.priority || r.role || r.paymentStatus || 'أخرى';
        secondaryCounts[k2] = (secondaryCounts[k2] || 0) + (reportType === 'employee_performance' ? Number(r.assignedReservations || 0) : 1);
      });

      var c1 = document.getElementById('report-chart-primary');
      var c2 = document.getElementById('report-chart-secondary');
      if (c1) {
        reportChartInstances.push(new root.Chart(c1.getContext('2d'), {
          type: 'bar',
          data: {
            labels: Object.keys(primaryCounts),
            datasets: [{ label: 'العدد', data: Object.values(primaryCounts), backgroundColor: '#d32228', borderRadius: 6 }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: txt }, grid: { display: false } },
              y: { ticks: { color: txt, precision: 0 }, beginAtZero: true }
            }
          }
        }));
      }
      if (c2) {
        reportChartInstances.push(new root.Chart(c2.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: Object.keys(secondaryCounts),
            datasets: [{ data: Object.values(secondaryCounts), backgroundColor: ['#d32228', '#313232', '#157347', '#d97706', '#2563eb', '#6b7280'] }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            plugins: { legend: { labels: { color: txt, font: { family: "'IBM Plex Sans Arabic', sans-serif", size: 11 } } } }
          }
        }));
      }
    }

    container.querySelectorAll('[data-rtype]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.reportType = btn.getAttribute('data-rtype');
        render(container, ctx);
      });
    });

    document.getElementById('rep-run-btn').addEventListener('click', function () {
      loadPreview(false);
    });

    document.getElementById('btn-open-export-modal').addEventListener('click', function () {
      openExportConfigModal(ctx, state, employees, facets);
    });

    await loadPreview(false);
  }

  function openExportConfigModal(ctx, state, employees, facets) {
    var modalRoot = document.getElementById('modal-root');
    var selectedCols = RESERVATION_COLUMNS.slice(0, 10).map(function (c) { return c.key; });

    modalRoot.innerHTML =
      '<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">' +
        '<div class="modal-panel">' +
          '<div class="modal-header">' +
            '<h3 class="modal-title" id="export-modal-title">إعدادات التقرير والتصدير</h3>' +
            '<button type="button" class="btn btn-sm" id="exp-close">إغلاق</button>' +
          '</div>' +
          '<div class="form-grid-2">' +
            '<div class="form-group"><label class="form-label" for="exp-title">عنوان التقرير</label><input class="input" id="exp-title" value="تقرير عمليات Rental Gate CRM"></div>' +
            '<div class="form-group"><label class="form-label" for="exp-paper">حجم الورق</label><select class="select" id="exp-paper"><option value="a4">A4</option><option value="letter">Letter</option></select></div>' +
            '<div class="form-group"><label class="form-label" for="exp-orient">اتجاه الصفحة</label><select class="select" id="exp-orient"><option value="landscape">أفقي (Landscape)</option><option value="portrait">عمودي (Portrait)</option></select></div>' +
            '<div class="form-group"><label class="form-label" for="exp-status">الحالة</label><select class="select" id="exp-status"><option value="">الكل</option>' +
              root.RGCrmCore.FOLLOWUP_STATUSES.map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
            '</select></div>' +
            '<div class="form-group"><label class="form-label" for="exp-prio">الأولوية</label><select class="select" id="exp-prio"><option value="">الكل</option>' +
              root.RGCrmCore.PROBLEM_PRIORITIES.map(function (p) { return '<option value="' + p + '">' + p + '</option>'; }).join('') +
            '</select></div>' +
            '<div class="form-group"><label class="form-label" for="exp-emp">الموظف</label><select class="select" id="exp-emp"><option value="">الكل</option>' +
              employees.map(function (e) { return '<option value="' + e.id + '">' + e.name + '</option>'; }).join('') +
            '</select></div>' +
          '</div>' +
          '<div class="form-group"><span class="form-label">الأعمدة المطلوبة</span><div class="checkbox-grid">' +
            RESERVATION_COLUMNS.map(function (col) {
              var checked = selectedCols.indexOf(col.key) !== -1 ? 'checked' : '';
              return '<label class="checkbox-item"><input type="checkbox" class="exp-col-chk" value="' + col.key + '" ' + checked + '> ' + col.label + '</label>';
            }).join('') +
          '</div></div>' +
          '<div class="checkbox-grid">' +
            '<label class="checkbox-item"><input type="checkbox" id="exp-inc-notes" checked> تضمين الملاحظات</label>' +
            '<label class="checkbox-item"><input type="checkbox" id="exp-inc-fu" checked> تضمين سجل المتابعات</label>' +
            '<label class="checkbox-item"><input type="checkbox" id="exp-inc-charts" checked> تضمين الرسوم البيانية</label>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn" id="exp-excel-btn">تصدير Excel (.xlsx)</button>' +
            '<button type="button" class="btn btn-primary" id="exp-pdf-btn">تصدير PDF (RTL)</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('exp-close').addEventListener('click', function () { modalRoot.innerHTML = ''; });

    async function collectExportRows() {
      var res = await root.RGApi.callApi('getReports', {
        reportType: state.reportType,
        status: document.getElementById('exp-status').value,
        priority: document.getElementById('exp-prio').value,
        employeeId: document.getElementById('exp-emp').value,
        logExport: true
      });
      return (res.success && res.data.rows) || state.rows || [];
    }

    function getSelectedHeaders(rows) {
      var chosenKeys = Array.from(modalRoot.querySelectorAll('.exp-col-chk:checked')).map(function (el) { return el.value; });
      if (state.reportType === 'all_reservations' || state.reportType === 'by_status' || state.reportType === 'unfollowed') {
        return RESERVATION_COLUMNS.filter(function (c) { return chosenKeys.indexOf(c.key) !== -1; });
      }
      var keys = rows.length ? Object.keys(rows[0]).filter(function (k) { return k !== 'id' && k !== 'rawJson'; }) : ['id'];
      return keys.map(function (k) { return { key: k, label: k }; });
    }

    document.getElementById('exp-excel-btn').addEventListener('click', async function () {
      var rows = await collectExportRows();
      var headers = getSelectedHeaders(rows);
      var sheets = [{ name: state.reportType, headers: headers, rows: rows }];
      if (document.getElementById('exp-inc-fu').checked) {
        var fuRes = await root.RGApi.callApi('getTeamFollowUps', {});
        if (fuRes.success && fuRes.data.items.length) {
          sheets.push({
            name: 'FollowUps',
            headers: [
              { key: 'reservationNumber', label: 'رقم الحجز' },
              { key: 'employeeName', label: 'الموظف' },
              { key: 'status', label: 'الحالة' },
              { key: 'action', label: 'الإجراء' },
              { key: 'notes', label: 'الملاحظات' },
              { key: 'followUpDate', label: 'التاريخ' },
              { key: 'followUpTime', label: 'الوقت' }
            ],
            rows: fuRes.data.items
          });
        }
      }
      exportExcelWorkbook(sheets, 'rental-gate-' + state.reportType + '.xlsx');
      ctx.toast('تم تصدير ملف Excel بنجاح.');
      modalRoot.innerHTML = '';
    });

    document.getElementById('exp-pdf-btn').addEventListener('click', async function () {
      var rows = await collectExportRows();
      var headers = getSelectedHeaders(rows).slice(0, 8);
      var user = root.RGAuth.getUser();
      var incCharts = document.getElementById('exp-inc-charts').checked;
      var chartImages = [];
      if (incCharts) {
        var c1 = document.getElementById('report-chart-primary');
        var c2 = document.getElementById('report-chart-secondary');
        if (c1) chartImages.push({ title: 'توزيع بيانات التقرير', dataUrl: c1.toDataURL('image/png') });
        if (c2) chartImages.push({ title: 'التوزيع حسب الشركة / الأولوية', dataUrl: c2.toDataURL('image/png') });
      }
      await exportArabicPdfDocument({
        title: document.getElementById('exp-title').value || 'تقرير Rental Gate',
        paperSize: document.getElementById('exp-paper').value,
        orientation: document.getElementById('exp-orient').value,
        exporterName: user ? user.name : '',
        summaryItems: [
          { label: 'نوع التقرير', value: state.reportType },
          { label: 'عدد السجلات', value: rows.length }
        ],
        columns: headers,
        rows: rows.slice(0, 120),
        chartImages: chartImages,
        filename: 'rental-gate-' + state.reportType + '.pdf'
      });
      ctx.toast('تم تصدير ملف PDF بنجاح.');
      modalRoot.innerHTML = '';
    });
  }

  root.RGReports = {
    render: render,
    exportExcelWorkbook: exportExcelWorkbook,
    exportArabicPdfDocument: exportArabicPdfDocument,
    RESERVATION_COLUMNS: RESERVATION_COLUMNS
  };
})(window);
