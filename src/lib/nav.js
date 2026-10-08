import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserRoundCheck,
  School,
  BookOpen,
  CalendarCheck2,
  ClipboardCheck,
  Wallet,
  Megaphone,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", path: "/", icon: LayoutDashboard, permission: "dashboard:read" },
    ],
  },
  {
    label: "People",
    items: [
      { key: "users", label: "Users & Roles", path: "/users", icon: Users, permission: "users:read" },
      { key: "students", label: "Students", path: "/students", icon: GraduationCap, permission: "students:read", labels: { parent: "My Children", student: "My Record" } },
      { key: "teachers", label: "Teachers", path: "/teachers", icon: UserRoundCheck, permission: "teachers:read" },
    ],
  },
  {
    label: "Academics",
    items: [
      { key: "classes", label: "Classes", path: "/classes", icon: School, permission: "classes:read" },
      { key: "subjects", label: "Subjects", path: "/subjects", icon: BookOpen, permission: "subjects:read" },
      { key: "attendance", label: "Attendance", path: "/attendance", icon: CalendarCheck2, permission: "attendance:read" },
      { key: "grades", label: "Assessments", path: "/grades", icon: ClipboardCheck, permission: "grades:read" },
    ],
  },
  {
    label: "Finance",
    items: [
      { key: "fees", label: "Fees & Payments", path: "/fees", icon: Wallet, permission: "fees:read" },
    ],
  },
  {
    label: "Communication",
    items: [{ key: "announcements", label: "Announcements", path: "/announcements", icon: Megaphone, permission: "announcements:read" }],
  },
];

export function visibleNav(role, permissions) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => permissions.includes(item.permission)),
  })).filter((section) => section.items.length > 0);
}

export function labelFor(item, role) {
  return item.labels?.[role] || item.label;
}