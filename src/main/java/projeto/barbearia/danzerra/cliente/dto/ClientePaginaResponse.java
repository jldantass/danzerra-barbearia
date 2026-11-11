package projeto.barbearia.danzerra.cliente.dto;

import java.util.List;

public record ClientePaginaResponse(
        List<ClienteResponse> clientes,
        int pagina,
        int tamanho,
        long total) {
}