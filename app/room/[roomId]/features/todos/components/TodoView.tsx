import type { MutableRefObject } from 'react'
import type { TodoItem } from '../../room/types'

type TodoViewProps = {
  todos: TodoItem[]
  todoInput: string
  composingRef: MutableRefObject<boolean>
  onInputChange: (value: string) => void
  onAddTodo: () => void
  onToggleTodo: (id: number) => void
}

export function TodoView({
  todos,
  todoInput,
  composingRef,
  onInputChange,
  onAddTodo,
  onToggleTodo,
}: TodoViewProps) {
  return (
    <div className="page active todo-page">
      <div className="todo-section-label">오늘 할 일</div>
      <div className="todo-list">
        {todos.map((todo, index) => (
          <div key={todo.id}>
            {index === 3 && <div className="todo-section-label nested-todo">이번 주</div>}
            <div className="todo-item">
              <button className={`todo-check ${todo.done ? 'done' : ''}`} onClick={() => onToggleTodo(todo.id)} />
              <span className={`todo-text ${todo.done ? 'done' : ''}`}>{todo.text}</span>
              <span className={`todo-due ${todo.urgent && !todo.done ? 'urgent' : ''}`}>{todo.due}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="todo-add-row">
        <input
          className="todo-add-input"
          value={todoInput}
          onChange={(e) => onInputChange(e.target.value)}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={() => { composingRef.current = false }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !composingRef.current) onAddTodo()
          }}
          placeholder="할 일을 입력하세요..."
        />
        <button className="btn-add" onClick={onAddTodo}>추가</button>
      </div>
    </div>
  )
}
