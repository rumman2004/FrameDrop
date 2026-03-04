import { Outlet } from 'react-router-dom';
import Navbar from '../ui/Navbar';

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}