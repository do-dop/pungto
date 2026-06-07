'use client'

import { useRef, useState } from 'react'
import { initialTodos } from '../constants'

export function useTodos() {
  const [todos, setTodos] = useState(initialTodos)
  const [todoInput, setTodoInput] = useState('')
  const composingRef = useRef(false)

  function addTodo() {
    const trimmed = todoInput.trim()
    if (!trimmed) return
    setTodos((prev) => [...prev, { id: Date.now(), text: trimmed, due: '미정' }])
    setTodoInput('')
  }

  function toggleTodo(id: number) {
    setTodos((prev) => prev.map((item) => {
      if (item.id !== id) return item
      if (item.done) {
        return {
          ...item,
          done: false,
          due: item.text.includes('랜딩') ? '오늘 마감' : item.text.includes('팀 위클리') ? '오늘 오후 2시' : item.due === '완료' ? '미정' : item.due,
          urgent: item.text.includes('랜딩') || item.text.includes('팀 위클리'),
        }
      }
      return { ...item, done: true, due: '완료', urgent: false }
    }))
  }

  return {
    todos,
    todoInput,
    composingRef,
    setTodoInput,
    addTodo,
    toggleTodo,
  }
}
