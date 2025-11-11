# ActionsDropdown Component

A reusable dropdown menu component for common table actions like Edit, Delete, Activate/Deactivate, etc.

## Features

- ✅ **Reusable**: Use anywhere in the application
- ✅ **Flexible**: Support for custom actions and predefined action creators
- ✅ **Accessible**: Proper keyboard navigation and screen reader support
- ✅ **Customizable**: Different sizes, variants, and styling options
- ✅ **Type Safe**: Full TypeScript support with proper interfaces
- ✅ **Loading States**: Built-in support for disabled states during processing

## Basic Usage

```tsx
import ActionsDropdown, { 
  createEditAction, 
  createDeleteAction, 
  createToggleStatusAction 
} from '@/components/ui/ActionsDropdown';

// In your component
<ActionsDropdown
  actions={[
    createEditAction(() => handleEdit(item.id)),
    createToggleStatusAction(item.isActive, () => handleToggle(item.id)),
    createDeleteAction(() => handleDelete(item.id))
  ]}
/>
```

## Predefined Action Creators

### `createEditAction(onEdit, disabled?)`
Creates an Edit action with a pencil icon.

### `createDeleteAction(onDelete, disabled?)`
Creates a Delete action with a trash icon and destructive styling.

### `createToggleStatusAction(isActive, onToggle, disabled?)`
Creates a dynamic Activate/Deactivate action based on current status.

### `createActivateAction(onActivate, disabled?)`
Creates an Activate action with a check circle icon.

### `createDeactivateAction(onDeactivate, disabled?)`
Creates a Deactivate action with an X circle icon.

## Custom Actions

```tsx
const customActions: ActionItem[] = [
  {
    id: 'custom-1',
    label: 'Custom Action',
    icon: <CustomIcon className="h-4 w-4" />,
    onClick: () => console.log('Custom action'),
    variant: 'default' // or 'destructive'
  }
];

<ActionsDropdown actions={customActions} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `ActionItem[]` | - | Array of action items to display |
| `disabled` | `boolean` | `false` | Disable the entire dropdown |
| `size` | `'sm' \| 'default' \| 'lg'` | `'sm'` | Size of the trigger button |
| `variant` | `'outline' \| 'default' \| 'destructive' \| 'secondary' \| 'ghost' \| 'link'` | `'outline'` | Button variant |
| `className` | `string` | `''` | Additional CSS classes |

## ActionItem Interface

```tsx
interface ActionItem {
  id: string;                    // Unique identifier
  label: string;                 // Display text
  icon: React.ReactNode;         // Icon component
  onClick: () => void;          // Click handler
  variant?: 'default' | 'destructive'; // Styling variant
  disabled?: boolean;            // Disable this specific action
}
```

## Real-World Examples

### Table Row Actions
```tsx
// In a table component
<TableCell>
  <ActionsDropdown
    actions={[
      createEditAction(() => handleEditUser(user.id)),
      createToggleStatusAction(user.isActive, () => handleToggleUser(user.id)),
      createDeleteAction(() => handleDeleteUser(user.id))
    ]}
    disabled={processingUsers.has(user.id)}
  />
</TableCell>
```

### Conditional Actions
```tsx
const actions = [];

// Only show edit if user has permission
if (canEdit) {
  actions.push(createEditAction(handleEdit));
}

// Always show delete
actions.push(createDeleteAction(handleDelete));

<ActionsDropdown actions={actions} />
```

### Different Sizes and Variants
```tsx
// Small outline button (default)
<ActionsDropdown actions={actions} size="sm" variant="outline" />

// Large secondary button
<ActionsDropdown actions={actions} size="lg" variant="secondary" />
```

## Migration from Custom Dropdowns

### Before (Custom Implementation)
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete}>
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### After (Using ActionsDropdown)
```tsx
<ActionsDropdown
  actions={[
    createEditAction(handleEdit),
    createDeleteAction(handleDelete)
  ]}
/>
```

## Benefits

1. **Consistency**: All action dropdowns look and behave the same
2. **Maintainability**: Changes to action styling/behavior happen in one place
3. **Reusability**: Use the same component across different tables/pages
4. **Type Safety**: TypeScript ensures proper usage
5. **Accessibility**: Built-in keyboard navigation and screen reader support
6. **Performance**: Optimized rendering and event handling

## File Locations

- **Component**: `src/components/ui/ActionsDropdown.tsx`
- **Examples**: `src/components/ui/ActionsDropdown.examples.tsx`
- **Usage**: Used in `src/components/leave/HolidaysTable.tsx`
