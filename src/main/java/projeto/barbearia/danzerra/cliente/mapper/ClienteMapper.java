package projeto.barbearia.danzerra.cliente.mapper;

import projeto.barbearia.danzerra.cliente.dto.ClienteResponse;
import projeto.barbearia.danzerra.cliente.entity.Cliente;

public final class ClienteMapper {

    private ClienteMapper() {
    }

    public static ClienteResponse paraResponse(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(),
                cliente.getNome(),
                cliente.getCelular()
        );
    }
}