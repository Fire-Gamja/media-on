# Supabase authentication setup

## 1. Create and initialize the project

1. Create a Supabase project.
2. Open **SQL Editor** in the dashboard.
3. Run `supabase/migrations/202607200001_create_profiles.sql`.
4. In **Authentication > Providers > Email**, turn off email confirmation.

The app converts a student number to an internal authentication email. Students
still enter only their student number and password in the app.

## 2. Add the Expo environment variables

Copy `.env.example` to `.env.local`, then enter the Project URL and publishable
key from the Supabase **Connect** dialog.

Never put a `service_role` or secret key in an `EXPO_PUBLIC_` variable. Values
with that prefix are included in the application bundle.

## 3. Create the first administrator

Register the administrator through the app once, then run this in SQL Editor:

```sql
update public.profiles
set
  role = 'admin',
  approval_status = 'approved',
  reviewed_at = now()
where student_number = 'ADMIN_STUDENT_NUMBER';
```

Replace `ADMIN_STUDENT_NUMBER` with the actual student number. Later accounts
can be reviewed through `public.review_student_account` after the administrator
screen is connected.

## 4. Test

Restart Expo with a cleared cache, register a test account, approve it in SQL
Editor, and then log in with the student number and password.
