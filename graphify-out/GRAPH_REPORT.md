# Graph Report - vibeforce-flow-os  (2026-11-26)

## Corpus Check
- Large corpus: 494 files · ~583,113 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2057 nodes · 6079 edges · 197 communities (96 shown, 101 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Auth, Tasks & Core Workspace
- Admin Settings, Profile & Craft Hub
- PocketBase SDK & Auth Routes
- Playwright Live Verification Tools
- GAEB XML & D83 Engine
- Project Details & Plan Pinning
- Python Research & Schema Tools
- Domain Constants & Label Maps
- M007 Master Audit Suite
- Frontend Dependencies Manifest
- User Admin & Server Actions
- Client Details & Team Views
- PocketBase TypeScript Contracts
- Preview & Showcase UI
- Client CRUD & Error Boundaries
- Planner & Team Resource Views
- IDS Hook, Wholesale & Measurements
- Task & Time Entry Server Actions
- Geofencing & Leaflet Map Editor
- Time Reports & Project List
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
- Module Cluster 92
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
- Module Cluster 109
- Module Cluster 120

## God Nodes (most connected - your core abstractions)
1. `Button()` - 121 edges
2. `react` - 112 edges
3. `lucide-react` - 99 edges
4. `verifyUserSession()` - 98 edges
5. `cn()` - 89 edges
6. `next` - 88 edges
7. `getAdminPB()` - 71 edges
8. `Input()` - 66 edges
9. `Badge()` - 63 edges
10. `Card()` - 61 edges

## Surprising Connections (you probably didn't know these)
- `validateStufe2()` --calls--> `getAuthCookieName()`  [EXTRACTED]
  tools/test_stufe2_routing.mjs → frontend/src/config/app-mode.ts
- `GeofenceCheckinPrompt()` --calls--> `t()`  [EXTRACTED]
  frontend/src/components/craft/GeofenceCheckinPrompt.tsx → frontend/src/lib/i18n.ts
- `GanttViewProps` --references--> `GanttTask`  [EXTRACTED]
  frontend/src/components/planner/GanttView.tsx → frontend/src/lib/gantt-utils.ts
- `KanbanViewProps` --references--> `TaskRecord`  [EXTRACTED]
  frontend/src/components/planner/KanbanView.tsx → frontend/src/lib/pocketbase-types.ts
- `ListViewProps` --references--> `TaskRecord`  [EXTRACTED]
  frontend/src/components/planner/ListView.tsx → frontend/src/lib/pocketbase-types.ts

## Import Cycles
- None detected.

## Communities (197 total, 101 thin omitted)

### Community 0 - "Auth, Tasks & Core Workspace"
Cohesion: 0.07
Nodes (126): LoginClient(), ResetPasswordForm(), ResetPasswordLoading(), ResetPasswordPage(), AdminUsersPage(), UserItem, ClientDetailsClient(), ClientDetailsClientProps (+118 more)

### Community 1 - "Admin Settings, Profile & Craft Hub"
Cohesion: 0.07
Nodes (74): getImportedIdsCartAction(), AdminSettingsPage(), AppSettings, DEFAULT_SETTINGS, ClientDetailsLoading(), ClientsLoading(), CraftHubClient(), CraftTab (+66 more)

### Community 2 - "PocketBase SDK & Auth Routes"
Cohesion: 0.04
Nodes (28): pb, pb, pb, DEMO_GUESTS, GET(), POST(), getAuthCookieName(), createPocketBase() (+20 more)

### Community 3 - "Playwright Live Verification Tools"
Cohesion: 0.04
Nodes (3): { chromium }, main(), testUser()

### Community 4 - "GAEB XML & D83 Engine"
Cohesion: 0.06
Nodes (47): computeGaeb90CategoryTotal(), CP437_BYTE_MAP, decodeCp437Byte(), decodeGaeb90Bytes(), escapeXml(), extractG90Number(), findChildByTag(), findChildrenByTag() (+39 more)

### Community 5 - "Project Details & Plan Pinning"
Cohesion: 0.10
Nodes (38): GeofenceMapEditor, ManageExpensesDialog(), ManageExpensesDialogProps, ProjectDetailsClient(), ProjectDetailsClientProps, TasksPageClient(), PlanPinningManager(), cn() (+30 more)

### Community 6 - "Python Research & Schema Tools"
Cohesion: 0.09
Nodes (21): call_deepseek_api(), call_gemini_api(), call_llm_api(), compile_pdf(), format_as_yaml(), _to_yaml(), load_env_file(), main() (+13 more)

### Community 7 - "Domain Constants & Label Maps"
Cohesion: 0.05
Nodes (43): ALL_LABEL_MAPS, BILLABLE_FILTERS, BillableFilter, CLIENT_STATUS_LABEL_MAP, CLIENT_STATUSES, ClientStatus, GEOFENCE_TYPE_LABEL_MAP, GEOFENCE_TYPES (+35 more)

### Community 8 - "M007 Master Audit Suite"
Cohesion: 0.06
Nodes (30): auditProject, calc1, calc2, calc3, datanormParsed, datevCsv, datevLines, datevRecords (+22 more)

### Community 9 - "Frontend Dependencies Manifest"
Cohesion: 0.06
Nodes (34): dependencies, @base-ui/react, class-variance-authority, clsx, cmdk, date-fns, framer-motion, frappe-gantt (+26 more)

### Community 10 - "User Admin & Server Actions"
Cohesion: 0.10
Nodes (25): createUserAction(), deleteUserAdminAction(), resetUserPasswordAction(), toggleUserActiveAction(), updateUserProfileAdminAction(), updateUserRoleAction(), updateUserSupervisorAction(), createCommentAction() (+17 more)

### Community 11 - "Client Details & Team Views"
Cohesion: 0.08
Nodes (14): categories, chips, CollapsibleSection(), GlobalFixDemo(), PreviewPage(), statusColor(), styles, TableCardView() (+6 more)

### Community 12 - "PocketBase TypeScript Contracts"
Cohesion: 0.10
Nodes (26): INITIAL_SAMPLE_DEFECTS, PlanPinningManagerProps, TRADES_LIST, BaseRecord, CraftLicenseRecord, DefectPinRecord, DefectSeverity, DefectStatus (+18 more)

### Community 13 - "Preview & Showcase UI"
Cohesion: 0.11
Nodes (25): TaskDetailsSheet(), TaskDetailsSheetProps, CardAction(), CardFooter(), Accordion(), AccordionItem, AccordionProps, CollapsibleSection() (+17 more)

### Community 14 - "Client CRUD & Error Boundaries"
Cohesion: 0.08
Nodes (9): run(), { chromium }, fs, path, SNAPSHOTS_DIR, OUT_DIR, OUT_DIR, sampleD83Content (+1 more)

### Community 15 - "Planner & Team Resource Views"
Cohesion: 0.07
Nodes (24): playwright, pocketbase, name, private, scripts, build, dev, lint (+16 more)

### Community 16 - "IDS Hook, Wholesale & Measurements"
Cohesion: 0.09
Nodes (25): getProjectCostSummaryAction(), QualificationLevel, calculateProjectCostSummary(), CostRates, DEFAULT_COST_RATES, DEFAULT_LABOUR_SOURCE, LabourSource, ProfitMarginStatus (+17 more)

### Community 17 - "Task & Time Entry Server Actions"
Cohesion: 0.17
Nodes (23): createChecklistItemAction(), createTaskAction(), createTaskLinkAction(), CreateTaskSchema, deleteChecklistItemAction(), deleteTaskAction(), deleteTaskFileAction(), deleteTaskLinkAction() (+15 more)

### Community 18 - "Geofencing & Leaflet Map Editor"
Cohesion: 0.13
Nodes (19): Circle, GeofenceMapEditor(), GeofenceMapEditorProps, MapClickHandler(), MapContainer, Marker, Polygon, TileLayer (+11 more)

### Community 19 - "Time Reports & Project List"
Cohesion: 0.22
Nodes (17): ReportTab, QuickAddMenu(), ProjectList(), ReportFilters(), ReportFilterValues, ReportRow, SaveTemplateDialogProps, PRIORITY_OPTIONS (+9 more)

### Community 20 - "Module Cluster 20"
Cohesion: 0.22
Nodes (22): useDraftAutosave(), useOfflineSync(), clearReportDraft(), deleteMediaBlob(), getDB(), getMediaBlobsForReport(), getPendingSyncCount(), getPendingSyncItems() (+14 more)

### Community 21 - "Module Cluster 21"
Cohesion: 0.08
Nodes (23): agent, code, debug, explore, general, orchestrator, plan, description (+15 more)

### Community 22 - "Module Cluster 22"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "Module Cluster 23"
Cohesion: 0.09
Nodes (21): playwright, pocketbase, name, private, version, class-variance-authority, clsx, framer-motion (+13 more)

### Community 24 - "Module Cluster 24"
Cohesion: 0.15
Nodes (18): CreateEvidenceItemInput, getEvidenceItemsByReportAction(), createMeasurementAction(), CreateMeasurementInput, CreateMeasurementSchema, deleteMeasurementAction(), getMeasurementsByReportAction(), updateMeasurementAction() (+10 more)

### Community 25 - "Module Cluster 25"
Cohesion: 0.15
Nodes (17): POST(), reportFontsCss, reportTemplateDark, reportTemplateEditorial, reportTemplateHtml, reportTemplateSwiss, buildProjectTable(), buildStundenreportBodyHtml() (+9 more)

### Community 26 - "Module Cluster 26"
Cohesion: 0.22
Nodes (19): MyTask, UserWorkload, EditClientDialogProps, NewCraftClientDialogProps, ReportFiltersProps, UtilizationReportProps, TaskContextMenuProps, GanttData (+11 more)

### Community 27 - "Module Cluster 27"
Cohesion: 0.19
Nodes (20): SubTab, WholesaleManager(), calculateMargin(), calculatePurchasePrice(), calculateSellingPrice(), CP850_TABLE, DatanormArticle, DatanormCatalog (+12 more)

### Community 28 - "Module Cluster 28"
Cohesion: 0.10
Nodes (8): nextConfig, securityHeaders, dynamic, metadata, metadata, NavTab, TABS, next

### Community 29 - "Module Cluster 29"
Cohesion: 0.12
Nodes (11): CsvBridge, fs, path, { CsvBridge }, path, prepareTest(), { Transformer }, PRIORITY_MAP (+3 more)

### Community 30 - "Module Cluster 30"
Cohesion: 0.17
Nodes (16): RFC-6585, AppConfig, detectModeFromHostname(), getAppConfig(), getAppMode(), isAgencyMode(), apiRateLimiter, BucketEntry (+8 more)

### Community 31 - "Module Cluster 31"
Cohesion: 0.10
Nodes (18): check, compact, dotted, expired, expiredToken, jsonCart, project, sAdditive (+10 more)

### Community 32 - "Module Cluster 32"
Cohesion: 0.15
Nodes (18): CraftHubClientProps, CraftPage(), dynamic, CostCockpitProps, CraftEntitlementsModalProps, DailySiteReportFormProps, NewBaustelleDialogProps, QuickCreateReportModalProps (+10 more)

### Community 33 - "Module Cluster 33"
Cohesion: 0.22
Nodes (14): DashboardLayout(), NavItem(), SearchResult, LiveClock(), MobileTabBar(), SimpleActionMenu(), SidebarProvider(), useOffline() (+6 more)

### Community 34 - "Module Cluster 34"
Cohesion: 0.20
Nodes (16): dynamic, TasksPage(), CommandItem(), CommandPalette(), AppMode, filterClientsByMode(), filterProjectsByMode(), filterTasksByMode() (+8 more)

### Community 35 - "Module Cluster 35"
Cohesion: 0.11
Nodes (18): decodeDatanormContent(), IDS_WHOLESALER_PROFILES, art1, art2, aufmassRow, catalog, cp850Bytes, decoded (+10 more)

### Community 36 - "Module Cluster 36"
Cohesion: 0.14
Nodes (14): DatevBookingItem, DatevHeaderConfig, downloadZugferdXml(), esc(), generateZugferdXml(), validateLeitwegId(), ZugferdInvoiceData, datevCsv (+6 more)

### Community 37 - "Module Cluster 37"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 38 - "Module Cluster 38"
Cohesion: 0.23
Nodes (14): createEvidenceItemAction(), createSiteReportAction(), signSiteReportAction(), NewSiteReportPage(), NewSiteReportPageProps, DailySiteReportForm(), computeSha256(), EvidencePhotoItem (+6 more)

### Community 39 - "Module Cluster 39"
Cohesion: 0.23
Nodes (12): deleteNotificationAction(), markAllNotificationsAsReadAction(), markNotificationAsReadAction(), NotificationsPage(), NOTIFICATION_ICONS, NotificationBell(), NOTIFICATION_ICONS, NOTIFICATION_TYPE_LABELS (+4 more)

### Community 40 - "Module Cluster 40"
Cohesion: 0.11
Nodes (16): GeofenceCheckinPrompt(), GeofenceCheckinPromptProps, BILLABLE_FILTER_OPTIONS, CLIENT_STATUS_LABELS, deDict, dict, enDict, getBillableFilterOptions() (+8 more)

### Community 41 - "Module Cluster 41"
Cohesion: 0.33
Nodes (17): authenticateSuperuser(), daysOffset(), ensureSchema(), syncCollection(), log(), main(), pb, pick() (+9 more)

### Community 42 - "Module Cluster 42"
Cohesion: 0.15
Nodes (11): createReportAction(), DEFAULT_OPTIONS, RetryOptions, sleep(), withRetry(), CachedAdminAuth, getAdminToken(), getAuthenticatedOrAdminPB() (+3 more)

### Community 43 - "Module Cluster 43"
Cohesion: 0.21
Nodes (15): DashboardPage(), DashboardStats, formatHoursMinutes(), getLinkTypeColor(), getLinkTypeLabel(), getPriorityBadge(), getStatusBadge(), getTodayDateString() (+7 more)

### Community 44 - "Module Cluster 44"
Cohesion: 0.18
Nodes (15): BillingLineItem, BillingSummary, InvoiceDocument(), InvoiceDocumentProps, printInvoice(), printServiceRecord(), renderLogo(), ReportDocument() (+7 more)

### Community 45 - "Module Cluster 45"
Cohesion: 0.20
Nodes (12): calculateBillableMinutes(), CalculateBillableOptions, ROUNDING_INTERVAL_OPTIONS, ROUNDING_MODE_OPTIONS, BillingRoundingInterval, BillingRoundingMode, UserLanguage, UserPreferences (+4 more)

### Community 46 - "Module Cluster 46"
Cohesion: 0.14
Nodes (11): { execSync }, https, httpsRequest(), parseAuditResult(), PROVIDERS, runAISecurityAudit(), b64, { execSync } (+3 more)

### Community 47 - "Module Cluster 47"
Cohesion: 0.20
Nodes (14): createIdsHookToken(), escapeXml(), generateIdsCartXml(), generateIdsPunchoutUrl(), hmacSha256Hex(), IdsCartHeader, IdsCartItem, IdsPunchoutConfig (+6 more)

### Community 48 - "Module Cluster 48"
Cohesion: 0.14
Nodes (10): createClientAction(), CreateClientSchema, deleteClientAction(), revalidateClientPath(), updateClientAction(), UpdateClientSchema, createCraftClientAction(), CreateCraftClientSchema (+2 more)

### Community 49 - "Module Cluster 49"
Cohesion: 0.21
Nodes (12): RFC-1918, RFC-3927, RFC-4193, RFC-6598, BLOCKED_CIDRS, BLOCKED_HOSTNAMES, ipv4ToNumber(), isIPv4InCidr() (+4 more)

### Community 50 - "Module Cluster 50"
Cohesion: 0.23
Nodes (10): generateCraftInvoiceAction(), CraftReportPdfData, esc(), generateSiteReportHtml(), globalPoolKey, GlobalWithPool, PdfPriority, PdfRenderOptions (+2 more)

### Community 51 - "Module Cluster 51"
Cohesion: 0.19
Nodes (10): buildAddendumPayload(), createReportRevisionAction(), CreateSiteReportInput, CreateSiteReportSchema, getSiteReportsByProjectAction(), updateSiteReportAction(), UpdateSiteReportInput, UpdateSiteReportSchema (+2 more)

### Community 52 - "Module Cluster 52"
Cohesion: 0.23
Nodes (10): GET(), CORS_HEADERS, corsJson(), dynamic, GET(), POST(), extractXmlTag(), parseIdsCartJson() (+2 more)

### Community 53 - "Module Cluster 53"
Cohesion: 0.23
Nodes (12): generateId(), generatePosNr(), MeasurementGrid(), MeasurementGridProps, parseExpression(), safeEval(), Token, tokenize() (+4 more)

### Community 54 - "Module Cluster 54"
Cohesion: 0.21
Nodes (12): formatDate(), ListView(), ListViewProps, PRIORITY_COLORS, PRIORITY_LABELS, SortColumn, SortDir, STATUS_COLORS (+4 more)

### Community 55 - "Module Cluster 55"
Cohesion: 0.17
Nodes (4): CRAFT_FEATURES, CRAFT_TIERS, engine, EntitlementEngine

### Community 56 - "Module Cluster 56"
Cohesion: 0.15
Nodes (11): agentExtensions, currentSession, events, { execSync }, fs, normalizedWorkspace, path, reportPath (+3 more)

### Community 57 - "Module Cluster 57"
Cohesion: 0.32
Nodes (9): apiGetAll(), apiPost(), daysAgo(), daysFromNow(), pick(), populateData(), createTask(), randomInt() (+1 more)

### Community 58 - "Module Cluster 58"
Cohesion: 0.27
Nodes (9): revalidateClientsPath(), dynamic, LoginPage(), ClientsPageClient(), ClientsPage(), ClientList(), formatCurrency(), getKundenStatusBadge() (+1 more)

### Community 59 - "Module Cluster 59"
Cohesion: 0.35
Nodes (10): EXPERTISE_OPTIONS, getWorkloadColor(), getWorkloadTextColor(), TeamPage(), DropdownMenuCheckboxItem(), DropdownMenuSubTrigger(), Tabs(), TabsContent() (+2 more)

### Community 60 - "Module Cluster 60"
Cohesion: 0.17
Nodes (11): BaseRecord, ClientRecord, ExpandedClient, ExpandedProject, ExpandedTask, ExpandedTimeEntry, ProjectRecord, TaskRecord (+3 more)

### Community 61 - "Module Cluster 61"
Cohesion: 0.25
Nodes (8): api(), crypto, fs, genPassword(), main(), path, pick(), randomInt()

### Community 62 - "Module Cluster 62"
Cohesion: 0.24
Nodes (9): createProjectAction(), CreateProjectSchema, deleteProjectAction(), revalidateProjectsPath(), updateProjectAction(), UpdateProjectSchema, GeofencePageProps, ProjectGeofencePage() (+1 more)

### Community 63 - "Module Cluster 63"
Cohesion: 0.44
Nodes (9): ReportsExportDropdown(), ReportsPage(), TimeExportButton(), downloadReportPDF(), buildStundenreportInput(), formatCurrency(), formatHoursHM(), getClientName() (+1 more)

### Community 64 - "Module Cluster 64"
Cohesion: 0.20
Nodes (7): __dirname, escapeActiveDialogs(), __filename, run(), SCREENSHOTS_DIR, __dirname, __filename

### Community 65 - "Module Cluster 65"
Cohesion: 0.27
Nodes (9): checkSqliteCli(), DB_FILE, { execSync, spawnSync }, formatTimestamp(), fs, path, performBackup(), RETENTION_DAYS (+1 more)

### Community 66 - "Module Cluster 66"
Cohesion: 0.31
Nodes (9): apiPost(), daysAgo(), fs, login(), main(), path, SESSIONS, toISO() (+1 more)

### Community 67 - "Module Cluster 67"
Cohesion: 0.24
Nodes (7): dynamic, inter, metadata, RootLayout(), viewport, Toaster(), next-themes

### Community 69 - "Module Cluster 69"
Cohesion: 0.24
Nodes (9): COLUMNS, formatDate(), KanbanCard(), KanbanView(), KanbanViewProps, PRIORITY_BADGE, PRIORITY_COLORS, PRIORITY_LABELS (+1 more)

### Community 70 - "Module Cluster 70"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 71 - "Module Cluster 71"
Cohesion: 0.33
Nodes (7): removeAvatarAction(), updateAvatarAction(), updateNotificationSettingsAction(), updatePasswordAction(), updateUserPreferencesAction(), AvatarUpload(), AvatarUploadProps

### Community 72 - "Module Cluster 72"
Cohesion: 0.22
Nodes (4): frappe-gantt, Gantt, GanttOptions, GanttTaskInput

### Community 73 - "Module Cluster 73"
Cohesion: 0.50
Nodes (7): authenticate(), calculateNextDate(), createRecurringTaskCopy(), findDueRecurringTasks(), isPastEndDate(), main(), updateOriginalTaskNextDate()

### Community 74 - "Module Cluster 74"
Cohesion: 0.32
Nodes (7): attemptRecovery(), checkSqliteCli(), DB_FILE, { execSync, spawnSync }, fs, path, runHealthcheck()

### Community 75 - "Module Cluster 75"
Cohesion: 0.32
Nodes (7): CacheEntry, cacheKey(), evictIfNeeded(), GET(), globalTileCacheKey, GlobalWithCache, TileCache

### Community 76 - "Module Cluster 76"
Cohesion: 0.50
Nodes (6): GenerateReportButton(), GenerateReportButtonProps, TimeEntryReportRecord, generateTimeEntryReport(), generateTimeEntryReportBlob(), ReportGenerationContext

### Community 78 - "Module Cluster 78"
Cohesion: 0.53
Nodes (4): api(), main(), pick(), randomInt()

### Community 79 - "Module Cluster 79"
Cohesion: 0.47
Nodes (5): escapeHtml(), markEmailSent(), NOTIFICATION_SUBJECTS, NOTIFICATION_TYPE_TO_SETTING, sendEmailNotifications()

### Community 80 - "Module Cluster 80"
Cohesion: 0.33
Nodes (5): CHART_COLORS, ChartDataPoint, ReportChart(), ReportChartProps, recharts

### Community 81 - "Module Cluster 81"
Cohesion: 0.33
Nodes (6): dependencies, @faker-js/faker, marked, playwright, pocketbase, puppeteer

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
Cohesion: 0.40
Nodes (3): SidebarContext, SidebarContextValue, SidebarProviderProps

### Community 87 - "Module Cluster 87"
Cohesion: 0.50
Nodes (4): CompressedEvidenceResult, compressEvidenceImage(), computeSha256(), ImageCompressOptions

### Community 89 - "Module Cluster 89"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 90 - "Module Cluster 90"
Cohesion: 0.50
Nodes (3): checkPort(), main(), ports

### Community 91 - "Module Cluster 91"
Cohesion: 0.60
Nodes (4): inspectAllUsers(), main(), pb, testCredentials()

### Community 92 - "Module Cluster 92"
Cohesion: 0.83
Nodes (3): buildEmailHtml(), escapeHtml(), handleNotificationSave()

### Community 94 - "Module Cluster 94"
Cohesion: 1.00
Nodes (3): api(), main(), safePost()

### Community 95 - "Module Cluster 95"
Cohesion: 1.00
Nodes (3): api(), main(), safePost()

### Community 96 - "Module Cluster 96"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 97 - "Module Cluster 97"
Cohesion: 0.67
Nodes (3): buildAdjacencyMap(), DependencyLink, wouldIntroduceCycle()

### Community 98 - "Module Cluster 98"
Cohesion: 0.67
Nodes (3): main(), testUrl(), urlsToTest

### Community 101 - "Module Cluster 101"
Cohesion: 0.67
Nodes (3): SelectOption, TranslatedSelectProps, TranslationKey

## Knowledge Gaps
- **21 isolated node(s):** `@types/leaflet`, `framer-motion`, `frappe-gantt`, `playwright`, `pocketbase` (+16 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 884 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **101 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Module Cluster 28` to `Auth, Tasks & Core Workspace`, `Admin Settings, Profile & Craft Hub`, `PocketBase SDK & Auth Routes`, `Project Details & Plan Pinning`, `User Admin & Server Actions`, `PocketBase TypeScript Contracts`, `Task & Time Entry Server Actions`, `Geofencing & Leaflet Map Editor`, `Time Reports & Project List`, `Module Cluster 23`, `Module Cluster 24`, `Module Cluster 25`, `Module Cluster 30`, `Module Cluster 33`, `Module Cluster 34`, `Module Cluster 38`, `Module Cluster 39`, `Module Cluster 42`, `Module Cluster 43`, `Module Cluster 48`, `Module Cluster 50`, `Module Cluster 51`, `Module Cluster 52`, `Module Cluster 58`, `Module Cluster 59`, `Module Cluster 62`, `Module Cluster 67`, `Module Cluster 69`, `Module Cluster 71`, `Module Cluster 75`, `Module Cluster 76`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **What connects `@types/leaflet`, `framer-motion`, `frappe-gantt` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth, Tasks & Core Workspace` be split into smaller, more focused modules?**
  _Cohesion score 0.0654698386793045 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Auth, Tasks & Core Workspace` to `Admin Settings, Profile & Craft Hub`, `Project Details & Plan Pinning`, `Client Details & Team Views`, `PocketBase TypeScript Contracts`, `Preview & Showcase UI`, `Task & Time Entry Server Actions`, `Geofencing & Leaflet Map Editor`, `Time Reports & Project List`, `Module Cluster 20`, `Module Cluster 23`, `Module Cluster 26`, `Module Cluster 27`, `Module Cluster 33`, `Module Cluster 34`, `Module Cluster 38`, `Module Cluster 39`, `Module Cluster 40`, `Module Cluster 43`, `Module Cluster 44`, `Module Cluster 53`, `Module Cluster 54`, `Module Cluster 58`, `Module Cluster 59`, `Module Cluster 63`, `Module Cluster 68`, `Module Cluster 69`, `Module Cluster 71`, `Module Cluster 76`, `Module Cluster 80`, `Module Cluster 85`, `Module Cluster 86`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `Admin Settings, Profile & Craft Hub` be split into smaller, more focused modules?**
  _Cohesion score 0.07150858849887975 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Auth, Tasks & Core Workspace` to `Admin Settings, Profile & Craft Hub`, `Project Details & Plan Pinning`, `Client Details & Team Views`, `PocketBase TypeScript Contracts`, `Preview & Showcase UI`, `Task & Time Entry Server Actions`, `Geofencing & Leaflet Map Editor`, `Time Reports & Project List`, `Module Cluster 23`, `Module Cluster 27`, `Module Cluster 28`, `Module Cluster 33`, `Module Cluster 34`, `Module Cluster 38`, `Module Cluster 39`, `Module Cluster 40`, `Module Cluster 43`, `Module Cluster 51`, `Module Cluster 53`, `Module Cluster 58`, `Module Cluster 59`, `Module Cluster 62`, `Module Cluster 63`, `Module Cluster 67`, `Module Cluster 68`, `Module Cluster 71`, `Module Cluster 76`, `Module Cluster 85`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `PocketBase SDK & Auth Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.035959809624537285 - nodes in this community are weakly interconnected._