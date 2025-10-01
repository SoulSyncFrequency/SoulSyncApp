import React from 'react';

export default function BackupRestore() {
  const handleBackup = async ()=>{
    const r = await fetch('/admin/backup',{method:'POST'});
    const d = await r.json();
    alert('Backup created: '+d.url);
    window.open(d.url,'_blank');
  };
  const handleRestore = async (e:React.ChangeEvent<HTMLInputElement>)=>{
    if(!e.target.files?.[0])return;
    const f = new FormData();
    f.append('file',e.target.files[0]);
    await fetch('/admin/restore',{method:'POST',body:f});
    alert('Restore complete. Server restarting...');
  };
  return (
    <div className="border rounded p-4">
      <h2 className="font-bold mb-2">Backup & Restore</h2>
      <button onClick={handleBackup} className="px-3 py-1 bg-blue-500 text-white rounded mr-4">Create Backup</button>
      <input type="file" onChange={handleRestore} className="border p-1"/>
    </div>
  );
}
