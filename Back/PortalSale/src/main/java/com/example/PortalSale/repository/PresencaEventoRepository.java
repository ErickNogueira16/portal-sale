package com.example.PortalSale.repository;

import com.example.PortalSale.models.PresencaEvento;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PresencaEventoRepository extends JpaRepository<PresencaEvento, Long> {

    Optional<PresencaEvento> findByInscricaoEvento_UsuarioIdAndInscricaoEvento_EventoId(Long usuarioId, Long eventoId);

    boolean existsByInscricaoEvento_UsuarioIdAndInscricaoEvento_EventoId(Long usuarioId, Long eventoId);

    boolean existsByInscricaoEventoId(Long inscricaoEventoId);

    Optional<PresencaEvento> findByInscricaoEventoId(Long inscricaoEventoId);

    List<PresencaEvento> findByInscricaoEvento_EventoId(Long eventoId);

    void deleteAllByInscricaoEvento_EventoId(Long eventoId);
}
