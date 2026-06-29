/**
 * Arquivo JavaScript específico para a página eventos.html
 * Contém funcionalidades para exibição e interação com eventos
 */

// Elementos do DOM
const eventsList = document.getElementById("eventsList");
const backButton = document.getElementById("backButton");
const filterButtons = document.querySelectorAll(".filter-button");
const eventCardTemplate = document.getElementById("event-card-template");

function saveAuthToken(token) {
  localStorage.setItem("token", token);
  sessionStorage.setItem("token", token);
  try {
    window.name = JSON.stringify({ token });
  } catch (error) {
    console.warn("Não foi possível salvar token em window.name", error);
  }
}
 
function getAuthToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");
  if (tokenFromUrl) {
    saveAuthToken(tokenFromUrl);
    return tokenFromUrl;
  }

  const tokenFromLocalStorage = localStorage.getItem("token");
  if (tokenFromLocalStorage) {
    return tokenFromLocalStorage;
  }

  const tokenFromSession = sessionStorage.getItem("token");
  if (tokenFromSession) {
    localStorage.setItem("token", tokenFromSession);
    return tokenFromSession;
  }

  try {
    const nameData = JSON.parse(window.name || "{}");
    if (nameData?.token) {
      saveAuthToken(
        nameData.token,
        nameData.role || localStorage.getItem("role") || sessionStorage.getItem("role") || "USER"
      );
      return nameData.token;
    }
  } catch (error) {
    console.warn("window.name não contém token válido", error);
  }

  return null;
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
      sessionStorage.setItem("role", nameData.role);
      localStorage.setItem("role", nameData.role);
      return nameData.role;
    }
  } catch (error) {
    console.warn("window.name não contém role válido", error);
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

function getAuthHeaders(contentType = "application/json") {
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

function redirectIfNotAuthenticated() {
  if (!getAuthToken()) {
    window.location.href = "../login/login.html";
    return true;
  }
  return false;
}

function getApiBaseUrl() {
  return window.API_BASE || "https://portal-sale.onrender.com";
}

function obterGeolocalizacao() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve(null);
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => resolve(null),
      { timeout: 8000 }
    );
  });
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
      padding: 30px;
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
      margin-bottom: 25px;
      line-height: 1.6;
    `;

    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.style.cssText = `
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

    buttonsWrapper.appendChild(botaoCancelar);
    buttonsWrapper.appendChild(botaoConfirmar);
    modal.appendChild(mensagem);
    modal.appendChild(buttonsWrapper);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
}

async function solicitarCodigoCheckin(eventoId) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Você precisa estar logado para usar a presença.");
  }
  const response = await fetch(`${getApiBaseUrl()}/presenca/checkin/solicitar-codigo/${eventoId}`, {
    method: "POST",
    headers: getAuthHeaders(null)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.mensagem || `Erro ao solicitar código: ${response.status}`);
  }

  if (data?.codigo) {
    await mostrarModalCodigo(data.codigo);
    return data.codigo;
  } else if (data?.mensagem) {
    await mostrarModalMensagem(data.mensagem, "aviso");
  }
  return null;
}

function mostrarModalCodigo(codigo) {
  return new Promise((resolve) => {
    // Criar overlay
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

    // Criar modal
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

    // Título
    const titulo = document.createElement('h2');
    titulo.textContent = 'Código de Presença';
    titulo.style.cssText = `
      color: #333;
      margin-bottom: 20px;
      font-size: 24px;
    `;

    // Código formatado
    const codigoDiv = document.createElement('div');
    codigoDiv.style.cssText = `
      background: #f8f9fa;
      border: 2px solid #007bff;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
      font-size: 32px;
      font-weight: bold;
      color: #007bff;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    `;
    codigoDiv.textContent = codigo;

    // Instruções
    const instrucoes = document.createElement('p');
    instrucoes.textContent = 'Anote este código. Ele será solicitado para confirmar sua presença.';
    instrucoes.style.cssText = `
      color: #666;
      margin: 15px 0;
      font-size: 14px;
    `;

    // Botão OK
    const botaoOk = document.createElement('button');
    botaoOk.textContent = 'Entendi';
    botaoOk.style.cssText = `
      background: #007bff;
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 20px;
      transition: background 0.3s;
    `;
    botaoOk.onmouseover = () => botaoOk.style.background = '#0056b3';
    botaoOk.onmouseout = () => botaoOk.style.background = '#007bff';

    const fecharModal = () => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      resolve();
    };

    botaoOk.onclick = fecharModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        fecharModal();
      }
    };

    modal.appendChild(titulo);
    modal.appendChild(codigoDiv);
    modal.appendChild(instrucoes);
    modal.appendChild(botaoOk);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(() => {
      if (document.body.contains(overlay)) {
        fecharModal();
      }
    }, 30000);
  });
}

async function validarCheckin(eventoId, codigo, latitude, longitude) {
  const response = await fetch(`${getApiBaseUrl()}/presenca/checkin/validar`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ eventoId, codigo, latitude, longitude })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.erro || data?.mensagem || `Erro ao validar presença: ${response.status}`);
  }
  return data;
}

/**
 * Cria um elemento HTML para um evento usando o template
 * @param {Object} evento - Dados do evento
 * @returns {HTMLElement} Elemento HTML do evento
 */
function criarElementoEvento(evento) {
  const template = eventCardTemplate.content.cloneNode(true);
  const card = template.querySelector(".event-card");

  // Adiciona categoria e estilo
  const categoryBadge = card.querySelector(".event-card__category");
  categoryBadge.textContent =
    evento.tipoEvento.charAt(0).toUpperCase() + evento.tipoEvento.slice(1);
  categoryBadge.classList.add(`event-card__category--${evento.tipoEvento}`);

  // Preenche os dados do evento
  card.querySelector(".event-card__title").textContent = evento.nome;
  card.querySelector(".event-card__description").textContent = evento.descricao;
  card.querySelector(".event-card__time").textContent = `Início: ${formatarDataHora(evento.dataHora)}`;
  card.querySelector(".event-card__end-time").textContent = `Fim: ${formatarDataHora(evento.horaFim)}`;
  card.querySelector(".event-card__location").textContent = evento.local;
  card.querySelector(".event-card__speaker").textContent = evento.palestrante;

  // Favoritos – AGORA USANDO A ESTRELA DO TEMPLATE
const favoritos = obterFavoritos();
const botaoFavorito = card.querySelector(".favorite-button");
const estrela = botaoFavorito.querySelector(".star-icon");

// Define estado inicial
if (favoritos.includes(evento.id)) {
  estrela.textContent = "★";
  botaoFavorito.classList.add("favorited");
} else {
  estrela.textContent = "☆";
}

// Clique para favoritar
botaoFavorito.addEventListener("click", () => {
  alternarFavorito(evento.id, estrela, botaoFavorito);
});


  // -----------------------------------------------
  // CORREÇÃO DO NaN — garante que vagas sejam números
  // -----------------------------------------------
  const status = card.querySelector(".event-card__status");

  const vagas = Number(evento.capacidadeMaxima) || 0;
  const inscritos = Number(evento.inscritos) || 0;

  let vagasRestantes = vagas - inscritos;
  if (vagasRestantes < 0) vagasRestantes = 0;

  if (vagasRestantes === 0) {
    status.textContent = `Vagas esgotadas`;
    status.classList.add("event-card__status--limited");
  } else if (vagasRestantes === 1) {
    status.textContent = `Última vaga!`;
    status.classList.add("event-card__status--limited");
  } else if (vagasRestantes >= 2 && vagasRestantes <= 10) {
    status.textContent = `Últimas ${vagasRestantes} vagas!`;
    status.classList.add("event-card__status--limited");
  } else {
    status.textContent = `${vagasRestantes} vagas disponíveis`;
    status.classList.add("event-card__status--available");
  }

  // Configura o botão de inscrição
  const presencaButton = card.querySelector(".event-card__presenca-button");
  
  // Verificar se está no horário de presença (entre horaFim e horaFim + 1 hora)
  const agora = new Date();
  const horaFim = new Date(evento.horaFim);
  const horaFimMais1 = new Date(horaFim.getTime() + 60 * 60 * 1000);
  
  const janelaInicio = horaFim;
  const janelaFim = horaFimMais1;
  if (agora < janelaInicio || agora > janelaFim) {
    presencaButton.disabled = true;
    presencaButton.style.opacity = "0.5";
    presencaButton.title = `Presença disponível entre ${formatarDataHora(janelaInicio)} e ${formatarDataHora(janelaFim)}`;
  }
  
  presencaButton.addEventListener("click", async () => {
    try {
      // Verificar se está no horário de presença (entre horaFim e horaFim + 1 hora)
      const agora = new Date();
      const horaFim = new Date(evento.horaFim);
      const horaFimMais1 = new Date(horaFim.getTime() + 60 * 60 * 1000);

      if (agora < horaFim || agora > horaFimMais1) {
        throw new Error(`Presença só pode ser confirmada entre ${formatarDataHora(horaFim)} e ${formatarDataHora(horaFimMais1)}`);
      }

      const codigoRecebido = await solicitarCodigoCheckin(evento.id);
      if (!codigoRecebido) {
        return; // Código não foi gerado
      }

      const codigoDigitado = await mostrarModalInputCodigo();
      if (!codigoDigitado) {
        return; // Usuário cancelou
      }

      const geolocalizacao = await obterGeolocalizacao();
      await validarCheckin(evento.id, codigoDigitado, geolocalizacao?.split(",")[0], geolocalizacao?.split(",")[1]);
      await mostrarModalMensagem("Presença validada com sucesso!", "sucesso");
    } catch (error) {
      console.error(error);
      await mostrarModalMensagem(error.message || "Erro ao marcar presença.", "erro");
    }
  });

  const signupButton = card.querySelector(".event-card__signup-button");
  // Verificar status de inscrição do usuário
  verificarStatusInscricao(evento.id, signupButton, vagasRestantes, evento.dataHora);
  verificarPresencaConfirmada(evento.id, card, presencaButton, status);
  signupButton.addEventListener("click", () => inscreverEvento(evento.id, signupButton));

  // Adiciona delay para animação
  card.style.animationDelay = `${Math.random() * 0.3}s`;

  return card;
}

/**
 * Carrega os eventos na página
 * @param {string} filtro - Categoria para filtrar os eventos
 */
function ehEventoVisivel(evento, agora) {
  const inicioEvento = new Date(evento.dataHora);
  const fimEvento = new Date(evento.horaFim);

  if (isNaN(inicioEvento.getTime())) {
    return true;
  }

  const aindaNaoComecou = agora < inicioEvento;
  if (aindaNaoComecou) {
    return true;
  }

  if (isNaN(fimEvento.getTime())) {
    return false;
  }

  const limiteVisibilidade = new Date(fimEvento.getTime() + 24 * 60 * 60 * 1000);
  return agora >= fimEvento && agora <= limiteVisibilidade;
}

function carregarEventos(filtro = "all") {
  if (redirectIfNotAuthenticated()) return;

  fetch(`${getApiBaseUrl()}/eventos`, {
    headers: getAuthHeaders()
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erro ao carregar os eventos: ${response.status}`);
      }
      return response.json();
    })
    .then((eventos) => {
      eventsList.innerHTML = "";

      const favoritos = obterFavoritos();
      let eventosFiltrados;

      const ehAdmin = getAuthRole() === "ADMIN";
      const agora = new Date();
      const eventosVisiveis = eventos.filter((evento) => {
        if (ehAdmin) {
          return true;
        }
        return ehEventoVisivel(evento, agora);
      });

      if (filtro === "all") {
        eventosFiltrados = eventosVisiveis;
      } else if (filtro === "favoritos") {
        eventosFiltrados = eventosVisiveis.filter((evento) =>
          favoritos.includes(evento.id)
        );
      } else {
        eventosFiltrados = eventosVisiveis.filter(
          (evento) => evento.tipoEvento === filtro
        );
      }

      if (eventosFiltrados.length === 0) {
        eventsList.innerHTML = `
          <div class="events-empty-message">
            <p>Não há eventos disponíveis para exibir no momento.</p>
          </div>
        `;
        return;
      }

      eventosFiltrados.forEach((evento) => {
        const eventoElement = criarElementoEvento(evento);
        eventsList.appendChild(eventoElement);
      });
    })
    .catch((error) => {
      console.error("Erro ao carregar eventos", error);
      mostrarModalMensagem("Erro ao carregar eventos.", "erro");
    });
}

function salvarEventos(favoritos) {
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
}

function obterFavoritos() {
  return JSON.parse(localStorage.getItem("favoritos")) || [];
}

function alternarFavorito(eventoId, botao) {
  let favoritos = obterFavoritos();

  if (favoritos.includes(eventoId)) {
    favoritos = favoritos.filter((id) => id !== eventoId);
    botao.textContent = "☆";
    botao.classList.remove("favorited");
  } else {
    favoritos.push(eventoId);
    botao.textContent = "★";
    botao.classList.add("favorited");
  }

  salvarEventos(favoritos);
}

/**
 * Função para inscrição em um evento
 * @param {number} eventoId
 * @param {HTMLElement} botao - O botão de inscrição
 */
function inscreverEvento(eventoId, botao) {
  if (redirectIfNotAuthenticated()) return;

  // Desabilitar botão imediatamente para evitar múltiplas inscrições
  botao.disabled = true;
  botao.innerHTML = '<span class="button-text">Processando...</span>';

  fetch(`${getApiBaseUrl()}/eventos/${eventoId}/inscricao`, {
    method: "POST",
    headers: getAuthHeaders(null)
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        // Reabilitar botão se falhar
        botao.disabled = false;
        botao.innerHTML = '<span class="button-text">Inscrever-se</span><i class="fas fa-arrow-right"></i>';
        const errorMessage = errorData?.mensagem || errorData?.error || `Erro ao inscrever: ${response.status}`;
        throw new Error(errorMessage);
      }
      return response.json();
    })
    .then(() => {
      // Sucesso - manter botão desabilitado e alterar texto
      botao.innerHTML = '<span class="button-text">Inscrito</span>';
      botao.style.opacity = "0.5";
      botao.style.backgroundColor = "#28a745";

      // Recarregar eventos para atualizar contadores
      carregarEventos(
        document.querySelector(".filter-button.active").dataset.filter
      );
    })
    .catch((error) => {
      console.error("Erro ao processar inscrição:", error);
      mostrarModalMensagem("Erro ao processar inscrição: " + error.message, "erro");
    });
}

/**
 * Excluir evento
 */
async function excluirEvento(eventoId) {
  const confirmado = await mostrarModalConfirmacao("Tem certeza que deseja excluir este evento?");
  if (!confirmado) return;

  fetch(`${getApiBaseUrl()}/eventos/${eventoId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
    .then((response) => {
      if (response.ok) {
        mostrarModalMensagem("Evento excluído com sucesso!", "sucesso");

        let favoritos = obterFavoritos();
        favoritos = favoritos.filter((id) => id !== eventoId);
        salvarEventos(favoritos);

        const filtroAtivo =
          document.querySelector(".filter-button.active").dataset.filter;
        carregarEventos(filtroAtivo);
      } else {
        throw new Error(`Erro ao excluir evento: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error("Erro ao excluir evento:", error);
      mostrarModalMensagem("Erro ao excluir o evento.", "erro");
    });
}


// Botão voltar
document.addEventListener("DOMContentLoaded", () => {
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", () => {
      // Volta para login.html que vai exibir o painel principal se o token for válido
      window.location.href = "../login/login.html";
    });
  }
});

/**
 * Verifica se o usuário está inscrito em um evento e atualiza o botão
 * @param {number} eventoId
 * @param {HTMLElement} botao
 * @param {number} vagasRestantes
 * @param {string} dataHora - Data/hora de início do evento
 */
function verificarStatusInscricao(eventoId, botao, vagasRestantes, dataHora) {
  if (!getAuthToken()) return;

  // Verificar se o evento já começou
  const agora = new Date();
  const inicioEvento = new Date(dataHora);
  if (agora > inicioEvento) {
    botao.disabled = true;
    botao.innerHTML = '<span class="button-text">Evento iniciado</span>';
    botao.style.opacity = "0.5";
    return;
  }

  fetch(`${getApiBaseUrl()}/eventos/${eventoId}/inscricao/status`, {
    headers: getAuthHeaders()
  })
    .then(response => response.json())
    .then(data => {
      if (data.inscrito) {
        // Usuário já está inscrito
        botao.disabled = true;
        botao.innerHTML = '<span class="button-text">Inscrito</span>';
        botao.style.opacity = "0.5";
        botao.style.backgroundColor = "#28a745";
      } else if (vagasRestantes === 0) {
        // Não há vagas
        botao.disabled = true;
        botao.innerHTML = '<span class="button-text">Esgotado</span>';
        botao.style.opacity = "0.5";
      }
    })
    .catch(error => {
      console.error("Erro ao verificar status de inscrição:", error);
      // Em caso de erro, manter botão habilitado
    });
}

function verificarPresencaConfirmada(eventoId, card, presencaButton, status) {
  if (!getAuthToken()) return;

  fetch(`${getApiBaseUrl()}/eventos/${eventoId}/presenca/status`, {
    headers: getAuthHeaders()
  })
    .then(async response => {
      if (!response.ok) {
        throw new Error(`Status de presença não disponível: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.presente) {
        card.classList.add("event-card--confirmed");
        status.textContent = "Presença confirmada";
        status.classList.remove("event-card__status--available", "event-card__status--limited");
        status.classList.add("event-card__status--confirmed");
        presencaButton.disabled = true;
        presencaButton.style.opacity = "0.5";
        const texto = presencaButton.querySelector(".button-text");
        if (texto) texto.textContent = "Confirmada";
      }
    })
    .catch(error => {
      console.error("Erro ao verificar status de presença:", error);
    });
}

function mostrarModalInputCodigo() {
  return new Promise((resolve) => {
    // Criar overlay
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
      z-index: 10002;
      font-family: Arial, sans-serif;
    `;

    // Criar modal
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
      z-index: 10003;
    `;

    // Título
    const titulo = document.createElement('h2');
    titulo.textContent = 'Digite o Código de Presença';
    titulo.style.cssText = `
      color: #333;
      margin-bottom: 20px;
      font-size: 24px;
    `;

    // Campo de entrada
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '000000';
    input.maxLength = 6;
    input.style.cssText = `
      width: 100%;
      padding: 15px;
      font-size: 24px;
      text-align: center;
      border: 2px solid #007bff;
      border-radius: 8px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      letter-spacing: 5px;
      box-sizing: border-box;
    `;

    // Focar no input automaticamente
    setTimeout(() => input.focus(), 100);

    // Instruções
    const instrucoes = document.createElement('p');
    instrucoes.textContent = 'Digite o código de 6 dígitos que você recebeu.';
    instrucoes.style.cssText = `
      color: #666;
      margin: 15px 0;
      font-size: 14px;
    `;

    // Container dos botões
    const botoesContainer = document.createElement('div');
    botoesContainer.style.cssText = `
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 25px;
    `;

    // Botão Confirmar
    const botaoConfirmar = document.createElement('button');
    botaoConfirmar.textContent = 'Confirmar';
    botaoConfirmar.style.cssText = `
      background: #28a745;
      color: white;
      border: none;
      padding: 12px 25px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
    `;
    botaoConfirmar.onmouseover = () => botaoConfirmar.style.background = '#218838';
    botaoConfirmar.onmouseout = () => botaoConfirmar.style.background = '#28a745';

    // Botão Cancelar
    const botaoCancelar = document.createElement('button');
    botaoCancelar.textContent = 'Cancelar';
    botaoCancelar.style.cssText = `
      background: #dc3545;
      color: white;
      border: none;
      padding: 12px 25px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
    `;
    botaoCancelar.onmouseover = () => botaoCancelar.style.background = '#c82333';
    botaoCancelar.onmouseout = () => botaoCancelar.style.background = '#dc3545';

    // Eventos dos botões
    const confirmar = () => {
      const codigo = input.value.trim();
      if (codigo.length === 6 && /^\d{6}$/.test(codigo)) {
        document.body.removeChild(overlay);
        resolve(codigo);
      } else {
        input.style.borderColor = '#dc3545';
        instrucoes.textContent = 'Código deve ter exatamente 6 dígitos numéricos.';
        instrucoes.style.color = '#dc3545';
        setTimeout(() => {
          input.style.borderColor = '#007bff';
          instrucoes.textContent = 'Digite o código de 6 dígitos que você recebeu.';
          instrucoes.style.color = '#666';
        }, 2000);
      }
    };

    const cancelar = () => {
      document.body.removeChild(overlay);
      resolve(null);
    };

    botaoConfirmar.onclick = confirmar;
    botaoCancelar.onclick = cancelar;

    // Permitir Enter para confirmar
    input.onkeypress = (e) => {
      if (e.key === 'Enter') {
        confirmar();
      }
    };

    // Montar modal
    botoesContainer.appendChild(botaoConfirmar);
    botoesContainer.appendChild(botaoCancelar);
    modal.appendChild(titulo);
    modal.appendChild(input);
    modal.appendChild(instrucoes);
    modal.appendChild(botoesContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Fechar modal ao clicar no overlay
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cancelar();
      }
    };
  });
}

// Filtros
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    carregarEventos(button.dataset.filter);
  });
});

// Inicialização
document.addEventListener("DOMContentLoaded", () => carregarEventos());
