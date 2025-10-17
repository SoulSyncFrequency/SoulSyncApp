# /supplements/schedule-suggest
- Deterministički raspored doza u budnom prozoru. Parametri (`POST` JSON):
  - `timesPerDay` (1–12, default 3)
  - `wakeStart` (HH:MM, default 08:00), `wakeEnd` (default 22:00)
  - `withFood` (true/false) — poravnava na tipične obroke (08:00/13:00/19:00)
  - `avoidLate` (true/false) — ograniči zadnju dozu prije 20:00
- **Disclaimer**: informativno; nije medicinski savjet.
