import React from "react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-100 h-screen p-4">
      <nav>
        <ul className="space-y-2">
          <li><a href="/dashboard">Dashboard</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </nav>
    </aside>
  );
}
