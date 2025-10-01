import React, { createContext, useMemo } from 'react';

export const TraceContext = createContext({ genId: ()=>'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, ()=>(Math.random()*16|0).toString(16)) });

export default function TraceProvider({ children }){
  const value = useMemo(()=>({ genId: ()=>'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, ()=>(Math.random()*16|0).toString(16)) }),[]);
  return <TraceContext.Provider value={value}>{children}</TraceContext.Provider>;
}
