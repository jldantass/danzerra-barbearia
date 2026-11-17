package projeto.barbearia.danzerra.planocliente.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import projeto.barbearia.danzerra.cliente.dto.ClienteResponse;

public record PlanoClientePerfilResponse(ClienteResponse cliente, Periodo periodo) {

    public record Periodo(
            Long id, Long planoId, String nomePlano, BigDecimal precoPago,
            LocalDate inicio, LocalDate vencimento, boolean ativo, List<Beneficio> beneficios) {
    }

    public record Beneficio(Long servicoId, String servicoNome, int cota, int usados, int restantes) {
    }
}
