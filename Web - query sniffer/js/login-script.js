document.getElementById('loginForm').addEventListener('submit', function(event) {
  // Previne o comportamento padrão de envio do formulário (recarregar a página)
  event.preventDefault();

  // Coleta os valores dos campos (opcional, para uso em API real)
  const emailInput = this.querySelector('input[type="email"]').value;
  const passwordInput = this.querySelector('input[type="password"]').value;

  console.log('Tentativa de login:', { email: emailInput, password: '***password***' });

  // Simulação de carregamento 
  const submitButton = this.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerText;
  submitButton.innerText = 'Entrando...';
  submitButton.disabled = true;

  // Simulação de sucesso após 2 segundos (substitua por API)
  setTimeout(function() {
    alert('Login em modo de simulação. Substituir essa parte pela lógica de autenticação via API');
    
    // Restaura o botão (para simular uma falha de login, por exemplo)
    submitButton.innerText = originalButtonText;
    submitButton.disabled = false;
  }, 2000);
});

// Manipuladores de clique simulados para outros botões
document.querySelectorAll('.btn-login-header, .btn-about-header, .nav-menu a, .social-icon, .forgot-link, .create-account-link, .footer-menu a, .social-icon-footer').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault(); // Evita a navegação para um link vazio '#'
        console.log('Clicked simulated element:', this.innerText || 'Icon');
    });
});