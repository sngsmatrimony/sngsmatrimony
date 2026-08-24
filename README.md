# SNGS Matrimony

This project is structured as a single workspace with two apps under one root folder:

- Backend: `sngs_matrimonial_backend-main/`
- Frontend: `sngs_matrimonial_frontend-main/`

This keeps the codebase easier to manage while still preserving the original separation between the API and the UI.

For the complete file-by-file architecture guide and frontend-to-backend workflow map, see [REPO_ARCHITECTURE.md](REPO_ARCHITECTURE.md).

## Project layout

```text
sngs_matrimony/
├── backend_env.txt
├── frontend_env.txt
├── package.json
├── README.md
├── .gitignore
├── sngs_matrimonial_backend-main/
│   ├── package.json
│   ├── server.js
│   └── src/
└── sngs_matrimonial_frontend-main/
    ├── package.json
    ├── src/
    └── public/
```

## How to work here

### 1) Install dependencies for both apps

```bash
npm run install:all
```

This installs the dependencies for the backend and the frontend from the root folder.

### 2) Run the backend only

```bash
npm run backend
```

This starts the Express server and Socket.IO API.

### 3) Run the frontend only

```bash
npm run frontend
```

This starts the Next.js application.

### 4) Run both together

```bash
npm run dev
```

This launches both apps in parallel from the same root folder.

### 5) Build frontend for production

```bash
npm run build:frontend
```

## Environment files

- Use `backend_env.txt` for backend environment variables.
- Use `frontend_env.txt` for frontend environment variables.

If needed, copy them into actual `.env` files inside each app before running locally.

## MongoDB Migration: AWS S3 → Supabase

### Modified Fields in MongoDB `users` Collection

The following fields were updated to migrate from AWS S3 URLs to Supabase URLs:

1. **profilePicture.url** — User's profile photo URL
   - Changed from: `https://sngs-matrimonial-prod.s3.ap-south-1.amazonaws.com/photos/{userId}/{timestamp}-{hash}.{ext}`
   - Changed to: `https://yzutedytkrjtajfrbvql.supabase.co/storage/v1/object/public/media/photos/{userId}/{timestamp}-{hash}.{ext}`

2. **gallery.photos[].url** — User's gallery photo URLs (array of photos)
   - Same pattern transformation as profilePicture
   - Each photo object in the gallery array had its `url` field updated

3. **horoscopeDocument.url** — User's horoscope/birth chart document URL
   - Changed from: `https://sngs-matrimonial-prod.s3.ap-south-1.amazonaws.com/documents/{userId}/{timestamp}-{hash}.{ext}`
   - Changed to: `https://yzutedytkrjtajfrbvql.supabase.co/storage/v1/object/public/media/documents/{userId}/{timestamp}-{hash}.{ext}`

### Migration Statistics

- **Total users in database:** 45
- **Users with media (modified):** 31
- **Users without media (unchanged):** 14
- **AWS URLs remaining after migration:** 0
- **Supabase URLs after migration:** 31

### Unchanged Users (No Media Fields)

These 14 users were not modified because they had no media fields in MongoDB:

AMPILI SREEKUMAR, Abhaya Sivarajan Paniker, Abhilash A, Ashish Prakashan, Bindhu Chandran, Kaushik Sunil, Nikitha Nandkumar, RAGESHKUMAR Pillai, Soumya Santosh, Sujith Surendran Damodharan, Sunny vakkil, Vishnu Venugopal, Vishnupriya Shaji, rohit anish

### Migration Scripts

Migration scripts are located in the root folder:

- `find_aws_urls.js` — Scans MongoDB for AWS-hosted media URLs
- `migrate_all_users_to_supabase.js` — Performs bulk migration from AWS to Supabase URLs
- `migrate_saurabh_to_supabase.js` — Single-user migration (test example)
- `migrate_complete_to_supabase.js` — Migration with complete object mapping validation
- `aws_urls.txt` — Historical inventory of original AWS URLs (reference only)

### Frontend Image Proxy

Images are served through the image proxy endpoint to handle CORS:
- **Endpoint:** `/api/image-proxy?url={encoded-url}`
- **Location:** `sngs_matrimonial_frontend-main/src/app/api/image-proxy/route.js`
- **Purpose:** Allows browsers to load AWS S3 and Supabase URLs without CORS errors

Components using the proxy:
- `ProfileDetailView.js`
- `ProfileCard.js`
- `UserProfileView.js`

## Authentication Wiring and Security Notes

Authentication uses application-managed JWTs, not Supabase Auth:

- `POST /api/auth/register` creates the user after email OTP verification
- `POST /api/auth/login` issues a JWT stored by the frontend auth store
- `verifyToken` validates the JWT and loads the active MongoDB user
- `GET /api/auth/me` refreshes the current user and membership state
- Profile, gallery, and horoscope uploads use the authenticated JWT and Supabase Storage
- Password change, password reset, account deactivation, and account deletion are protected routes

Media-only writes and account deletion use Mongoose `validateModifiedOnly` so legacy users with incomplete profile fields can still update media or delete their account.

Before production deployment:

- Keep `backend_env.txt`, `.env`, and all service-role credentials outside source control
- Rotate any credentials that were previously committed or shared
- Use a private Supabase `media` bucket and signed URLs for horoscope documents and other restricted media
- Add rate limiting for OTP send/verify and password reset endpoints
- Clear both the frontend auth store and persisted storage when a request receives `401 Unauthorized`
- Delete or queue cleanup of a user's Supabase media when the account retention period ends

The backend currently has no automated authentication test suite. Verify registration, login, token expiry, media upload, password reset, logout, deactivation, and account deletion in staging after every auth or storage change.

## Notes

- The backend is configured to run on port 4000.
- The frontend is configured to run on port 3000.
- The frontend calls the API through `NEXT_PUBLIC_API_URL`, which should point to the backend URL.

## Typical daily workflow

1. Open the root folder in VS Code.
2. Run `npm run install:all` once.
3. Start everything with `npm run dev`.
4. Work in the relevant app folder when making backend or frontend changes.
5. Use the root scripts to keep both apps easy to run together.

This setup is a monorepo-style workflow without forcing a full code merge between the backend and frontend applications.
