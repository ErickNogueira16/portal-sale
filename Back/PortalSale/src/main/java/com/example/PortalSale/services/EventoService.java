package com.example.PortalSale.services;

import com.example.PortalSale.models.Evento;
import com.example.PortalSale.models.InscricaoEvento;
import com.example.PortalSale.models.StatusInscricao;
import com.example.PortalSale.models.Usuario;
import com.example.PortalSale.repository.CodigoValidacaoRepository;
import com.example.PortalSale.repository.EventoRepository;
import com.example.PortalSale.repository.InscricaoEventoRepository;
import com.example.PortalSale.repository.PresencaEventoRepository;
import com.example.PortalSale.repository.PresencaTokenRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventoService {

    private final EventoRepository eventoRepository;
    private final InscricaoEventoRepository inscricaoEventoRepository;
    private final PresencaEventoRepository presencaEventoRepository;
    private final CodigoValidacaoRepository codigoValidacaoRepository;
    private final PresencaTokenRepository presencaTokenRepository;

    public EventoService(EventoRepository eventoRepository,
                        InscricaoEventoRepository inscricaoEventoRepository,
                        PresencaEventoRepository presencaEventoRepository,
                        CodigoValidacaoRepository codigoValidacaoRepository,
                        PresencaTokenRepository presencaTokenRepository) {

        this.eventoRepository = eventoRepository;
        this.inscricaoEventoRepository = inscricaoEventoRepository;
        this.presencaEventoRepository = presencaEventoRepository;
        this.codigoValidacaoRepository = codigoValidacaoRepository;
        this.presencaTokenRepository = presencaTokenRepository;
    }

    public List<Evento> listarEventos() {
        return eventoRepository.findAll();
    }

    public Optional<Evento> buscarEventoPorId(long id) {
        return eventoRepository.findById(id);
    }

    public Evento salvarEvento(Evento evento) {
        if (evento.getCapacidadeMaxima() <= 0) {
            evento.setCapacidadeMaxima(evento.getVagas());
        }
        return eventoRepository.save(evento);
    }

    @Transactional
    public void excluirEvento(long id) {
        presencaEventoRepository.deleteAllByInscricaoEvento_EventoId(id);
        inscricaoEventoRepository.deleteAllByEventoId(id);
        codigoValidacaoRepository.deleteAllByEventoId(id);
        presencaTokenRepository.deleteAllByEventoId(id);
        eventoRepository.deleteById(id);
    }

    public List<Evento> buscarPorNome(String nome) {
        return eventoRepository.findByNomeContainingIgnoreCase(nome);
    }

    public int vagasDisponiveis(Long eventoId) {
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new IllegalArgumentException("Evento não encontrado."));
        long inscritos = inscricaoEventoRepository.countByEventoIdAndStatus(eventoId, StatusInscricao.INSCRITO);
        return Math.max(0, evento.getCapacidadeMaxima() - (int) inscritos);
    }

    public List<Usuario> buscarInscritosPorEvento(Long eventoId) {
        List<InscricaoEvento> inscricoes = inscricaoEventoRepository.findByEventoIdAndStatus(eventoId, StatusInscricao.INSCRITO);
        return inscricoes.stream().map(InscricaoEvento::getUsuario).toList();
    }
}
