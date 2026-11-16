package projeto.barbearia.danzerra.plano.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record PlanoDadosRequest(
        @NotBlank @Size(max = 120) String nome,
        @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal precoMensal,
        @Size(min = 1) List<@NotNull @Valid PlanoBeneficioRequest> beneficios) {
}
