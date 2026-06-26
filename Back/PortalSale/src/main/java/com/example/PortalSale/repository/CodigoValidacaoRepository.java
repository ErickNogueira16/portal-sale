package com.example.PortalSale.repository;

import com.example.PortalSale.models.CodigoValidacao;
import com.example.PortalSale.models.TipoValidacao;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CodigoValidacaoRepository extends JpaRepository<CodigoValidacao, Long> {
    Optional<CodigoValidacao> findFirstByUsuarioIdAndEventoIdAndTipoAndUsadoFalseOrderByCriadoEmDesc(
            Long usuarioId, Long eventoId, TipoValidacao tipo);

    void deleteAllByEventoId(Long eventoId);
}
