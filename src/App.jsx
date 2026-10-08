import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import StudentsPage from "./pages/students/StudentsPage";
import StudentDetailPage from "./pages/students/StudentDetailPage";
import TeachersPage from "./pages/TeachersPage";
import ClassesPage from "./pages/classes/ClassesPage";
import ClassDetailPage from "./pages/classes/ClassDetailPage";
import SubjectsPage from "./pages/SubjectsPage";
import AttendancePage from "./pages/AttendancePage";
import GradesPage from "./pages/GradesPage";
import FeesPage from "./pages/FeesPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route
            path="users"
            element={
              <ProtectedRoute permissions={["users:read"]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:studentId" element={<StudentDetailPage />} />
          <Route
            path="teachers"
            element={
              <ProtectedRoute permissions={["teachers:read"]}>
                <TeachersPage />
              </ProtectedRoute>
            }
          />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:classId" element={<ClassDetailPage />} />
          <Route
            path="subjects"
            element={
              <ProtectedRoute permissions={["subjects:read"]}>
                <SubjectsPage />
              </ProtectedRoute>
            }
          />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route
            path="fees"
            element={
              <ProtectedRoute permissions={["fees:read"]}>
                <FeesPage />
              </ProtectedRoute>
            }
          />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}