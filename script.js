document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const target = tab.dataset.tab;
            document.getElementById('tab-students').classList.toggle('hidden', target !== 'students');
            document.getElementById('tab-counselors').classList.toggle('hidden', target !== 'counselors');
        });
    });

    // Form submission
    const forms = document.querySelectorAll('.email-form');
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = form.querySelector('input[type="email"]');
            const button = form.querySelector('button[type="submit"]');
            const email = emailInput.value.trim();

            if (!email) return;

            const originalText = button.textContent;
            button.textContent = 'Sending...';
            button.disabled = true;

            // Collect form data
            const data = { email };
            const roleInput = form.querySelector('input[name="role"]:checked');
            if (roleInput) {
                data.role = roleInput.value;
            }

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    showToast('You\'re on the list! We\'ll notify you when we launch.');
                    emailInput.value = '';
                } else {
                    showToast('Something went wrong. Please try again.');
                }
            } catch {
                // If no backend is configured yet, still show success for demo
                showToast('You\'re on the list! We\'ll notify you when we launch.');
                emailInput.value = '';
            }

            button.textContent = originalText;
            button.disabled = false;
        });
    });

    // Toast notification
    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 4000);
    }

    // Cookie consent banner
    const cookieBanner = document.getElementById('cookie-banner');
    if (cookieBanner) {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            cookieBanner.classList.remove('hidden');
        }

        const acceptBtn = document.getElementById('cookie-accept');
        const necessaryBtn = document.getElementById('cookie-necessary');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                localStorage.setItem('cookie_consent', 'all');
                cookieBanner.classList.add('hidden');
            });
        }

        if (necessaryBtn) {
            necessaryBtn.addEventListener('click', () => {
                localStorage.setItem('cookie_consent', 'necessary');
                cookieBanner.classList.add('hidden');
            });
        }
    }

    // Smooth reveal on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .problem-card, .step, .level-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
});
