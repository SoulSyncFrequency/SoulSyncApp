import React, { useEffect, useState } from 'react';

export default function Users(){
  const [users,setUsers] = useState<any[]>([]);
  const [searchEmail,setSearchEmail] = useState('');
const [roleFilter,setRoleFilter] = useState('');


  const load = ()=>{
    fetch('/admin/users').then(r=>r.json()).then(setUsers).catch(()=>{});
  };
  useEffect(load,[]);
  const shown = users.filter(u=>
  (!searchEmail || u.email.toLowerCase().includes(searchEmail.toLowerCase())) &&
  (!roleFilter || u.role===roleFilter)
);


  const changeRole = async(id:number,role:string)=>{
    await fetch(`/admin/users/${id}/role`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role})});
    load();
  };
  const deactivate = async(id:number)=>{
    if(!confirm('Deactivate this user?')) return;
    await fetch(`/admin/users/${id}/deactivate`,{method:'POST'});
    load();
  };
  const del = async(id:number)=>{
    if(!confirm('Delete this user?')) return;
    await fetch(`/admin/users/${id}`,{method:'DELETE'});
    load();
  };
  const impersonate = async(id:number)=>{
    const r = await fetch(`/admin/users/${id}/impersonate`,{method:'POST'});
    const d = await r.json();
    alert('Impersonation token: '+d.token);
  };

  return (
    <div className='p-4'>
      <h2 className='font-bold text-lg mb-2'>Users</h2>
      <div className='flex gap-2 mb-2 text-xs'>
  <input placeholder='Search email' value={searchEmail} onChange={e=>setSearchEmail(e.target.value)} className='border p-1'/>
  <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className='border p-1'>
    <option value=''>All roles</option>
    <option>ADMIN</option>
    <option>THERAPIST</option>
    <option>USER</option>
  </select>
</div>

      <table className='w-full text-xs border'>
        <thead><tr className='bg-gray-100'>
          <th className='p-1 border'>ID</th>
          <th className='p-1 border'>Email</th>
          <th className='p-1 border'>Role</th>
          <th className='p-1 border'>Created</th>
          <th className='p-1 border'>Last Login</th>
          <th className='p-1 border'>Actions</th>
        </tr></thead>
        <tbody>
          {shown.map(u=>(
            <tr key={u.id} className='border-t'>
              <td className='border p-1'>{u.id}</td>
              <td className='border p-1'>{u.email}</td>
              <td className='border p-1'>
                <span className={'px-2 py-0.5 rounded text-xs '+(u.role==='ADMIN'?'bg-green-100 text-green-700 border border-green-300':u.role==='THERAPIST'?'bg-yellow-100 text-yellow-700 border border-yellow-300':'bg-gray-100 text-gray-700 border border-gray-300')}>{u.role}</span>
              </td>
              <td className='border p-1'>{new Date(u.createdAt).toLocaleString()}</td>
              <td className='border p-1'>{u.lastLogin? new Date(u.lastLogin).toLocaleString():'-'}</td>
              <td className='border p-1 space-x-1'>
                <button onClick={()=>changeRole(u.id,'THERAPIST')} className='px-2 py-0.5 border rounded'>Therapist</button>
                <button onClick={()=>changeRole(u.id,'ADMIN')} className='px-2 py-0.5 border rounded'>Admin</button>
                <button onClick={()=>changeRole(u.id,'USER')} className='px-2 py-0.5 border rounded'>Demote</button>
                <button onClick={()=>deactivate(u.id)} className='px-2 py-0.5 border rounded'>Deactivate</button>
                <button onClick={()=>del(u.id)} className='px-2 py-0.5 border rounded'>Delete</button>
                <button onClick={()=>impersonate(u.id)} className='px-2 py-0.5 border rounded'>Login as</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
