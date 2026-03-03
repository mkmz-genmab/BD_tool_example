# Drug Portal Design Guidelines

## Design Approach

**Selected Approach**: Design System (Utility-Focused)
**Rationale**: Data-dense pharmaceutical database requiring clarity, efficiency, and professional credibility. Drawing inspiration from enterprise data platforms like Airtable, Linear's tables, and clinical research portals.

**Core Principles**:
- Information clarity over visual flourish
- Efficient data scanning and filtering
- Professional medical/pharmaceutical aesthetic
- Clear visual hierarchy for new vs. existing entries

---

## Typography

**Font Stack**: Inter or SF Pro for crisp data readability
- **Table Headers**: 14px, semi-bold (600), letter-spacing: 0.02em
- **Table Data**: 14px, regular (400)
- **Page Title**: 24px, semi-bold (600)
- **Filter Labels**: 12px, medium (500), uppercase, letter-spacing: 0.05em
- **New Badges**: 11px, bold (700), uppercase

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Consistent padding and margins using these increments
- Table cell padding: p-4
- Section spacing: gap-6 or gap-8
- Container margins: mx-4 or mx-8

**Grid Structure**:
- Full-width data table with horizontal scroll on mobile
- Fixed header row that remains visible during scroll
- Maximum container width: max-w-7xl for desktop

---

## Component Library

### 1. Page Header
- Title with record count ("Drug Database • 247 entries")
- Export button (icon + text) positioned top-right
- Bottom border separator

### 2. Filter Bar
- Horizontal layout with 3-4 filter groups
- Each filter: Label above dropdown
- Dropdowns: Rounded corners (rounded-lg), border, subtle shadow on focus
- "Clear Filters" text link on far right
- Spacing: gap-6 between filter groups

### 3. Data Table
**Structure**:
- Fixed header row with column titles
- Sortable columns (show sort arrows on hover/active)
- Column headers: Background fill, semi-bold text, slight bottom border
- Zebra striping: Alternating row backgrounds for easier scanning
- Row hover state: Subtle background change
- Borders: Vertical borders between columns for clear data separation

**Columns** (based on screenshot):
- Drug Name (wider column, ~200px)
- Target
- Stage of Development
- Molecule Type
- Additional columns as needed (Company, Indication, etc.)

### 4. New Entry Indicators
**Two-tier system**:
- **NEW badge**: Small pill-shaped badge next to drug name, positioned inline
- **Row highlighting**: Subtle background tint for entire row of new entries
- New entries grouped at top of table with visual separator line below

### 5. Table Cell Content
- Left-aligned text for readability
- Truncation with ellipsis for long content
- Tooltip on hover showing full content
- Padding: px-4 py-3

### 6. Buttons
- Export button: Medium size, rounded-md, icon + text
- Filter dropdowns: Full clickable area with chevron icon
- Clear filters: Text-only link with underline on hover

### 7. Empty States
If no results from filtering: Centered message with icon, "No drugs found matching your filters"

---

## Interactions

**Minimal Animations**:
- Smooth dropdown open/close (150ms ease)
- Row hover transition (100ms)
- Sort icon rotation (200ms)

**No Animations**:
- Page load
- Table data updates
- Filter changes

---

## Accessibility

- Clear focus indicators on all interactive elements (2px outline)
- ARIA labels for sort buttons and filters
- Keyboard navigation through table rows (tab) and columns
- Screen reader announcements for sort changes and filter updates
- Sufficient color contrast (WCAG AA minimum) for all text

---

## Responsive Behavior

**Desktop (1024px+)**: Full table width, all columns visible
**Tablet (768px-1023px)**: Horizontal scroll for table, filters stack 2x2
**Mobile (<768px)**: 
- Filters stack vertically
- Table in horizontal scroll container
- Fixed first column (Drug Name) for context while scrolling

---

## Data Display Patterns

**Status Indicators**: Use text badges or subtle background colors for stages (e.g., "Phase I", "Phase II", "Approved")
**Consistent Formatting**: All similar data types use identical styling (dates, numbers, text)
**Information Density**: Comfortable spacing - not cramped, not excessive (4-6 rows visible above fold)

---

## Images

**No hero images** - This is a utility dashboard focused on data presentation. Visual elements limited to:
- Export icon in button
- Sort arrows in table headers  
- Filter dropdown chevrons
- NEW badge styling
- Empty state icon (if applicable)