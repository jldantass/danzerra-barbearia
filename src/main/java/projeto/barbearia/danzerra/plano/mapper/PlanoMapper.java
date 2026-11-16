package projeto.barbearia.danzerra.plano.mapper;

import java.util.Comparator;
import java.util.List;

import projeto.barbearia.danzerra.plano.dto.PlanoResponse;
import projeto.barbearia.danzerra.plano.entity.Plano;

public final class PlanoMapper {

    private PlanoMapper() {
    }

    public static PlanoResponse paraResponse(Plano plano) {
        List<PlanoResponse.Beneficio> beneficios = plano.getBeneficios().stream()
                .map(beneficio -> new PlanoResponse.Beneficio(
                        beneficio.getServicoId(), beneficio.getServicoNome(), beneficio.getQuantidade()))
                .sorted(Comparator.comparing(PlanoResponse.Beneficio::servicoNome)
                        .thenComparing(PlanoResponse.Beneficio::servicoId, Comparator.nullsLast(Long::compareTo)))
                .toList();
        return new PlanoResponse(
                plano.getId(), plano.getNome(), plano.getPrecoMensal(), plano.isAtivo(), beneficios);
    }
}
