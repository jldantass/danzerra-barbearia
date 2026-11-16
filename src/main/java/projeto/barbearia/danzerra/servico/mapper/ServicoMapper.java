package projeto.barbearia.danzerra.servico.mapper;

import projeto.barbearia.danzerra.servico.dto.ServicoResponse;
import projeto.barbearia.danzerra.servico.entity.Servico;

public final class ServicoMapper {

    private ServicoMapper() {
    }

    public static ServicoResponse paraResponse(Servico servico) {
        return new ServicoResponse(
                servico.getId(),
                servico.getNome(),
                servico.getPrecoAvulso(),
                servico.getDuracaoMinutos()
        );
    }
}
