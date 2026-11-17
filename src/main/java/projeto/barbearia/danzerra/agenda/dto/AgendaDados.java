package projeto.barbearia.danzerra.agenda.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import projeto.barbearia.danzerra.planocliente.dto.PlanoClientePerfilResponse.Periodo;

public final class AgendaDados {

    private AgendaDados() {
    }

    public record Cadastro(
            @NotNull @Positive Long clienteId,
            @NotNull @Positive Long barbeiroId,
            @NotNull LocalDate dia,
            @NotNull LocalTime hora,
            @NotEmpty List<@NotNull @Positive Long> servicoIds) {
    }

    public record Remarcacao(@NotNull LocalDate dia, @NotNull LocalTime hora, @Positive Long barbeiroId) {
    }

    public enum Status {
        AGENDADO, CONCLUIDO, CANCELADO, FALTOU
    }

    public record Situacao(@NotNull Status status, @PositiveOrZero BigDecimal valorAvulsoConfirmado) {
    }

    public record Item(Long servicoId, String nome, BigDecimal precoAvulso, int duracaoMinutos,
                       boolean corte, BigDecimal valorCobrado, Boolean cobertoPorPlano) {
    }

    public record Atendimento(Long id, Long clienteId, String clienteNome, Long barbeiroId,
                              String barbeiroNome, LocalDateTime inicio,
                              LocalDateTime fim, Status status, List<Item> servicos) {
    }

    public record DetalhesAtendimento(Atendimento atendimento, Periodo plano, PrevisaoCobranca previsao) {
    }

    public record PrevisaoCobranca(List<Long> servicosPeloPlano, BigDecimal valorAvulso, BigDecimal valorAvulsoAgora) {
    }

    public record PlanejamentoDia(List<FaixaDia> faixas, List<Atendimento> atendimentos) {
    }

    public record FaixaDia(LocalTime inicio, LocalTime fim, List<HorarioDia> horarios) {
    }

    public record HorarioDia(LocalTime hora, Long atendimentoId, List<Long> atendimentoIds, List<Long> faltasIds) {
    }
}
