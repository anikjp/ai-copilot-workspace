# Clerk Organization Setup Guide - B2B Model

## 🏢 B2B Organization Configuration

This guide will help you configure Clerk organizations for your B2B application where each company has one workspace with multiple team members.

## 📋 Prerequisites

- ✅ Clerk account with organizations enabled
- ✅ Clerk application created
- ✅ Environment variables configured

## 🔧 Clerk Dashboard Configuration

### 1. Enable Organizations

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **"Organizations"** in the sidebar
4. Click **"Enable Organizations"**

### 2. Configure Organization Settings

#### Basic Settings
- **Allow new users to create organizations**: ✅ Enable
- **Limit the number of organizations a user can create**: Set to `1` (B2B model)
- **Maximum number of organizations per user**: `1`

#### Organization Creation
- **Allow organization creation**: ✅ Enable
- **Require organization creation**: ✅ Enable (for B2B)
- **Default role for organization creators**: `admin`

### 3. Configure Role Templates

Create these role templates in Clerk Dashboard:

#### Admin Role
- **Role name**: `admin`
- **Permissions**: All permissions
- **Description**: Company workspace administrator

#### Manager Role  
- **Role name**: `manager`
- **Permissions**: 
  - Read, Write
  - Manage team members
  - Invite users
  - View analytics
  - Manage integrations
- **Description**: Team manager with project oversight

#### Member Role
- **Role name**: `member`
- **Permissions**:
  - Read, Write
  - Use AI agents
  - Create content
  - View analytics
- **Description**: Standard team member access

### 4. Configure Invitations

#### Invitation Settings
- **Allow invitations**: ✅ Enable
- **Require email verification**: ✅ Enable
- **Allow email invitations**: ✅ Enable
- **Default role for invited users**: `member`

#### Email Templates
Customize invitation emails for your B2B branding:
- Use company-specific language
- Include workspace context
- Brand with your company colors

### 5. Verified Domains (Optional)

For enterprise customers, set up verified domains:

1. Go to **"Organizations" → "Verified domains"**
2. Add company domains (e.g., `@yourcompany.com`)
3. Set enrollment mode to `automatic_invitation`
4. Configure role assignments per domain

## 🔑 Environment Configuration

Your `.env.local` file should include:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# B2B Organization Flow
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/organization
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/organization
NEXT_PUBLIC_CLERK_AFTER_CREATE_ORGANIZATION_URL=/stock-agent
NEXT_PUBLIC_CLERK_AFTER_SELECT_ORGANIZATION_URL=/stock-agent
```

## 🧪 Testing Your Setup

### 1. Test Organization Creation

1. Sign up with a new user account
2. Verify redirect to `/organization` page
3. Create a new organization
4. Verify redirect to `/stock-agent` dashboard
5. Check organization appears in sidebar

### 2. Test Team Member Invitation

1. As organization admin, go to Settings → Members
2. Invite a new user via email
3. Check invitation email is sent
4. New user accepts invitation
5. Verify they can access the workspace

### 3. Test Role-Based Access

1. Create users with different roles
2. Verify admin can manage team members
3. Verify managers can invite users
4. Verify members have standard access

### 4. Use Test Page

Visit `/test-organization` to verify:
- Organization membership status
- Role assignments
- B2B configuration compliance

## 🚀 B2B User Flow

### New Company Registration
```
1. Company admin signs up
2. Redirected to organization page
3. Creates company workspace
4. Invites team members
5. Team accesses workspace
```

### Team Member Onboarding
```
1. Admin invites via email
2. User receives invitation
3. Accepts invitation
4. Joins company workspace
5. Accesses dashboard
```

### Existing User Login
```
1. User signs in
2. Organization context loaded
3. Redirected to dashboard
```

## 🔒 Security Features

### Data Isolation
- Each organization's data is completely isolated
- Users can only access their organization's workspace
- API requests include organization context

### Role-Based Permissions
- Admins: Full workspace control
- Managers: Team and project management
- Members: Standard workspace access

### Access Control
- Middleware enforces organization membership
- Automatic redirects for unauthorized access
- JWT tokens include organization context

## 🛠️ Troubleshooting

### Common Issues

#### Users can create multiple organizations
- **Solution**: Set organization limit to 1 in Clerk Dashboard
- **Check**: Organization settings → Limits

#### Organization context not available
- **Solution**: Verify JWT template includes organization claims
- **Check**: JWT templates in Clerk Dashboard

#### Invitations not working
- **Solution**: Enable email invitations in Clerk Dashboard
- **Check**: Email settings and SMTP configuration

#### Middleware redirects not working
- **Solution**: Verify middleware configuration
- **Check**: `middleware.ts` and route protection

### Debug Steps

1. Check browser console for errors
2. Verify environment variables
3. Test with `/test-organization` page
4. Check Clerk Dashboard logs
5. Verify JWT token claims

## 📞 Support

If you encounter issues:
1. Check Clerk documentation: https://clerk.com/docs/organizations
2. Review Clerk Dashboard settings
3. Test with the provided test page
4. Check application logs

## ✅ Checklist

- [ ] Organizations enabled in Clerk Dashboard
- [ ] Organization limits set to 1 per user
- [ ] Role templates configured
- [ ] Invitation system enabled
- [ ] Environment variables updated
- [ ] Test page accessible
- [ ] User flow tested
- [ ] Team invitations working
- [ ] Role-based access verified

Your B2B organization system is now ready! 🎉
