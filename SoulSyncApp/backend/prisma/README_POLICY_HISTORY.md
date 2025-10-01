# Policy History (optional table)

model PolicyHistory {
  id        String   @id @default(cuid())
  tenantId  String
  actorId   String
  before    Json
  after     Json
  at        DateTime @default(now())
}
