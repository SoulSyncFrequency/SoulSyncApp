import React, { useEffect, useState } from 'react';

export default function Invites() {
  const [list,setList] = useState<any[]>([]);
  const load = ()=> fetch('/admin/invites').then(r=>r.json()).then(setList);
  useEffect(load,[]);

  const resend = async (id:number)=>{
    const r = await fetch(`/admin/invites/${id}/resend`,{method:'POST'});
    const d = await r.json();
    alert(d.preview ? `Preview: ${d.preview}` : 'Invite sent!');
  };

  return (
    <div className="border rounded p-4">
      <h2 className="font-bold mb-2">Active Invites</h2>
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th>Email</th><th>Created</th><th>Expires</th><th>Actions</th></tr></thead>
        <tbody>
          {list.map(i=>(
            <tr key={i.id} className="border-t">
              <td>{i.email}</td>
              <td>{new Date(i.createdAt).toLocaleString()}</td>
              <td>{new Date(i.expiresAt).toLocaleString()}</td>
              <td className="space-x-2">
                <button onClick={()=>resend(i.id)} className="underline">Resend</button>
                <button onClick={()=>navigator.clipboard.writeText(location.origin+'/auth/magic/'+i.token)} className="underline">Copy Link</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
