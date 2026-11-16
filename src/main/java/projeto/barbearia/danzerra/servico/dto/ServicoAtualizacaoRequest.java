package projeto.barbearia.danzerra.servico.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ServicoAtualizacaoRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotNull @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal precoAvulso,
        @NotNull @Positive Integer duracaoMinutos) {
}
