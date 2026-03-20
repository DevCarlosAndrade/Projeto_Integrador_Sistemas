// Efeito de mudança de cor no header ao rolar a página
window.addEventListener('scroll', () => {
    const header = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        header.style.background = 'rgba(10, 11, 16, 0.95)'; // Fica levemente mais opaco
    } else {
        header.style.borderBottom = 'none';
        header.style.background = 'rgba(10, 11, 16, 0.8)';
    }
});

// Simulação de clique nos botões
//document.querySelector('.btn-primary').addEventListener('click', (e) => {
 //   e.preventDefault();
   // alert('Sistema de Login em desenvolvimento!');
//});

document.querySelector('.btn-main').addEventListener('click', () => {
    console.log("Iniciando análise de queries...");
});