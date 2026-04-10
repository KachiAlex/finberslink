# Student Courses Dashboard Tab - Visual Schematic

## High-Level Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STUDENT DASHBOARD - COURSES TAB                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 Search courses...        [Category ▼] [Level ▼] [✕ Clear]     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🎓 DISCOVER COURSES                                    (12 courses) │   │
│  │ Explore admin-approved courses and expand your skills              │   │
│  │                                                                     │   │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │  [Image]     │  │  [Image]     │  │  [Image]     │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ React Basics │  │ Web Design   │  │ Node.js      │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ Learn React  │  │ Master UI/UX │  │ Backend Dev  │              │   │
│  │ │ fundamentals │  │ principles   │  │ with Node    │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ 🟢 Beginner  │  │ 🟡 Intermed. │  │ 🔴 Advanced  │              │   │
│  │ │ Web Dev      │  │ Design       │  │ Backend      │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ 234 enrolled │  │ 156 enrolled │  │ 89 enrolled  │              │   │
│  │ │ ★★★★★ 4.8   │  │ ★★★★☆ 4.5   │  │ ★★★★☆ 4.3   │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ By: John Doe │  │ By: Jane Sm. │  │ By: Bob Lee  │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ [Enroll]     │  │ [Enroll]     │  │ [Enroll]     │              │   │
│  │ └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                     │   │
│  │ ◀ 1 2 3 4 5 ▶                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📋 ASSIGNED COURSES                                    (3 courses)  │   │
│  │ Courses assigned by your administrator                             │   │
│  │                                                                     │   │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │  [Image]     │  │  [Image]     │  │  [Image]     │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ Python 101   │  │ Data Science │  │ Cloud AWS    │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ Learn Python │  │ Analytics &  │  │ AWS & Cloud  │              │   │
│  │ │ programming  │  │ ML basics    │  │ Computing    │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ 🟢 Beginner  │  │ 🟡 Intermed. │  │ 🟡 Intermed. │              │   │
│  │ │ Programming  │  │ Data Science │  │ Cloud        │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ Assigned by: │  │ Assigned by: │  │ Assigned by: │              │   │
│  │ │ Admin Sarah  │  │ Admin Mike   │  │ Admin Sarah  │              │   │
│  │ │ 5 days ago   │  │ 2 weeks ago  │  │ 1 month ago  │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ [Accept]     │  │ [Accept]     │  │ [Accept]     │              │   │
│  │ │ [Decline]    │  │ [Decline]    │  │ [Decline]    │              │   │
│  │ └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                     │   │
│  │ ◀ 1 2 ▶                                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🚀 LEARNING PATHWAY                                    (5 courses)  │   │
│  │ Courses you're actively learning                                   │   │
│  │                                                                     │   │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │  [Image]     │  │  [Image]     │  │  [Image]     │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ JavaScript   │  │ CSS Mastery  │  │ Git & GitHub │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ Master JS    │  │ Advanced CSS │  │ Version      │              │   │
│  │ │ fundamentals │  │ techniques   │  │ control      │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ 🟢 Beginner  │  │ 🟡 Intermed. │  │ 🟢 Beginner  │              │   │
│  │ │ Web Dev      │  │ Web Dev      │  │ Tools        │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ Progress:    │  │ Progress:    │  │ Progress:    │              │   │
│  │ │ ████░░░░ 45% │  │ ██████░░ 65% │  │ ████████░ 85%│              │   │
│  │ │ 5/12 lessons │  │ 8/12 lessons │  │ 10/12 lessons│              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ By: John Doe │  │ By: Jane Sm. │  │ By: Bob Lee  │              │   │
│  │ │              │  │              │  │              │              │   │
│  │ │ [Continue]   │  │ [Continue]   │  │ [Continue]   │              │   │
│  │ └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                     │   │
│  │ ◀ 1 2 3 ▶                                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Responsive Breakpoints

### Mobile Layout (< 640px)
```
┌──────────────────────────────┐
│  STUDENT DASHBOARD - COURSES │
├──────────────────────────────┤
│                              │
│ [Search...] [Filters ▼]     │
│                              │
│ 🎓 DISCOVER COURSES          │
│ Explore admin-approved...    │
│                              │
│ ┌────────────────────────┐  │
│ │                        │  │
│ │     [Image]            │  │
│ │                        │  │
│ │ React Basics           │  │
│ │ Learn React...         │  │
│ │                        │  │
│ │ 🟢 Beginner            │  │
│ │ 234 enrolled ★★★★★ 4.8│  │
│ │ By: John Doe           │  │
│ │                        │  │
│ │ [Enroll]               │  │
│ └────────────────────────┘  │
│                              │
│ ┌────────────────────────┐  │
│ │ Web Design             │  │
│ │ [Card 2]               │  │
│ └────────────────────────┘  │
│                              │
│ ◀ 1 2 3 ▶                   │
│                              │
│ 📋 ASSIGNED COURSES          │
│ Courses assigned by admin    │
│                              │
│ ┌────────────────────────┐  │
│ │ Python 101             │  │
│ │ [Card]                 │  │
│ │ [Accept] [Decline]     │  │
│ └────────────────────────┘  │
│                              │
│ 🚀 LEARNING PATHWAY          │
│ Courses you're learning      │
│                              │
│ ┌────────────────────────┐  │
│ │ JavaScript             │  │
│ │ Progress: ████░░░░ 45% │  │
│ │ [Continue]             │  │
│ └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

### Tablet Layout (640px - 1024px)
```
┌────────────────────────────────────────────┐
│     STUDENT DASHBOARD - COURSES TAB        │
├────────────────────────────────────────────┤
│                                            │
│ [Search...] [Category ▼] [Level ▼] [✕]   │
│                                            │
│ 🎓 DISCOVER COURSES                        │
│ Explore admin-approved courses             │
│                                            │
│ ┌──────────────────┐  ┌──────────────────┐│
│ │                  │  │                  ││
│ │   [Image]        │  │   [Image]        ││
│ │                  │  │                  ││
│ │ React Basics     │  │ Web Design       ││
│ │ Learn React...   │  │ Master UI/UX...  ││
│ │                  │  │                  ││
│ │ 🟢 Beginner      │  │ 🟡 Intermediate  ││
│ │ 234 enrolled     │  │ 156 enrolled     ││
│ │ ★★★★★ 4.8       │  │ ★★★★☆ 4.5       ││
│ │ By: John Doe     │  │ By: Jane Smith   ││
│ │                  │  │                  ││
│ │ [Enroll]         │  │ [Enroll]         ││
│ └──────────────────┘  └──────────────────┘│
│                                            │
│ ◀ 1 2 3 4 5 ▶                              │
│                                            │
│ 📋 ASSIGNED COURSES                        │
│ Courses assigned by your administrator    │
│                                            │
│ ┌──────────────────┐  ┌──────────────────┐│
│ │ Python 101       │  │ Data Science     ││
│ │ [Card]           │  │ [Card]           ││
│ │ [Accept/Decline] │  │ [Accept/Decline] ││
│ └──────────────────┘  └──────────────────┘│
│                                            │
│ 🚀 LEARNING PATHWAY                        │
│ Courses you're actively learning           │
│                                            │
│ ┌──────────────────┐  ┌──────────────────┐│
│ │ JavaScript       │  │ CSS Mastery      ││
│ │ Progress: 45%    │  │ Progress: 65%    ││
│ │ [Continue]       │  │ [Continue]       ││
│ └──────────────────┘  └──────────────────┘│
│                                            │
└────────────────────────────────────────────┘
```

### Desktop Layout (> 1024px)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STUDENT DASHBOARD - COURSES TAB                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ [Search courses...] [Category ▼] [Level ▼] [✕ Clear Filters]              │
│                                                                               │
│ 🎓 DISCOVER COURSES                                          (12 courses)   │
│ Explore admin-approved courses and expand your skills                       │
│                                                                               │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│ │              │  │              │  │              │  │              │    │
│ │  [Image]     │  │  [Image]     │  │  [Image]     │  │  [Image]     │    │
│ │              │  │              │  │              │  │              │    │
│ │ React Basics │  │ Web Design   │  │ Node.js      │  │ Python 101   │    │
│ │ Learn React  │  │ Master UI/UX │  │ Backend Dev  │  │ Learn Python │    │
│ │              │  │              │  │              │  │              │    │
│ │ 🟢 Beginner  │  │ 🟡 Intermed. │  │ 🔴 Advanced  │  │ 🟢 Beginner  │    │
│ │ 234 enrolled │  │ 156 enrolled │  │ 89 enrolled  │  │ 145 enrolled │    │
│ │ ★★★★★ 4.8   │  │ ★★★★☆ 4.5   │  │ ★★★★☆ 4.3   │  │ ★★★★★ 4.7   │    │
│ │ By: John Doe │  │ By: Jane Sm. │  │ By: Bob Lee  │  │ By: Alice J. │    │
│ │ [Enroll]     │  │ [Enroll]     │  │ [Enroll]     │  │ [Enroll]     │    │
│ └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                               │
│ ◀ 1 2 3 4 5 ▶                                                                │
│                                                                               │
│ 📋 ASSIGNED COURSES                                         (3 courses)     │
│ Courses assigned by your administrator                                      │
│                                                                               │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│ │              │  │              │  │              │                       │
│ │  [Image]     │  │  [Image]     │  │  [Image]     │                       │
│ │              │  │              │  │              │                       │
│ │ Python 101   │  │ Data Science │  │ Cloud AWS    │                       │
│ │ Learn Python │  │ Analytics &  │  │ AWS & Cloud  │                       │
│ │              │  │              │  │              │                       │
│ │ 🟢 Beginner  │  │ 🟡 Intermed. │  │ 🟡 Intermed. │                       │
│ │ Assigned by: │  │ Assigned by: │  │ Assigned by: │                       │
│ │ Admin Sarah  │  │ Admin Mike   │  │ Admin Sarah  │                       │
│ │ 5 days ago   │  │ 2 weeks ago  │  │ 1 month ago  │                       │
│ │              │  │              │  │              │                       │
│ │ [Accept]     │  │ [Accept]     │  │ [Accept]     │                       │
│ │ [Decline]    │  │ [Decline]    │  │ [Decline]    │                       │
│ └──────────────┘  └──────────────┘  └──────────────┘                       │
│                                                                               │
│ ◀ 1 2 ▶                                                                      │
│                                                                               │
│ 🚀 LEARNING PATHWAY                                         (5 courses)     │
│ Courses you're actively learning                                            │
│                                                                               │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│ │              │  │              │  │              │  │              │    │
│ │  [Image]     │  │  [Image]     │  │  [Image]     │  │  [Image]     │    │
│ │              │  │              │  │              │  │              │    │
│ │ JavaScript   │  │ CSS Mastery  │  │ Git & GitHub │  │ TypeScript   │    │
│ │ Master JS    │  │ Advanced CSS │  │ Version      │  │ Advanced TS  │    │
│ │              │  │              │  │              │  │              │    │
│ │ 🟢 Beginner  │  │ 🟡 Intermed. │  │ 🟢 Beginner  │  │ 🟡 Intermed. │    │
│ │ Progress:    │  │ Progress:    │  │ Progress:    │  │ Progress:    │    │
│ │ ████░░░░ 45% │  │ ██████░░ 65% │  │ ████████░ 85%│  │ ███░░░░░░ 30%│    │
│ │ 5/12 lessons │  │ 8/12 lessons │  │ 10/12 lessons│  │ 3/10 lessons │    │
│ │ By: John Doe │  │ By: Jane Sm. │  │ By: Bob Lee  │  │ By: Alice J. │    │
│ │ [Continue]   │  │ [Continue]   │  │ [Continue]   │  │ [Continue]   │    │
│ └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                               │
│ ◀ 1 2 3 ▶                                                                    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Course Card Component Detail

### Discover Section Card
```
┌─────────────────────────────┐
│                             │
│      [Course Image]         │
│      (16:9 aspect)          │
│                             │
│  React Basics               │
│  🟢 Beginner                │
│                             │
│  Learn React fundamentals   │
│  and build interactive UIs  │
│                             │
│  Category: Web Development  │
│  234 enrolled               │
│  ★★★★★ 4.8 (128 reviews)   │
│                             │
│  By: John Doe               │
│  john@example.com           │
│                             │
│  ┌─────────────────────────┐│
│  │      [Enroll]           ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

### Assigned Section Card
```
┌─────────────────────────────┐
│                             │
│      [Course Image]         │
│      (16:9 aspect)          │
│                             │
│  Python 101                 │
│  🟢 Beginner                │
│                             │
│  Learn Python programming   │
│  from scratch               │
│                             │
│  Category: Programming      │
│  Assigned by: Admin Sarah   │
│  Assigned: 5 days ago       │
│                             │
│  By: Alice Johnson          │
│  alice@example.com          │
│                             │
│  ┌──────────┐  ┌──────────┐│
│  │ [Accept] │  │ [Decline]││
│  └──────────┘  └──────────┘│
│                             │
└─────────────────────────────┘
```

### Learning Pathway Section Card
```
┌─────────────────────────────┐
│                             │
│      [Course Image]         │
│      (16:9 aspect)          │
│                             │
│  JavaScript Mastery         │
│  🟢 Beginner                │
│                             │
│  Master JavaScript and      │
│  build dynamic web apps     │
│                             │
│  Category: Web Development  │
│  Progress: ████░░░░ 45%     │
│  5 of 12 lessons completed  │
│                             │
│  By: John Doe               │
│  john@example.com           │
│                             │
│  ┌─────────────────────────┐│
│  │    [Continue Learning]  ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

## Color Scheme

### Primary Colors
- **Primary Blue**: `#3B82F6` - Buttons, links, highlights
- **Cyan Accent**: `#06B6D4` - Hover states, secondary actions
- **Success Green**: `#10B981` - Positive actions, progress
- **Amber Warning**: `#F59E0B` - Caution states
- **Red Destructive**: `#EF4444` - Decline actions

### Neutral Colors
- **Background**: `#F8FAFC` (Slate 50)
- **Card Background**: `#FFFFFF` (White)
- **Text Primary**: `#0F172A` (Slate 900)
- **Text Secondary**: `#64748B` (Slate 500)
- **Border**: `#E2E8F0` (Slate 200)
- **Divider**: `#CBD5E1` (Slate 300)

### Level Badges
- **Beginner**: `#10B981` (Green)
- **Intermediate**: `#F59E0B` (Amber)
- **Advanced**: `#EF4444` (Red)

## Typography

- **Page Title**: Inter Bold 32px, Slate 900
- **Section Header**: Inter Semibold 24px, Slate 900
- **Card Title**: Inter Semibold 18px, Slate 900
- **Body Text**: Inter Regular 14px, Slate 700
- **Small Text**: Inter Regular 12px, Slate 600
- **Button Text**: Inter Medium 14px, White

## Spacing and Layout

- **Section Padding**: 24px (desktop), 16px (tablet), 12px (mobile)
- **Card Gap**: 20px (desktop), 16px (tablet), 12px (mobile)
- **Card Padding**: 16px
- **Image Height**: 180px (desktop), 160px (tablet), 140px (mobile)
- **Max Container Width**: 1280px

## Hover and Interactive States

### Card Hover
- Scale: 1.02x
- Shadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1)`
- Transition: 300ms ease-out

### Button Hover
- Background: Darker shade of primary color
- Shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`
- Transition: 200ms ease-out

### Button Active (Click)
- Scale: 0.98x
- Transition: 100ms ease-out

## Loading States

### Skeleton Loader
```
┌─────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                             │
└─────────────────────────────┘
```

Shimmer animation: 1.5s loop with gradient sweep from left to right

## Empty States

### No Courses in Discover
```
┌─────────────────────────────┐
│                             │
│          🔍                 │
│                             │
│  No Courses Found           │
│                             │
│  No approved courses match  │
│  your search criteria.      │
│                             │
│  Try adjusting your filters │
│  or search terms.           │
│                             │
│  [Clear Filters]            │
│                             │
└─────────────────────────────┘
```

### No Assigned Courses
```
┌─────────────────────────────┐
│                             │
│          📋                 │
│                             │
│  No Assigned Courses        │
│                             │
│  Your administrator hasn't  │
│  assigned any courses yet.  │
│                             │
│  Check back later or        │
│  explore available courses. │
│                             │
│  [Browse Discover]          │
│                             │
└─────────────────────────────┘
```

### No Enrolled Courses
```
┌─────────────────────────────┐
│                             │
│          🚀                 │
│                             │
│  Start Your Learning Path   │
│                             │
│  You haven't enrolled in    │
│  any courses yet.           │
│                             │
│  Explore available courses  │
│  and start learning today!  │
│                             │
│  [Browse Discover]          │
│                             │
└─────────────────────────────┘
```

## Error States

```
┌─────────────────────────────┐
│                             │
│          ⚠️                 │
│                             │
│  Failed to Load Courses     │
│                             │
│  An error occurred while    │
│  loading courses. Please    │
│  try again.                 │
│                             │
│  Error: Network timeout     │
│                             │
│  [Retry]                    │
│                             │
└─────────────────────────────┘
```

## Animations and Transitions

### Page Load
- Fade in: 300ms ease-out
- Stagger children: 50ms delay between each section

### Card Hover
- Scale: 1.02x over 300ms
- Shadow elevation: 300ms ease-out

### Filter Changes
- Fade out cards: 200ms ease-out
- Fade in new cards: 300ms ease-out (with 100ms delay)

### Pagination
- Scroll to top: 400ms ease-out
- Fade in new page: 300ms ease-out

### Success Toast
- Slide in from top: 300ms ease-out
- Auto-dismiss: 3000ms
- Slide out: 300ms ease-out

### Error Toast
- Slide in from top: 300ms ease-out
- Persistent until dismissed
- Slide out on close: 300ms ease-out
