# IAI Soluções - Sistema de Agentes Autônomos e CRM para WhatsApp

O **IAI Soluções** é uma plataforma corporativa multi-inquilino (multi-tenant) e multi-perfil (RBAC) focada na automação de atendimento comercial e escala de vendas utilizando Inteligência Artificial conectada ao WhatsApp. 

O sistema permite centralizar o fluxo de atendimento em múltiplos atendentes humanos enquanto integra robôs inteligentes de IA com diretrizes personalizáveis para qualificar leads e realizar vendas 24 horas por dia.

---

##  Funcionalidades Principais por Perfil

### 1. Administrador Geral (ADM Global)
*   **Gestão de Empresas Parceiras**: Cadastra e audita contas comerciais inquilinas na plataforma.
*   **Auditoria Global**: Visualização centralizada de todas as contas e permissões do sistema.
*   **Criação de Acessos**: Capacidade de criar e associar usuários (Gestores e Secretárias) para qualquer empresa inquilina comercializada.

### 2. Gestor de Empresa
*   **Métricas de Desempenho**: Visualiza volumetria de contatos ativos no sistema e o status em tempo real do robô de IA.
*   **Gestão de Equipe**: Cadastro de novos atendentes (Secretárias) com acessos exclusivos para a sua empresa inquilina.
*   **Diretrizes de IA**: Configura e calibra o prompt de sistema e tom de voz que o robô inteligente usará para falar com seus clientes.

### 3. Atendente Comercial (Secretária)
*   **Live Chat WhatsApp**: Painel completo para leitura e envio de mensagens em tempo real para os leads captados.
*   **Interferência Humana Inteligente**: Botão **" Assumir Conversa"** que desativa instantaneamente a IA para aquele contato, permitindo o atendimento manual direto.
*   **Devolução para IA**: Botão **" Devolver para IA"** que reativa as respostas automáticas da inteligência artificial para o lead.
*   **Simulador de Leads (Virtual Client)**: Botão de testes integrado que cria leads virtuais e simula perguntas dinâmicas no WhatsApp para demonstrar a resposta da IA na hora.

---

## Stack Tecnológica

*   **Frontend**: HTML5 Semântico, Vanilla CSS3 (Glassmorphism e Micro-animações) e JavaScript moderno ES6.
*   **Servidor Frontend**: Vite (Porta 3000)
*   **Backend**: Python 3.10+, FastAPI (Framework assíncrono de alto desempenho) e SQLAlchemy (ORM).
*   **Banco de Dados**: SQLite (Banco relacional em 3FN para facilidade de desenvolvimento local).
*   **Segurança**: Autenticação stateless baseada em tokens JWT (JSON Web Tokens) e criptografia de senhas usando `bcrypt`.

---

## Estrutura de Pastas

```text
├── backend/
│   ├── app/
│   │   ├── core/           # Configurações de segurança, JWT e conexão do banco
│   │   ├── models/         # Modelagem física das tabelas do banco de dados
│   │   ├── schemas/        # Schemas de validação e sanitização (Pydantic)
│   │   ├── routers/        # Endpoints expostos (Auth, Empresa, Chats/IA)
│   │   └── main.py         # Arquivo de inicialização e semente (seed) do ADM
│   ├── requirements.txt    # Dependências do backend Python
│   └── database.db         # Banco de dados SQLite local (gerado automaticamente)
│
├── frontend/
│   ├── index.html          # Landing Page principal da plataforma
│   ├── app.html            # SPA unificada contendo as views dos painéis
│   ├── js/
│   │   └── app.js          # Lógica JavaScript cliente de APIs e polling
│   └── styles/
│       ├── main.css        # Estilos aplicados à Landing Page
│       └── app.css         # Estilos aplicados aos painéis do sistema
│
├── .gitignore              # Configuração de arquivos ignorados no repositório
├── package.json            # Configuração do Vite dev-server
└── README.md               # Documentação do projeto
```

---

## Instruções de Configuração e Instalação

### Pré-requisitos
*   [Node.js](https://nodejs.org/) instalado.
*   [Python 3.10+](https://www.python.org/) instalado.
*   [Git](https://git-scm.com/) configurado.

---

### 1. Configurando o Frontend

1. Na raiz do projeto, instale as dependências de desenvolvimento do Node:
   ```bash
   npm install
   ```
2. Inicialize o servidor de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```
3. O frontend estará online em **[http://localhost:3000](http://localhost:3000)**.
   * A Landing Page estará na raiz (`/`).
   * O painel de login/dashboards estará no caminho `/app.html` (`http://localhost:3000/app.html`).

---

### 2. Configurando o Backend

1. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```
2. Recomenda-se criar um ambiente virtual Python para isolar as dependências:
   ```bash
   python -m venv .venv
   ```
3. Ative o ambiente virtual:
   * **Windows (PowerShell)**: `.venv\Scripts\Activate.ps1`
   * **Linux/macOS**: `source .venv/bin/activate`
4. Instale as dependências listadas no `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```
5. Inicie o servidor FastAPI local através do Uvicorn:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
6. O backend estará ativo em **[http://localhost:8000](http://localhost:8000)**.
   * O Swagger para testes interativos de endpoints estará em **[http://localhost:8000/docs](http://localhost:8000/docs)**.


## Segurança & Boas Práticas (SecOps)

*   **Sem Credenciais Hardcoded**: As senhas são devidamente tratadas com hashing criptográfico `bcrypt` antes de serem persistidas no banco.
*   **Isolamento Multi-inquilino**: Toda rota privada valida o `empresa_id` do token JWT do usuário ativo, impedindo que uma empresa acesse ou modifique dados de outra.
*   **Higienização de Entradas**: Sanitização de dados realizada pelo Pydantic no backend e escape de caracteres HTML no frontend para mitigar ataques XSS.
*   **Git Security**: Arquivos como banco de dados SQLite local (`database.db`), arquivos `.env` locais e pastas de dependências (`node_modules/`, `.venv/`) são ignorados no repositório Git para evitar o compartilhamento acidental de chaves ou dados locais.
