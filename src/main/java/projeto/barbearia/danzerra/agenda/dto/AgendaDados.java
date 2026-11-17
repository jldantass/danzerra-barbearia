package projeto.barbearia.danzerra.agenda.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import projeto.barbearia.danzerra.planocliente.dto.PlanoClientePerfilResponse.Periodo;

public final class AgendaDados {

    private AgendaDados() {
    }

    public record Cadastro(
            @NotNull @Positive Long clienteId,
            @NotNull LocalDate dia,
            @NotNull LocalTime hora,
            @NotEmpty List<@NotNull @Positive Long> servicoIds) {
    }

    public record Remarcacao(@NotNull LocalDate dia, @NotNull LocalTime hora) {
    }

    public enum Status {
        AGENDADO, CONCLUIDO, CANCELADO, FALTOU
    }

    public record Situacao(@NotNull Status status) {
    }

    public record Item(Long servicoId, String nome, BigDecimal precoAvulso, int duracaoMinutos,
                       boolean corte, BigDecimal valorCobrado, Boolean cobertoPorPlano) {
    }

    public record Atendimento(Long id, Long clienteId, String clienteNome, LocalDateTime inicio,
                              LocalDateTime fim, Status status, List<Item> servicos) {
    }

    public record DetalhesAtendimento(Atendimento atendimento, Periodo plano) {
    }

    public record PlanejamentoDia(List<FaixaDia> faixas, List<Atendimento> atendimentos) {
    }

    public record FaixaDia(LocalTime inicio, LocalTime fim, List<HorarioDia> horarios) {
    }

    public record HorarioDia(LocalTime hora, Long atendimentoId) {
    }
}
