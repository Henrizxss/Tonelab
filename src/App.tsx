import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { invoke } from '@tauri-apps/api/core'
import {
  Activity,
  AudioLines,
  ChevronRight,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  Library,
  Mic2,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Cpu,
  CircleHelp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import SettingsPage from './pages/SettingsPage'
import './App.css'

type RuntimeStatus = {
  desktop_available: boolean
  gp200: string
  audio_input: string
  reaper: string
  ai_runtime: string
}

type Page =
  | 'Dashboard'
  | 'Analisador ao vivo'
  | 'Analisador de áudio'
  | 'Editor de presets'
  | 'Assistente IA'
  | 'Biblioteca'
  | 'Modelos'
  | 'Configurações'

const navItems: Array<{ label: Page; icon: typeof LayoutDashboard }> = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Analisador ao vivo', icon: Activity },
  { label: 'Analisador de áudio', icon: AudioLines },
  { label: 'Editor de presets', icon: SlidersHorizontal },
  { label: 'Assistente IA', icon: Sparkles },
  { label: 'Biblioteca', icon: Library },
  { label: 'Modelos', icon: Cpu },
  { label: 'Configurações', icon: Settings },
]

const spectrum = [
  { hz: 40, level: 18 },
  { hz: 80, level: 28 },
  { hz: 160, level: 45 },
  { hz: 320, level: 38 },
  { hz: 640, level: 67 },
  { hz: 1280, level: 52 },
  { hz: 2560, level: 76 },
  { hz: 5120, level: 58 },
  { hz: 10240, level: 31 },
]

function StatusDot({ active = false }: { active?: boolean }) {
  return <span className={`status-dot ${active ? 'active' : ''}`} />
}

function App() {
  const [activePage, setActivePage] = useState<Page>('Dashboard')
  const [listening, setListening] = useState(false)
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>({
    desktop_available: false,
    gp200: 'Não detectado',
    audio_input: 'Inativa',
    reaper: 'Não configurado',
    ai_runtime: 'Offline',
  })

  useEffect(() => {
    const loadDesktopStatus = async () => {
      if (!('__TAURI_INTERNALS__' in window)) return
      try {
        const status = await invoke<RuntimeStatus>('get_runtime_status')
        setRuntimeStatus(status)
      } catch {
        setRuntimeStatus((current) => ({
          ...current,
          desktop_available: false,
        }))
      }
    }
    void loadDesktopStatus()
  }, [])

  const title = useMemo(() => {
    if (activePage === 'Dashboard') return 'Bom dia, guitarrista'
    return activePage
  }, [activePage])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <AudioLines size={21} strokeWidth={2.4} />
          </div>
          <div>
            <strong>TONE LAB</strong>
            <span>AI STUDIO</span>
          </div>
        </div>

        <nav className="main-nav" aria-label="Navegação principal">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className={activePage === label ? 'nav-item active' : 'nav-item'}
              onClick={() => setActivePage(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {activePage === label && <ChevronRight size={14} className="nav-arrow" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="nav-item">
            <CircleHelp size={18} />
            <span>Ajuda</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">TONE LAB AI</p>
            <h1>{title}</h1>
          </div>
          <div className="top-actions">
            <button type="button" className="icon-button" aria-label="Abrir configurações" onClick={() => setActivePage('Configurações')}>
              <Settings size={18} />
            </button>
            <button type="button" className="model-button" onClick={() => setActivePage('Modelos')}>
              <span className="model-light" />
              Sem modelo ativo
            </button>
          </div>
        </header>

        {activePage === 'Dashboard' ? (
          <motion.div
            className="dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <section className="hero-card">
              <div className="hero-copy">
                <span className="hero-kicker">WORKFLOW LOCAL</span>
                <h2>Analise seu som.<br />Construa seu tone.</h2>
                <p>Conecte o GP-200, configure a entrada e refine seu preset com precisão técnica.</p>
                <div className="hero-actions">
                  <button type="button" className="primary-button" onClick={() => setActivePage('Analisador ao vivo')}>
                    <Mic2 size={17} />
                    Iniciar análise
                  </button>
                  <button type="button" className="secondary-button" onClick={() => setActivePage('Editor de presets')}>
                    <Upload size={17} />
                    Importar preset
                  </button>
                </div>
              </div>
              <div className="mascot-wrap">
                <div className="mascot-glow" />
                <img src="/mascot.png" alt="Mascote ToneLab" className="mascot" />
              </div>
            </section>

            <section className="metrics-row">
              <article className="metric-card">
                <div className="metric-heading">
                  <span>ESPECTRO</span>
                  <Gauge size={16} />
                </div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spectrum} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
                      <defs>
                        <linearGradient id="spectrumFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f2a9cb" stopOpacity={0.42} />
                          <stop offset="100%" stopColor="#f2a9cb" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="hz" hide />
                      <YAxis hide />
                      <Tooltip
                        cursor={false}
                        contentStyle={{ background: '#17162a', border: '1px solid #302f49', borderRadius: 8, fontSize: 12 }}
                        formatter={(value) => [`${value} dB`, 'Nível']}
                      />
                      <Area type="monotone" dataKey="level" stroke="#ef9fc4" strokeWidth={2} fill="url(#spectrumFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="metric-card current-card">
                <div className="metric-heading">
                  <span>PRESET ATUAL</span>
                  <FolderOpen size={16} />
                </div>
                <div className="preset-empty">
                  <div className="preset-icon"><SlidersHorizontal size={22} /></div>
                  <div>
                    <strong>Nenhum preset</strong>
                    <p>Importe um arquivo GP-200</p>
                  </div>
                </div>
              </article>

              <article className="metric-card status-card">
                <div className="metric-heading">
                  <span>STATUS DO SISTEMA</span>
                  <Activity size={16} />
                </div>
                <div className="status-list">
                  <div><span><StatusDot active={runtimeStatus.desktop_available && runtimeStatus.gp200 !== 'Não detectado'} />GP-200</span><b>{runtimeStatus.gp200}</b></div>
                  <div><span><StatusDot active={runtimeStatus.audio_input !== 'Inativa' && runtimeStatus.audio_input !== 'Não configurado'} />Entrada de áudio</span><b>{runtimeStatus.audio_input}</b></div>
                  <div><span><StatusDot active={runtimeStatus.reaper !== 'Não configurado'} />Reaper</span><b>{runtimeStatus.reaper}</b></div>
                  <div><span><StatusDot active={runtimeStatus.ai_runtime !== 'Offline' && runtimeStatus.ai_runtime !== 'Desligado'} />IA local</span><b>{runtimeStatus.ai_runtime}</b></div>
                </div>
              </article>
            </section>

            <section className="listen-panel">
              <button
                type="button"
                className={listening ? 'listen-button listening' : 'listen-button'}
                onClick={() => setListening((value) => !value)}
              >
                <span className="listen-icon"><Mic2 size={20} /></span>
                <span>
                  <strong>{listening ? 'Aguardando entrada...' : 'Testar entrada ao vivo'}</strong>
                  <small>{listening ? 'Selecione um dispositivo nas configurações' : 'Verifique o nível do seu instrumento'}</small>
                </span>
              </button>
            </section>
          </motion.div>
        ) : activePage === 'Configurações' ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SettingsPage />
          </motion.div>
        ) : (
          <motion.section
            className="placeholder-page"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="placeholder-icon">
              {activePage === 'Editor de presets' ? <SlidersHorizontal size={28} /> :
                activePage === 'Analisador ao vivo' ? <Activity size={28} /> :
                activePage === 'Analisador de áudio' ? <AudioLines size={28} /> :
                activePage === 'Assistente IA' ? <Sparkles size={28} /> :
                activePage === 'Biblioteca' ? <Library size={28} /> :
                activePage === 'Modelos' ? <Cpu size={28} /> : <Settings size={28} />}
            </div>
            <h2>{activePage}</h2>
            <p>Este módulo será conectado ao backend nesta etapa do desenvolvimento.</p>
            <button type="button" className="secondary-button" onClick={() => setActivePage('Dashboard')}>
              Voltar ao dashboard
            </button>
          </motion.section>
        )}
      </main>
    </div>
  )
}

export default App
