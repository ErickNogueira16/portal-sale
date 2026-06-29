package com.example.PortalSale.services;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.PortalSale.models.Evento;
import com.example.PortalSale.models.InscricaoEvento;
import com.example.PortalSale.models.StatusInscricao;
import com.example.PortalSale.models.Usuario;
import com.example.PortalSale.repository.EventoRepository;
import com.example.PortalSale.repository.InscricaoEventoRepository;
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

@ExtendWith(MockitoExtension.class)
class InscricaoServiceTest {

    private static final ZoneId ZONE_ID = ZoneId.of("America/Sao_Paulo");

    @Mock
    private InscricaoEventoRepository inscricaoEventoRepository;

    @Mock
    private EventoRepository eventoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private Evento evento;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        evento = new Evento();
        evento.setId(1L);
        evento.setDataHora(LocalDateTime.of(2026, 6, 29, 17, 0));
        evento.setCapacidadeMaxima(10);

        usuario = new Usuario();
        usuario.setId(2L);

        when(eventoRepository.findById(1L)).thenReturn(Optional.of(evento));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(usuario));
    }

    @Test
    void devePermitirInscricaoAntesDoHorarioDeInicioDoEvento() {
        InscricaoService service = criarServiceEm("2026-06-29T19:59:00Z");
        when(inscricaoEventoRepository.save(any(InscricaoEvento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> service.inscrever(1L, 2L));

        verify(inscricaoEventoRepository).save(any(InscricaoEvento.class));
    }

    @Test
    void devePermitirInscricaoNoHorarioExatoDeInicioDoEvento() {
        InscricaoService service = criarServiceEm("2026-06-29T20:00:00Z");
        when(inscricaoEventoRepository.save(any(InscricaoEvento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> service.inscrever(1L, 2L));

        verify(inscricaoEventoRepository).save(any(InscricaoEvento.class));
    }

    @Test
    void deveRecusarInscricaoDepoisDoHorarioDeInicioDoEvento() {
        InscricaoService service = criarServiceEm("2026-06-29T20:00:01Z");

        assertThrows(IllegalStateException.class, () -> service.inscrever(1L, 2L));

        verify(inscricaoEventoRepository, never()).existsByUsuarioIdAndEventoIdAndStatus(2L, 1L, StatusInscricao.INSCRITO);
        verify(inscricaoEventoRepository, never()).save(any(InscricaoEvento.class));
    }

    private InscricaoService criarServiceEm(String instant) {
        Clock clock = Clock.fixed(Instant.parse(instant), ZONE_ID);
        return new InscricaoService(
                inscricaoEventoRepository,
                eventoRepository,
                usuarioRepository,
                clock
        );
    }
}
