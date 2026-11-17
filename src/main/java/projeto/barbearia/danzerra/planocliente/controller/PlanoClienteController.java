package projeto.barbearia.danzerra.planocliente.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.cliente.exception.ClienteNaoEncontradoException;
import projeto.barbearia.danzerra.plano.exception.PlanoNaoEncontradoException;
import projeto.barbearia.danzerra.planocliente.dto.PlanoClienteCadastroRequest;
import projeto.barbearia.danzerra.planocliente.dto.PlanoClientePerfilResponse;
import projeto.barbearia.danzerra.planocliente.exception.PlanoClienteConflitoException;
import projeto.barbearia.danzerra.planocliente.service.PlanoClienteService;

@RestController
@RequestMapping("/api")
public class PlanoClienteController {

    private final PlanoClienteService planosCliente;

    public PlanoClienteController(PlanoClienteService planosCliente) {
        this.planosCliente = planosCliente;
    }

    @GetMapping("/planos_cliente/{clienteId}")
    public PlanoClientePerfilResponse consultar(@PathVariable Long clienteId) {
        return planosCliente.consultar(clienteId);
    }

    @PostMapping("/cadastrar_plano_cliente")
    @ResponseStatus(HttpStatus.CREATED)
    public PlanoClientePerfilResponse cadastrar(@Valid @RequestBody PlanoClienteCadastroRequest dados) {
        return planosCliente.cadastrar(dados);
    }

    @ExceptionHandler(PlanoClienteConflitoException.class)
    public ProblemDetail conflito(PlanoClienteConflitoException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, erro.getMessage());
    }

    @ExceptionHandler({ClienteNaoEncontradoException.class, PlanoNaoEncontradoException.class})
    public ProblemDetail naoEncontrado(RuntimeException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, erro.getMessage());
    }
}
