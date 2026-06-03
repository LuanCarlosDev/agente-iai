document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('whatsappChatBody');
    const inputForm = document.getElementById('whatsappInputForm');
    const messageInput = document.getElementById('whatsappInput');
    const shortcutButtons = document.querySelectorAll('.btn-shortcut');

    // Base de respostas do Simulador IAI Soluções
    const replies = {
        "Como a IAI Soluções funciona?": "A IAI Soluções funciona de forma simples: conectamos o seu número de WhatsApp corporativo à nossa plataforma em nuvem. A partir daí, nossa Inteligência Artificial analisa cada conversa recebida e, com base nas regras e manuais que você cadastrar, atende, responde dúvidas e qualifica o cliente sozinho. Se ele quiser falar com um humano, a IA o transfere de forma inteligente para a sua equipe, que atende no mesmo painel unificado.",
        "O sistema evita bloqueios de chip?": "Sim, com certeza! Desenvolvemos o algoritmo **IAI SafeAntiBan**, que atua de três formas: 1) Insere delays aleatórios entre as mensagens enviadas; 2) Cria variações gramaticais únicas usando nossa IA Generativa em cada envio (evitando que o WhatsApp detecte mensagens repetidas idênticas); 3) Realiza uma cadência de aquecimento de chip. Isso garante a máxima segurança para as suas campanhas de vendas.",
        "Quais são as integrações disponíveis?": "Nós temos integração nativa com as principais plataformas do mercado nacional e internacional: Kiwify, Hotmart, Monetizze, ActiveCampaign, HubSpot, Shopify, RD Station, Bling, e muitas outras. Além disso, disponibilizamos uma API REST documentada completa e Webhooks de entrada/saída, permitindo conectar a IAI Soluções com qualquer sistema ou CRM do planeta."
    };

    const defaultReplies = [
        "Essa é uma ótima pergunta! Nossa Inteligência Artificial é capaz de entender perguntas complexas. Para ver como isso funcionaria no seu negócio real, recomendo preencher o formulário abaixo e ativar seu teste gratuito de 7 dias!",
        "Exatamente! Nossa tecnologia foi pensada para substituir os chatbots antigos de botão por uma experiência de conversação de verdade. Quer ver na prática? Preencha o formulário para ativarmos um painel exclusivo para você.",
        "Com a IAI Soluções, você pode ter múltiplos atendentes no mesmo número, disparar campanhas com segurança e contar com nossa IA 24 horas por dia. O cadastro leva menos de 2 minutos no formulário abaixo!",
        "Muito interessante! Cada resposta da IA é personalizada com base no arquivo de treinamento que você fornece (como PDFs do seu produto). Preencha nosso formulário ao final da página para falar com um consultor e testar de graça!"
    ];

    let replyIndex = 0;

    // Rolar o chat para o fim
    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Adiciona balão de mensagem na tela
    function appendMessage(text, isOutgoing = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `wa-message ${isOutgoing ? 'outgoing' : 'incoming'}`;
        
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        msgDiv.innerHTML = `
            <p>${escapeHTML(text)}</p>
            <span class="wa-time">${timeStr}</span>
        `;
        
        chatBody.appendChild(msgDiv);
        scrollToBottom();
    }

    // Adiciona indicador de digitação
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'wa-message typing';
        typingDiv.id = 'waTyping';
        typingDiv.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        chatBody.appendChild(typingDiv);
        scrollToBottom();
        return typingDiv;
    }

    // Remove indicador de digitação
    function removeTypingIndicator() {
        const typingDiv = document.getElementById('waTyping');
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    // Helper para escapar HTML e evitar XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // Processa a mensagem do usuário e gera resposta da IA
    function handleUserMessage(messageText) {
        if (!messageText.trim()) return;

        // Adiciona a mensagem do usuário
        appendMessage(messageText, true);

        // Limpa o input
        messageInput.value = '';

        // Mostra digitando...
        showTypingIndicator();

        // Determina a resposta
        let replyText = replies[messageText];
        if (!replyText) {
            // Tenta achar correspondência parcial nas perguntas
            const matchedKey = Object.keys(replies).find(key => 
                messageText.toLowerCase().includes(key.toLowerCase().replace(/[?]/g, ''))
            );
            if (matchedKey) {
                replyText = replies[matchedKey];
            } else {
                replyText = defaultReplies[replyIndex];
                replyIndex = (replyIndex + 1) % defaultReplies.length;
            }
        }

        // Simula delay de digitação
        const delay = Math.min(2000, Math.max(1000, messageText.length * 15));
        setTimeout(() => {
            removeTypingIndicator();
            appendMessage(replyText, false);
        }, delay);
    }

    // Listener de envio do form
    inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value;
        handleUserMessage(text);
    });

    // Listener para botões de atalho
    shortcutButtons.forEach(button => {
        button.addEventListener('click', () => {
            const question = button.getAttribute('data-question');
            handleUserMessage(question);
        });
    });

    // Inicialização - rolar para baixo no load
    scrollToBottom();
});
