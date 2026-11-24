# Advent-Tech — Frontend Spec (Landing + Sign In)

Build a new React frontend in this empty repo from scratch. Scope is **only**:

1. Landing page (`/`)
2. Sign-in page (`/login`)
3. A post-login placeholder page (`/coming-soon`) with the user's profile name and a Logout button

Nothing else: no dashboard, no signup, no forgot-password page, no admin, no payments, no sockets, no backend. Keep the styling plain and clean with Tailwind. Do **not** recreate any fancy theme (no grain, grids, spheres, parallax or framer-motion). Every button and link on every page must do something.

---

## 1. Stack (use exactly this, nothing extra)

| Concern | Package / version |
|---|---|
| Build tool | `react-scripts` 5.0.1 (Create React App setup, **write `package.json` by hand**; don't run the deprecated `create-react-app` CLI) |
| UI | `react` ^19, `react-dom` ^19 |
| Routing | `react-router-dom` ^7 (`BrowserRouter`, `Routes`, `Route`, `Navigate`) |
| State | `@reduxjs/toolkit` ^2, `react-redux` ^9 |
| HTTP | `axios` ^1 |
| Toasts | `react-hot-toast` ^2 |
| Icons | `lucide-react` |
| Styling | `tailwindcss` ^3.4 (devDependency). CRA 5 picks it up from `tailwind.config.js`; no separate PostCSS config needed |

- Plain JavaScript (`.js` / `.jsx`). No TypeScript.
- No testing libraries, web-vitals, framer-motion, socket.io or other extras.
- Scripts: `start`, `build` only.
- Include `eslintConfig: { extends: ["react-app"] }` and the standard CRA `browserslist` block.

## 2. Folder structure

```
advent-tech/
├── public/
│   └── index.html                 # <title>Advent-Tech</title>, <div id="root">
├── src/
│   ├── index.js                   # store + Provider + BrowserRouter + <Toaster/>
│   ├── index.css                  # @tailwind base/components/utilities + html{scroll-behavior:smooth}
│   ├── App.js                     # routes + ProtectedRoute + OpenRoute + session restore
│   ├── config/
│   │   └── site.js                # brand name, emails, phone, address, allowed email domains
│   ├── reducer/
│   │   └── index.js               # combineReducers({ auth, profile })
│   ├── slices/
│   │   ├── authSlice.js           # token, loading
│   │   └── profileSlice.js        # user
│   ├── services/
│   │   ├── api.js                 # endpoint URLs from REACT_APP_AUTH_URL
│   │   ├── apiConnector.js        # axios instance + interceptors
│   │   ├── mockAuth.js            # local mock backend (used when no API URL is set)
│   │   └── operations/
│   │       └── authAPIs.js        # login / getUserDetails / logout thunks
│   ├── components/
│   │   ├── Layout/
│   │   │   └── HomeHeader.jsx     # fixed top nav for landing page
│   │   └── Landing/
│   │       ├── FeatureCard.jsx
│   │       ├── Pricing.jsx
│   │       ├── OurClients.jsx
│   │       ├── ContactSection.jsx
│   │       ├── HelpWidget.jsx
│   │       └── Footer.jsx
│   └── pages/
│       ├── Home.jsx               # landing page
│       ├── ComingSoon.jsx         # post-login placeholder
│       └── AuthFlow/
│           └── Login.jsx
├── .env.example                   # REACT_APP_AUTH_URL=   (blank = mock mode)
├── .gitignore                     # node_modules, build, .env
├── tailwind.config.js             # content: ["./src/**/*.{js,jsx}"]
├── package.json
└── README.md                      # how to run + demo credentials
```

## 3. `src/config/site.js`

All brand and contact values live here so they can be changed in one place:

```js
export const SITE = {
  brand: "Advent-Tech",
  supportEmail: "support@mnrtechnologies.com",
  salesEmail: "sales@mnrtechnologies.com",
  infoEmail: "info@mnrtechnologies.com",
  phone: "+91 73299 99968",
  address: "WeWork - Krishe Emerald, Ground Floor, Laxmi Cyber City, HITECH City, Hyderabad, Telangana - 500082",
  allowedEmailDomains: ["adventglobal.com", "mnrtechnologies.com", "redwavesol.com"],
};
```

Wherever the old product name "MNR AT" appears in the copy below, use `SITE.brand`.

---

## 4. Routing (`App.js`)

| Path | Guard | Page |
|---|---|---|
| `/` | `OpenRoute` | `Home` |
| `/login` | `OpenRoute` | `Login` |
| `/coming-soon` | `ProtectedRoute` | `ComingSoon` |
| `*` | none | `<Navigate to="/" replace />` |

- **ProtectedRoute**: if `state.auth.token` or `localStorage.getItem("token")` is present, render the children; otherwise `<Navigate to="/" replace />`.
- **OpenRoute**: if neither is present, render the children; otherwise `<Navigate to="/coming-soon" replace />`.
- **Session restore**: in `App`, use a `useEffect`. When a token is in localStorage and `state.profile.user` is null, `dispatch(getUserDetails(navigate))`.

## 5. Redux

**authSlice** (`name: "auth"`):
```js
initialState = {
  loading: false,
  token: localStorage.getItem("token") ? JSON.parse(localStorage.getItem("token")) : null,
}
reducers: setLoading, setToken
```

**profileSlice** (`name: "profile"`):
```js
initialState = { user: null }
reducers: setUser
```

Configure the store in `index.js` with `configureStore({ reducer: rootReducer })`.

## 6. Auth logic

The real backend will use a **new, separate auth service and database**, which doesn't exist yet. For now auth runs against a **local mock**, behind the same interface the real API will use. Switching to the real backend later means setting one env var.

### 6.1 API contract (what the future backend must implement)

- `POST {REACT_APP_AUTH_URL}/auth/login`, body `{ email, password }`
  returns `{ success: true, token, user: { _id, firstName, lastName, email, role } }`
  or `{ success: false, message }` with a 4xx status
- `GET {REACT_APP_AUTH_URL}/auth/getUserDetails`, header `Authorization: Bearer <token>`
  returns `{ success: true, user }`, or 401

### 6.2 `services/api.js`
```js
const BASE_URL = process.env.REACT_APP_AUTH_URL;
export const USE_MOCK = !BASE_URL;
export const endpoints = {
  LOGIN_API: `${BASE_URL}/auth/login`,
  GET_USER_DETAILS_API: `${BASE_URL}/auth/getUserDetails`,
};
```

### 6.3 `services/apiConnector.js`
- An axios instance with `timeout: 10000` and JSON headers.
- Request interceptor: read `localStorage.token`, strip the surrounding JSON quotes, and set `Authorization: Bearer <token>`.
- Response interceptor: on a 401 from any request whose URL doesn't contain `login`, remove `token` from localStorage and set `window.location.href = "/login"`.
- Export `apiConnector(method, url, bodyData, headers, params)`.

### 6.4 `services/mockAuth.js`
- One hard-coded demo user, `{ _id: "1", firstName: "Demo", lastName: "User", email: "demo@adventglobal.com", role: "user" }`, with password `Demo@123`.
- `mockLogin(email, password)`: wait about 600 ms. If the credentials match (email compared case-insensitively), return `{ success: true, token: "mock." + btoa(email), user }`. Otherwise throw an error with `message: "Invalid email or password"`.
- `mockGetUserDetails(token)`: decode the email from the token and return `{ success: true, user }`. If it doesn't match, throw.

### 6.5 `services/operations/authAPIs.js` (Redux thunks)

**`login(email, password, navigate)`**
1. `const toastId = toast.loading("Loading...")` and `dispatch(setLoading(true))`.
2. Call `mockLogin` if `USE_MOCK`; otherwise `apiConnector("POST", LOGIN_API, { email, password })` and read `.data`.
3. If `!data.success`, throw `new Error(data.message)`.
4. Run `toast.success("Signin Successful")`, then `dispatch(setToken(token))`, `dispatch(setUser(user))`, and `localStorage.setItem("token", JSON.stringify(token))`.
5. `navigate("/coming-soon")`.
6. On error: show `toast.error(message)`. If there was no response at all (network failure), say "Cannot reach the server. Check that the API is running and REACT_APP_AUTH_URL is correct." Otherwise use the server's message, or fall back to "Sign in failed. Please try again." Stay on `/login`.
7. Finally: `dispatch(setLoading(false))` and `toast.dismiss(toastId)`.

**`getUserDetails(navigate)`**
- Read the token from localStorage and call the mock or the API.
- On success: `dispatch(setUser(user))`.
- On **any** failure, end the session: `setToken(null)`, `setUser(null)`, remove `token` from localStorage, show `toast.error("Could not confirm your sign-in — please sign in again")`, and `navigate("/login")`.

**`logout(navigate)`**
- `setToken(null)`, `setUser(null)`, remove `token` from localStorage, `toast.success("Logged Out")`, `navigate("/")`.

---

## 7. Sign-in page (`pages/AuthFlow/Login.jsx`)

Layout: a centered card on a light background, with a small top bar.

- **Top bar**: the brand text `Advent-Tech` on the left (click goes to `/`) and a back-arrow button on the right (`ArrowLeft` icon, goes to `/`).
- **Card heading**: `Advent-Tech`, with the subtitle "Sign in to your account".
- **Form** (`onSubmit` calls `e.preventDefault()`, then `dispatch(login(email, password, navigate))`):
  - **Email Address**: `type="email"`, `required`, placeholder `name@adventglobal.com`.
    - Validate on change: if there's a value and it doesn't end with `@` + one of `SITE.allowedEmailDomains`, show the inline red error "This email is not allowed".
  - **Password**: `required`, placeholder `••••••••`.
    - It has an eye toggle button (`Eye` / `EyeOff`, `type="button"`) that switches between showing and hiding the password.
  - **Forgot Password?** link-style button under the password field, aligned right. There's no reset page, so clicking it shows `toast("Please contact your system administrator to reset your password.")`.
  - **Sign In** submit button: disabled while `loading` or while an email error is showing, and its label changes to "Signing In..." while loading.
- **Footer text** under the form: "Need access? **Please contact your system administrator.**"
- In mock mode only (`USE_MOCK`), show a small grey hint: "Demo: demo@adventglobal.com / Demo@123".
- There's no signup link.
- A `HelpWidget` is also on this page (see §8.9).

## 8. Landing page (`pages/Home.jsx`)

Use a simple, readable layout: max-width container, alternating light section backgrounds, a navy (`#0c1e5b`) and orange (`orange-500`) accent pair, and rounded cards. Every section gets an `id` and `scroll-mt-24` so the fixed header doesn't cover the heading.

Page order: Header, Hero, Module strip, Features, Testing Suite, Capabilities, Pricing, Our Clients, Contact, Footer, HelpWidget.

### 8.1 Header (`HomeHeader.jsx`), fixed to the top
- Brand text `Advent-Tech` on the left: a `Link` to `/`.
- Nav buttons, in this order: **Home, Features, About, Contact, Pricing, Our Clients**. Each one smooth-scrolls to its section id: `home`, `features`, `about`, `contact`, `pricing`, `clients`.
  - If the current path isn't `/`, navigate to `/` first, then scroll after 100 ms.
- **Log in** button (`User` icon): a `Link` to `/login`.
- Mobile (below `lg`): a hamburger button (`Menu` / `X`) toggles a dropdown with the same nav items. Picking an item closes the dropdown.
- Add a shadow or background once `window.scrollY > 40`.

### 8.2 Hero (`id="home"`)
- Eyebrow text: "Autonomous AI Testing for Faster, Smarter Releases"
- H1: "Elevate Your **QA**" (with "QA" in orange)
- Paragraph: "Discover the future of software testing. **Advent-Tech**'s AI-driven platform automates functional, UI, API, and regression workflows with intelligent defect detection."
- Button **Contact Us** (`ArrowUpRight` icon): smooth-scrolls to `#contact`.

### 8.3 Module strip
A simple horizontal band (navy background, white text) listing the 10 module titles from §8.5, separated by `•`. It wraps on small screens. It's decorative only.

### 8.4 Features (`id="features"`)
- Eyebrow: "Revolutionize Your Workflow". H2: "Transformative AI Testing".
- A two-column card:
  - **Left (navy panel)**: a simple list of the 10 module titles, each with its icon.
  - **Right**: a `Zap` icon, then H3 "Intelligent **Automation**", then the paragraph "AI powered prioritization, test generation, and self-healing workflows accelerate your release cycle.", then the button **Start your journey**, which navigates to `/login`.

### 8.5 Testing Suite (`id="testing-suite"`, not in the nav)
- Eyebrow: "Features". H2: "One Platform, **Every Kind of Testing**".
- Side paragraph: "From requirements to production code, AI agents cover web, mobile, API, database, security and performance testing. Bring your own OpenAI or Anthropic key."
- Grid (1, 2 or 3 columns depending on screen width) of `FeatureCard` components. Each card shows an icon, title, description and a bullet list. The last card spans the full width (`wide`).

Data (icon / title / description / points):

1. `Globe`: **Web Testing**. "An AI agent signs in to your web app, explores it and tests it while you watch."
   - Connect → Discover → Review → Validate: it writes tests, you confirm expected results
   - Works on public sites or behind sign-in, with approver accounts for approval flows
   - Standard crawl with test stories and Excel report, or prompt testing with your own steps
   - Live browser stream, activity log and a Terminate button
2. `FileSearch`: **Business Validation**. "Test Case Designer for before the site is built. No website needed."
   - Upload a requirements document (PDF, DOCX, TXT or MD, up to 50 MB)
   - Get back a full test case specification
   - Reads diagrams and mockups inside the document
3. `RefreshCw`: **Regression Testing**. "Project-based regression testing that keeps every release in check."
   - Organise work into projects
   - Connect your existing tools
   - ML pipeline, insights and an AI chat assistant
4. `Smartphone`: **Mobile App Testing**. "Upload an Android APK and an autonomous AI agent tests it."
   - Optional login details and a max actions setting (50–500)
   - Pipeline stages: Validation → Exploration → Testing
   - Live device stream, live logs, and screen, passed and failed counts
5. `Network`: **API Testing**. "API Guardian tests your endpoints straight from your Swagger / OpenAPI docs."
   - Target URL, API base URL and optional OpenAPI link
   - Login credentials, OTP and results delivered by email
   - Safe mode (on by default) skips destructive calls
6. `Database`: **DB Testing**. "Full database assessments for PostgreSQL, MongoDB or both via a replica URL."
   - Choose Claude or GPT and pick the model
   - Tests in SQL or JavaScript, as integration or unit tests
   - Optional schema DDL and description to steer the AI
7. `ShieldCheck`: **Security Testing (VAPT)**. "Security assessment against the OWASP Top 10 plus API security."
   - Checks pages behind login using a test account
   - Reads your OpenAPI docs to cover every endpoint
   - Requires confirmation that you're authorized to test the site
8. `Gauge`: **Performance Testing**. "Describe a user flow in plain English. The engine plans it, finds the real endpoints and runs the load test."
   - Scenarios: browsing, login under load, signup, per-feature timing or mixed
   - Set the number of virtual users
   - Smoke and Load always run; add Stress, Spike and Soak
9. `GitBranch`: **GitHub Code Testing**. "AI reads your code's business logic, then tests whether the code does what it claims."
   - Connect a GitHub repo, or upload a folder or .zip (up to 500 MB)
   - Python, JavaScript, TypeScript, Java and Kotlin
   - Run history kept per repository
10. `Boxes`: **AI SAP Testing** (`wide: true`). "An AI agent signs in to your SAP and tests it module by module (Finance, Sales, Purchasing, Inventory and more). No one writes test scripts."
    - Connect → Discover → Learn → Write tests → Run → Report
    - Name a module and it reads SAP's own menu to find every transaction in it
    - Learns how your SAP behaves, then writes tests only from what it saw
    - Pass or Fail per test, with screenshots, the exact failing step and an Excel report of real defects
    - Fits any company's SAP with no per-customer setup, and never changes real business data

### 8.6 Capabilities (`id="about"`, orange background)
- Left: eyebrow "Capabilities" and H2 "Unlock the Power of **Autonomous Testing**". On large screens this column is sticky.
- Right: a 2-column grid of cards (icon / title / description). The last card spans both columns.
  1. `Cpu`: **Intelligent Discovery**. AI-driven requirement analysis, risk prioritization, and smart test coverage planning.
  2. `Layout`: **Experience Validation**. Autonomous UI, UX, accessibility, and visual regression testing across devices.
  3. `Globe`: **Cloud & DevOps Ready**. Seamless automation for cloud-native, microservices, and CI/CD pipelines.
  4. `LineChart`: **Performance Intelligence**. AI-powered load, stress, and scalability testing with predictive insights.
  5. `Shield`: **Self-Healing Automation**. Adaptive tests that evolve with application changes, reducing maintenance overhead.
  6. `Lock`: **Enterprise-Grade Security**. Secure, compliant, and scalable testing for mission-critical applications.
  7. `AppWindow`: **Power Apps Testing** (wide). End-to-end Power Apps testing across screens, forms, field validation, and user workflows.

### 8.7 Pricing (`id="pricing"`, navy background) in `Pricing.jsx`
- H2: "Pay for **Work Done**, Not Pages Visited"
- Sub-text: "One credit tests one page with up to two test scenarios. Heavy pages cost more, simple pages cost less, and you always see the price before we run anything."
- **Plan-type toggle** (a pill with two buttons; this is working state): **Bring Your Own Key** (default, with a "Best value" badge) and **Managed AI**. Switching it changes the blurb and the tier cards.
  - BYOK blurb: "You plug in your own OpenAI or Anthropic key and your provider bills you directly. Credits are a fair-use meter on our capacity."
  - Managed blurb: "We supply the AI keys and carry the token cost. No provider accounts to manage."
- **Tier cards**: 4 per plan type. They're static data in the component; the cards have no buttons. Each card shows the name and price ("$X / month", or "Custom" when there's no price), a "Most popular" badge if the tier is highlighted, and its feature bullets.
  - **BYOK**:
    - Starter, $375. 250 credits / month · 1 site tested at a time · Use your own OpenAI or Anthropic key · $1.00 per extra credit · Email support
    - Growth, $1,000, **popular**. 1,000 credits / month · 2 sites tested at a time · Use your own OpenAI or Anthropic key · $0.75 per extra credit · CI/CD pipeline integrations · Priority email support
    - Scale, $2,500. 3,500 credits / month · 3 sites tested at a time · Use your own OpenAI or Anthropic key · $0.50 per extra credit · CI/CD pipeline integrations · Dedicated account manager
    - Self-Hosted, Custom. On-premise deployment · Unlimited concurrency on your hardware · Custom tool integrations · Dedicated infrastructure · Dedicated account manager
  - **Managed**:
    - Managed Starter, $565. 250 credits / month · 1 site tested at a time · AI keys included — nothing to configure · $2.15 per extra credit · Email support
    - Managed Growth, $1,900, **popular**. 1,000 credits / month · 2 sites tested at a time · AI keys included — nothing to configure · $1.80 per extra credit · CI/CD pipeline integrations · Priority email support
    - Managed Scale, $4,125. 2,500 credits / month on the premium engine · 3 sites tested at a time · Highest reliability on complex applications · $1.60 per extra credit · CI/CD pipeline integrations · Dedicated account manager
    - Enterprise, Custom. Custom credit allowance · Custom concurrency · Model routing tuned to your workload · SSO, audit logs and custom SLAs · Dedicated account manager
- **Book a Live Demo** button (`Mail` icon) opens a modal:
  - Contents: a `Rocket` icon, the heading "Book Your Demo", and the text "To schedule your personalized platform walkthrough, please reach out to our sales team directly at the email address below. We typically respond within a few hours to arrange a time that works best for you."
  - Below that: `SITE.salesEmail` and a **Copy** button that does `navigator.clipboard.writeText` and then `toast.success("Email copied to clipboard!")`.
  - The modal closes from its X button, from a click on the backdrop, or from the Esc key.

### 8.8 Our Clients (`id="clients"`)
- H2: "Our **Clients**".
- Text: "We are proud to partner with industry-leading organizations that trust Advent-Tech to deliver technology excellence and innovative solutions."
- One navy card with the text "Advent Global Solutions Inc." (no image needed).

### 8.9 Contact (`id="contact"`) in `ContactSection.jsx`
- **Left**: the info cards from `SITE`: Our Location (`MapPin`), Phone (`Phone`), Email (`Mail`).
- **Right**: a form with these fields: Full Name*, Email*, Phone, Company, Message*.
  - Validate on submit: Name required; Email required and must match `/\S+@\S+\.\S+/`; Message required. Show inline errors, and clear a field's error as soon as the user types in it.
  - There's no backend yet. On a valid submit, show the "Sending..." state for about 600 ms, then a success message with a `CheckCircle2` icon ("Thanks! We'll get back to you shortly."), reset the form, and log the payload with `console.info`.
  - Leave a `// TODO: POST to contact API` comment where the real call will go.
- `ContactSection` takes a `variant` prop (`"section"` | `"modal"`) so HelpWidget can reuse just the form.

### 8.10 Footer (`Footer.jsx`)
- A dark navy footer with large "Advent-Tech" text.
- Bottom row: "© 2026 Advent-Tech. All rights reserved." on one side, and "Developed by **MNR Technologies**" on the other, where "MNR Technologies" is a link to `#home`.

### 8.11 HelpWidget (`HelpWidget.jsx`), on both Home and Login
- A floating round button in the bottom-right corner (`HelpCircle` icon) that opens a modal.
- Modal contents: the heading "Need Help?", the title "Any Query?", and the text "If you have any questions or need assistance, feel free to drop us an email. Our team will get back to you shortly."
  - Then a `mailto:` link to `SITE.supportEmail`, plus a copy button whose icon switches to `Check` for 2 seconds after copying.
  - Below that: `<ContactSection variant="modal" />`.
- The modal closes from its X button, from a click on the backdrop, or from Esc.

---

## 9. Post-login page (`pages/ComingSoon.jsx`), protected

- **Top bar**:
  - Left: the brand text `Advent-Tech`.
  - Right: a profile chip showing a circle with the user's initials, the full name (`firstName lastName`) and the email underneath in small grey text.
  - Next to the chip: a **Logout** button (`LogOut` icon) that does `dispatch(logout(navigate))`.
- **Centered content**: a large heading "**Advent-Tech**", then "Coming Soon" underneath, then a short line: "We're building something great. Stay tuned."
- While `user` is still null (session restoring after a refresh), show a "Loading..." placeholder instead of the name.

---

## 10. Acceptance checklist (verify all before finishing)

- [ ] `npm install && npm start` runs with **zero** compile errors or ESLint warnings, and `npm run build` succeeds.
- [ ] Every nav item scrolls to the correct section on desktop and in the mobile menu.
- [ ] **Contact Us** scrolls to Contact. **Start your journey** and **Log in** go to `/login`.
- [ ] The pricing toggle switches the tiers and the blurb. **Book a Live Demo** opens the modal, and Copy copies the email and shows a toast.
- [ ] The contact form validates and shows the success state. The HelpWidget opens, copies and closes.
- [ ] Login rejects disallowed email domains inline. Wrong credentials show a toast and stay on `/login`. `demo@adventglobal.com` / `Demo@123` lands on `/coming-soon` showing "Demo User".
- [ ] Refreshing `/coming-soon` keeps the session. Visiting `/` or `/login` while logged in redirects to `/coming-soon`.
- [ ] **Logout** clears the session and returns to `/`. After that, visiting `/coming-soon` redirects to `/`.
- [ ] An unknown URL redirects to `/`.
- [ ] The layout is responsive at 375px, 768px and 1280px widths.
- [ ] The README lists the setup steps, the demo credentials, and how to switch to the real API (`REACT_APP_AUTH_URL` plus the contract in §6.1).
