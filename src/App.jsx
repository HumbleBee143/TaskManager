import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'work', label: 'Work', accent: '#7eb8f7' },
  { id: 'personal', label: 'Personal', accent: '#c4a7e7' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#4ade80' },
  { value: 'medium', label: 'Medium', color: '#facc15' },
  { value: 'high', label: 'High', color: '#f87171' },
]

const FILTERS = ['All', 'Active', 'Completed']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priorityColor(value) {
  return PRIORITIES.find((p) => p.value === value)?.color ?? '#888'
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim()) return
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <header style={styles.header}>
          <h1 style={styles.title}>Tasks</h1>
          <p style={styles.subtitle}>Sign in to continue.</p>
        </header>

        {sent ? (
          <p style={styles.sentMsg}>
            Magic link sent to <span style={{ color: '#e8e8e8' }}>{email}</span>.
            <br />Check your inbox and click the link.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="your@email.com"
              autoFocus
              style={styles.addInput}
              onFocus={(e) => (e.target.style.borderColor = '#7eb8f7')}
              onBlur={(e) => (e.target.style.borderColor = '#222')}
            />
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                ...styles.addBtn,
                backgroundColor: '#7eb8f7',
                color: '#0d0d0d',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{ ...styles.page, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#2a2a2a', letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
        Loading…
      </span>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityDot({ value, size = 10 }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: priorityColor(value),
        flexShrink: 0,
        boxShadow: `0 0 6px ${priorityColor(value)}66`,
      }}
    />
  )
}

function TaskItem({ task, accent, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.text)
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== task.text) onEdit(task.id, trimmed)
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') {
      setDraft(task.text)
      setEditing(false)
    }
  }

  return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...styles.taskItem, backgroundColor: hovered ? '#111' : 'transparent' }}
    >
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        style={{
          ...styles.checkbox,
          borderColor: task.completed ? accent : '#444',
          backgroundColor: task.completed ? accent : 'transparent',
        }}
      >
        {task.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#0d0d0d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <PriorityDot value={task.priority} />

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          style={styles.editInput}
        />
      ) : (
        <span
          onDoubleClick={() => !task.completed && setEditing(true)}
          title={task.completed ? '' : 'Double-click to edit'}
          style={{
            ...styles.taskText,
            color: task.completed ? '#555' : '#e8e8e8',
            textDecoration: task.completed ? 'line-through' : 'none',
          }}
        >
          {task.text}
        </span>
      )}

      <button
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        style={{ ...styles.deleteBtn, opacity: hovered ? 1 : 0 }}
      >
        ✕
      </button>
    </li>
  )
}

function AddTaskBar({ accent, onAdd }) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')

  function handleAdd() {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed, priority)
    setText('')
  }

  return (
    <div style={styles.addBar}>
      <div style={styles.addInputRow}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add a task…"
          style={styles.addInput}
          onFocus={(e) => (e.target.style.borderColor = accent)}
          onBlur={(e) => (e.target.style.borderColor = '#222')}
        />
        <button
          onClick={handleAdd}
          style={{ ...styles.addBtn, backgroundColor: accent, color: '#0d0d0d' }}
        >
          Add
        </button>
      </div>

      <div style={styles.priorityRow}>
        <span style={styles.priorityLabel}>Priority:</span>
        {PRIORITIES.map((p) => (
          <button
            key={p.value}
            onClick={() => setPriority(p.value)}
            style={{
              ...styles.priorityBtn,
              borderColor: priority === p.value ? p.color : '#333',
              color: priority === p.value ? p.color : '#555',
              backgroundColor: priority === p.value ? `${p.color}18` : 'transparent',
            }}
          >
            <PriorityDot value={p.value} size={7} />
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tasks, setTasks] = useState({ work: [], personal: [] })
  const [activeTab, setActiveTab] = useState('work')
  const [filters, setFilters] = useState({ work: 'All', personal: 'All' })

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Tasks (load + real-time sync) ─────────────────────────────────────────

  useEffect(() => {
    if (!session) return

    async function fetchTasks() {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        setTasks({
          work: data.filter((t) => t.tab === 'work'),
          personal: data.filter((t) => t.tab === 'personal'),
        })
      }
    }

    fetchTasks()

    // Real-time: sync changes made on other devices
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session])

  // ── Mutations ─────────────────────────────────────────────────────────────

  async function addTask(text, priority) {
    const { data } = await supabase
      .from('tasks')
      .insert({ text, priority, tab: activeTab, user_id: session.user.id, completed: false })
      .select()
      .single()

    if (data) {
      setTasks((prev) => ({ ...prev, [activeTab]: [data, ...prev[activeTab]] }))
    }
  }

  async function toggleTask(id) {
    const task = tasks[activeTab].find((t) => t.id === id)
    // Optimistic update for instant feel
    setTasks((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }))
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', id)
  }

  async function deleteTask(id) {
    // Optimistic update
    setTasks((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((t) => t.id !== id),
    }))
    await supabase.from('tasks').delete().eq('id', id)
  }

  async function editTask(id, text) {
    const { data } = await supabase
      .from('tasks')
      .update({ text })
      .eq('id', id)
      .select()
      .single()

    if (data) {
      setTasks((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].map((t) => (t.id === id ? data : t)),
      }))
    }
  }

  async function clearCompleted() {
    const ids = tasks[activeTab].filter((t) => t.completed).map((t) => t.id)
    setTasks((prev) => ({ ...prev, [activeTab]: prev[activeTab].filter((t) => !t.completed) }))
    await supabase.from('tasks').delete().in('id', ids)
  }

  // ── Render gates ──────────────────────────────────────────────────────────

  if (authLoading) return <LoadingScreen />
  if (!session) return <LoginScreen />

  // ── Derived state ─────────────────────────────────────────────────────────

  const currentTab = TABS.find((t) => t.id === activeTab)
  const accent = currentTab.accent
  const currentFilter = filters[activeTab]
  const tabTasks = tasks[activeTab]

  function remainingCount(tabId) {
    return tasks[tabId].filter((t) => !t.completed).length
  }

  const visibleTasks = tabTasks.filter((t) => {
    if (currentFilter === 'Active') return !t.completed
    if (currentFilter === 'Completed') return t.completed
    return true
  })

  const hasCompleted = tabTasks.some((t) => t.completed)
  const remaining = remainingCount(activeTab)

  const setFilter = (f) => setFilters((prev) => ({ ...prev, [activeTab]: f }))

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <h1 style={styles.title}>Tasks</h1>
            <button
              onClick={() => supabase.auth.signOut()}
              style={styles.signOutBtn}
            >
              Sign out
            </button>
          </div>
          <p style={styles.subtitle}>Stay on top of what matters.</p>
        </header>

        {/* Tabs */}
        <div style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = tab.id === activeTab
            const count = remainingCount(tab.id)
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tab,
                  color: active ? tab.accent : '#555',
                  borderBottom: active ? `2px solid ${tab.accent}` : '2px solid transparent',
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: `${tab.accent}22`,
                      color: tab.accent,
                      border: `1px solid ${tab.accent}44`,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div style={styles.divider} />

        {/* Add task */}
        <AddTaskBar accent={accent} onAdd={addTask} />

        {/* Filter bar */}
        <div style={styles.filterBar}>
          <div style={styles.filterBtns}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...styles.filterBtn,
                  color: currentFilter === f ? accent : '#444',
                  borderBottom: currentFilter === f ? `1px solid ${accent}` : '1px solid transparent',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          {hasCompleted && (
            <button onClick={clearCompleted} style={styles.clearBtn}>
              Clear completed
            </button>
          )}
        </div>

        {/* Task list */}
        <ul style={styles.taskList}>
          {visibleTasks.length === 0 ? (
            <li style={styles.emptyState}>
              {currentFilter === 'Completed'
                ? 'No completed tasks yet.'
                : currentFilter === 'Active'
                ? 'Nothing active — well done!'
                : 'No tasks yet. Add one above.'}
            </li>
          ) : (
            visibleTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                accent={accent}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onEdit={editTask}
              />
            ))
          )}
        </ul>

        {/* Footer */}
        {tabTasks.length > 0 && (
          <footer style={styles.footer}>
            <span style={styles.footerCount}>
              {remaining} item{remaining !== 1 ? 's' : ''} left
            </span>
          </footer>
        )}
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '60px 16px 80px',
  },
  card: {
    width: '100%',
    maxWidth: 580,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 52,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#f0f0f0',
    lineHeight: 1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 11,
    color: '#3a3a3a',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  signOutBtn: {
    background: 'none',
    border: 'none',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: '#333',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '4px 0',
    marginTop: 8,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    borderRadius: 0,
  },
  tabBar: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '10px 20px 10px 0',
    background: 'none',
    border: 'none',
    borderRadius: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'color 0.15s',
    marginBottom: -1,
  },
  badge: {
    fontSize: 10,
    fontWeight: 500,
    padding: '1px 6px',
    borderRadius: 10,
    letterSpacing: '0.02em',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginBottom: 28,
  },
  addBar: {
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  addInputRow: {
    display: 'flex',
    gap: 8,
  },
  addInput: {
    flex: 1,
    background: '#0f0f0f',
    border: '1px solid #222',
    borderRadius: 6,
    padding: '10px 14px',
    color: '#e8e8e8',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
    transition: 'border-color 0.15s',
    outline: 'none',
  },
  addBtn: {
    border: 'none',
    borderRadius: 6,
    padding: '10px 20px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    letterSpacing: '0.04em',
    flexShrink: 0,
  },
  priorityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  priorityLabel: {
    fontSize: 10,
    color: '#3a3a3a',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontFamily: "'IBM Plex Mono', monospace",
    marginRight: 2,
  },
  priorityBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    padding: '4px 10px',
    borderRadius: 4,
    border: '1px solid',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.12s',
    letterSpacing: '0.02em',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1px solid #161616',
  },
  filterBtns: {
    display: 'flex',
    gap: 18,
  },
  filterBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '1px solid transparent',
    padding: '2px 0 4px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'color 0.12s',
    borderRadius: 0,
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: '#3a3a3a',
    cursor: 'pointer',
    letterSpacing: '0.06em',
    padding: 0,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    borderRadius: 0,
    textTransform: 'uppercase',
  },
  taskList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minHeight: 48,
    marginTop: 4,
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 10px',
    borderRadius: 5,
    transition: 'background 0.1s',
    position: 'relative',
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.15s',
  },
  taskText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 1.45,
    fontFamily: "'IBM Plex Mono', monospace",
    cursor: 'default',
    wordBreak: 'break-word',
    transition: 'color 0.15s',
  },
  editInput: {
    flex: 1,
    background: '#161616',
    border: '1px solid #2a2a2a',
    borderRadius: 4,
    padding: '4px 8px',
    color: '#e8e8e8',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
    outline: 'none',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#555',
    fontSize: 11,
    cursor: 'pointer',
    padding: '2px 5px',
    borderRadius: 3,
    transition: 'opacity 0.12s',
    flexShrink: 0,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  emptyState: {
    fontSize: 11,
    color: '#2a2a2a',
    letterSpacing: '0.06em',
    padding: '32px 0',
    textAlign: 'center',
    fontFamily: "'IBM Plex Mono', monospace",
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 20,
    paddingTop: 14,
    borderTop: '1px solid #161616',
  },
  footerCount: {
    fontSize: 10,
    color: '#2e2e2e',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  sentMsg: {
    fontSize: 13,
    color: '#777',
    fontFamily: "'IBM Plex Mono', monospace",
    lineHeight: 1.7,
  },
}
