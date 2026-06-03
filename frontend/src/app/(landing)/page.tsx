'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function LandingPage() {
  // Estado para Menu Mobile
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estado para Preços (Mensal vs Anual)
  const [isAnnual, setIsAnnual] = useState(false);

  // Estado para Abas do Dashboard Mockup (Hero)
  const [activeTab, setActiveTab] = useState<'atendimentos' | 'crm' | 'agentes'>('atendimentos');
  const [userInteractedWithMockup, setUserInteractedWithMockup] = useState(false);

  // Estado para FAQ Accordion
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // Estados do Simulador de WhatsApp
  const [waMessages, setWaMessages] = useState<Array<{ text: string; isOutgoing: boolean; time: string; isSystem?: boolean }>>([
    {
      text: 'Este é o simulador de atendimento comercial da IAI. Digite uma mensagem ou selecione as sugestões acima.',
      isOutgoing: false,
      time: '',
      isSystem: true
    },
    {
      text: 'Olá! Gostaria de saber como a inteligência artificial de vocês atende os clientes de forma humanizada.',
      isOutgoing: false,
      time: '09:00'
    },
    {
      text: 'Olá! Excelente pergunta. A nossa IA não segue fluxos tradicionais baseados em números. Ela compreende o significado das frases e o contexto da conversa. Além disso, ela utiliza informações que você fornece (como catálogos de produtos e FAQs) para responder com naturalidade e sempre orientada a fechar vendas. Experimente me perguntar algo específico!',
      isOutgoing: true,
      time: '09:01'
    }
  ]);
  const [waInput, setWaInput] = useState('');
  const [waIsTyping, setWaIsTyping] = useState(false);
  const waChatBodyRef = useRef<HTMLDivElement>(null);

  // Respostas pré-definidas do Simulador
  const simulatorReplies: Record<string, string> = {
    "Como a IAI Soluções funciona?": "A IAI Soluções funciona de forma simples: conectamos o seu número de WhatsApp corporativo à nossa plataforma em nuvem. A partir daí, nossa Inteligência Artificial analisa cada conversa recebida e, com base nas regras e manuais que você cadastrar, atende, responde dúvidas e qualifica o cliente sozinho. Se ele quiser falar com um humano, a IA o transfere de forma inteligente para a sua equipe, que atende no mesmo painel unificado.",
    "O sistema evita bloqueios de chip?": "Sim, com certeza! Desenvolvemos o algoritmo **IAI SafeAntiBan**, que atua de três formas: 1) Insere delays aleatórios entre as mensagens enviadas; 2) Cria variações gramaticais únicas usando nossa IA Generativa em cada envio (evitando que o WhatsApp detecte mensagens repetidas idênticas); 3) Realiza uma cadência de aquecimento de chip. Isso garante a máxima segurança para as suas campanhas de vendas.",
    "Quais são as integrações disponíveis?": "Nós temos integração nativa com as principais plataformas do mercado nacional e internacional: Kiwify, Hotmart, Monetizze, ActiveCampaign, HubSpot, Shopify, RD Station, Bling, e muitas outras. Além disso, disponibilizam uma API REST documentada completa e Webhooks de entrada/saída, permitindo conectar a IAI Soluções com qualquer sistema ou CRM do planeta."
  };

  const defaultSimulatorReplies = [
    "Essa é uma ótima pergunta! Nossa Inteligência Artificial é capaz de entender perguntas complexas. Para ver como isso funcionaria no seu negócio real, recomendo preencher o formulário abaixo e ativar seu teste gratuito de 7 dias!",
    "Exatamente! Nossa tecnologia foi pensada para substituir os chatbots antigos de botão por uma experiência de conversação de verdade. Quer ver na prática? Preencha o formulário para ativarmos um painel exclusivo para você.",
    "Com a IAI Soluções, você pode ter múltiplos atendentes no mesmo número, disparar campanhas com segurança e contar com nossa IA 24 horas por dia. O cadastro leva menos de 2 minutos no formulário abaixo!",
    "Muito interessante! Cada resposta da IA é personalizada com base no arquivo de treinamento que você fornece (como PDFs do seu produto). Preencha nosso formulário ao final da página para falar com um consultor e testar de graça!"
  ];
  const [defaultReplyIndex, setDefaultReplyIndex] = useState(0);

  // Estados do Formulário de Lead
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadWhatsapp, setLeadWhatsapp] = useState('');
  const [leadCompanySize, setLeadCompanySize] = useState('');
  const [leadMessage, setLeadMessage] = useState('');
  const [leadStatus, setLeadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [leadLoading, setLeadLoading] = useState(false);

  // Autoplay para o Dashboard Mockup do Hero
  useEffect(() => {
    if (userInteractedWithMockup) return;
    const tabs: Array<'atendimentos' | 'crm' | 'agentes'> = ['atendimentos', 'crm', 'agentes'];
    const interval = setInterval(() => {
      setActiveTab(prev => {
        const nextIndex = (tabs.indexOf(prev) + 1) % tabs.length;
        return tabs[nextIndex];
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [userInteractedWithMockup]);

  // Rolar chat do simulador para baixo
  useEffect(() => {
    if (waChatBodyRef.current) {
      waChatBodyRef.current.scrollTop = waChatBodyRef.current.scrollHeight;
    }
  }, [waMessages, waIsTyping]);

  // Efeito de rolagem do Header
  useEffect(() => {
    const handleScroll = () => {
      const header = document.getElementById('header');
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enviar mensagem no simulador
  const handleSendWaMessage = (text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Adiciona msg do cliente
    setWaMessages(prev => [...prev, { text, isOutgoing: false, time: timeStr }]);
    setWaInput('');
    setWaIsTyping(true);

    // Determina a resposta
    let replyText = simulatorReplies[text];
    let nextIndex = defaultReplyIndex;

    if (!replyText) {
      // Correspondência parcial
      const matchedKey = Object.keys(simulatorReplies).find(key =>
        text.toLowerCase().includes(key.toLowerCase().replace(/[?]/g, ''))
      );
      if (matchedKey) {
        replyText = simulatorReplies[matchedKey];
      } else {
        replyText = defaultSimulatorReplies[defaultReplyIndex];
        nextIndex = (defaultReplyIndex + 1) % defaultSimulatorReplies.length;
        setDefaultReplyIndex(nextIndex);
      }
    }

    // Delay de digitação
    const delay = Math.min(2000, Math.max(1000, text.length * 15));
    setTimeout(() => {
      setWaIsTyping(false);
      setWaMessages(prev => [...prev, { text: replyText, isOutgoing: true, time: timeStr }]);
    }, delay);
  };

  // Envio de formulário de Lead
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadStatus({ type: null, message: '' });
    setLeadLoading(true);

    const formData = {
      nome: leadName,
      email: leadEmail,
      whatsapp: leadWhatsapp,
      tamanho_empresa: leadCompanySize || null,
      mensagem: leadMessage || null
    };

    try {
      const response = await fetch('http://localhost:8000/api/leads/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setLeadStatus({
          type: 'success',
          message: 'Parabéns! Seus dados foram salvos. Em alguns minutos, nossa equipe (ou nossa IA) entrará em contato via WhatsApp!'
        });
        setLeadName('');
        setLeadEmail('');
        setLeadWhatsapp('');
        setLeadCompanySize('');
        setLeadMessage('');
      } else {
        const errorData = await response.json();
        let errMsg = 'Ocorreu um erro ao salvar seus dados. Verifique as informações.';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errMsg = `Erro de validação: ${errorData.detail.map((d: any) => d.msg).join(', ')}`;
          } else {
            errMsg = errorData.detail;
          }
        }
        throw new Error(errMsg);
      }
    } catch (err: any) {
      setLeadStatus({
        type: 'error',
        message: err.message || 'Erro de conexão com o servidor. Por favor, tente novamente mais tarde.'
      });
    } finally {
      setLeadLoading(false);
    }
  };

  // Alternar FAQ
  const toggleFaq = (index: number) => {
    setActiveFaqIndex(prev => (prev === index ? null : index));
  };

  return (
    <>
      {/* Background Blurs */}
      <div className="bg-blur blur-1"></div>
      <div className="bg-blur blur-2"></div>
      <div className="bg-blur blur-3"></div>

      {/* Header / Navbar */}
      <header id="header">
        <div className="container navbar">
          <div className="logo">
            <div className="logo-icon"></div>
            <span className="logo-text">iai <span>soluções</span></span>
          </div>
          <nav className="nav-links">
            <a href="#recursos">Recursos</a>
            <a href="#diferenciais">Por que a IAI?</a>
            <a href="#simulador">Simulador</a>
            <a href="#precos">Preços</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="nav-cta">
            <a href="/app" className="btn btn-secondary">Entrar</a>
            <a href="#contato" className="btn btn-instagram-glow">Testar Grátis</a>
          </div>
          {/* Menu mobile button */}
          <button 
            className={`mobile-menu-toggle ${isMenuOpen ? 'active' : ''}`} 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            aria-label="Abrir Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-nav ${isMenuOpen ? 'active' : ''}`}>
        <a href="#recursos" onClick={() => setIsMenuOpen(false)}>Recursos</a>
        <a href="#diferenciais" onClick={() => setIsMenuOpen(false)}>Por que a IAI?</a>
        <a href="#simulador" onClick={() => setIsMenuOpen(false)}>Simulador</a>
        <a href="#precos" onClick={() => setIsMenuOpen(false)}>Preços</a>
        <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
        <div className="mobile-nav-cta">
          <a href="/app" className="btn btn-secondary" onClick={() => setIsMenuOpen(false)}>Entrar</a>
          <a href="#contato" className="btn btn-instagram-glow" onClick={() => setIsMenuOpen(false)}>Testar Grátis</a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="badge-premium">
              <span className="badge-dot"></span>
              <span>Plataforma de IA Conversacional do Futuro</span>
            </div>
            <h1 className="hero-title">Escale suas vendas no WhatsApp com <span className="gradient-text">Inteligência Artificial</span></h1>
            <p className="hero-subtitle">
              Centralize seu atendimento comercial, multiplique seus vendedores com um único número de WhatsApp e conte com agentes autônomos de IA para qualificar e fechar negócios 24 horas por dia.
            </p>
            <div className="hero-actions">
              <a href="#contato" className="btn btn-instagram-glow btn-large">Começar Agora Sem Custos</a>
              <a href="#simulador" className="btn btn-outline btn-large">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Testar Simulador
              </a>
            </div>
            <div className="hero-metrics">
              <div className="metric-item">
                <span className="metric-val">+250%</span>
                <span className="metric-lbl">Conversão de Leads</span>
              </div>
              <div className="metric-item">
                <span className="metric-val">-80%</span>
                <span className="metric-lbl">Tempo de Resposta</span>
              </div>
              <div className="metric-item">
                <span className="metric-val">24/7</span>
                <span className="metric-lbl">Disponibilidade de IA</span>
              </div>
            </div>
          </div>
          
          {/* Dashboard Interativo Ativo */}
          <div className="hero-dashboard-container">
            <div className="glass-card dashboard-mockup" id="mainDashboardMockup">
              <div className="dashboard-header">
                <div className="window-controls">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="dashboard-title-bar">
                  <span className="db-status-dot"></span>
                  <span>Painel IAI Soluções v2.4</span>
                </div>
              </div>
              <div className="dashboard-tabs">
                <button 
                  className={`db-tab-btn ${activeTab === 'atendimentos' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('atendimentos'); setUserInteractedWithMockup(true); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  Atendimentos
                </button>
                <button 
                  className={`db-tab-btn ${activeTab === 'crm' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('crm'); setUserInteractedWithMockup(true); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
                  Funil CRM
                </button>
                <button 
                  className={`db-tab-btn ${activeTab === 'agentes' ? 'active' : ''}`} 
                  onClick={() => { setActiveTab('agentes'); setUserInteractedWithMockup(true); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"></path><circle cx="12" cy="10" r="3"></circle><path d="M7 18c0-2.5 2-4.5 5-4.5s5 2 5 4.5"></path></svg>
                  Agentes de IA
                </button>
              </div>
              <div className="dashboard-content-area">
                {/* Tab Atendimentos */}
                <div className={`db-tab-content ${activeTab === 'atendimentos' ? 'active' : ''}`} style={{ display: activeTab === 'atendimentos' ? 'block' : 'none' }}>
                  <div className="db-chat-layout">
                    <div className="db-chat-sidebar">
                      <div className="db-chat-user active">
                        <div className="db-avatar" style={{ background: 'linear-gradient(135deg, var(--color-yale-blue), var(--color-cerulean))' }}>A</div>
                        <div className="db-user-info">
                          <span className="db-username">Ana Souza</span>
                          <span className="db-last-msg">Gostaria de saber...</span>
                        </div>
                        <span className="db-tag-status badge-ia">IA</span>
                      </div>
                      <div className="db-chat-user">
                        <div className="db-avatar" style={{ background: 'linear-gradient(135deg, var(--color-bondi-blue), var(--color-tropical-teal))' }}>M</div>
                        <div className="db-user-info">
                          <span className="db-username">Marcos Lima</span>
                          <span className="db-last-msg">Pode me enviar o link?</span>
                        </div>
                        <span className="db-tag-status badge-humano">Vendedor</span>
                      </div>
                      <div className="db-chat-user">
                        <div className="db-avatar" style={{ background: 'linear-gradient(135deg, var(--color-emerald), var(--color-willow-green))' }}>C</div>
                        <div className="db-user-info">
                          <span className="db-username">Carla Mendes</span>
                          <span className="db-last-msg">Boleto gerado com s...</span>
                        </div>
                        <span className="db-tag-status badge-sucesso">Pago</span>
                      </div>
                    </div>
                    <div className="db-chat-main">
                      <div className="db-chat-header">
                        <span className="db-current-user">Ana Souza (Interagindo com Agente IA)</span>
                        <div className="db-chat-actions">
                          <button className="btn-db-action" onClick={() => setUserInteractedWithMockup(true)}>Assumir Conversa</button>
                        </div>
                      </div>
                      <div className="db-chat-messages">
                        <div className="db-msg incoming">
                          <p>Olá, quero entender qual é o valor da mensalidade e se vocês integram com a Hotmart.</p>
                          <span className="db-msg-time">08:41</span>
                        </div>
                        <div className="db-msg outgoing ia-msg">
                          <div className="ia-badge-msg">IAI Assistente</div>
                          <p>Olá Ana! Integrar com a Hotmart é super simples. Nós temos integração nativa via Webhook. Sobre valores, nossos planos iniciam em R$ 149/mês. Qual o tamanho da sua equipe?</p>
                          <span className="db-msg-time">08:41</span>
                        </div>
                        <div className="db-msg incoming">
                          <p>Hoje somos em 4 pessoas no comercial.</p>
                          <span className="db-msg-time">08:42</span>
                        </div>
                        <div className="db-msg outgoing ia-msg">
                          <div className="ia-badge-msg">IAI Assistente</div>
                          <p>Recomendo o nosso <strong>Plano Growth</strong>. Ele possui atendentes ilimitados e o módulo de inteligência artificial completo por R$ 299/mês. Quer agendar uma demonstração rápida para eu te mostrar como funciona?</p>
                          <span className="db-msg-time">08:42</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tab CRM */}
                <div className={`db-tab-content ${activeTab === 'crm' ? 'active' : ''}`} style={{ display: activeTab === 'crm' ? 'block' : 'none' }}>
                  <div className="db-kanban-board">
                    <div className="db-kanban-column">
                      <div className="db-column-header">Novos Leads <span className="db-count">3</span></div>
                      <div className="db-kanban-card">
                        <span className="card-tag tag-instagram">Instagram</span>
                        <h4>Rodrigo Dias</h4>
                        <p>WhatsApp: (11) 98765-4321</p>
                        <div className="card-footer">
                          <span className="card-date">Hoje, 09:30</span>
                          <div className="card-assignee">IA</div>
                        </div>
                      </div>
                      <div className="db-kanban-card">
                        <span className="card-tag tag-site">Site</span>
                        <h4>Lucas Vieira</h4>
                        <p>Quer automação de suporte</p>
                        <div className="card-footer">
                          <span className="card-date">Ontem</span>
                          <div className="card-assignee">M</div>
                        </div>
                      </div>
                    </div>
                    <div className="db-kanban-column">
                      <div className="db-column-header">Qualificados <span className="db-count">2</span></div>
                      <div className="db-kanban-card">
                        <span className="card-tag tag-whatsapp">WhatsApp</span>
                        <h4>Mariana Reis</h4>
                        <p>Equipe de 12 atendentes</p>
                        <div className="card-footer">
                          <span className="card-date">Hoje, 08:15</span>
                          <div className="card-assignee">IA</div>
                        </div>
                      </div>
                    </div>
                    <div className="db-kanban-column">
                      <div className="db-column-header">Negociação <span className="db-count">1</span></div>
                      <div className="db-kanban-card highlighted-border">
                        <span className="card-tag tag-hotmart">Proposta Enviada</span>
                        <h4>Julio Cesar Ltda</h4>
                        <p>Plano Growth Anual</p>
                        <div className="card-footer">
                          <span className="card-date">Hoje, 07:10</span>
                          <div className="card-assignee">L</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tab Agentes */}
                <div className={`db-tab-content ${activeTab === 'agentes' ? 'active' : ''}`} style={{ display: activeTab === 'agentes' ? 'block' : 'none' }}>
                  <div className="db-agents-layout">
                    <div className="db-agent-settings">
                      <h3>Configuração do Agente IA</h3>
                      <div className="setting-row">
                        <label>Tom de Voz</label>
                        <select disabled value="Profissional e Vendedor"><option>Profissional e Vendedor</option></select>
                      </div>
                      <div className="setting-row">
                        <label>Objetivo Principal</label>
                        <select disabled value="Capturar Leads e Qualificar"><option>Capturar Leads e Qualificar</option></select>
                      </div>
                      <div className="setting-row">
                        <label>Modelo Linguístico</label>
                        <div className="db-badge">IAI-Vision-Pro-v3</div>
                      </div>
                      <div className="setting-row">
                        <label>Instrução Personalizada (Prompt)</label>
                        <textarea disabled value="Você é o consultor de vendas virtual da IAI Soluções. Seu objetivo é engajar leads frios, responder dúvidas sobre integração de WhatsApp comercial e agendar reuniões com nossos consultores humanos..."></textarea>
                      </div>
                    </div>
                    <div className="db-agent-preview">
                      <div className="preview-metrics-grid">
                        <div className="p-metric">
                          <span className="p-val">94.8%</span>
                          <span className="p-lbl">Precisão de Resposta</span>
                        </div>
                        <div className="p-metric">
                          <span className="p-val">142</span>
                          <span className="p-lbl">Leads Qualificados</span>
                        </div>
                      </div>
                      <div className="ai-status-active">
                        <span className="pulse-indicator"></span>
                        Agente online e operando em 4 números comerciais
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos / Funcionalidades */}
      <section className="section" id="recursos">
        <div className="container">
          <div className="section-header">
            <span className="section-pre-title">Recursos Avançados</span>
            <h2 className="section-title">Muito além de um simples disparador de mensagens</h2>
            <p className="section-desc">Criamos um ecossistema completo para gerenciar toda a jornada do seu cliente, desde o primeiro contato até o fechamento financeiro.</p>
          </div>
          
          <div className="features-grid">
            {/* Recurso 1 */}
            <div className="glass-card feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3 className="feature-title">Múltiplos Atendentes</h3>
              <p className="feature-desc">Conecte toda a sua equipe (comercial, financeiro, suporte) em um único número de WhatsApp. Distribuição inteligente de contatos.</p>
            </div>
            
            {/* Recurso 2 */}
            <div className="glass-card feature-card highlighted">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
              <h3 className="feature-title">Agentes Autônomos de IA</h3>
              <p className="feature-desc">Nossa IA proprietária compreende linguagem natural, envia áudios simulando voz humana e qualifica leads de forma humanizada e ágil.</p>
            </div>
            
            {/* Recurso 3 */}
            <div className="glass-card feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
              </div>
              <h3 className="feature-title">CRM Kanban Nativo</h3>
              <p className="feature-desc">Monitore seu pipeline de vendas visualmente. Mova leads entre estágios (contato, proposta, fechado) e defina lembretes automáticos de follow-up.</p>
            </div>

            {/* Recurso 4 */}
            <div className="glass-card feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
              </div>
              <h3 className="feature-title">Relatórios e Auditoria</h3>
              <p className="feature-desc">Saiba exatamente o tempo médio de resposta de cada atendente, volume de mensagens diárias e a taxa de fechamento de cada canal.</p>
            </div>

            {/* Recurso 5 */}
            <div className="glass-card feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              </div>
              <h3 className="feature-title">Campanhas em Massa Seguras</h3>
              <p className="feature-desc">Envie novidades e ofertas a listas selecionadas sem risco de banimentos. Sistema inteligente com delay randômico e variação de texto.</p>
            </div>

            {/* Recurso 6 */}
            <div className="glass-card feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              </div>
              <h3 className="feature-title">Integração Universal</h3>
              <p className="feature-desc">Conecte-se nativamente ou via Webhooks com Hotmart, Kiwify, ActiveCampaign, HubSpot, Bling, e receba notificações imediatas no chat.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Por que IAI / Diferenciais */}
      <section className="section" id="diferenciais" style={{ background: 'rgba(13, 14, 18, 0.5)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-pre-title">Diferencial Inovador</span>
            <h2 className="section-title">Por que a IAI é superior às alternativas?</h2>
            <p className="section-desc">Comparamos a nossa infraestrutura e inteligência com os chatbots tradicionais do mercado para que você tire suas conclusões.</p>
          </div>

          <div className="comparison-container glass-card">
            <div className="comparison-grid">
              <div className="comparison-column col-header">
                <h3>Funcionalidade</h3>
                <div className="comp-row row-label">Respostas baseadas em contexto</div>
                <div className="comp-row row-label">Múltiplos números de WhatsApp</div>
                <div className="comp-row row-label">Transcrição inteligente de áudios</div>
                <div className="comp-row row-label">Treinamento com PDFs e URLs</div>
                <div className="comp-row row-label">Integração nativa com CRMs</div>
                <div className="comp-row row-label">Interface Dark Estilo Glass</div>
              </div>
              <div className="comparison-column col-competitors">
                <h3>Chatbots Tradicionais</h3>
                <div className="comp-row competitor-value bad">Não (Apenas regras rígidas "digite 1, digite 2")</div>
                <div className="comp-row competitor-value bad">Raro ou cobrado à parte</div>
                <div className="comp-row competitor-value bad">Indisponível</div>
                <div className="comp-row competitor-value bad">Não (Configurações manuais complexas)</div>
                <div className="comp-row competitor-value med">Apenas via Make/Zapier adicionais</div>
                <div className="comp-row competitor-value bad">Layouts antigos e lentos</div>
              </div>
              <div className="comparison-column col-iai">
                <div className="iai-badge-popular">IAI Soluções</div>
                <h3>IAI Soluções</h3>
                <div className="comp-row iai-value good">Sim (Compreensão natural de qualquer digitação)</div>
                <div className="comp-row iai-value good">Sim (Sem limite de conexões no plano Pro)</div>
                <div className="comp-row iai-value good">Sim (IA converte áudios recebidos em texto)</div>
                <div className="comp-row iai-value good">Sim (Basta anexar seus materiais para a IA aprender)</div>
                <div className="comp-row iai-value good">Sim (Configuração direta em 2 cliques)</div>
                <div className="comp-row iai-value good">Sim (Foco em UX limpa e moderna)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simulador WhatsApp Interativo */}
      <section className="section" id="simulador">
        <div className="container simulator-layout">
          <div className="simulator-info">
            <div className="badge-premium">
              <span className="badge-dot"></span>
              <span>Experimente ao vivo</span>
            </div>
            <h2 className="section-title">Veja nossa Inteligência Artificial agir em tempo real</h2>
            <p className="section-desc">
              Interaja com a IA da IAI Soluções no simulador ao lado. Simule o atendimento de um potencial cliente fazendo perguntas e sinta a naturalidade das respostas de vendas.
            </p>
            <div className="simulator-shortcuts">
              <p>Sugestões de perguntas para testar:</p>
              <div className="shortcut-buttons">
                <button className="btn-shortcut" onClick={() => handleSendWaMessage("Como a IAI Soluções funciona?")}>"Como a IAI Soluções funciona?"</button>
                <button className="btn-shortcut" onClick={() => handleSendWaMessage("O sistema evita bloqueios de chip?")}>"O sistema evita bloqueios de chip?"</button>
                <button className="btn-shortcut" onClick={() => handleSendWaMessage("Quais são as integrações disponíveis?")}>"Quais são as integrações disponíveis?"</button>
              </div>
            </div>
          </div>
          
          <div className="simulator-device-wrapper">
            <div className="whatsapp-mockup glass-card">
              <div className="whatsapp-header">
                <div className="wa-user-info">
                  <div className="wa-avatar">IA</div>
                  <div className="wa-details">
                    <span className="wa-name">Agente IAI Soluções</span>
                    <span className="wa-status">Online (IA)</span>
                  </div>
                </div>
                <div className="wa-header-icons">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                </div>
              </div>
              <div className="whatsapp-chat-body" ref={waChatBodyRef}>
                {waMessages.map((msg, idx) => (
                  <React.Fragment key={idx}>
                    {msg.isSystem ? (
                      <div className="wa-message system-msg">
                        <span>{msg.text}</span>
                      </div>
                    ) : (
                      <div className={`wa-message ${msg.isOutgoing ? 'outgoing' : 'incoming'}`}>
                        <p>{msg.text}</p>
                        <span className="wa-time">{msg.time}</span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {waIsTyping && (
                  <div className="wa-message typing" id="waTyping">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
              </div>
              <form className="whatsapp-input-area" onSubmit={(e) => { e.preventDefault(); handleSendWaMessage(waInput); }}>
                <input 
                  type="text" 
                  value={waInput} 
                  onChange={(e) => setWaInput(e.target.value)} 
                  placeholder="Digite uma mensagem..." 
                  autoComplete="off" 
                  required
                />
                <button type="submit" className="btn-wa-send" aria-label="Enviar mensagem">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Planos / Preços */}
      <section className="section" id="precos">
        <div className="container">
          <div className="section-header">
            <span className="section-pre-title">Nossos Planos</span>
            <h2 className="section-title">Valores transparentes que acompanham o seu crescimento</h2>
            <p className="section-desc">Escolha a escala ideal para o seu negócio. Mude de plano ou cancele a qualquer momento sem taxas ocultas.</p>
            
            <div className="pricing-toggle-wrapper">
              <span>Mensal</span>
              <label className="switch">
                <input type="checkbox" checked={isAnnual} onChange={() => setIsAnnual(!isAnnual)} />
                <span className="slider round"></span>
              </label>
              <span>Anual <span className="discount-badge">Salvar 20%</span></span>
            </div>
          </div>

          <div className="pricing-grid">
            {/* Plano Starter */}
            <div className="glass-card pricing-card">
              <div className="card-p-header">
                <h3>Starter</h3>
                <p className="card-p-desc">Ideal para autônomos e pequenos negócios iniciando no WhatsApp comercial.</p>
                <div className="price-container">
                  <span className="price-currency">R$</span>
                  <span className="price-value" id="price-starter">{isAnnual ? '119' : '149'}</span>
                  <span className="price-period">/mês</span>
                </div>
              </div>
              <ul className="card-p-features">
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  1 número de WhatsApp conectado
                </li>
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Até 3 atendentes humanos
                </li>
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Chatbot com fluxos de regras
                </li>
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Kanban básico do CRM
                </li>
                <li className="disabled">
                  <svg className="x-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Treinamento de IA personalizada
                </li>
              </ul>
              <a href="#contato" className="btn btn-outline full-width">Começar Agora</a>
            </div>

            {/* Plano Growth */}
            <div className="glass-card pricing-card featured-pricing">
              <div className="featured-ribbon">Mais Popular</div>
              <div className="card-p-header">
                <h3>Growth</h3>
                <p className="card-p-desc">Perfeito para empresas comerciais que buscam automação de ponta e escala rápida.</p>
                <div className="price-container">
                  <span className="price-currency">R$</span>
                  <span className="price-value" id="price-growth">{isAnnual ? '239' : '299'}</span>
                  <span className="price-period">/mês</span>
                </div>
              </div>
              <ul className="card-p-features">
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  1 número de WhatsApp conectado
                </li>
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>Atendentes humanos ilimitados</strong>
                </li>
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>Módulo Inteligência Artificial IAI</strong>
                </li>
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  CRM Kanban completo integrado
                </li>
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Disparos em massa ilimitados
                </li>
              </ul>
              <a href="#contato" className="btn btn-instagram-glow full-width">Testar Grátis 7 Dias</a>
            </div>

            {/* Plano Pro */}
            <div className="glass-card pricing-card">
              <div className="card-p-header">
                <h3>Enterprise</h3>
                <p className="card-p-desc">Para grandes operações comerciais que exigem redundância e integrações sob demanda.</p>
                <div className="price-container">
                  <span className="price-currency">R$</span>
                  <span className="price-value" id="price-pro">{isAnnual ? '479' : '599'}</span>
                  <span className="price-period">/mês</span>
                </div>
              </div>
              <ul className="card-p-features">
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <strong>Até 3 números</strong> conectados
                </li>
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Atendentes ilimitados
                </li>
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  IA Avançada + Transcrições de Áudio
                </li>
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Suporte dedicado via WhatsApp 24/7
                </li>
                <li>
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  API aberta e Webhooks ilimitados
                </li>
              </ul>
              <a href="#contato" className="btn btn-outline full-width">Falar com Vendas</a>
            </div>
          </div>
        </div>
      </section>

      {/* Formulário de Leads (Captura) */}
      <section className="section contact-section" id="contato">
        <div className="container contact-grid">
          <div className="contact-info">
            <span className="section-pre-title">Comece Hoje</span>
            <h2 className="section-title">Pronto para transformar conversas em receita?</h2>
            <p className="section-desc">Preencha o formulário e fale com um especialista da IAI Soluções para ativarmos seu teste de 7 dias grátis em minutos. Nossos consultores ajudarão você a criar os primeiros fluxos e alimentar a sua inteligência artificial comercial.</p>
            <div className="support-channels">
              <div className="channel">
                <span className="channel-icon">💬</span>
                <div className="channel-details">
                  <strong>Dúvidas? Fale conosco direto no WhatsApp</strong>
                  <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">(11) 99999-9999</a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="contact-form-wrapper glass-card">
            <h3>Solicitar Acesso e Teste Grátis</h3>
            <form id="leadForm" onSubmit={handleLeadSubmit}>
              <div className="form-group">
                <label htmlFor="nome">Seu Nome Completo</label>
                <input 
                  type="text" 
                  id="nome" 
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Ex: João da Silva" 
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">E-mail Corporativo</label>
                <input 
                  type="email" 
                  id="email" 
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="Ex: joao@empresa.com.br" 
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="whatsapp">Seu WhatsApp Comercial</label>
                <input 
                  type="tel" 
                  id="whatsapp" 
                  value={leadWhatsapp}
                  onChange={(e) => setLeadWhatsapp(e.target.value)}
                  placeholder="Ex: (11) 98765-4321" 
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="tamanho_empresa">Tamanho da Equipe Comercial</label>
                <select 
                  id="tamanho_empresa"
                  value={leadCompanySize}
                  onChange={(e) => setLeadCompanySize(e.target.value)}
                >
                  <option value="">Selecione uma opção...</option>
                  <option value="1-3">Apenas eu ou até 3 pessoas</option>
                  <option value="4-10">De 4 a 10 pessoas</option>
                  <option value="11-30">De 11 a 30 pessoas</option>
                  <option value="31+">Mais de 30 pessoas</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="mensagem">Detalhes Adicionais (Opcional)</label>
                <textarea 
                  id="mensagem" 
                  value={leadMessage}
                  onChange={(e) => setLeadMessage(e.target.value)}
                  placeholder="Diga qual seu principal objetivo ao automatizar seu atendimento..."
                ></textarea>
              </div>
              <button type="submit" className="btn btn-instagram-glow full-width" id="btnSubmitForm" disabled={leadLoading}>
                {leadLoading ? (
                  <>
                    <span>Carregando...</span>
                    <div className="spinner" id="formSpinner"></div>
                  </>
                ) : (
                  <span>Garantir Meu Acesso Grátis</span>
                )}
              </button>
            </form>
            {leadStatus.type && (
              <div className={`form-feedback ${leadStatus.type}`} id="formFeedback" style={{ display: 'block' }}>
                {leadStatus.message}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Perguntas Frequentes (FAQ) */}
      <section className="section" id="faq">
        <div className="container faq-container">
          <div className="section-header">
            <span className="section-pre-title">FAQ</span>
            <h2 className="section-title">Perguntas Frequentes</h2>
            <p className="section-desc">Tire suas principais dúvidas sobre o funcionamento da plataforma IAI Soluções.</p>
          </div>
          
          <div className="faq-list">
            {[
              {
                q: "Preciso ter um número de WhatsApp específico para a plataforma?",
                a: "Não. Você pode utilizar o seu número atual do WhatsApp Business ou pessoal. O sistema realiza a conexão através da leitura de um QR Code simples, de forma análoga ao WhatsApp Web, ou através da API de Nuvem oficial se preferir."
              },
              {
                q: "Como a inteligência artificial é treinada com as informações da minha empresa?",
                a: "Muito simples: você faz upload dos seus materiais (PDFs de treinamento, manuais de produto, tabelas de preços, histórico de conversas ou links de sites) diretamente nas configurações de IA do gestor. Nossa IA processa e cria a base de conhecimento instantaneamente."
              },
              {
                q: "A IA responde por áudio também?",
                a: "Sim! Nossa IA pode transcrever os áudios que os seus leads enviam e também responder gerando áudios sintéticos humanizados com tom de voz natural de vendedor, melhorando significativamente a conversão."
              },
              {
                q: "Existe limite de atendentes humanos conectados?",
                a: "No plano Starter existe o limite de 3 atendentes. Nos planos Growth e Enterprise o acesso de atendentes humanos é ilimitado, permitindo toda a sua equipe trabalhar sob o mesmo número."
              }
            ].map((faq, idx) => (
              <div key={idx} className={`faq-item ${activeFaqIndex === idx ? 'active' : ''}`}>
                <button className="faq-trigger" onClick={() => toggleFaq(idx)}>
                  <span>{faq.q}</span>
                  <svg className="faq-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div className="faq-content" style={{ maxHeight: activeFaqIndex === idx ? '300px' : '0px', transition: 'max-height 0.3s ease' }}>
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="logo">
              <div className="logo-icon"></div>
              <span className="logo-text">iai <span>soluções</span></span>
            </div>
            <p className="footer-desc">Soluções inteligentes de inteligência artificial de vendas e atendimento omnichannel para WhatsApp.</p>
            <p className="copyright">&copy; {new Date().getFullYear()} IAI Soluções Ltda. Todos os direitos reservados.</p>
          </div>
          <div className="footer-links">
            <h4>Links Rápidos</h4>
            <a href="#hero">Início</a>
            <a href="#recursos">Recursos</a>
            <a href="#precos">Preços</a>
            <a href="/app">Painel</a>
          </div>
        </div>
      </footer>
    </>
  );
}
