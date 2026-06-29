package com.example.PortalSale.services;

import com.example.PortalSale.models.CodigoValidacao;
import com.example.PortalSale.models.Evento;
import com.example.PortalSale.models.InscricaoEvento;
import com.example.PortalSale.models.PresencaEvento;
import com.example.PortalSale.models.StatusInscricao;
import com.example.PortalSale.models.StatusPresenca;
import com.example.PortalSale.models.TipoValidacao;
import com.example.PortalSale.models.Usuario;
import com.example.PortalSale.repository.CodigoValidacaoRepository;
import com.example.PortalSale.repository.EventoRepository;
import com.example.PortalSale.repository.InscricaoEventoRepository;
import com.example.PortalSale.repository.PresencaEventoRepository;
import com.example.PortalSale.repository.UsuarioRepository;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PresencaService {

    private static final int CODIGO_DIGITOS = 6;
    private static final long CODIGO_EXPIRATION_MINUTES = 5;
    private static final int MAX_TENTATIVAS = 5;
    private static final double RAIO_METROS = 150.0;

    private final PresencaEventoRepository presencaEventoRepository;
    private final CodigoValidacaoRepository codigoValidacaoRepository;
    private final InscricaoEventoRepository inscricaoEventoRepository;
    private final EventoRepository eventoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public PresencaService(PresencaEventoRepository presencaEventoRepository,
                          CodigoValidacaoRepository codigoValidacaoRepository,
                          InscricaoEventoRepository inscricaoEventoRepository,
                          EventoRepository eventoRepository,
                          UsuarioRepository usuarioRepository,
                          PasswordEncoder passwordEncoder,
                          Clock clock) {
        this.presencaEventoRepository = presencaEventoRepository;
        this.codigoValidacaoRepository = codigoValidacaoRepository;
        this.inscricaoEventoRepository = inscricaoEventoRepository;
        this.eventoRepository = eventoRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Transactional
    public String solicitarCodigoCheckin(Long eventoId, Long usuarioId, String email, String ipRequisicao, String userAgent) {
        InscricaoEvento inscricao = obterInscricaoAtiva(eventoId, usuarioId, email);
        Evento evento = inscricao.getEvento();

        if (!isHorarioValidoParaPresenca(evento)) {
            throw new IllegalStateException("Check-in só pode ser solicitado próximo ao horário do evento.");
        }

        String codigo = gerarCodigoNumerico();
        CodigoValidacao validacao = criarCodigoValidacao(evento, inscricao.getUsuario(), TipoValidacao.CHECKIN, codigo);
        codigoValidacaoRepository.save(validacao);

        return codigo;
    }

    @Transactional
    public String solicitarCodigoCheckout(Long eventoId, Long usuarioId, String email, String ipRequisicao, String userAgent) {
        InscricaoEvento inscricao = obterInscricaoAtiva(eventoId, usuarioId, email);
        PresencaEvento presenca = presencaEventoRepository.findByInscricaoEventoId(inscricao.getId())
                .orElseThrow(() -> new IllegalStateException("Check-in não encontrado para esta inscrição."));

        if (presenca.getDataHoraCheckout() != null) {
            throw new IllegalStateException("Check-out já realizado para esta inscrição.");
        }

        String codigo = gerarCodigoNumerico();
        CodigoValidacao validacao = criarCodigoValidacao(inscricao.getEvento(), inscricao.getUsuario(), TipoValidacao.CHECKOUT, codigo);
        codigoValidacaoRepository.save(validacao);

        return codigo;
    }

    @Transactional
    public PresencaEvento validarCheckin(Long eventoId, Long usuarioId, String email, String codigo,
                                         Double latitude, Double longitude,
                                         String ipRequisicao, String userAgent) {
        InscricaoEvento inscricao = obterInscricaoAtiva(eventoId, usuarioId, email);
        Evento evento = inscricao.getEvento();

        if (presencaEventoRepository.existsByInscricaoEventoId(inscricao.getId())) {
            throw new IllegalStateException("Já existe check-in registrado para esta inscrição.");
        }

        if (evento.getTipoEvento() == null) {
            throw new IllegalStateException("Tipo de evento não definido.");
        }

        // REMOVIDO: Validação de localização independente do tipo de evento
        // Agora sempre gera QR code único para qualquer tipo de evento
        // if (evento.getTipoEvento() != com.example.PortalSale.models.EventoTipo.ONLINE) {
        //     validarLocalizacao(evento, latitude, longitude);
        // }

        CodigoValidacao validacao = validarCodigo(eventoId, usuarioId, inscricao.getUsuario().getEmail(), TipoValidacao.CHECKIN, codigo);

        PresencaEvento presenca = new PresencaEvento();
        presenca.setInscricaoEvento(inscricao);
        presenca.setDataHoraCheckin(LocalDateTime.now(clock));
        presenca.setIpRequisicao(ipRequisicao);
        presenca.setUserAgent(userAgent);
        presenca.setGeolocalizacao(formatCoords(latitude, longitude));
        presenca.setCodigoUsado("CHECKIN-" + validacao.getId());
        presenca.setStatusPresenca(StatusPresenca.PRESENTE);

        return presencaEventoRepository.save(presenca);
    }

    @Transactional
    public PresencaEvento validarCheckout(Long eventoId, Long usuarioId, String email, String codigo,
                                          Double latitude, Double longitude,
                                          String ipRequisicao, String userAgent) {
        InscricaoEvento inscricao = obterInscricaoAtiva(eventoId, usuarioId, email);
        PresencaEvento presenca = presencaEventoRepository.findByInscricaoEventoId(inscricao.getId())
                .orElseThrow(() -> new IllegalStateException("Check-in não encontrado para esta inscrição."));

        if (presenca.getDataHoraCheckout() != null) {
            throw new IllegalStateException("Check-out já foi realizado.");
        }

        Evento evento = inscricao.getEvento();
        // REMOVIDO: Validação de localização independente do tipo de evento
        // Agora sempre gera QR code único para qualquer tipo de evento
        // if (evento.getTipoEvento() != com.example.PortalSale.models.EventoTipo.ONLINE) {
        //     validarLocalizacao(evento, latitude, longitude);
        // }

        CodigoValidacao validacao = validarCodigo(eventoId, usuarioId, inscricao.getUsuario().getEmail(), TipoValidacao.CHECKOUT, codigo);

        presenca.setDataHoraCheckout(LocalDateTime.now(clock));
        presenca.setCodigoUsado("CHECKOUT-" + validacao.getId());
        presenca.setIpRequisicao(ipRequisicao);
        presenca.setUserAgent(userAgent);
        presenca.setGeolocalizacao(formatCoords(latitude, longitude));

        long minutos = Duration.between(presenca.getDataHoraCheckin(), presenca.getDataHoraCheckout()).toMinutes();
        presenca.setStatusPresenca(minutos < 15 ? StatusPresenca.PARCIAL : StatusPresenca.PRESENTE);

        return presencaEventoRepository.save(presenca);
    }

    public List<PresencaEvento> listarPresencas(Long eventoId) {
        return presencaEventoRepository.findByInscricaoEvento_EventoId(eventoId);
    }

    public boolean usuarioConfirmouPresenca(Long eventoId, Long usuarioId) {
        return presencaEventoRepository.existsByInscricaoEvento_UsuarioIdAndInscricaoEvento_EventoId(usuarioId, eventoId);
    }

    private InscricaoEvento obterInscricaoAtiva(Long eventoId, Long usuarioId, String email) {
        if (usuarioId != null) {
            return inscricaoEventoRepository.findByUsuarioIdAndEventoIdAndStatus(usuarioId, eventoId, StatusInscricao.INSCRITO)
                    .orElseThrow(() -> new IllegalStateException("Usuário não está inscrito neste evento."));
        }

        if (email != null && !email.isBlank()) {
            Usuario usuario = usuarioRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado para o e-mail informado."));
            return inscricaoEventoRepository.findByUsuarioIdAndEventoIdAndStatus(usuario.getId(), eventoId, StatusInscricao.INSCRITO)
                    .orElseThrow(() -> new IllegalStateException("Usuário não está inscrito neste evento."));
        }

        throw new IllegalArgumentException("Informações de usuário insuficientes para obter inscrição.");
    }

    private CodigoValidacao criarCodigoValidacao(Evento evento, Usuario usuario, TipoValidacao tipo, String codigo) {
        CodigoValidacao validacao = new CodigoValidacao();
        validacao.setEvento(evento);
        validacao.setUsuario(usuario);
        validacao.setTipo(tipo);
        validacao.setCodigoHash(passwordEncoder.encode(codigo));
        validacao.setCriadoEm(LocalDateTime.now(clock));
        validacao.setExpiracao(LocalDateTime.now(clock).plusMinutes(CODIGO_EXPIRATION_MINUTES));
        validacao.setUsado(false);
        validacao.setTentativas(0);
        return validacao;
    }

    private CodigoValidacao validarCodigo(Long eventoId, Long usuarioId, String email, TipoValidacao tipo, String codigo) {
        if (usuarioId == null && (email == null || email.isBlank())) {
            throw new IllegalArgumentException("Informações de usuário insuficientes para validar o código.");
        }

        if (usuarioId == null) {
            Usuario usuario = usuarioRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado para o e-mail informado."));
            usuarioId = usuario.getId();
        }

        CodigoValidacao validacao = codigoValidacaoRepository
                .findFirstByUsuarioIdAndEventoIdAndTipoAndUsadoFalseOrderByCriadoEmDesc(usuarioId, eventoId, tipo)
                .orElseThrow(() -> new IllegalArgumentException("Código de validação não encontrado ou expirado."));

        if (validacao.getExpiracao() == null || validacao.getExpiracao().isBefore(LocalDateTime.now(clock))) {
            throw new IllegalArgumentException("Código expirado.");
        }

        if (validacao.getTentativas() >= MAX_TENTATIVAS) {
            throw new IllegalStateException("Número máximo de tentativas excedido.");
        }

        if (!passwordEncoder.matches(codigo, validacao.getCodigoHash())) {
            validacao.setTentativas(validacao.getTentativas() + 1);
            codigoValidacaoRepository.save(validacao);
            throw new IllegalArgumentException("Código inválido.");
        }

        validacao.setUsado(true);
        codigoValidacaoRepository.save(validacao);
        return validacao;
    }

    private boolean isHorarioValidoParaPresenca(Evento evento) {
        if (evento.getHoraFim() == null) {
            return false;
        }
        LocalDateTime agora = LocalDateTime.now(clock);
        LocalDateTime inicioValidacao = evento.getHoraFim();
        LocalDateTime fimValidacao = evento.getHoraFim().plusHours(1);
        return !agora.isBefore(inicioValidacao) && !agora.isAfter(fimValidacao);
    }

    private String gerarCodigoNumerico() {
        SecureRandom random = new SecureRandom();
        int valor = random.nextInt(900000) + 100000;
        return String.valueOf(valor);
    }

    private void validarLocalizacao(Evento evento, Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude e longitude são obrigatórias para eventos presenciais.");
        }
        if (evento.getLatitude() == null || evento.getLongitude() == null) {
            throw new IllegalStateException("Evento presencial não possui localização cadastrada.");
        }
        if (!isDentroDoRaio(latitude, longitude, evento.getLatitude(), evento.getLongitude(), RAIO_METROS)) {
            throw new IllegalStateException("Você está fora da área permitida para validação presencial.");
        }
    }

    private boolean isDentroDoRaio(Double lat1, Double lon1, Double lat2, Double lon2, double raioMetros) {
        double earthRadius = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distancia = earthRadius * c;
        return distancia <= raioMetros;
    }

    private String formatCoords(Double latitude, Double longitude) {
        return latitude != null && longitude != null ? latitude + "," + longitude : null;
    }
}
