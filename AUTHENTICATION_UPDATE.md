# Authentication System Update

## Overview

The authenticatio### 2. `context/AuthContext.tsx`
- Added `isNewUser` state and context property
- Updated method signatures to return detailed response objects
- Improved error handling with backend-provided error messages
- Updated login flow to handle `user_data` instead of `user`
- Updated logout to handle backend response and clear `isNewUser` state
- Integrated with `getCurrentUser()` for session initializationtem has been updated to integrate with the new FastAPI backend endpoints. The system now supports:

- Backend-driven authentication with JWT tokens
- New user registration detection
- Improved error handling and user feedback
- Multilingual welcome messages

## Updated Endpoints

### 1. Send Verification Code
- **Endpoint**: `POST /api/education/auth/send-code`
- **Payload**: `{ email: string }`
- **Response**: `{ message: string }`

### 2. Login with Code
- **Endpoint**: `POST /api/education/auth/login`
- **Payload**: `{ email: string, code: string }`
- **Response**: 
  ```json
  {
    "access_token": "string",
    "token_type": "string",
    "is_new_user": boolean,
    "message": "string",
    "user_data": {
      "user_id": "string",
      "email": "string",
      "username": "string",
      "profile_picture": "string" | null
    }
  }
  ```

### 3. Get Current User
- **Endpoint**: `GET /api/education/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "user_id": "string",
    "email": "string", 
    "username": "string",
    "profile_picture": "string" | null
  }
  ```

### 4. Logout
- **Endpoint**: `POST /api/education/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: "Logged out" }`

## Updated Files

### 1. `services/authService.ts`
- Updated interfaces to match new backend response structure
- Updated endpoints to use `/api/education/auth/*` paths
- Added `SendCodeResponse` and `LogoutResponse` interfaces
- Updated `User` interface to match exact backend `user_data` structure (`user_id`, `email`, `username`, `profile_picture`)
- Updated `LoginResponse` to include `is_new_user`, `message`, and `user_data`
- Added `getCurrentUser()` method using `/api/education/auth/me`
- Updated `logout()` method using `/api/education/auth/logout`

### 2. `context/AuthContext.tsx`
- Added `isNewUser` state and context property
- Updated method signatures to return detailed response objects
- Improved error handling with backend error messages
- Updated login flow to handle `user_data` instead of `user`

### 3. `app/login/page.tsx`
- Updated to handle new response structure from auth methods
- Added differentiated welcome messages for new vs returning users
- Improved error display with backend-provided messages

### 4. Translation Files
- Added `auth.welcomeNewUser` and `auth.welcomeBackUser` keys
- Available in both English and French

## Key Features

### JWT Token Management
- Automatic token storage after successful login
- Token included in all authenticated API requests via interceptors
- Token cleared on logout or authentication errors

### New User Detection
- Backend returns `is_new_user` flag during login
- Frontend displays appropriate welcome message
- Can be used to trigger onboarding flows

### Error Handling
- Backend error messages displayed to users
- Graceful fallback to generic messages
- Proper error states in UI components

### Multilingual Support
- All authentication messages support i18n
- Welcome messages translated to French and English

## Testing the Authentication Flow

### Prerequisites
1. Ensure `.env.local` contains the correct API URL:
   ```
   NEXT_PUBLIC_API_URL=http://your-backend-url
   ```

2. Ensure your FastAPI backend is running with the new endpoints

### Test Steps

1. **Send Code Test**:
   - Navigate to `/login`
   - Enter a valid email address
   - Click "Send Magic Link"
   - Verify the backend receives the request at `/api/education/auth/send-code`
   - Check for success message in UI

2. **Login Test**:
   - Enter the verification code from email
   - Click "Verify Code & Login"
   - Verify the backend receives the request at `/api/education/auth/login`
   - Check for appropriate welcome message (new user vs returning user)
   - Verify redirect to `/generate` page

3. **Token Management Test**:
   - Verify JWT token is stored in localStorage
   - Make authenticated requests to verify token is included in headers
   - Test logout to verify token is cleared

4. **Error Handling Test**:
   - Test with invalid email addresses
   - Test with incorrect verification codes
   - Verify error messages are displayed correctly

## Integration Notes

### Expected Backend Behavior
- The `/api/education/auth/send-code` endpoint should send an email with a verification code
- The `/api/education/auth/login` endpoint should verify the code and return the complete user data
- JWT tokens should be valid for protected endpoints
- The backend should handle user creation for new email addresses

### Frontend State Management
- User state is managed globally via `AuthContext`
- Credits and other user-related data should update after login
- Language preference persists across sessions

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure backend CORS settings allow frontend domain
2. **Token Issues**: Check token format and expiration handling
3. **Translation Missing**: Verify translation keys exist in both `en.json` and `fr.json`
4. **API URL**: Confirm `NEXT_PUBLIC_API_URL` points to correct backend

### Debug Steps
1. Check browser network tab for API requests
2. Verify backend logs for authentication attempts
3. Check localStorage for stored JWT tokens
4. Verify translation files for missing keys

## Future Enhancements

- Token refresh mechanism
- Remember device functionality
- Social login integration
- Two-factor authentication
- Session management improvements
