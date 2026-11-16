package projeto.barbearia.danzerra.servico.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.servico.exception.ServicoEmUsoException;
import projeto.barbearia.danzerra.servico.service.ServicoService;

@RestController
@RequestMapping("/api/apagar_servico")
public class ServicoExclusaoController {

    private final ServicoService servicos;

    public ServicoExclusaoController(ServicoService servicos) {
        this.servicos = servicos;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        servicos.excluir(id);
    }

    @ExceptionHandler(ServicoEmUsoException.class)
    public ProblemDetail tratarServicoEmUso(ServicoEmUsoException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, erro.getMessage());
    }
}
