import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../assets/js/core.js');

test('translates reservation statuses and delivery types accurately', () => {
  assert.equal(core.translateOriginalStatus('confirmed'), 'مؤكد');
  assert.equal(core.translateOriginalStatus('delivered'), 'تم التسليم');
  assert.equal(core.translateOriginalStatus('cancelled'), 'ملغي');
  assert.equal(core.translateDeliveryType('airport'), 'توصيل للمطار');
  assert.equal(core.translateDeliveryType('branch'), 'استلام من الفرع');
});

test('filters extensions to accepted and paid only and computes total amount', () => {
  assert.equal(core.isExtensionAcceptedAndPaid({ status: 'accepted', payment_status: 'paid' }), true);
  assert.equal(core.isExtensionAcceptedAndPaid({ status: 'pending', payment_status: 'paid' }), false);
  assert.equal(core.isExtensionAcceptedAndPaid({ status: 'accepted', payment_status: 'unpaid' }), false);

  const total = core.computeTotalAmount(1250.5, [
    { amount: 250 },
    { amount: 149.5 }
  ]);
  assert.equal(total, 1650);
});

test('mergeSyncedReservation preserves internal follow-up status, priority, and assigned employees', () => {
  const existing = {
    id: 'RES_101',
    reservationNumber: 'RG-9001',
    internalStatus: 'تم التسليم',
    priority: 'مرتفع',
    assignedEmployeeIds: ['EMP_1', 'EMP_2'],
    assignedEmployeeNames: ['سارة العتيبي', 'خالد الحربي'],
    lastUpdateText: 'تم تسليم السيارة للعميل في المطار',
    lastUpdatedById: 'EMP_1',
    lastUpdatedByName: 'سارة العتيبي',
    lastUpdatedAt: '2026-11-15T10:00:00.000Z',
    hasProblem: true,
    createdAt: '2026-11-14T09:00:00.000Z'
  };

  const merged = core.mergeSyncedReservation(
    existing,
    {
      reservation_number: 'RG-9001',
      customer_name: 'فهد القحطاني',
      status: 'active',
      total_price: 1500,
      pickup_type: 'airport'
    },
    [{ amount: 300 }],
    { id: 'EMP_ADMIN', name: 'المدير العام' }
  );

  assert.equal(merged.internalStatus, 'تم التسليم');
  assert.equal(merged.priority, 'مرتفع');
  assert.deepEqual(merged.assignedEmployeeIds, ['EMP_1', 'EMP_2']);
  assert.equal(merged.hasProblem, true);
  assert.equal(merged.hasExtensions, true);
  assert.equal(merged.extensionsAmount, 300);
  assert.equal(merged.totalAmount, 1800);
});

test('RBAC permission matrix enforces strict role boundaries', () => {
  assert.equal(core.canUserPerform('general_manager', 'manage_employees'), true);
  assert.equal(core.canUserPerform('general_manager', 'manage_settings'), true);
  assert.equal(core.canUserPerform('supervisor', 'assign_employees'), true);
  assert.equal(core.canUserPerform('supervisor', 'manage_employees'), false);
  assert.equal(core.canUserPerform('agent', 'add_followup'), true);
  assert.equal(core.canUserPerform('agent', 'assign_employees'), false);
  assert.equal(core.canUserPerform('agent', 'sync_data'), false);
});

test('filterReservations and computeDashboardMetrics handle unfollowed, problems, and KPIs', () => {
  const reservations = [
    {
      id: 'R1', reservationNumber: 'RG-1', customerName: 'أحمد', companyName: 'بدجت',
      branchName: 'الرياض', startDate: '2026-11-16', internalStatus: 'تم الحجز',
      priority: 'عادي', assignedEmployeeIds: ['E1'], hasProblem: false, createdAt: '2026-11-16T08:00:00Z'
    },
    {
      id: 'R2', reservationNumber: 'RG-2', customerName: 'منى', companyName: 'ذيب',
      branchName: 'جدة', startDate: '2026-11-15', internalStatus: 'تم الإنشاء',
      priority: 'مرتفع', assignedEmployeeIds: ['E2'], hasProblem: true, createdAt: '2026-11-15T08:00:00Z'
    }
  ];
  const followUps = [
    { id: 'F1', reservationId: 'R1', employeeName: 'سارة', followUpDate: '2026-11-16' }
  ];
  const problems = [
    { id: 'P1', priority: 'مرتفع', status: 'جديدة' },
    { id: 'P2', priority: 'عادي', status: 'مغلقة' }
  ];
  const employees = [
    { id: 'E1', name: 'سارة', status: 'active' },
    { id: 'E2', name: 'خالد', status: 'active' }
  ];

  const unfollowed = core.filterReservations(reservations, followUps, { unfollowedOnly: true });
  assert.equal(unfollowed.length, 1);
  assert.equal(unfollowed[0].id, 'R2');

  const dash = core.computeDashboardMetrics(reservations, followUps, problems, employees, {}, '2026-11-16');
  assert.equal(dash.kpis.totalReservations, 2);
  assert.equal(dash.kpis.todayReservations, 1);
  assert.equal(dash.kpis.openProblems, 1);
  assert.equal(dash.kpis.highProblems, 1);
  assert.equal(dash.kpis.todayFollowUps, 1);
});

test('multi-employee self-claim, unclaim, and supervisor edit RBAC work correctly', () => {
  const res = {
    id: 'R10',
    assignedEmployeeIds: ['EMP_1'],
    assignedEmployeeNames: ['خالد الحربي']
  };

  // Second agent can claim without overwriting the first employee
  const claimed = core.claimReservationRecord(res, { id: 'EMP_2', name: 'نورة القحطاني' });
  assert.equal(claimed.added, true);
  assert.deepEqual(claimed.assignedEmployeeIds, ['EMP_1', 'EMP_2']);
  assert.deepEqual(claimed.assignedEmployeeNames, ['خالد الحربي', 'نورة القحطاني']);

  // Duplicate claim is idempotent
  const duplicate = core.claimReservationRecord(claimed, { id: 'EMP_2', name: 'نورة القحطاني' });
  assert.equal(duplicate.added, false);
  assert.deepEqual(duplicate.assignedEmployeeIds, ['EMP_1', 'EMP_2']);

  // Unclaim removes only the requesting employee
  const unclaimed = core.unclaimReservationRecord(claimed, 'EMP_1');
  assert.equal(unclaimed.removed, true);
  assert.deepEqual(unclaimed.assignedEmployeeIds, ['EMP_2']);
  assert.deepEqual(unclaimed.assignedEmployeeNames, ['نورة القحطاني']);

  // RBAC checks
  assert.equal(core.canUserPerform('agent', 'claim_reservation'), true);
  assert.equal(core.canUserPerform('agent', 'unclaim_reservation'), true);
  assert.equal(core.canUserPerform('agent', 'quick_update_status'), true);
  assert.equal(core.canUserPerform('agent', 'edit_reservation_details'), false);
  assert.equal(core.canUserPerform('supervisor', 'edit_reservation_details'), true);
  assert.equal(core.canUserPerform('supervisor', 'edit_ticket_details'), true);
  assert.equal(core.canUserPerform('supervisor', 'edit_any_followup'), true);
});

test('custom employee permissions, job presets, and strict Manager/Supervisor API access', () => {
  const seniorPreset = core.JOB_ROLE_PRESETS.find((p: any) => p.id === 'agent_senior');
  assert.ok(seniorPreset);
  const customAgent = {
    role: 'agent',
    permissions: seniorPreset.permissions
  };
  assert.equal(core.canUserPerform(customAgent, 'view_employees'), true);
  assert.equal(core.canUserPerform(customAgent, 'edit_any_followup'), true);
  assert.equal(core.canUserPerform(customAgent, 'manage_employees'), false);

  // API access strictly limited to general_manager & supervisor
  assert.equal(core.canAccessApi('general_manager'), true);
  assert.equal(core.canAccessApi('supervisor'), true);
  assert.equal(core.canAccessApi('agent'), false);
  assert.equal(core.canUserPerform({ role: 'agent', permissions: ['sync_data', 'view_dashboard'] }, 'sync_data'), false);
  assert.equal(core.canUserPerform({ role: 'supervisor', permissions: ['sync_data', 'view_dashboard'] }, 'sync_data'), true);

  // Pull reservations on Reservations page allowed for employees by default & toggleable, without granting API access
  assert.equal(core.canUserPerform('agent', 'pull_reservations'), true);
  assert.equal(core.canUserPerform('supervisor', 'pull_reservations'), true);
  assert.equal(core.canUserPerform('general_manager', 'pull_reservations'), true);
  assert.equal(core.canUserPerform({ role: 'agent', permissions: ['view_dashboard'] }, 'pull_reservations'), false);
});

test('editable ready-made role presets and custom permission catalog CRUD work securely', () => {
  // 1) Add a new preset with agent role -> strips sync_data automatically
  const created = core.upsertRolePreset(core.JOB_ROLE_PRESETS, {
    label: 'وردية مسائية VIP',
    jobTitle: 'أخصائي VIP',
    role: 'agent',
    permissions: ['view_dashboard', 'pull_reservations', 'sync_data']
  });
  assert.equal(created.isNew, true);
  assert.equal(created.saved.label, 'وردية مسائية VIP');
  assert.equal(created.saved.permissions.includes('sync_data'), false);
  assert.equal(created.saved.permissions.includes('pull_reservations'), true);

  // 2) Rename & edit permissions of the preset
  const edited = core.upsertRolePreset(created.presets, {
    id: created.saved.id,
    label: 'فريق كبار العملاء المعدل',
    jobTitle: 'أخصائي كبار العملاء',
    role: 'supervisor',
    permissions: ['view_dashboard', 'sync_data', 'view_employees']
  });
  assert.equal(edited.isNew, false);
  assert.equal(edited.saved.label, 'فريق كبار العملاء المعدل');
  assert.equal(edited.saved.permissions.includes('sync_data'), true);

  // 3) Delete preset
  const afterDelete = core.removeRolePreset(edited.presets, created.saved.id);
  assert.equal(afterDelete.some((p: any) => p.id === created.saved.id), false);

  // 4) Custom permission catalog: add, rename built-in, and remove
  const addedPerm = core.upsertPermissionDefinition([], { label: 'اعتماد خصم خاص', group: 'الحجوزات' });
  assert.equal(addedPerm.catalog.some((c: any) => c.label === 'اعتماد خصم خاص' && c.isCustom), true);

  const renamedBuiltIn = core.upsertPermissionDefinition(addedPerm.customPermissions, {
    key: 'pull_reservations',
    label: 'جلب الحجوزات الفوري',
    group: 'الحجوزات'
  });
  const pulledItem = renamedBuiltIn.catalog.find((c: any) => c.key === 'pull_reservations');
  assert.equal(pulledItem.label, 'جلب الحجوزات الفوري');
  assert.equal(pulledItem.isRenamed, true);

  const removedCustom = core.removePermissionDefinition(renamedBuiltIn.customPermissions, addedPerm.saved.key);
  assert.equal(removedCustom.catalog.some((c: any) => c.key === addedPerm.saved.key), false);
});


