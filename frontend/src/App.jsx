import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthSuccess from './pages/OAuthSuccess';
import PostDetail from './pages/PostDetail';
import PostEditor from './pages/PostEditor';
import MyPosts from './pages/MyPosts';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPosts from './pages/admin/AdminPosts';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="oauth/success" element={<OAuthSuccess />} />
        <Route path="posts/:slug" element={<PostDetail />} />

        {/* Logged-in users */}
        <Route element={<ProtectedRoute />}>
          <Route path="posts/new" element={<PostEditor />} />
          <Route path="posts/:slug/edit" element={<PostEditor />} />
          <Route path="my-posts" element={<MyPosts />} />
        </Route>

        {/* Admins only */}
        <Route path="admin" element={<ProtectedRoute adminOnly />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="posts" element={<AdminPosts />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
