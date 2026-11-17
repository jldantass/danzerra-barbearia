package projeto.barbearia.danzerra.planocliente.mapper;

import java.time.LocalDate;
import java.util.Comparator;

import projeto.barbearia.danzerra.cliente.entity.Cliente;
import projeto.barbearia.danzerra.cliente.mapper.ClienteMapper;
import projeto.barbearia.danzerra.planocliente.dto.PlanoClientePerfilResponse;
import projeto.barbearia.danzerra.planocliente.dto.PlanoClientePerfilResponse.Beneficio;
import projeto.barbearia.danzerra.planocliente.dto.PlanoClientePerfilResponse.Periodo;
import projeto.barbearia.danzerra.planocliente.entity.PlanoCliente;

public final class PlanoClienteMapper {

    private PlanoClienteMapper() {
    }

    public static PlanoClientePerfilResponse paraPerfil(Cliente cliente, PlanoCliente periodo, LocalDate hoje) {
        return new PlanoClientePerfilResponse(
                ClienteMapper.paraResponse(cliente),
                periodo == null ? null : paraPeriodo(periodo, hoje));
    }

    public static Periodo paraPeriodo(PlanoCliente periodo, LocalDate hoje) {
        var beneficios = periodo.getBeneficios().stream()
                .map(b -> new Beneficio(b.getServico().getId(), b.getServico().getNome(),
                        b.getCota(), b.getUsados(), b.getRestantes()))
                .sorted(Comparator.comparing(Beneficio::servicoNome).thenComparing(Beneficio::servicoId))
                .toList();
        return new Periodo(periodo.getId(), periodo.getPlano().getId(), periodo.getNomePlano(),
                periodo.getPrecoPago(), periodo.getInicio(), periodo.getVencimento(),
                periodo.vigenteEm(hoje), beneficios);
    }
}
