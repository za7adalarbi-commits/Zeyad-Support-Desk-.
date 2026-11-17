/**
 * RENTAL GATE CRM — API Transport, Live Google Apps Script Client & Local Sandbox Engine
 */
(function (root) {
  'use strict';

  var STORAGE_GAS_URL = 'rg_crm_gas_url';
  var STORAGE_TOKEN = 'rg_crm_session_token';
  var STORAGE_DB = 'rg_crm_sandbox_db_v1';

  function getGasUrl() {
    return (localStorage.getItem(STORAGE_GAS_URL) || '').trim();
  }

  function setGasUrl(url) {
    var clean = String(url || '').trim();
    if (clean) localStorage.setItem(STORAGE_GAS_URL, clean);
    else localStorage.removeItem(STORAGE_GAS_URL);
  }

  function getToken() {
    return (localStorage.getItem(STORAGE_TOKEN) || '').trim();
  }

  function setToken(token) {
    if (token) localStorage.setItem(STORAGE_TOKEN, token);
    else localStorage.removeItem(STORAGE_TOKEN);
  }

  function isLiveMode() {
    return Boolean(getGasUrl());
  }

  function simpleHash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return 'H' + (h >>> 0).toString(16).padStart(8, '0');
  }

  function genId(prefix) {
    return prefix + '_' + Math.random().toString(36).substring(2, 8).toUpperCase() + Date.now().toString(36).toUpperCase().slice(-4);
  }

  function todayIso(offsetDays) {
    var d = new Date(Date.now() + (offsetDays || 0) * 86400000);
    return d.toISOString().substring(0, 10);
  }

  function seedSandboxDb() {
    var t0 = todayIso(0);
    var t1 = todayIso(-1);
    var t2 = todayIso(-2);
    var t5 = todayIso(-5);

    var employees = [
      {
        id: 'EMP_ADMIN',
        name: 'فهد الدوسري',
        username: 'admin',
        salt: 'S_ADMIN',
        passwordHash: simpleHash('S_ADMIN:Admin@123'),
        phone: '0501122334',
        email: 'admin@rentalgate.net',
        jobTitle: 'المدير العام',
        role: 'general_manager',
        permissions: ['all'],
        status: 'active',
        lastActivity: new Date().toISOString(),
        createdAt: '2026-10-01T08:00:00.000Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'EMP_SUP1',
        name: 'سارة العتيبي',
        username: 'supervisor',
        salt: 'S_SUP1',
        passwordHash: simpleHash('S_SUP1:Super@123'),
        phone: '0554433221',
        email: 'sara@rentalgate.net',
        jobTitle: 'مشرفة خدمة العملاء',
        role: 'supervisor',
        permissions: ['supervisor'],
        status: 'active',
        lastActivity: t0 + 'T09:40:00.000Z',
        createdAt: '2026-10-05T08:00:00.000Z',
        updatedAt: t0 + 'T09:40:00.000Z'
      },
      {
        id: 'EMP_AG1',
        name: 'خالد الحربي',
        username: 'agent1',
        salt: 'S_AG1',
        passwordHash: simpleHash('S_AG1:Agent@123'),
        phone: '0549988776',
        email: 'khalid@rentalgate.net',
        jobTitle: 'أخصائي حجوزات أول',
        role: 'agent',
        permissions: ['agent'],
        status: 'active',
        lastActivity: t0 + 'T11:15:00.000Z',
        createdAt: '2026-10-10T08:00:00.000Z',
        updatedAt: t0 + 'T11:15:00.000Z'
      },
      {
        id: 'EMP_AG2',
        name: 'نورة القحطاني',
        username: 'agent2',
        salt: 'S_AG2',
        passwordHash: simpleHash('S_AG2:Agent@123'),
        phone: '0567788990',
        email: 'noura@rentalgate.net',
        jobTitle: 'موظفة متابعة العملاء',
        role: 'agent',
        permissions: ['agent'],
        status: 'active',
        lastActivity: t1 + 'T16:20:00.000Z',
        createdAt: '2026-10-12T08:00:00.000Z',
        updatedAt: t1 + 'T16:20:00.000Z'
      }
    ];

    var reservations = [
      {
        id: 'RES_1001',
        reservationNumber: 'RG-2026-8841',
        customerName: 'عبدالله بن محمد السبيعي',
        customerPhone: '0508877123',
        companyName: 'ذيب لتأجير السيارات',
        branchName: 'مطار الملك خالد - الرياض',
        carName: 'هيونداي سوناتا 2026',
        plateNumber: 'ح د ب 4412',
        startDate: t0,
        endDate: todayIso(4),
        daysCount: 4,
        originalStatusCode: 'confirmed',
        originalStatusAr: 'مؤكد',
        pickupTypeAr: 'توصيل للمطار',
        returnTypeAr: 'تسليم في الفرع',
        baseAmount: 1120,
        extensionsAmount: 280,
        totalAmount: 1400,
        hasExtensions: true,
        internalStatus: 'تم التمديد',
        priority: 'متوسط',
        assignedEmployeeIds: ['EMP_AG1', 'EMP_AG2'],
        assignedEmployeeNames: ['خالد الحربي', 'نورة القحطاني'],
        lastUpdateText: 'تأكيد تمديد يوم إضافي وسداد الرسوم',
        lastUpdatedById: 'EMP_AG1',
        lastUpdatedByName: 'خالد الحربي',
        lastUpdatedAt: t0 + 'T11:15:00.000Z',
        hasProblem: false,
        createdAt: t1 + 'T14:00:00.000Z',
        updatedAt: t0 + 'T11:15:00.000Z'
      },
      {
        id: 'RES_1002',
        reservationNumber: 'RG-2026-8842',
        customerName: 'سلطان عبدالعزيز الغامدي',
        customerPhone: '0551239874',
        companyName: 'بدجت السعودية',
        branchName: 'حي العليا - الرياض',
        carName: 'تويوتا كامري GLE 2026',
        plateNumber: 'س م ن 9011',
        startDate: t0,
        endDate: todayIso(3),
        daysCount: 3,
        originalStatusCode: 'delivered',
        originalStatusAr: 'تم التسليم',
        pickupTypeAr: 'استلام من الفرع',
        returnTypeAr: 'تسليم في الفرع',
        baseAmount: 840,
        extensionsAmount: 0,
        totalAmount: 840,
        hasExtensions: false,
        internalStatus: 'تم التسليم',
        priority: 'عادي',
        assignedEmployeeIds: ['EMP_AG1'],
        assignedEmployeeNames: ['خالد الحربي'],
        lastUpdateText: 'تم تسليم المركبة للعميل وفحص العداد',
        lastUpdatedById: 'EMP_AG1',
        lastUpdatedByName: 'خالد الحربي',
        lastUpdatedAt: t0 + 'T10:05:00.000Z',
        hasProblem: false,
        createdAt: t0 + 'T08:10:00.000Z',
        updatedAt: t0 + 'T10:05:00.000Z'
      },
      {
        id: 'RES_1003',
        reservationNumber: 'RG-2026-8843',
        customerName: 'ماجد ناصر الشهري',
        customerPhone: '0534455661',
        companyName: 'يلو (الوفاق)',
        branchName: 'مطار الملك عبدالعزيز - جدة',
        carName: 'كيا K5 2026',
        plateNumber: 'أ ب ج 7120',
        startDate: t1,
        endDate: todayIso(2),
        daysCount: 3,
        originalStatusCode: 'pending',
        originalStatusAr: 'قيد الانتظار',
        pickupTypeAr: 'توصيل للمطار',
        returnTypeAr: 'استلام من موقع العميل',
        baseAmount: 960,
        extensionsAmount: 0,
        totalAmount: 960,
        hasExtensions: false,
        internalStatus: 'تم الإنشاء',
        priority: 'مرتفع',
        assignedEmployeeIds: ['EMP_AG2'],
        assignedEmployeeNames: ['نورة القحطاني'],
        lastUpdateText: 'تأخر تأكيد الفرع على جاهزية السيارة',
        lastUpdatedById: 'EMP_SUP1',
        lastUpdatedByName: 'سارة العتيبي',
        lastUpdatedAt: t0 + 'T09:40:00.000Z',
        hasProblem: true,
        createdAt: t1 + 'T16:30:00.000Z',
        updatedAt: t0 + 'T09:40:00.000Z'
      },
      {
        id: 'RES_1004',
        reservationNumber: 'RG-2026-8844',
        customerName: 'ريم فهد المالكي',
        customerPhone: '0592211445',
        companyName: 'مفتاح لتأجير السيارات',
        branchName: 'الخبر - الكورنيش',
        carName: 'مازدا 6 2025',
        plateNumber: 'ط ع ق 3309',
        startDate: t2,
        endDate: t0,
        daysCount: 2,
        originalStatusCode: 'completed',
        originalStatusAr: 'مكتمل',
        pickupTypeAr: 'استلام من الفرع',
        returnTypeAr: 'تسليم في الفرع',
        baseAmount: 620,
        extensionsAmount: 0,
        totalAmount: 620,
        hasExtensions: false,
        internalStatus: 'تم الاستلام',
        priority: 'عادي',
        assignedEmployeeIds: ['EMP_AG2'],
        assignedEmployeeNames: ['نورة القحطاني'],
        lastUpdateText: 'تم استلام السيارة وإغلاق العقد بنجاح',
        lastUpdatedById: 'EMP_AG2',
        lastUpdatedByName: 'نورة القحطاني',
        lastUpdatedAt: t1 + 'T16:20:00.000Z',
        hasProblem: false,
        createdAt: t2 + 'T11:00:00.000Z',
        updatedAt: t1 + 'T16:20:00.000Z'
      },
      {
        id: 'RES_1005',
        reservationNumber: 'RG-2026-8845',
        customerName: 'تركي سالم العجمي',
        customerPhone: '0543322119',
        companyName: 'لومي لتأجير السيارات',
        branchName: 'مطار الملك فهد - الدمام',
        carName: 'شيفروليه تاهو 2026',
        plateNumber: 'ر و ن 5580',
        startDate: t0,
        endDate: todayIso(5),
        daysCount: 5,
        originalStatusCode: 'booked',
        originalStatusAr: 'تم الحجز',
        pickupTypeAr: 'توصيل للمطار',
        returnTypeAr: 'تسليم في الفرع',
        baseAmount: 2750,
        extensionsAmount: 0,
        totalAmount: 2750,
        hasExtensions: false,
        internalStatus: 'تم الحجز',
        priority: 'عادي',
        assignedEmployeeIds: [],
        assignedEmployeeNames: [],
        lastUpdateText: 'بانتظار إسناد موظف للمتابعة',
        lastUpdatedById: 'EMP_ADMIN',
        lastUpdatedByName: 'فهد الدوسري',
        lastUpdatedAt: t0 + 'T07:50:00.000Z',
        hasProblem: false,
        createdAt: t0 + 'T07:50:00.000Z',
        updatedAt: t0 + 'T07:50:00.000Z'
      },
      {
        id: 'RES_1006',
        reservationNumber: 'RG-2026-8846',
        customerName: 'بندر عوض الزهراني',
        customerPhone: '0506677882',
        companyName: 'بدجت السعودية',
        branchName: 'جدة - طريق المدينة',
        carName: 'نيسان إكس تريل 2026',
        plateNumber: 'ك ل م 1198',
        startDate: t5,
        endDate: t2,
        daysCount: 3,
        originalStatusCode: 'cancelled',
        originalStatusAr: 'ملغي',
        pickupTypeAr: 'توصيل للموقع',
        returnTypeAr: 'تسليم في الفرع',
        baseAmount: 1050,
        extensionsAmount: 0,
        totalAmount: 1050,
        hasExtensions: false,
        internalStatus: 'تم الإلغاء',
        priority: 'عادي',
        assignedEmployeeIds: ['EMP_AG1'],
        assignedEmployeeNames: ['خالد الحربي'],
        lastUpdateText: 'ألغى العميل الحجز قبل الموعد بـ 24 ساعة',
        lastUpdatedById: 'EMP_AG1',
        lastUpdatedByName: 'خالد الحربي',
        lastUpdatedAt: t5 + 'T15:10:00.000Z',
        hasProblem: false,
        createdAt: t5 + 'T10:00:00.000Z',
        updatedAt: t5 + 'T15:10:00.000Z'
      }
    ];

    var extensions = [
      {
        id: 'EXT_501',
        extensionNumber: 'EXT-8841-1',
        reservationId: 'RES_1001',
        reservationNumber: 'RG-2026-8841',
        statusCode: 'accepted',
        statusAr: 'مقبول',
        paymentStatus: 'paid',
        extendDays: 1,
        startDate: todayIso(3),
        endDate: todayIso(4),
        amount: 280,
        isAcceptedAndPaid: true,
        syncedAt: t0 + 'T09:00:00.000Z'
      }
    ];

    var assignments = [
      {
        id: 'ASN_1', reservationId: 'RES_1001', reservationNumber: 'RG-2026-8841',
        employeeId: 'EMP_AG1', employeeName: 'خالد الحربي',
        assignedById: 'EMP_SUP1', assignedByName: 'سارة العتيبي',
        roleType: 'primary', status: 'active', assignedAt: t1 + 'T15:00:00.000Z', updatedAt: t1 + 'T15:00:00.000Z'
      },
      {
        id: 'ASN_2', reservationId: 'RES_1001', reservationNumber: 'RG-2026-8841',
        employeeId: 'EMP_AG2', employeeName: 'نورة القحطاني',
        assignedById: 'EMP_SUP1', assignedByName: 'سارة العتيبي',
        roleType: 'collaborator', status: 'active', assignedAt: t0 + 'T09:10:00.000Z', updatedAt: t0 + 'T09:10:00.000Z'
      },
      {
        id: 'ASN_3', reservationId: 'RES_1002', reservationNumber: 'RG-2026-8842',
        employeeId: 'EMP_AG1', employeeName: 'خالد الحربي',
        assignedById: 'EMP_SUP1', assignedByName: 'سارة العتيبي',
        roleType: 'primary', status: 'active', assignedAt: t0 + 'T08:30:00.000Z', updatedAt: t0 + 'T08:30:00.000Z'
      },
      {
        id: 'ASN_4', reservationId: 'RES_1003', reservationNumber: 'RG-2026-8843',
        employeeId: 'EMP_AG2', employeeName: 'نورة القحطاني',
        assignedById: 'EMP_SUP1', assignedByName: 'سارة العتيبي',
        roleType: 'primary', status: 'active', assignedAt: t1 + 'T17:00:00.000Z', updatedAt: t1 + 'T17:00:00.000Z'
      }
    ];

    var followUps = [
      {
        id: 'FU_101',
        reservationId: 'RES_1001',
        reservationNumber: 'RG-2026-8841',
        customerName: 'عبدالله بن محمد السبيعي',
        employeeId: 'EMP_AG1',
        employeeName: 'خالد الحربي',
        status: 'تم الحجز',
        action: 'التواصل مع العميل وتأكيد موعد الوصول للمطار',
        notes: 'الرحلة تصل الساعة 4:30 عصرًا',
        followUpDate: t1,
        followUpTime: '15:20:00',
        createdAt: t1 + 'T15:20:00.000Z'
      },
      {
        id: 'FU_102',
        reservationId: 'RES_1001',
        reservationNumber: 'RG-2026-8841',
        customerName: 'عبدالله بن محمد السبيعي',
        employeeId: 'EMP_AG2',
        employeeName: 'نورة القحطاني',
        status: 'تم التمديد',
        action: 'إصدار رابط سداد التمديد ومتابعة التأكيد',
        notes: 'تم الدفع بنجاح وتحديث عقد الإيجار',
        followUpDate: t0,
        followUpTime: '11:15:00',
        createdAt: t0 + 'T11:15:00.000Z'
      },
      {
        id: 'FU_103',
        reservationId: 'RES_1002',
        reservationNumber: 'RG-2026-8842',
        customerName: 'سلطان عبدالعزيز الغامدي',
        employeeId: 'EMP_AG1',
        employeeName: 'خالد الحربي',
        status: 'تم التسليم',
        action: 'تأكيد استلام العميل للمركبة من فرع العليا',
        notes: 'العميل راضٍ عن حالة المركبة',
        followUpDate: t0,
        followUpTime: '10:05:00',
        createdAt: t0 + 'T10:05:00.000Z'
      }
    ];

    var problems = [
      {
        id: 'PRB_201',
        problemNumber: 'PRB-884301',
        reservationId: 'RES_1003',
        reservationNumber: 'RG-2026-8843',
        customerName: 'ماجد ناصر الشهري',
        createdById: 'EMP_AG2',
        createdByName: 'نورة القحطاني',
        assignedEmployeeIds: ['EMP_AG2', 'EMP_SUP1'],
        assignedEmployeeNames: ['نورة القحطاني', 'سارة العتيبي'],
        description: 'السيارة المطلوبة غير متوفرة في مطار جدة حاليًا والفرع يقترح ترقية بديلة.',
        priority: 'مرتفع',
        status: 'بانتظار الشركة',
        createdAt: t0 + 'T09:15:00.000Z',
        updatedAt: t0 + 'T09:40:00.000Z'
      }
    ];

    var problemUpdates = [
      {
        id: 'PRBU_1',
        problemId: 'PRB_201',
        reservationNumber: 'RG-2026-8843',
        employeeId: 'EMP_AG2',
        employeeName: 'نورة القحطاني',
        previousStatus: '',
        newStatus: 'جديدة',
        previousPriority: '',
        newPriority: 'مرتفع',
        note: 'تم تصعيد المشكلة للفرع والمشرفة لتوفير سيارة بديلة قبل وصول الرحلة',
        createdAt: t0 + 'T09:15:00.000Z'
      },
      {
        id: 'PRBU_2',
        problemId: 'PRB_201',
        reservationNumber: 'RG-2026-8843',
        employeeId: 'EMP_SUP1',
        employeeName: 'سارة العتيبي',
        previousStatus: 'جديدة',
        newStatus: 'بانتظار الشركة',
        previousPriority: 'مرتفع',
        newPriority: 'مرتفع',
        note: 'تم التواصل مع مشرف تشغيل يلو في مطار جدة لاعتماد الترقية دون رسوم إضافية',
        createdAt: t0 + 'T09:40:00.000Z'
      }
    ];

    var activityLog = [
      {
        id: 'ACT_1', userId: 'EMP_ADMIN', userName: 'فهد الدوسري', userRole: 'general_manager',
        actionType: 'سحب بيانات', entityType: 'Sync', entityId: 'SYNC_1',
        details: 'مزامنة الحجوزات والتمديدات من Rental Gate API (6 حجوزات، 1 تمديد)',
        logDate: t0, logTime: '09:00:00', createdAt: t0 + 'T09:00:00.000Z'
      },
      {
        id: 'ACT_2', userId: 'EMP_SUP1', userName: 'سارة العتيبي', userRole: 'supervisor',
        actionType: 'إسناد حجز', entityType: 'Reservation', entityId: 'RG-2026-8841',
        details: 'إسناد إلى: خالد الحربي، نورة القحطاني',
        logDate: t0, logTime: '09:10:00', createdAt: t0 + 'T09:10:00.000Z'
      },
      {
        id: 'ACT_3', userId: 'EMP_AG2', userName: 'نورة القحطاني', userRole: 'agent',
        actionType: 'إنشاء مشكلة', entityType: 'Problem', entityId: 'PRB-884301',
        details: 'حجز RG-2026-8843 | الأولوية: مرتفع',
        logDate: t0, logTime: '09:15:00', createdAt: t0 + 'T09:15:00.000Z'
      }
    ];

    var notifications = [
      {
        id: 'NTF_1',
        recipientEmployeeId: 'EMP_SUP1',
        recipientRole: 'supervisor',
        type: 'high_priority_problem',
        title: 'تنبيه: مشكلة بأولوية مرتفعة',
        message: 'مشكلة مرتفعة الأولوية للحجز RG-2026-8843 (ماجد ناصر الشهري)',
        entityType: 'Problem',
        entityId: 'PRB_201',
        isRead: false,
        createdAt: t0 + 'T09:15:00.000Z'
      },
      {
        id: 'NTF_2',
        recipientEmployeeId: 'EMP_ADMIN',
        recipientRole: 'general_manager',
        type: 'high_priority_problem',
        title: 'تنبيه: مشكلة بأولوية مرتفعة',
        message: 'مشكلة مرتفعة الأولوية للحجز RG-2026-8843 (ماجد ناصر الشهري)',
        entityType: 'Problem',
        entityId: 'PRB_201',
        isRead: false,
        createdAt: t0 + 'T09:15:00.000Z'
      }
    ];

    var syncLog = [
      {
        id: 'SYNC_1',
        triggeredById: 'EMP_ADMIN',
        triggeredByName: 'فهد الدوسري',
        status: 'success',
        importedCount: 6,
        updatedCount: 0,
        extensionsCount: 1,
        pagesFetched: 1,
        errorMessage: '',
        durationMs: 640,
        startedAt: t0 + 'T09:00:00.000Z',
        finishedAt: t0 + 'T09:00:01.000Z'
      }
    ];

    var settings = {
      company_name: 'RENTAL GATE',
      excluded_statuses: ['draft', 'test', 'abandoned'],
      session_ttl_hours: 24,
      allow_agent_view_all: true,
      default_language: 'ar',
      auto_sync_enabled: true,
      auto_sync_interval_hours: 12,
      job_role_presets: (root.RGCrmCore && root.RGCrmCore.JOB_ROLE_PRESETS) ? root.RGCrmCore.JOB_ROLE_PRESETS.slice() : [],
      permissions_catalog_custom: []
    };

    return {
      employees: employees,
      reservations: reservations,
      extensions: extensions,
      assignments: assignments,
      followUps: followUps,
      problems: problems,
      problemUpdates: problemUpdates,
      activityLog: activityLog,
      notifications: notifications,
      syncLog: syncLog,
      settings: settings,
      sessions: []
    };
  }

  function loadSandboxDb() {
    var raw = localStorage.getItem(STORAGE_DB);
    if (!raw) {
      var seeded = seedSandboxDb();
      localStorage.setItem(STORAGE_DB, JSON.stringify(seeded));
      return seeded;
    }
    try {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.settings) {
        if (parsed.settings.auto_sync_enabled === undefined) parsed.settings.auto_sync_enabled = true;
        if (!parsed.settings.auto_sync_interval_hours) parsed.settings.auto_sync_interval_hours = 12;
        if (!Array.isArray(parsed.settings.job_role_presets) || parsed.settings.job_role_presets.length === 0) {
          parsed.settings.job_role_presets = (root.RGCrmCore && root.RGCrmCore.JOB_ROLE_PRESETS) ? root.RGCrmCore.JOB_ROLE_PRESETS.slice() : [];
        }
        if (!Array.isArray(parsed.settings.permissions_catalog_custom)) {
          parsed.settings.permissions_catalog_custom = [];
        }
      }
      return parsed;
    } catch (e) {
      var fresh = seedSandboxDb();
      localStorage.setItem(STORAGE_DB, JSON.stringify(fresh));
      return fresh;
    }
  }

  function saveSandboxDb(db) {
    localStorage.setItem(STORAGE_DB, JSON.stringify(db));
  }

  function sanitizeEmp(e) {
    var resolved = (root.RGCrmCore && root.RGCrmCore.resolveEffectivePermissions)
      ? root.RGCrmCore.resolveEffectivePermissions(e)
      : (e.permissions || []);
    return {
      id: e.id,
      name: e.name,
      username: e.username,
      phone: e.phone,
      email: e.email,
      jobTitle: e.jobTitle,
      role: e.role,
      permissions: resolved,
      status: e.status,
      lastActivity: e.lastActivity,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    };
  }

  function appendSandboxActivity(db, user, actionType, entityType, entityId, details) {
    var now = new Date();
    db.activityLog.unshift({
      id: genId('ACT'),
      userId: user ? user.id : 'system',
      userName: user ? user.name : 'النظام',
      userRole: user ? user.role : 'system',
      actionType: actionType,
      entityType: entityType || '',
      entityId: entityId || '',
      details: details || '',
      logDate: now.toISOString().substring(0, 10),
      logTime: now.toTimeString().substring(0, 8),
      createdAt: now.toISOString()
    });
  }

  function pushSandboxNotification(db, recipientEmployeeId, recipientRole, type, title, message, entityType, entityId) {
    db.notifications.unshift({
      id: genId('NTF'),
      recipientEmployeeId: recipientEmployeeId || '',
      recipientRole: recipientRole || '',
      type: type,
      title: title,
      message: message,
      entityType: entityType || '',
      entityId: entityId || '',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  function requireSandboxSession(db, token) {
    if (!token) throw new Error('UNAUTHORIZED: جلسة غير صالحة، يرجى تسجيل الدخول.');
    var ses = null;
    for (var i = 0; i < db.sessions.length; i++) {
      if (db.sessions[i].token === token) {
        ses = db.sessions[i];
        break;
      }
    }
    if (!ses || ses.isRevoked || new Date(ses.expiresAt).getTime() <= Date.now()) {
      throw new Error('UNAUTHORIZED: انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجددًا.');
    }
    var user = null;
    for (var j = 0; j < db.employees.length; j++) {
      if (db.employees[j].id === ses.employeeId) {
        user = db.employees[j];
        break;
      }
    }
    if (!user || user.status !== 'active') {
      throw new Error('UNAUTHORIZED: الحساب غير نشط.');
    }
    return { token: token, employeeId: user.id, role: user.role, user: sanitizeEmp(user) };
  }

  function sandboxExecute(action, token, payload) {
    var db = loadSandboxDb();
    var core = root.RGCrmCore;
    payload = payload || {};

    if (action === 'ping') {
      return { success: true, message: 'Sandbox Mode Active', data: { mode: 'sandbox' }, error: null };
    }

    if (action === 'login') {
      var uname = String(payload.username || '').trim().toLowerCase();
      var pwd = String(payload.password || '');
      if (!uname || !pwd) return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور.', data: null, error: 'VALIDATION' };

      var found = db.employees.find(function (e) { return e.username.toLowerCase() === uname; });
      if (!found) return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.', data: null, error: 'AUTH' };
      if (found.status !== 'active') return { success: false, message: 'هذا الحساب موقوف حاليًا.', data: null, error: 'DISABLED' };
      if (simpleHash(found.salt + ':' + pwd) !== found.passwordHash) {
        return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.', data: null, error: 'AUTH' };
      }

      var newToken = genId('SES');
      var ttl = Number(db.settings.session_ttl_hours || 24);
      var exp = new Date(Date.now() + ttl * 3600000).toISOString();
      db.sessions.push({
        token: newToken,
        employeeId: found.id,
        role: found.role,
        expiresAt: exp,
        isRevoked: false
      });
      found.lastActivity = new Date().toISOString();
      appendSandboxActivity(db, found, 'تسجيل الدخول', 'Employee', found.id, 'تسجيل دخول ناجح للمستخدم ' + found.username);
      saveSandboxDb(db);
      return { success: true, message: 'تم تسجيل الدخول بنجاح.', data: { token: newToken, expiresAt: exp, user: sanitizeEmp(found) }, error: null };
    }

    var session;
    try {
      session = requireSandboxSession(db, token);
    } catch (authErr) {
      return { success: false, message: authErr.message, data: null, error: authErr.message };
    }

    switch (action) {
      case 'logout': {
        db.sessions.forEach(function (s) { if (s.token === token) s.isRevoked = true; });
        appendSandboxActivity(db, session.user, 'تسجيل الخروج', 'Employee', session.employeeId, 'تسجيل خروج');
        saveSandboxDb(db);
        return { success: true, message: 'تم تسجيل الخروج.', data: { loggedOut: true }, error: null };
      }
      case 'getMe':
        return { success: true, message: '', data: { user: session.user }, error: null };

      case 'getDashboard': {
        var rangeKey = payload.range || '30d';
        var todayStr = todayIso(0);
        var start = '';
        var end = todayStr;
        if (rangeKey === 'today') start = todayStr;
        else if (rangeKey === '7d') start = todayIso(-6);
        else if (rangeKey === '30d') start = todayIso(-29);
        else if (rangeKey === 'month') start = todayStr.substring(0, 7) + '-01';
        else if (rangeKey === 'custom') {
          start = payload.dateFrom || '';
          end = payload.dateTo || todayStr;
        }
        var metrics = core.computeDashboardMetrics(db.reservations, db.followUps, db.problems, db.employees, { start: start, end: end }, todayStr);
        return { success: true, message: '', data: metrics, error: null };
      }

      case 'getReservations': {
        var companies = {};
        var branches = {};
        db.reservations.forEach(function (r) {
          if (r.companyName) companies[r.companyName] = true;
          if (r.branchName) branches[r.branchName] = true;
        });
        var filtered = core.filterReservations(db.reservations, db.followUps, payload, {
          employeeId: session.employeeId,
          role: session.role,
          user: session.user,
          allowAgentViewAll: db.settings.allow_agent_view_all
        });
        var page = Math.max(1, Number(payload.page || 1));
        var pageSize = Math.max(1, Number(payload.pageSize || 25));
        var startIdx = (page - 1) * pageSize;
        return {
          success: true,
          message: '',
          data: {
            items: filtered.slice(startIdx, startIdx + pageSize),
            total: filtered.length,
            page: page,
            pageSize: pageSize,
            totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
            facets: {
              companies: Object.keys(companies).sort(),
              branches: Object.keys(branches).sort()
            }
          },
          error: null
        };
      }

      case 'getReservationDetails': {
        var res = db.reservations.find(function (r) {
          return r.id === payload.reservationId || r.reservationNumber === payload.reservationNumber;
        });
        if (!res) return { success: false, message: 'الحجز غير موجود.', data: null, error: 'NOT_FOUND' };
        return {
          success: true,
          message: '',
          data: {
            reservation: res,
            extensions: db.extensions.filter(function (e) { return e.reservationNumber === res.reservationNumber; }),
            assignments: db.assignments.filter(function (a) { return a.reservationId === res.id && a.status === 'active'; }),
            followUps: db.followUps.filter(function (f) { return f.reservationId === res.id; }).sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); }),
            problems: db.problems.filter(function (p) { return p.reservationId === res.id; }),
            problemUpdates: db.problemUpdates.filter(function (u) { return u.reservationNumber === res.reservationNumber; })
          },
          error: null
        };
      }

      case 'assignEmployees': {
        if (!core.canUserPerform(session.user, 'assign_employees')) {
          return { success: false, message: 'FORBIDDEN: ليس لديك صلاحية إسناد الحجوزات.', data: null, error: 'FORBIDDEN' };
        }
        var targetRes = db.reservations.find(function (r) { return r.id === payload.reservationId; });
        if (!targetRes) return { success: false, message: 'الحجز غير موجود.', data: null, error: 'NOT_FOUND' };

        var prevIds = targetRes.assignedEmployeeIds || [];
        db.assignments.forEach(function (a) {
          if (a.reservationId === targetRes.id && a.status === 'active') {
            a.status = 'reassigned';
            a.updatedAt = new Date().toISOString();
          }
        });

        var nextIds = [];
        var nextNames = [];
        (payload.employeeIds || []).forEach(function (eid, idx) {
          var emp = db.employees.find(function (e) { return e.id === eid && e.status === 'active'; });
          if (emp && nextIds.indexOf(emp.id) === -1) {
            nextIds.push(emp.id);
            nextNames.push(emp.name);
            db.assignments.push({
              id: genId('ASN'),
              reservationId: targetRes.id,
              reservationNumber: targetRes.reservationNumber,
              employeeId: emp.id,
              employeeName: emp.name,
              assignedById: session.employeeId,
              assignedByName: session.user.name,
              roleType: idx === 0 ? 'primary' : 'collaborator',
              status: 'active',
              assignedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            var isReassign = prevIds.length > 0 && prevIds.indexOf(emp.id) === -1;
            pushSandboxNotification(
              db,
              emp.id,
              emp.role,
              isReassign ? 'reassignment' : 'new_assignment',
              isReassign ? 'إعادة توزيع حجز' : 'إسناد حجز جديد',
              'تم إسناد الحجز رقم ' + targetRes.reservationNumber + ' (' + targetRes.customerName + ') إليك.',
              'Reservation',
              targetRes.id
            );
          }
        });

        targetRes.assignedEmployeeIds = nextIds;
        targetRes.assignedEmployeeNames = nextNames;
        targetRes.updatedAt = new Date().toISOString();
        appendSandboxActivity(db, session.user, prevIds.length > 0 ? 'إعادة توزيع حجز' : 'إسناد حجز', 'Reservation', targetRes.reservationNumber, 'إسناد إلى: ' + (nextNames.join('، ') || 'غير مسند'));
        saveSandboxDb(db);
        return { success: true, message: 'تم تحديث إسناد الموظفين.', data: { assignedEmployeeIds: nextIds, assignedEmployeeNames: nextNames }, error: null };
      }

      case 'removeAssignment': {
        if (!core.canUserPerform(session.user, 'assign_employees')) {
          return { success: false, message: 'FORBIDDEN: ليس لديك صلاحية.', data: null, error: 'FORBIDDEN' };
        }
        var rRem = db.reservations.find(function (r) { return r.id === payload.reservationId; });
        if (!rRem) return { success: false, message: 'الحجز غير موجود.', data: null, error: 'NOT_FOUND' };
        db.assignments.forEach(function (a) {
          if (a.reservationId === rRem.id && a.employeeId === payload.employeeId && a.status === 'active') {
            a.status = 'removed';
            a.updatedAt = new Date().toISOString();
          }
        });
        var keptIds = [];
        var keptNames = [];
        (rRem.assignedEmployeeIds || []).forEach(function (id, idx) {
          if (id !== payload.employeeId) {
            keptIds.push(id);
            if (rRem.assignedEmployeeNames[idx]) keptNames.push(rRem.assignedEmployeeNames[idx]);
          }
        });
        rRem.assignedEmployeeIds = keptIds;
        rRem.assignedEmployeeNames = keptNames;
        appendSandboxActivity(db, session.user, 'إزالة موظف من المتابعة', 'Reservation', rRem.reservationNumber, 'إزالة موظف من المتابعة');
        saveSandboxDb(db);
        return { success: true, message: 'تمت إزالة الموظف.', data: { assignedEmployeeIds: keptIds, assignedEmployeeNames: keptNames }, error: null };
      }

      case 'claimReservation': {
        var rClm = db.reservations.find(function (r) { return r.id === payload.reservationId; });
        if (!rClm) return { success: false, message: 'الحجز غير موجود.', data: null, error: 'NOT_FOUND' };
        var clmRes = core.claimReservationRecord(rClm, session.user);
        rClm.assignedEmployeeIds = clmRes.assignedEmployeeIds;
        rClm.assignedEmployeeNames = clmRes.assignedEmployeeNames;
        rClm.updatedAt = new Date().toISOString();
        if (clmRes.added) {
          db.assignments.push({
            id: genId('ASN'),
            reservationId: rClm.id,
            reservationNumber: rClm.reservationNumber,
            employeeId: session.employeeId,
            employeeName: session.user.name,
            assignedById: session.employeeId,
            assignedByName: session.user.name,
            roleType: rClm.assignedEmployeeIds.length === 1 ? 'primary' : 'collaborator',
            status: 'active',
            assignedAt: rClm.updatedAt,
            updatedAt: rClm.updatedAt
          });
          appendSandboxActivity(db, session.user, 'استلام حجز', 'Reservation', rClm.reservationNumber, 'استلام ذاتي بواسطة ' + session.user.name);
        }
        saveSandboxDb(db);
        return { success: true, message: 'تم استلام الحجز وإضافته لقائمتك بنجاح.', data: { assignedEmployeeIds: rClm.assignedEmployeeIds, assignedEmployeeNames: rClm.assignedEmployeeNames }, error: null };
      }

      case 'unclaimReservation': {
        var rUnc = db.reservations.find(function (r) { return r.id === payload.reservationId; });
        if (!rUnc) return { success: false, message: 'الحجز غير موجود.', data: null, error: 'NOT_FOUND' };
        var uncRes = core.unclaimReservationRecord(rUnc, session.employeeId);
        db.assignments.forEach(function (a) {
          if (a.reservationId === rUnc.id && a.employeeId === session.employeeId && a.status === 'active') {
            a.status = 'unclaimed';
            a.updatedAt = new Date().toISOString();
          }
        });
        rUnc.assignedEmployeeIds = uncRes.assignedEmployeeIds;
        rUnc.assignedEmployeeNames = uncRes.assignedEmployeeNames;
        rUnc.updatedAt = new Date().toISOString();
        appendSandboxActivity(db, session.user, 'إلغاء استلام حجز', 'Reservation', rUnc.reservationNumber, 'إلغاء الاستلام الذاتي بواسطة ' + session.user.name);
        saveSandboxDb(db);
        return { success: true, message: 'تم إلغاء استلام الحجز من حسابك.', data: { assignedEmployeeIds: rUnc.assignedEmployeeIds, assignedEmployeeNames: rUnc.assignedEmployeeNames }, error: null };
      }

      case 'quickUpdateReservationStatus': {
        var rQst = db.reservations.find(function (r) { return r.id === payload.reservationId; });
        if (!rQst) return { success: false, message: 'الحجز غير موجود.', data: null, error: 'NOT_FOUND' };
        if (!payload.status || core.FOLLOWUP_STATUSES.indexOf(payload.status) === -1) {
          return { success: false, message: 'حالة الحجز غير صالحة.', data: null, error: 'VALIDATION' };
        }
        var nowQst = new Date();
        var noteQst = String(payload.note || '').trim();
        var actionQst = 'تحديث سريع للحالة إلى: ' + payload.status;
        var fuQst = {
          id: genId('FU'),
          reservationId: rQst.id,
          reservationNumber: rQst.reservationNumber,
          customerName: rQst.customerName,
          employeeId: session.employeeId,
          employeeName: session.user.name,
          status: payload.status,
          action: actionQst,
          notes: noteQst,
          followUpDate: nowQst.toISOString().substring(0, 10),
          followUpTime: nowQst.toTimeString().substring(0, 8),
          createdAt: nowQst.toISOString()
        };
        db.followUps.unshift(fuQst);
        rQst.internalStatus = payload.status;
        rQst.lastUpdateText = noteQst ? (actionQst + ' — ' + noteQst) : actionQst;
        rQst.lastUpdatedById = session.employeeId;
        rQst.lastUpdatedByName = session.user.name;
        rQst.lastUpdatedAt = fuQst.createdAt;
        rQst.updatedAt = fuQst.createdAt;
        var empQst = db.employees.find(function (e) { return e.id === session.employeeId; });
        if (empQst) empQst.lastActivity = fuQst.createdAt;
        appendSandboxActivity(db, session.user, 'تعديل حالة', 'Reservation', rQst.reservationNumber, 'تحديث مباشر إلى: ' + payload.status + (noteQst ? ' | ' + noteQst : ''));
        saveSandboxDb(db);
        return { success: true, message: 'تم تحديث حالة الحجز بنجاح.', data: { reservation: rQst, followUp: fuQst }, error: null };
      }

      case 'updateReservationDetails': {
        if (!core.canUserPerform(session.user, 'edit_reservation_details')) {
          return { success: false, message: 'FORBIDDEN: صلاحية المشرف أو المدير العام فقط.', data: null, error: 'FORBIDDEN' };
        }
        var rEdit = db.reservations.find(function (r) { return r.id === payload.reservationId; });
        if (!rEdit) return { success: false, message: 'الحجز غير موجود.', data: null, error: 'NOT_FOUND' };
        [
          'customerName', 'customerPhone', 'companyName', 'branchName',
          'carName', 'plateNumber', 'startDate', 'endDate',
          'pickupTypeAr', 'returnTypeAr', 'lastUpdateText'
        ].forEach(function (field) {
          if (payload[field] !== undefined) rEdit[field] = String(payload[field] || '').trim();
        });
        if (payload.daysCount !== undefined) rEdit.daysCount = Math.max(1, Number(payload.daysCount || 1));
        if (payload.baseAmount !== undefined) rEdit.baseAmount = Number(payload.baseAmount || 0);
        if (payload.extensionsAmount !== undefined) rEdit.extensionsAmount = Number(payload.extensionsAmount || 0);
        if (payload.totalAmount !== undefined) rEdit.totalAmount = Number(payload.totalAmount || 0);
        if (payload.internalStatus && core.FOLLOWUP_STATUSES.indexOf(payload.internalStatus) !== -1) {
          rEdit.internalStatus = payload.internalStatus;
        }
        if (payload.priority && core.PROBLEM_PRIORITIES.indexOf(payload.priority) !== -1) {
          rEdit.priority = payload.priority;
        }
        rEdit.lastUpdatedById = session.employeeId;
        rEdit.lastUpdatedByName = session.user.name;
        rEdit.lastUpdatedAt = new Date().toISOString();
        rEdit.updatedAt = rEdit.lastUpdatedAt;
        appendSandboxActivity(db, session.user, 'تعديل تفاصيل الحجز', 'Reservation', rEdit.reservationNumber, 'تعديل تفاصيل الحجز بواسطة ' + session.user.name);
        saveSandboxDb(db);
        return { success: true, message: 'تم حفظ تعديلات تفاصيل الحجز.', data: rEdit, error: null };
      }

      case 'addFollowUp': {
        var rFu = db.reservations.find(function (r) { return r.id === payload.reservationId; });
        if (!rFu) return { success: false, message: 'الحجز غير موجود.', data: null, error: 'NOT_FOUND' };
        if (!payload.status || core.FOLLOWUP_STATUSES.indexOf(payload.status) === -1) {
          return { success: false, message: 'يرجى اختيار حالة متابعة صالحة.', data: null, error: 'VALIDATION' };
        }
        if (!String(payload.action || '').trim()) {
          return { success: false, message: 'يرجى كتابة الإجراء المتخذ.', data: null, error: 'VALIDATION' };
        }
        var nowFu = new Date();
        var newFu = {
          id: genId('FU'),
          reservationId: rFu.id,
          reservationNumber: rFu.reservationNumber,
          customerName: rFu.customerName,
          employeeId: session.employeeId,
          employeeName: session.user.name,
          status: payload.status,
          action: String(payload.action).trim(),
          notes: String(payload.notes || '').trim(),
          followUpDate: nowFu.toISOString().substring(0, 10),
          followUpTime: nowFu.toTimeString().substring(0, 8),
          createdAt: nowFu.toISOString()
        };
        db.followUps.unshift(newFu);
        var changedStatus = rFu.internalStatus !== newFu.status;
        rFu.internalStatus = newFu.status;
        rFu.lastUpdateText = newFu.action + (newFu.notes ? ' — ' + newFu.notes : '');
        rFu.lastUpdatedById = session.employeeId;
        rFu.lastUpdatedByName = session.user.name;
        rFu.lastUpdatedAt = newFu.createdAt;
        rFu.updatedAt = newFu.createdAt;

        var empSelf = db.employees.find(function (e) { return e.id === session.employeeId; });
        if (empSelf) empSelf.lastActivity = newFu.createdAt;

        appendSandboxActivity(db, session.user, changedStatus ? 'تعديل حالة' : 'إضافة متابعة', 'Reservation', rFu.reservationNumber, 'الحالة: ' + newFu.status + ' | ' + newFu.action);
        if (newFu.notes) {
          appendSandboxActivity(db, session.user, 'إضافة ملاحظة', 'Reservation', rFu.reservationNumber, newFu.notes);
        }
        (rFu.assignedEmployeeIds || []).forEach(function (eid) {
          if (eid !== session.employeeId) {
            pushSandboxNotification(
              db, eid, '', changedStatus ? 'status_change' : 'reservation_update',
              changedStatus ? 'تغيير حالة حجز' : 'تحديث متابعة على حجز مشترك',
              session.user.name + ' حدّث الحجز ' + rFu.reservationNumber + ' إلى: ' + newFu.status,
              'Reservation', rFu.id
            );
          }
        });
        saveSandboxDb(db);
        return { success: true, message: 'تم حفظ المتابعة بنجاح.', data: newFu, error: null };
      }

      case 'updateFollowUp': {
        var fuEdit = db.followUps.find(function (f) { return f.id === payload.followUpId; });
        if (!fuEdit) return { success: false, message: 'سجل المتابعة غير موجود.', data: null, error: 'NOT_FOUND' };
        if (fuEdit.employeeId !== session.employeeId && !core.canUserPerform(session.user, 'edit_any_followup')) {
          return { success: false, message: 'FORBIDDEN: لا يمكنك تعديل متابعة موظف آخر.', data: null, error: 'FORBIDDEN' };
        }
        if (payload.status && core.FOLLOWUP_STATUSES.indexOf(payload.status) !== -1) fuEdit.status = payload.status;
        if (payload.action && String(payload.action).trim()) fuEdit.action = String(payload.action).trim();
        if (payload.notes !== undefined) fuEdit.notes = String(payload.notes || '').trim();
        if (payload.syncToReservation) {
          var parentRes = db.reservations.find(function (r) { return r.id === fuEdit.reservationId; });
          if (parentRes) {
            parentRes.internalStatus = fuEdit.status;
            parentRes.lastUpdateText = fuEdit.action + (fuEdit.notes ? ' — ' + fuEdit.notes : '');
            parentRes.lastUpdatedById = session.employeeId;
            parentRes.lastUpdatedByName = session.user.name;
            parentRes.lastUpdatedAt = new Date().toISOString();
            parentRes.updatedAt = parentRes.lastUpdatedAt;
          }
        }
        appendSandboxActivity(db, session.user, 'تحديث متابعة', 'FollowUp', fuEdit.id, 'تعديل متابعة الحجز ' + fuEdit.reservationNumber);
        saveSandboxDb(db);
        return { success: true, message: 'تم تعديل المتابعة بنجاح.', data: fuEdit, error: null };
      }

      case 'getMyFollowUps': {
        return {
          success: true,
          message: '',
          data: {
            followUps: db.followUps.filter(function (f) { return f.employeeId === session.employeeId; }),
            assignedReservations: db.reservations.filter(function (r) { return (r.assignedEmployeeIds || []).indexOf(session.employeeId) !== -1; })
          },
          error: null
        };
      }

      case 'getTeamFollowUps': {
        var teamFus = db.followUps.filter(function (f) {
          if (payload.employeeId && f.employeeId !== payload.employeeId) return false;
          if (payload.status && f.status !== payload.status) return false;
          if (payload.date && f.followUpDate !== payload.date) return false;
          return true;
        });
        return { success: true, message: '', data: { items: teamFus, total: teamFus.length }, error: null };
      }

      case 'createProblem': {
        var rPrb = db.reservations.find(function (r) { return r.id === payload.reservationId; });
        if (!rPrb) return { success: false, message: 'الحجز غير موجود.', data: null, error: 'NOT_FOUND' };
        var desc = String(payload.description || '').trim();
        var prio = payload.priority || 'متوسط';
        if (!desc) return { success: false, message: 'يرجى كتابة وصف المشكلة.', data: null, error: 'VALIDATION' };

        var assignIds = (payload.assignedEmployeeIds && payload.assignedEmployeeIds.length) ? payload.assignedEmployeeIds : [session.employeeId];
        var assignNames = assignIds.map(function (id) {
          var e = db.employees.find(function (x) { return x.id === id; });
          return e ? e.name : session.user.name;
        });

        var nowPrb = new Date().toISOString();
        var newProblem = {
          id: genId('PRB'),
          problemNumber: 'PRB-' + String(Date.now()).slice(-6),
          reservationId: rPrb.id,
          reservationNumber: rPrb.reservationNumber,
          customerName: rPrb.customerName,
          createdById: session.employeeId,
          createdByName: session.user.name,
          assignedEmployeeIds: assignIds,
          assignedEmployeeNames: assignNames,
          description: desc,
          priority: prio,
          status: 'جديدة',
          createdAt: nowPrb,
          updatedAt: nowPrb
        };
        db.problems.unshift(newProblem);
        db.problemUpdates.unshift({
          id: genId('PRBU'),
          problemId: newProblem.id,
          reservationNumber: rPrb.reservationNumber,
          employeeId: session.employeeId,
          employeeName: session.user.name,
          previousStatus: '',
          newStatus: 'جديدة',
          previousPriority: '',
          newPriority: prio,
          note: 'تم إنشاء المشكلة: ' + desc,
          createdAt: nowPrb
        });
        rPrb.hasProblem = true;
        if (prio === 'مرتفع') rPrb.priority = 'مرتفع';
        rPrb.updatedAt = nowPrb;

        appendSandboxActivity(db, session.user, 'إنشاء مشكلة', 'Problem', newProblem.problemNumber, 'حجز ' + rPrb.reservationNumber + ' | الأولوية: ' + prio);

        assignIds.forEach(function (eid) {
          if (eid !== session.employeeId) {
            pushSandboxNotification(db, eid, '', 'new_problem', 'مشكلة جديدة مسندة إليك', 'مشكلة على الحجز ' + rPrb.reservationNumber + ': ' + desc, 'Problem', newProblem.id);
          }
        });

        if (prio === 'مرتفع') {
          db.employees.forEach(function (emp) {
            if (emp.status === 'active' && (emp.role === 'supervisor' || emp.role === 'general_manager')) {
              pushSandboxNotification(
                db, emp.id, emp.role, 'high_priority_problem',
                'تنبيه: مشكلة بأولوية مرتفعة',
                'تم فتح مشكلة مرتفعة الأولوية للحجز ' + rPrb.reservationNumber + ' (' + rPrb.customerName + ') بواسطة ' + session.user.name,
                'Problem', newProblem.id
              );
            }
          });
        }
        saveSandboxDb(db);
        return { success: true, message: 'تم تحويل الحجز إلى مشكلة.', data: newProblem, error: null };
      }

      case 'updateProblem': {
        var prb = db.problems.find(function (p) { return p.id === payload.problemId; });
        if (!prb) return { success: false, message: 'المشكلة غير موجودة.', data: null, error: 'NOT_FOUND' };
        var prevStatus = prb.status;
        var prevPrio = prb.priority;
        var prevDesc = prb.description;
        prb.status = payload.status || prb.status;
        prb.priority = payload.priority || prb.priority;
        if (core.canUserPerform(session.user, 'edit_ticket_details')) {
          if (payload.description !== undefined && String(payload.description).trim()) {
            prb.description = String(payload.description).trim();
          }
          if (payload.customerName !== undefined && String(payload.customerName).trim()) {
            prb.customerName = String(payload.customerName).trim();
          }
        }
        if (Array.isArray(payload.assignedEmployeeIds)) {
          prb.assignedEmployeeIds = payload.assignedEmployeeIds;
          prb.assignedEmployeeNames = payload.assignedEmployeeIds.map(function (id) {
            var e = db.employees.find(function (x) { return x.id === id; });
            return e ? e.name : '';
          }).filter(Boolean);
        }
        prb.updatedAt = new Date().toISOString();
        db.problemUpdates.unshift({
          id: genId('PRBU'),
          problemId: prb.id,
          reservationNumber: prb.reservationNumber,
          employeeId: session.employeeId,
          employeeName: session.user.name,
          previousStatus: prevStatus,
          newStatus: prb.status,
          previousPriority: prevPrio,
          newPriority: prb.priority,
          note: String(payload.note || (prb.description !== prevDesc ? 'تعديل بيانات التذكرة' : ('تحديث الحالة إلى ' + prb.status))),
          createdAt: prb.updatedAt
        });
        if (prb.description !== prevDesc) {
          appendSandboxActivity(db, session.user, 'تعديل بيانات التذكرة', 'Problem', prb.problemNumber, 'تم تحديث وصف التذكرة');
        }
        if (prevPrio !== prb.priority) {
          appendSandboxActivity(db, session.user, 'تغيير أولوية', 'Problem', prb.problemNumber, 'من ' + prevPrio + ' إلى ' + prb.priority);
        }
        if (prevStatus !== prb.status) {
          appendSandboxActivity(db, session.user, 'تعديل حالة', 'Problem', prb.problemNumber, 'من ' + prevStatus + ' إلى ' + prb.status);
        }
        var linkedRes = db.reservations.find(function (r) { return r.id === prb.reservationId; });
        if (linkedRes) {
          var stillOpen = db.problems.some(function (p) {
            return p.reservationId === linkedRes.id && p.status !== 'مغلقة' && p.status !== 'تم الحل';
          });
          linkedRes.hasProblem = stillOpen;
        }
        saveSandboxDb(db);
        return { success: true, message: 'تم تحديث التذكرة / المشكلة بنجاح.', data: prb, error: null };
      }

      case 'getProblems': {
        var prbList = db.problems.filter(function (p) {
          if (payload.status && p.status !== payload.status) return false;
          if (payload.priority && p.priority !== payload.priority) return false;
          if (payload.employeeId && (p.assignedEmployeeIds || []).indexOf(payload.employeeId) === -1) return false;
          if (payload.search) {
            var h = (p.problemNumber + ' ' + p.reservationNumber + ' ' + p.customerName + ' ' + p.description).toLowerCase();
            if (h.indexOf(String(payload.search).toLowerCase()) === -1) return false;
          }
          return true;
        }).map(function (p) {
          return Object.assign({}, p, {
            updates: db.problemUpdates.filter(function (u) { return u.problemId === p.id; })
          });
        });
        return { success: true, message: '', data: { items: prbList, total: prbList.length }, error: null };
      }

      case 'getEmployees': {
        var empRows = db.employees.map(function (e) {
          var c = sanitizeEmp(e);
          c.reservationsCount = db.reservations.filter(function (r) { return (r.assignedEmployeeIds || []).indexOf(e.id) !== -1; }).length;
          c.followUpsCount = db.followUps.filter(function (f) { return f.employeeId === e.id; }).length;
          c.problemsCount = db.problems.filter(function (p) { return (p.assignedEmployeeIds || []).indexOf(e.id) !== -1; }).length;
          return c;
        });
        return {
          success: true,
          message: '',
          data: {
            items: empRows,
            total: empRows.length,
            rolePresets: core.normalizeRolePresets(db.settings.job_role_presets),
            customPermissions: Array.isArray(db.settings.permissions_catalog_custom) ? db.settings.permissions_catalog_custom : []
          },
          error: null
        };
      }

      case 'getEmployeeDetails': {
        var targetEmpId = String(payload.employeeId || '').trim() || session.employeeId;
        if (targetEmpId !== session.employeeId && !core.canUserPerform(session.user, 'view_employees')) {
          return { success: false, message: 'FORBIDDEN: لا يمكنك استعراض ملف موظف آخر.', data: null, error: 'FORBIDDEN' };
        }
        var targetEmp = db.employees.find(function (e) { return e.id === targetEmpId; });
        if (!targetEmp) return { success: false, message: 'الموظف غير موجود.', data: null, error: 'NOT_FOUND' };

        var empFollowUps = db.followUps.filter(function (f) { return f.employeeId === targetEmpId; })
          .sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });

        var touchedResIds = {};
        empFollowUps.forEach(function (f) { touchedResIds[f.reservationId] = true; });

        var empProblems = db.problems.filter(function (p) {
          return p.createdById === targetEmpId || (p.assignedEmployeeIds || []).indexOf(targetEmpId) !== -1;
        });

        var statusCounts = {};
        var customerSet = {};
        var empReservations = db.reservations.filter(function (r) {
          return (r.assignedEmployeeIds || []).indexOf(targetEmpId) !== -1 || touchedResIds[r.id];
        }).map(function (r) {
          customerSet[String(r.customerPhone || r.customerName || '')] = true;
          var st = r.internalStatus || 'تم الإنشاء';
          statusCounts[st] = (statusCounts[st] || 0) + 1;
          var resFus = db.followUps.filter(function (f) { return f.reservationId === r.id; })
            .sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
          var myResFus = resFus.filter(function (f) { return f.employeeId === targetEmpId; });
          var resPrbs = db.problems.filter(function (p) { return p.reservationId === r.id; });
          return {
            id: r.id,
            reservationNumber: r.reservationNumber,
            customerName: r.customerName,
            customerPhone: r.customerPhone,
            companyName: r.companyName,
            branchName: r.branchName,
            carName: r.carName,
            startDate: r.startDate,
            endDate: r.endDate,
            daysCount: Number(r.daysCount || 1),
            totalAmount: Number(r.totalAmount || 0),
            originalStatusAr: r.originalStatusAr,
            internalStatus: r.internalStatus,
            priority: r.priority,
            hasProblem: Boolean(r.hasProblem),
            lastUpdateText: r.lastUpdateText,
            lastUpdatedByName: r.lastUpdatedByName,
            lastUpdatedAt: r.lastUpdatedAt,
            followUpsCount: resFus.length,
            myFollowUpsCount: myResFus.length,
            problemsCount: resPrbs.length,
            latestFollowUp: resFus.length > 0 ? resFus[0] : null
          };
        }).sort(function (a, b) { return String(b.lastUpdatedAt).localeCompare(String(a.lastUpdatedAt)); });

        return {
          success: true,
          message: '',
          data: {
            employee: sanitizeEmp(targetEmp),
            assignedReservations: empReservations,
            followUps: empFollowUps,
            problems: empProblems,
            stats: {
              uniqueCustomersCount: Object.keys(customerSet).length,
              reservationsCount: empReservations.length,
              followUpsCount: empFollowUps.length,
              problemsCount: empProblems.length,
              statusCounts: statusCounts
            }
          },
          error: null
        };
      }

      case 'createEmployee': {
        if (!core.canUserPerform(session.user, 'manage_employees')) {
          return { success: false, message: 'FORBIDDEN: صلاحية المدير العام فقط.', data: null, error: 'FORBIDDEN' };
        }
        var unameNew = String(payload.username || '').trim().toLowerCase();
        var passNew = String(payload.password || '');
        if (!payload.name || !unameNew || passNew.length < 6) {
          return { success: false, message: 'يرجى إدخال الاسم واسم المستخدم وكلمة مرور من 6 أحرف على الأقل.', data: null, error: 'VALIDATION' };
        }
        if (db.employees.some(function (e) { return e.username.toLowerCase() === unameNew; })) {
          return { success: false, message: 'اسم المستخدم مسجل مسبقًا.', data: null, error: 'DUPLICATE' };
        }
        var saltNew = genId('SLT');
        var newRole = payload.role || 'agent';
        var newPerms = Array.isArray(payload.permissions) && payload.permissions.length
          ? payload.permissions.slice()
          : core.resolveEffectivePermissions(newRole);
        var newEmp = {
          id: genId('EMP'),
          name: String(payload.name).trim(),
          username: unameNew,
          salt: saltNew,
          passwordHash: simpleHash(saltNew + ':' + passNew),
          phone: String(payload.phone || '').trim(),
          email: String(payload.email || '').trim(),
          jobTitle: String(payload.jobTitle || 'موظف خدمة العملاء').trim(),
          role: newRole,
          permissions: newPerms,
          status: 'active',
          lastActivity: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.employees.push(newEmp);
        appendSandboxActivity(db, session.user, 'إنشاء موظف', 'Employee', newEmp.id, 'إنشاء حساب للموظف: ' + newEmp.name);
        saveSandboxDb(db);
        return { success: true, message: 'تم إنشاء حساب الموظف بنجاح.', data: sanitizeEmp(newEmp), error: null };
      }

      case 'updateEmployee': {
        if (!core.canUserPerform(session.user, 'manage_employees')) {
          return { success: false, message: 'FORBIDDEN: صلاحية المدير العام فقط.', data: null, error: 'FORBIDDEN' };
        }
        var empEdit = db.employees.find(function (e) { return e.id === payload.employeeId; });
        if (!empEdit) return { success: false, message: 'الموظف غير موجود.', data: null, error: 'NOT_FOUND' };
        if (payload.name) empEdit.name = String(payload.name).trim();
        if (payload.phone !== undefined) empEdit.phone = String(payload.phone).trim();
        if (payload.email !== undefined) empEdit.email = String(payload.email).trim();
        if (payload.jobTitle) empEdit.jobTitle = String(payload.jobTitle).trim();
        if (payload.role) empEdit.role = payload.role;
        if (Array.isArray(payload.permissions)) {
          empEdit.permissions = payload.permissions.slice();
        }
        if (payload.status) {
          empEdit.status = payload.status;
          if (payload.status === 'disabled') {
            db.sessions.forEach(function (s) { if (s.employeeId === empEdit.id) s.isRevoked = true; });
          }
        }
        if (payload.newPassword && String(payload.newPassword).length >= 6) {
          var s2 = genId('SLT');
          empEdit.salt = s2;
          empEdit.passwordHash = simpleHash(s2 + ':' + payload.newPassword);
          db.sessions.forEach(function (s) { if (s.employeeId === empEdit.id) s.isRevoked = true; });
        }
        empEdit.updatedAt = new Date().toISOString();
        appendSandboxActivity(db, session.user, 'تحديث موظف', 'Employee', empEdit.id, 'تحديث بيانات وصلاحيات الموظف ' + empEdit.name);
        saveSandboxDb(db);
        return { success: true, message: 'تم تحديث بيانات الموظف.', data: sanitizeEmp(empEdit), error: null };
      }

      case 'disableEmployee': {
        if (!core.canUserPerform(session.user, 'manage_employees')) {
          return { success: false, message: 'FORBIDDEN: صلاحية المدير العام فقط.', data: null, error: 'FORBIDDEN' };
        }
        if (payload.employeeId === session.employeeId) {
          return { success: false, message: 'لا يمكنك إيقاف حسابك الحالي.', data: null, error: 'VALIDATION' };
        }
        var empDis = db.employees.find(function (e) { return e.id === payload.employeeId; });
        if (!empDis) return { success: false, message: 'الموظف غير موجود.', data: null, error: 'NOT_FOUND' };
        empDis.status = payload.status === 'active' ? 'active' : 'disabled';
        empDis.updatedAt = new Date().toISOString();
        if (empDis.status === 'disabled') {
          db.sessions.forEach(function (s) { if (s.employeeId === empDis.id) s.isRevoked = true; });
        }
        appendSandboxActivity(db, session.user, empDis.status === 'disabled' ? 'إيقاف نشاط موظف' : 'تشغيل نشاط موظف', 'Employee', empDis.id, empDis.name);
        saveSandboxDb(db);
        return { success: true, message: empDis.status === 'disabled' ? 'تم إيقاف نشاط الموظف بنجاح.' : 'تم تشغيل نشاط الموظف بنجاح.', data: sanitizeEmp(empDis), error: null };
      }

      case 'saveRolePreset': {
        if (!core.canUserPerform(session.user, 'manage_employees')) {
          return { success: false, message: 'FORBIDDEN: صلاحية المدير العام فقط.', data: null, error: 'FORBIDDEN' };
        }
        try {
          var resPreset = core.upsertRolePreset(db.settings.job_role_presets, payload);
          db.settings.job_role_presets = resPreset.presets;
          appendSandboxActivity(db, session.user, resPreset.isNew ? 'إضافة صلاحية جاهزة' : 'تعديل صلاحية جاهزة', 'RolePreset', resPreset.saved.id, resPreset.saved.label);
          saveSandboxDb(db);
          return {
            success: true,
            message: resPreset.isNew ? 'تمت إضافة الصلاحية الجاهزة بنجاح.' : 'تم تعديل الصلاحية الجاهزة بنجاح.',
            data: { rolePresets: resPreset.presets, savedPreset: resPreset.saved },
            error: null
          };
        } catch (errPreset) {
          return { success: false, message: errPreset.message, data: null, error: 'VALIDATION' };
        }
      }

      case 'deleteRolePreset': {
        if (!core.canUserPerform(session.user, 'manage_employees')) {
          return { success: false, message: 'FORBIDDEN: صلاحية المدير العام فقط.', data: null, error: 'FORBIDDEN' };
        }
        try {
          var delTargetId = payload.presetId || payload.id;
          var nextPresets = core.removeRolePreset(db.settings.job_role_presets, delTargetId);
          db.settings.job_role_presets = nextPresets;
          appendSandboxActivity(db, session.user, 'حذف صلاحية جاهزة', 'RolePreset', String(delTargetId), 'حذف قالب صلاحية جاهزة');
          saveSandboxDb(db);
          return { success: true, message: 'تم حذف الصلاحية الجاهزة.', data: { rolePresets: nextPresets }, error: null };
        } catch (errDel) {
          return { success: false, message: errDel.message, data: null, error: 'VALIDATION' };
        }
      }

      case 'resetRolePresets': {
        if (!core.canUserPerform(session.user, 'manage_employees')) {
          return { success: false, message: 'FORBIDDEN: صلاحية المدير العام فقط.', data: null, error: 'FORBIDDEN' };
        }
        db.settings.job_role_presets = core.JOB_ROLE_PRESETS.slice();
        appendSandboxActivity(db, session.user, 'استعادة الصلاحيات الجاهزة', 'RolePreset', 'defaults', 'استعادة القوالب الافتراضية');
        saveSandboxDb(db);
        return { success: true, message: 'تمت استعادة الصلاحيات الجاهزة الافتراضية.', data: { rolePresets: db.settings.job_role_presets }, error: null };
      }

      case 'savePermissionDefinition': {
        if (!core.canUserPerform(session.user, 'manage_employees')) {
          return { success: false, message: 'FORBIDDEN: صلاحية المدير العام فقط.', data: null, error: 'FORBIDDEN' };
        }
        try {
          var permRes = core.upsertPermissionDefinition(db.settings.permissions_catalog_custom, payload);
          db.settings.permissions_catalog_custom = permRes.customPermissions;
          appendSandboxActivity(db, session.user, 'تحديث الصلاحيات', 'Permission', permRes.saved.key, permRes.saved.label);
          saveSandboxDb(db);
          return {
            success: true,
            message: 'تم حفظ الصلاحية بنجاح.',
            data: { customPermissions: permRes.customPermissions, saved: permRes.saved },
            error: null
          };
        } catch (errPerm) {
          return { success: false, message: errPerm.message, data: null, error: 'VALIDATION' };
        }
      }

      case 'deletePermissionDefinition': {
        if (!core.canUserPerform(session.user, 'manage_employees')) {
          return { success: false, message: 'FORBIDDEN: صلاحية المدير العام فقط.', data: null, error: 'FORBIDDEN' };
        }
        try {
          var delPermRes = core.removePermissionDefinition(db.settings.permissions_catalog_custom, payload.key);
          db.settings.permissions_catalog_custom = delPermRes.customPermissions;
          if (delPermRes.removedKey) {
            db.settings.job_role_presets = core.normalizeRolePresets(db.settings.job_role_presets).map(function (p) {
              return Object.assign({}, p, {
                permissions: (p.permissions || []).filter(function (k) { return k !== delPermRes.removedKey; })
              });
            });
          }
          appendSandboxActivity(db, session.user, 'حذف / إعادة ضبط صلاحية', 'Permission', String(payload.key), '');
          saveSandboxDb(db);
          return {
            success: true,
            message: delPermRes.resetBuiltIn ? 'تمت استعادة المسمى الافتراضي للصلاحية.' : 'تم حذف الصلاحية المخصصة.',
            data: {
              customPermissions: db.settings.permissions_catalog_custom,
              rolePresets: core.normalizeRolePresets(db.settings.job_role_presets)
            },
            error: null
          };
        } catch (errDelP) {
          return { success: false, message: errDelP.message, data: null, error: 'VALIDATION' };
        }
      }

      case 'getActivityLogs': {
        var logs = db.activityLog.filter(function (l) {
          if (!core.canUserPerform(session.user, 'view_all_logs') && l.userId !== session.employeeId) return false;
          if (payload.userId && l.userId !== payload.userId) return false;
          if (payload.actionType && l.actionType !== payload.actionType) return false;
          if (payload.date && l.logDate !== payload.date) return false;
          return true;
        });
        return { success: true, message: '', data: { items: logs, total: logs.length }, error: null };
      }

      case 'getNotifications': {
        var myNotifs = db.notifications.filter(function (n) {
          return n.recipientEmployeeId === session.employeeId || (!n.recipientEmployeeId && n.recipientRole === session.role);
        });
        var unread = myNotifs.filter(function (n) { return !n.isRead; }).length;
        return { success: true, message: '', data: { items: myNotifs.slice(0, 50), unreadCount: unread }, error: null };
      }

      case 'markNotificationRead': {
        db.notifications.forEach(function (n) {
          var mine = n.recipientEmployeeId === session.employeeId || (!n.recipientEmployeeId && n.recipientRole === session.role);
          if (mine && (payload.markAll || n.id === payload.notificationId)) n.isRead = true;
        });
        saveSandboxDb(db);
        return { success: true, message: '', data: { updated: true }, error: null };
      }

      case 'testConnection': {
        if (!core.canAccessApi(session.user) || !core.canUserPerform(session.user, 'sync_data')) {
          return { success: false, message: 'FORBIDDEN: صلاحيات API مخصصة للمدير العام والمشرف فقط.', data: null, error: 'FORBIDDEN' };
        }
        return {
          success: true,
          message: 'وضع المعاينة المحلية (Sandbox): اربط رابط Google Apps Script /exec في الإعدادات للاتصال الفعلي بـ Rental Gate API.',
          data: { connected: true, hasToken: false, mode: 'sandbox', checkedAt: new Date().toISOString() },
          error: null
        };
      }

      case 'pullReservations': {
        if (!core.canUserPerform(session.user, 'pull_reservations')) {
          return { success: false, message: 'FORBIDDEN: ليس لديك صلاحية سحب الحجوزات.', data: null, error: 'FORBIDDEN' };
        }
        var pullIdx = db.syncLog.length;
        var pullNum = 'RG-2026-' + (8850 + pullIdx);
        var existingPull = db.reservations.find(function (r) { return r.reservationNumber === pullNum; });
        var pullNames = ['ياسر عبدالرحمن التميمي', 'سلطان فهد الشهري', 'ماجد سعد الزهراني', 'تركي ناصر العتيبي'];
        var pullCars = ['فورد تورس 2026', 'تويوتا كامري 2026', 'نيسان ألتيما 2026', 'كيا K5 2026'];
        var pullIncoming = {
          reservation_number: pullNum,
          customer_name: pullNames[pullIdx % pullNames.length],
          customer_phone: '05077441' + String(10 + (pullIdx % 89)),
          company_name: pullIdx % 2 === 0 ? 'ذيب لتأجير السيارات' : 'بدجت السعودية',
          branch_name: pullIdx % 2 === 0 ? 'مطار الملك خالد - الرياض' : 'مطار الملك عبدالعزيز - جدة',
          car_name: pullCars[pullIdx % pullCars.length],
          plate_number: 'و هـ ي ' + String(6201 + pullIdx),
          start_date: todayIso(0),
          end_date: todayIso(3),
          days_count: 3,
          status: 'confirmed',
          pickup_type: 'airport',
          return_type: 'branch',
          total_price: 1350 + (pullIdx % 3) * 150
        };
        var mergedPull = core.mergeSyncedReservation(existingPull, pullIncoming, [], session.user);
        if (!existingPull) db.reservations.unshift(mergedPull);
        var pullSyncRec = {
          id: genId('SYNC'),
          triggeredById: session.employeeId,
          triggeredByName: session.user.name,
          status: 'success',
          importedCount: existingPull ? 0 : 1,
          updatedCount: existingPull ? 1 : 0,
          extensionsCount: 0,
          pagesFetched: 1,
          errorMessage: '',
          durationMs: 280,
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString()
        };
        db.syncLog.unshift(pullSyncRec);
        appendSandboxActivity(db, session.user, 'سحب الحجوزات', 'Reservation', pullSyncRec.id, 'سحب الحجوزات: جديد ' + pullSyncRec.importedCount + '، محدث ' + pullSyncRec.updatedCount);
        saveSandboxDb(db);
        return {
          success: true,
          message: 'تم سحب الحجوزات بنجاح.',
          data: {
            importedCount: pullSyncRec.importedCount,
            updatedCount: pullSyncRec.updatedCount,
            extensionsCount: pullSyncRec.extensionsCount,
            finishedAt: pullSyncRec.finishedAt
          },
          error: null
        };
      }

      case 'syncRentalGate': {
        if (!core.canAccessApi(session.user) || !core.canUserPerform(session.user, 'sync_data')) {
          return { success: false, message: 'FORBIDDEN: صلاحيات API مخصصة للمدير العام والمشرف فقط.', data: null, error: 'FORBIDDEN' };
        }
        var sampleResNum = 'RG-2026-' + (8850 + db.syncLog.length);
        var existingByNum = db.reservations.find(function (r) { return r.reservationNumber === sampleResNum; });
        var incoming = {
          reservation_number: sampleResNum,
          customer_name: 'ياسر عبدالرحمن التميمي',
          customer_phone: '0507744112',
          company_name: 'ذيب لتأجير السيارات',
          branch_name: 'مطار الملك خالد - الرياض',
          car_name: 'فورد تورس 2026',
          plate_number: 'و هـ ي 6201',
          start_date: todayIso(0),
          end_date: todayIso(3),
          days_count: 3,
          status: 'confirmed',
          pickup_type: 'airport',
          return_type: 'branch',
          total_price: 1350
        };
        var merged = core.mergeSyncedReservation(existingByNum, incoming, [], session.user);
        if (!existingByNum) db.reservations.unshift(merged);
        var syncRec = {
          id: genId('SYNC'),
          triggeredById: session.employeeId,
          triggeredByName: session.user.name,
          status: 'success',
          importedCount: existingByNum ? 0 : 1,
          updatedCount: existingByNum ? 1 : 0,
          extensionsCount: 0,
          pagesFetched: 1,
          errorMessage: '',
          durationMs: 320,
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString()
        };
        db.syncLog.unshift(syncRec);
        appendSandboxActivity(db, session.user, 'سحب بيانات', 'Sync', syncRec.id, 'مزامنة تجريبية: استيراد ' + syncRec.importedCount);
        saveSandboxDb(db);
        return { success: true, message: 'تمت المزامنة بنجاح.', data: syncRec, error: null };
      }

      case 'getSyncStatus': {
        if (!core.canAccessApi(session.user) || !core.canUserPerform(session.user, 'sync_data')) {
          return { success: false, message: 'FORBIDDEN: صلاحيات API مخصصة للمدير العام والمشرف فقط.', data: null, error: 'FORBIDDEN' };
        }
        return {
          success: true,
          message: '',
          data: {
            hasToken: false,
            mode: 'sandbox',
            autoSyncEnabled: db.settings.auto_sync_enabled !== false,
            autoSyncIntervalHours: Number(db.settings.auto_sync_interval_hours || 12),
            lastSync: db.syncLog[0] || null,
            logs: db.syncLog
          },
          error: null
        };
      }

      case 'getReports': {
        var rType = payload.reportType || 'all_reservations';
        if (payload.logExport) {
          appendSandboxActivity(db, session.user, 'تصدير تقرير', 'Report', rType, 'تصدير تقرير: ' + rType);
          saveSandboxDb(db);
        }
        var filteredRes = core.filterReservations(db.reservations, db.followUps, payload, {
          employeeId: session.employeeId,
          role: session.role,
          user: session.user,
          allowAgentViewAll: db.settings.allow_agent_view_all
        });
        if (rType === 'followups_log') {
          return { success: true, message: '', data: { reportType: rType, rows: db.followUps }, error: null };
        }
        if (rType === 'problems') {
          return { success: true, message: '', data: { reportType: rType, rows: db.problems }, error: null };
        }
        if (rType === 'extensions') {
          return { success: true, message: '', data: { reportType: rType, rows: db.extensions }, error: null };
        }
        if (rType === 'unfollowed') {
          return { success: true, message: '', data: { reportType: rType, rows: filteredRes.filter(function (r) { return !r.isFollowed; }) }, error: null };
        }
        if (rType === 'employee_performance') {
          var perf = db.employees.map(function (emp) {
            return {
              employeeName: emp.name,
              jobTitle: emp.jobTitle,
              role: emp.role,
              assignedReservations: db.reservations.filter(function (r) { return (r.assignedEmployeeIds || []).indexOf(emp.id) !== -1; }).length,
              followUpsCount: db.followUps.filter(function (f) { return f.employeeId === emp.id; }).length,
              problemsCount: db.problems.filter(function (p) { return (p.assignedEmployeeIds || []).indexOf(emp.id) !== -1; }).length,
              lastActivity: emp.lastActivity
            };
          });
          return { success: true, message: '', data: { reportType: rType, rows: perf }, error: null };
        }
        return { success: true, message: '', data: { reportType: rType, rows: filteredRes }, error: null };
      }

      case 'getSettings': {
        if (!core.canAccessApi(session.user)) {
          return { success: false, message: 'FORBIDDEN: إعدادات النظام وAPI مخصصة للمدير العام والمشرف فقط.', data: null, error: 'FORBIDDEN' };
        }
        return {
          success: true,
          message: '',
          data: Object.assign({}, db.settings, {
            auto_sync_enabled: db.settings.auto_sync_enabled !== false,
            auto_sync_interval_hours: Number(db.settings.auto_sync_interval_hours || 12),
            hasRgToken: false
          }),
          error: null
        };
      }

      case 'updateSettings': {
        if (!core.canUserPerform(session.user, 'manage_settings')) {
          return { success: false, message: 'FORBIDDEN: صلاحية المدير العام فقط.', data: null, error: 'FORBIDDEN' };
        }
        if (payload.company_name) db.settings.company_name = String(payload.company_name);
        if (Array.isArray(payload.excluded_statuses)) db.settings.excluded_statuses = payload.excluded_statuses;
        if (payload.session_ttl_hours) db.settings.session_ttl_hours = Number(payload.session_ttl_hours);
        if (typeof payload.allow_agent_view_all === 'boolean') db.settings.allow_agent_view_all = payload.allow_agent_view_all;
        if (payload.default_language) db.settings.default_language = payload.default_language;
        if (typeof payload.auto_sync_enabled === 'boolean') db.settings.auto_sync_enabled = payload.auto_sync_enabled;
        if (payload.auto_sync_interval_hours !== undefined) {
          var hVal = Math.max(1, Math.min(168, Math.round(Number(payload.auto_sync_interval_hours) || 12)));
          db.settings.auto_sync_interval_hours = hVal;
        }
        appendSandboxActivity(
          db,
          session.user,
          'تحديث الإعدادات',
          'Settings',
          'system',
          'تحديث إعدادات النظام (التحديث التلقائي: ' + (db.settings.auto_sync_enabled ? ('كل ' + db.settings.auto_sync_interval_hours + ' ساعة') : 'متوقف') + ')'
        );
        saveSandboxDb(db);
        return { success: true, message: 'تم حفظ الإعدادات.', data: db.settings, error: null };
      }

      default:
        return { success: false, message: 'الإجراء غير مدعوم.', data: null, error: 'UNKNOWN_ACTION' };
    }
  }

  async function callApi(action, payload) {
    var gasUrl = getGasUrl();
    var token = getToken();

    if (!gasUrl) {
      return sandboxExecute(action, token, payload);
    }

    try {
      var response = await fetch(gasUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: action,
          token: token,
          payload: payload || {}
        })
      });

      var text = await response.text();
      var parsed = JSON.parse(text);
      if (!parsed.success && String(parsed.error || '').indexOf('UNAUTHORIZED') === 0) {
        setToken('');
        document.dispatchEvent(new CustomEvent('rg:unauthorized'));
      }
      return parsed;
    } catch (err) {
      return {
        success: false,
        message: 'تعذر الاتصال بخادم Google Apps Script: ' + (err.message || err),
        data: null,
        error: err.message || 'NETWORK_ERROR'
      };
    }
  }

  async function pingGasUrl(url) {
    try {
      var res = await fetch(String(url).trim(), {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping', payload: {} })
      });
      var data = await res.json();
      return data;
    } catch (err) {
      return { success: false, message: err.message || 'فشل الاتصال بالرابط.' };
    }
  }

  root.RGApi = {
    getGasUrl: getGasUrl,
    setGasUrl: setGasUrl,
    getToken: getToken,
    setToken: setToken,
    isLiveMode: isLiveMode,
    callApi: callApi,
    pingGasUrl: pingGasUrl
  };
})(window);
