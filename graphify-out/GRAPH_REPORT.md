# Graph Report - vibeforce-craft-os  (2026-11-26)

## Corpus Check
- Large corpus: 522 files · ~604,091 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2157 nodes · 6317 edges · 209 communities (98 shown, 111 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin Settings, Craft Hub & Team
- Planner & Dashboard Workspace
- Playwright Live Verification Tools
- Domain Constants & Craft Roles
- GAEB XML & D83 Engine
- Site Reports, Evidence & IDS Carts
- Project Details & Task Views
- Python Research & Schema Tools
- Craft Migration & E2E Audits
- Client Details & Team Views
- User Admin & Dashboard Overview
- Dashboard Shell & Mobile Navigation
- Core & Craft Server Actions
- M007 Master Audit Suite
- Client CRUD & Error Boundaries
- Frontend Dependencies Manifest
- IDS Hook, Wholesale & Measurements
- Preview & Showcase UI
- Geofencing & Leaflet Map Editor
- Craft Hub & Cost Calculation
- Module Cluster 20
- Module Cluster 21
- Module Cluster 22
- Module Cluster 23
- Module Cluster 24
- Module Cluster 25
- Module Cluster 26
- Module Cluster 27
- Module Cluster 28
- Module Cluster 29
- Module Cluster 30
- Module Cluster 31
- Module Cluster 32
- Module Cluster 33
- Module Cluster 34
- Module Cluster 35
- Module Cluster 36
- Module Cluster 37
- Module Cluster 38
- Module Cluster 39
- Module Cluster 40
- Module Cluster 41
- Module Cluster 42
- Module Cluster 43
- Module Cluster 44
- Module Cluster 45
- Module Cluster 46
- Module Cluster 47
- Module Cluster 48
- Module Cluster 49
- Module Cluster 50
- Module Cluster 51
- Module Cluster 52
- Module Cluster 53
- Module Cluster 54
- Module Cluster 55
- Module Cluster 56
- Module Cluster 57
- Module Cluster 58
- Module Cluster 59
- Module Cluster 60
- Module Cluster 61
- Module Cluster 62
- Module Cluster 63
- Module Cluster 64
- Module Cluster 65
- Module Cluster 66
- Module Cluster 67
- Module Cluster 68
- Module Cluster 69
- Module Cluster 70
- Module Cluster 71
- Module Cluster 72
- Module Cluster 73
- Module Cluster 74
- Module Cluster 75
- Module Cluster 76
- Module Cluster 77
- Module Cluster 78
- Module Cluster 79
- Module Cluster 80
- Module Cluster 81
- Module Cluster 82
- Module Cluster 83
- Module Cluster 84
- Module Cluster 85
- Module Cluster 86
- Module Cluster 87
- Module Cluster 88
- Module Cluster 89
- Module Cluster 90
- Module Cluster 91
- Module Cluster 93
- Module Cluster 94
- Module Cluster 95
- Module Cluster 96
- Module Cluster 97
- Module Cluster 98
- Module Cluster 99
- Module Cluster 100
- Module Cluster 101
- Module Cluster 102
- Module Cluster 103
- Module Cluster 104
- Module Cluster 105
- Module Cluster 106
- Module Cluster 107
- Module Cluster 108
- Module Cluster 109
- Module Cluster 110
- Module Cluster 111
- Module Cluster 112
- Module Cluster 113
- Module Cluster 114
- Module Cluster 115
- Module Cluster 116
- Module Cluster 117
- Module Cluster 121
- Module Cluster 132

## God Nodes (most connected - your core abstractions)
1. `Button()` - 123 edges
2. `lucide-react` - 106 edges
3. `verifyUserSession()` - 98 edges
4. `cn()` - 89 edges
5. `getAdminPB()` - 75 edges
6. `Input()` - 68 edges
7. `Badge()` - 67 edges
8. `Card()` - 65 edges
9. `CardContent()` - 64 edges
10. `SelectContent()` - 56 edges

## Surprising Connections (you probably didn't know these)
- `generateMetadata()` --calls--> `getAdminPB()`  [EXTRACTED]
  frontend/src/app/(dashboard)/clients/[id]/page.tsx → frontend/src/lib/pocketbase-server.ts
- `DefectsPageClientProps` --references--> `ProjectRecord`  [EXTRACTED]
  frontend/src/app/(dashboard)/craft/defects/DefectsPageClient.tsx → frontend/src/lib/pocketbase-types.ts
- `MonteurTimeClockClientProps` --references--> `ProjectRecord`  [EXTRACTED]
  frontend/src/app/(dashboard)/craft/time/MonteurTimeClockClient.tsx → frontend/src/lib/pocketbase-types.ts
- `generateMetadata()` --calls--> `getAdminPB()`  [EXTRACTED]
  frontend/src/app/(dashboard)/projects/[id]/page.tsx → frontend/src/lib/pocketbase-server.ts
- `DailySiteReportFormProps` --references--> `SiteReportRecord`  [EXTRACTED]
  frontend/src/components/craft/DailySiteReportForm.tsx → frontend/src/lib/pocketbase-types.ts

## Import Cycles
- None detected.

## Communities (209 total, 111 thin omitted)

### Community 0 - "Admin Settings, Craft Hub & Team"
Cohesion: 0.06
Nodes (96): CreateClientSchema, deleteClientAction(), revalidateClientPath(), revalidateClientsPath(), updateClientAction(), UpdateClientSchema, AdminOverviewPage(), AdminSettingsPage() (+88 more)

### Community 1 - "Planner & Dashboard Workspace"
Cohesion: 0.05
Nodes (65): MyTask, formatDateDE(), PlannerPage(), TaskTreePanel(), UserWorkload, EditClientDialogProps, NewCraftClientDialogProps, CommandItem() (+57 more)

### Community 2 - "Playwright Live Verification Tools"
Cohesion: 0.03
Nodes (7): run(), testLogin(), main(), verifyAccount(), { chromium }, main(), tryLogin()

### Community 3 - "Domain Constants & Craft Roles"
Cohesion: 0.04
Nodes (49): ALL_LABEL_MAPS, BILLABLE_FILTERS, BillableFilter, CLIENT_STATUS_LABEL_MAP, CLIENT_STATUSES, ClientStatus, CRAFT_ROLE_LABELS, CRAFT_ROLES (+41 more)

### Community 4 - "GAEB XML & D83 Engine"
Cohesion: 0.06
Nodes (46): computeGaeb90CategoryTotal(), CP437_BYTE_MAP, decodeCp437Byte(), decodeGaeb90Bytes(), escapeXml(), extractG90Number(), findChildByTag(), findChildrenByTag() (+38 more)

### Community 5 - "Site Reports, Evidence & IDS Carts"
Cohesion: 0.08
Nodes (38): createEvidenceItemAction(), CreateEvidenceItemInput, getEvidenceItemsByReportAction(), getImportedIdsCartAction(), generateCraftInvoiceAction(), createMeasurementAction(), CreateMeasurementInput, CreateMeasurementSchema (+30 more)

### Community 6 - "Project Details & Task Views"
Cohesion: 0.10
Nodes (38): GeofenceMapEditor, ManageExpensesDialog(), ManageExpensesDialogProps, ProjectDetailsClient(), ProjectDetailsClientProps, dynamic, TasksPage(), TasksPageClient() (+30 more)

### Community 7 - "Python Research & Schema Tools"
Cohesion: 0.09
Nodes (21): call_deepseek_api(), call_gemini_api(), call_llm_api(), compile_pdf(), format_as_yaml(), _to_yaml(), load_env_file(), main() (+13 more)

### Community 8 - "Craft Migration & E2E Audits"
Cohesion: 0.06
Nodes (10): run(), { chromium }, fs, path, SNAPSHOTS_DIR, OUT_DIR, OUT_DIR, VIEWPORTS (+2 more)

### Community 9 - "Client Details & Team Views"
Cohesion: 0.18
Nodes (34): ClientDetailsClient(), ClientDetailsClientProps, FileRow(), formatCurrency(), formatDate(), formatFileSize(), getKundenStatusBadge(), ProjectHours (+26 more)

### Community 10 - "User Admin & Dashboard Overview"
Cohesion: 0.19
Nodes (31): AdminUsersPage(), UserItem, DashboardPage(), DashboardStats, formatHoursMinutes(), getLinkTypeColor(), getLinkTypeLabel(), getPriorityBadge() (+23 more)

### Community 11 - "Dashboard Shell & Mobile Navigation"
Cohesion: 0.12
Nodes (25): DashboardLayout(), NavItem(), SearchResult, DashboardGreeting(), getGreeting(), LiveClock(), MobileTabBar(), SimpleActionMenu() (+17 more)

### Community 12 - "Core & Craft Server Actions"
Cohesion: 0.14
Nodes (29): createUserAction(), deleteUserAdminAction(), resetUserPasswordAction(), toggleUserActiveAction(), updateUserProfileAdminAction(), updateUserRoleAction(), updateUserSupervisorAction(), createClientAction() (+21 more)

### Community 13 - "M007 Master Audit Suite"
Cohesion: 0.06
Nodes (30): auditProject, calc1, calc2, calc3, datanormParsed, datevCsv, datevLines, datevRecords (+22 more)

### Community 14 - "Client CRUD & Error Boundaries"
Cohesion: 0.14
Nodes (20): ClientsPageClient(), ClientDetailError(), ClientsPage(), DashboardError(), ProjectDetailError(), RootError(), GlobalNotFound(), EditProjectDialogProps (+12 more)

### Community 15 - "Frontend Dependencies Manifest"
Cohesion: 0.06
Nodes (34): dependencies, @base-ui/react, class-variance-authority, clsx, cmdk, date-fns, framer-motion, frappe-gantt (+26 more)

### Community 16 - "IDS Hook, Wholesale & Measurements"
Cohesion: 0.10
Nodes (29): CORS_HEADERS, corsJson(), dynamic, GET(), POST(), GaebManagerProps, ItemTableRowProps, MeasurementRowItem (+21 more)

### Community 17 - "Preview & Showcase UI"
Cohesion: 0.08
Nodes (14): categories, chips, CollapsibleSection(), GlobalFixDemo(), PreviewPage(), statusColor(), styles, TableCardView() (+6 more)

### Community 18 - "Geofencing & Leaflet Map Editor"
Cohesion: 0.13
Nodes (19): Circle, GeofenceMapEditor(), GeofenceMapEditorProps, MapClickHandler(), MapContainer, Marker, Polygon, TileLayer (+11 more)

### Community 19 - "Craft Hub & Cost Calculation"
Cohesion: 0.14
Nodes (22): getProjectCostSummaryAction(), CraftHubClientProps, CraftPage(), dynamic, CostCockpitProps, LABOUR_SOURCE_OPTIONS, CraftEntitlementsModalProps, NewBaustelleDialogProps (+14 more)

### Community 20 - "Module Cluster 20"
Cohesion: 0.09
Nodes (9): nextConfig, securityHeaders, dynamic, AdminLayout(), metadata, metadata, AdminSubNav(), NavTab (+1 more)

### Community 21 - "Module Cluster 21"
Cohesion: 0.08
Nodes (24): next, playwright, pocketbase, react, react-dom, name, private, version (+16 more)

### Community 22 - "Module Cluster 22"
Cohesion: 0.09
Nodes (18): ClientDetailPage(), dynamic, generateMetadata(), dynamic, generateMetadata(), ProjectDetailsPage(), dynamic, ProjectsPage() (+10 more)

### Community 23 - "Module Cluster 23"
Cohesion: 0.15
Nodes (16): EXPERTISE_OPTIONS, formatHoursMinutes(), getStatusBadge(), ProfilePage(), AvatarUpload(), AvatarUploadProps, calculateBillableMinutes(), useI18n() (+8 more)

### Community 24 - "Module Cluster 24"
Cohesion: 0.08
Nodes (24): dependencies, @faker-js/faker, marked, playwright, pocketbase, puppeteer, devDependencies, next (+16 more)

### Community 25 - "Module Cluster 25"
Cohesion: 0.22
Nodes (22): useDraftAutosave(), useOfflineSync(), clearReportDraft(), deleteMediaBlob(), getDB(), getMediaBlobsForReport(), getPendingSyncCount(), getPendingSyncItems() (+14 more)

### Community 26 - "Module Cluster 26"
Cohesion: 0.08
Nodes (23): agent, code, debug, explore, general, orchestrator, plan, description (+15 more)

### Community 27 - "Module Cluster 27"
Cohesion: 0.09
Nodes (7): pb, pb, pb, pb, pb, pb, pb

### Community 28 - "Module Cluster 28"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 29 - "Module Cluster 29"
Cohesion: 0.15
Nodes (17): POST(), reportFontsCss, reportTemplateDark, reportTemplateEditorial, reportTemplateHtml, reportTemplateSwiss, buildProjectTable(), buildStundenreportBodyHtml() (+9 more)

### Community 30 - "Module Cluster 30"
Cohesion: 0.19
Nodes (20): SubTab, WholesaleManager(), calculateMargin(), calculatePurchasePrice(), calculateSellingPrice(), CP850_TABLE, DatanormArticle, DatanormCatalog (+12 more)

### Community 31 - "Module Cluster 31"
Cohesion: 0.10
Nodes (15): __dirname, __filename, projectRoot, __dirname, escapeActiveDialogs(), __filename, run(), SCREENSHOTS_DIR (+7 more)

### Community 32 - "Module Cluster 32"
Cohesion: 0.18
Nodes (17): ReportTab, ProjectOption, TimePage(), ViewMode, CHART_COLORS, ChartDataPoint, ReportChart(), ReportChartProps (+9 more)

### Community 33 - "Module Cluster 33"
Cohesion: 0.12
Nodes (11): CsvBridge, fs, path, { CsvBridge }, path, prepareTest(), { Transformer }, PRIORITY_MAP (+3 more)

### Community 34 - "Module Cluster 34"
Cohesion: 0.20
Nodes (15): deleteNotificationAction(), markAllNotificationsAsReadAction(), markNotificationAsReadAction(), NotificationsPage(), NOTIFICATION_ICONS, NotificationBell(), NOTIFICATION_ICONS, NOTIFICATION_TYPE_LABELS (+7 more)

### Community 35 - "Module Cluster 35"
Cohesion: 0.24
Nodes (13): LoginClient(), dynamic, LoginPage(), ResetPasswordForm(), ResetPasswordLoading(), ResetPasswordPage(), ContactAdminDialog(), ForgotPasswordDialog() (+5 more)

### Community 36 - "Module Cluster 36"
Cohesion: 0.17
Nodes (15): DefectsPageClient(), DefectsPageClientProps, INITIAL_SAMPLE_DEFECTS, DefectsPage(), dynamic, computeSha256(), CRAFT_TRADES_LIST, NewDefectDialog() (+7 more)

### Community 37 - "Module Cluster 37"
Cohesion: 0.14
Nodes (19): TaskLinkWithExpand, BaseRecord, EvidenceItemRecord, ExternalExpenseRecord, InvoiceZugferdRecord, KundenStatus, ListResult, NotificationType (+11 more)

### Community 38 - "Module Cluster 38"
Cohesion: 0.17
Nodes (18): ReportsExportDropdown(), ReportsPage(), BillingLineItem, BillingSummary, downloadReportPDF(), InvoiceDocument(), InvoiceDocumentProps, printInvoice() (+10 more)

### Community 39 - "Module Cluster 39"
Cohesion: 0.10
Nodes (18): check, compact, dotted, expired, expiredToken, jsonCart, project, sAdditive (+10 more)

### Community 40 - "Module Cluster 40"
Cohesion: 0.11
Nodes (18): decodeDatanormContent(), IDS_WHOLESALER_PROFILES, art1, art2, aufmassRow, catalog, cp850Bytes, decoded (+10 more)

### Community 41 - "Module Cluster 41"
Cohesion: 0.14
Nodes (14): DatevBookingItem, DatevHeaderConfig, downloadZugferdXml(), esc(), generateZugferdXml(), validateLeitwegId(), ZugferdInvoiceData, datevCsv (+6 more)

### Community 42 - "Module Cluster 42"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 43 - "Module Cluster 43"
Cohesion: 0.11
Nodes (16): SignaturePadProps, BILLABLE_FILTER_OPTIONS, CLIENT_STATUS_LABELS, deDict, dict, enDict, getBillableFilterOptions(), getGroupByOptions() (+8 more)

### Community 44 - "Module Cluster 44"
Cohesion: 0.24
Nodes (12): QuickAddMenu(), PRIORITY_OPTIONS, STATUS_OPTIONS, TaskContextMenu(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuRadioItem(), DropdownMenuShortcut() (+4 more)

### Community 45 - "Module Cluster 45"
Cohesion: 0.33
Nodes (17): authenticateSuperuser(), daysOffset(), ensureSchema(), syncCollection(), log(), main(), pb, pick() (+9 more)

### Community 46 - "Module Cluster 46"
Cohesion: 0.26
Nodes (14): createChecklistItemAction(), createTaskAction(), CreateTaskSchema, deleteChecklistItemAction(), deleteTaskAction(), deleteTaskFileAction(), updateChecklistItemAction(), updateTaskAction() (+6 more)

### Community 47 - "Module Cluster 47"
Cohesion: 0.13
Nodes (12): __dirname, __filename, handleToolsCall(), handleToolsList(), projectRoot, rl, sendResponse(), b64 (+4 more)

### Community 48 - "Module Cluster 48"
Cohesion: 0.12
Nodes (13): marked, puppeteer, __dirname, html, htmlPath, pdfPath, args, BRANDS (+5 more)

### Community 49 - "Module Cluster 49"
Cohesion: 0.27
Nodes (12): DEMO_GUESTS, GET(), POST(), AppConfig, detectModeFromHostname(), getAppConfig(), getAppMode(), getAuthCookieName() (+4 more)

### Community 50 - "Module Cluster 50"
Cohesion: 0.16
Nodes (12): createCraftClientAction(), CreateCraftClientSchema, createProjectAction(), CreateProjectSchema, deleteProjectAction(), revalidateProjectsPath(), updateProjectAction(), UpdateProjectSchema (+4 more)

### Community 51 - "Module Cluster 51"
Cohesion: 0.13
Nodes (14): badProject, customRates, deficitEntries, emptyProject, heavyTimeEntries, invoices1, project1, siteReports1 (+6 more)

### Community 52 - "Module Cluster 52"
Cohesion: 0.23
Nodes (11): createTimeEntryAction(), CreateTimeEntrySchema, updateTimeEntryAction(), UpdateTimeEntrySchema, ManualTimeEntry(), ManualTimeEntryProps, parseLocalDate(), parseLocalDateTime() (+3 more)

### Community 53 - "Module Cluster 53"
Cohesion: 0.25
Nodes (10): dynamic, GET(), getAuthUser(), POST(), GET(), CraftLicenseRecord, assertCraftFeatureEntitlement(), DEFAULT_GLOBAL_FEATURES (+2 more)

### Community 54 - "Module Cluster 54"
Cohesion: 0.21
Nodes (12): RFC-1918, RFC-3927, RFC-4193, RFC-6598, BLOCKED_CIDRS, BLOCKED_HOSTNAMES, ipv4ToNumber(), isIPv4InCidr() (+4 more)

### Community 55 - "Module Cluster 55"
Cohesion: 0.22
Nodes (10): MonteurTimeClockClient(), MonteurTimeClockClientProps, CraftTimePage(), dynamic, ACTIVITY_META, ActivityType, computeDistanceMeters(), MonteurTimeClock() (+2 more)

### Community 56 - "Module Cluster 56"
Cohesion: 0.24
Nodes (12): formatDate(), formatFileSize(), formatMinutes(), getFileUrl(), getPriorityColor(), parseMinutesInput(), TASK_TYPE_COLORS, TASK_TYPE_LABELS (+4 more)

### Community 57 - "Module Cluster 57"
Cohesion: 0.31
Nodes (11): DayEntriesDialogProps, MonthViewProps, TimeExportButton(), TimeExportButtonProps, WeekViewProps, TimeEntryRecord, buildStundenreportInput(), formatCurrency() (+3 more)

### Community 58 - "Module Cluster 58"
Cohesion: 0.23
Nodes (6): globalPoolKey, GlobalWithPool, PdfPriority, PdfRenderOptions, pdfService, PlaywrightBrowserPool

### Community 59 - "Module Cluster 59"
Cohesion: 0.17
Nodes (4): CRAFT_FEATURES, CRAFT_TIERS, engine, EntitlementEngine

### Community 60 - "Module Cluster 60"
Cohesion: 0.15
Nodes (11): agentExtensions, currentSession, events, { execSync }, fs, normalizedWorkspace, path, reportPath (+3 more)

### Community 61 - "Module Cluster 61"
Cohesion: 0.32
Nodes (9): apiGetAll(), apiPost(), daysAgo(), daysFromNow(), pick(), populateData(), createTask(), randomInt() (+1 more)

### Community 62 - "Module Cluster 62"
Cohesion: 0.23
Nodes (10): RFC-6585, apiRateLimiter, BucketEntry, createRateLimitResponse(), loginRateLimiter, RateLimiterConfig, RateLimitResult, reportsRateLimiter (+2 more)

### Community 63 - "Module Cluster 63"
Cohesion: 0.26
Nodes (11): generateId(), generatePosNr(), MeasurementGrid(), MeasurementGridProps, parseExpression(), safeEval(), Token, tokenize() (+3 more)

### Community 64 - "Module Cluster 64"
Cohesion: 0.17
Nodes (11): BaseRecord, ClientRecord, ExpandedClient, ExpandedProject, ExpandedTask, ExpandedTimeEntry, ProjectRecord, TaskRecord (+3 more)

### Community 65 - "Module Cluster 65"
Cohesion: 0.27
Nodes (9): checkSqliteCli(), DB_FILE, { execSync, spawnSync }, formatTimestamp(), fs, path, performBackup(), RETENTION_DAYS (+1 more)

### Community 66 - "Module Cluster 66"
Cohesion: 0.31
Nodes (9): apiPost(), daysAgo(), fs, login(), main(), path, SESSIONS, toISO() (+1 more)

### Community 67 - "Module Cluster 67"
Cohesion: 0.29
Nodes (8): api(), crypto, fs, genPassword(), main(), path, pick(), randomInt()

### Community 68 - "Module Cluster 68"
Cohesion: 0.24
Nodes (7): dynamic, inter, metadata, RootLayout(), viewport, Toaster(), next-themes

### Community 70 - "Module Cluster 70"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 71 - "Module Cluster 71"
Cohesion: 0.33
Nodes (7): getTimeAgo(), RenderCommentContent(), TaskComments(), TaskCommentsProps, MentionInput(), MentionInputProps, TaskCommentRecord

### Community 72 - "Module Cluster 72"
Cohesion: 0.31
Nodes (7): CalculateBillableOptions, ROUNDING_INTERVAL_OPTIONS, ROUNDING_MODE_OPTIONS, BillingRoundingInterval, BillingRoundingMode, UserLanguage, SettingsState

### Community 73 - "Module Cluster 73"
Cohesion: 0.22
Nodes (4): frappe-gantt, Gantt, GanttOptions, GanttTaskInput

### Community 74 - "Module Cluster 74"
Cohesion: 0.50
Nodes (7): authenticate(), calculateNextDate(), createRecurringTaskCopy(), findDueRecurringTasks(), isPastEndDate(), main(), updateOriginalTaskNextDate()

### Community 75 - "Module Cluster 75"
Cohesion: 0.32
Nodes (7): attemptRecovery(), checkSqliteCli(), DB_FILE, { execSync, spawnSync }, fs, path, runHealthcheck()

### Community 76 - "Module Cluster 76"
Cohesion: 0.32
Nodes (7): CacheEntry, cacheKey(), evictIfNeeded(), GET(), globalTileCacheKey, GlobalWithCache, TileCache

### Community 77 - "Module Cluster 77"
Cohesion: 0.50
Nodes (6): GenerateReportButton(), GenerateReportButtonProps, TimeEntryReportRecord, generateTimeEntryReport(), generateTimeEntryReportBlob(), ReportGenerationContext

### Community 78 - "Module Cluster 78"
Cohesion: 0.32
Nodes (6): { execSync }, https, httpsRequest(), parseAuditResult(), PROVIDERS, runAISecurityAudit()

### Community 79 - "Module Cluster 79"
Cohesion: 0.53
Nodes (4): api(), main(), pick(), randomInt()

### Community 80 - "Module Cluster 80"
Cohesion: 0.47
Nodes (5): escapeHtml(), markEmailSent(), NOTIFICATION_SUBJECTS, NOTIFICATION_TYPE_TO_SETTING, sendEmailNotifications()

### Community 81 - "Module Cluster 81"
Cohesion: 0.47
Nodes (4): CraftReportPdfData, esc(), generateSiteReportHtml(), MeasurementRecord

### Community 82 - "Module Cluster 82"
Cohesion: 0.47
Nodes (4): api(), assert(), CANDIDATE_CREDENTIALS, runTests()

### Community 83 - "Module Cluster 83"
Cohesion: 0.40
Nodes (3): email, password, RULES

### Community 84 - "Module Cluster 84"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 85 - "Module Cluster 85"
Cohesion: 0.40
Nodes (4): RichTextEditorProps, @tiptap/extension-placeholder, @tiptap/react, @tiptap/starter-kit

### Community 86 - "Module Cluster 86"
Cohesion: 0.50
Nodes (4): CompressedEvidenceResult, compressEvidenceImage(), computeSha256(), ImageCompressOptions

### Community 88 - "Module Cluster 88"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 89 - "Module Cluster 89"
Cohesion: 0.50
Nodes (3): checkPort(), main(), ports

### Community 90 - "Module Cluster 90"
Cohesion: 0.60
Nodes (4): inspectAllUsers(), main(), pb, testCredentials()

### Community 91 - "Module Cluster 91"
Cohesion: 0.83
Nodes (3): buildEmailHtml(), escapeHtml(), handleNotificationSave()

### Community 93 - "Module Cluster 93"
Cohesion: 1.00
Nodes (3): api(), main(), safePost()

### Community 94 - "Module Cluster 94"
Cohesion: 1.00
Nodes (3): api(), main(), safePost()

### Community 95 - "Module Cluster 95"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 97 - "Module Cluster 97"
Cohesion: 0.67
Nodes (3): buildAdjacencyMap(), DependencyLink, wouldIntroduceCycle()

### Community 98 - "Module Cluster 98"
Cohesion: 0.67
Nodes (3): main(), testUrl(), urlsToTest

### Community 99 - "Module Cluster 99"
Cohesion: 0.67
Nodes (3): main(), pb, testUser()

### Community 100 - "Module Cluster 100"
Cohesion: 0.67
Nodes (3): pb, run(), testAuth()

### Community 103 - "Module Cluster 103"
Cohesion: 0.67
Nodes (3): SelectOption, TranslatedSelectProps, TranslationKey

## Knowledge Gaps
- **27 isolated node(s):** `@types/leaflet`, `framer-motion`, `frappe-gantt`, `next`, `playwright` (+22 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 929 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **111 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `Client CRUD & Error Boundaries` to `Admin Settings, Craft Hub & Team`, `Planner & Dashboard Workspace`, `Site Reports, Evidence & IDS Carts`, `Project Details & Task Views`, `Client Details & Team Views`, `User Admin & Dashboard Overview`, `Dashboard Shell & Mobile Navigation`, `Preview & Showcase UI`, `Geofencing & Leaflet Map Editor`, `Craft Hub & Cost Calculation`, `Module Cluster 20`, `Module Cluster 21`, `Module Cluster 23`, `Module Cluster 30`, `Module Cluster 32`, `Module Cluster 34`, `Module Cluster 35`, `Module Cluster 36`, `Module Cluster 43`, `Module Cluster 44`, `Module Cluster 46`, `Module Cluster 50`, `Module Cluster 52`, `Module Cluster 55`, `Module Cluster 56`, `Module Cluster 57`, `Module Cluster 63`, `Module Cluster 68`, `Module Cluster 69`, `Module Cluster 71`, `Module Cluster 77`, `Module Cluster 85`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **What connects `@types/leaflet`, `framer-motion`, `frappe-gantt` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Settings, Craft Hub & Team` be split into smaller, more focused modules?**
  _Cohesion score 0.05825014679976512 - nodes in this community are weakly interconnected._
- **Why does `POST()` connect `Module Cluster 29` to `Playwright Live Verification Tools`, `Core & Craft Server Actions`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `Planner & Dashboard Workspace` be split into smaller, more focused modules?**
  _Cohesion score 0.05194805194805195 - nodes in this community are weakly interconnected._
- **Why does `verifyUserSession()` connect `Core & Craft Server Actions` to `Admin Settings, Craft Hub & Team`, `Module Cluster 34`, `Site Reports, Evidence & IDS Carts`, `Module Cluster 46`, `Module Cluster 49`, `Module Cluster 50`, `Craft Hub & Cost Calculation`, `Module Cluster 52`, `Module Cluster 53`, `Module Cluster 20`, `Module Cluster 22`, `Module Cluster 29`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `Playwright Live Verification Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.031207598371777476 - nodes in this community are weakly interconnected._