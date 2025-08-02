Following your instructions to place all new components within the `src/components/pro/` directory and use TSX for a React implementation, here are the updated frontend implementation instructions.

# Frontend Implementation Instructions

This document provides comprehensive instructions for implementing a React frontend that integrates with the GlycoShape User Management System (UMS) backend. All new components and related files should be located within the `src/components/pro/` directory.

## 🏗️ Architecture Overview

The frontend should be a single-page React application built with TypeScript that communicates with the UMS backend for authentication, subscription management, and user administration.

### Backend Integration Points
- **UMS API Base URL**: `http://localhost:5000` (development) / `https://glycoshape.org/api/ums` (production)
- **Authentication**: JWT-based with access tokens (15 minutes) and refresh tokens (7 days)
- **Data Format**: JSON for all API communications

## 📋 Required Components and Pages

### 1. Authentication Components

#### Login Component (`src/components/pro/auth/Login.tsx`)
```tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(formData.email, formData.password);
      // Redirect handled by AuthContext
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Form implementation with email and password fields
  // Include "Forgot Password" link
  // Show loading state and error messages
};
```

**API Endpoint**: `POST /api/auth/login`
**Request**: `{ email: string, password: string }`
**Response**: `{ access_token: string, refresh_token: string, user: UserObject }`

#### Registration Component (`src/components/pro/auth/Register.tsx`)
```tsx
const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    institution: ''
  });

  // Form validation:
  // - Email format validation
  // - Password strength (8+ chars, uppercase, lowercase, number)
  // - Password confirmation match
  // - Required fields validation
  
  // Auto-detect user type based on email domain (.edu = academic)
};
```

**API Endpoint**: `POST /api/auth/register`
**Request**:
```json
{
  "email": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string",
  "institution": "string" // optional
}
```

#### Password Reset Components
- **ForgotPassword.tsx**: (`src/components/pro/auth/ForgotPassword.tsx`) Email input form
- **ResetPassword.tsx**: (`src/components/pro/auth/ResetPassword.tsx`) New password form (from email link)

**API Endpoints**:
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Submit new password

#### Email Verification Component
**VerifyEmail.tsx**: (`src/components/pro/auth/VerifyEmail.tsx`) Handle email verification from link
**API Endpoint**: `POST /api/auth/verify-email`

### 2. Authentication Context (`src/components/pro/contexts/AuthContext.tsx`)

```tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: true,
    isAuthenticated: false
  });

  // Functions to implement:
  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
    } else {
      throw new Error('Login failed');
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${state.accessToken}` }
    });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  const refreshAccessToken = async () => {
    // Implement token refresh logic
    // POST /api/auth/refresh-token
  };

  // Auto-refresh token before expiry
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.accessToken) {
        refreshAccessToken();
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes
    
    return () => clearInterval(interval);
  }, [state.accessToken]);
};
```

### 3. Dashboard Components

#### Main Dashboard (`src/components/pro/pages/Dashboard.tsx`)
- Welcome message with user name
- Subscription status overview
- Quick stats (API usage, active licenses, etc.)
- Navigation to different sections

#### User Profile (`src/components/pro/user/Profile.tsx`)
```tsx
const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  
  // Load user profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const response = await authenticatedFetch('/api/user/profile');
    setProfile(await response.json());
  };

  const updateProfile = async (updatedData) => {
    await authenticatedFetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updatedData)
    });
  };

  // Form fields: first_name, last_name, institution
  // Change password section
  // Account deletion option
};
```

#### Usage Summary (`src/components/pro/user/UsageSummary.tsx`)
- API requests in last 30 days
- Credits consumed
- Active resources (API keys, licenses)
- Charts/graphs for usage visualization

### 4. Subscription Management

#### Subscription Plans (`src/components/pro/subscription/Plans.tsx`)
```tsx
const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    const response = await fetch('/api/subscriptions/plans');
    setPlans(await response.json());
  };

  const subscribe = async (planType) => {
    const response = await authenticatedFetch('/api/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan_type: planType })
    });
    
    const result = await response.json();
    if (result.approval_url) {
      // Redirect to PayPal for payment
      window.location.href = result.approval_url;
    }
  };

  // Display plan cards with features and pricing
  // Handle free academic plan activation
  // PayPal integration for paid plans
};
```

#### Subscription Status (`src/components/pro/subscription/Status.tsx`)
- Current plan details
- Billing information
- Auto-renewal settings
- Cancel subscription option
- Subscription history

#### Plan Comparison (`src/components/pro/subscription/Comparison.tsx`)
- Feature comparison table
- Academic vs Industry pricing
- Upgrade/downgrade options

### 5. License Management

#### License List (`src/components/pro/license/LicenseList.tsx`)
```tsx
const LicenseList = () => {
  const [licenses, setLicenses] = useState([]);

  const generateLicense = async (licenseData) => {
    const response = await authenticatedFetch('/api/licenses/generate', {
      method: 'POST',
      body: JSON.stringify(licenseData)
    });
    // Refresh license list
  };

  const revokeLicense = async (licenseId) => {
    await authenticatedFetch(`/api/licenses/${licenseId}/revoke`, {
      method: 'POST'
    });
    // Refresh license list
  };

  // Display license cards with:
  // - License key (with copy button)
  // - License type
  // - Expiration date
  // - Activation status
  // - Machine fingerprints
};
```

#### License Generator (`src/components/pro/license/Generator.tsx`)
- License type selection (Academic/Industry On-Site)
- Tool selection checkboxes
- Max activations setting
- Generate button

#### License Activator (`src/components/pro/license/Activator.tsx`)
- License key input
- Machine fingerprint display
- Activation/deactivation buttons
- Status checking

### 6. API Key Management

#### API Key List (`src/components/pro/apikey/KeyList.tsx`)
```tsx
const KeyList = () => {
  const [apiKeys, setApiKeys] = useState([]);

  const generateKey = async (keyData) => {
    const response = await authenticatedFetch('/api/api-keys/generate', {
      method: 'POST',
      body: JSON.stringify(keyData)
    });
    
    const result = await response.json();
    // Show the actual API key only once
    alert(`Your API Key: ${result.api_key_data.api_key}\nSave this key, it won't be shown again!`);
  };

  const addCredits = async (keyId, credits) => {
    await authenticatedFetch('/api/api-keys/add-credits', {
      method: 'POST',
      body: JSON.stringify({ key_id: keyId, credits })
    });
  };

  // Display API key cards with:
  // - Key name and status
  // - Pricing tier
  // - Credits remaining
  // - Rate limits
  // - Usage statistics
  // - Revoke option
};
```

#### API Key Generator (`src/components/pro/apikey/Generator.tsx`)
- Key name input
- Pricing tier selection
- Rate limit settings
- Endpoint restrictions
- Initial credits for pay-per-use

#### Usage Analytics (`src/components/pro/apikey/Analytics.tsx`)
- Usage charts by time period
- Endpoint usage breakdown
- Credit consumption tracking
- Rate limit hit tracking

### 7. Utility Components

#### Protected Route (`src/components/pro/common/ProtectedRoute.tsx`)
```tsx
const ProtectedRoute = ({ children, requiredSubscription = null }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredSubscription && !hasSubscription(user, requiredSubscription)) {
    return <Navigate to="/upgrade" />;
  }

  return children;
};
```

#### Authenticated Fetch Hook (`src/components/pro/hooks/useAuthenticatedFetch.ts`)
```ts
import { useAuth } from '../contexts/AuthContext';

export const useAuthenticatedFetch = () => {
  const { accessToken, refreshAccessToken } = useAuth();

  const authenticatedFetch = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Try to refresh token
      await refreshAccessToken();
      // Retry request
    }

    return response;
  };

  return authenticatedFetch;
};
```

#### Loading Spinner (`src/components/pro/common/LoadingSpinner.tsx`)
#### Error Boundary (`src/components/pro/common/ErrorBoundary.tsx`)
#### Toast Notifications (`src/components/pro/common/Toast.tsx`)

## 🛣️ Routing Structure

```tsx
// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/pro/contexts/AuthContext';
import Login from './components/pro/auth/Login';
import Register from './components/pro/auth/Register';
import ForgotPassword from './components/pro/auth/ForgotPassword';
import ResetPassword from './components/pro/auth/ResetPassword';
import VerifyEmail from './components/pro/auth/VerifyEmail';
import ProtectedRoute from './components/pro/common/ProtectedRoute';
import Dashboard from './components/pro/pages/Dashboard';
import Profile from './components/pro/user/Profile';
import Plans from './components/pro/subscription/Plans';
import LicenseList from './components/pro/license/LicenseList';
import KeyList from './components/pro/apikey/KeyList';
import AdvancedAnalytics from './components/pro/pages/AdvancedAnalytics';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/subscriptions" element={
            <ProtectedRoute>
              <Plans />
            </ProtectedRoute>
          } />

          <Route path="/licenses" element={
            <ProtectedRoute>
              <LicenseList />
            </ProtectedRoute>
          } />

          <Route path="/api-keys" element={
            <ProtectedRoute>
              <KeyList />
            </ProtectedRoute>
          } />

          {/* Pro feature routes */}
          <Route path="/advanced-analytics" element={
            <ProtectedRoute requiredSubscription="pro_academic">
              <AdvancedAnalytics />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

## 🎨 UI/UX Guidelines

### Design System
- Use a modern component library (Material-UI, Chakra UI, or Ant Design).
- Implement dark/light theme toggle.
- Responsive design for mobile and desktop.
- Consistent color scheme reflecting GlycoShape branding.

### User Experience
- Show loading states for all async operations.
- Implement proper error handling with user-friendly messages.
- Use confirmation dialogs for destructive actions.
- Provide helpful tooltips and documentation links.

### Accessibility
- ARIA labels for screen readers.
- Keyboard navigation support.
- High contrast mode support.
- Focus management for modals and forms.

## 📊 State Management

### Options
1.  **Context API** (recommended for small-medium apps)
2.  **Redux Toolkit** (for complex state management)
3.  **Zustand** (lightweight alternative)

### State Structure
```ts
{
  auth: {
    user: UserObject,
    tokens: { access: string, refresh: string },
    isAuthenticated: boolean,
    loading: boolean
  },
  subscriptions: {
    current: SubscriptionObject,
    plans: PlanObject[],
    history: SubscriptionObject[]
  },
  licenses: LicenseObject[],
  apiKeys: APIKeyObject[],
  usage: {
    summary: UsageSummaryObject,
    logs: UsageLogObject[]
  }
}
```

## 🔧 Environment Configuration

### Environment Variables (`.env`)
```bash
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_PAYPAL_CLIENT_ID=your-paypal-client-id
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
```

### API Configuration (`src/components/pro/config/api.ts`)
```ts
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh-token',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      VERIFY_EMAIL: '/api/auth/verify-email'
    },
    USER: {
      PROFILE: '/api/user/profile',
      USAGE: '/api/user/usage-summary',
      CHANGE_PASSWORD: '/api/user/change-password'
    },
    SUBSCRIPTIONS: {
      PLANS: '/api/subscriptions/plans',
      CURRENT: '/api/subscriptions/current',
      SUBSCRIBE: '/api/subscriptions/subscribe',
      CANCEL: '/api/subscriptions/cancel',
      HISTORY: '/api/subscriptions/history'
    },
    LICENSES: {
      LIST: '/api/licenses/my-licenses',
      GENERATE: '/api/licenses/generate',
      ACTIVATE: '/api/licenses/activate',
      DEACTIVATE: '/api/licenses/deactivate',
      STATUS: '/api/licenses/status'
    },
    API_KEYS: {
      LIST: '/api/api-keys/list',
      GENERATE: '/api/api-keys/generate',
      UPDATE: '/api/api-keys',
      REVOKE: '/api/api-keys',
      ADD_CREDITS: '/api/api-keys/add-credits',
      USAGE: '/api/api-keys'
    }
  }
};
```

## 🧪 Testing Strategy

### Unit Tests
- Component rendering tests.
- Hook functionality tests.
- Utility function tests.

### Integration Tests
- API integration tests.
- Authentication flow tests.
- User journey tests.

### E2E Tests
- Complete user workflows.
- Payment integration testing.
- Cross-browser compatibility.

## 📦 Dependencies

### Core Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "axios": "^1.3.0",
  "@types/react": "^18.0.28",
  "@types/react-dom": "^18.0.11",
  "typescript": "^4.9.5"
}
```

### UI Libraries (choose one)
```json
{
  "@mui/material": "^5.11.0",
  "@chakra-ui/react": "^2.5.0",
  "antd": "^5.2.0"
}
```

### Utility Libraries
```json
{
  "react-hook-form": "^7.43.0",
  "yup": "^1.0.0",
  "react-query": "^3.39.0",
  "date-fns": "^2.29.0",
  "recharts": "^2.5.0"
}
```

## 🚀 Deployment

### Build Process
```bash
npm run build
# Generates optimized production build in /build folder
```

### Environment-Specific Builds
-   **Development**: Local API integration
-   **Staging**: Staging API with test PayPal
-   **Production**: Production API with live PayPal

### Hosting Options
-   **Netlify**: Easy deployment with environment variables.
-   **Vercel**: Great for React apps with serverless functions.
-   **AWS S3 + CloudFront**: Full control and CDN.
-   **GitHub Pages**: Free hosting for open source.

## 🔒 Security Considerations

### Token Management
- Store tokens securely (httpOnly cookies preferred over localStorage).
- Implement token refresh logic.
- Clear tokens on logout.

### API Security
- Validate all user inputs.
- Sanitize data before rendering.
- Implement CSP headers.
- Use HTTPS in production.

### Error Handling
- Don't expose sensitive information in error messages.
- Log security events for monitoring.
- Implement rate limiting on the client side.

## 📚 Additional Features

### Advanced Features (Phase 2)
- Real-time notifications (WebSocket)
- Usage analytics dashboard with charts
- Team management for institutional accounts
- Bulk license management
- API usage monitoring and alerts
- Integration with external identity providers (SSO)

### Progressive Web App Features
- Offline functionality
- Push notifications
- App-like experience on mobile

This comprehensive guide provides everything needed to build a production-ready frontend that integrates seamlessly with the GlycoShape User Management System backend, with all new development organized within the `src/components/pro/` directory.