import { useEffect, useState } from 'react'
import { AudioLines, Check, Database, HardDrive, Save } from 'lucide-react'
import type { AppSettings } from '../services/settings.service'
import {
  defaultSettings,
  isDesktopRuntime,
  loadSettings,
  persistSettings,
} from '../services/settings.service'

type LoadState = 'loading' | 'ready' | 'unavailable' | 'error'

function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isDesktopRuntime()) {
      setLoadState('unavailable')
      return
    }

    let active = true
    loadSettings()
      .then((saved) => {
        if (!active) return
        setSettings(saved)
        setLoadState('ready')
      })
      .catch((error: unknown) => {
        if (!active) return
        setMessage(`Não foi possível carregar as configurações: ${String(error)}`)
        setLoadState('error')
      })

    return () => {
      active = false
    }
  }, [])

  const updateSetting = <Key extends keyof AppSettings>(
    key: Key,
    value: AppSettings[Key],
  ) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      await persistSettings(settings)
      setMessage('Configurações salvas neste computador.')
    } catch (error) {
      setMessage(`Não foi possível salvar as configurações: ${String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const disabled = loadState !== 'ready' || saving

  return (
    <section className="settings-page">
      <div className="settings-intro">
        <p>As preferências ficam armazenadas localmente no banco de dados do ToneLab.</p>
        <span><HardDrive size={14} /> Somente neste computador</span>
      </div>

      {loadState === 'unavailable' && (
        <div className="settings-notice">
          Abra o ToneLab AI desktop para ler e salvar preferências no SQLite local.
        </div>
      )}
      {message && (
        <div className={loadState === 'error' || message.startsWith('Não foi') ? 'settings-message error' : 'settings-message success'}>
          {message}
        </div>
      )}

      <article className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-card-icon"><AudioLines size={18} /></div>
          <div>
            <h2>Preferências de áudio</h2>
            <p>Valores salvos para uso quando a captura de áudio for implementada.</p>
          </div>
        </div>

        <div className="settings-grid">
          <label className="settings-field">
            <span>Origem desejada</span>
            <select
              value={settings.audioSource}
              disabled={disabled}
              onChange={(event) => updateSetting('audioSource', event.target.value as AppSettings['audioSource'])}
            >
              <option value="reaper">Roteamento pelo Reaper</option>
              <option value="direct">Dispositivo direto</option>
              <option value="virtual">Cabo de áudio virtual</option>
            </select>
          </label>
          <label className="settings-field">
            <span>Taxa de amostragem</span>
            <select
              value={settings.sampleRate}
              disabled={disabled}
              onChange={(event) => updateSetting('sampleRate', Number(event.target.value) as AppSettings['sampleRate'])}
            >
              <option value={44100}>44.1 kHz</option>
              <option value={48000}>48 kHz</option>
              <option value={96000}>96 kHz</option>
            </select>
          </label>
          <label className="settings-field">
            <span>Tamanho do buffer</span>
            <select
              value={settings.bufferSize}
              disabled={disabled}
              onChange={(event) => updateSetting('bufferSize', Number(event.target.value) as AppSettings['bufferSize'])}
            >
              <option value={128}>128 amostras</option>
              <option value={256}>256 amostras</option>
              <option value={512}>512 amostras</option>
              <option value={1024}>1024 amostras</option>
            </select>
          </label>
          <label className="settings-field">
            <span>Canal de entrada</span>
            <select
              value={settings.channel}
              disabled={disabled}
              onChange={(event) => updateSetting('channel', event.target.value as AppSettings['channel'])}
            >
              <option value="stereo">Estéreo</option>
              <option value="left">Canal esquerdo</option>
              <option value="right">Canal direito</option>
            </select>
          </label>
        </div>
        <p className="settings-footnote">
          Essas opções guardam suas preferências; ainda não iniciam nem alteram dispositivos de áudio.
        </p>
      </article>

      <article className="settings-card settings-storage-card">
        <div className="settings-card-heading">
          <div className="settings-card-icon"><Database size={18} /></div>
          <div>
            <h2>Armazenamento local</h2>
            <p>Banco SQLite versionado por migrações e mantido fora da pasta de instalação.</p>
          </div>
        </div>
        <div className="storage-status">
          <span>
            {loadState === 'ready' ? <Check size={15} /> : <Database size={15} />}
            {loadState === 'ready'
              ? 'Banco local conectado'
              : loadState === 'loading'
                ? 'Verificando banco local...'
                : loadState === 'error'
                  ? 'Não foi possível acessar o banco local'
                  : 'Disponível no aplicativo desktop'}
          </span>
          <code>tonelab.db</code>
        </div>
      </article>

      <div className="settings-actions">
        <button type="button" className="primary-button" disabled={disabled} onClick={() => void save()}>
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar preferências'}
        </button>
      </div>
    </section>
  )
}

export default SettingsPage
