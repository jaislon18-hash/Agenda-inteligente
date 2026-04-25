'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { 
  LayoutDashboard, CheckSquare, Target, Users, Sparkles, 
  Trash2, Plus, ArrowRight, ArrowUp, ArrowDown, Check,
  Trophy, Medal, Activity
} from 'lucide-react'

type Task = { id: string; title: string; done: boolean; priority: string; dueDate?: string }
type Goal = { id: string; title: string; progress: number; status: string; deadline?: string; tasks: Task[] }
type Member = { id: string; name: string; email: string; role: string; tasks: Task[] }

const gradients = [
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-cyan-500'
]

const bgColors = ['bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500']
const textColors = ['text-indigo-500', 'text-pink-500', 'text-amber-500', 'text-emerald-500', 'text-blue-500']
const borderColors = ['border-indigo-500', 'border-pink-500', 'border-amber-500', 'border-emerald-500', 'border-blue-500']

const priorityConfig: Record<string, { label: string; bg: string; text: string; border: string; order: number; Icon: any }> = {
  high: { label: 'Alta',  bg: 'bg-red-50 hover:bg-red-100', text: 'text-red-600', border: 'border-red-200', order: 1, Icon: ArrowUp },
  mid:  { label: 'Média', bg: 'bg-amber-50 hover:bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', order: 2, Icon: ArrowRight },
  low:  { label: 'Baixa', bg: 'bg-emerald-50 hover:bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', order: 3, Icon: ArrowDown },
}

function Avatar({ name, sizeClass = "w-10 h-10 text-sm" }: { name: string; sizeClass?: string }) {
  const i = name.charCodeAt(0) % gradients.length
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradients[i]} flex items-center justify-center text-white font-bold shadow-sm shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function ProgressBar({ value, colorClass = 'bg-indigo-500' }: { value: number; colorClass?: string }) {
  return (
    <div className="w-full bg-slate-100/80 rounded-full h-2.5 overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
        style={{ width: `${Math.min(value, 100)}%` }} 
      />
    </div>
  )
}

export default function Home() {
  const { user, isLoaded } = useUser()
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
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'tasks',     icon: CheckSquare, label: 'Tarefas' },
    { id: 'goals',     icon: Target, label: 'Metas' },
    { id: 'members',   icon: Users, label: 'Equipe' },
    { id: 'ai',        icon: Sparkles, label: 'IA Assistente' },
  ] as const

  if (!isLoaded) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Activity className="w-8 h-8 text-indigo-500 animate-spin" /></div>

  return (
    <div className="flex min-h-screen bg-slate-50/50 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-[#0a0f1c] border-r border-slate-800/60 flex flex-col z-50 transition-all shadow-2xl">
        <div className="p-8">
          <h1 className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 leading-tight">
            Agenda<br/>
            <span className="text-slate-100 font-semibold tracking-normal">Inteligente</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2">Workspace</p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {tabs.map(t => {
            const active = tab === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  active 
                    ? 'bg-indigo-500/10 text-indigo-400' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
                {t.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/60 m-4 rounded-2xl bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: 'w-9 h-9' } }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.firstName || 'Usuário'}</p>
              <p className="text-xs text-indigo-400 font-medium">Online agora</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        <div className="max-w-5xl mx-auto w-full p-8 lg:p-12 xl:px-16 pb-24">
          
          {/* Header */}
          <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {tabs.find(t => t.id === tab)?.label}
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </header>

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Pendentes', value: pending, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
                  { label: 'Concluídas', value: done, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                  { label: 'Metas Ativas', value: goals.length, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</span>
                    <span className={`text-4xl font-extrabold ${stat.color} mt-auto`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Progress Card */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Progresso Geral</h3>
                    <p className="text-sm text-slate-500 mt-1">{done} de {tasks.length} tarefas finalizadas</p>
                  </div>
                  <span className="text-3xl font-extrabold text-indigo-500">{pct}%</span>
                </div>
                <ProgressBar value={pct} />
              </div>

              {/* Ranking */}
              {members.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-6 h-6 text-amber-500" />
                    <h3 className="text-lg font-bold text-slate-900">Ranking da Equipe</h3>
                  </div>
                  <div className="space-y-6">
                    {[...members].sort((a, b) => {
                      const pa = a.tasks.length ? a.tasks.filter(t => t.done).length / a.tasks.length : 0
                      const pb = b.tasks.length ? b.tasks.filter(t => t.done).length / b.tasks.length : 0
                      return pb - pa
                    }).map((m, i) => {
                      const mp = m.tasks.length ? Math.round(m.tasks.filter(t => t.done).length / m.tasks.length * 100) : 0
                      const isTop3 = i < 3
                      return (
                        <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className={`w-8 text-center font-bold text-lg ${isTop3 ? 'text-amber-500' : 'text-slate-400'}`}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </div>
                          <Avatar name={m.name} sizeClass="w-10 h-10 text-sm" />
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-900 mb-1">{m.name}</h4>
                            <ProgressBar value={mp} colorClass={bgColors[i % bgColors.length]} />
                          </div>
                          <span className={`font-bold w-12 text-right ${textColors[i % textColors.length]}`}>{mp}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TASKS */}
          {tab === 'tasks' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Input Area */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1 relative">
                    <input
                      value={newTask}
                      onChange={e => setNewTask(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTask()}
                      placeholder="O que precisa ser feito?"
                      className="w-full pl-5 pr-5 py-3.5 bg-slate-50 border-transparent focus:bg-white border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                    />
                  </div>
                  <button 
                    onClick={addTask} 
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.98] shrink-0"
                  >
                    <Plus className="w-5 h-5" /> Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-slate-500 mr-2">Prioridade:</span>
                  {(['high', 'mid', 'low'] as const).map(p => {
                    const pc = priorityConfig[p]
                    const selected = newTaskPriority === p
                    const PriorityIcon = pc.Icon
                    return (
                      <button
                        key={p}
                        onClick={() => setNewTaskPriority(p)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                          selected ? `${pc.bg} ${pc.text} ${pc.border} ring-2 ring-offset-1 ring-${pc.text.split('-')[1]}-500/30` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <PriorityIcon className="w-4 h-4" /> {pc.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2 p-1 bg-slate-200/50 rounded-lg inline-flex">
                  {(['all', 'pending', 'done'] as const).map(f => (
                    <button 
                      key={f} 
                      onClick={() => setFilter(f)} 
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {{ all: 'Todas', pending: 'Pendentes', done: 'Concluídas' }[f]}
                    </button>
                  ))}
                </div>
              </div>

              {sortedTasks.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-300">
                    <CheckSquare className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Tudo limpo!</h3>
                  <p className="text-slate-500 mt-1">Você não tem tarefas aqui no momento.</p>
                </div>
              )}

              {/* Task List */}
              <div className="space-y-3">
                {sortedTasks.map(task => {
                  const p = priorityConfig[task.priority] ?? priorityConfig.mid
                  const PriorityIcon = p.Icon
                  return (
                    <div 
                      key={task.id} 
                      className={`group flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md ${
                        task.done ? 'opacity-60' : ''
                      }`}
                    >
                      <button 
                        onClick={() => toggleTask(task.id, task.done)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                          task.done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 text-transparent hover:border-indigo-400'
                        }`}
                      >
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </button>
                      
                      <span className={`flex-1 text-base transition-colors ${task.done ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                        {task.title}
                      </span>
                      
                      <span className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${p.bg} ${p.text}`}>
                        <PriorityIcon className="w-3.5 h-3.5" /> {p.label}
                      </span>
                      
                      <button 
                        onClick={() => deleteTask(task.id)} 
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        aria-label="Deletar tarefa"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* GOALS */}
          {tab === 'goals' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <input 
                  value={newGoal} 
                  onChange={e => setNewGoal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGoal()}
                  placeholder="Qual é o seu próximo grande objetivo?"
                  className="flex-1 px-5 py-3.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all shadow-sm outline-none"
                />
                <button 
                  onClick={addGoal} 
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.98] shrink-0"
                >
                  <Target className="w-5 h-5" /> Criar Meta
                </button>
              </div>

              {goals.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-300">
                    <Target className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Sem metas ainda</h3>
                  <p className="text-slate-500 mt-1">Comece definindo objetivos para você ou sua equipe.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map((goal, i) => {
                  const color = bgColors[i % bgColors.length]
                  const tColor = textColors[i % textColors.length]
                  const bColor = borderColors[i % borderColors.length]
                  return (
                    <div key={goal.id} className={`bg-white rounded-2xl p-6 shadow-sm border-t-4 border-slate-100 hover:shadow-md transition-shadow`} style={{ borderTopColor: 'var(--tw-color)' }} >
                      <div className={`h-1.5 w-full absolute top-0 left-0 ${color} rounded-t-2xl`} />
                      <div className="relative">
                        <h4 className="text-lg font-bold text-slate-900 mb-6 leading-tight pr-8">{goal.title}</h4>
                        <ProgressBar value={goal.progress} colorClass={color} />
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-sm font-medium text-slate-500">{goal.tasks.length} subtarefas</span>
                          <span className={`text-base font-extrabold ${tColor}`}>{goal.progress}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* MEMBERS */}
          {tab === 'members' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {members.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-300">
                    <Users className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Equipe vazia</h3>
                  <p className="text-slate-500 mt-1">Adicione membros para colaborar.</p>
                </div>
              )}
              {members.map((member, i) => {
                const dc = member.tasks.filter(t => t.done).length
                const total = member.tasks.length
                const mp = total ? Math.round((dc / total) * 100) : 0
                const tColor = textColors[i % textColors.length]
                const bgColor = bgColors[i % bgColors.length]
                return (
                  <div key={member.id} className="flex flex-col sm:flex-row items-center gap-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <Avatar name={member.name} sizeClass="w-16 h-16 text-xl" />
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-lg font-bold text-slate-900">{member.name}</h4>
                        <span className={`text-xl font-extrabold ${tColor}`}>{mp}%</span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium mb-4">{member.email} <span className="mx-2 text-slate-300">•</span> {member.role}</p>
                      <ProgressBar value={mp} colorClass={bgColor} />
                      <p className="text-xs text-slate-400 font-medium mt-3 text-right">{dc} de {total} tarefas concluídas</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* AI */}
          {tab === 'ai' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-slate-900 rounded-2xl p-8 lg:p-10 shadow-xl overflow-hidden relative">
                {/* Decorative background gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-7 h-7 text-indigo-400" />
                    <h3 className="text-2xl font-extrabold text-white">IA Assistente</h3>
                  </div>
                  <p className="text-indigo-200/80 mb-8 max-w-xl text-lg">
                    Pergunte sobre as tarefas da equipe, receba sugestões de prioridades ou tire dúvidas de organização.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative group">
                      <input 
                        value={aiQuestion} 
                        onChange={e => setAiQuestion(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && askAI()}
                        placeholder="Ex: Quais são as tarefas mais urgentes de hoje?"
                        className="w-full pl-5 pr-12 py-4 bg-white/5 border border-white/10 hover:border-white/20 focus:bg-white/10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 rounded-xl text-white placeholder:text-slate-400 transition-all outline-none text-base"
                      />
                    </div>
                    <button 
                      onClick={askAI} 
                      disabled={aiLoading || !aiQuestion.trim()} 
                      className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-400 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] shrink-0"
                    >
                      {aiLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Enviar <ArrowRight className="w-5 h-5" /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {aiAnswer && (
                <div className="mt-8 bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500" />
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">Resposta da IA</span>
                  </div>
                  <div className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap font-medium">
                    {aiAnswer}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}