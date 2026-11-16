package projeto.barbearia.danzerra.plano.dto;

import java.math.BigDecimal;
import java.util.List;

public record PlanoResponse(
        Long id, String nome, BigDecimal precoMensal, boolean ativo, List<Beneficio> beneficios) {

    public record Beneficio(Long servicoId, String servicoNome, int quantidade) {
    }
}
