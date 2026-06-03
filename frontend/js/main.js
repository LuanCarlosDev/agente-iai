document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       NAVBAR SCROLL EFFECT
       ========================================================================== */
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /* ==========================================================================
       MOBILE MENU DRAWER
       ========================================================================== */
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const mobileLinks = mobileNav.querySelectorAll('a');

    function toggleMobileMenu() {
        mobileMenuToggle.classList.toggle('active');
        mobileNav.classList.toggle('active');
    }

    mobileMenuToggle.addEventListener('click', toggleMobileMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileNav.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });

    /* ==========================================================================
       PRICING TOGGLE (MONTHLY / ANNUALLY)
       ========================================================================== */
    const billingToggle = document.getElementById('billingToggle');
    const priceStarter = document.getElementById('price-starter');
    const priceGrowth = document.getElementById('price-growth');
    const pricePro = document.getElementById('price-pro');

    const prices = {
        monthly: { starter: '149', growth: '299', pro: '599' },
        annually: { starter: '119', growth: '239', pro: '479' }
    };

    billingToggle.addEventListener('change', () => {
        const mode = billingToggle.checked ? 'annually' : 'monthly';
        
        // Animação simples de transição nos valores
        [priceStarter, priceGrowth, pricePro].forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(-10px)';
        });

        setTimeout(() => {
            priceStarter.textContent = prices[mode].starter;
            priceGrowth.textContent = prices[mode].growth;
            pricePro.textContent = prices[mode].pro;

            [priceStarter, priceGrowth, pricePro].forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        }, 200);
    });

    /* ==========================================================================
       FAQ ACCORDION
       ========================================================================== */
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const content = item.querySelector('.faq-content');

        trigger.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Fechar todos os outros FAQs antes de abrir este
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-content').style.maxHeight = '0';
                }
            });

            // Alternar estado do clicado
            if (isActive) {
                item.classList.remove('active');
                content.style.maxHeight = '0';
            } else {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });

    /* ==========================================================================
       LEAD FORM CAPTURE (FASTAPI INTEGRATION)
       ========================================================================== */
    const leadForm = document.getElementById('leadForm');
    const btnSubmit = document.getElementById('btnSubmitForm');
    const formSpinner = document.getElementById('formSpinner');
    const formFeedback = document.getElementById('formFeedback');

    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Ocultar feedback anterior
        formFeedback.style.display = 'none';
        formFeedback.className = 'form-feedback';
        
        // Ativar animação de loading
        btnSubmit.disabled = true;
        btnSubmit.querySelector('span').style.display = 'none';
        formSpinner.style.display = 'block';

        // Captura de dados
        const formData = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            whatsapp: document.getElementById('whatsapp').value,
            tamanho_empresa: document.getElementById('tamanho_empresa').value || null,
            mensagem: document.getElementById('mensagem').value || null
        };

        try {
            // Requisição para o backend local do FastAPI
            const response = await fetch('http://localhost:8000/api/leads/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Sucesso
                formFeedback.textContent = 'Parabéns! Seus dados foram salvos. Em alguns minutos, nossa equipe (ou nossa IA) entrará em contato via WhatsApp!';
                formFeedback.classList.add('success');
                formFeedback.style.display = 'block';
                
                // Limpar formulário
                leadForm.reset();
            } else {
                // Erro de resposta da API
                const errorData = await response.json();
                let errMsg = 'Ocorreu um erro ao salvar seus dados. Verifique as informações.';
                
                if (errorData.detail && Array.isArray(errorData.detail)) {
                    // Trata mensagens de validação do FastAPI
                    errMsg = `Erro de validação: ${errorData.detail.map(d => d.msg).join(', ')}`;
                } else if (errorData.detail) {
                    errMsg = errorData.detail;
                }
                
                throw new Error(errMsg);
            }
        } catch (err) {
            // Erro de rede ou de validação
            formFeedback.textContent = err.message || 'Erro de conexão com o servidor. Por favor, tente novamente mais tarde.';
            formFeedback.classList.add('error');
            formFeedback.style.display = 'block';
        } finally {
            // Reverter estado do botão
            btnSubmit.disabled = false;
            btnSubmit.querySelector('span').style.display = 'block';
            formSpinner.style.display = 'none';
        }
    });

    /* ==========================================================================
       SCROLL REVEAL ANIMATION (INTERSECTION OBSERVER)
       ========================================================================== */
    const revealElements = document.querySelectorAll('.feature-card, .section-header, .pricing-card, .comparison-container, .whatsapp-mockup');

    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // Deixa de observar uma vez revelado
            }
        });
    }, {
        threshold: 0.1
    });

    // Configurando estados iniciais no CSS via JS se desejar, mas como criamos com CSS é melhor usar classes
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        revealOnScroll.observe(el);
    });

    // Injetando classe de revelação nas transições observadas
    window.addEventListener('scroll', () => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    });
});
