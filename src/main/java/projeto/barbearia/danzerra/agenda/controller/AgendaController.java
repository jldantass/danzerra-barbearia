package projeto.barbearia.danzerra.agenda.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Atendimento;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Cadastro;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.DetalhesAtendimento;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.PlanejamentoDia;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Remarcacao;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Situacao;
import projeto.barbearia.danzerra.agenda.exception.AgendaException;
import projeto.barbearia.danzerra.agenda.service.AgendaService;

@RestController
@RequestMapping("/api")
public class AgendaController {

    private final AgendaService agenda;

    public AgendaController(AgendaService agenda) {
        this.agenda = agenda;
    }

    @GetMapping("/agendamentos")
    public List<Atendimento> listar(@RequestParam LocalDate dia,
            @RequestParam(defaultValue = "false") boolean semana) {
        return semana ? agenda.listarSemana(dia) : agenda.listar(dia);
    }

    @GetMapping("/agendamentos/{id}")
    public DetalhesAtendimento detalhar(@PathVariable long id) {
        return agenda.detalhar(id);
    }

    @GetMapping("/agendamentos_cliente/{clienteId}")
    public List<Atendimento> listarPorCliente(@PathVariable long clienteId) {
        return agenda.listarPorCliente(clienteId);
    }

    @GetMapping("/planejamento_agenda")
    public PlanejamentoDia planejarDia(@RequestParam LocalDate dia) {
        return agenda.planejarDia(dia);
    }

    @GetMapping("/horarios_agenda")
    public List<LocalTime> horarios(@RequestParam LocalDate dia,
            @RequestParam(required = false) List<Long> servicoIds,
            @RequestParam(required = false) Long atendimentoId) {
        return agenda.horarios(dia, servicoIds, atendimentoId);
    }

    @PostMapping("/cadastrar_agendamento")
    @ResponseStatus(HttpStatus.CREATED)
    public Atendimento cadastrar(@Valid @RequestBody Cadastro dados) {
        return agenda.cadastrar(dados);
    }

    @PutMapping("/atualizar_agendamento/{id}")
    public Atendimento remarcar(@PathVariable long id, @Valid @RequestBody Remarcacao dados) {
        return agenda.remarcar(id, dados);
    }

    @PutMapping("/status_agendamento/{id}")
    public Atendimento status(@PathVariable long id, @Valid @RequestBody Situacao dados) {
        return agenda.atualizarStatus(id, dados.status());
    }

    @ExceptionHandler(AgendaException.class)
    public ProblemDetail erro(AgendaException erro) {
        return ProblemDetail.forStatusAndDetail(erro.getStatus(), erro.getMessage());
    }
}
