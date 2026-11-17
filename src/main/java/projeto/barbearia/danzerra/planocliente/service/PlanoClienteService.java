package projeto.barbearia.danzerra.planocliente.service;

import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import projeto.barbearia.danzerra.cliente.entity.Cliente;
import projeto.barbearia.danzerra.cliente.exception.ClienteNaoEncontradoException;
import projeto.barbearia.danzerra.cliente.repository.ClienteRepository;
import projeto.barbearia.danzerra.plano.entity.Plano;
import projeto.barbearia.danzerra.plano.exception.PlanoNaoEncontradoException;
import projeto.barbearia.danzerra.plano.repository.PlanoRepository;
import projeto.barbearia.danzerra.planocliente.dto.PlanoClienteCadastroRequest;
import projeto.barbearia.danzerra.planocliente.dto.PlanoClientePerfilResponse;
import projeto.barbearia.danzerra.planocliente.dto.PlanoClientePerfilResponse.Periodo;
import projeto.barbearia.danzerra.planocliente.entity.PlanoCliente;
import projeto.barbearia.danzerra.planocliente.exception.PlanoClienteConflitoException;
import projeto.barbearia.danzerra.planocliente.mapper.PlanoClienteMapper;
import projeto.barbearia.danzerra.planocliente.repository.PlanoClienteRepository;

@Service
public class PlanoClienteService {

    private static final ZoneId FUSO_BARBEARIA = ZoneId.of("America/Fortaleza");

    private final ClienteRepository clientes;
    private final PlanoRepository planos;
    private final PlanoClienteRepository periodos;

    public PlanoClienteService(
            ClienteRepository clientes, PlanoRepository planos, PlanoClienteRepository periodos) {
        this.clientes = clientes;
        this.planos = planos;
        this.periodos = periodos;
    }

    @Transactional(readOnly = true)
    public PlanoClientePerfilResponse consultar(Long clienteId) {
        Cliente cliente = clientes.findById(clienteId)
                .orElseThrow(() -> new ClienteNaoEncontradoException(clienteId));
        PlanoCliente periodo = periodos.findFirstByClienteIdOrderByVencimentoDescIdDesc(clienteId).orElse(null);
        return PlanoClienteMapper.paraPerfil(cliente, periodo, hoje());
    }

    @Transactional(readOnly = true)
    public Periodo consultarPeriodo(Long id) {
        LocalDate hoje = hoje();
        return periodos.findById(id)
                .map(periodo -> PlanoClienteMapper.paraPeriodo(periodo, hoje))
                .orElse(null);
    }

    @Transactional
    public PlanoClientePerfilResponse cadastrar(PlanoClienteCadastroRequest dados) {
        planos.bloquearCatalogo();
        Cliente cliente = clientes.findClienteById(dados.clienteId())
                .orElseThrow(() -> new ClienteNaoEncontradoException(dados.clienteId()));

        Plano plano = planos.findPlanoByIdAndExcluidoFalse(dados.planoId())
                .orElseThrow(() -> new PlanoNaoEncontradoException(dados.planoId()));
        LocalDate hoje = hoje();
        var ultimo = periodos.findFirstByClienteIdOrderByVencimentoDescIdDesc(cliente.getId());
        if (ultimo.isPresent() && !ultimo.get().getVencimento().isBefore(hoje)) {
            throw new PlanoClienteConflitoException(
                    "O cliente já tem um período de plano vigente. Renove após o vencimento.");
        }
        if (!plano.isAtivo()) {
            throw new PlanoClienteConflitoException("Escolha um plano ativo do catálogo.");
        }
        if (plano.getBeneficios().stream().anyMatch(beneficio -> !beneficio.temServicoAtivo())) {
            throw new PlanoClienteConflitoException("O plano tem um serviço inativo. Ajuste os benefícios para contratá-lo.");
        }

        PlanoCliente periodo = periodos.save(new PlanoCliente(cliente, plano, hoje));
        return PlanoClienteMapper.paraPerfil(cliente, periodo, hoje);
    }

    private static LocalDate hoje() {
        return LocalDate.now(FUSO_BARBEARIA);
    }
}
