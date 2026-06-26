/**
 * EDM + AI Product Backlog seed script.
 * Run: npm run db:seed -w packages/shared
 * Or: cd packages/shared && npx tsx prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// IDs for deterministic seed (must match mock auth in apps/web)
const ORG_ID = "org-1";
const EMPLOYEE_ID = "user-1";
const MANAGER_ID = "user-2";
const DELEGATEE_ID = "user-3"; // Second approver for delegation tests

// Backlog PM / Eng users
const PM_SARAH = "pm-1";
const PM_ALEX = "pm-2";
const PM_JORDAN = "pm-3";
const ENG_RYAN = "eng-1";
const EXEC_DANA = "exec-1";

async function main() {
  console.log("Seeding EDM test data...");

  // Upsert employee (matches mock auth)
  await prisma.user.upsert({
    where: { id: EMPLOYEE_ID },
    update: {},
    create: {
      id: EMPLOYEE_ID,
      orgId: ORG_ID,
      email: "demo@example.com",
      name: "Demo User",
    },
  });
  console.log("  - Employee:", EMPLOYEE_ID);

  // Upsert manager/approver
  await prisma.user.upsert({
    where: { id: MANAGER_ID },
    update: {},
    create: {
      id: MANAGER_ID,
      orgId: ORG_ID,
      email: "manager@example.com",
      name: "Manager User",
    },
  });
  console.log("  - Manager:", MANAGER_ID);

  // Upsert delegatee (second approver for delegation scenario)
  await prisma.user.upsert({
    where: { id: DELEGATEE_ID },
    update: {},
    create: {
      id: DELEGATEE_ID,
      orgId: ORG_ID,
      email: "delegatee@example.com",
      name: "Delegatee User",
    },
  });
  console.log("  - Delegatee:", DELEGATEE_ID);

  // Approval template with one step (manager approves)
  const template = await prisma.approvalWorkflowTemplate.upsert({
    where: { id: "tpl-1" },
    update: {},
    create: {
      id: "tpl-1",
      orgId: ORG_ID,
      name: "Standard Approval",
      description: "Manager approval for extra duty",
    },
  });

  await prisma.approvalStepTemplate.upsert({
    where: { id: "step-1" },
    update: {},
    create: {
      id: "step-1",
      templateId: template.id,
      stepOrder: 1,
      approverRole: "manager",
      approverConfig: { defaultApproverId: MANAGER_ID },
    },
  });
  console.log("  - Approval template: tpl-1 (1 step -> manager)");

  // Open assignment (created by manager)
  const assignment = await prisma.assignment.upsert({
    where: { id: "asn-1" },
    update: { status: "OPEN" },
    create: {
      id: "asn-1",
      orgId: ORG_ID,
      createdById: MANAGER_ID,
      status: "OPEN",
      title: "Weekend Shift - Main Campus",
      description: "Extra duty coverage for Saturday",
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // next week
      location: "Main Campus",
      payType: "HOURLY",
      payAmount: 45,
    },
  });
  console.log("  - Assignment:", assignment.id, assignment.title);

  console.log("Seed complete. Use org-1, user-1 (employee), user-2 (manager), user-3 (delegatee), tpl-1 (template), asn-1 (assignment).");

  // -------------------------------------------------------------------------
  // AI Product Backlog seed data
  // -------------------------------------------------------------------------
  console.log("\nSeeding AI Product Backlog data...");

  // Backlog users
  for (const u of [
    { id: PM_SARAH, name: "Sarah Mitchell", email: "sarah.mitchell@tcpsoftware.com" },
    { id: PM_ALEX, name: "Alex Kim", email: "alex.kim@tcpsoftware.com" },
    { id: PM_JORDAN, name: "Jordan Lee", email: "jordan.lee@tcpsoftware.com" },
    { id: ENG_RYAN, name: "Ryan Chen", email: "ryan.chen@tcpsoftware.com" },
    { id: EXEC_DANA, name: "Dana Wu", email: "dana.wu@tcpsoftware.com" },
  ]) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { id: u.id, orgId: ORG_ID, email: u.email, name: u.name },
    });
  }
  console.log("  - Backlog users created");

  // Portfolio
  const portfolio = await prisma.backlogPortfolio.upsert({
    where: { id: "portfolio-1" },
    update: {},
    create: { id: "portfolio-1", name: "Workforce Management", sortOrder: 0 },
  });

  // Products + areas
  const productsData = [
    {
      id: "prod-tcp", name: "TimeClock Plus", sortOrder: 0,
      areas: ["Core Time", "Attendance", "Compliance", "Payroll", "Mobile", "Reporting", "Integrations", "AI"],
    },
    {
      id: "prod-humanity-scheduling", name: "Humanity Scheduling", sortOrder: 1,
      areas: ["Scheduling", "Forecasting", "Labor Optimization", "Shift Marketplace", "Availability", "Mobile", "Integrations", "AI"],
    },
    {
      id: "prod-humanity-time", name: "Humanity Time", sortOrder: 2,
      areas: ["Time Tracking", "Timesheets", "Attendance", "Overtime", "Mobile", "Integrations"],
    },
    {
      id: "prod-aladtec", name: "Aladtec", sortOrder: 3,
      areas: ["Scheduling", "Staffing", "EMS", "Fire", "Law Enforcement", "Mobile", "Reporting", "Integrations"],
    },
  ];

  const productAreaIds: Record<string, string> = {};
  for (const p of productsData) {
    await prisma.backlogProduct.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, portfolioId: portfolio.id, name: p.name, sortOrder: p.sortOrder },
    });
    for (let i = 0; i < p.areas.length; i++) {
      const areaId = `area-${p.id}-${i}`;
      await prisma.backlogProductArea.upsert({
        where: { id: areaId },
        update: {},
        create: { id: areaId, productId: p.id, name: p.areas[i], sortOrder: i },
      });
      productAreaIds[`${p.id}:${p.areas[i]}`] = areaId;
    }
  }
  console.log("  - Portfolio hierarchy created");

  // Strategic initiatives
  const initiatives = [
    { id: "init-ai", name: "AI", color: "purple" },
    { id: "init-enterprise", name: "Enterprise", color: "orange" },
    { id: "init-crosssell", name: "Cross Sell", color: "amber" },
    { id: "init-retention", name: "Retention", color: "violet" },
    { id: "init-healthcare", name: "Healthcare", color: "teal" },
    { id: "init-hospitality", name: "Hospitality", color: "cyan" },
    { id: "init-k12", name: "K-12", color: "indigo" },
    { id: "init-publicsafety", name: "Public Safety", color: "blue" },
    { id: "init-compliance", name: "Compliance", color: "red" },
    { id: "init-platform", name: "Platform", color: "gray" },
  ];
  for (let i = 0; i < initiatives.length; i++) {
    const { id, name, color } = initiatives[i];
    await prisma.strategicInitiative.upsert({
      where: { id },
      update: {},
      create: { id, name, color, sortOrder: i },
    });
  }
  console.log("  - Strategic initiatives created");

  // Statuses
  const statuses = [
    { id: "status-idea", name: "Idea", color: "gray", isDefault: true, sortOrder: 0 },
    { id: "status-review", name: "Product Review", color: "yellow", sortOrder: 1 },
    { id: "status-eng-review", name: "Engineering Review", color: "amber", sortOrder: 2 },
    { id: "status-approved", name: "Approved", color: "green", sortOrder: 3 },
    { id: "status-in-progress", name: "In Progress", color: "blue", sortOrder: 4 },
    { id: "status-deferred", name: "Deferred", color: "slate", sortOrder: 5 },
    { id: "status-closed", name: "Closed", color: "red", sortOrder: 6 },
  ];
  for (const s of statuses) {
    await prisma.backlogStatus.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }

  // Sources
  const sources = [
    "Customer", "Customer Success", "Sales", "Product", "Engineering",
    "Executive", "Competitive Analysis", "Support",
  ];
  for (let i = 0; i < sources.length; i++) {
    const id = `source-${i}`;
    await prisma.backlogSource.upsert({
      where: { id },
      update: {},
      create: { id, name: sources[i], sortOrder: i },
    });
  }

  // Target releases
  const releases = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027", "Backlog"];
  for (let i = 0; i < releases.length; i++) {
    const id = `release-${i}`;
    await prisma.backlogTargetRelease.upsert({
      where: { id },
      update: {},
      create: { id, name: releases[i], sortOrder: i },
    });
  }
  console.log("  - Taxonomy created (statuses, sources, releases)");

  // Sample backlog items
  const sampleItems = [
    {
      id: "item-1",
      title: "AI-Powered Scheduling Recommendations",
      description: "Auto-suggest optimal shift coverage using ML models trained on historical scheduling patterns, demand signals, and labor rules.",
      productId: "prod-humanity-scheduling",
      productAreaId: productAreaIds["prod-humanity-scheduling:Forecasting"],
      statusId: "status-eng-review",
      sourceId: "source-1", // Customer Success
      ownerId: PM_ALEX,
      createdById: PM_ALEX,
      customersImpacted: 28,
      arrRepresented: 1800000,
      opportunitiesBlocked: 4,
      churnRisk: "High",
      customerSegment: "Mid-Market",
      vertical: "Hospitality",
      customerQuotes: [
        { quote: "We're flying blind when it comes to staffing. If Humanity could tell me 'you need 3 more nurses on Tuesday nights,' I'd pay more for that.", customer: "Sunrise Health", arr: 240000, source: "QBR call", date: "2026-04-15" },
        { quote: "Our biggest labor cost problem is overstaffing on slow days. Predictive scheduling would be a game-changer.", customer: "Coastal Hospitality Group", arr: 180000, source: "Churn survey", date: "2026-03-10" },
        { quote: "This is the one feature that would keep us from evaluating competitors. We almost churned last quarter because of this gap.", customer: "Metro Staffing", arr: 340000, source: "CS escalation", date: "2026-05-02" },
      ],
      problemStatement: "Humanity schedulers spend an average of 4–6 hours per week manually adjusting shift coverage based on historical demand patterns. The platform has the data to predict optimal coverage, but no mechanism to surface those recommendations to managers.",
      successMetrics: "• Reduce manager scheduling time by 30%\n• Improve labor cost accuracy to within 5% of target\n• Achieve 80% recommendation adoption rate within 90 days of launch",
      alternativesConsidered: "Manual rule configuration, third-party AI scheduling add-on (cost-prohibitive), simple historical averages (insufficient accuracy).",
      revenueOpportunity: 480000,
      isCompetitiveGap: true,
      estimatedEffort: "L",
      complexity: "High",
      confidenceLevel: "Medium",
      technicalDependencies: "ML platform, Data pipeline",
      timelineEstimate: "8–13 weeks",
      priorityScore: 92,
      roadmapQuarter: "Q3 2026",
      businessPriority: 1,
      targetReleaseId: "release-2", // Q3 2026
      initiatives: ["init-ai", "init-enterprise"],
    },
    {
      id: "item-2",
      title: "Biometric Clock-In for Enterprise Customers",
      description: "Fingerprint and face ID support for time capture on enterprise hardware, integrated with TimeClock Plus.",
      productId: "prod-tcp",
      productAreaId: productAreaIds["prod-tcp:Core Time"],
      statusId: "status-approved",
      sourceId: "source-2", // Sales
      ownerId: PM_SARAH,
      createdById: PM_SARAH,
      customersImpacted: 14,
      arrRepresented: 2400000,
      opportunitiesBlocked: 6,
      churnRisk: "Medium",
      customerSegment: "Enterprise",
      vertical: "Healthcare",
      customerQuotes: [
        { quote: "We cannot move forward with TCP until biometric support is available. Our security policy requires it.", customer: "Regional Health Network", arr: 560000, source: "Sales call", date: "2026-02-20" },
      ],
      problemStatement: "Enterprise customers with strict authentication policies cannot adopt TimeClock Plus because it lacks biometric clock-in support. Six active deals are blocked on this requirement.",
      successMetrics: "• Unblock 6 active enterprise deals totaling $2.4M ARR\n• Achieve biometric enrollment rate of >85% within 60 days of deployment",
      revenueOpportunity: 2400000,
      isComplianceRequirement: true,
      isCompetitiveGap: true,
      estimatedEffort: "XL",
      complexity: "High",
      confidenceLevel: "Medium",
      technicalDependencies: "Hardware vendor partnership, Security review",
      timelineEstimate: "14–20 weeks",
      priorityScore: 88,
      roadmapQuarter: "Q2 2026",
      businessPriority: 2,
      targetReleaseId: "release-1", // Q2 2026
      jiraIssueKey: "TCP-2847",
      jiraUrl: "https://tcpsoftware.atlassian.net/browse/TCP-2847",
      initiatives: ["init-enterprise", "init-healthcare"],
    },
    {
      id: "item-3",
      title: "ACA Compliance Reporting Automation",
      description: "Auto-generate 1094 and 1095 ACA filings directly from TimeClock Plus time and attendance data.",
      productId: "prod-tcp",
      productAreaId: productAreaIds["prod-tcp:Compliance"],
      statusId: "status-review",
      sourceId: "source-0", // Customer
      ownerId: PM_JORDAN,
      createdById: PM_JORDAN,
      customersImpacted: 45,
      arrRepresented: 890000,
      churnRisk: "Medium",
      customerSegment: "Mid-Market",
      vertical: "Healthcare",
      problemStatement: "Customers with 50+ employees must file ACA reports annually. They currently export data from TCP and re-enter it into compliance software, creating a manual, error-prone process that drives support tickets and dissatisfaction.",
      successMetrics: "• Reduce ACA-related support tickets by 60%\n• Achieve CSAT improvement of +15 points for affected customers",
      revenueOpportunity: 0,
      isComplianceRequirement: true,
      estimatedEffort: "M",
      complexity: "Medium",
      confidenceLevel: "High",
      priorityScore: 81,
      roadmapQuarter: "Q3 2026",
      businessPriority: 4,
      targetReleaseId: "release-2",
      initiatives: ["init-compliance", "init-healthcare"],
    },
    {
      id: "item-4",
      title: "Shift Marketplace — Employee-Initiated Swaps",
      description: "Allow employees to post and claim open shifts with manager approval, directly within Humanity.",
      productId: "prod-humanity-scheduling",
      productAreaId: productAreaIds["prod-humanity-scheduling:Shift Marketplace"],
      statusId: "status-approved",
      sourceId: "source-1", // Customer Success
      ownerId: PM_SARAH,
      createdById: PM_SARAH,
      customersImpacted: 32,
      arrRepresented: 650000,
      churnRisk: "Medium",
      customerSegment: "Mid-Market",
      problemStatement: "Managers spend significant time manually coordinating shift swaps via phone and text. Employees have no self-service option, leading to frustration and last-minute no-shows.",
      successMetrics: "• Reduce manager time on shift coordination by 40%\n• Decrease last-minute no-shows by 20%",
      estimatedEffort: "S",
      complexity: "Low",
      confidenceLevel: "High",
      priorityScore: 72,
      roadmapQuarter: "Q2 2026",
      businessPriority: 3,
      targetReleaseId: "release-1",
      initiatives: ["init-retention"],
    },
    {
      id: "item-5",
      title: "Aladtec EMS Scheduling Mobile App",
      description: "Native iOS and Android app for EMS agencies to manage schedules, view shifts, and swap coverage on mobile.",
      productId: "prod-aladtec",
      productAreaId: productAreaIds["prod-aladtec:EMS"],
      statusId: "status-idea",
      sourceId: "source-0", // Customer
      ownerId: PM_ALEX,
      createdById: PM_ALEX,
      customersImpacted: 8,
      arrRepresented: 430000,
      churnRisk: "Low",
      customerSegment: "SMB",
      vertical: "Public Safety",
      problemStatement: "EMS schedulers and field staff rely on desktop access to Aladtec. In time-critical environments, mobile access to scheduling is essential and currently unavailable.",
      estimatedEffort: "L",
      complexity: "High",
      confidenceLevel: "Low",
      priorityScore: 67,
      roadmapQuarter: "Q4 2026",
      businessPriority: 5,
      targetReleaseId: "release-3",
      initiatives: ["init-publicsafety"],
    },
    {
      id: "item-6",
      title: "Payroll Export — Ceridian Dayforce Integration",
      description: "Native integration to export TimeClock Plus time data directly into Ceridian Dayforce for payroll processing.",
      productId: "prod-tcp",
      productAreaId: productAreaIds["prod-tcp:Payroll"],
      statusId: "status-idea",
      sourceId: "source-2", // Sales
      ownerId: PM_SARAH,
      createdById: PM_SARAH,
      customersImpacted: 3,
      arrRepresented: 210000,
      opportunitiesBlocked: 2,
      churnRisk: "None",
      customerSegment: "Mid-Market",
      problemStatement: "Customers using Ceridian Dayforce for payroll must manually export data from TimeClock Plus and import it into Dayforce. This is error-prone and adds hours of administrative work per pay period.",
      estimatedEffort: "M",
      complexity: "Medium",
      confidenceLevel: "High",
      priorityScore: 48,
      businessPriority: 6,
      initiatives: ["init-crosssell"],
    },
  ];

  for (const item of sampleItems) {
    const { initiatives: itemInitiatives, ...itemData } = item;
    await prisma.backlogItem.upsert({
      where: { id: itemData.id },
      update: {},
      create: {
        ...itemData,
        arrRepresented: itemData.arrRepresented != null ? itemData.arrRepresented : undefined,
        revenueOpportunity: itemData.revenueOpportunity != null ? itemData.revenueOpportunity : undefined,
      },
    });
    for (const initId of itemInitiatives) {
      await prisma.backlogItemInitiative.upsert({
        where: { itemId_initiativeId: { itemId: itemData.id, initiativeId: initId } },
        update: {},
        create: { itemId: itemData.id, initiativeId: initId },
      });
    }
  }
  console.log("  - Sample backlog items created");

  // Seed some activity entries
  const activityEntries = [
    { id: "act-1", itemId: "item-1", actorId: PM_SARAH, actorName: "Sarah Mitchell", actorRole: "PM", changeType: "rank_change", summary: "Sarah Mitchell published a new stack ranking for Humanity · Q3 2026", changes: { moved: [{ rank: 1, title: "AI-Powered Scheduling Recommendations", delta: 2 }] } },
    { id: "act-2", itemId: "item-1", actorId: PM_ALEX, actorName: "Alex Kim", actorRole: "PM", changeType: "status_change", summary: "Alex Kim changed status from Product Review to Engineering Review", changes: { field: "status", from: "Product Review", to: "Engineering Review" } },
    { id: "act-3", itemId: "item-1", actorId: PM_ALEX, actorName: "Alex Kim", actorRole: "PM", changeType: "field_edit", summary: "Alex Kim updated ARR, Churn Risk, and Quarter", changes: [{ field: "ARR", from: "$1.2M", to: "$1.8M" }, { field: "Churn Risk", from: "Medium", to: "High" }, { field: "Quarter", from: "Q4 2026", to: "Q3 2026" }] },
    { id: "act-4", itemId: "item-2", actorId: ENG_RYAN, actorName: "Ryan Chen", actorRole: "Engineering", changeType: "eng_review", summary: "Ryan Chen submitted an engineering assessment", changes: { effort: "XL", complexity: "High", confidence: "Medium" } },
    { id: "act-5", itemId: "item-3", actorId: PM_JORDAN, actorName: "Jordan Lee", actorRole: "PM", changeType: "comment", summary: "Jordan Lee commented on ACA Compliance Reporting Automation", comment: "Legal flagged this as a must-have before Q4 open enrollment. We may need to pull this above the Q3 cutline." },
    { id: "act-6", itemId: "item-6", actorId: EXEC_DANA, actorName: "Dana Wu", actorRole: "Executive", changeType: "create", summary: "Dana Wu created a new backlog item" },
  ];
  for (const a of activityEntries) {
    await prisma.backlogActivity.upsert({
      where: { id: a.id },
      update: {},
      create: a,
    });
  }
  console.log("  - Activity feed seeded");

  // Config lists
  await prisma.backlogConfig.upsert({
    where: { key: "discovery_statuses" },
    update: {},
    create: { key: "discovery_statuses", values: ["Not Started", "In Progress", "Complete"] },
  });
  await prisma.backlogConfig.upsert({
    where: { key: "roadmap_quarters" },
    update: {},
    create: { key: "roadmap_quarters", values: ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027", "Q3 2027", "Q4 2027"] },
  });
  console.log("  - Config lists seeded");
  console.log("\nAll seed data complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
