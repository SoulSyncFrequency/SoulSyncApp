const fetch = (...args)=>import('node-fetch').then(({default: fetch})=>fetch(...args));

async function externalInsights(providerUrl, apiKey, logs){
  const res = await fetch(providerUrl, {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization': apiKey ? `Bearer ${apiKey}` : undefined},
    body: JSON.stringify({
  instructions: 'Analyze logs. Return JSON with: topEndpoints[[path,count]], topStatuses[[code,count]], topUsers[[id,count]], suggestions[string], severity:int(1-5), costImpact:string(low|medium|high), period:"last_N".',
  logs
})
  });
  if(!res.ok) throw new Error('AI provider error');
  return await res.json();
}

function heuristicInsights(logs){
  const topEndpoint = {};
  const statusCount = {};
  const users = {};
  for(const l of logs){
    const ep = l.endpoint || 'unknown';
    topEndpoint[ep]=(topEndpoint[ep]||0)+1;
    statusCount[l.status]=(statusCount[l.status]||0)+1;
    if(l.userId) users[l.userId]=(users[l.userId]||0)+1;
  }
  const topEps = Object.entries(topEndpoint).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const topStatuses = Object.entries(statusCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const topUsers = Object.entries(users).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const suggestions = [];
  if((statusCount[500]||0) > 0) suggestions.push("Investigate recurring 500 errors; add retries or circuit breaker.");
  if(topEps.length && topEps[0][1] > 100) suggestions.push(`Consider caching or indexing for heavy endpoint ${topEps[0][0]}.`);
  let severity = 1; let costImpact = 'low';
if((statusCount[500]||0) > 10) { severity = 4; costImpact = 'high'; }
else if((statusCount[500]||0) > 0) { severity = 3; costImpact = 'medium'; }
return { topEndpoints: topEps, topStatuses: topStatuses, topUsers, suggestions, severity, costImpact, period: 'last_N' };
}

module.exports = { externalInsights, heuristicInsights };
