/**
 * ActionsDropdown Component Usage Examples
 * 
 * This file demonstrates how to use the reusable ActionsDropdown component
 * in different scenarios throughout the application.
 */

import React from 'react';
import ActionsDropdown, { 
  createEditAction, 
  createDeleteAction, 
  createToggleStatusAction,
  createActivateAction,
  createDeactivateAction,
  ActionItem 
} from '@/components/ui/ActionsDropdown';

// Example 1: Basic usage with predefined actions
export const BasicUsageExample = () => {
  const handleEdit = () => console.log('Edit clicked');
  const handleDelete = () => console.log('Delete clicked');
  const handleToggle = () => console.log('Toggle clicked');

  return (
    <ActionsDropdown
      actions={[
        createEditAction(handleEdit),
        createToggleStatusAction(true, handleToggle),
        createDeleteAction(handleDelete)
      ]}
    />
  );
};

// Example 2: Custom actions with different variants
export const CustomActionsExample = () => {
  const handleCustomAction = () => console.log('Custom action');

  const customActions: ActionItem[] = [
    {
      id: 'custom-1',
      label: 'Custom Action',
      icon: <span>🎯</span>,
      onClick: handleCustomAction
    },
    {
      id: 'custom-2',
      label: 'Dangerous Action',
      icon: <span>⚠️</span>,
      onClick: () => console.log('Dangerous action'),
      variant: 'destructive'
    }
  ];

  return (
    <ActionsDropdown
      actions={customActions}
      size="default"
      variant="secondary"
    />
  );
};

// Example 3: Conditional actions based on item state
export const ConditionalActionsExample = ({ item }: { item: { id: string; isActive: boolean; canEdit: boolean } }) => {
  const handleEdit = () => console.log(`Edit item ${item.id}`);
  const handleDelete = () => console.log(`Delete item ${item.id}`);
  const handleToggle = () => console.log(`Toggle item ${item.id}`);

  const actions: ActionItem[] = [];

  // Add edit action only if item can be edited
  if (item.canEdit) {
    actions.push(createEditAction(handleEdit));
  }

  // Add toggle status action
  actions.push(createToggleStatusAction(item.isActive, handleToggle));

  // Add delete action
  actions.push(createDeleteAction(handleDelete));

  return (
    <ActionsDropdown
      actions={actions}
      disabled={!item.canEdit}
    />
  );
};

// Example 4: Usage in a table row
export const TableRowExample = ({ user }: { user: { id: string; name: string; isActive: boolean } }) => {
  const handleEditUser = () => console.log(`Edit user: ${user.name}`);
  const handleDeleteUser = () => console.log(`Delete user: ${user.name}`);
  const handleToggleUser = () => console.log(`Toggle user: ${user.name}`);

  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.isActive ? 'Active' : 'Inactive'}</td>
      <td>
        <ActionsDropdown
          actions={[
            createEditAction(handleEditUser),
            createToggleStatusAction(user.isActive, handleToggleUser),
            createDeleteAction(handleDeleteUser)
          ]}
        />
      </td>
    </tr>
  );
};

// Example 5: Different sizes and variants
export const SizeVariantsExample = () => {
  const handleAction = () => console.log('Action clicked');

  return (
    <div className="space-y-4">
      {/* Small size */}
      <ActionsDropdown
        actions={[createEditAction(handleAction)]}
        size="sm"
        variant="outline"
      />
      
      {/* Default size */}
      <ActionsDropdown
        actions={[createEditAction(handleAction)]}
        size="default"
        variant="default"
      />
      
      {/* Large size */}
      <ActionsDropdown
        actions={[createEditAction(handleAction)]}
        size="lg"
        variant="secondary"
      />
    </div>
  );
};

// Example 6: Disabled state
export const DisabledExample = () => {
  const handleAction = () => console.log('Action clicked');

  return (
    <ActionsDropdown
      actions={[
        createEditAction(handleAction),
        createDeleteAction(handleAction)
      ]}
      disabled={true} // All actions will be disabled
    />
  );
};

// Example 7: Individual action disabled
export const IndividualDisabledExample = () => {
  const handleEdit = () => console.log('Edit clicked');
  const handleDelete = () => console.log('Delete clicked');

  return (
    <ActionsDropdown
      actions={[
        createEditAction(handleEdit, false), // Enabled
        createDeleteAction(handleDelete, true) // Disabled
      ]}
    />
  );
};

export default {
  BasicUsageExample,
  CustomActionsExample,
  ConditionalActionsExample,
  TableRowExample,
  SizeVariantsExample,
  DisabledExample,
  IndividualDisabledExample
};
