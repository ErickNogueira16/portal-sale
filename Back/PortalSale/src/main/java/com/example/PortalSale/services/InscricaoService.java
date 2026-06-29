package com.example.PortalSale.services;

import com.example.PortalSale.dto.InscritoDto;
import com.example.PortalSale.models.Evento;
import com.example.PortalSale.models.InscricaoEvento;
import com.example.PortalSale.models.StatusInscricao;
import com.example.PortalSale.models.Usuario;
import com.example.PortalSale.repository.EventoRepository;
import com.example.PortalSale.repository.InscricaoEventoRepository;
import com.example.PortalSale.repository.UsuarioRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InscricaoService {

    private final InscricaoEventoRepository inscricaoEventoRepository;
    private final EventoRepository eventoRepository;
    private final UsuarioRepository usuarioRepository;
    private final Clock clock;

    public InscricaoService(InscricaoEventoRepository inscricaoEventoRepository,
                            EventoRepository eventoRepository,
                            UsuarioRepository usuarioRepository,
                            Clock clock) {
        this.inscricaoEventoRepository = inscricaoEventoRepository;
        this.eventoRepository = eventoRepository;
        this.usuarioRepository = usuarioRepository;
        this.clock = clock;
    }

    @Transactional
    public InscricaoEvento inscrever(Long eventoId, Long usuarioId) {
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new IllegalArgumentException("Evento não encontrado."));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        // Inscrições permitidas apenas até o horário de início do evento
        if (evento.getDataHora() == null) {
            throw new IllegalStateException("Evento não possui data de início definida.");
        }
        LocalDateTime agora = LocalDateTime.now(clock);
        if (!agora.isBefore(evento.getDataHora())) {
            throw new IllegalStateException("Inscrições para este evento já foram encerradas porque o evento já começou.");
        }

        if (inscricaoEventoRepository.existsByUsuarioIdAndEventoIdAndStatus(usuarioId, eventoId, StatusInscricao.INSCRITO)) {
            throw new IllegalStateException("Usuário já está inscrito neste evento.");
        }

        int ocupados = Math.toIntExact(inscricaoEventoRepository.countByEventoIdAndStatus(eventoId, StatusInscricao.INSCRITO));
        int capacidade = evento.getCapacidadeMaxima();
        if (capacidade <= 0) {
            throw new IllegalStateException("Evento não possui capacidade definida.");
        }
        if (ocupados >= capacidade) {
            throw new IllegalStateException("Não há vagas disponíveis para este evento.");
        }

        InscricaoEvento inscricao = new InscricaoEvento();
        inscricao.setEvento(evento);
        inscricao.setUsuario(usuario);
        inscricao.setDataHoraInscricao(LocalDateTime.now(clock));
        inscricao.setStatus(StatusInscricao.INSCRITO);

        return inscricaoEventoRepository.save(inscricao);
    }

    public boolean verificarInscricaoAtiva(Long eventoId, Long usuarioId) {
        return inscricaoEventoRepository.existsByUsuarioIdAndEventoIdAndStatus(usuarioId, eventoId, StatusInscricao.INSCRITO);
    }

    public java.util.List<Evento> listarEventosInscritos(Long usuarioId) {
        return inscricaoEventoRepository.findByUsuarioIdAndStatus(usuarioId, StatusInscricao.INSCRITO)
                .stream()
                .map(InscricaoEvento::getEvento)
                .toList();
    }

    public java.util.List<InscricaoEvento> buscarInscritosPorEvento(Long eventoId) {
        return inscricaoEventoRepository.findByEventoIdAndStatus(eventoId, StatusInscricao.INSCRITO);
    }
}
