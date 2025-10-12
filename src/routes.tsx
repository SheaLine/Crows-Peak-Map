import { createBrowserRouter } from "react-router-dom";
import Auth from "./components/Auth/Login";
import CompleteProfile from "./components/Auth/CompleteProfile";
import NewUserCallback from  "./components/Auth/NewUserCallback";
import App from "./App";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import EquipmentDetails from "./components/Details/EquipmentDetails";
import GeoJsonEditor from "./DevTools/Editor/GeoJsonEditor";


export const router = createBrowserRouter([
  {path: "/", element: <App />},
  {path: "/login", element: <Auth />},
  {path: "/new-user", element: <NewUserCallback />},
  {path: "/complete-profile", element: <CompleteProfile />},
  {path: "/password-forgot", element: <ForgotPassword />},
  {path: "/password-reset", element: <ResetPassword />},
  {path: "/equipment/:id", element: <EquipmentDetails />},
  {path: "/editor", element: <GeoJsonEditor />},
]);