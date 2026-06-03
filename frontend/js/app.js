// URL Base da API do Backend FastAPI
const API_URL = 'http://localhost:8000/api';

// Estado global do aplicativo
let currentUser = null;
let currentToken = null;
let selectedContactId = null;
let chatPollingInterval = null;

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toastNotification');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    // Ocultar automaticamente após 4 segundos
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

// ==========================================================================
// AUTENTICAÇÃO E CONEXÕES SEGUROS (HEADERS)
// ==========================================================================
function getHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }
    return headers;
}

// Interceptor de erros genérico para tratar 401 Unauthorized
async function apiRequest(endpoint, options = {}) {
    options.headers = { ...options.headers, ...getHeaders() };
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        
        if (response.status === 401) {
            // Token expirado ou inválido
            logout();
            showToast('Sua sessão expirou. Faça login novamente.', 'error');
            throw new Error('Sessão expirada.');
        }
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Ocorreu um erro no servidor.');
        }
        
        // Retorna json se houver conteúdo, senão true
        const text = await response.text();
        return text ? JSON.parse(text) : true;
        
    } catch (error) {
        console.error(`Erro na requisição ${endpoint}:`, error);
        throw error;
    }
}

// ==========================================================================
// ROTEADOR DA SINGLE PAGE APPLICATION (SPA)
// ==========================================================================
function handleRouting() {
    const hash = window.location.hash || '#login';
    
    // Parar loops de polling do chat se trocar de tela
    if (chatPollingInterval && hash !== '#chat-secretaria') {
        clearInterval(chatPollingInterval);
        chatPollingInterval = null;
    }

    // Ocultar todas as Views principais
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-cadastro').style.display = 'none';
    document.getElementById('view-dashboard').style.display = 'none';

    // Recuperar credenciais salvas para persistência
    currentToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }

    // Telas públicas
    if (hash === '#login') {
        if (currentToken) {
            redirectBasedOnRole();
            return;
        }
        document.getElementById('view-login').style.display = 'flex';
        return;
    }

    if (hash === '#cadastro') {
        if (currentToken) {
            redirectBasedOnRole();
            return;
        }
        document.getElementById('view-cadastro').style.display = 'flex';
        return;
    }

    // Telas privadas (requer autenticação)
    if (!currentToken) {
        window.location.hash = '#login';
        return;
    }

    // Exibir layout do painel interno
    document.getElementById('view-dashboard').style.display = 'flex';
    configureSidebarMenu();

    // Roteamento de sub-painéis internos
    const panels = document.querySelectorAll('.view-panel');
    panels.forEach(p => p.style.display = 'none');
    
    // Desmarcar links ativos da sidebar
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    if (hash === '#dashboard-adm' && currentUser.role === 'adm') {
        document.getElementById('panel-adm').style.display = 'flex';
        setActiveNavLink('#dashboard-adm');
        loadAdmEmpresas();
    } else if (hash === '#auditoria-adm' && currentUser.role === 'adm') {
        document.getElementById('panel-adm-usuarios').style.display = 'flex';
        setActiveNavLink('#auditoria-adm');
        loadAdmUsuarios();
    } else if (hash === '#dashboard-gestor' && currentUser.role === 'gestor') {
        document.getElementById('panel-gestor').style.display = 'flex';
        setActiveNavLink('#dashboard-gestor');
        loadGestorMetrics();
        loadGestorSecretarias();
    } else if (hash === '#config-ia-gestor' && currentUser.role === 'gestor') {
        document.getElementById('panel-gestor-ia').style.display = 'flex';
        setActiveNavLink('#config-ia-gestor');
        loadGestorConfigIA();
    } else if (hash === '#chat-secretaria') {
        document.getElementById('panel-chat').style.display = 'flex';
        setActiveNavLink('#chat-secretaria');
        loadChatContacts();
    } else {
        // Redireciona caso digite uma URL que não condiz com sua role
        redirectBasedOnRole();
    }
}

function redirectBasedOnRole() {
    if (!currentUser) return;
    if (currentUser.role === 'adm') {
        window.location.hash = '#dashboard-adm';
    } else if (currentUser.role === 'gestor') {
        window.location.hash = '#dashboard-gestor';
    } else {
        window.location.hash = '#chat-secretaria';
    }
}

function setActiveNavLink(hash) {
    const activeLink = document.querySelector(`.sidebar-nav a[href="${hash}"]`);
    if (activeLink) activeLink.classList.add('active');
}

function configureSidebarMenu() {
    if (!currentUser) return;

    // Configurar metadados do perfil logado na sidebar
    document.getElementById('sidebarUserName').textContent = currentUser.nome;
    document.getElementById('sidebarUserRole').textContent = `Perfil: ${currentUser.role}`;
    document.getElementById('sidebarUserAvatar').textContent = currentUser.nome.charAt(0).toUpperCase();

    // Resetar visibilidade dos grupos
    document.getElementById('nav-group-adm').style.display = 'none';
    document.getElementById('nav-group-gestor').style.display = 'none';
    document.getElementById('nav-group-secretaria').style.display = 'none';

    // Exibir menus com base nas regras do perfil
    if (currentUser.role === 'adm') {
        document.getElementById('nav-group-adm').style.display = 'flex';
    } else if (currentUser.role === 'gestor') {
        document.getElementById('nav-group-gestor').style.display = 'flex';
        document.getElementById('nav-group-secretaria').style.display = 'flex'; // Gestores também gerenciam chat
    } else if (currentUser.role === 'secretaria') {
        document.getElementById('nav-group-secretaria').style.display = 'flex';
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    currentUser = null;
    currentToken = null;
    selectedContactId = null;
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
        chatPollingInterval = null;
    }
    window.location.hash = '#login';
}

// ==========================================================================
// OPERAÇÃO LOGIN / CADASTRO
// ==========================================================================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        email: document.getElementById('loginEmail').value,
        senha: document.getElementById('loginSenha').value
    };

    try {
        const res = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('user_info', JSON.stringify(res.user_info));
        currentUser = res.user_info;
        currentToken = res.access_token;
        
        showToast(`Bem-vindo, ${currentUser.nome}!`, 'success');
        redirectBasedOnRole();
        
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nome: document.getElementById('cadNome').value,
        email: document.getElementById('cadEmail').value,
        senha: document.getElementById('cadSenha').value,
        nome_empresa: document.getElementById('cadEmpresa').value,
        role: 'gestor' // Padrão
    };

    try {
        await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showToast('Empresa e conta criados com sucesso! Faça login.', 'success');
        window.location.hash = '#login';
        
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('btnLogout').addEventListener('click', logout);

// ==========================================================================
// FUNÇÕES DO PAINEL DO ADMINISTRADOR (ADM)
// ==========================================================================
async function loadAdmEmpresas() {
    try {
        const empresas = await apiRequest('/empresa/');
        const tbody = document.getElementById('admEmpresasTableBody');
        tbody.innerHTML = '';
        
        empresas.forEach(emp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${emp.id}</strong></td>
                <td>${emp.nome}</td>
                <td>${emp.cnpj || 'Não cadastrado'}</td>
                <td>${new Date(emp.data_criacao).toLocaleDateString()}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        showToast('Erro ao carregar empresas: ' + err.message, 'error');
    }
}

document.getElementById('admCreateEmpresaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nome: document.getElementById('admEmpresaNome').value,
        cnpj: document.getElementById('admEmpresaCnpj').value || null
    };

    try {
        await apiRequest('/empresa/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Nova empresa criada com sucesso!', 'success');
        document.getElementById('admCreateEmpresaForm').reset();
        loadAdmEmpresas();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

async function loadAdmUsuarios() {
    try {
        const usuarios = await apiRequest('/empresa/usuarios');
        const tbody = document.getElementById('admUsuariosTableBody');
        tbody.innerHTML = '';
        
        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${user.id}</strong></td>
                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td><span class="user-role-label">${user.role}</span></td>
                <td>${user.empresa_id || 'Global (ADM)'}</td>
                <td>${new Date(user.data_criacao).toLocaleDateString()}</td>
            `;
            tbody.appendChild(tr);
        });

        // Popular dinamicamente o select de empresas para o cadastro de novos usuários
        const empresas = await apiRequest('/empresa/');
        const selectEmpresa = document.getElementById('admUserEmpresa');
        if (selectEmpresa) {
            selectEmpresa.innerHTML = '<option value="">Selecione uma empresa...</option>';
            empresas.forEach(emp => {
                const opt = document.createElement('option');
                opt.value = emp.id;
                opt.textContent = `${emp.nome} (ID #${emp.id})`;
                selectEmpresa.appendChild(opt);
            });
        }
    } catch (err) {
        showToast('Erro ao carregar auditoria: ' + err.message, 'error');
    }
}

document.getElementById('admCreateUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nome: document.getElementById('admUserNome').value,
        email: document.getElementById('admUserEmail').value,
        senha: document.getElementById('admUserSenha').value,
        role: document.getElementById('admUserRole').value,
        empresa_id: parseInt(document.getElementById('admUserEmpresa').value) || null
    };

    try {
        await apiRequest('/empresa/usuarios', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Novo usuário cadastrado com sucesso!', 'success');
        document.getElementById('admCreateUserForm').reset();
        loadAdmUsuarios();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// ==========================================================================
// FUNÇÕES DO PAINEL DO GESTOR
// ==========================================================================
async function loadGestorMetrics() {
    try {
        const contatos = await apiRequest('/chat/contacts');
        document.getElementById('gestorMetricContatos').textContent = contatos.length;
        
        const chatAtivos = contatos.filter(c => !c.ia_ativo).length;
        document.getElementById('gestorMetricChatAtivo').textContent = chatAtivos;
    } catch (err) {
        console.error('Erro ao carregar métricas:', err);
    }
}

async function loadGestorSecretarias() {
    try {
        const secretarias = await apiRequest('/chat/secretarias');
        const tbody = document.getElementById('gestorSecretariasTableBody');
        tbody.innerHTML = '';
        
        secretarias.forEach(sec => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${sec.nome}</td>
                <td>${sec.email}</td>
                <td>${new Date(sec.data_criacao).toLocaleDateString()}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        showToast('Erro ao carregar equipe: ' + err.message, 'error');
    }
}

document.getElementById('gestorCreateSecretariaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nome: document.getElementById('secNome').value,
        email: document.getElementById('secEmail').value,
        senha: document.getElementById('secSenha').value,
        role: 'secretaria',
        empresa_id: currentUser.empresa_id
    };

    try {
        await apiRequest('/chat/secretarias', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Nova secretária cadastrada na sua equipe!', 'success');
        document.getElementById('gestorCreateSecretariaForm').reset();
        loadGestorSecretarias();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

async function loadGestorConfigIA() {
    try {
        const config = await apiRequest('/chat/config-ia');
        document.getElementById('gestorPromptIA').value = config.prompt_sistema;
    } catch (err) {
        console.warn('Configuração de IA ainda não existe, será inicializada no primeiro save.');
    }
}

document.getElementById('gestorConfigIAForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        prompt_sistema: document.getElementById('gestorPromptIA').value
    };

    const btn = document.getElementById('btnSaveConfigIA');
    btn.disabled = true;
    btn.textContent = 'Gravando...';

    try {
        await apiRequest('/chat/config-ia', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Prompt do Agente de IA salvo com sucesso!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Diretrizes de IA';
    }
});

// ==========================================================================
// FUNÇÕES DO PAINEL DE CHAT (SECRETÁRIA / ATENDIMENTO)
// ==========================================================================
async function loadChatContacts(autoSelectId = null) {
    try {
        const contatos = await apiRequest('/chat/contacts');
        const container = document.getElementById('chatContactsContainer');
        container.innerHTML = '';
        
        if (contatos.length === 0) {
            container.innerHTML = `<div class="chat-empty-state"><p>Nenhum lead recebido ainda.</p></div>`;
            return;
        }

        contatos.forEach(c => {
            const item = document.createElement('div');
            item.className = `chat-contact-item ${selectedContactId === c.id ? 'active' : ''}`;
            
            const badgeClass = c.ia_ativo ? 'badge-ia-on' : 'badge-ia-off';
            const badgeLabel = c.ia_ativo ? 'IA Ativa' : 'Mão Manual';

            item.innerHTML = `
                <div class="contact-avatar-placeholder">${c.nome.charAt(0).toUpperCase()}</div>
                <div class="contact-meta-info">
                    <div class="contact-name-line">
                        <h4>${c.nome}</h4>
                        <span class="contact-badge-label ${badgeClass}">${badgeLabel}</span>
                    </div>
                    <span class="contact-phone-sub">${c.whatsapp}</span>
                </div>
            `;
            
            item.addEventListener('click', () => selectContact(c.id, c.nome, c.whatsapp, c.ia_ativo));
            container.appendChild(item);
        });

        // Autoselecionar se especificado
        if (autoSelectId) {
            const target = contatos.find(c => c.id === autoSelectId);
            if (target) {
                selectContact(target.id, target.nome, target.whatsapp, target.ia_ativo);
            }
        }
    } catch (err) {
        console.error('Erro ao listar contatos de chat:', err);
    }
}

async function selectContact(contactId, name, whatsapp, iaAtivo) {
    selectedContactId = contactId;
    
    // Atualizar UI de seleção na barra lateral
    document.querySelectorAll('.chat-contact-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Resetar polling ativo anterior
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
    }

    // Configurar informações do cabeçalho do chat
    document.getElementById('chatClientName').textContent = name;
    document.getElementById('chatClientWhatsapp').textContent = whatsapp;
    document.getElementById('chatClientAvatar').textContent = name.charAt(0).toUpperCase();

    // Renderizar os botões corretos de Ação (Assumir / Liberar IA)
    renderChatActionButtons(iaAtivo);

    // Ocultar empty state e exibir área do chat
    document.getElementById('chatEmptyState').style.display = 'none';
    document.getElementById('chatActiveArea').style.display = 'flex';

    // Carregar histórico inicial
    await loadChatHistory(contactId);

    // Iniciar pooling de atualização do chat selecionado a cada 3 segundos
    chatPollingInterval = setInterval(() => {
        loadChatHistory(contactId, true); // true para background refresh silencioso
    }, 3000);
}

function renderChatActionButtons(iaAtivo) {
    const area = document.getElementById('chatStatusActionsArea');
    area.innerHTML = '';
    
    if (iaAtivo) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary btn-glow';
        btn.textContent = '🤖 Assumir Conversa';
        btn.addEventListener('click', () => assumirConversa());
        area.appendChild(btn);
    } else {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.textContent = '⚡ Devolver para IA';
        btn.addEventListener('click', () => liberarParaIA());
        area.appendChild(btn);
    }
}

async function loadChatHistory(contactId, isBackground = false) {
    if (selectedContactId !== contactId) return;

    try {
        const mensagens = await apiRequest(`/chat/messages/${contactId}`);
        const container = document.getElementById('chatHistoryContainer');
        
        // Verifica se há novas mensagens para evitar re-renderizar desnecessariamente
        const currentBubbleCount = container.querySelectorAll('.chat-bubble').length;
        if (isBackground && mensagens.length === currentBubbleCount) {
            return;
        }

        container.innerHTML = '';
        
        mensagens.forEach(msg => {
            const bubble = document.createElement('div');
            let typeClass = 'incoming';
            let senderLabel = '';
            
            if (msg.remetente === 'humano') {
                typeClass = 'outgoing-human';
                senderLabel = 'Você';
            } else if (msg.remetente === 'ia') {
                typeClass = 'outgoing-ia';
                senderLabel = 'IAI Assistente';
            } else {
                senderLabel = 'Cliente';
            }

            const time = new Date(msg.data_envio);
            const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

            bubble.className = `chat-bubble ${typeClass}`;
            bubble.innerHTML = `
                <span class="chat-sender-tag">${senderLabel}</span>
                <p>${escapeHTML(msg.texto)}</p>
                <span class="chat-bubble-time">${timeStr}</span>
            `;
            container.appendChild(bubble);
        });

        // Rolar o scroll do chat para baixo
        container.scrollTop = container.scrollHeight;
    } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
    }
}

async function assumirConversa() {
    try {
        await apiRequest(`/chat/send/${selectedContactId}`, {
            method: 'POST',
            body: JSON.stringify({ texto: '*Atendimento humano iniciado no painel*' })
        });
        showToast('Você assumiu a conversa. O robô de IA está desativado para este cliente.', 'info');
        loadChatContacts(selectedContactId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function liberarParaIA() {
    try {
        await apiRequest(`/chat/release/${selectedContactId}`, {
            method: 'POST'
        });
        showToast('Chat liberado. O robô de IA reassumiu as respostas automáticas.', 'success');
        loadChatContacts(selectedContactId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Envio de mensagem manual pela secretária
document.getElementById('chatSendForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chatMessageInput');
    const text = input.value;
    if (!text.trim() || !selectedContactId) return;

    try {
        await apiRequest(`/chat/send/${selectedContactId}`, {
            method: 'POST',
            body: JSON.stringify({ texto: text })
        });
        input.value = '';
        loadChatHistory(selectedContactId);
        loadChatContacts(selectedContactId);
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// SIMULAÇÃO DE LEAD MOCK (VIRTUAL CLIENT)
document.getElementById('btnSimulateLead').addEventListener('click', async () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const mockLead = {
        nome: `Lead Simulado #${randomId}`,
        whatsapp: `1199${randomId}4321`
    };

    try {
        // 1. Criar o contato na empresa do usuário
        const contato = await apiRequest('/chat/contacts', {
            method: 'POST',
            body: JSON.stringify(mockLead)
        });

        // 2. Simular uma mensagem do cliente entrando no WhatsApp
        // Faremos 2 simulações baseadas em gatilhos para mostrar a IA respondendo
        const mockQuestions = [
            "Olá! Gostaria de saber qual o preço da mensalidade e planos de vocês.",
            "Boa tarde! Quero saber se vocês têm integração com a Kiwify e Hotmart.",
            "Oi, como funciona o painel de atendimento da IAI Soluções?"
        ];
        const randomQuestion = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];

        // Dispara o mock-receive no backend
        await apiRequest(`/chat/mock-receive/${contato.id}`, {
            method: 'POST',
            body: JSON.stringify({ texto: randomQuestion })
        });

        showToast(`Novo contato virtual simulado com sucesso: ${contato.nome}`, 'success');
        
        // Atualiza e autoseleciona o contato simulado
        loadChatContacts(contato.id);

    } catch (err) {
        showToast('Erro ao rodar simulação: ' + err.message, 'error');
    }
});

// Helper para escapar HTML e evitar XSS
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// ==========================================================================
// INICIALIZAÇÃO E LISTENER DE ROTA
// ==========================================================================
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);
