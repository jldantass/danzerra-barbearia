package projeto.barbearia.danzerra.plano.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import projeto.barbearia.danzerra.plano.dto.PlanoBeneficioRequest;
import projeto.barbearia.danzerra.plano.dto.PlanoDadosRequest;
import projeto.barbearia.danzerra.plano.dto.PlanoResponse;
import projeto.barbearia.danzerra.plano.entity.Plano;
import projeto.barbearia.danzerra.plano.entity.PlanoBeneficio;
import projeto.barbearia.danzerra.plano.exception.PlanoDadosInvalidosException;
import projeto.barbearia.danzerra.plano.exception.PlanoNaoEncontradoException;
import projeto.barbearia.danzerra.plano.mapper.PlanoMapper;
import projeto.barbearia.danzerra.plano.repository.PlanoRepository;
import projeto.barbearia.danzerra.servico.entity.Servico;
import projeto.barbearia.danzerra.servico.repository.ServicoRepository;

@Service
public class PlanoService {

    private final PlanoRepository planos;
    private final ServicoRepository servicos;

    public PlanoService(PlanoRepository planos, ServicoRepository servicos) {
        this.planos = planos;
        this.servicos = servicos;
    }

    @Transactional
    public PlanoResponse cadastrar(PlanoDadosRequest dados) {
        if (dados.beneficios() == null) {
            throw new PlanoDadosInvalidosException("Informe os benefícios do plano.");
        }

        Plano plano = new Plano(
                dados.nome().strip(), dados.precoMensal(), montarBeneficios(dados.beneficios()));
        return PlanoMapper.paraResponse(planos.save(plano));
    }

    @Transactional(readOnly = true)
    public List<PlanoResponse> listar() {
        return planos.findAll(Sort.by("id")).stream()
                .map(PlanoMapper::paraResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlanoResponse consultar(Long id) {
        Plano plano = planos.findById(id)
                .orElseThrow(() -> new PlanoNaoEncontradoException(id));
        return PlanoMapper.paraResponse(plano);
    }

    @Transactional
    public PlanoResponse atualizar(Long id, PlanoDadosRequest dados) {
        Plano plano = buscarParaAlteracao(id);
        plano.atualizarDados(dados.nome().strip(), dados.precoMensal());

        if (dados.beneficios() != null) {
            plano.substituirBeneficios(montarBeneficios(dados.beneficios()));
        }
        if (plano.isAtivo()) {
            validarPlanoCompleto(plano);
        }

        return PlanoMapper.paraResponse(plano);
    }

    @Transactional
    public PlanoResponse definirAtivo(Long id, boolean ativo) {
        Plano plano = buscarParaAlteracao(id);
        if (ativo) {
            validarPlanoCompleto(plano);
        }
        plano.definirAtivo(ativo);
        return PlanoMapper.paraResponse(plano);
    }

    @Transactional
    public void remover(Long id) {
        planos.delete(buscarParaAlteracao(id));
    }

    private Plano buscarParaAlteracao(Long id) {
        return planos.findPlanoById(id)
                .orElseThrow(() -> new PlanoNaoEncontradoException(id));
    }

    private List<PlanoBeneficio> montarBeneficios(List<PlanoBeneficioRequest> beneficios) {
        List<Long> ids = beneficios.stream().map(PlanoBeneficioRequest::servicoId).distinct().toList();
        if (ids.size() != beneficios.size()) {
            throw new PlanoDadosInvalidosException("Informe cada serviço uma única vez no plano.");
        }

        Map<Long, Servico> servicosPorId = servicos.findAllById(ids).stream()
                .collect(Collectors.toMap(Servico::getId, Function.identity()));

        return beneficios.stream()
                .map(beneficio -> {
                    Servico servico = servicosPorId.get(beneficio.servicoId());
                    if (servico == null) {
                        throw new PlanoDadosInvalidosException(
                                "Serviço de ID " + beneficio.servicoId() + " não encontrado.");
                    }
                    return new PlanoBeneficio(servico, beneficio.quantidade());
                })
                .toList();
    }

    private void validarPlanoCompleto(Plano plano) {
        if (plano.getPrecoMensal() == null) {
            throw new PlanoDadosInvalidosException("Informe o preço mensal para manter o plano ativo.");
        }
        if (plano.getBeneficios().stream().anyMatch(beneficio -> beneficio.getServicoId() == null)) {
            throw new PlanoDadosInvalidosException(
                    "Vincule todos os benefícios a serviços do catálogo para manter o plano ativo.");
        }
    }
}
