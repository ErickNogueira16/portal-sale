// Elementos do DOM
const loginButton = document.getElementById("loginButton");
const forgotPassword = document.getElementById("forgotPassword");
const calendarIcon = document.getElementById("calendarIcon");
const historyButton = document.getElementById("historyButton");
const logoutButton = document.getElementById("logoutButton");
const markEventsButton = document.getElementById("markEventsButton");
const matriculaInput = document.getElementById("matricula");
const senhaInput = document.getElementById("senha");
const calendarGrid = document.getElementById("calendarGrid");
const calendarMonthYear = document.getElementById("calendarMonthYear");

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
    saveAuthData(tokenFromUrl, roleFromUrl || localStorage.getItem("role") || sessionStorage.getItem("role") || "USER");
    return tokenFromUrl;
  }

  const tokenFromLocalStorage = localStorage.getItem("token");
  if (tokenFromLocalStorage) {
    return tokenFromLocalStorage;
  }

  const tokenFromSession = sessionStorage.getItem("token");
  if (tokenFromSession) {
    localStorage.setItem("token", tokenFromSession);
    localStorage.setItem("role", sessionStorage.getItem("role") || localStorage.getItem("role") || "USER");
    return tokenFromSession;
  }

  try {
    const nameData = JSON.parse(window.name || "{}");
    if (nameData?.token) {
      saveAuthData(nameData.token, nameData.role || localStorage.getItem("role") || sessionStorage.getItem("role") || "USER");
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

function logout() {
  clearAuthToken();
  window.location.href = "login.html";
}

function addTokenToUrl(url) {
  const token = getAuthToken();
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

function formatarDataHora(valor) {
  if (!valor) return "N/A";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return valor;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(data);
}

function validarLogin() {
  const ra = matriculaInput.value;
  const senha = senhaInput.value;

  if (!ra || !senha) {
    return;
  }

    fetch("https://portal-sale.onrender.com/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ra, senha })
  })
    .then(async response => {
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.mensagem || "Credenciais inválidas");
      }

      return data;
    })
    .then(usuario => {
      // Salva token e role
      saveAuthData(usuario.token, usuario.role);

      if (usuario.role === "ADMIN") {
        window.location.href = "../admin/admin.html";
      } else {
        mostrarPainelPrincipal();
        carregarCalendarioEventos();
        window.location.hash = "dashboard";
      }
    })
    .catch(error => {
      mostrarMensagem(error.message || "Erro ao realizar login.", "erro");
    });
}

function mostrarMensagem(msg, tipo = "info") {
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
}

function mostrarPainelPrincipal() {
  document.querySelector(".login").style.display = "none";
  document.querySelector(".main").style.display = "block";
}

function obterEventosMesAtual(eventos) {
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();
  return eventos.filter(evento => {
    const data = new Date(evento.dataHora);
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  });
}

function renderizarCalendario(eventos) {
  if (!calendarGrid || !calendarMonthYear) return;

  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const nomeMes = agora.toLocaleDateString('pt-BR', { month: 'long' });
  calendarMonthYear.textContent = `${nomeMes.charAt(0).toUpperCase()}${nomeMes.slice(1)} ${ano}`;

  const primeiroDia = new Date(ano, mes, 1);
  const diaSemanaInicio = primeiroDia.getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  calendarGrid.innerHTML = '';

  diasSemana.forEach(dia => {
    const cabecalho = document.createElement('div');
    cabecalho.className = 'calendar-widget__weekday';
    cabecalho.textContent = dia;
    calendarGrid.appendChild(cabecalho);
  });

  const eventosDoMes = obterEventosMesAtual(eventos);
  const dadosEventosPorDia = eventosDoMes.reduce((map, evento) => {
    const data = new Date(evento.dataHora);
    const dia = data.getDate();
    const lista = map.get(dia) || [];
    lista.push({
      nome: evento.nome,
      dataHora: evento.dataHora,
      horaFim: evento.horaFim
    });
    map.set(dia, lista);
    return map;
  }, new Map());

  const tooltip = document.querySelector('.calendar-tooltip') || document.createElement('div');
  tooltip.className = 'calendar-tooltip hidden';
  if (!document.body.contains(tooltip)) {
    document.body.appendChild(tooltip);
  }

  for (let i = 0; i < diaSemanaInicio; i += 1) {
    const celula = document.createElement('div');
    celula.className = 'calendar-widget__day calendar-widget__day--other-month';
    calendarGrid.appendChild(celula);
  }

  for (let dia = 1; dia <= diasNoMes; dia += 1) {
    const celula = document.createElement('div');
    celula.className = 'calendar-widget__day';

    const numero = document.createElement('span');
    numero.className = 'calendar-widget__date';
    numero.textContent = dia;
    celula.appendChild(numero);

    const eventosDoDia = dadosEventosPorDia.get(dia) || [];
    if (eventosDoDia.length > 0) {
      celula.classList.add('calendar-widget__day--has-events');

      const eventosLista = document.createElement('div');
      eventosLista.className = 'calendar-widget__events';
      eventosDoDia.slice(0, 2).forEach(evento => {
        const item = document.createElement('div');
        item.className = 'calendar-widget__event';
        item.textContent = evento.nome;
        eventosLista.appendChild(item);
      });
      if (eventosDoDia.length > 2) {
        const mais = document.createElement('div');
        mais.className = 'calendar-widget__event';
        mais.textContent = `+${eventosDoDia.length - 2} mais`;
        eventosLista.appendChild(mais);
      }
      celula.appendChild(eventosLista);

      celula.addEventListener('mouseenter', () => {
        const conteudo = eventosDoDia
          .map(ev => `
            <div class="calendar-tooltip__item">
              <strong>${ev.nome}</strong>
              <span>${formatarDataHora(ev.dataHora)} – ${formatarDataHora(ev.horaFim)}</span>
            </div>
          `)
          .join('');
        tooltip.innerHTML = conteudo;
        const rect = celula.getBoundingClientRect();
        tooltip.style.left = `${Math.min(rect.left + window.scrollX, window.innerWidth - 320)}px`;
        tooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
        tooltip.classList.remove('hidden');
      });

      celula.addEventListener('mouseleave', () => {
        tooltip.classList.add('hidden');
      });
    }

    calendarGrid.appendChild(celula);
  }

  if (eventosDoMes.length === 0) {
    const vazio = document.createElement('div');
    vazio.className = 'calendar-widget__empty';
    vazio.textContent = 'Nenhum evento agendado para este mês.';
    calendarGrid.appendChild(vazio);
  }
}

function carregarCalendarioEventos() {
  if (!calendarGrid || !calendarMonthYear) return;

    fetch('https://portal-sale.onrender.com/eventos')
    .then(async res => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(eventos => renderizarCalendario(eventos))
    .catch(error => {
      console.error('Erro ao carregar eventos para o calendário:', error);
      calendarGrid.innerHTML = '<div class="calendar-widget__empty">Não foi possível carregar o calendário.</div>';
    });
}

// Redirecionamentos do painel
function redirecionarParaEventos() {
  window.location.href = addTokenToUrl("../eventos/eventos_novo.html#dashboard");
}

function redirecionarParaHistorico() {
  window.location.href = addTokenToUrl("../historico/historico.html");
}

function redirecionarParaMarcarEventos() {
  window.location.href = addTokenToUrl("../cadastro/cadastro.html#dashboard");
}

function atualizarEstatisticas() {
  const numeroEventosElement = document.querySelector(".stat-item__number");

    fetch("https://portal-sale.onrender.com/eventos")
    .then(res => res.json())
    .then(eventos => {
      numeroEventosElement.textContent = eventos.length;
    })
    .catch(() => numeroEventosElement.textContent = "0");
}

// EVENTOS
loginButton.addEventListener("click", validarLogin);
forgotPassword.addEventListener("click", () => {
  mostrarMensagem("Para recuperar sua senha, envie um email para a secretaria.", "aviso");
});
calendarIcon.addEventListener("click", redirecionarParaEventos);
if (historyButton) {
  historyButton.addEventListener("click", redirecionarParaHistorico);
}
if (logoutButton) {
  logoutButton.addEventListener("click", logout);
}
if (markEventsButton) {
  markEventsButton.addEventListener("click", redirecionarParaMarcarEventos);
}

// Enter para logar
senhaInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") validarLogin();
});

// Único DOMContentLoaded que cuida de toda a lógica de inicialização
document.addEventListener("DOMContentLoaded", () => {
  const token = getAuthToken();
  const role = getAuthRole();

  // Se há um token, valida no servidor antes de conceder acesso
  if (token) {
      fetch("https://portal-sale.onrender.com/auth/validate", {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Token inválido ou expirado");
      }
      return response.json();
    })
    .then(data => {
      // Token válido
      if (role === "ADMIN") {
        window.location.href = "../admin/admin.html";
        return;
      }
      // Mostra o painel principal com o calendário e estatísticas
      mostrarPainelPrincipal();
      atualizarEstatisticas();
      carregarCalendarioEventos();
    })
    .catch(error => {
      // Token inválido, limpa e mostra login
      clearAuthToken();
      console.warn("Token validation failed:", error.message);
      // Deixa o formulário de login visível (estado padrão)
    });
    return;
  }

  // Se não há token, mostra apenas o formulário de login
  // O painel principal só aparece após autenticação válida
});