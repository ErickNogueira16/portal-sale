function mostrarModalMensagem(msg, tipo = "info") {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 400px;
      width: 90%;
      position: relative;
      z-index: 10001;
    `;

    const iconoDiv = document.createElement('div');
    iconoDiv.style.cssText = `
      font-size: 48px;
      margin-bottom: 20px;
    `;

    let icono = "ℹ️";
    let cor = "#007bff";
    
    if (tipo === "sucesso") {
      icono = "✓";
      cor = "#28a745";
    } else if (tipo === "erro") {
      icono = "✕";
      cor = "#dc3545";
    } else if (tipo === "aviso") {
      icono = "⚠";
      cor = "#ffc107";
    }

    iconoDiv.textContent = icono;

    const mensagem = document.createElement('p');
    mensagem.textContent = msg;
    mensagem.style.cssText = `
      color: #333;
      font-size: 16px;
      margin: 0 0 25px 0;
      line-height: 1.5;
    `;

    const botao = document.createElement('button');
    botao.textContent = "OK";
    botao.style.cssText = `
      background: ${cor};
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
    `;

    const corEscura = tipo === "sucesso" ? "#218838" : tipo === "erro" ? "#c82333" : tipo === "aviso" ? "#e0a800" : "#0056b3";
    botao.onmouseover = () => botao.style.background = corEscura;
    botao.onmouseout = () => botao.style.background = cor;

    const fechar = () => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      resolve();
    };

    botao.onclick = fechar;
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        fechar();
      }
    };

    modal.appendChild(iconoDiv);
    modal.appendChild(mensagem);
    modal.appendChild(botao);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
}

document.addEventListener("DOMContentLoaded", function () {
    const formCadastro = document.querySelector("#formCadastroUsuario");
    const backButton = document.querySelector("#backButton");

    if (!formCadastro) {
        console.error("Formulário não encontrado");
        return;
    }

    if (backButton) {
        backButton.addEventListener("click", voltarParaInicio);
    }

    formCadastro.addEventListener("submit", function (event) {
        event.preventDefault();

        const nome = document.querySelector("#nome").value.trim();
        const email = document.querySelector("#email").value.trim();
        const ra = document.querySelector("#ra").value.trim();
        const senha = document.querySelector("#senha").value;
        const confirmarSenha = document.querySelector("#confirmarSenha").value;

        if (!nome || !email || !ra || !senha || !confirmarSenha) {
            mostrarModalMensagem("Preencha todos os campos.", "aviso");
            return;
        }

        if (senha !== confirmarSenha) {
            mostrarModalMensagem("As senhas não coincidem.", "aviso");
            return;
        }

        const evento = {
            nome: nome,
            email: email,
            ra: ra,
            senha: senha
        };

        console.log("Cadastro feito:", evento);

        fetch("https://portal-sale.onrender.com/auth/cadastro", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(evento)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.mensagem); });
                }
                return response.json();
            })
            .then(data => {
                mostrarModalMensagem(data.mensagem, "sucesso");
                formCadastro.reset();
            })
            .catch(error => {
                console.error("Erro ao cadastrar usuário: ", error.message);
                mostrarModalMensagem(error.message, "erro");
            });
    });
});

function voltarParaInicio() {
    window.location.href = "../login/login.html";
}