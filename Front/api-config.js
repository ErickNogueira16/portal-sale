(function(){
  // Define a global API_BASE used by client scripts if needed
  // - Em ambiente de desenvolvimento (localhost) aponta para backend local
  // - Em produção aponta para a URL de deploy
  var hostname = window.location.hostname;
  if (window.location.protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1') {
    window.API_BASE = 'http://localhost:8081';
  } else {
    window.API_BASE = 'https://portal-sale.onrender.com';
  }
})();
