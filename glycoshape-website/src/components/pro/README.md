# GlycoShape User Management System (UMS)

A comprehensive React-based frontend for managing user authentication, subscriptions, licenses, and API keys in the GlycoShape ecosystem.

## 🚀 Features

- **User Authentication**: Complete JWT-based auth system with registration, login, password reset
- **Subscription Management**: Academic and industry plans with PayPal integration
- **License Management**: Software license generation and activation tracking
- **API Key Management**: Generate and manage API keys with usage analytics
- **Profile Management**: User profile updates and account settings
- **Responsive Design**: Built with Chakra UI for modern, accessible interfaces

## 📁 Project Structure

```
src/components/pro/
├── auth/                     # Authentication components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── ForgotPassword.tsx
│   ├── ResetPassword.tsx
│   └── VerifyEmail.tsx
├── contexts/                 # React contexts
│   └── AuthContext.tsx      # Authentication state management
├── hooks/                    # Custom hooks
│   └── useAuthenticatedFetch.ts
├── types/                    # TypeScript type definitions
│   └── index.ts
├── config/                   # Configuration files
│   └── api.ts               # API endpoints and configuration
├── common/                   # Shared components
│   ├── ProtectedRoute.tsx
│   ├── LoadingSpinner.tsx
│   └── ErrorBoundary.tsx
├── layout/                   # Layout components
│   ├── Layout.tsx
│   └── Navigation.tsx
├── pages/                    # Main pages
│   └── Dashboard.tsx
├── user/                     # User management
│   └── Profile.tsx
├── subscription/             # Subscription management
│   └── Plans.tsx
├── license/                  # License management
│   ├── LicenseList.tsx
│   └── Generator.tsx
├── apikey/                   # API key management
│   ├── KeyList.tsx
│   └── Generator.tsx
└── UMSApp.tsx               # Main UMS application
```

## 🛠️ Setup and Installation

### Prerequisites

- Node.js 16+ and npm
- React 18+
- TypeScript 4.9+

### Dependencies

The following dependencies are required and should be installed:

```bash
npm install react-hook-form @hookform/resolvers yup date-fns recharts
```

Core dependencies (already included in the project):
- `@chakra-ui/react` - UI component library
- `react-router-dom` - Routing
- `axios` - HTTP client (optional, using fetch)

### Environment Configuration

Create a `.env` file in the project root:

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_PAYPAL_CLIENT_ID=your-paypal-client-id
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
```

### Integration with Existing App

The UMS is integrated into the main GlycoShape application through routing. Access it via:

```
/ums/*  - All UMS routes
```

Key routes:
- `/ums/login` - User login
- `/ums/register` - User registration
- `/ums/` - Dashboard (requires authentication)
- `/ums/profile` - User profile
- `/ums/subscriptions` - Subscription plans
- `/ums/licenses` - License management
- `/ums/api-keys` - API key management

## 🔧 Configuration

### API Endpoints

The system expects a backend API with the following endpoints:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Token refresh
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/verify-email` - Email verification

#### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/change-password` - Change password
- `GET /api/user/usage-summary` - Usage statistics

#### Subscription Management
- `GET /api/subscriptions/plans` - Available plans
- `GET /api/subscriptions/current` - Current subscription
- `POST /api/subscriptions/subscribe` - Subscribe to plan
- `POST /api/subscriptions/cancel` - Cancel subscription

#### License Management
- `GET /api/licenses/my-licenses` - User's licenses
- `POST /api/licenses/generate` - Generate license
- `POST /api/licenses/:id/revoke` - Revoke license

#### API Key Management
- `GET /api/api-keys/list` - User's API keys
- `POST /api/api-keys/generate` - Generate API key
- `DELETE /api/api-keys/:id` - Revoke API key
- `POST /api/api-keys/add-credits` - Add credits to key

### Authentication Flow

1. **Token Storage**: JWT tokens are stored in localStorage
2. **Auto-refresh**: Access tokens are automatically refreshed before expiry
3. **Protected Routes**: Routes require authentication and redirect to login
4. **Session Management**: Users are logged out on token expiry or error

## 🎨 UI/UX Guidelines

### Design Principles
- **Consistency**: Uses Chakra UI design system
- **Accessibility**: ARIA labels and keyboard navigation
- **Responsiveness**: Mobile-first responsive design
- **User Feedback**: Loading states, error messages, and success notifications

### Component Guidelines
- All forms use React Hook Form with Yup validation
- Error handling with user-friendly messages
- Loading states for async operations
- Confirmation dialogs for destructive actions

## 🔒 Security Considerations

### Token Management
- Access tokens have 15-minute expiry
- Refresh tokens have 7-day expiry
- Automatic token refresh before expiry
- Tokens cleared on logout

### API Security
- All requests include authorization headers
- Input validation on all forms
- No sensitive data in error messages
- Rate limiting awareness

### Data Protection
- No plaintext password storage
- Secure token storage
- HTTPS enforcement in production
- Input sanitization

## 🧪 Testing

### Unit Tests
Components should be tested for:
- Rendering without errors
- Form validation
- User interactions
- API integration

### Integration Tests
- Authentication flow
- Protected route access
- Form submissions
- Error handling

## 📱 Features by Component

### Authentication System
- **Login**: Email/password with forgot password link
- **Registration**: Auto-detect academic emails, password strength validation
- **Password Reset**: Email-based reset with secure tokens
- **Email Verification**: Account activation via email

### Dashboard
- **Usage Overview**: API requests, licenses, credits
- **Quick Actions**: Direct access to main features
- **Subscription Status**: Current plan and billing info

### Profile Management
- **Personal Info**: Name, institution, contact details
- **Security**: Password changes, account deletion
- **Verification Status**: Email verification badge

### Subscription Management
- **Plan Comparison**: Academic vs industry pricing
- **PayPal Integration**: Secure payment processing
- **Plan Management**: Upgrade, downgrade, cancel

### License Management
- **License Generation**: Academic perpetual, industry on-site
- **Activation Tracking**: Machine fingerprints, usage limits
- **Bulk Operations**: Multiple license management

### API Key Management
- **Key Generation**: Different pricing tiers, endpoint restrictions
- **Usage Analytics**: Request counts, credit tracking
- **Credit Management**: Add credits for pay-per-use keys

## 🚀 Deployment

### Build Process
```bash
npm run build
```

### Environment-Specific Configuration
- **Development**: Local API, test payments
- **Staging**: Staging API, test PayPal
- **Production**: Production API, live PayPal

### Hosting Recommendations
- **Netlify**: Easy deployment with environment variables
- **Vercel**: Great for React apps
- **AWS S3 + CloudFront**: Full control and CDN

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript strict mode
2. Use Chakra UI components consistently
3. Implement proper error handling
4. Add loading states for async operations
5. Write meaningful commit messages

### Code Style
- Use functional components with hooks
- Implement proper TypeScript types
- Follow React best practices
- Use meaningful variable names

## 📚 Additional Resources

### Documentation Links
- [Chakra UI Documentation](https://chakra-ui.com/)
- [React Hook Form](https://react-hook-form.com/)
- [React Router](https://reactrouter.com/)
- [Yup Validation](https://github.com/jquense/yup)

### Support
- Check the FAQ for common issues
- Review the API documentation
- Contact the development team for assistance

## 🔄 Version History

### v1.0.0 (Current)
- Initial UMS implementation
- Complete authentication system
- Subscription management
- License management
- API key management
- Profile management

### Future Enhancements
- Real-time notifications
- Team management for institutions
- Advanced analytics dashboard
- SSO integration
- Mobile app support

---

**Note**: This UMS system is designed to integrate seamlessly with the existing GlycoShape infrastructure while providing a modern, secure, and user-friendly interface for account management.
