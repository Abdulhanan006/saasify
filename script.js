document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - General
    const grid = document.getElementById('pricing-grid');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // DOM Elements - Pricing Controls
    const billingCheckbox = document.getElementById('billing-checkbox');
    const labelMonthly = document.getElementById('label-monthly');
    const labelYearly = document.getElementById('label-yearly');
    const currencySelect = document.getElementById('currency-select');
    
    // DOM Elements - Mobile Nav
    const hamburger = document.getElementById('hamburger');
    const mobileMenuWrapper = document.getElementById('mobile-menu-wrapper');
    const navOverlay = document.getElementById('nav-overlay');
    const navLinksList = document.querySelectorAll('.nav-links a');
    
    // DOM Elements - Modals
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const closeButtons = document.querySelectorAll('[data-close-modal]');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');

    // State Variables
    let pricingData = [];
    let isYearly = false;
    let currentCurrency = 'USD';
    
    // Currency Conversion Rates (Mock)
    const rates = {
        USD: { rate: 1, symbol: '$' },
        EUR: { rate: 0.92, symbol: '€' },
        PKR: { rate: 278.50, symbol: '₨' }
    };

    /* ==========================================================================
       Dark Mode Initialization
       ========================================================================== */
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
        } else {
            document.body.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
        }
    };

    themeToggle.addEventListener('click', () => {
        if (document.body.getAttribute('data-theme') === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
        }
    });

    initTheme();

    /* ==========================================================================
       Mobile Navigation Logic
       ========================================================================== */
    const toggleMobileMenu = () => {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
        hamburger.classList.toggle('active');
        mobileMenuWrapper.classList.toggle('active');
        navOverlay.classList.toggle('active');
        
        if (!isExpanded) {
            navOverlay.setAttribute('aria-hidden', 'false');
            // Trap focus roughly or just focus first element
            navLinksList[0]?.focus();
        } else {
            navOverlay.setAttribute('aria-hidden', 'true');
        }
    };

    const closeMobileMenu = () => {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('active');
        mobileMenuWrapper.classList.remove('active');
        navOverlay.classList.remove('active');
        navOverlay.setAttribute('aria-hidden', 'true');
    };

    hamburger.addEventListener('click', toggleMobileMenu);
    navOverlay.addEventListener('click', closeMobileMenu);
    navLinksList.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    /* ==========================================================================
       Modal Logic
       ========================================================================== */
    const openModal = (modal) => {
        // Close mobile menu if open
        closeMobileMenu();
        
        // Hide other modals
        document.querySelectorAll('.modal.active').forEach(m => {
            m.classList.remove('active');
            m.setAttribute('aria-hidden', 'true');
        });
        
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus first input
        const firstInput = modal.querySelector('input');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    };

    const closeModal = () => {
        document.querySelectorAll('.modal.active').forEach(m => {
            m.classList.remove('active');
            m.setAttribute('aria-hidden', 'true');
        });
    };

    loginBtn.addEventListener('click', () => openModal(loginModal));
    signupBtn.addEventListener('click', () => openModal(signupModal));
    
    switchToSignup.addEventListener('click', () => openModal(signupModal));
    switchToLogin.addEventListener('click', () => openModal(loginModal));

    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Keyboard accessibility for modals and menus
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeMobileMenu();
        }
    });

    /* ==========================================================================
       Data Fetching & Rendering
       ========================================================================== */
    const fetchPricingData = async () => {
        grid.innerHTML = '';
        grid.classList.add('hidden');
        errorMessage.classList.add('hidden');
        loader.classList.remove('hidden');

        try {
            // Check cache first
            const cachedData = localStorage.getItem('pricingData');
            
            // Artificial delay to show loader and animation
            await new Promise(resolve => setTimeout(resolve, 800));

            let data;
            if (cachedData) {
                data = JSON.parse(cachedData);
            } else {
                const response = await fetch('pricing.json');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                data = await response.json();
                localStorage.setItem('pricingData', JSON.stringify(data));
            }
            
            pricingData = data;
            renderCards();
            
            loader.classList.add('hidden');
            grid.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching data:', error);
            loader.classList.add('hidden');
            errorMessage.classList.remove('hidden');
        }
    };

    const renderCards = () => {
        grid.innerHTML = '';
        
        pricingData.forEach((plan, index) => {
            const card = document.createElement('div');
            card.className = `card ${plan.popular_plan ? 'card-popular' : ''}`;
            card.style.animationDelay = `${index * 0.15}s`;
            card.setAttribute('tabindex', '0'); // Make cards focusable

            // Calculate Price
            const basePrice = isYearly ? plan.price_yearly : plan.price_monthly;
            const convertedPrice = (basePrice * rates[currentCurrency].rate).toFixed(currentCurrency === 'PKR' ? 0 : 2);
            const cycleText = isYearly ? '/year' : '/month';

            // Generate Features List
            const featuresHtml = plan.features.map(feature => `
                <li><i class="fa-solid fa-check" aria-hidden="true"></i> ${feature}</li>
            `).join('');

            card.innerHTML = `
                ${plan.popular_plan ? '<div class="popular-badge">Most Popular</div>' : ''}
                <h3 class="plan-name">${plan.plan_name}</h3>
                <div class="plan-price-wrapper">
                    <span class="currency-symbol">${rates[currentCurrency].symbol}</span>
                    <span class="plan-price">${convertedPrice}</span>
                    <span class="plan-cycle">${cycleText}</span>
                </div>
                <button class="btn ${plan.popular_plan ? 'btn-primary' : 'btn-secondary'}">
                    ${plan.popular_plan ? 'Get Started' : 'Choose Plan'}
                </button>
                <hr>
                <ul class="features-list">
                    ${featuresHtml}
                </ul>
            `;
            
            grid.appendChild(card);
        });
    };

    /* ==========================================================================
       Pricing Controls Logic
       ========================================================================== */
    const updateBillingToggle = (checked) => {
        isYearly = checked;
        billingCheckbox.checked = checked;
        billingCheckbox.setAttribute('aria-checked', checked);
        
        if (isYearly) {
            labelYearly.classList.add('active');
            labelMonthly.classList.remove('active');
        } else {
            labelMonthly.classList.add('active');
            labelYearly.classList.remove('active');
        }
        if (pricingData.length > 0) renderCards();
    };

    billingCheckbox.addEventListener('change', (e) => {
        updateBillingToggle(e.target.checked);
    });

    // Keyboard accessibility for billing toggle switch
    billingCheckbox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            updateBillingToggle(!billingCheckbox.checked);
        }
    });

    currencySelect.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        if (pricingData.length > 0) renderCards();
    });

    retryBtn.addEventListener('click', fetchPricingData);

    /* ==========================================================================
       FAQ Accordion Logic
       ========================================================================== */
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const isExpanded = question.getAttribute('aria-expanded') === 'true';
            
            // Optional: Close all other accordions first
            faqQuestions.forEach(q => {
                q.setAttribute('aria-expanded', 'false');
                const answer = document.getElementById(q.getAttribute('aria-controls'));
                if (answer) answer.style.maxHeight = null;
            });

            // Toggle current one
            if (!isExpanded) {
                question.setAttribute('aria-expanded', 'true');
                const answer = document.getElementById(question.getAttribute('aria-controls'));
                if (answer) answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // Form Submission prevention (since it's just frontend UI for now)
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Admin/Login Dashboard would open here in full-stack implementation.');
        closeModal();
    });

    document.getElementById('signup-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Signup completed. You would be redirected to the dashboard.');
        closeModal();
    });

    // Initial Fetch
    fetchPricingData();
});
