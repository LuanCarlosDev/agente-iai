'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = 'http://localhost:8000/api';

interface UserInfo {
  id: number;
  nome: string;
  email: string;
  role: 'adm' | 'gestor' | 'secretaria';
  empresa_id: number | null;
  data_criacao: string;
}

interface Empresa {
  id: number;
  nome: string;
  cnpj: string | null;
  data_criacao: string;
}

interface Contato {
  id: number;
  nome: string;
  whatsapp: string;
  status: 'lead' | 'qualificado' | 'atendimento_humano' | 'concluido';
  ia_ativo: boolean;
  empresa_id: number;
  data_criacao: string;
}

interface Mensagem {
  id: number;
  contato_id: number;
  remetente: 'cliente' | 'ia' | 'humano';
  texto: string;
  data_envio: string;
}

export default function AppPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Autenticação e Estados Globais
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'cadastro' | 'dashboard'>('login');
  const [subView, setSubView] = useState<'adm-empresas' | 'adm-usuarios' | 'gestor-metrics' | 'gestor-ia' | 'chat'>('chat');

  // Notificações Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });

  // Listas de Dados
  const [admCompanies, setAdmCompanies] = useState<Empresa[]>([]);
  const [admUsers, setAdmUsers] = useState<UserInfo[]>([]);
  const [gestorSecretaries, setGestorSecretaries] = useState<UserInfo[]>([]);
  const [gestorMetrics, setGestorMetrics] = useState({ contatos: 0, chatAtivos: 0 });
  const [iaPrompt, setIaPrompt] = useState('');
  const [saveIaLoading, setSaveIaLoading] = useState(false);

  // Estados de Formulários de Login/Cadastro
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [cadNome, setCadNome] = useState('');
  const [cadEmail, setCadEmail] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [cadEmpresa, setCadEmpresa] = useState('');

  // Estados de Formulários ADM
  const [admEmpresaNome, setAdmEmpresaNome] = useState('');
  const [admEmpresaCnpj, setAdmEmpresaCnpj] = useState('');
  const [admUserNome, setAdmUserNome] = useState('');
  const [admUserEmail, setAdmUserEmail] = useState('');
  const [admUserSenha, setAdmUserSenha] = useState('');
  const [admUserRole, setAdmUserRole] = useState<'gestor' | 'secretaria'>('gestor');
  const [admUserEmpresa, setAdmUserEmpresa] = useState('');

  // Estados de Formulários Gestor
  const [secNome, setSecNome] = useState('');
  const [secEmail, setSecEmail] = useState('');
  const [secSenha, setSecSenha] = useState('');

  // Estados de Chat
  const [chatContacts, setChatContacts] = useState<Contato[]>([]);
  const [searchContactQuery, setSearchContactQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contato | null>(null);
  const [chatMessages, setChatMessages] = useState<Mensagem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatHistoryContainerRef = useRef<HTMLDivElement>(null);
  const chatPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Exibir Toast
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: null });
    }, 4000);
  }, []);

  // Requisição Genérica de API
  const apiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = currentToken || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers || {}) as Record<string, string>)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (res.status === 401) {
      handleLogout();
      showToast('Sua sessão expirou. Faça login novamente.', 'error');
      throw new Error('Sessão expirada.');
    }

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Ocorreu um erro no servidor.');
    }

    const text = await res.text();
    return text ? JSON.parse(text) : true;
  }, [currentToken, showToast]);

  // Logout do Sistema
  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
    }
    setCurrentUser(null);
    setCurrentToken(null);
    setSelectedContact(null);
    setChatMessages([]);
    if (chatPollingRef.current) {
      clearInterval(chatPollingRef.current);
      chatPollingRef.current = null;
    }
    setView('login');
  }, []);

  // Redirecionamento Padrão de Acordo com Perfil
  const redirectBasedOnRole = useCallback((user: UserInfo) => {
    if (user.role === 'adm') {
      setSubView('adm-empresas');
    } else if (user.role === 'gestor') {
      setSubView('gestor-metrics');
    } else {
      setSubView('chat');
    }
    setView('dashboard');
  }, []);

  // Efeito de Montagem e Persistência de Sessão
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user_info');
      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser) as UserInfo;
        setCurrentToken(savedToken);
        setCurrentUser(parsedUser);
        setView('dashboard');
        // Redireciona
        if (parsedUser.role === 'adm') {
          setSubView('adm-empresas');
        } else if (parsedUser.role === 'gestor') {
          setSubView('gestor-metrics');
        } else {
          setSubView('chat');
        }
      }
    }
  }, []);

  // Carregar Dados da View Ativa
  useEffect(() => {
    if (view !== 'dashboard' || !currentUser) return;

    if (subView === 'adm-empresas') {
      loadAdmCompanies();
    } else if (subView === 'adm-usuarios') {
      loadAdmUsers();
    } else if (subView === 'gestor-metrics') {
      loadGestorMetrics();
      loadGestorSecretaries();
    } else if (subView === 'gestor-ia') {
      loadGestorPromptIA();
    } else if (subView === 'chat') {
      loadChatContacts();
    }
  }, [view, subView, currentUser]);

  // Efeito de Polling do Chat
  useEffect(() => {
    if (view === 'dashboard' && subView === 'chat' && selectedContact) {
      // Iniciar polling a cada 3 segundos
      chatPollingRef.current = setInterval(() => {
        loadChatHistorySilent(selectedContact.id);
      }, 3000);
    } else {
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current);
        chatPollingRef.current = null;
      }
    }

    return () => {
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current);
        chatPollingRef.current = null;
      }
    };
  }, [view, subView, selectedContact]);

  // Rolar Histórico para Baixo
  useEffect(() => {
    if (chatHistoryContainerRef.current) {
      chatHistoryContainerRef.current.scrollTop = chatHistoryContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ==========================================
  // OPERAÇÕES DE AUTENTICAÇÃO
  // ==========================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, senha: loginSenha })
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('user_info', JSON.stringify(res.user_info));
      }
      setCurrentToken(res.access_token);
      setCurrentUser(res.user_info);
      showToast(`Bem-vindo, ${res.user_info.nome}!`, 'success');
      redirectBasedOnRole(res.user_info);
    } catch (err: any) {
      showToast(err.message || 'Erro ao realizar login.', 'error');
    }
  };

  const handleCadastroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nome: cadNome,
          email: cadEmail,
          senha: cadSenha,
          nome_empresa: cadEmpresa,
          role: 'gestor'
        })
      });
      showToast('Empresa e conta criados com sucesso! Faça login.', 'success');
      setView('login');
      setLoginEmail(cadEmail);
      setCadNome('');
      setCadEmail('');
      setCadSenha('');
      setCadEmpresa('');
    } catch (err: any) {
      showToast(err.message || 'Erro ao realizar cadastro.', 'error');
    }
  };

  // ==========================================
  // OPERAÇÕES DO ADM
  // ==========================================
  const loadAdmCompanies = async () => {
    try {
      const data = await apiRequest('/empresa/');
      setAdmCompanies(data);
    } catch (err: any) {
      showToast('Erro ao carregar empresas: ' + err.message, 'error');
    }
  };

  const handleAdmCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/empresa/', {
        method: 'POST',
        body: JSON.stringify({ nome: admEmpresaNome, cnpj: admEmpresaCnpj || null })
      });
      showToast('Nova empresa criada com sucesso!', 'success');
      setAdmEmpresaNome('');
      setAdmEmpresaCnpj('');
      loadAdmCompanies();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const loadAdmUsers = async () => {
    try {
      const data = await apiRequest('/empresa/usuarios');
      setAdmUsers(data);
      // Recarregar empresas para popular select do form
      const comps = await apiRequest('/empresa/');
      setAdmCompanies(comps);
    } catch (err: any) {
      showToast('Erro ao carregar auditoria de usuários: ' + err.message, 'error');
    }
  };

  const handleAdmCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/empresa/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nome: admUserNome,
          email: admUserEmail,
          senha: admUserSenha,
          role: admUserRole,
          empresa_id: parseInt(admUserEmpresa) || null
        })
      });
      showToast('Novo usuário cadastrado com sucesso!', 'success');
      setAdmUserNome('');
      setAdmUserEmail('');
      setAdmUserSenha('');
      setAdmUserRole('gestor');
      setAdmUserEmpresa('');
      loadAdmUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // OPERAÇÕES DO GESTOR
  // ==========================================
  const loadGestorMetrics = async () => {
    try {
      const contatos = await apiRequest('/chat/contacts');
      const chatAtivos = contatos.filter((c: Contato) => !c.ia_ativo).length;
      setGestorMetrics({ contatos: contatos.length, chatAtivos });
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    }
  };

  const loadGestorSecretaries = async () => {
    try {
      const data = await apiRequest('/chat/secretarias');
      setGestorSecretaries(data);
    } catch (err: any) {
      showToast('Erro ao carregar equipe: ' + err.message, 'error');
    }
  };

  const handleGestorCreateSecretary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await apiRequest('/chat/secretarias', {
        method: 'POST',
        body: JSON.stringify({
          nome: secNome,
          email: secEmail,
          senha: secSenha,
          role: 'secretaria',
          empresa_id: currentUser.empresa_id
        })
      });
      showToast('Nova secretária cadastrada na sua equipe!', 'success');
      setSecNome('');
      setSecEmail('');
      setSecSenha('');
      loadGestorSecretaries();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const loadGestorPromptIA = async () => {
    try {
      const config = await apiRequest('/chat/config-ia');
      setIaPrompt(config.prompt_sistema || '');
    } catch (err) {
      console.warn('Configuração de IA ainda não existe, será criada no primeiro save.');
    }
  };

  const handleGestorSaveConfigIA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveIaLoading(true);
    try {
      await apiRequest('/chat/config-ia', {
        method: 'POST',
        body: JSON.stringify({ prompt_sistema: iaPrompt })
      });
      showToast('Prompt do Agente de IA salvo com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaveIaLoading(false);
    }
  };

  // ==========================================
  // OPERAÇÕES DO CHAT & WHATSAPP
  // ==========================================
  const loadChatContacts = async (autoSelectId?: number) => {
    try {
      const contatos = await apiRequest('/chat/contacts');
      setChatContacts(contatos);
      if (autoSelectId) {
        const target = contatos.find((c: Contato) => c.id === autoSelectId);
        if (target) setSelectedContact(target);
      }
    } catch (err) {
      console.error('Erro ao listar contatos de chat:', err);
    }
  };

  const handleSelectContact = async (c: Contato) => {
    setSelectedContact(c);
    setChatMessages([]);
    try {
      const msgs = await apiRequest(`/chat/messages/${c.id}`);
      setChatMessages(msgs);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  const loadChatHistorySilent = async (contactId: number) => {
    try {
      const msgs = await apiRequest(`/chat/messages/${contactId}`);
      setChatMessages(prev => {
        if (msgs.length !== prev.length) {
          return msgs;
        }
        return prev;
      });
    } catch (err) {
      console.error('Erro ao recarregar mensagens:', err);
    }
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedContact) return;
    const textToSend = chatInput;
    setChatInput('');
    try {
      await apiRequest(`/chat/send/${selectedContact.id}`, {
        method: 'POST',
        body: JSON.stringify({ texto: textToSend })
      });
      // Atualiza imediato
      const msgs = await apiRequest(`/chat/messages/${selectedContact.id}`);
      setChatMessages(msgs);
      loadChatContacts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAssumirConversa = async () => {
    if (!selectedContact) return;
    try {
      await apiRequest(`/chat/send/${selectedContact.id}`, {
        method: 'POST',
        body: JSON.stringify({ texto: '*Atendimento humano iniciado no painel*' })
      });
      showToast('Você assumiu a conversa. O robô de IA está desativado para este cliente.', 'info');
      // Recarrega contatos e atualiza ia_ativo
      const contatos = await apiRequest('/chat/contacts');
      setChatContacts(contatos);
      const updated = contatos.find((c: Contato) => c.id === selectedContact.id);
      if (updated) setSelectedContact(updated);
      // Recarrega mensagens
      const msgs = await apiRequest(`/chat/messages/${selectedContact.id}`);
      setChatMessages(msgs);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleLiberarParaIA = async () => {
    if (!selectedContact) return;
    try {
      await apiRequest(`/chat/release/${selectedContact.id}`, {
        method: 'POST'
      });
      showToast('Chat liberado. O robô de IA reassumiu as respostas automáticas.', 'success');
      // Recarrega contatos e atualiza ia_ativo
      const contatos = await apiRequest('/chat/contacts');
      setChatContacts(contatos);
      const updated = contatos.find((c: Contato) => c.id === selectedContact.id);
      if (updated) setSelectedContact(updated);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSimulateLead = async () => {
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
      const mockQuestions = [
        "Olá! Gostaria de saber qual o preço da mensalidade e planos de vocês.",
        "Boa tarde! Quero saber se vocês têm integração com a Kiwify e Hotmart.",
        "Oi, como funciona o painel de atendimento da IAI Soluções?"
      ];
      const randomQuestion = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];

      await apiRequest(`/chat/mock-receive/${contato.id}`, {
        method: 'POST',
        body: JSON.stringify({ texto: randomQuestion })
      });

      showToast(`Novo contato virtual simulado com sucesso: ${contato.nome}`, 'success');
      
      // Listar contatos e selecionar o novo
      loadChatContacts(contato.id);
    } catch (err: any) {
      showToast('Erro ao rodar simulação: ' + err.message, 'error');
    }
  };

  if (!isMounted) return null;

  // Filtragem de contatos de chat
  const filteredContacts = chatContacts.filter(c => 
    c.nome.toLowerCase().includes(searchContactQuery.toLowerCase()) || 
    c.whatsapp.includes(searchContactQuery)
  );

  return (
    <div id="appContainer">
      {/* Toast Alert */}
      {toast.type && (
        <div id="toastNotification" className={`toast ${toast.type}`} style={{ display: 'block' }}>
          {toast.message}
        </div>
      )}

      {/* Background Blurs */}
      <div className="bg-blur blur-1"></div>
      <div className="bg-blur blur-2"></div>

      {/* ==========================================
           TELA DE LOGIN
           ========================================== */}
      {view === 'login' && (
        <div id="view-login" className="auth-view" style={{ position: 'relative' }}>
          <a href="/" className="btn btn-secondary" style={{ position: 'absolute', top: '24px', left: '24px', padding: '8px 16px', fontSize: '13.5px', textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Voltar para o início
          </a>
          <div className="auth-card glass-card">
            <div className="logo center">
              <div className="logo-icon"></div>
              <span className="logo-text">iai <span>soluções</span></span>
            </div>
            <h2>Conectar ao Painel</h2>
            <p className="auth-subtitle">Entre com suas credenciais de acesso</p>
            
            <form id="loginForm" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="loginEmail">E-mail Corporativo</label>
                <input 
                  type="email" 
                  id="loginEmail" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required 
                  placeholder="nome@empresa.com" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="loginSenha">Senha</label>
                <input 
                  type="password" 
                  id="loginSenha" 
                  value={loginSenha}
                  onChange={(e) => setLoginSenha(e.target.value)}
                  required 
                  placeholder="Sua senha" 
                />
              </div>
              <button type="submit" className="btn btn-primary full-width">Entrar</button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
           TELA DE CADASTRO
           ========================================== */}
      {view === 'cadastro' && (
        <div id="view-cadastro" className="auth-view">
          <div className="auth-card glass-card">
            <div className="logo center">
              <div className="logo-icon"></div>
              <span className="logo-text">iai <span>soluções</span></span>
            </div>
            <h2>Cadastrar Empresa</h2>
            <p className="auth-subtitle">Crie uma conta administrativa para o seu negócio</p>
            
            <form id="cadastroForm" onSubmit={handleCadastroSubmit}>
              <div className="form-group">
                <label htmlFor="cadNome">Seu Nome Completo</label>
                <input 
                  type="text" 
                  id="cadNome" 
                  value={cadNome}
                  onChange={(e) => setCadNome(e.target.value)}
                  required 
                  placeholder="Ex: Rodrigo Silva" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="cadEmail">E-mail de Acesso</label>
                <input 
                  type="email" 
                  id="cadEmail" 
                  value={cadEmail}
                  onChange={(e) => setCadEmail(e.target.value)}
                  required 
                  placeholder="Ex: rodrigo@suaempresa.com" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="cadSenha">Senha (mínimo 6 caracteres)</label>
                <input 
                  type="password" 
                  id="cadSenha" 
                  value={cadSenha}
                  onChange={(e) => setCadSenha(e.target.value)}
                  required 
                  minLength={6} 
                  placeholder="Crie uma senha forte" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="cadEmpresa">Nome da Empresa</label>
                <input 
                  type="text" 
                  id="cadEmpresa" 
                  value={cadEmpresa}
                  onChange={(e) => setCadEmpresa(e.target.value)}
                  required 
                  placeholder="Ex: Rodrigo Vendas Ltda" 
                />
              </div>
              <button type="submit" className="btn btn-primary full-width">Criar Conta e Empresa</button>
            </form>
            <div className="auth-footer">
              <span>Já possui cadastro? </span><a href="#login" onClick={(e) => { e.preventDefault(); setView('login'); }}>Ir para o Login</a>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
           PAINEL INTERNO (DASHBOARD)
           ========================================== */}
      {view === 'dashboard' && currentUser && (
        <div id="view-dashboard" className="app-layout">
          {/* Sidebar */}
          <aside className="sidebar glass-card">
            <div className="sidebar-header">
              <div className="logo">
                <div className="logo-icon"></div>
                <span className="logo-text">iai <span>soluções</span></span>
              </div>
              <div className="user-profile-badge">
                <div className="user-avatar">{currentUser.nome.charAt(0).toUpperCase()}</div>
                <div className="user-meta">
                  <span className="user-name">{currentUser.nome}</span>
                  <span className="user-role-label">Perfil: {currentUser.role}</span>
                </div>
              </div>
            </div>
            <nav className="sidebar-nav">
              {/* Links ADM */}
              {currentUser.role === 'adm' && (
                <div className="nav-section-group" id="nav-group-adm">
                  <span className="nav-section-title">Administração Geral</span>
                  <button 
                    onClick={() => setSubView('adm-empresas')}
                    className={`nav-link ${subView === 'adm-empresas' ? 'active' : ''}`}
                    style={{ background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                  >
                    Empresas Clientes
                  </button>
                  <button 
                    onClick={() => setSubView('adm-usuarios')}
                    className={`nav-link ${subView === 'adm-usuarios' ? 'active' : ''}`}
                    style={{ background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                  >
                    Auditoria Usuários
                  </button>
                </div>
              )}
              
              {/* Links Gestor */}
              {currentUser.role === 'gestor' && (
                <div className="nav-section-group" id="nav-group-gestor">
                  <span className="nav-section-title">Configurações Empresa</span>
                  <button 
                    onClick={() => setSubView('gestor-metrics')}
                    className={`nav-link ${subView === 'gestor-metrics' ? 'active' : ''}`}
                    style={{ background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                  >
                    Métricas & Equipe
                  </button>
                  <button 
                    onClick={() => setSubView('gestor-ia')}
                    className={`nav-link ${subView === 'gestor-ia' ? 'active' : ''}`}
                    style={{ background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                  >
                    Configurações de IA
                  </button>
                </div>
              )}

              {/* Links Comuns (Secretária & Gestor) */}
              {(currentUser.role === 'secretaria' || currentUser.role === 'gestor') && (
                <div className="nav-section-group" id="nav-group-secretaria">
                  <span className="nav-section-title">Operação de Chat</span>
                  <button 
                    onClick={() => setSubView('chat')}
                    className={`nav-link ${subView === 'chat' ? 'active' : ''}`}
                    style={{ background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                  >
                    Live Chat WhatsApp
                  </button>
                </div>
              )}
            </nav>
            <div className="sidebar-footer">
              <button className="btn-logout" id="btnLogout" onClick={handleLogout}>Sair do Sistema</button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="main-content">
            
            {/* ==========================================
                 PAINEL ADM - VISÃO GERAL EMPRESAS
                 ========================================== */}
            {subView === 'adm-empresas' && currentUser.role === 'adm' && (
              <div id="panel-adm" className="view-panel" style={{ display: 'flex' }}>
                <div className="panel-header">
                  <h1>Empresas Clientes</h1>
                  <p>Gestão global das contas comerciais inquilinas da plataforma IAI Soluções</p>
                </div>

                <div className="panel-grid-two">
                  {/* Form de criação */}
                  <div className="glass-card panel-card padding-lg">
                    <h3>Cadastrar Empresa Parceira</h3>
                    <form id="admCreateEmpresaForm" onSubmit={handleAdmCreateCompany}>
                      <div className="form-group">
                        <label htmlFor="admEmpresaNome">Razão Social / Nome Fantasia</label>
                        <input 
                          type="text" 
                          id="admEmpresaNome" 
                          value={admEmpresaNome}
                          onChange={(e) => setAdmEmpresaNome(e.target.value)}
                          required 
                          placeholder="Ex: Acme Corp" 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="admEmpresaCnpj">CNPJ (Opcional)</label>
                        <input 
                          type="text" 
                          id="admEmpresaCnpj" 
                          value={admEmpresaCnpj}
                          onChange={(e) => setAdmEmpresaCnpj(e.target.value)}
                          placeholder="00.000.000/0001-00" 
                        />
                      </div>
                      <button type="submit" className="btn btn-primary">Cadastrar Empresa</button>
                    </form>
                  </div>
                  
                  {/* Lista */}
                  <div className="glass-card panel-card padding-lg">
                    <h3>Empresas Cadastradas</h3>
                    <div className="table-wrapper">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Razão Social</th>
                            <th>CNPJ</th>
                            <th>Criação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admCompanies.map((emp) => (
                            <tr key={emp.id}>
                              <td><strong>#{emp.id}</strong></td>
                              <td>{emp.nome}</td>
                              <td>{emp.cnpj || 'Não cadastrado'}</td>
                              <td>{new Date(emp.data_criacao).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {admCompanies.length === 0 && (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center' }}>Nenhuma empresa parceira cadastrada.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                 PAINEL ADM - AUDITORIA DE USUÁRIOS
                 ========================================== */}
            {subView === 'adm-usuarios' && currentUser.role === 'adm' && (
              <div id="panel-adm-usuarios" className="view-panel" style={{ display: 'flex' }}>
                <div className="panel-header">
                  <h1>Auditoria de Usuários</h1>
                  <p>Visualização e controle de contas cadastradas na base global da plataforma</p>
                </div>

                <div className="panel-grid-two">
                  {/* Form */}
                  <div className="glass-card panel-card padding-lg">
                    <h3>Cadastrar Novo Usuário</h3>
                    <p className="section-card-desc">Crie contas de Gestor ou Secretária e as vincule a qualquer empresa parceira comercial do sistema.</p>
                    <form id="admCreateUserForm" onSubmit={handleAdmCreateUser}>
                      <div className="form-group">
                        <label htmlFor="admUserNome">Nome Completo</label>
                        <input 
                          type="text" 
                          id="admUserNome" 
                          value={admUserNome}
                          onChange={(e) => setAdmUserNome(e.target.value)}
                          required 
                          placeholder="Ex: Júlia Santos" 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="admUserEmail">E-mail Comercial</label>
                        <input 
                          type="email" 
                          id="admUserEmail" 
                          value={admUserEmail}
                          onChange={(e) => setAdmUserEmail(e.target.value)}
                          required 
                          placeholder="Ex: julia@empresa.com" 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="admUserSenha">Senha de Acesso</label>
                        <input 
                          type="password" 
                          id="admUserSenha" 
                          value={admUserSenha}
                          onChange={(e) => setAdmUserSenha(e.target.value)}
                          required 
                          minLength={6} 
                          placeholder="Mínimo 6 caracteres" 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="admUserRole">Perfil do Usuário (Role)</label>
                        <select 
                          id="admUserRole" 
                          value={admUserRole} 
                          onChange={(e) => setAdmUserRole(e.target.value as any)}
                          required
                        >
                          <option value="gestor">Gestor (Controle total da empresa)</option>
                          <option value="secretaria">Secretária (Acesso exclusivo ao chat)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="admUserEmpresa">Empresa Associada</label>
                        <select 
                          id="admUserEmpresa" 
                          value={admUserEmpresa} 
                          onChange={(e) => setAdmUserEmpresa(e.target.value)}
                          required
                        >
                          <option value="">Selecione uma empresa...</option>
                          {admCompanies.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nome} (ID #{emp.id})</option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="btn btn-primary">Cadastrar Usuário</button>
                    </form>
                  </div>

                  {/* Tabela de auditoria */}
                  <div className="glass-card panel-card padding-lg">
                    <h3>Usuários Ativos</h3>
                    <div className="table-wrapper">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Perfil (Role)</th>
                            <th>Empresa ID</th>
                            <th>Data Cadastro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admUsers.map((user) => (
                            <tr key={user.id}>
                              <td><strong>#{user.id}</strong></td>
                              <td>{user.nome}</td>
                              <td>{user.email}</td>
                              <td><span className="user-role-label">{user.role}</span></td>
                              <td>{user.empresa_id || 'Global (ADM)'}</td>
                              <td>{new Date(user.data_criacao).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                 PAINEL GESTOR - MÉTRICAS & SECRETÁRIAS
                 ========================================== */}
            {subView === 'gestor-metrics' && currentUser.role === 'gestor' && (
              <div id="panel-gestor" className="view-panel" style={{ display: 'flex' }}>
                <div className="panel-header">
                  <h1>Métricas e Equipe</h1>
                  <p>Gerencie as secretárias e acompanhe a volumetria de atendimento</p>
                </div>

                {/* Métricas */}
                <div className="metrics-grid">
                  <div className="metric-card glass-card">
                    <span className="m-title">Total de Contatos</span>
                    <span className="m-value" id="gestorMetricContatos">{gestorMetrics.contatos}</span>
                  </div>
                  <div className="metric-card glass-card">
                    <span className="m-title">Atendimentos no Chat</span>
                    <span className="m-value" id="gestorMetricChatAtivo">{gestorMetrics.chatAtivos}</span>
                  </div>
                  <div className="metric-card glass-card">
                    <span className="m-title">Status da IA</span>
                    <span className="m-value color-emerald">Online</span>
                  </div>
                </div>

                <div className="panel-grid-two margin-top-lg">
                  {/* Form criar secretária */}
                  <div className="glass-card panel-card padding-lg">
                    <h3>Cadastrar Nova Secretária</h3>
                    <p className="section-card-desc">Crie acessos exclusivos de atendimento para a sua equipe comercial.</p>
                    <form id="gestorCreateSecretariaForm" onSubmit={handleGestorCreateSecretary}>
                      <div className="form-group">
                        <label htmlFor="secNome">Nome Completo</label>
                        <input 
                          type="text" 
                          id="secNome" 
                          value={secNome}
                          onChange={(e) => setSecNome(e.target.value)}
                          required 
                          placeholder="Ex: Júlia Maria" 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="secEmail">E-mail Comercial</label>
                        <input 
                          type="email" 
                          id="secEmail" 
                          value={secEmail}
                          onChange={(e) => setSecEmail(e.target.value)}
                          required 
                          placeholder="julia@empresa.com" 
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="secSenha">Senha Temporária</label>
                        <input 
                          type="password" 
                          id="secSenha" 
                          value={secSenha}
                          onChange={(e) => setSecSenha(e.target.value)}
                          required 
                          minLength={6} 
                          placeholder="Mínimo 6 dígitos" 
                        />
                      </div>
                      <button type="submit" className="btn btn-primary">Cadastrar Secretária</button>
                    </form>
                  </div>

                  {/* Lista equipe */}
                  <div className="glass-card panel-card padding-lg">
                    <h3>Secretárias da Sua Equipe</h3>
                    <div className="table-wrapper">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Cadastro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gestorSecretaries.map((sec) => (
                            <tr key={sec.id}>
                              <td>{sec.nome}</td>
                              <td>{sec.email}</td>
                              <td>{new Date(sec.data_criacao).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {gestorSecretaries.length === 0 && (
                            <tr>
                              <td colSpan={3} style={{ textAlign: 'center' }}>Nenhuma secretária cadastrada ainda.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                 PAINEL GESTOR - CONFIGURAÇÃO DE IA
                 ========================================== */}
            {subView === 'gestor-ia' && currentUser.role === 'gestor' && (
              <div id="panel-gestor-ia" className="view-panel" style={{ display: 'flex' }}>
                <div className="panel-header">
                  <h1>Configurações do Agente de IA</h1>
                  <p>Personalize as diretrizes, tom de voz e conhecimento que a inteligência artificial utilizará no WhatsApp</p>
                </div>

                <div className="glass-card panel-card padding-lg max-width-md">
                  <h3>Diretrizes e Regras de Atendimento do Robô</h3>
                  <p className="section-card-desc">As instruções abaixo moldam o comportamento do Agente IA quando ele interage com novos leads.</p>
                  
                  <form id="gestorConfigIAForm" onSubmit={handleGestorSaveConfigIA}>
                    <div className="form-group">
                      <label htmlFor="gestorPromptIA">Instruções do System (System Prompt)</label>
                      <textarea 
                        id="gestorPromptIA" 
                        value={iaPrompt}
                        onChange={(e) => setIaPrompt(e.target.value)}
                        required 
                        placeholder="Defina as regras, tom de voz, preços e produtos da sua empresa para treinar o bot..."
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" id="btnSaveConfigIA" disabled={saveIaLoading}>
                      <span>{saveIaLoading ? 'Gravando...' : 'Salvar Diretrizes de IA'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ==========================================
                 PAINEL OPERACIONAL - CHAT LIVE
                 ========================================== */}
            {subView === 'chat' && (currentUser.role === 'secretaria' || currentUser.role === 'gestor') && (
              <div id="panel-chat" className="view-panel" style={{ display: 'flex' }}>
                <div className="panel-header chat-header-split">
                  <div>
                    <h1>Live Chat WhatsApp</h1>
                    <p>Monitore e atenda contatos no WhatsApp em tempo real</p>
                  </div>
                  <div className="chat-header-actions">
                    <button className="btn btn-secondary btn-glow" id="btnSimulateLead" onClick={handleSimulateLead}>Simular Novo Lead</button>
                  </div>
                </div>

                <div className="chat-interface glass-card">
                  {/* Lateral esquerda: Contatos */}
                  <div className="chat-sidebar">
                    <div className="chat-sidebar-search">
                      <input 
                        type="text" 
                        placeholder="Filtrar conversas..." 
                        value={searchContactQuery}
                        onChange={(e) => setSearchContactQuery(e.target.value)}
                        id="searchChatContacts" 
                      />
                    </div>
                    <div className="chat-contacts-list" id="chatContactsContainer">
                      {filteredContacts.map((c) => (
                        <div 
                          key={c.id} 
                          onClick={() => handleSelectContact(c)}
                          className={`chat-contact-item ${selectedContact?.id === c.id ? 'active' : ''}`}
                        >
                          <div className="contact-avatar-placeholder">{c.nome.charAt(0).toUpperCase()}</div>
                          <div className="contact-meta-info">
                            <div className="contact-name-line">
                              <h4>{c.nome}</h4>
                              <span className={`contact-badge-label ${c.ia_ativo ? 'badge-ia-on' : 'badge-ia-off'}`}>
                                {c.ia_ativo ? 'IA Ativa' : 'Mão Manual'}
                              </span>
                            </div>
                            <span className="contact-phone-sub">{c.whatsapp}</span>
                          </div>
                        </div>
                      ))}
                      {filteredContacts.length === 0 && (
                        <div className="chat-empty-state">
                          <p>Nenhum contato encontrado.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Área direita: Conversa ativa */}
                  <div className="chat-workspace">
                    {!selectedContact ? (
                      <div className="chat-empty-state" id="chatEmptyState">
                        <div className="chat-empty-icon"></div>
                        <h3>Nenhuma conversa selecionada</h3>
                        <p>Selecione um cliente ao lado para ver o histórico de conversas e assumir o atendimento se necessário.</p>
                      </div>
                    ) : (
                      <div className="chat-active-area" id="chatActiveArea">
                        {/* Header Chat */}
                        <div className="chat-active-header">
                          <div className="client-info">
                            <div className="client-avatar">{selectedContact.nome.charAt(0).toUpperCase()}</div>
                            <div className="client-details">
                              <span className="client-name">{selectedContact.nome}</span>
                              <span className="client-whatsapp">{selectedContact.whatsapp}</span>
                            </div>
                          </div>
                          <div className="client-status-actions" id="chatStatusActionsArea">
                            {selectedContact.ia_ativo ? (
                              <button className="btn btn-secondary btn-glow" onClick={handleAssumirConversa}>
                                Assumir Conversa
                              </button>
                            ) : (
                              <button className="btn btn-primary" onClick={handleLiberarParaIA}>
                                Devolver para IA
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Histórico mensagens */}
                        <div className="chat-history-body" id="chatHistoryContainer" ref={chatHistoryContainerRef}>
                          {chatMessages.map((msg) => {
                            let typeClass = 'incoming';
                            let senderLabel = 'Cliente';
                            if (msg.remetente === 'humano') {
                              typeClass = 'outgoing-human';
                              senderLabel = 'Você';
                            } else if (msg.remetente === 'ia') {
                              typeClass = 'outgoing-ia';
                              senderLabel = 'IAI Assistente';
                            }

                            const date = new Date(msg.data_envio);
                            const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

                            return (
                              <div key={msg.id} className={`chat-bubble ${typeClass}`}>
                                <span className="chat-sender-tag">{senderLabel}</span>
                                <p>{msg.texto}</p>
                                <span className="chat-bubble-time">{timeStr}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Input footer */}
                        <form className="chat-input-footer" id="chatSendForm" onSubmit={handleChatSend}>
                          <input 
                            type="text" 
                            id="chatMessageInput" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Digite sua resposta manual..." 
                            autoComplete="off" 
                            required 
                          />
                          <button type="submit" className="btn-chat-send" aria-label="Enviar mensagem manual">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
