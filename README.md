# ToneLab AI

Aplicativo desktop local para análise e gerenciamento de timbres de guitarra, inicialmente voltado ao Valeton GP-200.

## Desenvolvimento

Requisitos para o app desktop no Windows:

- Node.js e npm
- Rust stable
- Visual Studio Build Tools com o workload **Desktop development with C++**
- WebView2 Runtime

Comandos:

```powershell
npm install
npm run dev
npm run desktop:dev
npm run build
npm run desktop:build
```

## Dados locais

O SQLite é criado automaticamente na pasta de dados do aplicativo Tauri, fora do diretório de instalação. O banco contém preferências e metadados; arquivos de áudio, modelos e presets devem permanecer como arquivos no disco.

As migrações estão em `src-tauri/migrations/` e são aplicadas no início do aplicativo. A migração atual cria tabelas de preferências, presets e versões, análises, modelos e perfis de dispositivos. Ainda não há parser de preset, captura de áudio ou integração de hardware.

## Estado da implementação

- Shell React/TypeScript e desktop Tauri 2.
- Preferências de áudio persistidas no SQLite local.
- Status de hardware, captura, Reaper e runtime de IA continuam indisponíveis até implementar e validar as integrações correspondentes.
