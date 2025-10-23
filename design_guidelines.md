# Enterprise HRMS Design Guidelines

## Design Approach: Material Design System

**Justification:** Selected Material Design for its proven excellence in data-dense enterprise applications, comprehensive component patterns for forms/tables/dashboards, strong visual hierarchy through elevation and spacing, and seamless integration with shadcn/ui and TailwindCSS.

**Core Principles:**
- Clarity and efficiency over decoration
- Consistent patterns across all modules for learnability
- Information hierarchy through typography and spacing
- Subtle depth through shadows, not gradients

---

## Typography System

**Font Family:** Inter (Google Fonts) for all text

**Hierarchy:**
- **Dashboard Headers:** text-3xl font-bold (30px) - Module titles, page headers
- **Section Titles:** text-2xl font-semibold (24px) - Card headers, form sections
- **Subsection Headers:** text-xl font-semibold (20px) - Table headers, widget titles
- **Body Large:** text-base font-medium (16px) - Primary content, form labels
- **Body Regular:** text-sm (14px) - Table cells, descriptions, helper text
- **Caption/Meta:** text-xs (12px) - Timestamps, badges, status indicators

**Line Heights:** Use default Tailwind leading (leading-relaxed for body text)

---

## Layout System

**Spacing Primitives:** Standardize on Tailwind units **2, 4, 6, 8, 12, 16, 20** for consistency

**Application Structure:**
- **Sidebar:** Fixed w-64, full-height navigation with role-based menu items
- **Main Content:** Full remaining width with max-w-7xl container, px-6 py-8
- **Dashboard Grid:** grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Forms:** max-w-2xl for optimal readability, space-y-6 between sections
- **Tables:** Full-width within container, overflow-x-auto wrapper

**Responsive Breakpoints:**
- Mobile: Single column, collapsible sidebar drawer
- Tablet (md:): 2-column grids, persistent sidebar
- Desktop (lg:+): 3-column grids, full layout

---

## Component Library

### Navigation & Shell
**Top Bar:** h-16, flex justify-between items-center, shadow-sm
- Logo/branding (left)
- Search bar (center, max-w-md)
- User menu, notifications icon (right)

**Sidebar:** 
- Navigation items: px-4 py-3, rounded-lg, hover and active states
- Section dividers: border-t with mt-6 pt-6
- Role indicator badge at top
- Collapse toggle for mobile

### Dashboard Components
**Stat Cards:** 
- Structure: p-6, rounded-lg, shadow-sm, border
- Icon container: h-12 w-12, rounded-full, flex items-center justify-center
- Value: text-3xl font-bold
- Label: text-sm, text-muted
- Trend indicator: Small arrow + percentage

**Chart Widgets:**
- Container: p-6, rounded-lg, shadow-sm, min-h-80
- Header: flex justify-between items-center, mb-4
- Chart area: Responsive height using aspect-ratio or fixed heights
- Legend: Below chart, flex flex-wrap gap-4

**Activity Feed:**
- Items: py-3, border-b, flex gap-3
- Avatar: h-10 w-10, rounded-full
- Content: flex-1
- Timestamp: text-xs, text-muted
- Max height with scroll: max-h-96 overflow-y-auto

### Forms & Inputs
**Form Layout:**
- Container: space-y-6, max-w-2xl
- Field groups: space-y-2
- Label: text-sm font-medium, mb-1
- Input: h-10, px-3, rounded-md, border
- Helper text: text-xs, mt-1
- Error state: border-destructive, text-destructive text

**File Upload:**
- Drag-drop zone: border-2 border-dashed, rounded-lg, p-8, text-center
- Upload icon + instruction text
- File list: mt-4, space-y-2, file items with remove button

**Date/Time Pickers:** Integrated calendar dropdown, time selector with AM/PM

### Data Display
**Tables:**
- Container: rounded-lg, border, overflow-hidden
- Header: bg-muted, px-6 py-3, text-sm font-semibold
- Rows: px-6 py-4, border-b, hover:bg-muted/50
- Actions column: Fixed right, flex gap-2 for icon buttons
- Pagination: Below table, flex justify-between items-center, py-4

**Employee Cards:**
- Grid layout: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- Card: p-4, rounded-lg, border, hover:shadow-md transition
- Avatar: h-16 w-16, rounded-full, mb-3
- Name: text-lg font-semibold
- Role/Department: text-sm text-muted
- Action buttons: mt-4, flex gap-2

**Status Badges:**
- Sizes: px-2.5 py-0.5, text-xs, rounded-full, font-medium
- States: Present (green), Absent (red), Late (yellow), On Leave (blue), Pending (gray)

### Modals & Overlays
**Modal Dialog:**
- Backdrop: Fixed overlay, backdrop-blur-sm
- Container: max-w-lg, rounded-lg, p-6, shadow-xl
- Header: text-xl font-semibold, mb-4
- Content: space-y-4
- Footer: flex justify-end gap-3, mt-6, pt-6, border-t

**Notifications Panel:**
- Slide-out from right: w-96, h-full, shadow-2xl
- Header: p-4, border-b, text-lg font-semibold
- List: Scrollable, max-h-screen, p-4, space-y-3
- Items: p-3, rounded-lg, hover:bg-muted/50

### Attendance Module Specifics
**Clock In/Out Interface:**
- Centered card: max-w-md, p-8, text-center
- Large time display: text-5xl font-bold
- Facial recognition preview: aspect-video, rounded-lg, mb-6
- Action button: Large, w-full, py-4

**Attendance Calendar:**
- Full calendar grid view with color-coded days
- Legend: Present, Absent, Late, Leave, Holiday
- Click for details modal

### Leave Management
**Leave Request Form:**
- Date range picker (start/end dates)
- Leave type dropdown (Sick, Casual, Vacation, etc.)
- Reason textarea: min-h-24
- Attachment upload
- Submit button

**Approval Dashboard:**
- Pending requests table with expandable rows
- Approve/Reject actions with comment modal
- Leave balance widget per employee

### Payroll Module
**Payslip Viewer:**
- Two-column layout: Earnings (left), Deductions (right)
- Line items: flex justify-between, py-2, border-b
- Totals: text-lg font-bold, pt-4, border-t-2
- Download PDF button: Fixed top-right

**Salary Calculator:**
- Input fields for base, bonuses, deductions
- Real-time calculation display
- Breakdown charts using Chart.js

### Recruitment Module
**Job Posting Card:**
- Title: text-xl font-semibold
- Meta row: Location, Type, Posted date (flex gap-4, text-sm)
- Description: line-clamp-3
- Application count badge
- Actions: View Details, Edit, Close

**Resume Viewer:**
- Split view: PDF preview (left 60%), Extracted data (right 40%)
- AI score display: Circular progress indicator, large percentage
- Skills match: Chip list with match highlighting
- Action buttons: Shortlist, Reject, Schedule Interview

**Candidate Ranking Table:**
- Sortable columns: Name, Score, Experience, Skills Match
- Score visualization: Progress bar in cell
- Quick actions: Interview schedule icon, profile view

### Performance Review
**Review Form:**
- Rating scales: 1-5 stars, large clickable
- Comment sections: textarea, min-h-32
- Category breakdown: Technical, Communication, Leadership, etc.
- AI suggestion panel: Side widget with generated feedback

**360 Feedback Dashboard:**
- Radar chart: Performance across dimensions
- Feedback timeline: Chronological cards
- Aggregated scores: Stat cards row

### AI Features Integration
**Chatbot Interface:**
- Fixed bottom-right: w-96, max-h-[600px], rounded-t-xl, shadow-2xl
- Message bubbles: User (right, bg-primary), Bot (left, bg-muted)
- Input: Sticky bottom, h-12, with send button
- Typing indicator: Animated dots

**AI Analysis Widgets:**
- Insight cards: p-4, rounded-lg, border-l-4 border-primary
- Icon + title + generated text
- Confidence score badge
- "View Details" link

---

## Elevation & Depth

**Shadows (minimal use):**
- Cards: shadow-sm (subtle)
- Modals: shadow-xl (pronounced)
- Dropdowns: shadow-lg (medium)
- Hover states: shadow-md (interactive feedback)

**Borders:** Prefer subtle borders (border) over heavy shadows for definition

---

## Icons

Use **Lucide Icons** (recommended for shadcn/ui compatibility) via npm package
- Navigation: 20px (h-5 w-5)
- Buttons: 16px (h-4 w-4)
- Large feature icons: 24px (h-6 w-6)

---

## Images

**Profile/Employee Photos:**
- Avatar sizes: Small (h-8 w-8), Medium (h-12 w-12), Large (h-24 w-24)
- Always rounded-full with border
- Fallback: Initials on solid background

**Dashboard Illustrations:**
- Empty states: max-w-xs, centered, grayscale illustrations
- Feature banners: Subtle accent illustrations, not photographic

**No large hero images** - This is a utility application focused on data and workflows, not marketing

---

## Animations

**Minimal and functional only:**
- Page transitions: None (instant navigation)
- Loading states: Simple spinner or skeleton screens
- Hover: Subtle opacity/shadow change (transition-all duration-200)
- Modal entry: Fade in, no slide
- Notification toast: Slide from top, 200ms

---

## Accessibility

- Focus rings: ring-2 ring-primary ring-offset-2
- Keyboard navigation: Logical tab order, escape to close modals
- ARIA labels on all interactive elements
- Sufficient contrast ratios (WCAG AA minimum)
- Form error announcements