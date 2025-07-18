// Example component showing how to use the logging system
import React, { useState } from 'react';
import { useLogger } from '@/hooks/useLogger';

export function LoggerExampleComponent() {
  const [taskName, setTaskName] = useState('');
  const { 
    logUserAction, 
    logTaskEvent, 
    logError, 
    startPerformanceTimer, 
    endPerformanceTimer 
  } = useLogger({ 
    component: 'LoggerExampleComponent',
    userId: 'user-123' // This would come from auth context
  });

  const handleCreateTask = async () => {
    try {
      // Log user action
      logUserAction('create_task_clicked', { taskName });

      // Start performance timer
      const operation = startPerformanceTimer('create_task_api_call');

      // Simulate API call
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: taskName })
      });

      // End performance timer
      endPerformanceTimer(operation, { 
        success: response.ok,
        status: response.status 
      });

      if (response.ok) {
        const task = await response.json();
        
        // Log successful task creation
        logTaskEvent('task_created', task.id, {
          taskName,
          createdAt: new Date().toISOString()
        });

        setTaskName('');
      } else {
        throw new Error(`Failed to create task: ${response.status}`);
      }
    } catch (error) {
      // Log any errors
      logError(error as Error, {
        action: 'create_task',
        taskName
      });
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Logger Example</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="taskName" className="block text-sm font-medium">
            Task Name
          </label>
          <input
            id="taskName"
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="mt-1 block w-full border rounded-md px-3 py-2"
            placeholder="Enter task name..."
          />
        </div>
        <button
          onClick={handleCreateTask}
          disabled={!taskName.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          Create Task (Watch Logs in Seq)
        </button>
      </div>
    </div>
  );
}

// Example of automatic component logging with HOC
import { withLogger } from '@/hooks/useLogger';

const SimpleComponent = () => (
  <div>This component will automatically log mount/unmount events</div>
);

export const LoggedSimpleComponent = withLogger(SimpleComponent, 'SimpleComponent');