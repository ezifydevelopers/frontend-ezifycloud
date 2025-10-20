# Real-Time Data Update System

## Overview

This system provides centralized data management with automatic refresh capabilities across the entire application. It ensures that when data is updated in the database, all relevant UI components automatically reflect the changes without requiring manual page refreshes.

## Key Features

- **Centralized Cache Management**: Global cache for different data types with TTL (Time To Live)
- **Automatic Data Refresh**: Components automatically refresh when related data changes
- **Cross-Tab Communication**: Changes in one tab are reflected in other open tabs
- **Smart Caching**: Reduces API calls by caching data with intelligent invalidation
- **Type-Safe Hooks**: Custom hooks for different data types with proper TypeScript support

## Architecture

### 1. DashboardContext (Enhanced)
- **Location**: `src/contexts/DashboardContext.tsx`
- **Purpose**: Central data management with cache and refresh capabilities
- **Features**:
  - Global cache for leave requests, leave balances, team members, employees, and stats
  - Cache TTL of 5 minutes
  - Cross-tab communication via localStorage events
  - Automatic cache invalidation

### 2. useDataRefresh Hook
- **Location**: `src/hooks/useDataRefresh.ts`
- **Purpose**: Provides methods to trigger data refresh after mutations
- **Usage**: Import and use in components that perform data mutations

### 3. useCachedData Hooks
- **Location**: `src/hooks/useCachedData.ts`
- **Purpose**: Provides cached data access with automatic refresh
- **Available Hooks**:
  - `useCachedLeaveBalance(userId)`
  - `useCachedLeaveRequests(params)`
  - `useCachedTeamMembers(params)`
  - `useCachedEmployees(params)`

## Usage Examples

### 1. Using useDataRefresh in Mutation Components

```typescript
import { useDataRefresh } from '@/hooks/useDataRefresh';

const ApprovalsPage = () => {
  const { refreshAfterLeaveAction } = useDataRefresh();

  const handleApprove = async (requestId: string) => {
    try {
      const response = await managerAPI.processApprovalAction({
        requestId,
        action: 'approve',
        comments: 'Approved by manager',
      });

      if (response.success) {
        // This will automatically refresh:
        // - Dashboard data
        // - Leave requests
        // - Stats
        // - Leave balances
        // - Cross-tab communication
        await refreshAfterLeaveAction('approve');
        
        toast({
          title: 'Request Approved',
          description: 'Leave request has been approved successfully',
        });
      }
    } catch (error) {
      // Handle error
    }
  };
};
```

### 2. Using Cached Data Hooks

```typescript
import { useCachedLeaveBalance } from '@/hooks/useCachedData';

const TeamMemberDetailPage = () => {
  const { data: leaveBalance, loading, error, refetch } = useCachedLeaveBalance(memberId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <LeaveBalanceCard leaveBalance={leaveBalance} />
      <Button onClick={refetch}>Refresh</Button>
    </div>
  );
};
```

### 3. Manual Cache Invalidation

```typescript
import { useDataRefresh } from '@/hooks/useDataRefresh';

const SomeComponent = () => {
  const { invalidateSpecificCache, triggerCrossTabRefresh } = useDataRefresh();

  const handleSomeAction = () => {
    // Invalidate specific cache entries
    invalidateSpecificCache('user-123');
    
    // Trigger cross-tab refresh
    triggerCrossTabRefresh('leave');
  };
};
```

## Available Refresh Methods

### useDataRefresh Hook Methods

1. **refreshAfterLeaveAction(action)**
   - Actions: `'create' | 'approve' | 'reject' | 'update'`
   - Refreshes: Dashboard, leave requests, stats, leave balances

2. **refreshAfterEmployeeAction(action)**
   - Actions: `'create' | 'update' | 'delete' | 'status-change'`
   - Refreshes: Dashboard, employees, leave balances

3. **refreshAfterTeamAction(action)**
   - Actions: `'add' | 'remove' | 'update'`
   - Refreshes: Dashboard, team members, leave balances

4. **refreshAfterPolicyAction(action)**
   - Actions: `'create' | 'update' | 'delete'`
   - Refreshes: Dashboard, stats, leave balances, all data

5. **refreshSpecificData(dataType)**
   - DataTypes: `'dashboard' | 'leaveRequests' | 'stats' | 'leaveBalances' | 'teamMembers' | 'employees'`

6. **invalidateSpecificCache(pattern)**
   - Invalidates cache entries matching the pattern

7. **triggerCrossTabRefresh(type)**
   - Types: `'leave' | 'employee' | 'team' | 'all'`
   - Notifies other tabs to refresh

## Cache Management

### Cache Types
- **leaveRequests**: Cached leave request data
- **leaveBalances**: Cached leave balance data
- **teamMembers**: Cached team member data
- **employees**: Cached employee data
- **stats**: Cached statistics data

### Cache TTL
- Default: 5 minutes
- Configurable in `DashboardContext.tsx`

### Cache Invalidation
- Automatic: After mutations via `useDataRefresh`
- Manual: Via `invalidateSpecificCache` or `invalidateCache`
- Cross-tab: Via localStorage events

## Integration Points

### Pages Already Updated
1. **Manager Approvals Page** (`/manager/approvals`)
   - Uses `refreshAfterLeaveAction` for approve/reject
   - Auto-fetches leave balance on individual request view

2. **Admin Leave Requests Page** (`/admin/leave-requests`)
   - Uses `refreshAfterLeaveAction` for approve/reject
   - Fixed leave balance display

3. **Employee Request Leave Page** (`/employee/request-leave`)
   - Uses `refreshAfterLeaveAction` for create
   - Auto-refreshes after submission

4. **Admin Employees Page** (`/admin/employees`)
   - Fixed leave balance display with proper data mapping

### Pages That Need Updates
1. **Employee Dashboard** - Already has some refresh logic, can be enhanced
2. **Manager Team Pages** - Can use cached data hooks
3. **Admin Dashboard** - Can use cached data hooks
4. **Leave History Pages** - Can use cached data hooks

## Best Practices

### 1. Always Use Data Refresh After Mutations
```typescript
// ✅ Good
const handleAction = async () => {
  const response = await api.someAction();
  if (response.success) {
    await refreshAfterLeaveAction('approve');
  }
};

// ❌ Bad - No refresh
const handleAction = async () => {
  const response = await api.someAction();
  // Data won't update in other components
};
```

### 2. Use Cached Data Hooks for Read Operations
```typescript
// ✅ Good - Uses cache and auto-refresh
const { data, loading, error } = useCachedLeaveBalance(userId);

// ❌ Bad - Manual API calls without cache
const [data, setData] = useState(null);
useEffect(() => {
  api.getLeaveBalance(userId).then(setData);
}, []);
```

### 3. Handle Loading and Error States
```typescript
const { data, loading, error, refetch } = useCachedLeaveBalance(userId);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} onRetry={refetch} />;
return <DataComponent data={data} />;
```

## Troubleshooting

### Data Not Updating
1. Check if `useDataRefresh` is being called after mutations
2. Verify cache invalidation is working
3. Check browser console for cache logs
4. Ensure cross-tab communication is working

### Performance Issues
1. Check cache TTL settings
2. Monitor cache size and invalidation patterns
3. Use specific cache invalidation instead of clearing all

### Cross-Tab Issues
1. Ensure localStorage events are working
2. Check if tabs are in same origin
3. Verify refresh triggers are being sent

## Future Enhancements

1. **WebSocket Integration**: Real-time updates via WebSocket
2. **Optimistic Updates**: Update UI before API confirmation
3. **Background Sync**: Sync data when tab becomes active
4. **Cache Persistence**: Persist cache across browser sessions
5. **Advanced Caching**: Redis-like cache with more sophisticated invalidation

## Migration Guide

### For Existing Components

1. **Replace manual API calls** with cached data hooks
2. **Add data refresh calls** after mutations
3. **Remove manual refresh buttons** (data refreshes automatically)
4. **Update error handling** to use hook error states

### Example Migration

```typescript
// Before
const [leaveBalance, setLeaveBalance] = useState(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    const response = await api.getLeaveBalance(userId);
    setLeaveBalance(response.data);
    setLoading(false);
  };
  fetchData();
}, [userId]);

// After
const { data: leaveBalance, loading, error, refetch } = useCachedLeaveBalance(userId);
```

This system ensures that your application always shows the most up-to-date data without requiring manual refreshes, providing a seamless user experience.
