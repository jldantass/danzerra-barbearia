package projeto.barbearia.danzerra.servico.service;

import java.sql.SQLException;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import projeto.barbearia.danzerra.plano.repository.PlanoRepository;
import projeto.barbearia.danzerra.servico.dto.ServicoAtualizacaoRequest;
import projeto.barbearia.danzerra.servico.dto.ServicoCadastroRequest;
import projeto.barbearia.danzerra.servico.dto.ServicoResponse;
import projeto.barbearia.danzerra.servico.entity.Servico;
import projeto.barbearia.danzerra.servico.exception.ServicoEmUsoException;
import projeto.barbearia.danzerra.servico.exception.ServicoNaoEncontradoException;
import projeto.barbearia.danzerra.servico.mapper.ServicoMapper;
import projeto.barbearia.danzerra.servico.repository.ServicoRepository;

@Service
public class ServicoService {

    private final ServicoRepository servicos;
    private final PlanoRepository planos;

    public ServicoService(ServicoRepository servicos, PlanoRepository planos) {
        this.servicos = servicos;
        this.planos = planos;
    }

    @Transactional
    public ServicoResponse cadastrar(ServicoCadastroRequest dados) {
        Servico servico = new Servico(
                dados.nome().strip(),
                dados.precoAvulso(),
                dados.duracaoMinutos()
        );
        Servico salvo = servicos.save(servico);
        return ServicoMapper.paraResponse(salvo);
    }

    @Transactional(readOnly = true)
    public List<ServicoResponse> listar(boolean incluirInativos) {
        Sort ordenacao = Sort.by("nome", "id");
        List<Servico> catalogo = incluirInativos
                ? servicos.findAll(ordenacao)
                : servicos.findAllByAtivoTrue(ordenacao);
        return catalogo.stream()
                .map(ServicoMapper::paraResponse)
                .toList();
    }

    @Transactional
    public ServicoResponse atualizar(Long id, ServicoAtualizacaoRequest dados) {
        Servico servico = buscarServicoParaAlteracao(id);
        servico.atualizarDados(dados.nome().strip(), dados.precoAvulso(), dados.duracaoMinutos());
        return ServicoMapper.paraResponse(servico);
    }

    @Transactional
    public void alternarAtivo(Long id) {
        planos.bloquearCatalogo();
        Servico servico = buscarServicoParaAlteracao(id);
        servico.alternarAtivo();
        if (!servico.isAtivo()) planos.desativarPlanosComServico(id);
    }

    @Transactional
    public void excluir(Long id) {
        Servico servico = buscarServicoParaAlteracao(id);
        try {
            servicos.delete(servico);
            servicos.flush();
        } catch (DataIntegrityViolationException erro) {
            if (erro.getMostSpecificCause() instanceof SQLException causa
                    && "23503".equals(causa.getSQLState())) {
                throw new ServicoEmUsoException(id, erro);
            }
            throw erro;
        }
    }

    private Servico buscarServicoParaAlteracao(Long id) {
        return servicos.findServicoById(id)
                .orElseThrow(() -> new ServicoNaoEncontradoException(id));
    }
}
