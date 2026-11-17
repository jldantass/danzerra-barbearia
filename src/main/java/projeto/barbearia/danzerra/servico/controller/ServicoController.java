package projeto.barbearia.danzerra.servico.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.DeleteMapping;
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

import projeto.barbearia.danzerra.servico.dto.ServicoAtualizacaoRequest;
import projeto.barbearia.danzerra.servico.dto.ServicoCadastroRequest;
import projeto.barbearia.danzerra.servico.dto.ServicoResponse;
import projeto.barbearia.danzerra.servico.exception.ServicoEmUsoException;
import projeto.barbearia.danzerra.servico.service.ServicoService;

@RestController
@RequestMapping("/api")
public class ServicoController {

    private final ServicoService servicos;

    public ServicoController(ServicoService servicos) {
        this.servicos = servicos;
    }

    @PostMapping("/cadastrar_servico")
    @ResponseStatus(HttpStatus.CREATED)
    public ServicoResponse cadastrar(@Valid @RequestBody ServicoCadastroRequest dados) {
        return servicos.cadastrar(dados);
    }

    @GetMapping("/servicos")
    public List<ServicoResponse> listar(@RequestParam(defaultValue = "false") boolean incluirInativos) {
        return servicos.listar(incluirInativos);
    }

    @PutMapping("/atualizar_servico/{id}")
    public ServicoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ServicoAtualizacaoRequest dados) {
        return servicos.atualizar(id, dados);
    }

    @PutMapping("/onoff_servico/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void alternarAtivo(@PathVariable Long id) {
        servicos.alternarAtivo(id);
    }

    @DeleteMapping("/apagar_servico/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        servicos.excluir(id);
    }

    @ExceptionHandler(ServicoEmUsoException.class)
    public ProblemDetail tratarServicoEmUso(ServicoEmUsoException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, erro.getMessage());
    }
}
