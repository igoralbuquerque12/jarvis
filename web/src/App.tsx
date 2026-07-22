import { Navigate, Route, Routes } from 'react-router-dom';
import { HomeRoute } from './pages/home';
import { LoginRoute } from './pages/login';
import { ResetPasswordRoute } from './pages/reset-password';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/login" />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/reset-password" element={<ResetPasswordRoute />} />
      <Route path="/home" element={<HomeRoute />} />
      <Route path="*" element={<Navigate replace to="/login" />} />
    </Routes>
  );
}
