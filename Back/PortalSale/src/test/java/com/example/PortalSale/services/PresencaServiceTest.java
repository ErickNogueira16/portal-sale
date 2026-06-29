package com.example.PortalSale.services;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.PortalSale.models.CodigoValidacao;
import com.example.PortalSale.models.Evento;
import com.example.PortalSale.models.InscricaoEvento;
import com.example.PortalSale.models.StatusInscricao;
import com.example.PortalSale.models.Usuario;
import com.example.PortalSale.repository.CodigoValidacaoRepository;
import com.example.PortalSale.repository.EventoRepository;
import com.example.PortalSale.repository.InscricaoEventoRepository;
import com.example.PortalSale.repository.PresencaEventoRepository;
import com.example.PortalSale.repository.UsuarioRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class PresencaServiceTest {

    private static final ZoneId ZONE_ID = ZoneId.of("America/Sao_Paulo");

    @Mock
    private PresencaEventoRepository presencaEventoRepository;

    @Mock
    private CodigoValidacaoRepository codigoValidacaoRepository;

    @Mock
    private InscricaoEventoRepository inscricaoEventoRepository;

    @Mock
    private EventoRepository eventoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private InscricaoEvento inscricao;

    @BeforeEach
    void setUp() {
        Evento evento = new Evento();
        evento.setId(1L);
        evento.setHoraFim(LocalDateTime.of(2026, 6, 29, 18, 0));

        Usuario usuario = new Usuario();
        usuario.setId(2L);
        usuario.setEmail("aluno@example.com");

        inscricao = new InscricaoEvento();
        inscricao.setEvento(evento);
        inscricao.setUsuario(usuario);

        when(inscricaoEventoRepository.findByUsuarioIdAndEventoIdAndStatus(2L, 1L, StatusInscricao.INSCRITO))
                .thenReturn(Optional.of(inscricao));
    }

    @Test
    void deveRecusarPresencaAntesDaHoraFinalDoEvento() {
        PresencaService service = criarServiceEm("2026-06-29T20:59:59Z");

        assertThrows(IllegalStateException.class, () -> service.solicitarCodigoCheckin(1L, 2L, null, null, null));

        verify(codigoValidacaoRepository, never()).save(any(CodigoValidacao.class));
    }

    @Test
    void devePermitirPresencaNaHoraFinalDoEvento() {
        PresencaService service = criarServiceEm("2026-06-29T21:00:00Z");
        when(passwordEncoder.encode(any())).thenReturn("hash");
        when(codigoValidacaoRepository.save(any(CodigoValidacao.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> service.solicitarCodigoCheckin(1L, 2L, null, null, null));

        verify(codigoValidacaoRepository).save(any(CodigoValidacao.class));
    }

    @Test
    void devePermitirPresencaAteUmaHoraDepoisDaHoraFinalDoEvento() {
        PresencaService service = criarServiceEm("2026-06-29T22:00:00Z");
        when(passwordEncoder.encode(any())).thenReturn("hash");
        when(codigoValidacaoRepository.save(any(CodigoValidacao.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> service.solicitarCodigoCheckin(1L, 2L, null, null, null));

        verify(codigoValidacaoRepository).save(any(CodigoValidacao.class));
    }

    @Test
    void deveRecusarPresencaDepoisDaJanelaDeUmaHora() {
        PresencaService service = criarServiceEm("2026-06-29T22:00:01Z");

        assertThrows(IllegalStateException.class, () -> service.solicitarCodigoCheckin(1L, 2L, null, null, null));

        verify(codigoValidacaoRepository, never()).save(any(CodigoValidacao.class));
    }

    private PresencaService criarServiceEm(String instant) {
        Clock clock = Clock.fixed(Instant.parse(instant), ZONE_ID);
        return new PresencaService(
                presencaEventoRepository,
                codigoValidacaoRepository,
                inscricaoEventoRepository,
                eventoRepository,
                usuarioRepository,
                passwordEncoder,
                clock
        );
    }
}
