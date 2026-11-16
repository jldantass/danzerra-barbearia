package projeto.barbearia.danzerra.plano.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PlanoBeneficioRequest(
        @NotNull @Positive Long servicoId,
        @NotNull @Positive Integer quantidade) {
}
