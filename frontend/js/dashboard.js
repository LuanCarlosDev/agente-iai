document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.db-tab-btn');
    const tabContents = document.querySelectorAll('.db-tab-content');
    let autoplayInterval;
    let userInteracted = false;

    // Função para mudar de aba
    function switchTab(tabId) {
        // Remover active de todos os botões
        tabButtons.forEach(btn => btn.classList.remove('active'));
        // Adicionar active no botão correto
        const targetBtn = document.querySelector(`.db-tab-btn[data-tab="${tabId}"]`);
        if (targetBtn) targetBtn.classList.add('active');

        // Remover active de todos os conteúdos
        tabContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        // Adicionar active ao conteúdo selecionado
        const targetContent = document.getElementById(`tab-${tabId}`);
        if (targetContent) {
            targetContent.style.display = 'block';
            // Timeout curto para acionar a transição de opacidade do CSS
            setTimeout(() => {
                targetContent.classList.add('active');
            }, 20);
        }
    }

    // Gerenciar evento de clique nas abas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            userInteracted = true;
            clearInterval(autoplayInterval); // Cancela o autoplay se o usuário clicar
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Autoplay para alternar as abas demonstrativas a cada 8 segundos
    const tabsSequence = ['atendimentos', 'crm', 'agentes'];
    let currentTabIndex = 0;

    function startAutoplay() {
        autoplayInterval = setInterval(() => {
            if (!userInteracted) {
                currentTabIndex = (currentTabIndex + 1) % tabsSequence.length;
                switchTab(tabsSequence[currentTabIndex]);
            }
        }, 8000); // 8 segundos
    }

    // Iniciar autoplay
    startAutoplay();
});
