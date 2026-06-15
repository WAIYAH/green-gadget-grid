
## Goal
Transform the single-page user `Dashboard` into a full app shell (mirroring the admin pattern) with a collapsible sidebar, top header, and dedicated sub-pages for listings, transactions, swaps, profile, notifications, rewards, impact, and settings.

## New Layout (mirrors admin pattern, glass-morphism)

- `src/components/dashboard/DashboardLayout.tsx` — `SidebarProvider` shell, auth guard, breadcrumbs.
- `src/components/dashboard/DashboardSidebar.tsx` — collapsible (`collapsible="icon"`), grouped nav:
  - **Overview**: Home, Impact Tracker, Rewards
  - **My Activity**: My Listings, Transactions, Swaps, Orders
  - **Account**: Profile, Notifications, Settings
- `src/components/dashboard/DashboardHeader.tsx` — sidebar trigger, breadcrumbs, search, points pill, notifications bell w/ unread badge, user avatar menu (Profile, Settings, Logout).

## Sub-pages (all under `/dashboard/*`)

| Route | Page | Contents |
|---|---|---|
| `/dashboard` | `Dashboard.tsx` (rewritten) | KPI cards (points, listings, CO₂, swaps), points trend chart, recent activity feed, quick actions |
| `/dashboard/listings` | `DashboardListings.tsx` | Table of gadgets sold/submitted with status filters (Pending, Approved, Sold), edit/delete/relist, "Submit new" CTA |
| `/dashboard/transactions` | `DashboardTransactions.tsx` | Earnings + redemptions table, filters (type/date/status), CSV export, totals |
| `/dashboard/swaps` | `DashboardSwaps.tsx` | Tracker for swap orders with status timeline (Requested → Shipped → Delivered), filter tabs |
| `/dashboard/orders` | `DashboardOrders.tsx` | Items purchased from Swap center, tracking numbers, reorder button |
| `/dashboard/rewards` | `DashboardRewards.tsx` | Points balance, tier progress, available rewards grid, redeem flow, history |
| `/dashboard/impact` | `DashboardImpact.tsx` | CO₂ saved, e-waste diverted, water saved cards, monthly chart, badges/achievements |
| `/dashboard/profile` | `DashboardProfile.tsx` | Avatar, personal info form, address, social links, save |
| `/dashboard/notifications` | `DashboardNotifications.tsx` | Inbox list (read/unread, mark-all-read, delete) + preference toggles (email/push/SMS per category) |
| `/dashboard/settings` | `DashboardSettings.tsx` | Password change, 2FA toggle, language, theme, danger zone (delete account) |

## Technical Details

- Reuse shadcn `Sidebar`, `SidebarProvider`, `SidebarTrigger`, `Breadcrumb`, `Table`, `Tabs`, `Dialog`, `Switch`, `Badge`, `Progress`, `Avatar`.
- Auth guard inside `DashboardLayout` — redirect to `/login` if `localStorage.isAuthenticated !== "true"`.
- Active route highlighting via `NavLink` + `useLocation`; sections containing active route stay expanded.
- Mock data inline per page (no backend yet) — keep types exported for later Cloud wiring.
- Register all 10 routes in `src/App.tsx`.
- Keep existing top `Navbar` hidden inside the dashboard shell (sidebar replaces it) but keep `Footer` off these pages for an app-like feel.
- Glass morphism + emerald/lime accents to match project design tokens (no raw colors).

## Out of scope
- Real backend persistence (will hook to Lovable Cloud later).
- Email/SMS provider integration.
