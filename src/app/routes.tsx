import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Employees } from "./pages/Employees";
import { Recruitment } from "./pages/Recruitment";
import { LeaveManagement } from "./pages/LeaveManagement";
import { Attendance } from "./pages/Attendance";
import { Payroll } from "./pages/Payroll";
import { Performance } from "./pages/Performance";
import { Training } from "./pages/Training";
import { Reports } from "./pages/Reports";
import { EmployeeSelfService } from "./pages/EmployeeSelfService";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "employees", Component: Employees },
      { path: "recruitment", Component: Recruitment },
      { path: "leave", Component: LeaveManagement },
      { path: "attendance", Component: Attendance },
      { path: "payroll", Component: Payroll },
      { path: "performance", Component: Performance },
      { path: "training", Component: Training },
      { path: "reports", Component: Reports },
      { path: "self-service", Component: EmployeeSelfService },
      { path: "*", Component: NotFound },
    ],
  },
]);
