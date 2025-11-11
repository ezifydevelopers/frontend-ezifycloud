// Automation Templates - Pre-built automation configurations
import { TriggerConfig, ActionConfig } from '@/components/board/AutomationBuilder';

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  conditions?: {
    type: 'and' | 'or';
    conditions: Array<{
      field?: string;
      operator?: string;
      value?: unknown;
    }>;
  };
  requiredColumns?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  notes?: string[];
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'pre-approval',
    name: 'Pre-approval Automation',
    description: 'Automatically requires pre-approval for high-value items and notifies approvers',
    category: 'Approval',
    icon: '💰',
    trigger: {
      type: 'field_greater_than',
      config: {
        operator: 'greater_than',
        value: 10000,
      },
    },
    actions: [
      {
        type: 'set_status',
        config: {
          status: 'Pre Approval Required',
        },
      },
      {
        type: 'notify_users',
        config: {
          title: 'Pre-Approval Required',
          message: 'An item requires pre-approval due to high value (>$10,000). Please review and approve.',
          userIds: [], // Will be filled by user
        },
      },
    ],
    requiredColumns: [
      {
        name: 'Amount',
        type: 'NUMBER',
        description: 'A NUMBER column to check the amount value',
      },
    ],
    notes: [
      'You will need to select the Amount column in the trigger configuration',
      'You will need to specify the Level 1 approver user IDs in the notification action',
      'Adjust the threshold value (10000) as needed for your organization',
    ],
  },
  {
    id: 'due-date-reminders',
    name: 'Due Date Reminders',
    description: 'Send reminders before due date and mark items as overdue after due date passes',
    category: 'Date Management',
    icon: '📅',
    trigger: {
      type: 'date_approaching',
      config: {
        daysBefore: 3,
      },
    },
    actions: [
      {
        type: 'send_email',
        config: {
          email: '', // Will be filled by user
          subject: 'Due Date Reminder',
          message: 'This item is due in 3 days. Please take action.',
        },
      },
    ],
    requiredColumns: [
      {
        name: 'Due Date',
        type: 'DATE',
        description: 'A DATE column containing the due date',
      },
    ],
    notes: [
      'This template creates one automation for reminders. You may want to create a second automation for overdue items.',
      'You will need to select the Due Date column in the trigger configuration',
      'You can customize the email recipient, subject, and message',
      'For overdue items, create a separate automation with "Date Passed" trigger and "Set Status to Overdue" action',
    ],
  },
  {
    id: 'due-date-overdue',
    name: 'Due Date Overdue',
    description: 'Mark items as overdue when due date passes',
    category: 'Date Management',
    icon: '⏰',
    trigger: {
      type: 'date_passed',
      config: {},
    },
    actions: [
      {
        type: 'set_status',
        config: {
          status: 'Overdue',
        },
      },
    ],
    requiredColumns: [
      {
        name: 'Due Date',
        type: 'DATE',
        description: 'A DATE column containing the due date',
      },
    ],
    notes: [
      'You will need to select the Due Date column in the trigger configuration',
      'This automation works together with the Due Date Reminders template',
    ],
  },
  {
    id: 'auto-assignment-on-create',
    name: 'Auto-assignment on Create',
    description: 'Automatically assign new items to department head',
    category: 'Assignment',
    icon: '👤',
    trigger: {
      type: 'item_created',
      config: {},
    },
    actions: [
      {
        type: 'assign_user',
        config: {
          userIds: [], // Will be filled by user
        },
      },
    ],
    requiredColumns: [
      {
        name: 'Assignee',
        type: 'PEOPLE',
        description: 'A PEOPLE column to store the assigned user',
      },
    ],
    notes: [
      'You will need to select the Assignee column in the action configuration',
      'You will need to specify the department head user ID(s)',
      'This can be used for any initial assignment scenario',
    ],
  },
  {
    id: 'auto-assignment-on-approval',
    name: 'Auto-assignment on Approval',
    description: 'Automatically assign items to finance team when status changes to "Approved"',
    category: 'Assignment',
    icon: '✅',
    trigger: {
      type: 'item_status_changed',
      config: {
        value: 'Approved',
      },
    },
    actions: [
      {
        type: 'assign_user',
        config: {
          userIds: [], // Will be filled by user
        },
      },
    ],
    requiredColumns: [
      {
        name: 'Assignee',
        type: 'PEOPLE',
        description: 'A PEOPLE column to store the assigned user',
      },
    ],
    notes: [
      'You will need to select the Assignee column in the action configuration',
      'You will need to specify the finance team user ID(s)',
      'Adjust the status value if your "Approved" status is named differently',
    ],
  },
  {
    id: 'status-on-approval-complete',
    name: 'Status on Approval Complete',
    description: 'Set status to "Approved" when all approvals are completed',
    category: 'Status',
    icon: '✔️',
    trigger: {
      type: 'approval_level_completed',
      config: {
        level: 'LEVEL_1', // Can be adjusted
      },
    },
    actions: [
      {
        type: 'set_status',
        config: {
          status: 'Approved',
        },
      },
    ],
    notes: [
      'Adjust the approval level if needed (LEVEL_1, LEVEL_2, LEVEL_3)',
      'This triggers when all approvals at the specified level are completed',
    ],
  },
  {
    id: 'move-on-approval',
    name: 'Move to Payment Board on Approval',
    description: 'Move item to Payment board when status is set to "Approved"',
    category: 'Status',
    icon: '💳',
    trigger: {
      type: 'field_equals',
      config: {
        operator: 'equals',
        value: 'Approved',
      },
    },
    actions: [
      {
        type: 'move_to_board',
        config: {
          targetBoardId: '', // Will be filled by user
        },
      },
    ],
    notes: [
      'You will need to select the Status column in the trigger configuration',
      'You will need to specify the target board ID for the Payment board',
      'Adjust the status value if your "Approved" status is named differently',
    ],
  },
];

export const getTemplateById = (id: string): AutomationTemplate | undefined => {
  return AUTOMATION_TEMPLATES.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: string): AutomationTemplate[] => {
  return AUTOMATION_TEMPLATES.filter(template => template.category === category);
};

