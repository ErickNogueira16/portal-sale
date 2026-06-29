const historicoContainer = document.getElementById("historicoContainer");
const backButton = document.getElementById("backButton");

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
    saveAuthData(tokenFromUrl, roleFromUrl || "USER");
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

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function addTokenToUrl(url) {
  const token = getAuthToken();
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

function redirectToLogin() {
  window.location.href = addTokenToUrl("../login/index.html");
}

function getApiBaseUrl() {
  return window.API_BASE || "https://portal-sale.onrender.com";
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

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function carregarHistorico() {
  const token = getAuthToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  fetch(`${getApiBaseUrl()}/eventos/inscricoes/me`, {
    headers: getAuthHeaders()
  })
    .then(async response => {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          redirectToLogin();
          throw new Error("Usuário não autorizado. Faça login novamente.");
        }
        const body = await response.json().catch(() => null);
        const message = body?.mensagem || body?.error || await response.text().catch(() => "");
        throw new Error(message || `HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(eventos => {
      historicoContainer.innerHTML = "";
      if (!eventos || eventos.length === 0) {
        historicoContainer.innerHTML = `
          <div class="historico-empty">
            Você ainda não está inscrito em nenhum evento.
          </div>
        `;
        return;
      }

      eventos.forEach(evento => {
        const card = document.createElement("div");
        card.className = "historico-card";
        card.innerHTML = `
          <h2>${evento.nome}</h2>
          <p>${evento.descricao || "Sem descrição disponível."}</p>
          <div class="evento-meta">
            <span>Data: ${formatarDataHora(evento.dataHora)}</span>
            <span>Fim: ${formatarDataHora(evento.horaFim)}</span>
            <span>Local: ${evento.local || "Online"}</span>
            <span>Tipo: ${evento.tipoEvento || "Desconhecido"}</span>
          </div>
        `;
        historicoContainer.appendChild(card);
      });
    })
    .catch(error => {
      historicoContainer.innerHTML = `
        <div class="historico-empty">
          Erro ao carregar histórico: ${error.message}
        </div>
      `;
      console.error(error);
    });
}

backButton.addEventListener("click", () => {
  window.location.href = addTokenToUrl("../login/index.html");
});

window.addEventListener("DOMContentLoaded", carregarHistorico);
