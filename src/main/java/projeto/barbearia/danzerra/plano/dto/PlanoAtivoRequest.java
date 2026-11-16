package projeto.barbearia.danzerra.plano.dto;

import jakarta.validation.constraints.NotNull;

public record PlanoAtivoRequest(@NotNull Boolean ativo) {
}
