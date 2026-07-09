# 📦 Malote Lab — Frontend

Sistema de gestão de ordens de serviço para óticas, com painel da loja, painel do laboratório e dashboard gerencial.

## 🚀 Tecnologias

- **React 19** + **TypeScript**
- **Vite** — bundler e dev server
- **Tailwind CSS** — estilização
- **Zustand** — gerenciamento de estado global
- **React Router v7** — roteamento
- **Oxlint** — linting

## 📁 Estrutura do projeto

```
src/
├── app/              # Configuração da aplicação (rotas, layout)
├── assets/           # Imagens e assets estáticos
├── components/       # Componentes reutilizáveis
│   ├── forms/        # Formulários e modais
│   ├── kanban/       # Board kanban de OS
│   └── ui/           # Design system (Button, Input, Modal, etc.)
├── features/         # Módulos de negócio (auth, os, stores, dashboard)
│   ├── auth/
│   ├── dashboard/
│   ├── os/
│   └── stores/
├── lib/              # Utilitários, tipos e constantes
├── pages/            # Páginas da aplicação
│   ├── dashboard/
│   ├── lab-panel/
│   ├── login/
│   ├── profile/
│   ├── store-panel/
│   └── store-selector/
├── services/         # Fábrica de serviços (mock/HTTP)
├── store/            # Stores Zustand (auth, ui)
└── styles/           # Estilos globais
```

## ⚙️ Configuração do ambiente

Copie o arquivo de exemplo e preencha com os seus valores:

```bash
cp .env.example .env
```

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_USE_MOCK_API` | Usa dados mockados (`true`) ou API real (`false`) | `true` |
| `VITE_API_BASE_URL` | URL base da API backend | `http://localhost:3001/api` |
| `VITE_WS_URL` | URL do WebSocket | `ws://localhost:3001` |

## 🛠️ Rodando localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

## 🧪 Modo Mock

Por padrão o projeto roda com `VITE_USE_MOCK_API=true`, usando dados fictícios locais — sem necessidade de ter o backend rodando. Para conectar na API real, altere para `false` no `.env`.

## 📋 Funcionalidades

- **Login** com controle de perfil (admin, loja, laboratório)
- **Seleção de loja** para usuários com acesso a múltiplas unidades
- **Painel da Loja** — criação e acompanhamento de OS em kanban
- **Painel do Laboratório** — gestão de OS recebidas e produção
- **Dashboard** — visão gerencial com métricas e indicadores
- **Perfil do usuário**

## 🔗 Repositório

[github.com/V4-Company-TellesFreire/FrontEnd_Malote](https://github.com/V4-Company-TellesFreire/FrontEnd_Malote)
