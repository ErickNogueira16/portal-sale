package com.example.PortalSale.dto;

import java.time.LocalDateTime;

public class InscritoDto {
    private Long inscricaoId;
    private Long usuarioId;
    private String nome;
    private String ra;
    private boolean presencaConfirmada;
    private String eventoNome;
    private LocalDateTime dataHoraInscricao;

    public InscritoDto() {
    }

    public InscritoDto(Long inscricaoId, Long usuarioId, String nome, String ra, boolean presencaConfirmada, String eventoNome, LocalDateTime dataHoraInscricao) {
        this.inscricaoId = inscricaoId;
        this.usuarioId = usuarioId;
        this.nome = nome;
        this.ra = ra;
        this.presencaConfirmada = presencaConfirmada;
        this.eventoNome = eventoNome;
        this.dataHoraInscricao = dataHoraInscricao;
    }

    public Long getInscricaoId() {
        return inscricaoId;
    }

    public void setInscricaoId(Long inscricaoId) {
        this.inscricaoId = inscricaoId;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getRa() {
        return ra;
    }

    public void setRa(String ra) {
        this.ra = ra;
    }

    public boolean isPresencaConfirmada() {
        return presencaConfirmada;
    }

    public void setPresencaConfirmada(boolean presencaConfirmada) {
        this.presencaConfirmada = presencaConfirmada;
    }

    public String getEventoNome() {
        return eventoNome;
    }

    public void setEventoNome(String eventoNome) {
        this.eventoNome = eventoNome;
    }

    public LocalDateTime getDataHoraInscricao() {
        return dataHoraInscricao;
    }

    public void setDataHoraInscricao(LocalDateTime dataHoraInscricao) {
        this.dataHoraInscricao = dataHoraInscricao;
    }
}
