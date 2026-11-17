package projeto.barbearia.danzerra.barbearia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BarbeariaDados(@NotBlank @Size(max = 120) String nome) {
}
