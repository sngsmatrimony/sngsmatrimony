# SNGS Matrimony Repository Guide

This document explains the complete workspace in practical terms: what each important file does, how the frontend talks to the backend, where data is stored, and which files participate in each user workflow.

## 1. What This Repository Contains

The workspace contains two applications under one root folder:

```text
sngs_matrimony/
  sngs_matrimonial_frontend-main/   Next.js and React web application
  sngs_matrimonial_backend-main/    Express, MongoDB, payments, chat, and storage API
  root scripts                      AWS URL audit and Supabase migration tools
```

The applications are developed together, but they are separate processes:

| Application | Technology | Local port | Main responsibility |
|---|---|---:|---|
| Frontend | Next.js App Router, React, Zustand, React Query | 3000 | Pages, forms, browser state, API requests, UI |
| Backend | Node.js, Express, Mongoose, Socket.IO | 4000 | Authentication, validation, business rules, database, files, payments |
| Database | MongoDB | Atlas URL from environment | Users, admins, profiles, memberships, transactions, chat |
| Media storage | Supabase Storage | Project URL from environment | Profile photos, gallery photos, horoscope documents |
| Payments | Razorpay | External service | Orders, payment verification, refunds, webhooks |

## 2. How to Run the Workspace

From the root folder:

```bash
npm run install:all
npm run dev
```

Useful commands from the root:

| Command | Purpose |
|---|---|
| `npm run install:backend` | Install backend dependencies |
| `npm run install:frontend` | Install frontend dependencies |
| `npm run install:all` | Install both applications |
| `npm run backend` | Start backend with Nodemon |
| `npm run frontend` | Start frontend with Next.js |
| `npm run dev` | Start backend and frontend together |
| `npm run build:frontend` | Create a production frontend build |

Environment values are loaded from the root `backend_env.txt` and `frontend_env.txt` during local development. These files must never contain committed production secrets. Use deployment secret storage in production.

## 3. Request and Data Flow

The normal request path is:

```text
Browser page/component
  -> frontend API wrapper or store
  -> Axios client
  -> http://localhost:4000/api/...
  -> Express app middleware
  -> route module
  -> authentication middleware, if protected
  -> controller function
  -> Mongoose model / Supabase / Razorpay
  -> JSON response
  -> Zustand or React Query state
  -> React component re-render
```

For live chat, Socket.IO is an additional path:

```text
Chat component -> SocketContext -> socket.js -> backend chat.socket.js -> chat events
```

The frontend does not use Supabase Auth. User authentication is implemented by this application with MongoDB users and JWTs.

## 4. Root Files and Scripts

| File | Purpose |
|---|---|
| `package.json` | Root orchestration commands for both applications |
| `package-lock.json` | Root dependency lock file |
| `README.md` | Short project overview, run instructions, and migration notes |
| `REPO_ARCHITECTURE.md` | This detailed architecture and file-relationship guide |
| `backend_env.txt` | Local backend environment values; keep private |
| `frontend_env.txt` | Local frontend environment values; keep private |
| `.gitignore` | Root ignore rules; review because environment files are explicitly unignored |
| `aws_urls.txt` | Historical list of AWS media URLs found during migration |
| `sample.json` | Sample data used by migration/testing utilities |
| `s3-backup/` | Local S3 backup data, if present; not application runtime code |

### Root migration scripts

| File | Export or behavior | Use |
|---|---|---|
| `find_aws_urls.js` | Scans MongoDB user media fields | Find remaining AWS URLs without changing data |
| `migrate_all_users_to_supabase.js` | Maps AWS URL host to Supabase URL host | Bulk migration of profile, gallery, and horoscope URL strings |
| `migrate_saurabh_to_supabase.js` | Single-user URL migration | Trial migration for Saurabh Manoharan |
| `migrate_complete_to_supabase.js` | Complete single-user validation | Checks all media object paths and resulting URLs |
| `replace_single_user_aws_urls.js` | Single-user replacement variant | Earlier/alternative migration utility |
| `transform_urls_sample.js` | `mapAwsToSupabase()` and sample transformation | Demonstrates URL transformation without database writes |

Media migration changes URL hosts while preserving the object path. The important path convention is `photos/{userId}/...` for images and `documents/{userId}/...` for horoscope files.

## 5. Frontend Application

The frontend is in `sngs_matrimonial_frontend-main/`. It uses the Next.js App Router.

### Frontend foundation files

| File | Purpose |
|---|---|
| `src/app/layout.js` | Root HTML layout, metadata, and application fonts |
| `src/app/providers.js` | React Query provider and toast provider |
| `src/app/globals.css` | Global CSS, colors, typography, and shared styles |
| `next.config.mjs` | Next.js configuration, compression, and remote image settings |
| `components.json` | UI component generator configuration |
| `jsconfig.json` | JavaScript path aliases such as `@/components` |
| `eslint.config.mjs` | Frontend ESLint configuration |
| `package.json` | Frontend dependencies and `dev`, `build`, `start`, and `lint` scripts |

### Frontend layouts and access control

| File | Purpose |
|---|---|
| `src/app/(auth)/layout.js` | Shared layout for login, registration, and password recovery |
| `src/app/(dashboard)/layout.js` | Initializes user auth, protects dashboard pages, displays navigation and membership state, and mounts `SocketProvider` |
| `src/app/admin/layout.js` | Initializes and protects the admin application |
| `src/app/admin/login/layout.js` | Admin login/recovery layout without the protected admin shell |
| `src/components/guards/ApprovalGuard.js` | Blocks full user access until profile approval state allows it |
| `src/components/layout/ApprovalStatusBanner.js` | Shows pending or rejected approval state |
| `src/components/layout/Header.js` | Shared header, navigation, and user logout entry point |

### Frontend pages and their purpose

#### Public and user authentication pages

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.js` | Landing page; loads public hero and How It Works content |
| `/login` | `src/app/(auth)/login/page.js` | User login through `useAuthStore.login()` |
| `/register` | `src/app/(auth)/register/page.js` | Multi-step registration, OTP verification, profile data, and media uploads |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.js` | Requests password-reset OTP |
| `/forgot-password/verify-otp` | `src/app/(auth)/forgot-password/verify-otp/page.js` | Verifies OTP and sets a new password |
| `/privacy-policy` | `src/app/privacy-policy/page.js` | Privacy policy |
| `/terms-and-conditions` | `src/app/terms-and-conditions/page.js` | Terms and conditions |
| `/shipping-and-delivery` | `src/app/shipping-and-delivery/page.js` | Delivery policy |
| `/cancellation-and-refund` | `src/app/cancellation-and-refund/page.js` | Cancellation/refund policy |

#### Dashboard and profile pages

| Route | File | Purpose |
|---|---|---|
| `/browse` | `src/app/(dashboard)/browse/page.js` | Browse discoverable profiles |
| `/liked` | `src/app/(dashboard)/liked/page.js` | View liked profiles |
| `/messages` | `src/app/(dashboard)/messages/page.js` | Main chat page |
| `/chat` | `src/app/chat/page.js` | Standalone chat route; also creates its own socket provider |
| `/profile` | `src/app/(dashboard)/profile/page.js` | Current user's profile |
| `/profiles/[id]` | `src/app/profiles/[id]/page.js` | View another profile, like, chat, and download profile data |
| `/settings` | `src/app/(dashboard)/settings/page.js` | Account and application settings |
| `/profiles/settings` | `src/app/profiles/settings/page.js` | Alternate settings route |
| `/membership/purchase` | `src/app/membership/purchase/page.js` | Lists plans and starts a Razorpay order |
| `/payment/[orderId]` | `src/app/payment/[orderId]/page.js` | Opens Razorpay checkout for an order |
| `/payment/success` | `src/app/payment/success/page.js` | Payment completion screen |

#### Admin pages

| Route | File | Purpose |
|---|---|---|
| `/admin/login` | `src/app/admin/login/page.js` | Admin login |
| `/admin/forgot-password` | `src/app/admin/forgot-password/page.js` | Admin reset OTP request |
| `/admin/forgot-password/verify-otp` | `src/app/admin/forgot-password/verify-otp/page.js` | Admin OTP verification and reset |
| `/admin` | `src/app/admin/page.js` | Admin analytics dashboard |
| `/admin/users` | `src/app/admin/users/page.js` | User search and management |
| `/admin/users/[id]` | `src/app/admin/users/[id]/page.js` | User detail, approval, editing, deletion, and media management |
| `/admin/membership-plans` | `src/app/admin/membership-plans/page.js` | Membership plan CRUD |
| `/admin/admins` | `src/app/admin/admins/page.js` | Admin management |
| `/admin/settings` | `src/app/admin/settings/page.js` | Contact, hero, How It Works, and admin password settings |

## 6. Frontend API, State, and Utility Files

### API clients and wrappers

| File | Purpose | Backend scope |
|---|---|---|
| `src/lib/api/client.js` | Axios client using `NEXT_PUBLIC_API_URL`; adds `authToken` as Bearer token | User routes under `/api/auth`, `/api/profiles`, `/api/membership`, `/api/settings`, `/api/chat` |
| `src/lib/api/adminClient.js` | Axios client using `adminAuthToken` | Admin routes |
| `src/lib/api/admin.js` | Named admin API functions for users, content, plans, transactions, and media | `/api/admin/*` |

### Zustand stores

| File | Important functions/state | Used by |
|---|---|---|
| `src/store/authStore.js` | `login`, `register`, `initializeAuth`, `refreshUser`, `logout`, media upload/delete functions, membership state, approval helpers | Login, register, dashboard, profile, settings, guards |
| `src/store/adminAuthStore.js` | Admin login, initialization, current admin, logout, password flows | Admin layouts and pages |
| `src/store/chatStore.js` | Conversations, messages, unread counts, typing state, online state, key registration, REST chat calls | Chat components and `SocketContext` |
| `src/store/landingStore.js` | Selected profile/chat and legacy profile UI cache state | Profile and dashboard components |

### Hooks and utilities

| File | Purpose |
|---|---|
| `src/hooks/useLikeMutation.js` | React Query optimistic like/unlike mutations |
| `src/hooks/useContactInfo.js` | React Query wrapper for public contact info |
| `src/hooks/useProfilePdf.js` | Loads profile PDF generation on demand |
| `src/contexts/SocketContext.jsx` | Connects authenticated users to Socket.IO and updates `chatStore` from events |
| `src/lib/socket.js` | Socket initialization, access, disconnect, emits, and listeners |
| `src/lib/encryption.js` | Browser cryptography helpers for keys, encryption, decryption, signing, and verification |
| `src/lib/time.js` | Time parsing and dropdown conversion |
| `src/lib/utils.js` | `cn()` class-name helper |
| `src/lib/toast.js` | Toast success, error, and warning wrappers |
| `src/lib/constants/formData.js` | Registration dropdown/options data |
| `src/lib/pdf/profilePdfGenerator.js` | Generates printable profile PDFs |
| `src/lib/pdf/horoscopeUtils.js` | Fetches and prepares horoscope documents for PDF use |

### Media proxy routes

| File | Browser route | Purpose |
|---|---|---|
| `src/app/api/image-proxy/route.js` | `/api/image-proxy?url=...` | Proxies approved image URLs to avoid browser CORS issues |
| `src/app/api/document-proxy/route.js` | `/api/document-proxy?url=...` | Proxies approved document URLs |

`ProfileDetailView`, `UserProfileView`, and print/PDF components use proxied media in relevant paths. The proxy must remain restricted to approved hosts; do not turn it into an unrestricted server-side fetcher.

## 7. Frontend-to-Backend Workflow Map

This section answers: "Which backend files are used by this frontend function?"

### User login

```text
src/app/(auth)/login/page.js
  -> useAuthStore.login()
  -> src/lib/api/client.js
  -> POST /api/auth/login
  -> src/routes/auth.routes.js
  -> authController.login()
  -> User.findOne() and user.matchPassword()
  -> user.generateAuthToken()
  -> frontend stores authToken and user in authStore
```

Backend files involved:

- `src/routes/auth.routes.js`: declares the route.
- `src/controllers/auth.controller.js`: validates credentials and returns JWT/user data.
- `src/models/User.js`: password schema, `matchPassword`, and `generateAuthToken`.
- `src/middleware/validation.middleware.js`: formats validation errors.

### Registration and email OTP

```text
register/page.js
  -> client POST /api/auth/register/check-email
  -> client POST /api/auth/register/send-otp
  -> client POST /api/auth/register/verify-otp
  -> client POST /api/auth/register
```

Backend files involved:

- `src/routes/auth.routes.js`: validation rules and route declarations.
- `src/controllers/auth.controller.js`: `checkEmailUniqueness`, `sendRegistrationOTP`, `verifyRegistrationOTP`, and `register`.
- `src/services/registrationOtp.service.js`: temporary in-memory registration OTP and verification-token store.
- `src/services/otp.service.js`: OTP generation/hash/verification and delivery selection.
- `src/services/email.service.js`: Resend email delivery.
- `src/models/User.js`: user persistence and password hashing hook.

### Profile, gallery, and horoscope upload

```text
PreferencesMediaStep.jsx / EditProfileForm.js
  -> authStore.uploadProfilePicture()
  -> POST /api/auth/upload-profile-picture
  -> verifyToken
  -> photoUpload middleware
  -> s3.service.js Supabase upload
  -> authController.uploadProfilePicture()
  -> User profilePicture update
```

Gallery uses the same path with `uploadPhoto()` and `gallery.photos`. Horoscope uses `uploadHoroscopeDocument()`, the multipart field `document`, the `documentUpload` middleware, and `horoscopeDocument`.

Backend files involved:

- `src/routes/auth.routes.js`: protected upload routes and multipart field names.
- `src/middleware/auth.middleware.js`: attaches authenticated `req.user`.
- `src/services/s3.service.js`: selects Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist; otherwise falls back to AWS S3.
- `src/controllers/auth.controller.js`: writes URL/object metadata to MongoDB.
- `src/models/User.js`: media field schemas.

Media-only saves use `validateModifiedOnly` because old users may contain null or missing legacy profile fields such as `nakshatra`.

### Current profile edit

```text
EditProfileForm.js
  -> client PUT /api/profiles/update
  -> profile.routes.js
  -> profileController.updateProfile()
  -> User update/save
  -> authStore media uploads, if new files were selected
  -> client GET /api/profiles/me/view
```

Backend files involved:

- `src/routes/profile.routes.js`
- `src/controllers/profile.controller.js`: update and current-profile response.
- `src/models/User.js`
- `src/routes/auth.routes.js`, `src/controllers/auth.controller.js`, and `src/services/s3.service.js` for new media.

### Account deletion

```text
AccountManagementSection.jsx
  -> DELETE /api/auth/delete-account with { password }
  -> verifyToken
  -> authController.deleteAccount()
  -> User.isActive = false, deletedAt = now
```

This is currently a soft delete. The MongoDB document remains, login rejects inactive users, and active profile queries exclude the user. The current cleanup service removes messages, not deleted users or their Supabase media.

### Browse and view profiles

```text
BrowseProfiles.js
  -> React Query / profile API wrapper
  -> GET /api/profiles/discover
  -> profileController.discoverProfiles()
  -> User.find() with active/gender/age filters
```

Opening a profile follows:

```text
profiles/[id]/page.js / ProfileDetailView.js
  -> GET /api/profiles/:id
  -> profileController.getProfile()
  -> membership and viewedProfiles checks
  -> User.findById()
```

The first view normally consumes one membership credit unless `PROMOTIONAL_MODE=true`. Like/unlike calls use `/api/profiles/:id/like` and `/api/profiles/:id/unlike`.

### Chat

REST path:

```text
ChatLayout.jsx / ChatConversation.jsx
  -> chatStore.js
  -> src/lib/api/client.js
  -> /api/chat/*
  -> chat.routes.js
  -> chat.controller.js
  -> Conversation, Message, and User models
```

Live path:

```text
SocketContext.jsx
  -> src/lib/socket.js
  -> backend src/sockets/chat.socket.js
  -> chat events and chatStore updates
```

Chat messages are stored in `Message.js`, conversations in `Conversation.js`, and public encryption keys in `UserKeys.js`.

### Membership and payment

```text
membership/purchase/page.js
  -> membership API calls
  -> membership.routes.js
  -> membership.controller.js
  -> MembershipPlan, Transaction, and User models
  -> Razorpay order

Razorpay webhook
  -> POST /api/membership/webhook
  -> webhook.routes.js
  -> webhook.controller.js
  -> signature verification and membership/transaction update
```

The payment page `[orderId]/page.js` loads the pending order and opens checkout. The success page displays the result; the backend webhook is the authoritative payment confirmation path.

### Admin user and content management

```text
admin pages
  -> src/lib/api/admin.js
  -> src/lib/api/adminClient.js
  -> /api/admin/*
  -> admin.routes.js
  -> verifyAdminToken
  -> admin.controller.js
  -> User, Admin, MembershipPlan, Transaction, Settings, HeroContent, HowItWorksContent
```

Admin media uploads reuse `s3.service.js` and write to the selected user's media fields.

## 8. Backend Application

The backend is in `sngs_matrimonial_backend-main/`.

### Startup and global middleware

| File | Purpose |
|---|---|
| `server.js` | Loads environment, connects MongoDB, creates HTTP server, starts Socket.IO and cleanup job, listens on port 4000 |
| `src/app.js` | Express app, CORS, compression, body parsing, health route, route mounting, 404 handler, global errors |
| `src/config/database.js` | `connectDB()` using `MONGODB_URI` |
| `src/middleware/validation.middleware.js` | Express-validator result handling, age validation, Mongoose/global error formatting |
| `src/middleware/auth.middleware.js` | `verifyToken`, optional token verification, and admin-role helper |
| `src/middleware/adminAuth.middleware.js` | `verifyAdminToken` for admin JWTs and the `admins` collection |
| `src/middleware/verifyAnyToken.middleware.js` | Accepts the appropriate user/admin token for shared protected operations such as horoscope access |

All API routes are mounted in `src/app.js`:

```text
/api/auth
/api/admin-auth
/api/membership
/api/settings
/api/profiles
/api/chat
/api/admin
```

### Backend routes and controllers

| Route file | Controller | Responsibility |
|---|---|---|
| `src/routes/auth.routes.js` | `auth.controller.js` | User registration, login, OTP, password, profile media, account state |
| `src/routes/adminAuth.routes.js` | `adminAuth.controller.js` | Admin login, OTP, password, current admin |
| `src/routes/profile.routes.js` | `profile.controller.js` | Discovery, profile detail, likes, profile update, horoscope access |
| `src/routes/chat.routes.js` | `chat.controller.js` | Conversations, messages, read state, keys |
| `src/routes/membership.routes.js` | `membership.controller.js` | Plans, orders, payment verification, transactions, refunds, webhook |
| `src/routes/settings.routes.js` | `settings.controller.js` and selected admin content handlers | Public contact, hero, and How It Works content |
| `src/routes/admin.routes.js` | `admin.controller.js` | Admin users, analytics, content, plans, transactions, media |

### Backend controllers

#### `src/controllers/auth.controller.js`

Contains `register`, `login`, `getCurrentUser`, `changePassword`, registration/password-reset OTP functions, profile media upload/delete functions, `deactivateAccount`, and `deleteAccount`.

User login and protected routes use JWTs containing user ID and email. The middleware loads the MongoDB user and rejects inactive accounts.

#### `src/controllers/profile.controller.js`

Contains `discoverProfiles`, `getLikedProfiles`, `likeProfile`, `unlikeProfile`, `getProfile`, `getMyProfile`, `updateProfile`, and `downloadHoroscope`.

This controller owns profile visibility, age/gender matching, membership credit deduction, viewed-profile tracking, approval resubmission, and protected horoscope delivery.

#### `src/controllers/admin.controller.js`

Contains user search/detail/update/status/approval operations, dashboard analytics, admin management, content management, membership-plan and transaction operations, and admin media operations.

#### `src/controllers/chat.controller.js`

Contains conversation creation, message retrieval/sending, read state, key registration/public-key retrieval, and conversation deletion.

#### `src/controllers/membership.controller.js` and `webhook.controller.js`

The membership controller handles user-facing payment operations. The webhook controller validates Razorpay signatures and processes asynchronous payment events.

## 9. Backend Models and Data Relationships

| Model | Main data |
|---|---|
| `src/models/User.js` | Credentials, profile fields, approval, likes, membership, viewed profiles, media, account state |
| `src/models/Admin.js` | Separate admin credentials, role, and reset fields |
| `src/models/MembershipPlan.js` | Plan name, price, currency, credits, validity, active/default state |
| `src/models/Transaction.js` | User/plan references, Razorpay order/payment/refund state |
| `src/models/Conversation.js` | Two participants, last message, unread counts, conversation state |
| `src/models/Message.js` | Conversation/sender references, encrypted content, delivery/read timestamps, retention index |
| `src/models/UserKeys.js` | Public identity/signing/pre-key material and device information |
| `src/models/Settings.js` | Contact information singleton |
| `src/models/HeroContent.js` | Landing hero singleton |
| `src/models/HowItWorksContent.js` | Landing How It Works singleton with three steps |

`User.js` also contains password hashing and authentication methods. Media fields are object-shaped:

```text
profilePicture.url
gallery.photos[].url
horoscopeDocument.url
```

## 10. Backend Services

| File | Purpose |
|---|---|
| `src/services/s3.service.js` | Storage abstraction. Uses Supabase when configured, otherwise AWS S3. Handles multer upload middleware, public URL construction, key extraction, delete, and download. |
| `src/services/otp.service.js` | OTP creation, hashing, verification, expiry, and provider dispatch |
| `src/services/registrationOtp.service.js` | In-memory registration OTP and verification-token lifecycle |
| `src/services/email.service.js` | Resend email delivery for OTP, welcome, approval, and rejection messages |
| `src/services/otp/2factor.provider.js` | Legacy 2Factor SMS provider |
| `src/services/otp/console.provider.js` | Console provider implementation; no normal runtime import was found |
| `src/services/encryption.service.js` | Backend encryption helpers; inspect before treating the chat system as full E2EE |
| `src/services/cleanup.service.js` | Daily message cleanup and manual cleanup/statistics helpers |

### Storage migration behavior

`s3.service.js` checks:

```text
SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY present -> Supabase Storage
otherwise                                      -> AWS S3
```

The backend uses `ws` as the Supabase Realtime transport for Node.js 20 compatibility. The service-role key must remain backend-only.

## 11. Chat and Encryption

| File | Purpose |
|---|---|
| `src/sockets/chat.socket.js` | Authenticated Socket.IO connections, online users, typing, delivery, read receipts, and live messages |
| `src/components/chat/*` | Chat display, list, conversation, input, bubbles, typing, online state, and chat buttons |
| `src/store/chatStore.js` | REST chat state and socket event state |
| `src/lib/encryption.js` | Browser cryptography utilities |
| `src/services/encryption.service.js` | Backend cryptography utilities |
| `src/models/UserKeys.js` | Stored key records |

The repository contains encryption-related code, but the actual runtime path should be reviewed before claiming complete end-to-end encryption. In particular, REST and socket message paths must agree on whether `content` is already encrypted, and private keys should not be stored server-side.

## 12. Maintenance and Migration Scripts

Backend scripts under `src/scripts/`:

| File | Purpose |
|---|---|
| `createAdminAccount.js` | Create an admin account |
| `seedMembershipPlan.js` | Seed a membership plan |
| `addRoleField.js` | Add/repair user role data |
| `deduplicateConversations.js` | Remove duplicate conversations |
| `cleanupInvalidConversations.js` | Remove invalid conversation records |

Backend scripts under `scripts/`:

| File | Purpose |
|---|---|
| `migrate-database.js` | Copy collections in dependency order |
| `migrate-field-names.js` | Rename/consolidate legacy user fields |

Run maintenance scripts deliberately against the intended database. Most are one-off operations and are not exposed as application routes.

## 13. Important Current Behaviors and Caveats

1. Account deletion is currently a soft delete. It sets `isActive=false` and `deletedAt`; the message cleanup job does not remove users after 30 days.
2. Media upload and account deletion use `validateModifiedOnly` to support legacy users with incomplete required profile fields.
3. Migrated media currently uses Supabase public URL format. Use a private bucket and signed URLs if media access must be restricted.
4. The frontend Axios client clears local storage on `401`, but the in-memory Zustand auth state should also be cleared through one centralized logout path.
5. Registration creates the user before all media uploads finish. Required-media failure handling should be reviewed before production.
6. The root environment files contain sensitive configuration in the local setup. Rotate any credential that has been committed or shared.
7. The backend has no automated authentication integration test suite. Staging verification should cover registration, OTP, login, token expiry, profile update, all media uploads, password reset, logout, deletion, membership, and admin access.
8. `MediaUpload.js` presents video-related UI while backend filters currently accept only JPEG/PNG images and PDF/JPEG/PNG documents.
9. `next.config.mjs` should include the active Supabase hostname if any component uses direct `next/image` loading instead of the proxy.

## 14. Recommended Reading Order for New Developers

1. Read this file and the root `README.md`.
2. Read `sngs_matrimonial_backend-main/server.js` and `src/app.js` to understand startup and route mounting.
3. Read `sngs_matrimonial_frontend-main/src/lib/api/client.js` and `src/store/authStore.js` to understand authenticated requests.
4. Follow one workflow end to end, preferably login or profile media upload.
5. Read the corresponding route, controller, model, and service files.
6. For UI changes, start at the route page and follow imports into components, stores, hooks, and API wrappers.
7. For data changes, start at the controller and follow the Mongoose model and service calls.

## 15. Quick File-Finding Guide

| Question | Start here |
|---|---|
| Where does login happen? | `frontend/src/store/authStore.js`, then `backend/src/controllers/auth.controller.js` |
| Why was a request rejected? | `backend/src/middleware/auth.middleware.js`, route validators, and `validation.middleware.js` |
| Where is a profile saved? | `backend/src/controllers/profile.controller.js` and `models/User.js` |
| Where are images uploaded? | `frontend/src/components/profile/EditProfileForm.js`, `authStore.js`, and `backend/src/services/s3.service.js` |
| Why is a profile image not visible? | Frontend proxy routes, `getProxiedImageUrl`, `next.config.mjs`, and Supabase URL/bucket permissions |
| Where are membership credits changed? | `membership.controller.js`, `webhook.controller.js`, and `User.membership` |
| Where is chat persisted? | `chat.controller.js`, `Conversation.js`, and `Message.js` |
| Where is live chat handled? | `SocketContext.jsx`, `lib/socket.js`, and `chat.socket.js` |
| Where is admin authorization checked? | `adminAuth.middleware.js` and `adminAuthStore.js` |
| Where did the AWS migration happen? | Root `find_aws_urls.js`, `migrate_all_users_to_supabase.js`, and `s3.service.js` |
