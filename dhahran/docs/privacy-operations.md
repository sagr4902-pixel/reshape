# Privacy operations

This describes what the software does. It is **not** a legal compliance certification; the Saudi PDPL and its
implementing regulation were not reviewed in this build. The business owner must confirm the items in "Decisions
required" before real data is collected.

## Data flow

1. A visitor submits the interest form (`/register`) → `POST /api/leads` on the same origin.
2. The server validates, then writes one transaction to PostgreSQL:
   `lead_submissions` (adult name, mobile in E.164, program id, intent, optional comment ≤ 500 chars, locale,
   optional zone/source ids, notice version, status, idempotency key, payload hash, keyed duplicate hash) and two
   `consent_events` rows (`inquiry_processing: acknowledged`, `marketing: granted|declined`).
3. Nothing is sent anywhere else: no email, SMS, CRM, analytics or third-party script. No notification is sent to
   staff — **someone must check the list** (see below).

Not collected or stored: child name or date of birth, national ID, email, medical information, payment data,
IP address, user agent, full referrer, arbitrary query strings. Rate-limit buckets are keyed hashes that expire.
Logs contain only the error class on failure — never names, numbers, comments or request bodies.

## Collection gate

The form is replaced by an honest "unavailable" panel (with the official WhatsApp link), and the API answers 503,
unless a database is configured. With `APP_ENV=production` it additionally requires: a non-draft
`PRIVACY_NOTICE_VERSION`, `PRIVACY_CONTACT`, a strong `LEAD_HASH_SECRET` and a public `SITE_URL`.
There is no mock backend and no in-memory or file fallback.

## Consent model implemented

- Required: a checkbox acknowledging the notice and agreeing that name + mobile are used to answer **this** request.
- Optional and separate: marketing by WhatsApp/SMS, unchecked by default. It is recorded per submission and never
  carried over from an earlier one.
- A checkbox is not proof of guardianship; no child data is collected so none is needed at this stage.

## Staff workflow (no dashboard)

Run from a trusted machine with a **staff** database URL (not the web role):

```bash
npm run leads -- list --status new            # masked view
npm run leads -- list --full --limit 20       # full names and numbers
npm run leads -- status <id> contacted        # new | contacted | qualified | closed | spam
npm run leads:export -- --out exports/leads.csv
npm run leads -- withdraw-marketing --phone 05XXXXXXXX
npm run leads -- delete --phone 05XXXXXXXX                              # dry run
npm run leads -- delete --phone 05XXXXXXXX --execute --confirm-delete   # erasure
npm run privacy:retention:dry-run -- --days 90
npm run privacy:retention:execute -- --days 90
```

- `is_repeat` marks a later inquiry from the same mobile for the same program — review rather than auto-merge.
- CSV exports neutralise spreadsheet formulas, are written with owner-only permissions into the git-ignored
  `exports/` folder, and contain personal data: store securely, delete after use, never email them.
- Access request: `list --full` filtered by the person's number. Correction: update in the database by a staff
  user (no CLI command yet). Deletion: `delete`. Marketing withdrawal: `withdraw-marketing`.

## Retention (proposal — needs approval)

Proposed: delete leads 90 days after creation unless the person became a member or asked otherwise. This is an
operational proposal, not a statutory period. Nothing is deleted automatically: schedule
`npm run privacy:retention:execute` (e.g. weekly) once the period is approved. Consent rows are deleted with their
lead. Database backups keep deleted rows until the backup itself expires — align backup retention with this period
and state it in the notice. Exported CSVs are outside the system and must be deleted by whoever exported them.

## Decisions required from the owner

| # | Decision | Where it lands |
|---|---|---|
| 1 | Legal entity acting as controller, and a privacy contact (email or form) | `PRIVACY_CONTACT`, notice §1/§7 |
| 2 | Lawful basis for answering inquiries and for marketing; wording of both checkboxes | `messages/*.json → register.privacy/marketing` |
| 3 | Retention period | notice §6, scheduled retention job |
| 4 | Hosting provider and region for app and database; any transfer review needed | notice §5, `docs/deployment.md` |
| 5 | Who on staff may read leads; who answers access/erasure requests and how fast | this document |
| 6 | Whether the general WhatsApp line handles Dhahran inquiries | contact page note |
| 7 | Process before collecting any child data (age band etc.) — a separate, reviewed workflow | not built |

## Test data

Development, integration and E2E tests use synthetic names and numbers in the `0500xxxxxx` range against databases
whose names contain `test`; the test helpers refuse any other database. No test sends messages or touches the store.
After a deployed smoke test, remove the record with the `delete` command above.
