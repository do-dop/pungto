import type { KanbanTask } from '../types'

export function applyTaskPatch(task: KanbanTask, patch: Partial<KanbanTask>): KanbanTask {
  const nextTask: KanbanTask = { ...task, ...patch }

  if (nextTask.status === 'done') {
    return {
      ...nextTask,
      due: '완료',
      overdue: false,
    }
  }

  return nextTask
}

export function getNextTaskPosition(tasks: KanbanTask[], status: KanbanTask['status']) {
  return tasks.filter((task) => task.status === status).length
}
