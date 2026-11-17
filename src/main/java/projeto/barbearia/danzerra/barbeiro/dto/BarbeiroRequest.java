package projeto.barbearia.danzerra.barbeiro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BarbeiroRequest(
        @NotBlank @Size(max = 120) String nome,
        @Size(max = 30) @Pattern(regexp = "\\+?[0-9() .-]*",
                message = "Informe um celular válido.") String celular) {
}
