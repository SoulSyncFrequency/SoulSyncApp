const { heuristicInsights } = require('../backend/src/services/insights');
const sample = [
  { endpoint:'/api/v1/therapy', status:200, userId:'u1' },
  { endpoint:'/api/v1/therapy', status:500, userId:'u1' },
  { endpoint:'/api/v1/admin/audit-logs', status:200, userId:'admin' }
];
const out = heuristicInsights(sample);
if(!out || !out.topEndpoints) { console.error('Insights failed'); process.exit(1); }
console.log('Insights OK', out.topEndpoints[0]);
