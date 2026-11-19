import { invoke } from '@tauri-apps/api/core'

export type AppSettings = {
  language: 'pt-BR' | 'en'
  audioSource: 'reaper' | 'direct' | 'virtual'
  sampleRate: 44100 | 48000 | 96000
  bufferSize: 128 | 256 | 512 | 1024
  channel: 'stereo' | 'left' | 'right'
}

export const defaultSettings: AppSettings = {
  language: 'pt-BR',
  audioSource: 'reaper',
  sampleRate: 48000,
  bufferSize: 256,
  channel: 'stereo',
}

export function isDesktopRuntime(): boolean {
  return '__TAURI_INTERNALS__' in window
}

export async function loadSettings(): Promise<AppSettings> {
  return invoke<AppSettings>('get_settings')
}

export async function persistSettings(settings: AppSettings): Promise<void> {
  await invoke('save_settings', { settings })
}
