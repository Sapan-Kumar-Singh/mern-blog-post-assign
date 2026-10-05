import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Notifications from './Notifications';

export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
      <Notifications />
    </>
  );
}
