package projeto.barbearia.danzerra.cliente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClienteCadastroRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotBlank String celular) {
}