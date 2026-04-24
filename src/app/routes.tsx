import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";
import { RootLayout } from "./components/layouts/RootLayout";
import { ErrorPage } from "./pages/ErrorPage";
import Loader from "./components/ui/Loader";

// Lazy load components for better performance
const Home = lazy(() => import("./pages/Home").then(module => ({ default: module.Home })));
const Dashboard = lazy(() => import("./pages/Dashboard").then(module => ({ default: module.Dashboard })));
const Login = lazy(() => import("./pages/Login").then(module => ({ default: module.Login })));
const PasswordReset = lazy(() => import("./pages/PasswordReset").then(module => ({ default: module.PasswordReset })));
const Employees = lazy(() => import("./pages/Employees").then(module => ({ default: module.Employees })));
const Recruitment = lazy(() => import("./pages/Recruitment").then(module => ({ default: module.Recruitment })));
const LeaveManagement = lazy(() => import("./pages/LeaveManagement").then(module => ({ default: module.LeaveManagement })));
const Attendance = lazy(() => import("./pages/Attendance").then(module => ({ default: module.Attendance })));
const Payroll = lazy(() => import("./pages/Payroll").then(module => ({ default: module.Payroll })));
const Performance = lazy(() => import("./pages/Performance").then(module => ({ default: module.Performance })));
const Training = lazy(() => import("./pages/Training").then(module => ({ default: module.Training })));
const Reports = lazy(() => import("./pages/Reports").then(module => ({ default: module.Reports })));
const SuccessionPlanning = lazy(() => import("./pages/SuccessionPlanning").then(module => ({ default: module.SuccessionPlanning })));
const EmployeeSelfService = lazy(() => import("./pages/EmployeeSelfService").then(module => ({ default: module.EmployeeSelfService })));
const Department = lazy(() => import("./pages/Department").then(module => ({ default: module.Department })));
const NotFound = lazy(() => import("./pages/NotFound").then(module => ({ default: module.NotFound })));

// Loading component for lazy loaded routes
const LoadingFallback = () => (
  <Loader fullScreen text="Loading workspace..." size="lg" />
);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: () => (
      <Suspense fallback={<LoadingFallback />}>
        <Home />
      </Suspense>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    Component: () => (
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/password-reset",
    Component: () => (
      <Suspense fallback={<LoadingFallback />}>
        <PasswordReset />
      </Suspense>
    ),
  },
  {
    path: "/app",
    Component: RootLayout,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: "employees",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <Employees />
          </Suspense>
        ),
      },
      {
        path: "department",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <Department />
          </Suspense>
        ),
      },
      {
        path: "recruitment",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <Recruitment />
          </Suspense>
        ),
      },
      {
        path: "leave",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <LeaveManagement />
          </Suspense>
        ),
      },
      {
        path: "attendance",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <Attendance />
          </Suspense>
        ),
      },
      {
        path: "payroll",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <Payroll />
          </Suspense>
        ),
      },
      {
        path: "performance",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <Performance />
          </Suspense>
        ),
      },
      {
        path: "training",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <Training />
          </Suspense>
        ),
      },
      {
        path: "succession",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <SuccessionPlanning />
          </Suspense>
        ),
      },
      {
        path: "reports",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <Reports />
          </Suspense>
        ),
      },
      {
        path: "self-service",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <EmployeeSelfService />
          </Suspense>
        ),
      },
      {
        path: "*",
        Component: () => (
          <Suspense fallback={<LoadingFallback />}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    Component: () => (
      <Suspense fallback={<LoadingFallback />}>
        <NotFound />
      </Suspense>
    ),
  },
]);
