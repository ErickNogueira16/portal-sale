package com.example.PortalSale.repository;

import com.example.PortalSale.models.PresencaToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PresencaTokenRepository extends JpaRepository<PresencaToken, Long> {

    Optional<PresencaToken> findByTokenAndEventoId(String token, Long eventoId);

    void deleteAllByEventoId(Long eventoId);
}
