---
name: User Dashboard Suite
description: Collapsible-sidebar app shell for end-users with listings, transactions, swaps, orders, rewards, impact, profile, notifications, and settings sub-pages
type: feature
---
Routes live under `/dashboard/*` and share `DashboardLayout` (sidebar 250→70px, glass header w/ points pill + notifications + profile menu, mobile bottom-nav).

Sidebar groups: Overview (Home, Impact, Rewards), My Activity (Listings, Transactions, Swaps, Orders), Account (Profile, Notifications, Settings). Auth guard redirects to `/login` if `localStorage.isAuthenticated !== "true"`.

Data is mocked inline per page — wire to Lovable Cloud later. Components live under `src/components/dashboard/` and pages are `src/pages/Dashboard*.tsx`.
