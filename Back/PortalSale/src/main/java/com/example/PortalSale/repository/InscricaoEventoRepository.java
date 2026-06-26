package com.example.PortalSale.repository;

import com.example.PortalSale.models.InscricaoEvento;
import com.example.PortalSale.models.StatusInscricao;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InscricaoEventoRepository extends JpaRepository<InscricaoEvento, Long> {

    boolean existsByUsuarioIdAndEventoIdAndStatus(Long usuarioId, Long eventoId, StatusInscricao status);

    long countByEventoIdAndStatus(Long eventoId, StatusInscricao status);

    Optional<InscricaoEvento> findByUsuarioIdAndEventoIdAndStatus(Long usuarioId, Long eventoId, StatusInscricao status);

    List<InscricaoEvento> findByEventoIdAndStatus(Long eventoId, StatusInscricao status);

    List<InscricaoEvento> findByUsuarioIdAndStatus(Long usuarioId, StatusInscricao status);

    List<InscricaoEvento> findByEventoId(Long eventoId);

    void deleteAllByEventoId(Long eventoId);
}