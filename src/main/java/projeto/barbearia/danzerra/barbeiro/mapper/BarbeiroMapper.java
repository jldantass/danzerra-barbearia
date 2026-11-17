package projeto.barbearia.danzerra.barbeiro.mapper;

import projeto.barbearia.danzerra.barbeiro.dto.BarbeiroResponse;
import projeto.barbearia.danzerra.barbeiro.entity.Barbeiro;

public final class BarbeiroMapper {

    private BarbeiroMapper() {
    }

    public static BarbeiroResponse paraResponse(Barbeiro barbeiro) {
        return new BarbeiroResponse(barbeiro.getId(), barbeiro.getNome(),
                barbeiro.getCelular(), barbeiro.isAtivo());
    }
}
