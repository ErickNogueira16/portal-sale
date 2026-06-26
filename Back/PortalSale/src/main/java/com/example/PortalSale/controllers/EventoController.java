package com.example.PortalSale.controllers;

import com.example.PortalSale.dto.InscritoDto;
import com.example.PortalSale.dto.ValidacaoCodigoRequest;
import com.example.PortalSale.models.Evento;
import com.example.PortalSale.models.InscricaoEvento;
import com.example.PortalSale.models.PresencaEvento;
import com.example.PortalSale.security.ApplicationUserDetails;
import com.example.PortalSale.services.EventoService;
import com.example.PortalSale.services.InscricaoService;
import com.example.PortalSale.services.PresencaService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/eventos")
@CrossOrigin(origins = "*")
public class EventoController {

    private final EventoService eventoService;
    private final InscricaoService inscricaoService;
    private final PresencaService presencaService;

    public EventoController(EventoService eventoService,
                            InscricaoService inscricaoService,
                            PresencaService presencaService) {
        this.eventoService = eventoService;
        this.inscricaoService = inscricaoService;
        this.presencaService = presencaService;
    }

    @GetMapping
    public List<Evento> listarEventos() {
        return eventoService.listarEventos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Evento> buscarEventoPorId(@PathVariable long id) {
        Optional<Evento> evento = eventoService.buscarEventoPorId(id);
        return evento.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/inscricao/status")
    public ResponseEntity<Map<String, Object>> verificarStatusInscricao(@PathVariable Long id,
                                                                        @AuthenticationPrincipal ApplicationUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        boolean inscrito = inscricaoService.verificarInscricaoAtiva(id, userDetails.getId());
        Map<String, Object> response = Map.of(
            "inscrito", inscrito,
            "eventoId", id,
            "usuarioId", userDetails.getId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/presenca/status")
    public ResponseEntity<Map<String, Object>> verificarStatusPresenca(@PathVariable Long id,
                                                                       @AuthenticationPrincipal ApplicationUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        boolean presente = presencaService.usuarioConfirmouPresenca(id, userDetails.getId());
        Map<String, Object> response = Map.of(
            "presente", presente,
            "eventoId", id,
            "usuarioId", userDetails.getId()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/inscricao")
    public ResponseEntity<?> inscreverEvento(@PathVariable Long id,
                                             @AuthenticationPrincipal ApplicationUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("mensagem", "Não autorizado"));
        }

        try {
            inscricaoService.inscrever(id, userDetails.getId());
            return ResponseEntity.ok(Map.of("mensagem", "Inscrição realizada com sucesso."));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/vagas-disponiveis")
    public ResponseEntity<Integer> vagasDisponiveis(@PathVariable Long id) {
        return ResponseEntity.ok(eventoService.vagasDisponiveis(id));
    }

    @GetMapping("/{id}/inscritos")
    public ResponseEntity<List<InscritoDto>> listarInscritos(@PathVariable Long id) {
        List<InscricaoEvento> inscricoes = inscricaoService.buscarInscritosPorEvento(id);
        List<PresencaEvento> presencas = presencaService.listarPresencas(id);
        Set<Long> presencaInscricaoIds = presencas.stream()
                .map(p -> p.getInscricaoEvento().getId())
                .collect(Collectors.toSet());

        List<InscritoDto> inscritosDto = inscricoes.stream()
                .map(inscricao -> new InscritoDto(
                        inscricao.getId(),
                        inscricao.getUsuario().getId(),
                        inscricao.getUsuario().getNome(),
                        inscricao.getUsuario().getRa(),
                        presencaInscricaoIds.contains(inscricao.getId()),
                        inscricao.getEvento().getNome(),
                        inscricao.getDataHoraInscricao()
                ))
                .toList();
        return ResponseEntity.ok(inscritosDto);
    }

    @GetMapping("/inscricoes/me")
    public ResponseEntity<java.util.List<Evento>> listarEventosInscritos(@AuthenticationPrincipal ApplicationUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(inscricaoService.listarEventosInscritos(userDetails.getId()));
    }

    @PostMapping("/{id}/checkin/solicitar-codigo")
    public ResponseEntity<?> solicitarCodigoCheckin(@PathVariable Long id,
                                                    @AuthenticationPrincipal ApplicationUserDetails userDetails,
                                                    @RequestBody(required = false) Object ignored) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        String codigo = presencaService.solicitarCodigoCheckin(id, userDetails.getId(), null, null, null);
        return ResponseEntity.ok(Map.of("codigo", codigo));
    }

    @PostMapping("/{id}/checkin/validar")
    public ResponseEntity<PresencaEvento> validarCheckin(@PathVariable Long id,
                                                         @AuthenticationPrincipal ApplicationUserDetails userDetails,
                                                         @RequestBody ValidacaoCodigoRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        PresencaEvento presenca = presencaService.validarCheckin(id, userDetails.getId(), null, request.getCodigo(),
                request.getLatitude(), request.getLongitude(), null, null);
        return ResponseEntity.ok(presenca);
    }

    @PostMapping("/{id}/checkout/solicitar-codigo")
    public ResponseEntity<?> solicitarCodigoCheckout(@PathVariable Long id,
                                                     @AuthenticationPrincipal ApplicationUserDetails userDetails,
                                                     @RequestBody(required = false) Object ignored) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        String codigo = presencaService.solicitarCodigoCheckout(id, userDetails.getId(), null, null, null);
        return ResponseEntity.ok(Map.of("codigo", codigo));
    }

    @PostMapping("/{id}/checkout/validar")
    public ResponseEntity<PresencaEvento> validarCheckout(@PathVariable Long id,
                                                          @AuthenticationPrincipal ApplicationUserDetails userDetails,
                                                          @RequestBody ValidacaoCodigoRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        PresencaEvento presenca = presencaService.validarCheckout(id, userDetails.getId(), null, request.getCodigo(),
                request.getLatitude(), request.getLongitude(), null, null);
        return ResponseEntity.ok(presenca);
    }

    @GetMapping("/{id}/presencas")
    public ResponseEntity<List<PresencaEvento>> listarPresencas(@PathVariable Long id) {
        return ResponseEntity.ok(presencaService.listarPresencas(id));
    }

    @PostMapping
    public ResponseEntity<Evento> criarEvento(@RequestBody Evento evento) {
        Evento salvo = eventoService.salvarEvento(evento);
        return ResponseEntity.ok(salvo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirEvento(@PathVariable Long id) {
        eventoService.excluirEvento(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/buscar")
    public List<Evento> buscarEventos(@RequestParam String nome) {
        return eventoService.buscarPorNome(nome);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Evento> atualizarEvento(
            @PathVariable Long id,
            @RequestBody Evento eventoAtualizado
    ) {
        Optional<Evento> opt = eventoService.buscarEventoPorId(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Evento evento = opt.get();
        evento.setNome(eventoAtualizado.getNome());
        evento.setPalestrante(eventoAtualizado.getPalestrante());
        evento.setDescricao(eventoAtualizado.getDescricao());
        evento.setDataHora(eventoAtualizado.getDataHora());
        evento.setHoraFim(eventoAtualizado.getHoraFim());
        evento.setLocal(eventoAtualizado.getLocal());
        evento.setTipoEvento(eventoAtualizado.getTipoEvento());
        evento.setCapacidadeMaxima(eventoAtualizado.getCapacidadeMaxima());
        evento.setLatitude(eventoAtualizado.getLatitude());
        evento.setLongitude(eventoAtualizado.getLongitude());

        Evento salvo = eventoService.salvarEvento(evento);
        return ResponseEntity.ok(salvo);
    }
}