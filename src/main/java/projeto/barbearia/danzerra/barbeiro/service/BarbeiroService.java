package projeto.barbearia.danzerra.barbeiro.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import projeto.barbearia.danzerra.barbeiro.dto.BarbeiroRequest;
import projeto.barbearia.danzerra.barbeiro.dto.BarbeiroDesempenhoResponse;
import projeto.barbearia.danzerra.barbeiro.dto.BarbeiroResponse;
import projeto.barbearia.danzerra.barbeiro.entity.Barbeiro;
import projeto.barbearia.danzerra.barbeiro.exception.BarbeiroException;
import projeto.barbearia.danzerra.barbeiro.mapper.BarbeiroMapper;
import projeto.barbearia.danzerra.barbeiro.repository.BarbeiroRepository;
import projeto.barbearia.danzerra.barbeiro.repository.BarbeiroDesempenhoRepository;
import projeto.barbearia.danzerra.relatorio.RelatorioDados.Periodo;

@Service
public class BarbeiroService {

    private final BarbeiroRepository barbeiros;
    private final BarbeiroDesempenhoRepository desempenho;

    public BarbeiroService(BarbeiroRepository barbeiros, BarbeiroDesempenhoRepository desempenho) {
        this.barbeiros = barbeiros;
        this.desempenho = desempenho;
    }

    @Transactional(readOnly = true)
    public BarbeiroDesempenhoResponse consultarDesempenho(LocalDate dia, Periodo periodo) {
        LocalDate inicio = switch (periodo) {
            case DIA -> dia;
            case SEMANA -> dia.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MES -> dia.withDayOfMonth(1);
        };
        LocalDate fim = switch (periodo) {
            case DIA -> inicio.plusDays(1);
            case SEMANA -> inicio.plusWeeks(1);
            case MES -> inicio.plusMonths(1);
        };
        return new BarbeiroDesempenhoResponse(inicio, fim.minusDays(1), desempenho.consultar(inicio, fim));
    }

    @Transactional(readOnly = true)
    public List<BarbeiroResponse> listar(boolean incluirInativos) {
        Sort ordem = Sort.by("nome", "id");
        return (incluirInativos ? barbeiros.findAll(ordem) : barbeiros.findAllByAtivoTrue(ordem))
                .stream().map(BarbeiroMapper::paraResponse).toList();
    }

    @Transactional(readOnly = true)
    public BarbeiroResponse consultar(Long id) {
        return BarbeiroMapper.paraResponse(buscar(id));
    }

    @Transactional(readOnly = true)
    public void exigirAtivo(Long id) {
        if (!buscar(id).isAtivo()) {
            throw new BarbeiroException(HttpStatus.CONFLICT,
                    "O barbeiro está inativo. Selecione um profissional ativo.");
        }
    }

    @Transactional
    public BarbeiroResponse cadastrar(BarbeiroRequest dados) {
        Barbeiro novo = new Barbeiro(dados.nome().strip(), normalizarCelular(dados.celular()));
        return BarbeiroMapper.paraResponse(barbeiros.save(novo));
    }

    @Transactional
    public BarbeiroResponse atualizar(Long id, BarbeiroRequest dados) {
        barbeiros.bloquearAgenda();
        Barbeiro barbeiro = buscar(id);
        barbeiro.atualizarDados(dados.nome().strip(), normalizarCelular(dados.celular()));
        return BarbeiroMapper.paraResponse(barbeiro);
    }

    @Transactional
    public void alternarAtivo(Long id) {
        barbeiros.bloquearAgenda();
        buscar(id).alternarAtivo();
    }

    @Transactional
    public void excluir(Long id) {
        barbeiros.bloquearAgenda();
        Barbeiro barbeiro = buscar(id);
        if (barbeiros.temAtendimentos(id)) {
            throw new BarbeiroException(HttpStatus.CONFLICT,
                    "Este barbeiro tem atendimentos registrados. Desative-o para preservar o histórico.");
        }
        barbeiros.delete(barbeiro);
    }

    private Barbeiro buscar(Long id) {
        return barbeiros.findById(id)
                .orElseThrow(() -> new BarbeiroException(HttpStatus.NOT_FOUND, "O barbeiro não foi encontrado."));
    }

    private static String normalizarCelular(String celular) {
        if (celular == null || celular.isBlank()) return null;
        String numero = celular.replaceAll("[^0-9]", "");
        if (numero.isEmpty() || numero.length() > 15) {
            throw new BarbeiroException(HttpStatus.BAD_REQUEST, "O celular deve conter de 1 a 15 dígitos.");
        }
        return numero;
    }
}
