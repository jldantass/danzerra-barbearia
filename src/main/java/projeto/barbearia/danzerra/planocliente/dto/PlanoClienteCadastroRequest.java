package projeto.barbearia.danzerra.planocliente.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PlanoClienteCadastroRequest(
        @NotNull @Positive Long clienteId,
        @NotNull @Positive Long planoId) {
}
