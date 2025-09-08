export default function Privacy(){
  return <div className="p-6 space-y-3">
    <h1 className="text-2xl font-bold">Privacy Policy</h1>
    <p>SoulSync collects only the necessary data to provide the service. We do not sell data. You can request deletion anytime.</p>
    <h2 className="text-xl font-semibold">Data We Process</h2>
    <ul className="list-disc ml-6">
      <li>Account: email (for login).</li>
      <li>App usage diagnostics (if Sentry enabled).</li>
    </ul>
    <p>Contact: support@soulsync.example</p>
  </div>
}
