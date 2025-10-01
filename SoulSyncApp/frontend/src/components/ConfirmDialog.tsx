import React from 'react'

type Props = { title?: string; message: string; onConfirm: ()=>void; onCancel: ()=>void }
export default function ConfirmDialog({ title='Please confirm', message, onConfirm, onCancel }: Props){
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-700 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded border">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded bg-black text-white">Confirm</button>
        </div>
      </div>
    </div>
  )
}
