package projeto.barbearia.danzerra.relatorio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public final class RelatorioDados {

    private RelatorioDados() {
    }

    public enum Periodo { DIA, SEMANA, MES }

    public record Despesa(@NotNull LocalDate dia, @NotBlank @Size(max = 120) String descricao,
                          @NotNull @Positive @Digits(integer = 8, fraction = 2) BigDecimal valor) {
    }

    public record Totais(long agendados, long concluidos, long cancelados, long faltas,
                         BigDecimal avulsos, BigDecimal planos, BigDecimal despesas, BigDecimal resultado) {
    }

    public record Dia(LocalDate dia, long concluidos, BigDecimal avulsos, BigDecimal planos, BigDecimal despesas) {
    }

    public record Servico(String nome, long quantidade, long cobertosPorPlano) {
    }

    public record Resumo(LocalDate inicio, LocalDate fim, Totais totais, List<Dia> dias,
                         List<Servico> servicos, List<Despesa> despesas) {
    }
}
