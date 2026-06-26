function saveAuthData(token, role) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  sessionStorage.setItem("token", token);
  sessionStorage.setItem("role", role);
  try {
    window.name = JSON.stringify({ token, role });
  } catch (error) {
    console.warn("Não foi possível salvar token em window.name", error);
  }
}

function getAuthToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");
  if (tokenFromUrl) {
    const roleFromUrl = urlParams.get("role") || localStorage.getItem("role") || sessionStorage.getItem("role");
    saveAuthData(tokenFromUrl, roleFromUrl || "ADMIN");
    return tokenFromUrl;
  }

  const tokenFromLocalStorage = localStorage.getItem("token");
  if (tokenFromLocalStorage) {
    return tokenFromLocalStorage;
  }

  const tokenFromSession = sessionStorage.getItem("token");
  if (tokenFromSession) {
    localStorage.setItem("token", tokenFromSession);
    localStorage.setItem("role", sessionStorage.getItem("role") || localStorage.getItem("role") || "ADMIN");
    return tokenFromSession;
  }

  try {
    const nameData = JSON.parse(window.name || "{}");
    if (nameData?.token) {
      saveAuthData(nameData.token, nameData.role || localStorage.getItem("role") || sessionStorage.getItem("role") || "ADMIN");
      return nameData.token;
    }
  } catch (error) {
    console.warn("window.name não contém token válido", error);
  }

  return null;
}

function clearAuthToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");
  try {
    window.name = "";
  } catch (error) {
    console.warn("Não foi possível limpar window.name", error);
  }
}

function getAuthHeaders(contentType) {
  const token = getAuthToken();
  const headers = {};
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function getAuthRole() {
  const roleFromLocalStorage = localStorage.getItem("role");
  if (roleFromLocalStorage) return roleFromLocalStorage;

  const roleFromSession = sessionStorage.getItem("role");
  if (roleFromSession) {
    localStorage.setItem("role", roleFromSession);
    return roleFromSession;
  }

  try {
    const nameData = JSON.parse(window.name || "{}");
    if (nameData?.role) {
      localStorage.setItem("role", nameData.role);
      sessionStorage.setItem("role", nameData.role);
      return nameData.role;
    }
  } catch (error) {
    console.warn("window.name não contém role válido", error);
  }
  return null;
}

function formatarDataHora(valor) {
  if (!valor) return 'N/A';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return valor;
  }
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(data);
}

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

function mostrarModalConfirmacao(msg = "Tem certeza?") {
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
      padding: 28px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 420px;
      width: 90%;
      position: relative;
      z-index: 10001;
    `;

    const mensagem = document.createElement('p');
    mensagem.textContent = msg;
    mensagem.style.cssText = `
      color: #333;
      font-size: 16px;
      margin: 0 0 24px 0;
      line-height: 1.6;
    `;

    const botoes = document.createElement('div');
    botoes.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    `;

    const botaoCancelar = document.createElement('button');
    botaoCancelar.textContent = 'Cancelar';
    botaoCancelar.style.cssText = `
      background: #e2e8f0;
      color: #334155;
      border: none;
      padding: 12px 22px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 15px;
    `;

    const botaoConfirmar = document.createElement('button');
    botaoConfirmar.textContent = 'Confirmar';
    botaoConfirmar.style.cssText = `
      background: #1e40af;
      color: white;
      border: none;
      padding: 12px 22px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 15px;
    `;

    botaoCancelar.onclick = () => {
      document.body.removeChild(overlay);
      resolve(false);
    };

    botaoConfirmar.onclick = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resolve(false);
      }
    };

    botoes.appendChild(botaoCancelar);
    botoes.appendChild(botaoConfirmar);
    modal.appendChild(mensagem);
    modal.appendChild(botoes);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const eventosList = document.getElementById("eventosList");
  const usuariosList = document.getElementById("usuariosList");
  const criarEventoButton = document.getElementById("criarEventoButton");
  const logoutButton = document.getElementById("logoutButton");

  const token = getAuthToken();
  const role = getAuthRole();

  if (!token || role !== "ADMIN") {
    mostrarModalMensagem("Acesso negado. Faça login como administrador.", "erro");
    setTimeout(() => {
      window.location.href = "../login/login.html";
    }, 2000);
    return;
  }

  // 🚪 LOGOUT
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    clearAuthToken();
    window.location.href = "../login/login.html";
  });

  carregarEventos();

  criarEventoButton.addEventListener("click", () => {
    window.location.href = "../cadastro/cadastro.html#dashboard";
  });
});

function carregarEventos() {
  fetch("https://portal-sale.onrender.com/eventos")
    .then(res => res.json())
    .then(eventos => {
      const eventosList = document.getElementById("eventosList");

      eventosList.innerHTML = eventos.map(e => `
        <div class="evento-item">
          <strong>${e.nome}</strong> - ${formatarDataHora(e.dataHora)} até ${formatarDataHora(e.horaFim)}<br>

          <button onclick="mostrarDetalhes(${e.id})">Detalhes</button>
          <button onclick="editarEvento(${e.id})">Editar</button>
          <button onclick="verInscritos(${e.id})">Ver Inscritos</button>
          <button onclick="excluirEvento(${e.id})">Excluir</button>
        </div>
      `).join("");
    })
    .catch(err => {
      console.error("Erro ao carregar eventos:", err);
      mostrarModalMensagem("Erro ao carregar eventos.", "erro");
    });
}

function mostrarDetalhes(id) {
  fetch(`https://portal-sale.onrender.com/eventos/${id}`)
    .then(res => res.json())
    .then(evento => {
      const usuariosList = document.getElementById("usuariosList");

      const inscritosCount = evento.inscritos ? evento.inscritos.length : 0;

      usuariosList.innerHTML = `
        <h3>Detalhes do Evento</h3>
        <p><strong>Nome:</strong> ${evento.nome}</p>
        <p><strong>Palestrante:</strong> ${evento.palestrante}</p>
        <p><strong>Descrição:</strong> ${evento.descricao}</p>
        <p><strong>Data de Início:</strong> ${formatarDataHora(evento.dataHora)}</p>
        <p><strong>Hora de Fim:</strong> ${formatarDataHora(evento.horaFim)}</p>
        <p><strong>Local:</strong> ${evento.local}</p>
        <p><strong>Vagas:</strong> ${evento.vagas}</p>
        <p><strong>Inscritos:</strong> ${inscritosCount}</p>
      `;
    })
    .catch(err => {
      console.error("Erro ao exibir detalhes:", err);
      mostrarModalMensagem("Erro ao exibir detalhes.", "erro");
    });
}

function editarEvento(id) {
  fetch(`https://portal-sale.onrender.com/eventos/${id}`)
    .then(res => res.json())
    .then(evento => {
      const usuariosList = document.getElementById("usuariosList");

      usuariosList.innerHTML = `
        <h3>Editar Evento</h3>
        <form id="formEditar">
          <label>Nome:</label>
          <input type="text" id="editNome" value="${evento.nome}" required><br>

          <label>Palestrante:</label>
          <input type="text" id="editPalestrante" value="${evento.palestrante}" required><br>

          <label>Descrição:</label>
          <textarea id="editDescricao" required>${evento.descricao}</textarea><br>

          <label>Data e Hora de Início:</label>
          <input type="text" id="editDataHora" value="${evento.dataHora}" required><br>

          <label>Hora de Fim:</label>
          <input type="text" id="editHoraFim" value="${evento.horaFim || ''}" required><br>

          <label>Local:</label>
          <input type="text" id="editLocal" value="${evento.local}" required><br>

          <label>Vagas:</label>
          <input type="number" id="editVagas" value="${evento.vagas}" required><br>

          <label>Tipo de Evento:</label>
          <select id="editTipoEvento" required>
            <option value="presencial" ${evento.tipoEvento === 'presencial' ? 'selected' : ''}>Presencial</option>
            <option value="online" ${evento.tipoEvento === 'online' ? 'selected' : ''}>Online</option>
          </select><br><br>

          <button type="submit">Salvar Alterações</button>
        </form>
      `;

      document.getElementById("formEditar").addEventListener("submit", (e) => {
        e.preventDefault();

        const objAtualizado = {
          nome: document.getElementById("editNome").value,
          palestrante: document.getElementById("editPalestrante").value,
          descricao: document.getElementById("editDescricao").value,
          dataHora: document.getElementById("editDataHora").value,
          horaFim: document.getElementById("editHoraFim").value,
          local: document.getElementById("editLocal").value,
          capacidadeMaxima: Number(document.getElementById("editVagas").value),
          tipoEvento: document.getElementById("editTipoEvento").value
        };

        fetch(`https://portal-sale.onrender.com/eventos/${id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(objAtualizado)
        })
          .then(res => {
            if (!res.ok) throw new Error("Erro ao atualizar evento");
            return res.json();
          })
          .then(() => {
            mostrarModalMensagem("Evento atualizado com sucesso!", "sucesso");
            carregarEventos();
          })
          .catch(err => {
            console.error("Erro ao atualizar:", err);
            mostrarModalMensagem("Falha ao atualizar evento.", "erro");
          });
      });
    })
    .catch(err => {
      console.error("Erro ao carregar evento para edição:", err);
      mostrarModalMensagem("Erro ao carregar evento para edição.", "erro");
    });
}

function verInscritos(eventoId) {
  const usuariosList = document.getElementById("usuariosList");
  usuariosList.innerHTML = `<p>Carregando inscritos...</p>`;

  fetch(`https://portal-sale.onrender.com/eventos/${eventoId}/inscritos`)
    .then(res => {
      if (!res.ok) throw new Error(`Inscritos não encontrados: ${res.status}`);
      return res.json();
    })
    .then(inscritos => {
      if (!inscritos || inscritos.length === 0) {
        usuariosList.innerHTML = "<p>Nenhum inscrito neste evento.</p>";
        return;
      }

      const eventoNome = inscritos[0]?.eventoNome || "Evento";
      usuariosList.innerHTML = `
        <h3>Usuários Inscritos</h3>
        <p><strong>Evento:</strong> ${eventoNome}</p>
        <p><strong>Total de inscritos:</strong> ${inscritos.length}</p>
        <div class="inscritos-list">
          ${inscritos.map(u => {
            return `<div class="inscrito-item"><strong>${u.nome}</strong> (${u.ra}) - <span class="inscrito-status ${u.presencaConfirmada ? 'status-confirmado' : 'status-nao-confirmado'}">${u.presencaConfirmada ? 'Presença confirmada' : 'Presença não confirmada'}</span></div>`;
          }).join("")}
        </div>
      `;
    })
    .catch(err => {
      console.error("Erro ao buscar inscritos:", err);
      mostrarModalMensagem("Erro ao buscar inscritos.", "erro");
      usuariosList.innerHTML = "<p>Não foi possível carregar os inscritos.</p>";
    });
}

async function excluirEvento(id) {
  const confirmado = await mostrarModalConfirmacao("Tem certeza que deseja excluir este evento?");
  if (!confirmado) return;

  fetch(`https://portal-sale.onrender.com/eventos/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao excluir");
      mostrarModalMensagem("Evento excluído.", "sucesso");
      carregarEventos();
    })
    .catch(err => {
      console.error("Erro ao excluir:", err);
      mostrarModalMensagem("Falha ao excluir evento.", "erro");
    })
}