'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'

type Task = { id: string; title: string; done: boolean; priority: string; dueDate?: string }
type Goal = { id: string; title: string; progress: number; status: string; deadline?: string; tasks: Task[] }
type Member = { id: string; name: string; email: string; role: string; tasks: Task[] }

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

const priorityConfig: Record<string, { label: string; bg: string; color: string; order: number; icon: string }> = {
  high: { label: 'Alta',  bg: '#fef2f2', color: '#ef4444', order: 1, icon: '↑' },
  mid:  { label: 'Média', bg: '#fffbeb', color: '#f59e0b', order: 2, icon: '→' },
  low:  { label: 'Baixa', bg: '#f0fdf4', color: '#22c55e', order: 3, icon: '↓' },
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const i = name.charCodeAt(0) % colors.length
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${colors[i]}, ${colors[(i + 2) % colors.length]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
      boxShadow: `0 2px 8px ${colors[i]}55`, fontFamily: 'DM Sans, sans-serif'
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function ProgressBar({ value, color = '#6366f1' }: { value: number; color?: string }) {
  return (
    <div style={{ background: '#f1f5f9', borderRadius: 99, height: 6, overflow: 'hidden' }}>
      <div style={{
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        height: '100%', borderRadius: 99,
        width: `${Math.min(value, 100)}%`,
        transition: 'width 0.6s cubic-bezier(.4,0,.2,1)'
      }} />
    </div>
  )
}

export default function Home() {
  const { user } = useUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [newTask, setNewTask] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'mid' | 'low'>('mid')
  const [newGoal, setNewGoal] = useState('')
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [tab, setTab] = useState<'dashboard' | 'tasks' | 'goals' | 'members' | 'ai'>('dashboard')
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(setTasks)
    fetch('/api/goals').then(r => r.json()).then(setGoals)
    fetch('/api/users').then(r => r.json()).then(setMembers)
  }, [])

  async function addTask() {
    if (!newTask.trim()) return
    const task = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTask, priority: newTaskPriority })
    }).then(r => r.json())
    setTasks(prev => [task, ...prev])
    setNewTask('')
  }

  async function toggleTask(id: string, done: boolean) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !done })
    })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t))
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function addGoal() {
    if (!newGoal.trim()) return
    const goal = await fetch('/api/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newGoal, priority: 'mid' })
    }).then(r => r.json())
    setGoals(prev => [{ ...goal, tasks: [] }, ...prev])
    setNewGoal('')
  }

  async function askAI() {
    if (!aiQuestion.trim()) return
    setAiLoading(true)
    const data = await fetch('/api/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: aiQuestion })
    }).then(r => r.json())
    setAiAnswer(data.answer)
    setAiLoading(false)
  }

  const done = tasks.filter(t => t.done).length
  const pending = tasks.filter(t => !t.done).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  const sortedTasks = [...tasks]
    .filter(t => filter === 'all' ? true : filter === 'done' ? t.done : !t.done)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return (priorityConfig[a.priority]?.order ?? 2) - (priorityConfig[b.priority]?.order ?? 2)
    })

  const tabs = [
    { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
    { id: 'tasks',     icon: '✦', label: 'Tarefas' },
    { id: 'goals',     icon: '◎', label: 'Metas' },
    { id: 'members',   icon: '❋', label: 'Integrantes' },
    { id: 'ai',        icon: '◈', label: 'IA' },
  ] as const

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid #e0e7ff', fontSize: 14, background: '#fff',
    color: '#1e1b4b', fontFamily: 'DM Sans, sans-serif', fontWeight: 400,
    lineHeight: 1.4, transition: 'border 0.2s'
  }

  const btnPrimary: React.CSSProperties = {
    padding: '12px 22px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
    fontWeight: 500, fontSize: 14, fontFamily: 'DM Sans, sans-serif',
    boxShadow: '0 4px 12px #6366f144', letterSpacing: '0.2px'
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { font-size: 16px; }
        body { background: #f5f4fe; font-family: 'DM Sans', sans-serif; color: #1e1b4b; min-height: 100vh; -webkit-font-smoothing: antialiased; }
        input, button { font-family: 'DM Sans', sans-serif; }
        input:focus { outline: none; border-color: #6366f1 !important; }
        button { transition: opacity 0.15s, transform 0.1s; }
        button:hover { opacity: 0.88; }
        button:active { transform: scale(0.97); }
        ::placeholder { color: #c7d2fe; font-weight: 300; }
      `}</style>

      {/* Sidebar */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 210,
        background: 'linear-gradient(180deg, #1e1b4b 0%, #2d2a7a 100%)',
        display: 'flex', flexDirection: 'column', padding: '28px 14px',
        zIndex: 100, boxShadow: '4px 0 20px #1e1b4b18'
      }}>
        <div style={{ marginBottom: 36, paddingLeft: 10 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            Agenda
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: 10, color: '#818cf8', letterSpacing: '3px', textTransform: 'uppercase', marginTop: 2 }}>
            Inteligente
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {tabs.map(t => (
            <button type="button" key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'rgba(165,180,252,0.15)' : 'transparent',
              color: tab === t.id ? '#c7d2fe' : '#6366f1',
              fontSize: 13, fontWeight: tab === t.id ? 500 : 400,
              transition: 'all 0.15s', textAlign: 'left',
              borderLeft: tab === t.id ? '3px solid #818cf8' : '3px solid transparent',
              letterSpacing: '0.1px'
            }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 8px', borderTop: '1px solid #3730a3' }}>
          <UserButton />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#e0e7ff', lineHeight: 1.3 }}>{user?.firstName}</div>
            <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 300 }}>Online</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 210, minHeight: '100vh', padding: '36px 40px' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#1e1b4b', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {tabs.find(t => t.id === tab)?.label}
          </h1>
          <p style={{ fontSize: 13, color: '#818cf8', marginTop: 5, fontWeight: 300 }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 24 }}>
              {[
                { label: 'Pendentes',  value: pending,      color: '#f59e0b' },
                { label: 'Concluídas', value: done,         color: '#10b981' },
                { label: 'Metas',      value: goals.length, color: '#6366f1' },
              ].map(c => (
                <div key={c.label} style={{
                  background: '#fff', borderRadius: 14, padding: '22px 24px',
                  boxShadow: '0 1px 3px #1e1b4b08', borderTop: `3px solid ${c.color}`
                }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 36, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px #1e1b4b08' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>Progresso Geral</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#6366f1' }}>{pct}%</span>
              </div>
              <ProgressBar value={pct} />
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, fontWeight: 300 }}>{done} de {tasks.length} tarefas concluídas</div>
            </div>

            {members.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px #1e1b4b08' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 18 }}>🏆 Ranking</div>
                {[...members].sort((a, b) => {
                  const pa = a.tasks.length ? a.tasks.filter(t => t.done).length / a.tasks.length : 0
                  const pb = b.tasks.length ? b.tasks.filter(t => t.done).length / b.tasks.length : 0
                  return pb - pa
                }).map((m, i) => {
                  const mp = m.tasks.length ? Math.round(m.tasks.filter(t => t.done).length / m.tasks.length * 100) : 0
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <span style={{ fontSize: 18, width: 26 }}>{medals[i] ?? `#${i + 1}`}</span>
                      <Avatar name={m.name} size={34} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5 }}>{m.name}</div>
                        <ProgressBar value={mp} color={colors[i % colors.length]} />
                      </div>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#6366f1', minWidth: 38, textAlign: 'right' }}>{mp}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TASKS ── */}
        {tab === 'tasks' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {/* Linha 1: input + botão */}
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="Nova tarefa..."
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#6366f1'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e0e7ff'}
                />
                <button type="button" onClick={addTask} style={btnPrimary}>+ Adicionar</button>
              </div>

              {/* Linha 2: seletor de prioridade */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', marginRight: 4 }}>Prioridade:</span>
                {(['high', 'mid', 'low'] as const).map(p => {
                  const pc = priorityConfig[p]
                  const selected = newTaskPriority === p
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setNewTaskPriority(p)
                      }}
                      style={{
                        padding: '7px 16px', borderRadius: 20,
                        border: `1.5px solid ${selected ? pc.color : '#e0e7ff'}`,
                        background: selected ? pc.bg : '#fff',
                        color: selected ? pc.color : '#94a3b8',
                        cursor: 'pointer', fontSize: 12,
                        fontWeight: selected ? 600 : 400,
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 5,
                        outline: 'none'
                      }}
                    >
                      {pc.icon} {pc.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, alignItems: 'center' }}>
              {(['all', 'pending', 'done'] as const).map(f => (
                <button type="button" key={f} onClick={() => setFilter(f)} style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 500,
                  background: filter === f ? '#1e1b4b' : '#ede9fe',
                  color: filter === f ? '#fff' : '#6366f1', transition: 'all 0.15s'
                }}>
                  {{ all: 'Todas', pending: 'Pendentes', done: 'Concluídas' }[f]}
                </button>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8', fontWeight: 300 }}>
                Ordenadas por prioridade
              </span>
            </div>

            {sortedTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '56px 0', color: '#a5b4fc' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✦</div>
                <div style={{ fontSize: 13, fontWeight: 300 }}>Nenhuma tarefa aqui.</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedTasks.map(task => {
                const p = priorityConfig[task.priority] ?? priorityConfig.mid
                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px', background: '#fff', borderRadius: 11,
                    boxShadow: '0 1px 3px #1e1b4b06',
                    opacity: task.done ? 0.55 : 1, transition: 'opacity 0.2s',
                    borderLeft: `3px solid ${task.done ? '#e2e8f0' : p.color}`
                  }}>
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id, task.done)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6366f1', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14, lineHeight: 1.4, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? '#94a3b8' : '#1e1b4b' }}>
                      {task.title}
                    </span>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20,
                      background: p.bg, color: p.color, fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap'
                    }}>
                      {p.icon} {p.label}
                    </span>
                    <button type="button" onClick={() => deleteTask(task.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#fca5a5', fontSize: 13, padding: '0 2px'
                    }}>✕</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── GOALS ── */}
        {tab === 'goals' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addGoal()}
                placeholder="Nova meta..."
                style={inputStyle}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#6366f1'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e0e7ff'}
              />
              <button type="button" onClick={addGoal} style={btnPrimary}>+ Adicionar</button>
            </div>

            {goals.length === 0 && (
              <div style={{ textAlign: 'center', padding: '56px 0', color: '#a5b4fc' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>◎</div>
                <div style={{ fontSize: 13, fontWeight: 300 }}>Nenhuma meta ainda.</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {goals.map((goal, i) => (
                <div key={goal.id} style={{
                  background: '#fff', borderRadius: 14, padding: 22,
                  boxShadow: '0 1px 3px #1e1b4b08',
                  borderTop: `3px solid ${colors[i % colors.length]}`
                }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#1e1b4b', lineHeight: 1.3 }}>{goal.title}</div>
                  <ProgressBar value={goal.progress} color={colors[i % colors.length]} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 300 }}>{goal.tasks.length} subtarefas</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors[i % colors.length] }}>{goal.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {members.length === 0 && (
              <div style={{ textAlign: 'center', padding: '56px 0', color: '#a5b4fc' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>❋</div>
                <div style={{ fontSize: 13, fontWeight: 300 }}>Nenhum integrante ainda.</div>
              </div>
            )}
            {members.map((member, i) => {
              const dc = member.tasks.filter(t => t.done).length
              const total = member.tasks.length
              const mp = total ? Math.round((dc / total) * 100) : 0
              return (
                <div key={member.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: '#fff', borderRadius: 14, padding: '18px 22px',
                  boxShadow: '0 1px 3px #1e1b4b08'
                }}>
                  <Avatar name={member.name} size={48} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#1e1b4b' }}>{member.name}</span>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: colors[i % colors.length] }}>{mp}%</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, fontWeight: 300 }}>{member.email} · {member.role}</div>
                    <ProgressBar value={mp} color={colors[i % colors.length]} />
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, fontWeight: 300 }}>{dc} de {total} tarefas concluídas</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── AI ── */}
        {tab === 'ai' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b, #2d2a7a)',
              borderRadius: 18, padding: 28, marginBottom: 20,
              boxShadow: '0 8px 28px #1e1b4b20'
            }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#e0e7ff', marginBottom: 6 }}>◈ Assistente IA</div>
              <p style={{ fontSize: 13, color: '#818cf8', marginBottom: 20, fontWeight: 300, lineHeight: 1.5 }}>Pergunte sobre tarefas, metas ou peça sugestões de organização.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={aiQuestion} onChange={e => setAiQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askAI()}
                  placeholder="Ex: Quais tarefas devo priorizar hoje?"
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 10, fontSize: 13,
                    border: '1.5px solid #3730a3', background: 'rgba(255,255,255,0.06)',
                    color: '#e0e7ff', fontFamily: 'DM Sans, sans-serif', fontWeight: 300
                  }} />
                <button type="button" onClick={askAI} disabled={aiLoading} style={{ ...btnPrimary, minWidth: 86, opacity: aiLoading ? 0.7 : 1 }}>
                  {aiLoading ? '···' : 'Enviar'}
                </button>
              </div>
            </div>

            {aiAnswer && (
              <div style={{
                background: '#fff', borderRadius: 14, padding: 24,
                boxShadow: '0 1px 3px #1e1b4b08',
                fontSize: 14, lineHeight: 1.8, color: '#334155',
                whiteSpace: 'pre-wrap', borderLeft: '4px solid #6366f1'
              }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 10, color: '#6366f1', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Resposta</div>
                {aiAnswer}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}