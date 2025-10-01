import React, { useEffect, useState } from 'react';

interface VersionData {
  version: string;
  commit: string;
  buildTime: string;
}

export default function VersionBadge() {
  const [info, setInfo] = useState<VersionData | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch('/version')
      .then(res => res.json())
      .then(data => setInfo(data))
      .catch(() => {});
    // Try to detect currentUser role from global scope if exists
    try {
      const user = (window as any).currentUser;
      if (user?.role) setRole(user.role);
    } catch {}
  }, []);

  if (role !== 'ADMIN' || !info) return null;

  return (
    <div className="fixed bottom-2 right-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded shadow">
      v{info.version} • {info.commit} • {info.buildTime}
    </div>
  );
}
