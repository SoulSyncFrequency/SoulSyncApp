// Dev-only fetch patch for trace header (safe, no-op in production bundles)
try{
  const isDev = typeof process !== 'undefined' ? (process.env.NODE_ENV !== 'production') : true;
  if(isDev && typeof window !== 'undefined' && window.fetch){
    const orig = window.fetch;
    window.fetch = async (input, init={}) => {
      try{
        const headers = new Headers(init.headers || {});
        if(!headers.get('X-Trace-Id')){
          const traceId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, ()=>(Math.random()*16|0).toString(16));
          headers.set('X-Trace-Id', traceId);
        }
        return await orig(input, { ...init, headers });
      }catch(e){ return orig(input, init); }
    };
  }
}catch(_e){}
