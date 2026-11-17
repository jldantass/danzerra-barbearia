package projeto.barbearia.danzerra.agenda.service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Atendimento;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Cadastro;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.DetalhesAtendimento;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.FaixaDia;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.HorarioDia;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Item;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.PlanejamentoDia;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.PrevisaoCobranca;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Remarcacao;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Situacao;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Status;
import projeto.barbearia.danzerra.agenda.exception.AgendaException;
import projeto.barbearia.danzerra.agenda.repository.AgendaRepository;
import projeto.barbearia.danzerra.barbeiro.service.BarbeiroService;
import projeto.barbearia.danzerra.planocliente.dto.PlanoClientePerfilResponse.Periodo;
import projeto.barbearia.danzerra.planocliente.service.PlanoClienteService;

@Service
public class AgendaService {

    private static final int INTERVALO_MINUTOS = 30;

    private final AgendaRepository agenda;
    private final PlanoClienteService planosCliente;
    private final BarbeiroService barbeiros;

    public AgendaService(AgendaRepository agenda, PlanoClienteService planosCliente, BarbeiroService barbeiros) {
        this.agenda = agenda;
        this.planosCliente = planosCliente;
        this.barbeiros = barbeiros;
    }

    @Transactional(readOnly = true)
    public List<Atendimento> listar(LocalDate dia) {
        return agenda.listar(dia, dia.plusDays(1));
    }

    @Transactional(readOnly = true)
    public List<Atendimento> listar(LocalDate dia, boolean semana, Long barbeiroId) {
        LocalDate inicio = semana ? dia.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)) : dia;
        LocalDate fim = inicio.plusDays(semana ? 6 : 1);
        if (barbeiroId == null) return agenda.listar(inicio, fim);
        barbeiros.consultar(barbeiroId);
        return agenda.listarPorBarbeiro(inicio, fim, barbeiroId);
    }

    @Transactional(readOnly = true)
    public List<Atendimento> listarPorCliente(long clienteId) {
        return agenda.listarPorCliente(clienteId);
    }

    @Transactional(readOnly = true)
    public List<Atendimento> listarAgendadosPorBarbeiro(long barbeiroId) {
        barbeiros.consultar(barbeiroId);
        return agenda.listarAgendadosPorBarbeiro(barbeiroId);
    }

    @Transactional(readOnly = true)
    public List<Atendimento> listarSemana(LocalDate referencia) {
        LocalDate segunda = referencia.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return agenda.listar(segunda, segunda.plusDays(6));
    }

    @Transactional(readOnly = true)
    public DetalhesAtendimento detalhar(long id) {
        Atendimento atendimento = buscar(id);
        boolean consultarPlano = atendimento.status() == Status.AGENDADO
                || atendimento.servicos().stream().anyMatch(item -> Boolean.TRUE.equals(item.cobertoPorPlano()));
        Long periodo = consultarPlano
                ? agenda.buscarPeriodo(atendimento.clienteId(), atendimento.inicio().toLocalDate())
                : null;
        Periodo plano = periodo == null ? null : planosCliente.consultarPeriodo(periodo);
        PrevisaoCobranca previsao = atendimento.status() == Status.AGENDADO
                ? preverCobranca(atendimento, plano) : null;
        return new DetalhesAtendimento(atendimento, plano, previsao);
    }

    private PrevisaoCobranca preverCobranca(Atendimento atendimento, Periodo plano) {
        Map<Long, Integer> saldo = new HashMap<>();
        if (plano != null) {
            plano.beneficios().forEach(beneficio -> saldo.put(beneficio.servicoId(), beneficio.restantes()));
        }
        BigDecimal avulsoAgora = calcularAvulso(atendimento, alocarBeneficios(atendimento, new HashMap<>(saldo)));

        if (plano != null) {
            for (Atendimento pendente : agenda.listarPendentesNoPeriodo(
                    atendimento.clienteId(), plano.inicio(), plano.vencimento())) {
                if (pendente.id().equals(atendimento.id())) break;
                alocarBeneficios(pendente, saldo);
            }
        }
        List<Long> cobertos = alocarBeneficios(atendimento, saldo);
        return new PrevisaoCobranca(cobertos, calcularAvulso(atendimento, cobertos), avulsoAgora);
    }

    private static List<Long> alocarBeneficios(Atendimento atendimento, Map<Long, Integer> saldo) {
        List<Long> cobertos = new ArrayList<>();
        for (Item item : atendimento.servicos()) {
            int restante = saldo.getOrDefault(item.servicoId(), 0);
            if (restante > 0) {
                cobertos.add(item.servicoId());
                saldo.put(item.servicoId(), restante - 1);
            }
        }
        return cobertos;
    }

    private static BigDecimal calcularAvulso(Atendimento atendimento, List<Long> cobertos) {
        return atendimento.servicos().stream().filter(item -> !cobertos.contains(item.servicoId()))
                .map(Item::precoAvulso).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public PlanejamentoDia planejarDia(LocalDate dia, Long barbeiroId) {
        List<Atendimento> atendimentos = listar(dia, false, barbeiroId);
        List<Atendimento> faltas = atendimentos.stream().filter(item -> item.status() == Status.FALTOU).toList();
        List<FaixaDia> faixas = new ArrayList<>();
        for (var faixa : HorarioBarbearia.expediente(dia)) {
            List<HorarioDia> horarios = new ArrayList<>();
            for (LocalTime hora = faixa.inicio(); hora.isBefore(faixa.fim());
                    hora = hora.plusMinutes(INTERVALO_MINUTOS)) {
                LocalDateTime inicio = dia.atTime(hora);
                LocalDateTime fim = inicio.plusMinutes(INTERVALO_MINUTOS);
                List<Long> ids = atendimentos.stream()
                        .filter(item -> ocupaHorario(item, inicio, fim))
                        .map(Atendimento::id).toList();
                List<Long> faltasIds = faltas.stream().filter(item -> sobrepoeHorario(item, inicio, fim))
                        .map(Atendimento::id).toList();
                horarios.add(new HorarioDia(hora, ids.isEmpty() ? null : ids.getFirst(), ids, faltasIds));
            }
            faixas.add(new FaixaDia(faixa.inicio(), faixa.fim(), horarios));
        }
        return new PlanejamentoDia(faixas, atendimentos);
    }

    @Transactional(readOnly = true)
    public List<LocalTime> horarios(LocalDate dia, List<Long> ids, Long atendimentoId,
                                    Long barbeiroId, Long clienteId) {
        barbeiros.exigirAtivo(barbeiroId);
        Atendimento atual = atendimentoId == null ? null : buscar(atendimentoId);
        if (atual != null) exigirAgendado(atual);
        long duracao = duracao(atual == null ? servicos(ids, false) : atual.servicos());
        Long cliente = atual == null ? clienteId : atual.clienteId();
        LocalDateTime agora = HorarioBarbearia.agora();
        List<Atendimento> existentes = listar(dia);

        List<LocalTime> horarios = new ArrayList<>();
        for (var faixa : HorarioBarbearia.expediente(dia)) {
            LocalDateTime fimFaixa = dia.atTime(faixa.fim());
            for (LocalDateTime inicio = dia.atTime(faixa.inicio()); !inicio.plusMinutes(duracao).isAfter(fimFaixa);
                    inicio = inicio.plusMinutes(INTERVALO_MINUTOS)) {
                LocalDateTime candidato = inicio;
                LocalDateTime fim = inicio.plusMinutes(duracao);
                boolean ocupado = existentes.stream().anyMatch(a -> (a.barbeiroId().equals(barbeiroId)
                        || a.clienteId().equals(cliente)) && !a.id().equals(atendimentoId)
                        && ocupaHorario(a, candidato, fim));
                if (!inicio.isBefore(agora) && !ocupado) horarios.add(inicio.toLocalTime());
            }
        }
        return horarios;
    }

    private static boolean ocupaHorario(Atendimento atendimento, LocalDateTime inicio, LocalDateTime fim) {
        return (atendimento.status() == Status.AGENDADO || atendimento.status() == Status.CONCLUIDO)
                && sobrepoeHorario(atendimento, inicio, fim);
    }

    private static boolean sobrepoeHorario(Atendimento atendimento, LocalDateTime inicio, LocalDateTime fim) {
        return atendimento.inicio().isBefore(fim) && atendimento.fim().isAfter(inicio);
    }

    @Transactional
    public Atendimento cadastrar(Cadastro dados) {
        agenda.bloquearAgenda();
        barbeiros.exigirAtivo(dados.barbeiroId());
        if (!agenda.clienteExiste(dados.clienteId())) {
            throw new AgendaException(HttpStatus.NOT_FOUND, "O cliente não foi encontrado.");
        }
        List<Item> servicos = servicos(dados.servicoIds(), true);
        LocalDateTime inicio = dados.dia().atTime(dados.hora());
        LocalDateTime fim = inicio.plusMinutes(duracao(servicos));
        validarHorario(inicio, fim, 0, dados.barbeiroId(), dados.clienteId());
        validarCorteNoDia(dados.clienteId(), dados.dia(), servicos, 0);
        return buscar(agenda.cadastrar(dados.clienteId(), dados.barbeiroId(), inicio, fim, servicos));
    }

    @Transactional
    public Atendimento remarcar(long id, Remarcacao dados) {
        agenda.bloquearAgenda();
        Atendimento atendimento = buscar(id);
        exigirAgendado(atendimento);
        Long barbeiroId = dados.barbeiroId() == null ? atendimento.barbeiroId() : dados.barbeiroId();
        barbeiros.exigirAtivo(barbeiroId);
        LocalDateTime inicio = dados.dia().atTime(dados.hora());
        LocalDateTime fim = inicio.plus(Duration.between(atendimento.inicio(), atendimento.fim()));
        validarHorario(inicio, fim, id, barbeiroId, atendimento.clienteId());
        validarCorteNoDia(atendimento.clienteId(), dados.dia(), atendimento.servicos(), id);
        agenda.remarcar(id, inicio, fim, barbeiroId);
        return buscar(id);
    }

    @Transactional
    public Atendimento atualizarStatus(long id, Situacao dados) {
        agenda.bloquearAgenda();
        Atendimento atendimento = buscar(id);
        Status status = dados.status();
        if (atendimento.status() == status) return atendimento;
        exigirAgendado(atendimento);
        LocalDateTime agora = HorarioBarbearia.agora();
        if ((status == Status.CONCLUIDO || status == Status.FALTOU) && agora.isBefore(atendimento.inicio())) {
            throw new AgendaException(HttpStatus.CONFLICT, "Esse horário ainda não começou.");
        }

        if (status == Status.CONCLUIDO) {
            Long periodo = agenda.buscarPeriodo(atendimento.clienteId(), atendimento.inicio().toLocalDate());
            if (periodo != null) agenda.bloquearPlanoDoPeriodo(periodo);
            for (Item item : atendimento.servicos()) {
                agenda.registrarItemConcluido(id, item, periodo);
            }
        }

        agenda.mudarStatus(id, status, status == Status.CONCLUIDO ? agora : null);
        Atendimento atualizado = buscar(id);
        if (status == Status.CONCLUIDO && dados.valorAvulsoConfirmado() != null) {
            BigDecimal valor = atualizado.servicos().stream().map(Item::valorCobrado)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (valor.compareTo(dados.valorAvulsoConfirmado()) != 0) {
                throw new AgendaException(HttpStatus.CONFLICT,
                        "O valor mudou desde a consulta. Confira o novo total antes de confirmar.");
            }
        }
        return atualizado;
    }

    private Atendimento buscar(long id) {
        return agenda.buscar(id)
                .orElseThrow(() -> new AgendaException(HttpStatus.NOT_FOUND, "O atendimento não foi encontrado."));
    }

    private List<Item> servicos(List<Long> ids, boolean bloquear) {
        if (ids == null || ids.isEmpty() || ids.stream().distinct().count() != ids.size()) {
            throw new AgendaException(HttpStatus.BAD_REQUEST, "Selecione um ou mais serviços sem repetições.");
        }
        List<Item> encontrados = agenda.buscarServicos(ids.toArray(Long[]::new), bloquear);
        if (encontrados.size() != ids.size()) {
            throw new AgendaException(HttpStatus.BAD_REQUEST, "Escolha serviços ativos do catálogo.");
        }
        return encontrados;
    }

    private static long duracao(List<Item> servicos) {
        return servicos.stream().mapToLong(Item::duracaoMinutos).sum();
    }

    private void validarCorteNoDia(long clienteId, LocalDate dia, List<Item> servicos, long ignorarId) {
        if (servicos.stream().anyMatch(Item::corte) && agenda.temCorteAgendadoNoDia(clienteId, dia, ignorarId)) {
            throw new AgendaException(HttpStatus.CONFLICT, "O cliente já tem um corte agendado nesta data.");
        }
    }

    private void validarHorario(LocalDateTime inicio, LocalDateTime fim, long ignorarId,
                                long barbeiroId, long clienteId) {
        LocalDate dia = inicio.toLocalDate();
        boolean cabe = HorarioBarbearia.expediente(dia).stream().anyMatch(faixa ->
                !inicio.isBefore(dia.atTime(faixa.inicio())) && !fim.isAfter(dia.atTime(faixa.fim())));
        if (inicio.getMinute() % INTERVALO_MINUTOS != 0 || inicio.getSecond() != 0 || inicio.getNano() != 0 || !cabe) {
            throw new AgendaException(HttpStatus.BAD_REQUEST, "Escolha um horário de início de 30 em 30 minutos que caiba no expediente.");
        }
        if (inicio.isBefore(HorarioBarbearia.agora())) {
            throw new AgendaException(HttpStatus.BAD_REQUEST, "Escolha um horário futuro.");
        }
        if (agenda.horarioOcupado(inicio, fim, ignorarId, barbeiroId, clienteId)) {
            throw new AgendaException(HttpStatus.CONFLICT,
                    "O barbeiro ou o cliente já tem um atendimento nesse horário. Escolha outro.");
        }
    }

    private static void exigirAgendado(Atendimento atendimento) {
        if (atendimento.status() != Status.AGENDADO) {
            throw new AgendaException(HttpStatus.CONFLICT, "Somente atendimentos agendados podem ser alterados.");
        }
    }
}
