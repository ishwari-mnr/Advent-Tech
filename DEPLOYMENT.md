# Advent-Tech deployment

Advent-Tech runs the same code as MNR-AI-Tester, but as a **completely separate stack**:
its own database, its own login secret, its own Razorpay account and its own copies of the
testing engines. Nothing is shared with MNR at runtime.

```
Advent frontend ──► Advent backend (this repo, backend/) ──► Advent MongoDB
       │                                                        ▲
       └──────────► Advent testing engines ─────────────────────┘
                    (web, spec, API, regression, mobile,       engines write runs here;
                     perf, DB, code, security)                 Advent's billing job charges them
```

Why separate engines: the engines check the login token against `JWT_SECRET` and write
every run into the MongoDB they are configured with. The backend's billing job
(`backend/jobs/creditReconciler.js`) charges credits from those run records. An engine
pointed at MNR's database or secret would reject Advent logins or bill runs to the wrong
place.

## 1. Advent backend (auth, credits, payments)

1. Create a new MongoDB database for Advent.
2. `cp backend/.env.example backend/.env` and fill in every value. Generate new
   `JWT_SECRET` and `INTERNAL_API_SECRET` values. Do not copy MNR's.
3. `npm install`, then `npm run server`. Check `GET /health` returns `UP`.
4. Create the first login (there is no public signup):
   ```
   npm run seed:superadmin -- --name "Full Name" --email you@adventglobal.com --password "..."
   ```
5. Sign in, then from the super-admin dashboard create companies, company admins, staff
   and plans, and grant credits.
6. In Advent's Razorpay dashboard, set the webhook to `<backend URL>/api/payments/webhook`
   and use its secret as `RAZORPAY_WEBHOOK_SECRET`.
7. When running more than one backend instance, set `CREDIT_JOBS_ENABLED=false` on all
   but one.

## 2. Testing engines (second deployment of each)

Deploy each engine repo again with Advent's settings. The code does not change.
For every engine, set:

| Setting | Value |
|---|---|
| MongoDB connection | Advent's `MONGODB_URL` (mobile engine: Advent's `MOBILE_DB_URL`) |
| JWT secret | Advent's `JWT_SECRET` (web, perf and DB engines verify the token) |
| Internal secret, where used | Advent's `INTERNAL_API_SECRET` |
| CORS / allowed origins | Advent's frontend domain |

Check each engine repo for the exact variable names it uses.

| Engine | Frontend variable to point at it |
|---|---|
| Web testing | `REACT_APP_AI_WEB_TESTER_BACKEND_URL` |
| Spec / test-case designer | `REACT_APP_AI_SPEC_TESTER_BACKEND_URL` |
| API testing | `REACT_APP_AI_API_TESTER_BACKEND_URL` |
| Regression testing | `REACT_APP_AI_REGRESSION_TESTER_BACKEND_URL` |
| Mobile testing | `REACT_APP_AI_MOBILE_TESTER_BACKEND_URL`, `REACT_APP_AI_MOBILE_UPLOAD_URL`, `REACT_APP_AI_MOBILE_TESTER_BACKEND_WS_URL` |
| Performance testing | `REACT_APP_PERF_TESTER_BACKEND_URL` |
| DB testing | `REACT_APP_DB_TESTER_BACKEND_URL` |
| Code (GitHub) testing | `REACT_APP_CODE_TESTER_BACKEND_URL` |
| Security (VAPT) testing | `REACT_APP_SECURITY_TESTING_URL` |

Point the web engine's terminate endpoint at `AI_BACKEND_API_TERMINATE` in `backend/.env`.

## 3. Advent frontend

1. `cp .env.example .env` and fill in the Advent backend URL (ending in `/api`) and every
   engine URL from step 2.
2. `npm run build` and deploy the `build/` folder.
3. Add the frontend domain to `CORS_ORIGINS` and `FRONTEND_URL` in `backend/.env`.

## 4. Check the separation

- An MNR account cannot sign in to Advent (it does not exist in Advent's database).
- After a test run on Advent, the run appears in Advent's MongoDB and Advent's credit
  ledger shows the charge. Nothing appears in MNR's database.
