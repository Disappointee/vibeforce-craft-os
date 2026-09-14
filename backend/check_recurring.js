// Recurring Task Check Script
// Run this periodically (e.g., via cron job or Windows Task Scheduler)
// It finds tasks where is_recurring = true and recurring_next_date <= now,
// creates a new task copy with updated dates, and updates the original task's recurring_next_date.
//
// Usage: node check_recurring.js
// Recommended: Run daily at midnight

const BASE_URL = "http://127.0.0.1:8090";
const API_URL = `${BASE_URL}/api`;
const COLLECTION_URL = `${API_URL}/collections`;

/**
 * Calculate the next recurring date based on interval and current next date
 */
function calculateNextDate(currentNextDate, interval, customDays) {
    const date = new Date(currentNextDate);

    switch (interval) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
        case 'custom':
            date.setDate(date.getDate() + (customDays || 7));
            break;
        default:
            return null;
    }

    return date.toISOString();
}

/**
 * Check if a date has passed the end date
 */
function isPastEndDate(dateStr, endDateStr) {
    if (!endDateStr) return false;
    const date = new Date(dateStr);
    const endDate = new Date(endDateStr);
    return date >= endDate;
}

/**
 * Authenticate as admin and return the token
 */
async function authenticate() {
    const email = process.env.PB_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.PB_ADMIN_PASSWORD || 'admin123456';

    const res = await fetch(`${API_URL}/admins/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password }),
    });

    if (!res.ok) {
        throw new Error(`Authentication failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return data.token;
}

/**
 * Find all recurring tasks that are due
 */
async function findDueRecurringTasks(token) {
    const now = new Date().toISOString();

    const res = await fetch(
        `${COLLECTION_URL}/tasks/records?filter=(is_recurring=true && recurring_next_date<="${now}")&perPage=100`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {
        throw new Error(`Failed to fetch recurring tasks: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return data.items || [];
}

/**
 * Create a new task copy from a recurring task
 */
async function createRecurringTaskCopy(originalTask, token) {
    // Fields to copy (exclude auto-generated and recurring-specific fields)
    const newTask = {
        title: originalTask.title,
        description: originalTask.description || '',
        status: 'todo', // Reset to todo
        priority: originalTask.priority || 'medium',
        project: originalTask.project,
        assignees: originalTask.assignees || [],
        parent_task: originalTask.parent_task || null,
        start_date: originalTask.recurring_next_date || null,
        due_date: originalTask.due_date || null,
        estimated_hours: originalTask.estimated_hours || null,
        // Copy recurring settings so the new task also repeats
        is_recurring: originalTask.is_recurring,
        recurring_interval: originalTask.recurring_interval,
        recurring_custom_days: originalTask.recurring_custom_days,
        recurring_end_date: originalTask.recurring_end_date,
        // Calculate next date for the new task
        recurring_next_date: calculateNextDate(
            originalTask.recurring_next_date,
            originalTask.recurring_interval,
            originalTask.recurring_custom_days
        ),
    };

    const res = await fetch(`${COLLECTION_URL}/tasks/records`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
    });

    if (!res.ok) {
        throw new Error(`Failed to create task copy: ${res.status} ${await res.text()}`);
    }

    return await res.json();
}

/**
 * Update the original task's recurring_next_date
 */
async function updateOriginalTaskNextDate(taskId, nextDate, token) {
    const res = await fetch(`${COLLECTION_URL}/tasks/records/${taskId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            recurring_next_date: nextDate,
        }),
    });

    if (!res.ok) {
        throw new Error(`Failed to update task ${taskId}: ${res.status} ${await res.text()}`);
    }

    return await res.json();
}

/**
 * Main function
 */
async function main() {
    console.log(`[${new Date().toISOString()}] Checking recurring tasks...`);

    try {
        const token = await authenticate();
        console.log('Authenticated successfully');

        const dueTasks = await findDueRecurringTasks(token);
        console.log(`Found ${dueTasks.length} due recurring task(s)`);

        for (const task of dueTasks) {
            console.log(`\nProcessing task: ${task.id} - "${task.title}"`);

            // Check if we've passed the end date
            if (isPastEndDate(task.recurring_next_date, task.recurring_end_date)) {
                console.log(`  → End date reached, disabling recurring for task ${task.id}`);
                await updateOriginalTaskNextDate(task.id, null, token);
                // Also disable recurring
                await fetch(`${COLLECTION_URL}/tasks/records/${task.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ is_recurring: false }),
                });
                continue;
            }

            // Calculate next date for the original task
            const nextDate = calculateNextDate(
                task.recurring_next_date,
                task.recurring_interval,
                task.recurring_custom_days
            );

            if (!nextDate) {
                console.error(`  ✗ Could not calculate next date for task ${task.id}`);
                continue;
            }

            // Create a copy of the task
            console.log(`  → Creating new task instance...`);
            const newTask = await createRecurringTaskCopy(task, token);
            console.log(`  ✓ Created new task: ${newTask.id}`);

            // Update the original task's next date
            console.log(`  → Updating next date to ${nextDate}`);
            await updateOriginalTaskNextDate(task.id, nextDate, token);
            console.log(`  ✓ Updated next date for task ${task.id}`);
        }

        if (dueTasks.length === 0) {
            console.log('No recurring tasks due at this time.');
        }

        console.log(`\n[${new Date().toISOString()}] Recurring task check complete.`);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
