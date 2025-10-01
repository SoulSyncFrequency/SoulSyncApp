import React from 'react';

export default function ServerControls() {
  const handleRestart = async ()=>{
    if(!confirm('Restart server?')) return;
    await fetch('/admin/restart',{method:'POST'});
    alert('Restarting...');
  };
  return (
    <div className="border rounded p-4">
      <h2 className="font-bold mb-2">Server Controls</h2>
      <button onClick={handleRestart} className="px-3 py-1 bg-red-500 text-white rounded">Restart Server</button>
    </div>
  );
}
